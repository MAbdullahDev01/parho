from __future__ import annotations

import base64
import hashlib
import hmac
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP

import httpx
from fastapi import HTTPException

from app.core.config import settings


class SafepayService:
    def __init__(self) -> None:
        self.secret_key = getattr(settings, "SAFE_PAY_SECRET_KEY", None)
        self.public_key = getattr(settings, "SAFE_PAY_PUBLIC_KEY", None)
        self.environment = getattr(settings, "SAFE_PAY_ENV", "sandbox")
        self.base_url = "https://sandbox.api.getsafepay.com" if self.environment == "sandbox" else "https://api.getsafepay.com"

    def _require_config(self) -> None:
        if not self.secret_key or not self.public_key:
            raise HTTPException(status_code=503, detail="Safepay is not configured.")

    def _headers(self) -> dict[str, str]:
        self._require_config()
        # Safepay's current API uses the secret key in x-sfpy-api-key.
        return {"x-sfpy-api-key": self.secret_key, "Content-Type": "application/json"}

    @staticmethod
    def _minor_units(amount_pkr: Decimal) -> int:
        return int((amount_pkr * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))

    async def create_checkout(self, *, amount_pkr: Decimal, booking_id: str, success_url: str, cancel_url: str) -> dict:
        amount = self._minor_units(amount_pkr)
        payload = {
            "merchant_api_key": self.public_key,
            "intent": "CYBERSOURCE",
            "mode": "payment",
            "entry_mode": "raw",
            "currency": "PKR",
            "amount": amount,
            "metadata": {"booking_id": booking_id},
            "include_fees": False,
        }
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                session_response = await client.post(f"{self.base_url}/order/payments/v3/", headers=self._headers(), json=payload)
                session_response.raise_for_status()
                tracker = session_response.json()["data"]["tracker"]["token"]
                token_response = await client.post(f"{self.base_url}/client/passport/v1/token", headers=self._headers())
                token_response.raise_for_status()
                auth_token = token_response.json()["data"]
        except (httpx.HTTPError, KeyError, TypeError, ValueError) as exc:
            raise HTTPException(status_code=502, detail="Unable to initialize Safepay checkout.") from exc

        checkout_url = (
            f"{self.base_url}/checkout?tracker={tracker}&tbt={auth_token}&environment={self.environment}"
            f"&source=hosted&redirect_url={httpx.URL(success_url)}&cancel_url={httpx.URL(cancel_url)}"
        )
        return {"tracker": tracker, "checkout_url": checkout_url, "environment": self.environment}

    async def authorize_payment(self, tracker: str) -> dict:
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                response = await client.post(
                    f"{self.base_url}/order/payments/v3/{tracker}",
                    headers=self._headers(),
                    json={"payload": {"authorization": {"do_capture": False}}, "use_action_chaining": False},
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail="Unable to authorize Safepay payment.") from exc

    async def capture_payment(self, tracker: str) -> dict:
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                response = await client.post(f"{self.base_url}/order/payments/v3/{tracker}", headers=self._headers(), json={})
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail="Unable to capture Safepay payment.") from exc

    async def get_payment(self, tracker: str) -> dict:
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                response = await client.get(f"{self.base_url}/reporter/api/v1/payments/{tracker}", headers=self._headers())
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail="Unable to verify Safepay payment.") from exc

    @staticmethod
    def _decode_secret(secret: str) -> list[bytes]:
        """Return accepted key representations used by Safepay endpoint secrets.

        Current Safepay webhook documentation describes a base64-encoded shared
        secret. Some dashboard/API versions have returned the shared secret as
        a plain hexadecimal string, so we support that representation too.
        """
        candidates: list[bytes] = []
        try:
            candidates.append(base64.b64decode(secret, validate=True))
        except Exception:
            pass
        try:
            candidates.append(bytes.fromhex(secret))
        except ValueError:
            pass
        candidates.append(secret.encode("utf-8"))
        return [candidate for candidate in candidates if candidate]

    def verify_webhook(self, raw_body: bytes, signature: str | None, timestamp: str | None) -> bool:
        secret = getattr(settings, "SAFE_PAY_WEBHOOK_SECRET", None)
        if not secret or not signature:
            return False

        # Safepay's current endpoint documentation signs timestamp + '.' + raw
        # body. Timestamp is used when the header is present. We do not reject a
        # request solely because a dashboard test delivery omits it; the HMAC is
        # still required in every case.
        signing_payloads: list[bytes] = []
        if timestamp:
            try:
                parsed = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                if parsed.tzinfo is None:
                    return False
                age = abs((datetime.now(timezone.utc) - parsed).total_seconds())
                if age > 300:
                    return False
            except ValueError:
                return False
            signing_payloads.append(timestamp.encode("utf-8") + b"." + raw_body)
        signing_payloads.append(raw_body)

        provided = signature.strip()
        # Some Safepay webhook versions use `sha256=<hex>`, while older endpoint
        # integrations expose the raw lowercase hex digest. Accept both while
        # always comparing with hmac.compare_digest.
        provided_candidates = [provided]
        if provided.startswith("sha256="):
            provided_candidates.append(provided[len("sha256="):])

        for key in self._decode_secret(secret):
            for payload in signing_payloads:
                digest256 = hmac.new(key, payload, hashlib.sha256).hexdigest()
                expected = f"sha256={digest256}"
                if any(hmac.compare_digest(candidate, expected) or hmac.compare_digest(candidate, digest256) for candidate in provided_candidates):
                    return True

                # Compatibility with Safepay's older webhook implementation.
                digest512 = hmac.new(key, payload, hashlib.sha512).hexdigest()
                if any(hmac.compare_digest(candidate, digest512) for candidate in provided_candidates):
                    return True

        return False


safepay = SafepayService()

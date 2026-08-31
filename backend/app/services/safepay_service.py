from __future__ import annotations

import base64
import hashlib
import hmac
import logging
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP

import httpx
from fastapi import HTTPException

from app.core.config import settings

logger = logging.getLogger(__name__)


class SafepayService:
    def __init__(self) -> None:
        self.secret_key = getattr(settings, "SAFE_PAY_SECRET_KEY", None)
        self.public_key = getattr(settings, "SAFE_PAY_PUBLIC_KEY", None)
        self.webhook_secret = getattr(settings, "SAFE_PAY_WEBHOOK_SECRET", None)
        self.environment = getattr(settings, "SAFE_PAY_ENV", "sandbox")
        self.base_url = "https://sandbox.api.getsafepay.com" if self.environment == "sandbox" else "https://api.getsafepay.com"

    def _require_config(self) -> None:
        if not self.secret_key or not self.public_key:
            raise HTTPException(status_code=503, detail="Safepay is not configured.")

    def _headers(self) -> dict[str, str]:
        self._require_config()
        return {"X-SFPY-MERCHANT-SECRET": self.secret_key, "Content-Type": "application/json"}

    def _passport_headers(self) -> dict[str, str]:
        self._require_config()
        if not self.webhook_secret:
            raise HTTPException(status_code=503, detail="Safepay webhook secret is not configured.")
        return {"X-SFPY-MERCHANT-SECRET": self.webhook_secret, "Content-Type": "application/json"}

    @staticmethod
    def _minor_units(amount_pkr: Decimal) -> int:
        return int((amount_pkr * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))

    @staticmethod
    def _safe_response_body(response: httpx.Response) -> str:
        return response.text.replace("\n", " ").strip()[:1000]

    async def create_checkout(self, *, amount_pkr: Decimal, booking_id: str | None = None, success_url: str, cancel_url: str, metadata: dict | None = None) -> dict:
        amount = self._minor_units(amount_pkr)
        payload = {
            "merchant_api_key": self.public_key,
            "intent": "CYBERSOURCE",
            "mode": "payment",
            "entry_mode": "raw",
            "currency": "PKR",
            "amount": amount,
            "include_fees": False,
        }
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                session_response = await client.post(f"{self.base_url}/order/payments/v3/", headers=self._headers(), json=payload)
                if not session_response.is_success:
                    logger.error("Safepay checkout initialization failed: status=%s body=%s", session_response.status_code, self._safe_response_body(session_response))
                    raise HTTPException(status_code=502, detail=f"Safepay checkout initialization failed ({session_response.status_code}).")
                session_data = session_response.json()
                tracker = session_data["data"]["tracker"]["token"]

                token_response = await client.post(f"{self.base_url}/client/passport/v1/token", headers=self._passport_headers())
                if not token_response.is_success:
                    logger.error("Safepay passport token failed: status=%s body=%s", token_response.status_code, self._safe_response_body(token_response))
                    raise HTTPException(status_code=502, detail=f"Safepay checkout token request failed ({token_response.status_code}).")
                token_data = token_response.json()
                auth_token = token_data.get("data")
                if isinstance(auth_token, dict):
                    auth_token = auth_token.get("token")
                if not auth_token:
                    logger.error("Safepay passport token response did not contain a token: body=%s", self._safe_response_body(token_response))
                    raise HTTPException(status_code=502, detail="Safepay returned an invalid checkout token response.")
        except HTTPException:
            raise
        except (httpx.HTTPError, KeyError, TypeError, ValueError) as exc:
            logger.exception("Safepay checkout initialization raised an exception")
            raise HTTPException(status_code=502, detail="Unable to initialize Safepay checkout. Check the backend logs for the provider response.") from exc

        checkout_url = (
            f"{self.base_url}/checkout?tracker={tracker}&tbt={auth_token}&environment={self.environment}"
            f"&source=hosted&redirect_url={httpx.URL(success_url)}&cancel_url={httpx.URL(cancel_url)}"
        )
        return {"tracker": tracker, "checkout_url": checkout_url, "environment": self.environment}

    async def authorize_payment(self, tracker: str) -> dict:
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                response = await client.post(f"{self.base_url}/order/payments/v3/{tracker}", headers=self._headers(), json={"payload": {"authorization": {"do_capture": False}}, "use_action_chaining": False})
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as exc:
            logger.exception("Safepay authorization failed")
            raise HTTPException(status_code=502, detail="Unable to authorize Safepay payment.") from exc

    async def capture_payment(self, tracker: str) -> dict:
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                response = await client.post(f"{self.base_url}/order/payments/v3/{tracker}", headers=self._headers(), json={})
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as exc:
            logger.exception("Safepay capture failed")
            raise HTTPException(status_code=502, detail="Unable to capture Safepay payment.") from exc

    async def get_payment(self, tracker: str) -> dict:
        try:
            async with httpx.AsyncClient(timeout=20) as client:
                response = await client.get(f"{self.base_url}/reporter/api/v1/payments/{tracker}", headers=self._headers())
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as exc:
            logger.exception("Safepay payment verification failed")
            raise HTTPException(status_code=502, detail="Unable to verify Safepay payment.") from exc

    @staticmethod
    def _decode_secret(secret: str) -> list[bytes]:
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
        signing_payloads: list[bytes] = []
        if timestamp:
            try:
                parsed = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                if parsed.tzinfo is None:
                    return False
                if abs((datetime.now(timezone.utc) - parsed).total_seconds()) > 300:
                    return False
            except ValueError:
                return False
            signing_payloads.append(timestamp.encode("utf-8") + b"." + raw_body)
        signing_payloads.append(raw_body)
        provided = signature.strip()
        candidates = [provided, provided[len("sha256="):] if provided.startswith("sha256=") else provided]
        for key in self._decode_secret(secret):
            for payload in signing_payloads:
                digest = hmac.new(key, payload, hashlib.sha256).hexdigest()
                if any(hmac.compare_digest(c, digest) or hmac.compare_digest(c, f"sha256={digest}") for c in candidates):
                    return True
                digest512 = hmac.new(key, payload, hashlib.sha512).hexdigest()
                if any(hmac.compare_digest(c, digest512) for c in candidates):
                    return True
        return False


safepay = SafepayService()

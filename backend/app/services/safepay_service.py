from __future__ import annotations

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
        return {"Authorization": f"Bearer {self.secret_key}", "Content-Type": "application/json"}

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

    def verify_webhook(self, raw_body: bytes, signature: str | None, timestamp: str | None) -> bool:
        import hashlib
        import hmac
        secret = getattr(settings, "SAFE_PAY_WEBHOOK_SECRET", None)
        if not secret or not signature or not timestamp:
            return False
        expected = hmac.new(secret.encode(), timestamp.encode() + b"." + raw_body, hashlib.sha256).hexdigest()
        return any(hmac.compare_digest(signature, candidate) for candidate in (expected, f"v1={expected}", f"sha256={expected}"))


safepay = SafepayService()

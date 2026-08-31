from decimal import Decimal

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field, HttpUrl

from app.api.dependencies import require_internal_secret
from app.services.safepay_service import safepay

router = APIRouter(prefix="/api/backend/payments", tags=["payments"])


class SafepayCheckoutRequest(BaseModel):
    booking_id: str
    amount_pkr: Decimal = Field(gt=0, decimal_places=2)
    success_url: HttpUrl
    cancel_url: HttpUrl


class SafepayCheckoutResponse(BaseModel):
    tracker: str
    checkout_url: str
    environment: str


@router.post("/safepay/checkout", response_model=SafepayCheckoutResponse)
async def create_safepay_checkout(
    payload: SafepayCheckoutRequest,
    x_internal_secret: str | None = Header(default=None),
):
    require_internal_secret(x_internal_secret)
    return await safepay.create_checkout(
        amount_pkr=payload.amount_pkr,
        booking_id=payload.booking_id,
        success_url=str(payload.success_url),
        cancel_url=str(payload.cancel_url),
    )


@router.get("/safepay/{tracker}")
async def get_safepay_payment(
    tracker: str,
    x_internal_secret: str | None = Header(default=None),
):
    require_internal_secret(x_internal_secret)
    return await safepay.get_payment(tracker)

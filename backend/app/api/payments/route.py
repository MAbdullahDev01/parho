from decimal import Decimal

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, HttpUrl, Field

from app.api.dependencies import require_internal_secret
from app.services.payment_service import create_booking_payment, authorize_booking_payment, capture_booking_payment, create_wallet_deposit
from app.services.safepay_service import safepay

router = APIRouter(prefix="/api/backend/payments", tags=["payments"])


class BookingPaymentRequest(BaseModel):
    booking_id: str
    success_url: HttpUrl
    cancel_url: HttpUrl


class WalletDepositRequest(BaseModel):
    amount: Decimal = Field(gt=0, le=1000000)
    success_url: HttpUrl
    cancel_url: HttpUrl


def _require(secret: str | None) -> None:
    require_internal_secret(secret)


def _user(value: str | None) -> str:
    if not value:
        raise HTTPException(status_code=401, detail="User identity is required.")
    return value


@router.post("/safepay/checkout")
async def create_safepay_checkout(payload: BookingPaymentRequest, x_internal_secret: str | None = Header(default=None), x_user_id: str | None = Header(default=None)):
    _require(x_internal_secret)
    return await create_booking_payment(_user(x_user_id), payload.booking_id, str(payload.success_url), str(payload.cancel_url))


@router.post("/safepay/wallet-deposit")
async def create_safepay_wallet_deposit(payload: WalletDepositRequest, x_internal_secret: str | None = Header(default=None), x_user_id: str | None = Header(default=None)):
    _require(x_internal_secret)
    return await create_wallet_deposit(_user(x_user_id), payload.amount, str(payload.success_url), str(payload.cancel_url))


@router.post("/safepay/{booking_id}/authorize")
async def authorize_safepay_booking(booking_id: str, x_internal_secret: str | None = Header(default=None), x_user_id: str | None = Header(default=None)):
    _require(x_internal_secret)
    return await authorize_booking_payment(_user(x_user_id), booking_id)


@router.post("/safepay/{booking_id}/capture")
async def capture_safepay_booking(booking_id: str, x_internal_secret: str | None = Header(default=None), x_user_id: str | None = Header(default=None)):
    _require(x_internal_secret)
    return await capture_booking_payment(_user(x_user_id), booking_id)


@router.get("/safepay/{tracker}")
async def get_safepay_payment(tracker: str, x_internal_secret: str | None = Header(default=None)):
    _require(x_internal_secret)
    return await safepay.get_payment(tracker)

from fastapi import APIRouter, Header, HTTPException

from app.api.dependencies import require_internal_secret
from app.schemas.wallet import DepositRequest, WalletResponse, WalletTransaction
from app.services.wallet_service import get_wallet, record_deposit, hold_booking_payment, release_booking_payment
from app.db.supabase import get_supabase

router = APIRouter(prefix="/api/backend/wallet", tags=["wallet"])


def _secret(value: str | None):
    require_internal_secret(value)


def _user(value: str | None) -> str:
    if not value:
        raise HTTPException(status_code=401, detail="User identity is required.")
    return value


@router.get("", response_model=WalletResponse)
def wallet(x_internal_secret: str | None = Header(default=None), x_user_id: str | None = Header(default=None)):
    _secret(x_internal_secret)
    account, transactions = get_wallet(_user(x_user_id))
    return WalletResponse(wallet=account, transactions=transactions)


@router.post("/deposit", response_model=WalletTransaction, status_code=201)
def deposit(payload: DepositRequest, x_internal_secret: str | None = Header(default=None), x_user_id: str | None = Header(default=None)):
    _secret(x_internal_secret)
    return record_deposit(_user(x_user_id), payload)


@router.post("/bookings/{booking_id}/hold", response_model=WalletTransaction, status_code=201)
def hold(booking_id: str, amount: float, x_internal_secret: str | None = Header(default=None), x_user_id: str | None = Header(default=None)):
    _secret(x_internal_secret)
    return hold_booking_payment(_user(x_user_id), booking_id, amount)


@router.post("/bookings/{booking_id}/release", response_model=WalletTransaction, status_code=201)
def release(booking_id: str, x_internal_secret: str | None = Header(default=None), x_user_id: str | None = Header(default=None)):
    _secret(x_internal_secret)
    student_id = _user(x_user_id)
    try:
        response = get_supabase().table("bookings").select("student_clerk_id,tutor_clerk_id").eq("id", booking_id).execute()
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Unable to load the booking.") from exc
    booking = response.data[0] if response.data else None
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking["student_clerk_id"] != student_id:
        raise HTTPException(status_code=403, detail="Only the student can release this payment.")
    return release_booking_payment(student_id, booking["tutor_clerk_id"], booking_id)

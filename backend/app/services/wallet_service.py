import logging

from fastapi import HTTPException

from app.db.supabase import get_supabase
from app.schemas.wallet import DepositRequest, WalletAccount, WalletTransaction

logger = logging.getLogger(__name__)


def _wallet(row: dict) -> WalletAccount:
    return WalletAccount(**row)


def _transactions(rows: list[dict]) -> list[WalletTransaction]:
    return [WalletTransaction(**row) for row in rows]


def get_wallet(clerk_id: str) -> tuple[WalletAccount, list[WalletTransaction]]:
    supabase = get_supabase()
    try:
        # Use a normal list query instead of maybe_single(). A wallet read should
        # not fail just because the account has not been created yet. The database
        # migration is responsible for enforcing one account per clerk_id.
        account_response = (
            supabase.table("wallet_accounts")
            .select("clerk_id,currency,available_balance,held_balance")
            .eq("clerk_id", clerk_id)
            .limit(1)
            .execute()
        )
        account = (account_response.data or [None])[0]

        if not account:
            account = {
                "clerk_id": clerk_id,
                "currency": "PKR",
                "available_balance": 0,
                "held_balance": 0,
            }

        transaction_response = (
            supabase.table("wallet_transactions")
            .select(
                "id,clerk_id,amount,type,booking_id,status,provider,"
                "provider_reference,metadata,created_at"
            )
            .eq("clerk_id", clerk_id)
            .order("created_at", desc=True)
            .limit(100)
            .execute()
        )

        rows = transaction_response.data or []
        return _wallet(account), _transactions(rows)
    except HTTPException:
        raise
    except Exception as exc:
        # Keep the client-facing error intentionally generic, but log the actual
        # Supabase/Pydantic failure so local and deployed logs identify the cause.
        logger.exception("Failed to load wallet for clerk_id=%s: %s", clerk_id, exc)
        raise HTTPException(
            status_code=503,
            detail="Unable to load wallet.",
        ) from exc


def record_deposit(clerk_id: str, payload: DepositRequest) -> WalletTransaction:
    try:
        response = get_supabase().rpc("wallet_record_deposit", {
            "p_clerk_id": clerk_id,
            "p_amount": payload.amount,
            "p_provider": payload.provider,
            "p_provider_reference": payload.provider_reference,
            "p_metadata": payload.metadata,
        }).execute()
        if not response.data:
            raise HTTPException(status_code=503, detail="Deposit was not recorded.")
        return WalletTransaction(**response.data[0])
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Unable to record wallet deposit for clerk_id=%s: %s", clerk_id, exc)
        raise HTTPException(status_code=503, detail="Unable to record deposit.") from exc


def hold_booking_payment(student_clerk_id: str, booking_id: str, amount: float) -> WalletTransaction:
    try:
        response = get_supabase().rpc("wallet_hold_booking", {
            "p_student_clerk_id": student_clerk_id,
            "p_booking_id": booking_id,
            "p_amount": amount,
        }).execute()
        if not response.data:
            raise HTTPException(status_code=503, detail="Payment hold was not created.")
        return WalletTransaction(**response.data[0])
    except HTTPException:
        raise
    except Exception as exc:
        message = str(exc)
        for fragment in ("Insufficient wallet balance", "already held", "not eligible"):
            if fragment.lower() in message.lower():
                raise HTTPException(status_code=409, detail=fragment + ".") from exc
        logger.exception("Unable to hold wallet payment for booking_id=%s: %s", booking_id, exc)
        raise HTTPException(status_code=503, detail="Unable to hold booking payment.") from exc


def release_booking_payment(student_clerk_id: str, tutor_clerk_id: str, booking_id: str) -> WalletTransaction:
    try:
        response = get_supabase().rpc("wallet_release_booking", {
            "p_student_clerk_id": student_clerk_id,
            "p_tutor_clerk_id": tutor_clerk_id,
            "p_booking_id": booking_id,
        }).execute()
        if not response.data:
            raise HTTPException(status_code=503, detail="Payment release was not created.")
        return WalletTransaction(**response.data[0])
    except HTTPException:
        raise
    except Exception as exc:
        message = str(exc)
        for fragment in ("No active payment hold", "already been released", "not eligible"):
            if fragment.lower() in message.lower():
                raise HTTPException(status_code=409, detail=fragment + ".") from exc
        logger.exception("Unable to release wallet payment for booking_id=%s: %s", booking_id, exc)
        raise HTTPException(status_code=503, detail="Unable to release booking payment.") from exc

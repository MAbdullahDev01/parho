from fastapi import HTTPException

from app.db.supabase import get_supabase
from app.schemas.wallet import DepositRequest, WalletAccount, WalletTransaction


def _wallet(row: dict) -> WalletAccount:
    return WalletAccount(**row)


def _transactions(rows: list[dict]) -> list[WalletTransaction]:
    return [WalletTransaction(**row) for row in rows]


def get_wallet(clerk_id: str) -> tuple[WalletAccount, list[WalletTransaction]]:
    try:
        supabase = get_supabase()
        account = supabase.table("wallet_accounts").select("clerk_id,currency,available_balance,held_balance").eq("clerk_id", clerk_id).maybe_single().execute().data
        if not account:
            account = {"clerk_id": clerk_id, "currency": "PKR", "available_balance": 0, "held_balance": 0}
        rows = supabase.table("wallet_transactions").select("id,clerk_id,amount,type,booking_id,status,provider,provider_reference,metadata,created_at").eq("clerk_id", clerk_id).order("created_at", desc=True).limit(100).execute().data or []
        return _wallet(account), _transactions(rows)
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Unable to load wallet.") from exc


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
        raise HTTPException(status_code=503, detail="Unable to release booking payment.") from exc

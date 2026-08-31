import os

import stripe
from fastapi import HTTPException

from app.db.supabase import get_supabase
from app.schemas.wallet import Wallet, WalletTransaction

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")


def _require_stripe():
    if not stripe.api_key:
        raise HTTPException(status_code=503, detail="Stripe payments are not configured.")


def get_wallet(clerk_id: str) -> tuple[Wallet, list[WalletTransaction]]:
    try:
        supabase = get_supabase()
        wallet_response = supabase.rpc("get_or_create_wallet", {"p_clerk_id": clerk_id}).execute()
        row = wallet_response.data[0] if isinstance(wallet_response.data, list) else wallet_response.data
        if not row:
            raise HTTPException(status_code=503, detail="Unable to load wallet.")
        transactions_response = (
            supabase.table("wallet_transactions")
            .select("id,clerk_id,amount,type,booking_id,status,stripe_checkout_session_id,created_at")
            .eq("clerk_id", clerk_id)
            .order("created_at", desc=True)
            .limit(100)
            .execute()
        )
        return Wallet(**row), [WalletTransaction(**item) for item in (transactions_response.data or [])]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Unable to load wallet.") from exc


def create_wallet_checkout(clerk_id: str, amount: int, success_url: str, cancel_url: str) -> str:
    _require_stripe()
    if amount < 100_00:
        raise HTTPException(status_code=400, detail="Minimum wallet deposit is PKR 100.")

    try:
        session = stripe.checkout.Session.create(
            mode="payment",
            line_items=[
                {
                    "price_data": {
                        "currency": "pkr",
                        "product_data": {"name": "Parho wallet deposit"},
                        "unit_amount": amount,
                    },
                    "quantity": 1,
                }
            ],
            metadata={"clerk_id": clerk_id, "wallet_amount": str(amount)},
            success_url=success_url,
            cancel_url=cancel_url,
            payment_intent_data={"metadata": {"clerk_id": clerk_id, "wallet_amount": str(amount)}},
        )
        if not session.url:
            raise HTTPException(status_code=503, detail="Stripe did not return a checkout URL.")
        return session.url
    except HTTPException:
        raise
    except stripe.error.StripeError as exc:
        raise HTTPException(status_code=502, detail="Unable to create the payment session.") from exc


def handle_checkout_completed(session: stripe.checkout.Session) -> None:
    metadata = session.get("metadata") or {}
    clerk_id = metadata.get("clerk_id")
    amount = metadata.get("wallet_amount")
    if not clerk_id or not amount:
        raise HTTPException(status_code=400, detail="Stripe session is missing wallet metadata.")

    try:
        get_supabase().rpc(
            "credit_wallet_deposit",
            {
                "p_clerk_id": clerk_id,
                "p_amount": int(amount),
                "p_checkout_session_id": session.id,
            },
        ).execute()
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Unable to credit the wallet deposit.") from exc


def get_demo_deposit_amount(tutor_clerk_id: str) -> int:
    try:
        response = (
            get_supabase()
            .table("tutor_profiles")
            .select("hourly_rate")
            .eq("clerk_id", tutor_clerk_id)
            .limit(1)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Tutor profile not found.")
        hourly_rate = float(response.data[0].get("hourly_rate") or 0)
        if hourly_rate <= 0:
            raise HTTPException(status_code=409, detail="This tutor has not set a session rate yet.")
        # Demo bookings are 30 minutes, so the escrow amount is half the hourly rate.
        return max(1, round(hourly_rate * 100 / 2))
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Unable to determine the session deposit.") from exc


def hold_demo_deposit(student_clerk_id: str, tutor_clerk_id: str, start_at: str):
    amount = get_demo_deposit_amount(tutor_clerk_id)
    try:
        response = get_supabase().rpc(
            "create_demo_booking_with_hold",
            {
                "p_student_clerk_id": student_clerk_id,
                "p_tutor_clerk_id": tutor_clerk_id,
                "p_start_at": start_at,
                "p_amount": amount,
            },
        ).execute()
        if not response.data:
            raise HTTPException(status_code=409, detail="That demo slot is no longer available.")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        message = str(exc)
        known = ("Insufficient wallet balance", "already have a demo", "already has a demo", "slot is no longer available", "not available", "during this time", "must be in the future", "within the next 30 days")
        if any(fragment.lower() in message.lower() for fragment in known):
            raise HTTPException(status_code=409, detail=message) from exc
        raise HTTPException(status_code=503, detail="Unable to create the booking and escrow hold.") from exc


def release_demo_deposit(booking_id: str, student_clerk_id: str, tutor_clerk_id: str):
    try:
        response = get_supabase().rpc(
            "release_booking_escrow",
            {
                "p_booking_id": booking_id,
                "p_student_clerk_id": student_clerk_id,
                "p_tutor_clerk_id": tutor_clerk_id,
            },
        ).execute()
        if not response.data:
            raise HTTPException(status_code=409, detail="Unable to release the escrow.")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        message = str(exc)
        if "No active escrow hold" in message or "Booking not found" in message:
            raise HTTPException(status_code=409, detail=message) from exc
        raise HTTPException(status_code=503, detail="Unable to release the escrow.") from exc

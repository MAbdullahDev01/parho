from __future__ import annotations

from decimal import Decimal

from fastapi import HTTPException

from app.db.supabase import get_supabase
from app.services.safepay_service import safepay


def _booking_with_rate(booking_id: str, student_clerk_id: str) -> dict:
    try:
        supabase = get_supabase()
        booking = (supabase.table("bookings").select("id,student_clerk_id,tutor_clerk_id,status,booking_type,start_at,end_at").eq("id", booking_id).limit(1).execute().data or [None])[0]
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found.")
        if booking["student_clerk_id"] != student_clerk_id:
            raise HTTPException(status_code=403, detail="Only the student can pay for this booking.")
        if booking["status"] != "confirmed":
            raise HTTPException(status_code=409, detail="Only a confirmed booking can be paid for.")
        tutor = (supabase.table("tutor_profiles").select("hourly_rate").eq("clerk_id", booking["tutor_clerk_id"]).limit(1).execute().data or [None])[0]
        if not tutor or Decimal(str(tutor.get("hourly_rate", 0))) <= 0:
            raise HTTPException(status_code=409, detail="This tutor does not have a payable session rate configured.")
        booking["amount_pkr"] = (Decimal(str(tutor["hourly_rate"])) / Decimal("2")).quantize(Decimal("0.01"))
        return booking
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Unable to prepare the booking payment.") from exc


async def create_booking_payment(student_clerk_id: str, booking_id: str, success_url: str, cancel_url: str) -> dict:
    booking = _booking_with_rate(booking_id, student_clerk_id)
    try:
        existing = get_supabase().table("payment_intents").select("*").eq("booking_id", booking_id).in_("status", ["created", "pending", "authorized"]).order("created_at", desc=True).limit(1).execute().data or []
        if existing:
            return {"payment_intent": existing[0], "checkout_url": None, "reused": True}
        checkout = await safepay.create_checkout(amount_pkr=booking["amount_pkr"], booking_id=booking_id, success_url=success_url, cancel_url=cancel_url)
        response = get_supabase().table("payment_intents").insert({"booking_id": booking_id, "student_clerk_id": booking["student_clerk_id"], "tutor_clerk_id": booking["tutor_clerk_id"], "provider": "safepay", "provider_tracker": checkout["tracker"], "amount": float(booking["amount_pkr"]), "currency": "PKR", "status": "pending", "metadata": {"booking_id": booking_id}}).execute()
        return {"payment_intent": response.data[0], "checkout_url": checkout["checkout_url"], "reused": False}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Unable to create the booking payment.") from exc


async def create_wallet_deposit(student_clerk_id: str, amount_pkr: Decimal, success_url: str, cancel_url: str) -> dict:
    if amount_pkr <= 0 or amount_pkr > Decimal("1000000"):
        raise HTTPException(status_code=422, detail="Deposit amount must be between PKR 1 and PKR 1,000,000.")
    try:
        checkout = await safepay.create_checkout(amount_pkr=amount_pkr, booking_id=None, success_url=success_url, cancel_url=cancel_url, metadata={"wallet_deposit": True, "student_clerk_id": student_clerk_id})
        response = get_supabase().table("payment_intents").insert({"booking_id": None, "student_clerk_id": student_clerk_id, "tutor_clerk_id": None, "provider": "safepay", "provider_tracker": checkout["tracker"], "amount": float(amount_pkr), "currency": "PKR", "status": "pending", "metadata": {"wallet_deposit": True}}).execute()
        return {"payment_intent": response.data[0], "checkout_url": checkout["checkout_url"], "reused": False}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Unable to create the wallet deposit.") from exc


async def authorize_booking_payment(student_clerk_id: str, booking_id: str) -> dict:
    try:
        response = get_supabase().table("payment_intents").select("*").eq("booking_id", booking_id).eq("student_clerk_id", student_clerk_id).order("created_at", desc=True).limit(1).execute()
        intent = response.data[0] if response.data else None
        if not intent:
            raise HTTPException(status_code=404, detail="Payment intent not found.")
        if intent["status"] in ("authorized", "captured"):
            return intent
        result = await safepay.authorize_payment(intent["provider_tracker"])
        updated = get_supabase().table("payment_intents").update({"status": "authorized", "metadata": {**(intent.get("metadata") or {}), "authorization": result}}).eq("id", intent["id"]).select("*").execute()
        return updated.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Unable to authorize the Safepay payment.") from exc


async def capture_booking_payment(student_clerk_id: str, booking_id: str) -> dict:
    try:
        response = get_supabase().table("payment_intents").select("*").eq("booking_id", booking_id).eq("student_clerk_id", student_clerk_id).order("created_at", desc=True).limit(1).execute()
        intent = response.data[0] if response.data else None
        if not intent:
            raise HTTPException(status_code=404, detail="Payment intent not found.")
        if intent["status"] == "captured":
            return intent
        if intent["status"] != "authorized":
            raise HTTPException(status_code=409, detail="Payment must be authorized before capture.")
        result = await safepay.capture_payment(intent["provider_tracker"])
        updated = get_supabase().table("payment_intents").update({"status": "captured", "metadata": {**(intent.get("metadata") or {}), "capture": result}}).eq("id", intent["id"]).select("*").execute()
        return updated.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Unable to capture the Safepay payment.") from exc

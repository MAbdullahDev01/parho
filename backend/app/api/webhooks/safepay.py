from fastapi import APIRouter, Header, HTTPException, Request, status

from app.db.supabase import get_supabase
from app.services.safepay_service import safepay

router = APIRouter()


@router.post("/safepay", status_code=status.HTTP_200_OK)
async def handle_safepay_webhook(
    request: Request,
    x_sfpy_signature: str | None = Header(default=None),
    x_sfpy_timestamp: str | None = Header(default=None),
):
    raw_body = await request.body()
    if not safepay.verify_webhook(raw_body, x_sfpy_signature, x_sfpy_timestamp):
        raise HTTPException(status_code=401, detail="Invalid Safepay webhook signature.")

    try:
        event = await request.json()
        event_type = event.get("type") or event.get("event")
        data = event.get("data") or event.get("payload") or {}
        tracker = (
            data.get("tracker", {}).get("token")
            if isinstance(data.get("tracker"), dict)
            else data.get("tracker")
        ) or data.get("tracker_token")
        if not tracker:
            return {"status": "ignored", "reason": "missing_tracker"}

        supabase = get_supabase()
        intents = supabase.table("payment_intents").select("*").eq("provider", "safepay").eq("provider_tracker", tracker).limit(1).execute().data or []
        if not intents:
            return {"status": "ignored", "reason": "unknown_tracker"}
        intent = intents[0]

        if event_type in ("payment.authorized", "payment_authorized"):
            if intent["status"] not in ("captured", "authorized"):
                supabase.table("payment_intents").update({"status": "authorized", "metadata": {**(intent.get("metadata") or {}), "last_webhook": event}}).eq("id", intent["id"]).execute()
        elif event_type in ("payment.succeeded", "payment.completed", "payment.completed"):
            if intent["status"] != "captured":
                supabase.table("payment_intents").update({"status": "captured", "metadata": {**(intent.get("metadata") or {}), "last_webhook": event}}).eq("id", intent["id"]).execute()
                # The webhook is the authoritative confirmation that captured funds
                # reached the merchant-side payment flow. Record the ledger deposit
                # exactly once using the unique provider reference.
                existing = supabase.table("wallet_transactions").select("id").eq("provider", "safepay").eq("provider_reference", tracker).limit(1).execute().data or []
                if not existing:
                    supabase.rpc("wallet_record_deposit", {
                        "p_clerk_id": intent["student_clerk_id"],
                        "p_amount": intent["amount"],
                        "p_provider": "safepay",
                        "p_provider_reference": tracker,
                        "p_metadata": {"booking_id": intent["booking_id"], "payment_intent_id": intent["id"]},
                    }).execute()
        elif event_type in ("payment.failed", "payment.rejected", "payment.refunded", "payment.reversed", "payment.voided"):
            status_map = {
                "payment.failed": "failed",
                "payment.rejected": "failed",
                "payment.refunded": "cancelled",
                "payment.reversed": "cancelled",
                "payment.voided": "cancelled",
            }
            supabase.table("payment_intents").update({"status": status_map[event_type], "metadata": {**(intent.get("metadata") or {}), "last_webhook": event}}).eq("id", intent["id"]).execute()

        return {"status": "received", "type": event_type, "tracker": tracker}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Unable to process Safepay webhook.") from exc

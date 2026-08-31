from fastapi import APIRouter, Header, HTTPException, Request, status

from app.db.supabase import get_supabase
from app.services.safepay_service import safepay

router = APIRouter()


@router.post("/safepay", status_code=status.HTTP_200_OK)
async def handle_safepay_webhook(
    request: Request,
    x_sfpy_signature: str | None = Header(default=None),
    x_sfpy_timestamp: str | None = Header(default=None),
    x_sfpy_event_type: str | None = Header(default=None),
    x_sfpy_event_id: str | None = Header(default=None),
):
    raw_body = await request.body()
    if not safepay.verify_webhook(raw_body, x_sfpy_signature, x_sfpy_timestamp):
        raise HTTPException(status_code=401, detail="Invalid Safepay webhook signature.")

    try:
        event = await request.json()
        event_type = x_sfpy_event_type or event.get("type") or event.get("event")
        data = event.get("data") or event.get("payload") or {}
        if not isinstance(data, dict):
            data = {}

        tracker_data = data.get("tracker")
        tracker = (
            tracker_data.get("token") if isinstance(tracker_data, dict) else tracker_data
        ) or data.get("tracker_token") or data.get("trackerId")

        if not tracker:
            return {"status": "ignored", "reason": "missing_tracker"}

        supabase = get_supabase()
        intents = (
            supabase.table("payment_intents")
            .select("*")
            .eq("provider", "safepay")
            .eq("provider_tracker", tracker)
            .limit(1)
            .execute()
            .data
            or []
        )
        if not intents:
            # A test event or a webhook for a payment created outside Parho is
            # validly signed but must not mutate our ledger.
            return {"status": "ignored", "reason": "unknown_tracker"}

        intent = intents[0]
        metadata = {**(intent.get("metadata") or {}), "last_webhook": event}
        if x_sfpy_event_id:
            metadata["last_webhook_event_id"] = x_sfpy_event_id

        if event_type == "authorization.succeeded":
            if intent["status"] in ("created", "pending"):
                supabase.table("payment_intents").update({"status": "authorized", "metadata": metadata}).eq("id", intent["id"]).execute()

        elif event_type == "authorization.reversed":
            if intent["status"] not in ("captured", "cancelled"):
                supabase.table("payment_intents").update({"status": "cancelled", "metadata": metadata}).eq("id", intent["id"]).execute()

        elif event_type == "payment.succeeded":
            if intent["status"] != "captured":
                supabase.table("payment_intents").update({"status": "captured", "metadata": metadata}).eq("id", intent["id"]).execute()

            # The transaction table has a unique provider/reference constraint,
            # so retries cannot credit the same tracker twice.
            existing = (
                supabase.table("wallet_transactions")
                .select("id")
                .eq("provider", "safepay")
                .eq("provider_reference", tracker)
                .limit(1)
                .execute()
                .data
                or []
            )
            if not existing:
                supabase.rpc("wallet_record_deposit", {
                    "p_clerk_id": intent["student_clerk_id"],
                    "p_amount": intent["amount"],
                    "p_provider": "safepay",
                    "p_provider_reference": tracker,
                    "p_metadata": {"booking_id": intent["booking_id"], "payment_intent_id": intent["id"]},
                }).execute()

        elif event_type == "payment.failed":
            if intent["status"] not in ("captured", "cancelled"):
                supabase.table("payment_intents").update({"status": "failed", "metadata": metadata}).eq("id", intent["id"]).execute()

        elif event_type == "payment.disputed":
            supabase.table("payment_intents").update({"status": "disputed", "metadata": metadata}).eq("id", intent["id"]).execute()

        elif event_type in ("payment.dispute.won", "payment.dispute.lost"):
            # Keep the intent disputed until an explicit admin decision is made.
            supabase.table("payment_intents").update({"status": "disputed", "metadata": {**metadata, "dispute_outcome": event_type}}).eq("id", intent["id"]).execute()

        elif event_type == "void.succeeded":
            if intent["status"] not in ("captured", "cancelled"):
                supabase.table("payment_intents").update({"status": "cancelled", "metadata": metadata}).eq("id", intent["id"]).execute()

        elif event_type == "payment.refunded":
            # Refund handling is intentionally not part of Phase 4. Preserve the
            # event for audit without creating an automatic wallet reversal.
            supabase.table("payment_intents").update({"metadata": {**metadata, "refund_received": True}}).eq("id", intent["id"]).execute()

        return {"status": "received", "type": event_type, "tracker": tracker}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Unable to process Safepay webhook.") from exc

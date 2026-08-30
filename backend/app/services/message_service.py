from datetime import datetime, timezone

from fastapi import HTTPException

from app.db.supabase import get_supabase
from app.schemas.message import Message, MessageCreateRequest


ACTIVE_BOOKING_STATUSES = ["confirmed", "completed"]


def _message(row: dict) -> Message:
    return Message(**row)


def _get_booking_for_participant(booking_id: str, clerk_id: str) -> dict:
    try:
        response = (
            get_supabase()
            .table("bookings")
            .select("id,student_clerk_id,tutor_clerk_id,status,start_at,end_at")
            .eq("id", booking_id)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Unable to load the booking.") from exc

    booking = response.data[0] if response.data else None
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if clerk_id not in (booking["student_clerk_id"], booking["tutor_clerk_id"]):
        raise HTTPException(status_code=403, detail="You are not a participant in this booking.")
    if booking["status"] not in ACTIVE_BOOKING_STATUSES:
        raise HTTPException(status_code=409, detail="Messaging is unavailable for this booking.")
    return booking


def list_messages(booking_id: str, clerk_id: str) -> list[Message]:
    _get_booking_for_participant(booking_id, clerk_id)
    try:
        response = (
            get_supabase()
            .table("messages")
            .select("id,clerk_id_from,clerk_id_to,booking_id,content,created_at,read_at")
            .eq("booking_id", booking_id)
            .order("created_at", desc=False)
            .order("id", desc=False)
            .execute()
        )
        return [_message(row) for row in (response.data or [])]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Unable to load messages.") from exc


def send_message(booking_id: str, sender_clerk_id: str, payload: MessageCreateRequest) -> Message:
    booking = _get_booking_for_participant(booking_id, sender_clerk_id)
    recipient = (
        booking["tutor_clerk_id"]
        if sender_clerk_id == booking["student_clerk_id"]
        else booking["student_clerk_id"]
    )
    content = payload.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        response = (
            get_supabase()
            .table("messages")
            .insert(
                {
                    "clerk_id_from": sender_clerk_id,
                    "clerk_id_to": recipient,
                    "booking_id": booking_id,
                    "content": content,
                }
            )
            .select("id,clerk_id_from,clerk_id_to,booking_id,content,created_at,read_at")
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=503, detail="Message was not created.")
        return _message(response.data[0])
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Unable to send message.") from exc


def mark_messages_read(booking_id: str, clerk_id: str) -> int:
    _get_booking_for_participant(booking_id, clerk_id)
    try:
        response = (
            get_supabase()
            .table("messages")
            .update({"read_at": datetime.now(timezone.utc).isoformat()})
            .eq("booking_id", booking_id)
            .eq("clerk_id_to", clerk_id)
            .is_("read_at", "null")
            .execute()
        )
        return len(response.data or [])
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Unable to mark messages as read.") from exc


def complete_booking(booking_id: str, tutor_clerk_id: str) -> dict:
    try:
        response = (
            get_supabase()
            .table("bookings")
            .select("*")
            .eq("id", booking_id)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Unable to load the booking.") from exc

    booking = response.data[0] if response.data else None
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found.")
    if booking["tutor_clerk_id"] != tutor_clerk_id:
        raise HTTPException(status_code=403, detail="Only the tutor can complete this booking.")
    if booking["status"] != "confirmed":
        raise HTTPException(status_code=409, detail="Only a confirmed booking can be completed.")

    end_at = datetime.fromisoformat(booking["end_at"].replace("Z", "+00:00"))
    if end_at > datetime.now(timezone.utc):
        raise HTTPException(status_code=409, detail="The demo cannot be completed before its scheduled end time.")

    try:
        updated = (
            get_supabase()
            .table("bookings")
            .update({"status": "completed"})
            .eq("id", booking_id)
            .eq("tutor_clerk_id", tutor_clerk_id)
            .eq("status", "confirmed")
            .select("*")
            .execute()
        )
        if not updated.data:
            raise HTTPException(status_code=409, detail="The booking could not be completed.")
        return updated.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Unable to complete the booking.") from exc

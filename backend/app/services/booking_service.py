from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from fastapi import HTTPException, status

from app.db.supabase import get_supabase
from app.schemas.booking import (
    AvailabilityUpdateRequest,
    AvailableSlot,
    AvailabilityWindow,
    Booking,
    BookingCreateRequest,
)

ACTIVE_STATUSES = ["confirmed", "completed"]


def _booking(row: dict) -> Booking:
    return Booking(**row)


def _window_slots(day: date, start: time, end: time, timezone: str):
    tz = ZoneInfo(timezone)
    cursor = datetime.combine(day, start, tzinfo=tz)
    finish = datetime.combine(day, end, tzinfo=tz)
    while cursor + timedelta(minutes=30) <= finish:
        yield cursor, cursor + timedelta(minutes=30)
        cursor += timedelta(minutes=30)


def get_tutor_availability_windows(tutor_clerk_id: str) -> list[AvailabilityWindow]:
    try:
        response = (
            get_supabase().table("tutor_availability")
            .select("id,tutor_clerk_id,day_of_week,start_time,end_time,timezone")
            .eq("tutor_clerk_id", tutor_clerk_id)
            .order("day_of_week")
            .order("start_time")
            .execute()
        )
        return [AvailabilityWindow(**row) for row in (response.data or [])]
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Unable to load tutor availability.") from exc


def get_tutor_availability(tutor_clerk_id: str, target_date: date) -> list[AvailableSlot]:
    try:
        supabase = get_supabase()
        weekday = target_date.weekday()
        windows_response = (
            supabase.table("tutor_availability")
            .select("day_of_week,start_time,end_time,timezone")
            .eq("tutor_clerk_id", tutor_clerk_id)
            .eq("day_of_week", weekday)
            .execute()
        )
        bookings_response = (
            supabase.table("bookings")
            .select("start_at,end_at")
            .eq("tutor_clerk_id", tutor_clerk_id)
            .in_("status", ACTIVE_STATUSES)
            .gte("start_at", datetime.combine(target_date, time.min).isoformat())
            .lt("start_at", datetime.combine(target_date + timedelta(days=1), time.min).isoformat())
            .execute()
        )
        booked = [
            (datetime.fromisoformat(row["start_at"].replace("Z", "+00:00")),
             datetime.fromisoformat(row["end_at"].replace("Z", "+00:00")))
            for row in (bookings_response.data or [])
        ]

        now_utc = datetime.now(ZoneInfo("UTC"))
        slots: list[AvailableSlot] = []
        for window in windows_response.data or []:
            for local_start, local_end in _window_slots(
                target_date,
                time.fromisoformat(window["start_time"]),
                time.fromisoformat(window["end_time"]),
                window.get("timezone") or "Asia/Karachi",
            ):
                start_at = local_start.astimezone(ZoneInfo("UTC"))
                end_at = local_end.astimezone(ZoneInfo("UTC"))
                if start_at <= now_utc:
                    continue
                if any(start_at < booked_end and end_at > booked_start for booked_start, booked_end in booked):
                    continue
                slots.append(AvailableSlot(start_at=start_at, end_at=end_at))
        return slots
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Unable to load tutor availability.") from exc


def set_tutor_availability(tutor_clerk_id: str, payload: AvailabilityUpdateRequest):
    for window in payload.windows:
        if window.start_time >= window.end_time:
            raise HTTPException(status_code=400, detail="Availability start time must be before end time.")
        try:
            ZoneInfo(window.timezone)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Invalid timezone: {window.timezone}") from exc

    try:
        supabase = get_supabase()
        supabase.table("tutor_availability").delete().eq("tutor_clerk_id", tutor_clerk_id).execute()
        if payload.windows:
            rows = [
                {
                    "tutor_clerk_id": tutor_clerk_id,
                    "day_of_week": window.day_of_week,
                    "start_time": window.start_time.isoformat(),
                    "end_time": window.end_time.isoformat(),
                    "timezone": window.timezone,
                }
                for window in payload.windows
            ]
            supabase.table("tutor_availability").insert(rows).execute()
        return get_tutor_availability_windows(tutor_clerk_id)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Unable to save tutor availability.") from exc


def create_demo_booking(student_clerk_id: str, payload: BookingCreateRequest) -> Booking:
    if payload.tutor_clerk_id == student_clerk_id:
        raise HTTPException(status_code=400, detail="You cannot book a demo with yourself.")
    if payload.start_at.tzinfo is None:
        raise HTTPException(status_code=400, detail="Booking time must include a timezone.")

    try:
        response = get_supabase().rpc(
            "create_demo_booking",
            {
                "p_student_clerk_id": student_clerk_id,
                "p_tutor_clerk_id": payload.tutor_clerk_id,
                "p_start_at": payload.start_at.isoformat(),
            },
        ).execute()
        if not response.data:
            raise HTTPException(status_code=409, detail="That demo slot is no longer available.")
        row = response.data[0] if isinstance(response.data, list) else response.data
        return _booking(row)
    except HTTPException:
        raise
    except Exception as exc:
        message = str(exc)
        if any(fragment in message for fragment in ("already has a demo", "slot is no longer available", "not available", "Booking time must", "during this time")):
            raise HTTPException(status_code=409, detail=message) from exc
        raise HTTPException(status_code=503, detail="Unable to create the demo booking.") from exc


def list_student_bookings(student_clerk_id: str) -> list[Booking]:
    try:
        response = (
            get_supabase().table("bookings").select("*")
            .eq("student_clerk_id", student_clerk_id)
            .order("start_at", desc=False)
            .execute()
        )
        return [_booking(row) for row in (response.data or [])]
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Unable to load your bookings.") from exc


def list_tutor_bookings(tutor_clerk_id: str) -> list[Booking]:
    try:
        response = (
            get_supabase().table("bookings").select("*")
            .eq("tutor_clerk_id", tutor_clerk_id)
            .order("start_at", desc=False)
            .execute()
        )
        return [_booking(row) for row in (response.data or [])]
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Unable to load tutor bookings.") from exc

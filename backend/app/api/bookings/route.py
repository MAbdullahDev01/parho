from datetime import date

from fastapi import APIRouter, Header, HTTPException

from app.api.dependencies import require_internal_secret
from app.schemas.booking import (
    AvailabilityResponse,
    AvailabilityUpdateRequest,
    AvailabilityWindow,
    Booking,
    BookingCreateRequest,
    BookingListResponse,
)
from app.services.booking_service import (
    create_demo_booking,
    get_tutor_availability,
    get_tutor_availability_windows,
    list_student_bookings,
    list_tutor_bookings,
    set_tutor_availability,
)
from app.services.message_service import complete_booking

router = APIRouter(prefix="/api/backend/bookings", tags=["bookings"])


def _require_secret(x_internal_secret: str | None):
    require_internal_secret(x_internal_secret)


def _require_user(x_user_id: str | None) -> str:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="User identity is required.")
    return x_user_id


@router.get("/tutors/{clerk_id}/availability/windows", response_model=list[AvailabilityWindow])
def tutor_availability_windows(
    clerk_id: str,
    x_internal_secret: str | None = Header(default=None),
):
    _require_secret(x_internal_secret)
    return get_tutor_availability_windows(clerk_id)


@router.get("/tutors/{clerk_id}/availability", response_model=AvailabilityResponse)
def tutor_availability(
    clerk_id: str,
    target_date: date,
    x_internal_secret: str | None = Header(default=None),
):
    _require_secret(x_internal_secret)
    return AvailabilityResponse(date=target_date, slots=get_tutor_availability(clerk_id, target_date))


@router.put("/tutors/{clerk_id}/availability")
def update_tutor_availability(
    clerk_id: str,
    payload: AvailabilityUpdateRequest,
    x_internal_secret: str | None = Header(default=None),
    x_user_id: str | None = Header(default=None),
):
    _require_secret(x_internal_secret)
    if x_user_id != clerk_id:
        raise HTTPException(status_code=403, detail="You can only manage your own availability.")
    return set_tutor_availability(clerk_id, payload)


@router.post("", response_model=Booking, status_code=201)
def book_demo(
    payload: BookingCreateRequest,
    x_internal_secret: str | None = Header(default=None),
    x_user_id: str | None = Header(default=None),
):
    _require_secret(x_internal_secret)
    return create_demo_booking(_require_user(x_user_id), payload)


@router.get("/student", response_model=BookingListResponse)
def student_bookings(
    x_internal_secret: str | None = Header(default=None),
    x_user_id: str | None = Header(default=None),
):
    _require_secret(x_internal_secret)
    return BookingListResponse(bookings=list_student_bookings(_require_user(x_user_id)))


@router.get("/tutor", response_model=BookingListResponse)
def tutor_bookings(
    x_internal_secret: str | None = Header(default=None),
    x_user_id: str | None = Header(default=None),
):
    _require_secret(x_internal_secret)
    return BookingListResponse(bookings=list_tutor_bookings(_require_user(x_user_id)))


@router.post("/{booking_id}/complete", response_model=Booking)
def complete_demo(
    booking_id: str,
    x_internal_secret: str | None = Header(default=None),
    x_user_id: str | None = Header(default=None),
):
    _require_secret(x_internal_secret)
    return complete_booking(booking_id, _require_user(x_user_id))

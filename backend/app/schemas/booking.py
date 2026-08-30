from datetime import date, datetime, time
from typing import Literal

from pydantic import BaseModel, Field


BookingStatus = Literal["pending", "confirmed", "cancelled", "completed", "no_show"]
BookingType = Literal["demo"]


class AvailabilityWindow(BaseModel):
    id: str | None = None
    tutor_clerk_id: str
    day_of_week: int = Field(ge=0, le=6)
    start_time: time
    end_time: time
    timezone: str = "Asia/Karachi"


class AvailabilityWindowInput(BaseModel):
    day_of_week: int = Field(ge=0, le=6)
    start_time: time
    end_time: time
    timezone: str = "Asia/Karachi"


class AvailableSlot(BaseModel):
    start_at: datetime
    end_at: datetime


class BookingCreateRequest(BaseModel):
    tutor_clerk_id: str
    start_at: datetime
    duration_minutes: int = Field(default=30, ge=30, le=30)
    booking_type: BookingType = "demo"


class Booking(BaseModel):
    id: str
    student_clerk_id: str
    tutor_clerk_id: str
    booking_type: BookingType
    status: BookingStatus
    start_at: datetime
    end_at: datetime
    created_at: datetime
    updated_at: datetime


class BookingListResponse(BaseModel):
    bookings: list[Booking]


class AvailabilityResponse(BaseModel):
    date: date
    slots: list[AvailableSlot]


class AvailabilityUpdateRequest(BaseModel):
    windows: list[AvailabilityWindowInput]

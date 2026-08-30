from __future__ import annotations

from typing import Any

from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


# Database errors that represent a user/action problem rather than an outage.
_CONFLICT_CODES = {
    "23505",  # unique_violation
    "23503",  # foreign_key_violation
    "23514",  # check_violation
    "23P01",  # exclusion_violation
    "P0001",  # raise_exception used by database functions
}

_BAD_REQUEST_CODES = {
    "22P02",  # invalid_text_representation
    "22007",  # invalid_datetime_format
    "22008",  # datetime_field_overflow
}

_GENERIC_SERVICE_MESSAGES = {
    "Internal server error.",
    "Unable to create the demo booking.",
    "Unable to save your tutor profile right now. Please try again.",
    "Unable to load the tutor profile right now.",
    "Unable to load the tutor verification queue.",
    "Unable to load the tutor verification record.",
    "Unable to save the verification decision.",
    "Unable to create secure transcript links.",
    "Unable to search tutors right now. Please try again.",
    "Unable to load this tutor right now.",
    "Unable to load the booking.",
    "Unable to load messages.",
    "Unable to send message.",
    "Unable to mark messages as read.",
    "Unable to complete the booking.",
}


def _api_error_payload(exc: BaseException) -> dict[str, Any] | None:
    """Extract the structured payload used by Supabase/PostgREST errors."""
    args = getattr(exc, "args", None)
    if not args:
        return None

    first = args[0]
    return first if isinstance(first, dict) else None


def _friendly_database_error(exc: BaseException) -> tuple[int, str] | None:
    payload = _api_error_payload(exc)
    if not payload:
        return None

    message = str(payload.get("message") or "").strip()
    code = str(payload.get("code") or "").strip()

    if not message:
        return None

    # P0001 is used by our database functions for deliberate business-rule
    # errors such as duplicate demos or unavailable slots.
    if code == "P0001":
        return 409, message

    if code in _BAD_REQUEST_CODES:
        return 400, "The request contains invalid data. Please check your input and try again."

    if code in _CONFLICT_CODES:
        lower = message.lower()
        if "duplicate" in lower or "already exists" in lower or "unique" in lower:
            return 409, "This record already exists. Please check your existing records and try again."
        if "foreign key" in lower:
            return 409, "This action cannot be completed because the related record is unavailable."
        if "check constraint" in lower:
            return 400, "The provided data does not meet the requirements. Please check your input."
        return 409, message

    # Only return arbitrary database messages when they look intentionally
    # user-facing. Avoid leaking SQL, table names, or infrastructure details.
    safe_phrases = (
        "already have",
        "already has",
        "already booked",
        "no longer available",
        "not available",
        "outside",
        "cannot be",
        "can't be",
        "must be",
        "required",
    )
    if any(phrase in message.lower() for phrase in safe_phrases):
        return 409, message

    return None


def _resolve_http_error(exc: HTTPException) -> tuple[int, str]:
    detail = exc.detail
    if isinstance(detail, str) and detail and detail not in _GENERIC_SERVICE_MESSAGES:
        return exc.status_code, detail

    cause = exc.__cause__
    if cause:
        resolved = _friendly_database_error(cause)
        if resolved:
            return resolved

    return exc.status_code, str(detail) if detail else "An unexpected error occurred. Please try again."


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    status_code, detail = _resolve_http_error(exc)
    return JSONResponse(status_code=status_code, content={"detail": detail})


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    errors = exc.errors()
    first = errors[0] if errors else None
    if first:
        location = first.get("loc") or []
        field = next((str(item) for item in reversed(location) if item != "body"), "field")
        message = str(first.get("msg") or "Invalid value.")
        detail = f"Please check {field}: {message}."
    else:
        detail = "Please check the submitted information and try again."

    return JSONResponse(status_code=422, content={"detail": detail})

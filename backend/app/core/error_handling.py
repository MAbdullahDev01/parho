from __future__ import annotations

from typing import Any

from fastapi import HTTPException, Request
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


def _api_error_payload(exc: BaseException) -> dict[str, Any] | None:
    """Extract the structured payload used by Supabase/PostgREST errors."""
    payload = getattr(exc, "args", None)
    if not payload:
        return None

    first = payload[0]
    return first if isinstance(first, dict) else None


def _friendly_database_error(exc: BaseException) -> tuple[int, str] | None:
    payload = _api_error_payload(exc)
    if not payload:
        return None

    message = str(payload.get("message") or "").strip()
    code = str(payload.get("code") or "").strip()

    if not message:
        return None

    # Messages raised deliberately by Parho's database functions are already
    # written for users. Preserve them instead of replacing them with a generic
    # service-unavailable response.
    if code == "P0001":
        return 409, message

    if code in _BAD_REQUEST_CODES:
        return 400, "The request contains invalid data. Please check your input and try again."

    if code in _CONFLICT_CODES:
        # Keep common database messages useful without exposing SQL internals.
        lower = message.lower()
        if "duplicate" in lower or "already exists" in lower or "unique" in lower:
            return 409, "This record already exists. Please check your existing records and try again."
        if "foreign key" in lower or "violates" in lower:
            return 409, "This action cannot be completed because the related record is unavailable."
        if "check constraint" in lower:
            return 400, "The provided data does not meet the requirements. Please check your input."
        return 409, message

    # Only return arbitrary database messages when they look intentionally
    # user-facing. Avoid leaking table names, SQL, or infrastructure details.
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
    if isinstance(detail, str) and detail and detail != "Internal server error.":
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

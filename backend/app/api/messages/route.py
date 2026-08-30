from fastapi import APIRouter, Header, HTTPException

from app.api.dependencies import require_internal_secret
from app.schemas.message import Message, MessageCreateRequest, MessageListResponse
from app.services.message_service import complete_booking, list_messages, mark_messages_read, send_message

router = APIRouter(prefix="/api/backend/messages", tags=["messages"])


def _require_secret(x_internal_secret: str | None):
    require_internal_secret(x_internal_secret)


def _require_user(x_user_id: str | None) -> str:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="User identity is required.")
    return x_user_id


@router.get("/{booking_id}", response_model=MessageListResponse)
def get_booking_messages(
    booking_id: str,
    x_internal_secret: str | None = Header(default=None),
    x_user_id: str | None = Header(default=None),
):
    _require_secret(x_internal_secret)
    return MessageListResponse(messages=list_messages(booking_id, _require_user(x_user_id)))


@router.post("/{booking_id}", response_model=Message, status_code=201)
def post_booking_message(
    booking_id: str,
    payload: MessageCreateRequest,
    x_internal_secret: str | None = Header(default=None),
    x_user_id: str | None = Header(default=None),
):
    _require_secret(x_internal_secret)
    return send_message(booking_id, _require_user(x_user_id), payload)


@router.post("/{booking_id}/read", status_code=204)
def read_booking_messages(
    booking_id: str,
    x_internal_secret: str | None = Header(default=None),
    x_user_id: str | None = Header(default=None),
):
    _require_secret(x_internal_secret)
    mark_messages_read(booking_id, _require_user(x_user_id))
    return None


@router.post("/{booking_id}/complete", response_model=Message | None)
def complete_demo_booking(
    booking_id: str,
    x_internal_secret: str | None = Header(default=None),
    x_user_id: str | None = Header(default=None),
):
    _require_secret(x_internal_secret)
    complete_booking(booking_id, _require_user(x_user_id))
    return None

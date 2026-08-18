from fastapi import APIRouter, Request, status

from app.core.security import verify_clerk_webhook
from app.services.user_service import create_user_from_clerk_event

router = APIRouter()


@router.post("/clerk", status_code=status.HTTP_200_OK)
async def handle_clerk_webhook(request: Request):
    # Signature verification needs the RAW request body — reading it as
    # parsed JSON first (e.g. via a Pydantic body param) would break this,
    # since the signature is computed over the exact raw bytes Clerk sent.
    payload = await request.body()
    headers = dict(request.headers)

    event = verify_clerk_webhook(payload, headers)
    event_type = event.get("type")

    if event_type == "user.created":
        create_user_from_clerk_event(event["data"])

    # Return 200 for every event type we receive, even ones we don't act
    # on — otherwise Clerk will keep retrying the delivery.
    return {"status": "received", "type": event_type}
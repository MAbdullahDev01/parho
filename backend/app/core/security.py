from fastapi import HTTPException, status
from svix.webhooks import Webhook, WebhookVerificationError

from app.core.config import settings

# Verifies incoming clerk webhooks using the signing secret from the Clerk dashboard.
def verify_clerk_webhook(payload: bytes, headers: dict) -> dict:
    """
    Verifies a Clerk webhook request came from Clerk (not a spoofed request)
    using the signing secret from the Clerk dashboard, and returns the
    parsed JSON event body if valid.

    Clerk signs webhooks using Svix, so this checks the `svix-id`,
    `svix-timestamp`, and `svix-signature` headers against the raw
    request body.

    Raises HTTPException(400) if the signature doesn't match.
    """
    signing_secret = settings.CLERK_WEBHOOK_SIGNING_SECRET if not settings.TESTING else settings.CLERK_WEBHOOK_SIGNING_SECRET_TESTING
    if signing_secret is not None:
        wh = Webhook(signing_secret)
    else:
        print("Warning: Clerk webhook signing secret is not set. Webhook verification is disabled.")
    try:
        event = wh.verify(payload, headers)
    except WebhookVerificationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid webhook signature: {exc}",
        )
    return event
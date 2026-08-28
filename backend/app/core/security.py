import json

from fastapi import HTTPException, status
from svix.webhooks import Webhook, WebhookVerificationError

from app.core.config import settings

# Verifies incoming Clerk webhooks using the signing secret from the Clerk dashboard.
def verify_clerk_webhook(payload: bytes, headers: dict) -> dict:
    """
    Verifies a Clerk webhook request came from Clerk (not a spoofed request)
    using the signing secret from the Clerk dashboard.

    Clerk signs webhooks using Svix, so this checks the `svix-id`,
    `svix-timestamp`, and `svix-signature` headers against the raw
    request body.

    The Svix SDK verifies the signature but does not return the parsed
    event body, so the verified payload is parsed separately with json.loads().

    Raises HTTPException(400) if the signature or JSON payload is invalid.
    """

    signing_secret = (
        settings.CLERK_WEBHOOK_SIGNING_SECRET
        if not settings.TESTING
        else settings.CLERK_WEBHOOK_SIGNING_SECRET_TESTING
    )

    if not signing_secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Clerk webhook signing secret is not configured.",
        )

    webhook = Webhook(signing_secret)

    try:
        # Verify the raw payload against the Svix signature.
        webhook.verify(payload, headers)
    except WebhookVerificationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid webhook signature: {exc}",
        )

    try:
        # `Webhook.verify()` validates the signature but does not return
        # the parsed event in the current Svix SDK.
        event = json.loads(payload)
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid webhook payload: {exc}",
        )

    if not isinstance(event, dict):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Webhook payload must be a JSON object.",
        )

    return event
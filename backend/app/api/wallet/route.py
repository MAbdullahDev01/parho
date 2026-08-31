import os

import stripe
from fastapi import APIRouter, Header, HTTPException, Request

from app.api.dependencies import require_internal_secret
from app.schemas.wallet import CheckoutResponse, CreateCheckoutRequest, StripeWebhookResponse, WalletResponse
from app.services.wallet_service import create_wallet_checkout, get_wallet, handle_checkout_completed

router = APIRouter(prefix="/api/backend/wallet", tags=["wallet"])


def _require_secret(value: str | None):
    require_internal_secret(value)


def _require_user(value: str | None) -> str:
    if not value:
        raise HTTPException(status_code=401, detail="User identity is required.")
    return value


@router.get("", response_model=WalletResponse)
def wallet(
    x_internal_secret: str | None = Header(default=None),
    x_user_id: str | None = Header(default=None),
):
    _require_secret(x_internal_secret)
    wallet_row, transactions = get_wallet(_require_user(x_user_id))
    return WalletResponse(wallet=wallet_row, transactions=transactions)


@router.post("/checkout", response_model=CheckoutResponse)
def create_checkout(
    payload: CreateCheckoutRequest,
    x_internal_secret: str | None = Header(default=None),
    x_user_id: str | None = Header(default=None),
    x_origin: str | None = Header(default=None),
):
    _require_secret(x_internal_secret)
    user_id = _require_user(x_user_id)
    origin = (x_origin or os.getenv("FRONTEND_URL") or "").rstrip("/")
    if not origin:
        raise HTTPException(status_code=503, detail="Frontend URL is not configured.")
    url = create_wallet_checkout(
        user_id,
        payload.amount,
        f"{origin}/dashboard/student/wallet?payment=success",
        f"{origin}/dashboard/student/wallet?payment=cancelled",
    )
    return CheckoutResponse(url=url)


@router.post("/stripe/webhook", response_model=StripeWebhookResponse)
async def stripe_webhook(request: Request, stripe_signature: str | None = Header(default=None)):
    secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    if not secret:
        raise HTTPException(status_code=503, detail="Stripe webhook is not configured.")
    if not stripe_signature:
        raise HTTPException(status_code=400, detail="Missing Stripe signature.")

    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(payload, stripe_signature, secret)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid webhook payload.") from exc
    except stripe.error.SignatureVerificationError as exc:
        raise HTTPException(status_code=400, detail="Invalid webhook signature.") from exc

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        if session.get("payment_status") == "paid":
            handle_checkout_completed(session)

    return StripeWebhookResponse(received=True)

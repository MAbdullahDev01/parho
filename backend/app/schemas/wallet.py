from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


WalletTransactionType = Literal["deposit", "hold", "release"]
WalletTransactionStatus = Literal["pending", "completed", "failed"]


class Wallet(BaseModel):
    clerk_id: str
    available_amount: int
    held_amount: int
    created_at: datetime
    updated_at: datetime


class WalletTransaction(BaseModel):
    id: str
    clerk_id: str
    amount: int
    type: WalletTransactionType
    booking_id: str | None = None
    status: WalletTransactionStatus
    stripe_checkout_session_id: str | None = None
    created_at: datetime


class WalletResponse(BaseModel):
    wallet: Wallet
    transactions: list[WalletTransaction]


class CreateCheckoutRequest(BaseModel):
    amount: int = Field(gt=0, le=100_000_000, description="Amount in paisa")


class CheckoutResponse(BaseModel):
    url: str


class StripeWebhookResponse(BaseModel):
    received: bool

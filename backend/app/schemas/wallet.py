from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

WalletTransactionType = Literal["deposit", "hold", "release"]
WalletTransactionStatus = Literal["pending", "completed", "failed", "disputed"]


class WalletAccount(BaseModel):
    clerk_id: str
    currency: Literal["PKR"]
    available_balance: float
    held_balance: float


class WalletTransaction(BaseModel):
    id: str
    clerk_id: str
    amount: float
    type: WalletTransactionType
    booking_id: str | None = None
    status: WalletTransactionStatus
    provider: str | None = None
    provider_reference: str | None = None
    metadata: dict = Field(default_factory=dict)
    created_at: datetime


class WalletResponse(BaseModel):
    wallet: WalletAccount
    transactions: list[WalletTransaction]


class DepositRequest(BaseModel):
    amount: float = Field(gt=0, le=1000000)
    provider: str | None = None
    provider_reference: str | None = None
    metadata: dict = Field(default_factory=dict)

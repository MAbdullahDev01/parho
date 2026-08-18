from typing import Any

from pydantic import BaseModel


class ClerkWebhookEvent(BaseModel):
    """
    The outer shape of every Clerk webhook payload. `data` is left loose
    since its shape depends on `type` (user.created vs session.created vs
    ...). Parse `data` into a more specific model once you know the type.
    """

    type: str
    data: dict[str, Any]


class ClerkEmailAddress(BaseModel):
    id: str
    email_address: str


class ClerkUserData(BaseModel):
    """Shape of `event.data` specifically for user.created / user.updated."""

    id: str
    email_addresses: list[ClerkEmailAddress] = []
    first_name: str | None = None
    last_name: str | None = None
    image_url: str | None = None

    @property
    def primary_email(self) -> str | None:
        return self.email_addresses[0].email_address if self.email_addresses else None
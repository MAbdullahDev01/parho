from datetime import datetime

from pydantic import BaseModel, Field


class MessageCreateRequest(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


class Message(BaseModel):
    id: str
    clerk_id_from: str
    clerk_id_to: str
    booking_id: str
    content: str
    created_at: datetime
    read_at: datetime | None = None


class MessageListResponse(BaseModel):
    messages: list[Message]

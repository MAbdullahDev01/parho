from typing import Literal

from pydantic import BaseModel, Field


class TutorDiscoveryCard(BaseModel):
    clerk_id: str
    first_name: str | None = None
    last_name: str | None = None
    avatar_url: str | None = None
    bio: str | None = None
    hourly_rate: float = 0
    rating: float = 0
    rating_count: int = 0
    subjects: list[str] = Field(default_factory=list)
    teaching_level: Literal["o_level", "a_level", "both"]
    verification_status: Literal["verified"]


class TutorDiscoveryResponse(BaseModel):
    tutors: list[TutorDiscoveryCard]
    total: int

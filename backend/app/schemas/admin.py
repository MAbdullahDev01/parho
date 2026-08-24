from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.tutor import TranscriptRecord


AdminVerificationDecision = Literal["verified", "rejected"]


class AdminTutorQueueItem(BaseModel):
    clerk_id: str
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None
    subjects: list[str]
    cambridge_transcript_level: Literal["o_level", "a_level"]
    teaching_level: Literal["o_level", "a_level", "both"]
    transcripts: list[TranscriptRecord]
    verification_status: Literal["unverified", "pending", "verified", "rejected"]
    verification_notes: str | None = None
    auto_verification_status: Literal["not_run", "running", "passed", "flagged", "error"]
    auto_verification_score: float | None = None
    auto_verification_flags: list[dict] = Field(default_factory=list)
    auto_verification_summary: str | None = None
    auto_verified_at: datetime | None = None


class AdminVerificationDecisionRequest(BaseModel):
    decision: AdminVerificationDecision
    notes: str | None = None


class AdminVerificationDecisionResponse(BaseModel):
    clerk_id: str
    verification_status: Literal["verified", "rejected"]
    verification_notes: str | None = None


class AdminTranscriptUrl(BaseModel):
    transcript: TranscriptRecord
    url: str

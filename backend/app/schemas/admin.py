from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.tutor import TranscriptRecord

AdminVerificationDecision = Literal["verified", "rejected"]

# Represents a tutor in the admin tutor queue. This is a superset of the Tutor model, with additional fields for verification status and notes.
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
    verification_decided_by: str | None = None
    auto_verification_status: Literal["not_run", "running", "passed", "flagged", "error"]
    auto_verification_score: float | None = None
    auto_verification_flags: list[dict] = Field(default_factory=list)
    auto_verification_summary: str | None = None
    auto_verified_at: datetime | None = None

# Represents a request to make a decision on a tutor's verification status. The decision can be either "verified" or "rejected", and optional notes can be provided.
class AdminVerificationDecisionRequest(BaseModel):
    decision: AdminVerificationDecision
    notes: str | None = None

# Represents a response to a request to make a decision on a tutor's verification status. The response includes the clerk ID, the decision made, any notes provided, and the ID of the admin who made the decision.
class AdminVerificationDecisionResponse(BaseModel):
    clerk_id: str
    verification_status: Literal["verified", "rejected"]
    verification_notes: str | None = None
    verification_decided_by: str

# Represents a transcript and its corresponding URL. This is used to return the transcript URL for a given transcript record.
class AdminTranscriptUrl(BaseModel):
    transcript: TranscriptRecord
    url: str

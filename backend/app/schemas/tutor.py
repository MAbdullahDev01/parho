from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator

from app.core.constants import MAX_SUBJECTS, SUBJECT_TAXONOMY, allowed_teaching_levels

TranscriptType = Literal["cambridge", "additional"]
TeachingLevel = Literal["o_level", "a_level", "both"]
CambridgeLevel = Literal["o_level", "a_level"]
AutoVerificationStatus = Literal[
    "not_run",
    "running",
    "passed",
    "flagged",
    "error",
]


class TranscriptRecord(BaseModel):
    """One uploaded transcript, as stored in tutor_profiles.transcripts."""

    storage_path: str
    original_filename: str
    transcript_type: TranscriptType
    uploaded_at: datetime


class TranscriptUploadResponse(BaseModel):
    transcript: TranscriptRecord


class TutorProfileSubmission(BaseModel):
    """
    Body for finalizing tutor setup. The frontend uploads each transcript
    file first (getting a TranscriptRecord back per file), then submits this
    once with the full set of records it collected.
    """

    clerk_id: str
    subjects: list[str] = Field(min_length=1, max_length=MAX_SUBJECTS)
    cambridge_transcript_level: CambridgeLevel
    teaching_level: TeachingLevel
    transcripts: list[TranscriptRecord] = Field(min_length=1)

    @model_validator(mode="after")
    def validate_business_rules(self) -> "TutorProfileSubmission":
        unknown = set(self.subjects) - set(SUBJECT_TAXONOMY)
        if unknown:
            raise ValueError(f"Unknown subject(s): {', '.join(sorted(unknown))}")

        if self.teaching_level not in allowed_teaching_levels(self.cambridge_transcript_level):
            raise ValueError(
                f"teaching_level '{self.teaching_level}' is not allowed for a "
                f"'{self.cambridge_transcript_level}' Cambridge transcript"
            )

        if not any(t.transcript_type == "cambridge" for t in self.transcripts):
            raise ValueError("A Cambridge transcript is mandatory")

        return self


class TutorProfileResponse(BaseModel):
    clerk_id: str
    subjects: list[str]
    cambridge_transcript_level: CambridgeLevel
    teaching_level: TeachingLevel
    transcripts: list[TranscriptRecord]
    verification_status: Literal["unverified", "pending", "verified", "rejected"]
    verification_notes: str | None = None
    auto_verification_status: AutoVerificationStatus = "not_run"
    auto_verification_score: float | None = None
    auto_verification_flags: list[dict] = Field(default_factory=list)
    auto_verification_summary: str | None = None
    auto_verified_at: datetime | None = None

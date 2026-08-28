from fastapi import HTTPException, status

from app.core.constants import TRANSCRIPT_BUCKET
from app.db.supabase import get_supabase
from app.schemas.admin import (
    AdminTutorQueueItem,
    AdminTranscriptUrl,
    AdminVerificationDecisionResponse,
)

# Helper function to query tutor profiles
def _profile_query():
    return (
        get_supabase()
        .table("tutor_profiles")
        .select(
            "clerk_id",
            "subjects",
            "cambridge_transcript_level",
            "teaching_level",
            "transcripts",
            "verification_status",
            "verification_notes",
            "auto_verification_status",
            "auto_verification_score",
            "auto_verification_flags",
            "auto_verification_summary",
            "auto_verified_at"
        )
        .order("created_at", desc=False)
    )

# Helper function to merge profile and user data into a single AdminTutorQueueItem
def _merge_profile_user(profile: dict, user: dict | None) -> AdminTutorQueueItem:
    return AdminTutorQueueItem(**{**profile, **(user or {})})

# List all tutors in the verification queue
def list_tutor_verification_queue() -> list[AdminTutorQueueItem]:
    try:
        profiles_response = _profile_query().in_("verification_status", ["pending", "rejected"]).execute()
        profiles = profiles_response.data or []
        if not profiles:
            return []

        clerk_ids = [profile["clerk_id"] for profile in profiles]
        users_response = (
            get_supabase()
            .table("users")
            .select("clerk_id,email,first_name,last_name")
            .in_("clerk_id", clerk_ids)
            .execute()
        )
        users = {row["clerk_id"]: row for row in (users_response.data or [])}
        return [_merge_profile_user(profile, users.get(profile["clerk_id"])) for profile in profiles]
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to load the tutor verification queue.",
        ) from exc

# Get a specific tutor's verification record
def get_tutor_for_verification(clerk_id: str) -> AdminTutorQueueItem:
    try:
        profile_response = (
            get_supabase()
            .table("tutor_profiles")
            .select(
                "clerk_id",
                "subjects",
                "cambridge_transcript_level",
                "teaching_level",
                "transcripts",
                "verification_status",
                "verification_notes",
                "auto_verification_status",
                "auto_verification_score",
                "auto_verification_flags",
                "auto_verification_summary",
                "auto_verified_at"
            )
            .eq("clerk_id", clerk_id)
            .maybe_single()
            .execute()
        )
        if not profile_response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tutor profile not found")

        user_response = (
            get_supabase()
            .table("users")
            .select("clerk_id,email,first_name,last_name")
            .eq("clerk_id", clerk_id)
            .maybe_single()
            .execute()
        )
        return _merge_profile_user(profile_response.data, user_response.data)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to load the tutor verification record.",
        ) from exc

# Decide on a tutor's verification status
def decide_tutor_verification(
    clerk_id: str,
    decision: str,
    notes: str | None,
    decided_by: str,
) -> AdminVerificationDecisionResponse:
    if decision not in {"verified", "rejected"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification decision")
    if not decided_by.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admin identity is required")

    try:
        existing = (
            get_supabase()
            .table("tutor_profiles")
            .select("clerk_id")
            .eq("clerk_id", clerk_id)
            .maybe_single()
            .execute()
        )
        if not existing.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tutor profile not found")

        response = (
            get_supabase()
            .table("tutor_profiles")
            .update({
                "verification_status": decision,
                "verification_notes": notes.strip() if notes and notes.strip() else None,
            })
            .eq("clerk_id", clerk_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Verification decision was not saved")

        row = response.data[0]
        return AdminVerificationDecisionResponse(
            clerk_id=row["clerk_id"],
            verification_status=row["verification_status"],
            verification_notes=row.get("verification_notes"),
            verification_decided_by=row["verification_decided_by"],
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to save the verification decision.",
        ) from exc

# Get secure URLs for a tutor's transcripts
def get_transcript_urls(clerk_id: str) -> list[AdminTranscriptUrl]:
    tutor = get_tutor_for_verification(clerk_id)
    results: list[AdminTranscriptUrl] = []
    try:
        supabase = get_supabase()
        for transcript in tutor.transcripts:
            url_response = supabase.storage.from_(TRANSCRIPT_BUCKET).create_signed_url(
                transcript.storage_path,
                60 * 30,
            )
            url = url_response.get("signedURL") or url_response.get("signedUrl")
            if url:
                results.append(AdminTranscriptUrl(transcript=transcript, url=url))
        return results
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to create secure transcript links.",
        ) from exc
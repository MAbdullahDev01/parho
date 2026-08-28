from fastapi import HTTPException, status

from app.db.supabase import get_supabase
from app.schemas.tutor import TutorProfileResponse, TutorProfileSubmission

# Upsert a tutor profile by Clerk ID so resubmitting setup updates the
# existing profile instead of creating a duplicate. Every submission resets
# verification to pending because the verified facts may have changed.
def submit_tutor_profile(
    submission: TutorProfileSubmission,
) -> TutorProfileResponse:
    record = {
        "clerk_id": submission.clerk_id,
        "subjects": submission.subjects,
        "cambridge_transcript_level": submission.cambridge_transcript_level,
        "teaching_level": submission.teaching_level,
        "transcripts": [
            transcript.model_dump(mode="json")
            for transcript in submission.transcripts
        ],
        "verification_status": "pending",
        "verification_notes": None,
    }

    try:
        response = (
            get_supabase()
            .table("tutor_profiles")
            .upsert(record, on_conflict="clerk_id")
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to save your tutor profile right now. Please try again.",
        ) from exc

    if response is None or not response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="The tutor profile was not saved.",
        )

    return TutorProfileResponse(**response.data[0])


# Get a tutor profile by Clerk ID.
# Returns None if the profile does not exist.
def get_tutor_profile(clerk_id: str) -> TutorProfileResponse | None:
    try:
        response = (
            get_supabase()
            .table("tutor_profiles")
            .select("*")
            .eq("clerk_id", clerk_id)
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to load the tutor profile right now.",
        ) from exc

    # Some Supabase client versions / query paths can return None.
    if response is None:
        return None

    data = response.data

    if not data:
        return None

    return TutorProfileResponse(**data[0])
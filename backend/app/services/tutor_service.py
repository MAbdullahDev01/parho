from app.db.supabase import get_supabase
from app.schemas.tutor import TutorProfileResponse, TutorProfileSubmission


def submit_tutor_profile(submission: TutorProfileSubmission) -> TutorProfileResponse:
    """
    Upserts a tutor's profile on `clerk_id` (not insert) so re-submitting
    tutor setup — e.g. after adding an extra transcript — updates the
    existing row instead of erroring on the unique constraint. Every
    submission resets verification_status to 'pending' since the underlying
    facts (subjects, transcripts, level) may have changed.
    """
    record = {
        "clerk_id": submission.clerk_id,
        "subjects": submission.subjects,
        "cambridge_transcript_level": submission.cambridge_transcript_level,
        "teaching_level": submission.teaching_level,
        "transcripts": [t.model_dump(mode="json") for t in submission.transcripts],
        "verification_status": "pending",
        "verification_notes": None,
    }

    supabase = get_supabase()
    response = (
        supabase.table("tutor_profiles")
        .upsert(record, on_conflict="clerk_id")
        .execute()
    )
    return TutorProfileResponse(**response.data[0])


def get_tutor_profile(clerk_id: str) -> TutorProfileResponse | None:
    supabase = get_supabase()
    response = (
        supabase.table("tutor_profiles")
        .select("*")
        .eq("clerk_id", clerk_id)
        .maybe_single()
        .execute()
    )
    if not response.data:
        return None
    return TutorProfileResponse(**response.data)
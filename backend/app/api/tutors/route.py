from fastapi import APIRouter, BackgroundTasks, File, Form, Header, HTTPException, UploadFile, status

from app.api.dependencies import require_internal_secret
from app.core.config import settings
from app.core.constants import SUBJECT_TAXONOMY
from app.schemas.tutor import (
    TranscriptType,
    TranscriptUploadResponse,
    TutorProfileResponse,
    TutorProfileSubmission,
)
from app.services.storage_service import upload_transcript
from app.services.transcript_verification_service import run_auto_verification
from app.services.tutor_service import get_tutor_profile, submit_tutor_profile

router = APIRouter(prefix="/api/backend/tutors", tags=["tutors"])

def require_tutor_request(
    x_internal_secret: str | None,
    x_tutor_id: str | None,
    clerk_id: str,
) -> None:
    require_internal_secret(x_internal_secret)
    if not x_tutor_id or not clerk_id or not x_tutor_id == clerk_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tutor identity does not match the authenticated request.",
        )

# Displays the available subjects for tutors to select from when creating their profile.
@router.get("/subjects")
def list_subjects(x_internal_secret: str | None = Header(default=None)) -> list[str]:
    """Fixed subject taxonomy the setup page renders as options."""
    require_internal_secret(x_internal_secret)
    return SUBJECT_TAXONOMY

# Uploads a transcript file for a tutor. The file is stored in the backend and associated with the tutor's profile.
@router.post("/transcripts", response_model=TranscriptUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_transcript_file(
    clerk_id: str = Form(...),
    transcript_type: TranscriptType = Form(...),
    file: UploadFile = File(...),
    x_internal_secret: str | None = Header(default=None),
    x_tutor_id: str | None = Header(default=None),
):
    require_tutor_request(x_internal_secret, x_tutor_id, clerk_id)

    file_bytes = await file.read()
    try:
        record = upload_transcript(
            clerk_id=clerk_id,
            transcript_type=transcript_type,
            filename=file.filename or "transcript",
            content_type=file.content_type or "application/octet-stream",
            file_bytes=file_bytes,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    return TranscriptUploadResponse(transcript=record)

# Submits a tutor's profile for verification. If the profile already exists, it is updated instead of creating a duplicate. The verification status is reset to pending with every submission.
@router.post("/profile", response_model=TutorProfileResponse, status_code=status.HTTP_200_OK)
def submit_profile(
    payload: TutorProfileSubmission,
    background_tasks: BackgroundTasks,
    x_internal_secret: str | None = Header(default=None),
    x_tutor_id: str | None = Header(default=None),
):
    require_tutor_request(x_internal_secret, x_tutor_id, payload.clerk_id)

    profile = submit_tutor_profile(payload)

    # Screening runs after the profile response is ready so onboarding does
    # not block on model latency. It never changes verification_status; only
    # an admin can approve or reject the tutor.
    if settings.AUTO_VERIFICATION_ENABLED:
        background_tasks.add_task(
            run_auto_verification,
            clerk_id=payload.clerk_id,
            transcripts=[t.model_dump(mode="json") for t in payload.transcripts],
            claimed_level=payload.cambridge_transcript_level,
            teaching_level=payload.teaching_level,
        )

    return profile

# Retrieves a tutor's profile by their Clerk ID. If the profile does not exist, a 404 error is returned.
@router.get("/profile/{clerk_id}", response_model=TutorProfileResponse)
def read_profile(
    clerk_id: str,
    x_internal_secret: str | None = Header(default=None),
    x_tutor_id: str | None = Header(default=None),
):
    require_tutor_request(x_internal_secret, x_tutor_id, clerk_id)

    profile = get_tutor_profile(clerk_id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tutor profile not found")
    return profile
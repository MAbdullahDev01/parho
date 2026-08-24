from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile, status

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


@router.get("/subjects")
def list_subjects() -> list[str]:
    """Fixed subject taxonomy the setup page renders as options."""
    return SUBJECT_TAXONOMY


@router.post("/transcripts", response_model=TranscriptUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_transcript_file(
    clerk_id: str = Form(...),
    transcript_type: TranscriptType = Form(...),
    file: UploadFile = File(...),
):
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


@router.post("/profile", response_model=TutorProfileResponse, status_code=status.HTTP_200_OK)
def submit_profile(payload: TutorProfileSubmission, background_tasks: BackgroundTasks):
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


@router.get("/profile/{clerk_id}", response_model=TutorProfileResponse)
def read_profile(clerk_id: str):
    profile = get_tutor_profile(clerk_id)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tutor profile not found")
    return profile

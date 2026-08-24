from fastapi import APIRouter

from app.schemas.admin import (
    AdminTutorQueueItem,
    AdminTranscriptUrl,
    AdminVerificationDecisionRequest,
    AdminVerificationDecisionResponse,
)
from app.services.admin_service import (
    decide_tutor_verification,
    get_transcript_urls,
    get_tutor_for_verification,
    list_tutor_verification_queue,
)

router = APIRouter(prefix="/api/backend/admin", tags=["admin"])


@router.get("/tutors/verification", response_model=list[AdminTutorQueueItem])
def verification_queue():
    return list_tutor_verification_queue()


@router.get("/tutors/{clerk_id}/verification", response_model=AdminTutorQueueItem)
def tutor_verification(clerk_id: str):
    return get_tutor_for_verification(clerk_id)


@router.get("/tutors/{clerk_id}/transcripts", response_model=list[AdminTranscriptUrl])
def tutor_transcripts(clerk_id: str):
    return get_transcript_urls(clerk_id)


@router.post(
    "/tutors/{clerk_id}/verification",
    response_model=AdminVerificationDecisionResponse,
)
def tutor_verification_decision(clerk_id: str, payload: AdminVerificationDecisionRequest):
    return decide_tutor_verification(clerk_id, payload.decision, payload.notes)

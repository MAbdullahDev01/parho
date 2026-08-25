from fastapi import APIRouter, Header, HTTPException, status

from app.api.dependencies import require_internal_secret
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
def verification_queue(x_internal_secret: str | None = Header(default=None)):
    require_internal_secret(x_internal_secret)
    return list_tutor_verification_queue()


@router.get("/tutors/{clerk_id}/verification", response_model=AdminTutorQueueItem)
def tutor_verification(clerk_id: str, x_internal_secret: str | None = Header(default=None)):
    require_internal_secret(x_internal_secret)
    return get_tutor_for_verification(clerk_id)


@router.get("/tutors/{clerk_id}/transcripts", response_model=list[AdminTranscriptUrl])
def tutor_transcripts(clerk_id: str, x_internal_secret: str | None = Header(default=None)):
    require_internal_secret(x_internal_secret)
    return get_transcript_urls(clerk_id)


@router.post(
    "/tutors/{clerk_id}/verification",
    response_model=AdminVerificationDecisionResponse,
)
def tutor_verification_decision(
    clerk_id: str,
    payload: AdminVerificationDecisionRequest,
    x_internal_secret: str | None = Header(default=None),
    x_admin_id: str | None = Header(default=None),
):
    require_internal_secret(x_internal_secret)
    if not x_admin_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin identity is required for verification decisions.",
        )
    return decide_tutor_verification(clerk_id, payload.decision, payload.notes, x_admin_id)

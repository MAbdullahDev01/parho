from fastapi import APIRouter, Header, Query, status

from app.api.dependencies import require_internal_secret
from app.services.tutor_discovery_service import get_public_tutor, search_tutors

router = APIRouter(prefix="/api/backend/tutor-discovery", tags=["tutor-discovery"])


@router.get("", status_code=status.HTTP_200_OK)
def discover_tutors(
    subjects: list[str] | None = Query(default=None),
    level: str | None = Query(default=None, pattern="^(o_level|a_level)$"),
    min_rating: float = Query(default=0, ge=0, le=5),
    limit: int = Query(default=24, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    x_internal_secret: str | None = Header(default=None),
):
    require_internal_secret(x_internal_secret)
    return search_tutors(
        subjects=subjects,
        level=level,
        min_rating=min_rating,
        limit=limit,
        offset=offset,
    )


@router.get("/{clerk_id}", status_code=status.HTTP_200_OK)
def public_tutor_profile(
    clerk_id: str,
    x_internal_secret: str | None = Header(default=None),
):
    require_internal_secret(x_internal_secret)
    profile = get_public_tutor(clerk_id)
    if profile is None:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Verified tutor not found")
    return profile

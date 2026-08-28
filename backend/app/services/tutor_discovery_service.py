from fastapi import HTTPException, status

from app.db.supabase import get_supabase
from app.schemas.tutor_discovery import TutorDiscoveryCard, TutorDiscoveryResponse


def search_tutors(
    *,
    subjects: list[str] | None = None,
    level: str | None = None,
    min_rating: float = 0,
    limit: int = 24,
    offset: int = 0,
) -> TutorDiscoveryResponse:
    """Return only verified tutors matching the requested discovery filters.

    Subject filtering intentionally uses array overlap: a tutor is eligible when
    they teach at least one selected subject, rather than requiring every subject.
    Level filtering treats ``both`` as compatible with either requested level.
    """
    try:
        query = (
            get_supabase()
            .table("tutor_profiles")
            .select(
                "clerk_id,subjects,teaching_level,verification_status,"
                "bio,hourly_rate,rating,rating_count,"
                "users!inner(first_name,last_name,avatar_url,role)"
            )
            .eq("verification_status", "verified")
            .eq("users.role", "tutor")
            .gte("rating", min_rating)
            .order("rating", desc=True)
            .order("rating_count", desc=True)
            .range(offset, offset + limit - 1)
        )

        if subjects:
            query = query.overlaps("subjects", subjects)

        if level in {"o_level", "a_level"}:
            query = query.in_("teaching_level", [level, "both"])

        response = query.execute()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to search tutors right now. Please try again.",
        ) from exc

    rows = (response.data if response is not None else None) or []
    tutors: list[TutorDiscoveryCard] = []

    for row in rows:
        user = row.get("users") or {}
        tutors.append(
            TutorDiscoveryCard(
                clerk_id=row["clerk_id"],
                first_name=user.get("first_name"),
                last_name=user.get("last_name"),
                avatar_url=user.get("avatar_url"),
                bio=row.get("bio"),
                hourly_rate=float(row.get("hourly_rate") or 0),
                rating=float(row.get("rating") or 0),
                rating_count=int(row.get("rating_count") or 0),
                subjects=row.get("subjects") or [],
                teaching_level=row["teaching_level"],
                verification_status="verified",
            )
        )

    return TutorDiscoveryResponse(tutors=tutors, total=len(tutors))


def get_public_tutor(clerk_id: str) -> TutorDiscoveryCard | None:
    try:
        response = (
            get_supabase()
            .table("tutor_profiles")
            .select(
                "clerk_id,subjects,teaching_level,verification_status,"
                "bio,hourly_rate,rating,rating_count,"
                "users!inner(first_name,last_name,avatar_url,role)"
            )
            .eq("clerk_id", clerk_id)
            .eq("verification_status", "verified")
            .eq("users.role", "tutor")
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to load this tutor right now.",
        ) from exc

    rows = (response.data if response is not None else None) or []
    if not rows:
        return None

    row = rows[0]
    user = row.get("users") or {}
    return TutorDiscoveryCard(
        clerk_id=row["clerk_id"],
        first_name=user.get("first_name"),
        last_name=user.get("last_name"),
        avatar_url=user.get("avatar_url"),
        bio=row.get("bio"),
        hourly_rate=float(row.get("hourly_rate") or 0),
        rating=float(row.get("rating") or 0),
        rating_count=int(row.get("rating_count") or 0),
        subjects=row.get("subjects") or [],
        teaching_level=row["teaching_level"],
        verification_status="verified",
    )

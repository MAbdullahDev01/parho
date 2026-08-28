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
                "users!inner(first_name,last_name,avatar_url,role),"
                "user_profiles!inner(bio,hourly_rate,rating,rating_count)"
            )
            .eq("verification_status", "verified")
            .eq("users.role", "tutor")
            .gte("user_profiles.rating", min_rating)
            .order("rating", referenced_table="user_profiles", desc=True)
            .order("rating_count", referenced_table="user_profiles", desc=True)
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

    rows = response.data or []
    tutors: list[TutorDiscoveryCard] = []

    for row in rows:
        user = row.get("users") or {}
        profile = row.get("user_profiles") or {}
        tutors.append(
            TutorDiscoveryCard(
                clerk_id=row["clerk_id"],
                first_name=user.get("first_name"),
                last_name=user.get("last_name"),
                avatar_url=user.get("avatar_url"),
                bio=profile.get("bio"),
                hourly_rate=float(profile.get("hourly_rate") or 0),
                rating=float(profile.get("rating") or 0),
                rating_count=int(profile.get("rating_count") or 0),
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
                "users!inner(first_name,last_name,avatar_url,role),"
                "user_profiles!inner(bio,hourly_rate,rating,rating_count)"
            )
            .eq("clerk_id", clerk_id)
            .eq("verification_status", "verified")
            .eq("users.role", "tutor")
            .maybe_single()
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to load this tutor right now.",
        ) from exc

    if not response.data:
        return None

    row = response.data
    user = row.get("users") or {}
    profile = row.get("user_profiles") or {}
    return TutorDiscoveryCard(
        clerk_id=row["clerk_id"],
        first_name=user.get("first_name"),
        last_name=user.get("last_name"),
        avatar_url=user.get("avatar_url"),
        bio=profile.get("bio"),
        hourly_rate=float(profile.get("hourly_rate") or 0),
        rating=float(profile.get("rating") or 0),
        rating_count=int(profile.get("rating_count") or 0),
        subjects=row.get("subjects") or [],
        teaching_level=row["teaching_level"],
        verification_status="verified",
    )

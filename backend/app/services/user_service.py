from app.db.supabase import get_supabase
from app.schemas.clerk import ClerkUserData


# Create a new user in the Supabase `users` table from a Clerk `user.created`
# webhook event. Role-specific profile rows are created when the role is known.
def create_user_from_clerk_event(data: dict) -> dict:
    user = ClerkUserData(**data)

    record = {
        "clerk_id": user.id,
        "email": user.primary_email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "avatar_url": user.image_url,
    }

    supabase = get_supabase()
    response = supabase.table("users").upsert(record, on_conflict="clerk_id").execute()

    # Clerk's user.created event normally does not contain Parho's application
    # role, so role-specific profiles are created later by set_user_role().
    return response.data


# Update the role of an existing user and create the corresponding
# role-specific profile row when a role is assigned.
def set_user_role(clerk_id: str, role: str) -> dict:
    supabase = get_supabase()
    response = (
        supabase.table("users")
        .update({"role": role})
        .eq("clerk_id", clerk_id)
        .execute()
    )

    if role == "student":
        supabase.table("student_profiles").upsert(
            {"clerk_id": clerk_id},
            on_conflict="clerk_id",
        ).execute()

    return response.data

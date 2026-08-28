from app.db.supabase import get_supabase
from app.schemas.clerk import ClerkUserData

# Create a new user in the Supabase `users` table from a Clerk `user.created` webhook event
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

    # Every account gets a lightweight public profile row. Tutor discovery
    # joins against this table for bio, pricing, and rating data.
    supabase.table("user_profiles").upsert(
        {"clerk_id": user.id},
        on_conflict="clerk_id",
    ).execute()

    return response.data

# Update the role of an existing user in the Supabase `users` table
def set_user_role(clerk_id: str, role: str) -> dict:
    supabase = get_supabase()
    response = (
        supabase.table("users")
        .update({"role": role})
        .eq("clerk_id", clerk_id)
        .execute()
    )
    return response.data

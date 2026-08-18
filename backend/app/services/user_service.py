from app.db.supabase import get_supabase
from app.schemas.clerk import ClerkUserData


def create_user_from_clerk_event(data: dict) -> dict:
    """
    Takes the `data` object from a Clerk `user.created` webhook event and
    upserts a matching row into the Supabase `users` table.

    Uses upsert on `clerk_id` (not insert) so that if Clerk redelivers the
    same webhook — which it does on retries — we don't create duplicate
    users or throw an error.
    """
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
    return response.data
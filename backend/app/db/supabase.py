from functools import lru_cache

from supabase import Client, create_client

from app.core.config import settings


@lru_cache
def get_supabase() -> Client:
    """
    Returns a cached Supabase client authenticated with the service role
    key. This key bypasses Row Level Security, so this client should only
    ever be used from backend code — never sent to or used from the
    frontend.
    """
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
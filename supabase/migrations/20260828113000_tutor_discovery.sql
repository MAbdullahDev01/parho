-- Phase 1: tutor discovery
-- Public tutor search only exposes verified tutor profiles.

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clerk_id text NOT NULL UNIQUE,
  bio text,
  hourly_rate numeric(10,2) NOT NULL DEFAULT 0 CHECK (hourly_rate >= 0),
  rating numeric(3,2) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  rating_count integer NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_clerk_id_fkey FOREIGN KEY (clerk_id) REFERENCES public.users(clerk_id) ON DELETE CASCADE
);

-- Backfill profiles for accounts that already existed before this migration.
INSERT INTO public.user_profiles (clerk_id)
SELECT u.clerk_id
FROM public.users u
ON CONFLICT (clerk_id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_user_profiles_rating ON public.user_profiles (rating DESC, rating_count DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_updated_at ON public.user_profiles (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_discovery_verification ON public.tutor_profiles (verification_status, teaching_level);
CREATE INDEX IF NOT EXISTS idx_tutor_profiles_subjects_gin ON public.tutor_profiles USING gin (subjects);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public tutor profile discovery" ON public.user_profiles;
CREATE POLICY "Public tutor profile discovery"
  ON public.user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      JOIN public.tutor_profiles tp ON tp.clerk_id = u.clerk_id
      WHERE u.clerk_id = user_profiles.clerk_id
        AND u.role = 'tutor'
        AND tp.verification_status = 'verified'
    )
  );

-- Keep updated_at current when profile information changes.
CREATE OR REPLACE FUNCTION public.set_user_profiles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_profiles_updated_at();

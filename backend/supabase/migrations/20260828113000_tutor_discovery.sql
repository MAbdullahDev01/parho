-- Replace the generic user_profiles table with role-specific profiles.
-- Student-specific data belongs in student_profiles; tutor marketplace data
-- belongs in tutor_profiles.

CREATE TABLE IF NOT EXISTS public.student_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clerk_id text NOT NULL UNIQUE,
  education_level text NOT NULL DEFAULT 'o_level'
    CHECK (education_level = ANY (ARRAY['o_level'::text, 'a_level'::text])),
  subjects text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT student_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT student_profiles_clerk_id_fkey FOREIGN KEY (clerk_id)
    REFERENCES public.users(clerk_id) ON DELETE CASCADE
);

-- Tutor discovery fields belong directly to tutor_profiles because they are
-- properties of the tutor offering, not generic user properties.
ALTER TABLE public.tutor_profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS hourly_rate numeric(10,2) NOT NULL DEFAULT 0
    CHECK (hourly_rate >= 0),
  ADD COLUMN IF NOT EXISTS rating numeric(3,2) NOT NULL DEFAULT 0
    CHECK (rating >= 0 AND rating <= 5),
  ADD COLUMN IF NOT EXISTS rating_count integer NOT NULL DEFAULT 0
    CHECK (rating_count >= 0);

CREATE INDEX IF NOT EXISTS idx_student_profiles_education_level
  ON public.student_profiles (education_level);

CREATE INDEX IF NOT EXISTS idx_student_profiles_subjects_gin
  ON public.student_profiles USING gin (subjects);

CREATE INDEX IF NOT EXISTS idx_tutor_profiles_rating
  ON public.tutor_profiles (rating DESC, rating_count DESC);

CREATE OR REPLACE FUNCTION public.set_student_profiles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS student_profiles_updated_at ON public.student_profiles;
CREATE TRIGGER student_profiles_updated_at
  BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_student_profiles_updated_at();

ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can read their own profile" ON public.student_profiles;
CREATE POLICY "Students can read their own profile"
  ON public.student_profiles
  FOR SELECT
  USING (
    clerk_id = auth.jwt() ->> 'sub'
  );

DROP POLICY IF EXISTS "Students can update their own profile" ON public.student_profiles;
CREATE POLICY "Students can update their own profile"
  ON public.student_profiles
  FOR UPDATE
  USING (clerk_id = auth.jwt() ->> 'sub')
  WITH CHECK (clerk_id = auth.jwt() ->> 'sub');

-- The backend uses the service role for profile creation and updates.
-- Students therefore do not need direct INSERT access here.

-- Remove the generic profile table introduced by the first discovery migration.
-- The data it held is migrated into tutor_profiles before the table is removed.
UPDATE public.tutor_profiles tp
SET
  bio = up.bio,
  hourly_rate = up.hourly_rate,
  rating = up.rating,
  rating_count = up.rating_count
FROM public.user_profiles up
WHERE up.clerk_id = tp.clerk_id;

DROP TABLE IF EXISTS public.user_profiles;

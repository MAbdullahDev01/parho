-- Phase 2: tutor availability and demo bookings.

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.tutor_availability (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tutor_clerk_id text NOT NULL,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  timezone text NOT NULL DEFAULT 'Asia/Karachi',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tutor_availability_pkey PRIMARY KEY (id),
  CONSTRAINT tutor_availability_tutor_fkey FOREIGN KEY (tutor_clerk_id)
    REFERENCES public.users(clerk_id) ON DELETE CASCADE,
  CONSTRAINT tutor_availability_time_check CHECK (start_time < end_time),
  CONSTRAINT tutor_availability_unique_window UNIQUE (tutor_clerk_id, day_of_week, start_time, end_time)
);

CREATE INDEX IF NOT EXISTS idx_tutor_availability_lookup
  ON public.tutor_availability (tutor_clerk_id, day_of_week, start_time);

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_clerk_id text NOT NULL,
  tutor_clerk_id text NOT NULL,
  booking_type text NOT NULL DEFAULT 'demo' CHECK (booking_type IN ('demo')),
  status text NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bookings_pkey PRIMARY KEY (id),
  CONSTRAINT bookings_student_fkey FOREIGN KEY (student_clerk_id)
    REFERENCES public.users(clerk_id) ON DELETE CASCADE,
  CONSTRAINT bookings_tutor_fkey FOREIGN KEY (tutor_clerk_id)
    REFERENCES public.users(clerk_id) ON DELETE CASCADE,
  CONSTRAINT bookings_time_check CHECK (start_at < end_at),
  CONSTRAINT bookings_duration_check CHECK (end_at - start_at = interval '30 minutes')
);

CREATE INDEX IF NOT EXISTS idx_bookings_student_start
  ON public.bookings (student_clerk_id, start_at);

CREATE INDEX IF NOT EXISTS idx_bookings_tutor_start
  ON public.bookings (tutor_clerk_id, start_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_demo_per_pair
  ON public.bookings (student_clerk_id, tutor_clerk_id)
  WHERE booking_type = 'demo' AND status IN ('confirmed', 'completed');

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_no_tutor_overlap;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_no_tutor_overlap
  EXCLUDE USING gist (
    tutor_clerk_id WITH =,
    tstzrange(start_at, end_at, '[)') WITH &&
  ) WHERE (status IN ('confirmed', 'completed'));

CREATE OR REPLACE FUNCTION public.set_booking_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_updated_at ON public.bookings;
CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_booking_updated_at();

ALTER TABLE public.tutor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tutors can manage their availability" ON public.tutor_availability;
CREATE POLICY "Tutors can manage their availability"
  ON public.tutor_availability
  FOR ALL
  USING (tutor_clerk_id = auth.jwt() ->> 'sub')
  WITH CHECK (tutor_clerk_id = auth.jwt() ->> 'sub');

DROP POLICY IF EXISTS "Students can read their bookings" ON public.bookings;
CREATE POLICY "Students can read their bookings"
  ON public.bookings
  FOR SELECT
  USING (student_clerk_id = auth.jwt() ->> 'sub');

DROP POLICY IF EXISTS "Tutors can read their bookings" ON public.bookings;
CREATE POLICY "Tutors can read their bookings"
  ON public.bookings
  FOR SELECT
  USING (tutor_clerk_id = auth.jwt() ->> 'sub');

CREATE OR REPLACE FUNCTION public.create_demo_booking(
  p_student_clerk_id text,
  p_tutor_clerk_id text,
  p_start_at timestamptz
)
RETURNS SETOF public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tutor_timezone text;
  local_start timestamp;
  local_end timestamp;
BEGIN
  IF p_student_clerk_id = p_tutor_clerk_id THEN
    RAISE EXCEPTION 'You cannot book a demo with yourself.';
  END IF;

  IF p_start_at <= now() THEN
    RAISE EXCEPTION 'Booking time must be in the future.';
  END IF;

  IF p_start_at > now() + interval '30 days' THEN
    RAISE EXCEPTION 'Demo bookings can only be made within the next 30 days.';
  END IF;

  SELECT a.timezone INTO tutor_timezone
  FROM tutor_availability a
  WHERE a.tutor_clerk_id = p_tutor_clerk_id
  LIMIT 1;

  IF tutor_timezone IS NULL THEN
    RAISE EXCEPTION 'Tutor has not configured availability.';
  END IF;

  local_start := p_start_at AT TIME ZONE tutor_timezone;
  local_end := (p_start_at + interval '30 minutes') AT TIME ZONE tutor_timezone;

  IF NOT EXISTS (
    SELECT 1
    FROM tutor_availability a
    WHERE a.tutor_clerk_id = p_tutor_clerk_id
      AND a.day_of_week = EXTRACT(ISODOW FROM local_start)::int - 1
      AND local_start::time >= a.start_time
      AND local_end::time <= a.end_time
  ) THEN
    RAISE EXCEPTION 'Selected slot is not available.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM bookings b
    WHERE b.student_clerk_id = p_student_clerk_id
      AND b.status IN ('confirmed', 'completed')
      AND b.start_at < p_start_at + interval '30 minutes'
      AND b.end_at > p_start_at
  ) THEN
    RAISE EXCEPTION 'You already have a booking during this time.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM bookings b
    WHERE b.student_clerk_id = p_student_clerk_id
      AND b.tutor_clerk_id = p_tutor_clerk_id
      AND b.booking_type = 'demo'
      AND b.status IN ('confirmed', 'completed')
  ) THEN
    RAISE EXCEPTION 'You already have a demo with this tutor.';
  END IF;

  RETURN QUERY
  INSERT INTO bookings (student_clerk_id, tutor_clerk_id, booking_type, status, start_at, end_at)
  VALUES (p_student_clerk_id, p_tutor_clerk_id, 'demo', 'confirmed', p_start_at, p_start_at + interval '30 minutes')
  RETURNING *;
EXCEPTION
  WHEN exclusion_violation THEN
    RAISE EXCEPTION 'Selected slot is no longer available.';
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_demo_booking(text, text, timestamptz) TO service_role;

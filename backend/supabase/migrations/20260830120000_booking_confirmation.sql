-- Phase 3: tutor confirmation for demo bookings.
-- Existing Phase 2 bookings remain valid; new demo bookings created by the RPC
-- below start as pending until the tutor confirms them.

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show'));

DROP INDEX IF EXISTS public.idx_one_active_demo_per_pair;
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_demo_per_pair
  ON public.bookings (student_clerk_id, tutor_clerk_id)
  WHERE booking_type = 'demo' AND status IN ('pending', 'confirmed', 'completed');

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_no_tutor_overlap;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_no_tutor_overlap
  EXCLUDE USING gist (
    tutor_clerk_id WITH =,
    tstzrange(start_at, end_at, '[)') WITH &&
  ) WHERE (status IN ('pending', 'confirmed', 'completed'));

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
      AND b.status IN ('pending', 'confirmed', 'completed')
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
      AND b.status IN ('pending', 'confirmed', 'completed')
  ) THEN
    RAISE EXCEPTION 'You already have a demo with this tutor.';
  END IF;

  RETURN QUERY
  INSERT INTO bookings (student_clerk_id, tutor_clerk_id, booking_type, status, start_at, end_at)
  VALUES (p_student_clerk_id, p_tutor_clerk_id, 'demo', 'pending', p_start_at, p_start_at + interval '30 minutes')
  RETURNING *;
EXCEPTION
  WHEN exclusion_violation THEN
    RAISE EXCEPTION 'Selected slot is no longer available.';
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_demo_booking(text, text, timestamptz) TO service_role;

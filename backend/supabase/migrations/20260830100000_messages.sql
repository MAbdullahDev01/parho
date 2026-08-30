-- Phase 3: booking-scoped 1-to-1 messaging.
-- Each booking is its own conversation; rows in this table are individual messages.

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clerk_id_from text NOT NULL,
  clerk_id_to text NOT NULL,
  booking_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz NULL,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_booking_fkey FOREIGN KEY (booking_id)
    REFERENCES public.bookings(id) ON DELETE CASCADE,
  CONSTRAINT messages_sender_fkey FOREIGN KEY (clerk_id_from)
    REFERENCES public.users(clerk_id) ON DELETE CASCADE,
  CONSTRAINT messages_recipient_fkey FOREIGN KEY (clerk_id_to)
    REFERENCES public.users(clerk_id) ON DELETE CASCADE,
  CONSTRAINT messages_participants_differ CHECK (clerk_id_from <> clerk_id_to),
  CONSTRAINT messages_content_check CHECK (char_length(btrim(content)) BETWEEN 1 AND 2000)
);

CREATE INDEX IF NOT EXISTS idx_messages_booking_created
  ON public.messages (booking_id, created_at, id);

CREATE INDEX IF NOT EXISTS idx_messages_recipient_unread
  ON public.messages (clerk_id_to, read_at, created_at)
  WHERE read_at IS NULL;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Booking participants can read messages" ON public.messages;
CREATE POLICY "Booking participants can read messages"
  ON public.messages
  FOR SELECT
  USING (
    clerk_id_from = auth.jwt() ->> 'sub'
    OR clerk_id_to = auth.jwt() ->> 'sub'
  );

DROP POLICY IF EXISTS "Booking participants can send messages" ON public.messages;
CREATE POLICY "Booking participants can send messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (clerk_id_from = auth.jwt() ->> 'sub');

DROP POLICY IF EXISTS "Recipients can mark messages read" ON public.messages;
CREATE POLICY "Recipients can mark messages read"
  ON public.messages
  FOR UPDATE
  USING (clerk_id_to = auth.jwt() ->> 'sub')
  WITH CHECK (clerk_id_to = auth.jwt() ->> 'sub');

-- The backend currently uses the service-role client, so these grants are
-- intentionally limited to the service role. The RLS policies above also
-- document the intended access model if direct Supabase access is introduced.
GRANT SELECT, INSERT, UPDATE ON public.messages TO service_role;

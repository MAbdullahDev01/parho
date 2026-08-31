-- Tracks Safepay trackers separately from the wallet ledger.
-- A tracker can be AUTHORIZED before money is captured, which matches the
-- requested session hold -> capture/release flow.

CREATE TABLE IF NOT EXISTS public.payment_intents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  student_clerk_id text NOT NULL,
  tutor_clerk_id text NOT NULL,
  provider text NOT NULL DEFAULT 'safepay',
  provider_tracker text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'PKR' CHECK (currency = 'PKR'),
  status text NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'pending', 'authorized', 'captured', 'failed', 'cancelled', 'disputed')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payment_intents_pkey PRIMARY KEY (id),
  CONSTRAINT payment_intents_booking_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE,
  CONSTRAINT payment_intents_student_fkey FOREIGN KEY (student_clerk_id) REFERENCES public.users(clerk_id) ON DELETE CASCADE,
  CONSTRAINT payment_intents_tutor_fkey FOREIGN KEY (tutor_clerk_id) REFERENCES public.users(clerk_id) ON DELETE CASCADE,
  CONSTRAINT payment_intents_provider_tracker_unique UNIQUE (provider, provider_tracker)
);

CREATE INDEX IF NOT EXISTS idx_payment_intents_booking ON public.payment_intents (booking_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_intents_student ON public.payment_intents (student_clerk_id, created_at DESC);

ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can read their payment intents" ON public.payment_intents;
CREATE POLICY "Students can read their payment intents"
  ON public.payment_intents FOR SELECT
  USING (student_clerk_id = auth.jwt() ->> 'sub');

DROP POLICY IF EXISTS "Tutors can read their payment intents" ON public.payment_intents;
CREATE POLICY "Tutors can read their payment intents"
  ON public.payment_intents FOR SELECT
  USING (tutor_clerk_id = auth.jwt() ->> 'sub');

CREATE OR REPLACE FUNCTION public.set_payment_intent_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS payment_intents_updated_at ON public.payment_intents;
CREATE TRIGGER payment_intents_updated_at
  BEFORE UPDATE ON public.payment_intents
  FOR EACH ROW EXECUTE FUNCTION public.set_payment_intent_updated_at();

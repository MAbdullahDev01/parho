-- Wallet top-ups are Safepay payment intents without a booking or tutor.
ALTER TABLE public.payment_intents
  ALTER COLUMN booking_id DROP NOT NULL,
  ALTER COLUMN tutor_clerk_id DROP NOT NULL;

ALTER TABLE public.payment_intents
  DROP CONSTRAINT IF EXISTS payment_intents_booking_fkey;
ALTER TABLE public.payment_intents
  ADD CONSTRAINT payment_intents_booking_fkey
  FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;

ALTER TABLE public.payment_intents
  DROP CONSTRAINT IF EXISTS payment_intents_tutor_fkey;
ALTER TABLE public.payment_intents
  ADD CONSTRAINT payment_intents_tutor_fkey
  FOREIGN KEY (tutor_clerk_id) REFERENCES public.users(clerk_id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_payment_intents_wallet_deposit
  ON public.payment_intents (student_clerk_id, provider, created_at DESC)
  WHERE booking_id IS NULL;

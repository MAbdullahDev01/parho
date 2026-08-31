-- Phase 4: wallet ledger and per-booking escrow.
-- Amounts are stored in PKR minor units (paisa) as integers.

CREATE TABLE IF NOT EXISTS public.wallet_accounts (
  clerk_id text NOT NULL,
  available_amount bigint NOT NULL DEFAULT 0 CHECK (available_amount >= 0),
  held_amount bigint NOT NULL DEFAULT 0 CHECK (held_amount >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wallet_accounts_pkey PRIMARY KEY (clerk_id),
  CONSTRAINT wallet_accounts_user_fkey FOREIGN KEY (clerk_id)
    REFERENCES public.users(clerk_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clerk_id text NOT NULL,
  amount bigint NOT NULL CHECK (amount > 0),
  type text NOT NULL CHECK (type IN ('deposit', 'hold', 'release')),
  booking_id uuid NULL,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  stripe_checkout_session_id text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT wallet_transactions_user_fkey FOREIGN KEY (clerk_id)
    REFERENCES public.users(clerk_id) ON DELETE CASCADE,
  CONSTRAINT wallet_transactions_booking_fkey FOREIGN KEY (booking_id)
    REFERENCES public.bookings(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_clerk_created
  ON public.wallet_transactions (clerk_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_booking
  ON public.wallet_transactions (booking_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_deposit_checkout_session
  ON public.wallet_transactions (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL AND type = 'deposit';

ALTER TABLE public.wallet_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their wallet" ON public.wallet_accounts;
CREATE POLICY "Users can read their wallet"
  ON public.wallet_accounts FOR SELECT
  USING (clerk_id = auth.jwt() ->> 'sub');

DROP POLICY IF EXISTS "Users can read their transactions" ON public.wallet_transactions;
CREATE POLICY "Users can read their transactions"
  ON public.wallet_transactions FOR SELECT
  USING (clerk_id = auth.jwt() ->> 'sub');

CREATE OR REPLACE FUNCTION public.get_or_create_wallet(p_clerk_id text)
RETURNS public.wallet_accounts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result public.wallet_accounts;
BEGIN
  INSERT INTO wallet_accounts (clerk_id) VALUES (p_clerk_id)
  ON CONFLICT (clerk_id) DO NOTHING;
  SELECT * INTO result FROM wallet_accounts WHERE clerk_id = p_clerk_id;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.credit_wallet_deposit(
  p_clerk_id text,
  p_amount bigint,
  p_checkout_session_id text
)
RETURNS public.wallet_accounts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result public.wallet_accounts;
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Deposit amount must be positive.'; END IF;
  INSERT INTO wallet_accounts (clerk_id) VALUES (p_clerk_id) ON CONFLICT (clerk_id) DO NOTHING;
  IF EXISTS (
    SELECT 1 FROM wallet_transactions
    WHERE stripe_checkout_session_id = p_checkout_session_id AND type = 'deposit' AND status = 'completed'
  ) THEN
    SELECT * INTO result FROM wallet_accounts WHERE clerk_id = p_clerk_id;
    RETURN result;
  END IF;

  UPDATE wallet_accounts
  SET available_amount = available_amount + p_amount, updated_at = now()
  WHERE clerk_id = p_clerk_id;

  INSERT INTO wallet_transactions (clerk_id, amount, type, status, stripe_checkout_session_id)
  VALUES (p_clerk_id, p_amount, 'deposit', 'completed', p_checkout_session_id);

  SELECT * INTO result FROM wallet_accounts WHERE clerk_id = p_clerk_id;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_demo_booking_with_hold(
  p_student_clerk_id text,
  p_tutor_clerk_id text,
  p_start_at timestamptz,
  p_amount bigint
)
RETURNS SETOF public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  booking_row public.bookings;
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Demo deposit must be positive.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM wallet_accounts WHERE clerk_id = p_student_clerk_id AND available_amount >= p_amount) THEN
    RAISE EXCEPTION 'Insufficient wallet balance. Add funds before booking this demo.';
  END IF;

  -- Reuse the existing booking validation and conflict rules.
  SELECT * INTO booking_row FROM create_demo_booking(p_student_clerk_id, p_tutor_clerk_id, p_start_at);

  UPDATE wallet_accounts
  SET available_amount = available_amount - p_amount,
      held_amount = held_amount + p_amount,
      updated_at = now()
  WHERE clerk_id = p_student_clerk_id AND available_amount >= p_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient wallet balance. Add funds before booking this demo.';
  END IF;

  INSERT INTO wallet_transactions (clerk_id, amount, type, booking_id, status)
  VALUES (p_student_clerk_id, p_amount, 'hold', booking_row.id, 'completed');

  RETURN NEXT booking_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_booking_escrow(
  p_booking_id uuid,
  p_student_clerk_id text,
  p_tutor_clerk_id text
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  booking_row public.bookings;
  hold_amount bigint;
BEGIN
  SELECT * INTO booking_row FROM bookings WHERE id = p_booking_id FOR UPDATE;
  IF booking_row.id IS NULL THEN RAISE EXCEPTION 'Booking not found.'; END IF;
  IF booking_row.student_clerk_id <> p_student_clerk_id OR booking_row.tutor_clerk_id <> p_tutor_clerk_id THEN
    RAISE EXCEPTION 'Booking participants do not match.';
  END IF;

  SELECT amount INTO hold_amount
  FROM wallet_transactions
  WHERE booking_id = p_booking_id AND clerk_id = p_student_clerk_id AND type = 'hold' AND status = 'completed'
  ORDER BY created_at DESC LIMIT 1;

  IF hold_amount IS NULL THEN RAISE EXCEPTION 'No active escrow hold exists for this booking.'; END IF;

  IF EXISTS (
    SELECT 1 FROM wallet_transactions
    WHERE booking_id = p_booking_id AND type = 'release' AND status = 'completed'
  ) THEN
    RETURN booking_row;
  END IF;

  UPDATE wallet_accounts
  SET held_amount = held_amount - hold_amount, updated_at = now()
  WHERE clerk_id = p_student_clerk_id AND held_amount >= hold_amount;
  IF NOT FOUND THEN RAISE EXCEPTION 'Escrow balance is inconsistent.'; END IF;

  INSERT INTO wallet_accounts (clerk_id) VALUES (p_tutor_clerk_id)
  ON CONFLICT (clerk_id) DO NOTHING;
  UPDATE wallet_accounts
  SET available_amount = available_amount + hold_amount, updated_at = now()
  WHERE clerk_id = p_tutor_clerk_id;

  INSERT INTO wallet_transactions (clerk_id, amount, type, booking_id, status)
  VALUES (p_tutor_clerk_id, hold_amount, 'release', p_booking_id, 'completed');

  RETURN booking_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_wallet(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.credit_wallet_deposit(text, bigint, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_demo_booking_with_hold(text, text, timestamptz, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_booking_escrow(uuid, text, text) TO service_role;

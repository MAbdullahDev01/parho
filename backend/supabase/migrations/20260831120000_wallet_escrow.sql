-- Phase 4: wallet ledger and simple booking escrow.
-- Provider-independent: payment gateways can be integrated later.

CREATE TABLE IF NOT EXISTS public.wallet_accounts (
  clerk_id text NOT NULL,
  currency text NOT NULL DEFAULT 'PKR' CHECK (currency = 'PKR'),
  available_balance numeric(12,2) NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
  held_balance numeric(12,2) NOT NULL DEFAULT 0 CHECK (held_balance >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wallet_accounts_pkey PRIMARY KEY (clerk_id),
  CONSTRAINT wallet_accounts_user_fkey FOREIGN KEY (clerk_id) REFERENCES public.users(clerk_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clerk_id text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  type text NOT NULL CHECK (type IN ('deposit', 'hold', 'release')),
  booking_id uuid,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'disputed')),
  provider text,
  provider_reference text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT wallet_transactions_user_fkey FOREIGN KEY (clerk_id) REFERENCES public.users(clerk_id) ON DELETE CASCADE,
  CONSTRAINT wallet_transactions_booking_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_clerk_created ON public.wallet_transactions (clerk_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_booking ON public.wallet_transactions (booking_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_provider_reference ON public.wallet_transactions (provider, provider_reference) WHERE provider_reference IS NOT NULL;

ALTER TABLE public.wallet_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their wallet" ON public.wallet_accounts;
CREATE POLICY "Users can read their wallet" ON public.wallet_accounts FOR SELECT USING (clerk_id = auth.jwt() ->> 'sub');
DROP POLICY IF EXISTS "Users can read their transactions" ON public.wallet_transactions;
CREATE POLICY "Users can read their transactions" ON public.wallet_transactions FOR SELECT USING (clerk_id = auth.jwt() ->> 'sub');

CREATE OR REPLACE FUNCTION public.set_wallet_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS wallet_accounts_updated_at ON public.wallet_accounts;
CREATE TRIGGER wallet_accounts_updated_at BEFORE UPDATE ON public.wallet_accounts FOR EACH ROW EXECUTE FUNCTION public.set_wallet_updated_at();

CREATE OR REPLACE FUNCTION public.wallet_record_deposit(p_clerk_id text, p_amount numeric, p_provider text DEFAULT NULL, p_provider_reference text DEFAULT NULL, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS SETOF public.wallet_transactions LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Deposit amount must be greater than zero.'; END IF;
  INSERT INTO wallet_accounts (clerk_id) VALUES (p_clerk_id) ON CONFLICT (clerk_id) DO NOTHING;
  INSERT INTO wallet_transactions (clerk_id, amount, type, status, provider, provider_reference, metadata)
    VALUES (p_clerk_id, p_amount, 'deposit', 'completed', p_provider, p_provider_reference, p_metadata) RETURNING id INTO v_id;
  UPDATE wallet_accounts SET available_balance = available_balance + p_amount WHERE clerk_id = p_clerk_id;
  RETURN QUERY SELECT * FROM wallet_transactions WHERE id = v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.wallet_hold_booking(p_student_clerk_id text, p_booking_id uuid, p_amount numeric)
RETURNS SETOF public.wallet_transactions LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid; v_available numeric;
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Hold amount must be greater than zero.'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_booking_id::text, 0));
  IF NOT EXISTS (SELECT 1 FROM bookings WHERE id = p_booking_id AND student_clerk_id = p_student_clerk_id AND status = 'confirmed') THEN RAISE EXCEPTION 'Booking is not eligible for a payment hold.'; END IF;
  IF EXISTS (SELECT 1 FROM wallet_transactions WHERE booking_id = p_booking_id AND type = 'hold' AND status = 'completed') THEN RAISE EXCEPTION 'Booking payment is already held.'; END IF;
  INSERT INTO wallet_accounts (clerk_id) VALUES (p_student_clerk_id) ON CONFLICT (clerk_id) DO NOTHING;
  SELECT available_balance INTO v_available FROM wallet_accounts WHERE clerk_id = p_student_clerk_id FOR UPDATE;
  IF v_available < p_amount THEN RAISE EXCEPTION 'Insufficient wallet balance.'; END IF;
  INSERT INTO wallet_transactions (clerk_id, amount, type, booking_id, status) VALUES (p_student_clerk_id, p_amount, 'hold', p_booking_id, 'completed') RETURNING id INTO v_id;
  UPDATE wallet_accounts SET available_balance = available_balance - p_amount, held_balance = held_balance + p_amount WHERE clerk_id = p_student_clerk_id;
  RETURN QUERY SELECT * FROM wallet_transactions WHERE id = v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.wallet_release_booking(p_student_clerk_id text, p_tutor_clerk_id text, p_booking_id uuid)
RETURNS SETOF public.wallet_transactions LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_amount numeric; v_id uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_booking_id::text, 0));
  SELECT amount INTO v_amount FROM wallet_transactions WHERE booking_id = p_booking_id AND clerk_id = p_student_clerk_id AND type = 'hold' AND status = 'completed' ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
  IF v_amount IS NULL THEN RAISE EXCEPTION 'No active payment hold exists for this booking.'; END IF;
  IF NOT EXISTS (SELECT 1 FROM bookings WHERE id = p_booking_id AND student_clerk_id = p_student_clerk_id AND tutor_clerk_id = p_tutor_clerk_id AND status = 'completed') THEN RAISE EXCEPTION 'Booking is not eligible for release.'; END IF;
  IF EXISTS (SELECT 1 FROM wallet_transactions WHERE booking_id = p_booking_id AND type = 'release' AND status = 'completed') THEN RAISE EXCEPTION 'Booking payment has already been released.'; END IF;
  INSERT INTO wallet_accounts (clerk_id) VALUES (p_tutor_clerk_id) ON CONFLICT (clerk_id) DO NOTHING;
  INSERT INTO wallet_transactions (clerk_id, amount, type, booking_id, status, metadata) VALUES (p_tutor_clerk_id, v_amount, 'release', p_booking_id, 'completed', jsonb_build_object('source_clerk_id', p_student_clerk_id)) RETURNING id INTO v_id;
  UPDATE wallet_accounts SET held_balance = held_balance - v_amount WHERE clerk_id = p_student_clerk_id;
  UPDATE wallet_accounts SET available_balance = available_balance + v_amount WHERE clerk_id = p_tutor_clerk_id;
  RETURN QUERY SELECT * FROM wallet_transactions WHERE id = v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.wallet_record_deposit(text,numeric,text,text,jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.wallet_hold_booking(text,uuid,numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.wallet_release_booking(text,text,uuid) TO service_role;

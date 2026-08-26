-- Keep an audit identity for every human tutor verification decision.
-- The value is the authenticated admin's Clerk user ID.

alter table public.tutor_profiles
  add column if not exists verification_decided_by text;

create index if not exists tutor_profiles_verification_decided_by_idx
  on public.tutor_profiles (verification_decided_by);

-- Automated transcript screening is advisory only.
-- Human admin approval remains the source of truth for verification.

alter table public.tutor_profiles
  add column if not exists auto_verification_status text not null default 'not_run',
  add column if not exists auto_verification_score numeric(5,2),
  add column if not exists auto_verification_flags jsonb not null default '[]'::jsonb,
  add column if not exists auto_verification_summary text,
  add column if not exists auto_verified_at timestamptz;

alter table public.tutor_profiles
  drop constraint if exists tutor_profiles_auto_verification_status_check;

alter table public.tutor_profiles
  add constraint tutor_profiles_auto_verification_status_check
  check (auto_verification_status in ('not_run', 'running', 'passed', 'flagged', 'error'));

alter table public.tutor_profiles
  drop constraint if exists tutor_profiles_auto_verification_score_check;

alter table public.tutor_profiles
  add constraint tutor_profiles_auto_verification_score_check
  check (auto_verification_score is null or (auto_verification_score >= 0 and auto_verification_score <= 100));

create index if not exists tutor_profiles_auto_verification_status_idx
  on public.tutor_profiles (auto_verification_status);

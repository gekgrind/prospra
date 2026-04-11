-- Shared identity foundation for Entrepreneuria ecosystem apps.
-- Safe to run on existing Prospra databases.

alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists ecosystem_metadata jsonb not null default '{}'::jsonb;

create index if not exists profiles_stripe_customer_id_idx
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

create index if not exists profiles_plan_tier_subscription_status_idx
  on public.profiles (plan_tier, subscription_status);

-- A stable projection that other Entrepreneuria apps can read as the shared profile contract.
create or replace view public.shared_user_profiles
with (security_invoker = true) as
select
  id,
  email,
  full_name,
  plan_tier,
  stripe_customer_id,
  stripe_subscription_id,
  subscription_status,
  subscription_provider,
  has_prospra_access,
  has_synceri_access,
  ecosystem_metadata,
  created_at,
  updated_at
from public.profiles;

-- Preserve access control through existing RLS on profiles.
grant select on public.shared_user_profiles to authenticated;

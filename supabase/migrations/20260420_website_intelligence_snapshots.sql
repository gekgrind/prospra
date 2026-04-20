create extension if not exists pgcrypto;

create table if not exists public.website_intelligence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  website_url text,
  homepage_summary text,
  offer_clarity_score integer,
  seo_score integer,
  ux_score integer,
  cta_score integer,
  funnel_summary text,
  key_issues jsonb not null default '[]'::jsonb,
  recommended_fixes jsonb not null default '[]'::jsonb,
  raw_signals jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists website_intelligence_user_id_idx
  on public.website_intelligence (user_id);

create index if not exists website_intelligence_user_id_updated_at_idx
  on public.website_intelligence (user_id, updated_at desc);

create or replace function public.set_website_intelligence_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists website_intelligence_set_updated_at on public.website_intelligence;

create trigger website_intelligence_set_updated_at
before update on public.website_intelligence
for each row
execute function public.set_website_intelligence_updated_at();

alter table public.website_intelligence enable row level security;

drop policy if exists "website_intelligence_select_own" on public.website_intelligence;
create policy "website_intelligence_select_own"
  on public.website_intelligence
  for select
  using (auth.uid() = user_id);

drop policy if exists "website_intelligence_insert_own" on public.website_intelligence;
create policy "website_intelligence_insert_own"
  on public.website_intelligence
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "website_intelligence_update_own" on public.website_intelligence;
create policy "website_intelligence_update_own"
  on public.website_intelligence
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "website_intelligence_delete_own" on public.website_intelligence;
create policy "website_intelligence_delete_own"
  on public.website_intelligence
  for delete
  using (auth.uid() = user_id);

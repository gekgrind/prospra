-- Optional memory-layer tables for context-aware mentor architecture

create table if not exists public.strategic_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_focus text,
  top_priorities jsonb not null default '[]'::jsonb,
  known_problems jsonb not null default '[]'::jsonb,
  opportunities jsonb not null default '[]'::jsonb,
  current_offer_summary text,
  current_growth_stage text,
  last_updated timestamptz not null default now()
);

create index if not exists idx_strategic_state_last_updated
  on public.strategic_state(last_updated desc);

alter table public.strategic_state enable row level security;


drop policy if exists "strategic_state_select_own" on public.strategic_state;
drop policy if exists "strategic_state_insert_own" on public.strategic_state;
drop policy if exists "strategic_state_update_own" on public.strategic_state;
drop policy if exists "strategic_state_delete_own" on public.strategic_state;

create policy "strategic_state_select_own"
  on public.strategic_state
  for select
  using (auth.uid() = user_id);

create policy "strategic_state_insert_own"
  on public.strategic_state
  for insert
  with check (auth.uid() = user_id);

create policy "strategic_state_update_own"
  on public.strategic_state
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "strategic_state_delete_own"
  on public.strategic_state
  for delete
  using (auth.uid() = user_id);

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
  updated_at timestamptz not null default now()
);

create index if not exists idx_website_intelligence_user_id
  on public.website_intelligence(user_id);

create index if not exists idx_website_intelligence_updated_at
  on public.website_intelligence(updated_at desc);

alter table public.website_intelligence enable row level security;


drop policy if exists "website_intelligence_select_own" on public.website_intelligence;
drop policy if exists "website_intelligence_insert_own" on public.website_intelligence;
drop policy if exists "website_intelligence_update_own" on public.website_intelligence;
drop policy if exists "website_intelligence_delete_own" on public.website_intelligence;

create policy "website_intelligence_select_own"
  on public.website_intelligence
  for select
  using (auth.uid() = user_id);

create policy "website_intelligence_insert_own"
  on public.website_intelligence
  for insert
  with check (auth.uid() = user_id);

create policy "website_intelligence_update_own"
  on public.website_intelligence
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "website_intelligence_delete_own"
  on public.website_intelligence
  for delete
  using (auth.uid() = user_id);

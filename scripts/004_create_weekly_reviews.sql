-- Weekly founder review snapshots (rolling 7-day windows)
create table if not exists public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  window_type text not null default 'rolling_7d',
  summary_data jsonb not null default '{}'::jsonb,
  narrative jsonb not null default '{}'::jsonb,
  generated_with_ai boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weekly_reviews_window_type_check check (window_type in ('rolling_7d')),
  constraint weekly_reviews_period_check check (period_end >= period_start)
);

create unique index if not exists weekly_reviews_user_window_unique
  on public.weekly_reviews (user_id, window_type, period_start, period_end);

create index if not exists weekly_reviews_user_created_idx
  on public.weekly_reviews (user_id, created_at desc);

alter table public.weekly_reviews enable row level security;

create policy "weekly_reviews_select_own"
  on public.weekly_reviews for select
  using (auth.uid() = user_id);

create policy "weekly_reviews_insert_own"
  on public.weekly_reviews for insert
  with check (auth.uid() = user_id);

create policy "weekly_reviews_update_own"
  on public.weekly_reviews for update
  using (auth.uid() = user_id);

create policy "weekly_reviews_delete_own"
  on public.weekly_reviews for delete
  using (auth.uid() = user_id);

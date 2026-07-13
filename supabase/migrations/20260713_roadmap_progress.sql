-- Roadmap progress: one row per user tracking completed roadmap step ids.
-- The roadmap definition itself (stages/steps) is static app content in lib/roadmap.ts.

create table if not exists public.roadmap_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  completed_step_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_roadmap_progress_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists roadmap_progress_set_updated_at on public.roadmap_progress;
create trigger roadmap_progress_set_updated_at
  before update on public.roadmap_progress
  for each row
  execute function public.set_roadmap_progress_updated_at();

alter table public.roadmap_progress enable row level security;

drop policy if exists roadmap_progress_select_own on public.roadmap_progress;
create policy roadmap_progress_select_own
  on public.roadmap_progress
  for select
  using (auth.uid() = user_id);

drop policy if exists roadmap_progress_insert_own on public.roadmap_progress;
create policy roadmap_progress_insert_own
  on public.roadmap_progress
  for insert
  with check (auth.uid() = user_id);

drop policy if exists roadmap_progress_update_own on public.roadmap_progress;
create policy roadmap_progress_update_own
  on public.roadmap_progress
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists roadmap_progress_delete_own on public.roadmap_progress;
create policy roadmap_progress_delete_own
  on public.roadmap_progress
  for delete
  using (auth.uid() = user_id);

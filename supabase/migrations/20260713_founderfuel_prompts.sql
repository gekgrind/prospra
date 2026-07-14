-- FounderFuel prompt history: generations and saved prompts per user.

create table if not exists public.founderfuel_prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id text,
  title text not null,
  prompt_text text not null,
  is_saved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists founderfuel_prompts_user_id_created_at_idx
  on public.founderfuel_prompts (user_id, created_at desc);

alter table public.founderfuel_prompts enable row level security;

drop policy if exists founderfuel_prompts_select_own on public.founderfuel_prompts;
create policy founderfuel_prompts_select_own
  on public.founderfuel_prompts
  for select
  using (auth.uid() = user_id);

drop policy if exists founderfuel_prompts_insert_own on public.founderfuel_prompts;
create policy founderfuel_prompts_insert_own
  on public.founderfuel_prompts
  for insert
  with check (auth.uid() = user_id);

drop policy if exists founderfuel_prompts_update_own on public.founderfuel_prompts;
create policy founderfuel_prompts_update_own
  on public.founderfuel_prompts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists founderfuel_prompts_delete_own on public.founderfuel_prompts;
create policy founderfuel_prompts_delete_own
  on public.founderfuel_prompts
  for delete
  using (auth.uid() = user_id);

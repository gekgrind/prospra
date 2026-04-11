-- Create action plans table for trackable execution plans tied to mentor conversations
create table if not exists public.action_plans (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  tasks jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint action_plans_conversation_unique unique (conversation_id)
);

alter table public.action_plans enable row level security;

create policy "action_plans_select_own"
  on public.action_plans for select
  using (auth.uid() = user_id);

create policy "action_plans_insert_own"
  on public.action_plans for insert
  with check (auth.uid() = user_id);

create policy "action_plans_update_own"
  on public.action_plans for update
  using (auth.uid() = user_id);

create policy "action_plans_delete_own"
  on public.action_plans for delete
  using (auth.uid() = user_id);

create index if not exists action_plans_user_updated_idx
  on public.action_plans (user_id, updated_at desc);

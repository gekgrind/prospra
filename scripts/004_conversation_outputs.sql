-- Conversation-derived mentor outputs (insights + action plan)
create table if not exists public.conversation_outputs (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null unique references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  summary text not null,
  insights text[] not null,
  action_plan text[] not null,
  recommended_priority text not null,
  risk_or_blocker text not null,
  source_message_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_conversation_outputs_user_id
  on public.conversation_outputs(user_id);

create index if not exists idx_conversation_outputs_updated_at
  on public.conversation_outputs(updated_at desc);

alter table public.conversation_outputs enable row level security;

create policy "conversation_outputs_select_own"
  on public.conversation_outputs for select
  using (
    exists (
      select 1
      from public.conversations
      where conversations.id = conversation_outputs.conversation_id
      and conversations.user_id = auth.uid()
    )
  );

create policy "conversation_outputs_insert_own"
  on public.conversation_outputs for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.conversations
      where conversations.id = conversation_outputs.conversation_id
      and conversations.user_id = auth.uid()
    )
  );

create policy "conversation_outputs_update_own"
  on public.conversation_outputs for update
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.conversations
      where conversations.id = conversation_outputs.conversation_id
      and conversations.user_id = auth.uid()
    )
  );

create policy "conversation_outputs_delete_own"
  on public.conversation_outputs for delete
  using (
    auth.uid() = user_id
    and exists (
      select 1
      from public.conversations
      where conversations.id = conversation_outputs.conversation_id
      and conversations.user_id = auth.uid()
    )
  );

-- Lifecycle email event log table
create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email_type text not null,
  status text not null check (status in ('sent', 'failed', 'skipped')),
  related_entity_id text,
  provider_message_id text,
  trigger_context jsonb,
  error_message text,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_email_events_user_type_sent_at
  on public.email_events (user_id, email_type, sent_at desc);

create index if not exists idx_email_events_status_created_at
  on public.email_events (status, created_at desc);

alter table public.email_events enable row level security;

create policy "email_events_select_own"
  on public.email_events for select
  using (auth.uid() = user_id);

create policy "email_events_insert_service_or_owner"
  on public.email_events for insert
  with check (auth.role() = 'service_role' or auth.uid() = user_id);

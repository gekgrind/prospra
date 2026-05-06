create table if not exists public.mentor_memory_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  memory_scope text not null check (memory_scope in ('mentor', 'journal', 'strategy', 'cross_app')),
  memory_text text not null,
  source_ref text not null,
  confidence numeric not null default 0.6 check (confidence >= 0 and confidence <= 1),
  created_at timestamptz not null default now()
);

create index if not exists mentor_memory_entries_user_created_idx
  on public.mentor_memory_entries (user_id, created_at desc);

create table if not exists public.founder_score_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action_plan_completion numeric not null default 0 check (action_plan_completion >= 0 and action_plan_completion <= 1),
  mentor_consistency numeric not null default 0 check (mentor_consistency >= 0 and mentor_consistency <= 1),
  website_clarity numeric not null default 0 check (website_clarity >= 0 and website_clarity <= 1),
  revenue_readiness numeric not null default 0 check (revenue_readiness >= 0 and revenue_readiness <= 1),
  execution_velocity numeric not null default 0 check (execution_velocity >= 0 and execution_velocity <= 1),
  created_at timestamptz not null default now()
);

create index if not exists founder_score_signals_user_created_idx
  on public.founder_score_signals (user_id, created_at desc);

create table if not exists public.shared_intelligence_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_app text not null,
  insight_key text not null,
  insight_summary text not null,
  insight_payload jsonb not null default '{}'::jsonb,
  priority int not null default 50,
  created_at timestamptz not null default now()
);

create index if not exists shared_intelligence_insights_user_app_idx
  on public.shared_intelligence_insights (user_id, source_app, priority desc, created_at desc);

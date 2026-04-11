-- Add monetization columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plan_tier TEXT NOT NULL DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ;

-- Usage event ledger (monthly quota tracking)
CREATE TABLE IF NOT EXISTS public.usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_type TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 1 CHECK (amount > 0),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS usage_events_user_type_created_idx
  ON public.usage_events (user_id, usage_type, created_at DESC);

ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_events_select_own"
  ON public.usage_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "usage_events_insert_own"
  ON public.usage_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

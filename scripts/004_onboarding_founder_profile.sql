-- Comprehensive onboarding profile storage (depth onboarding v1)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS has_website BOOLEAN,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS onboarding_responses JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS onboarding_sections JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS founder_profile JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

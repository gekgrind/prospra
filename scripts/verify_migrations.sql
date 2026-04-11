-- Verification script to check if migrations were applied correctly

-- 1. Check if onboarding columns exist in profiles table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN (
    'name', 'stage', 'website', 'audience', 'offer',
    'goal90', 'challenge', 'onboarding_complete', 'onboarding_step'
  )
ORDER BY column_name;

-- Expected: Should return 9 rows

-- 2. Check if trigger function exists
SELECT
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'handle_new_user';

-- Expected: Should return 1 row

-- 3. Check if trigger exists
SELECT
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- Expected: Should return 1 row with enabled = 'O' (origin)

-- 4. Check profiles table structure
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Expected: Should show all columns including new onboarding fields

-- 5. Verify feedback table + status/type columns
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'feedback_items'
ORDER BY ordinal_position;

-- Expected: feedback table columns including feedback_type, context, status

-- 6. Verify feedback RLS policies
SELECT
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'feedback_items'
ORDER BY policyname;

-- Expected: user insert/select + admin select/update policies

-- 7. Test query - List all profiles with onboarding status
SELECT
  id,
  email,
  name,
  onboarding_complete,
  onboarding_step,
  created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;

-- This shows recent profiles and their onboarding status

-- 6. Check monetization profile columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name IN ('plan_tier', 'subscription_status', 'is_premium', 'premium_expires_at')
ORDER BY column_name;

-- 7. Check usage_events exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'usage_events';

-- 8. Recent usage events sample
SELECT id, user_id, usage_type, amount, created_at
FROM public.usage_events
ORDER BY created_at DESC
LIMIT 20;

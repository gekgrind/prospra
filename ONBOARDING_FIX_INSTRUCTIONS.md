# Onboarding Fix Instructions

## Overview
This fix resolves the onboarding issues where users couldn't complete the signup flow due to database schema mismatches and middleware redirect problems.

## Issues Fixed
1. ✅ Missing database columns for onboarding fields
2. ✅ No automatic profile creation on user signup
3. ✅ Middleware blocking access to `/onboarding` page
4. ✅ Poor error handling in onboarding flow

## Step-by-Step Implementation

### Step 1: Run Database Migrations

You need to run the SQL migrations in order. Connect to your Supabase database and execute:

#### Migration 1: Add Onboarding Fields
```bash
# In Supabase SQL Editor, run:
scripts/002_add_onboarding_fields.sql
```

This adds the following columns to the `profiles` table:
- `name`
- `stage`
- `website`
- `audience`
- `offer`
- `goal90`
- `challenge`
- `onboarding_complete`
- `onboarding_step`

#### Migration 2: Auto-Create Profile Trigger
```bash
# In Supabase SQL Editor, run:
scripts/003_auto_create_profile.sql
```

This creates:
- A trigger function `handle_new_user()` that automatically creates a profile when a user signs up
- A trigger `on_auth_user_created` that fires after user creation

### Step 2: Verify Code Changes

The following files have been updated:

1. **`app/proxy.ts`** - Middleware now allows access to `/onboarding` page
2. **`app/onboarding/page.tsx`** - Better error handling for missing profiles

### Step 3: Test the Flow

1. **Clear existing test users** (optional, but recommended):
   - Go to Supabase Dashboard → Authentication → Users
   - Delete any test users that don't have complete profiles

2. **Test signup flow**:
   ```
   1. Navigate to /auth/sign-up
   2. Create a new account
   3. Verify you're redirected to /onboarding
   4. Fill out all 6 steps
   5. Click "Finish"
   6. Verify you're redirected to /dashboard
   ```

3. **Test middleware**:
   - With middleware.ts present, verify the above flow works
   - Verify logged-in users can't access /auth/* pages
   - Verify logged-out users can't access /dashboard

### Step 4: Verify Database

After a successful signup, check your Supabase database:

```sql
-- Verify profile was created automatically
SELECT id, email, onboarding_complete, onboarding_step
FROM profiles
ORDER BY created_at DESC
LIMIT 5;

-- After completing onboarding, verify data was saved
SELECT id, email, name, industry, stage, onboarding_complete
FROM profiles
WHERE onboarding_complete = true;
```

## Troubleshooting

### Issue: "Failed to save" error when clicking Finish

**Cause**: Database columns don't exist
**Solution**: Make sure you ran migration `002_add_onboarding_fields.sql`

### Issue: User redirected to homepage after signup

**Cause**: Profile wasn't created automatically
**Solution**:
1. Run migration `003_auto_create_profile.sql`
2. Verify trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

### Issue: Infinite redirect loop

**Cause**: Middleware is blocking `/onboarding` access
**Solution**: Verify `app/proxy.ts` includes the `isOnboarding` check

### Issue: 401 Unauthorized on API calls

**Cause**: Session cookies not being sent properly
**Solution**: All API calls include `credentials: "include"` - this is already fixed

## Rollback Instructions

If you need to rollback these changes:

### Rollback Database Changes
```sql
-- Remove trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Remove columns (WARNING: This deletes data!)
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS name,
DROP COLUMN IF EXISTS stage,
DROP COLUMN IF EXISTS website,
DROP COLUMN IF EXISTS audience,
DROP COLUMN IF EXISTS offer,
DROP COLUMN IF EXISTS goal90,
DROP COLUMN IF EXISTS challenge,
DROP COLUMN IF EXISTS onboarding_complete,
DROP COLUMN IF EXISTS onboarding_step;
```

### Rollback Code Changes
```bash
git checkout app/proxy.ts
git checkout app/onboarding/page.tsx
```

## Additional Notes

- **Existing Users**: If you have existing users without profiles, you'll need to manually create profile records for them or they won't be able to log in
- **Data Migration**: If you have existing users with the old schema, you may need a data migration script to map old fields to new fields
- **Environment**: Make sure your `.env.local` has correct Supabase credentials

## Questions or Issues?

If you encounter any issues:
1. Check the browser console for error messages
2. Check the Supabase logs for database errors
3. Verify all migrations ran successfully
4. Test with a fresh user account

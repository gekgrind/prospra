# Database Scripts

This directory contains SQL scripts for setting up and managing the Prospra database.

## Migration Order

Run these scripts in order:

1. **`001_create_profiles.sql`** - Creates the initial database schema
   - Creates `profiles`, `journal_entries`, `conversations`, `messages`, and `documents` tables
   - Sets up Row Level Security (RLS) policies

2. **`002_add_onboarding_fields.sql`** - Adds onboarding fields to profiles
   - Adds: `name`, `stage`, `website`, `audience`, `offer`, `goal90`, `challenge`
   - Adds: `onboarding_complete`, `onboarding_step`
   - **Safe to run**: Uses `ADD COLUMN IF NOT EXISTS`, won't break existing data

3. **`003_auto_create_profile.sql`** - Sets up automatic profile creation
   - Creates trigger function to auto-create profiles on user signup
   - Ensures every new user gets a profile record immediately

## Verification

After running migrations, use:

```bash
scripts/verify_migrations.sql
```

This checks:
- All required columns exist
- Trigger function is created
- Trigger is active
- Shows current profile data

## Running Migrations

### Via Supabase Dashboard
1. Go to your Supabase project
2. Navigate to SQL Editor
3. Click "New Query"
4. Copy/paste the SQL from each script
5. Click "Run"

### Via Supabase CLI
```bash
# If you have supabase CLI installed
supabase db reset
# This runs all migrations in order
```

## Important Notes

- These scripts use `IF NOT EXISTS` and `IF EXISTS` clauses to be idempotent
- Safe to run multiple times
- Won't delete existing data
- Preserves old schema fields (`full_name`, `business_idea`, `experience_level`) for backward compatibility

## Troubleshooting

If migrations fail:

1. **Check permissions**: Make sure you have database admin access
2. **Check syntax**: Copy/paste the entire file, don't run partial scripts
3. **Check order**: Run in numerical order (001, 002, 003)
4. **Check logs**: View Supabase logs for detailed error messages

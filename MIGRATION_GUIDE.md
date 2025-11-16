# Database Migration Guide

## Applying the Platform Architecture Migration

Two migration files need to be applied:

1. **Platform Architecture**: `supabase/migrations/20251116000000_platform_architecture.sql`
2. **Sample Games**: `supabase/migrations/20251116000001_sample_games.sql`

## Option 1: Supabase Dashboard (Recommended)

**Step 1: Apply Platform Architecture**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `supabase/migrations/20251116000000_platform_architecture.sql`
5. Paste into the query editor
6. Click **Run** to execute the migration
7. Verify tables were created in the **Table Editor**

**Step 2: Add Sample Games (Optional but Recommended)**
1. In SQL Editor, click **New Query**
2. Copy the contents of `supabase/migrations/20251116000001_sample_games.sql`
3. Paste into the query editor
4. Click **Run**
5. Verify games appear in `game_projects` and `game_store_listings` tables

## Option 2: Supabase CLI

If you have the Supabase CLI installed:

```bash
# Link your project (one-time setup)
supabase link --project-ref YOUR_PROJECT_REF

# Apply all pending migrations
supabase db push

# Or apply a specific migration
supabase migration up
```

## Option 3: Direct Database Connection

Using `psql` or another PostgreSQL client:

```bash
psql postgresql://YOUR_CONNECTION_STRING < supabase/migrations/20251116000000_platform_architecture.sql
```

## Verification Checklist

After running the migration, verify these tables exist:

- [ ] `user_profiles`
- [ ] `developer_profiles`
- [ ] `game_projects`
- [ ] `game_store_listings`
- [ ] `game_assets`
- [ ] `grind_wallets`
- [ ] `grind_transactions`
- [ ] `game_reviews`
- [ ] `game_analytics`
- [ ] `game_access`

### Check Row Level Security

Run this query to verify RLS is enabled:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'user_profiles',
  'developer_profiles',
  'game_projects',
  'game_store_listings',
  'game_assets',
  'grind_wallets',
  'grind_transactions',
  'game_reviews',
  'game_analytics',
  'game_access'
);
```

All tables should have `rowsecurity = true`.

### Check Triggers

Verify automatic functions are working:

```sql
-- List all triggers
SELECT
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```

You should see triggers for:
- `update_game_rating_on_review` - Updates average rating
- `process_transaction` - Handles wallet balance updates
- `update_*_updated_at` - Auto-updates timestamps

## Testing the Migration

### 1. Create a Test User Profile

```sql
-- Replace with your auth user ID
INSERT INTO user_profiles (id, username, role)
VALUES ('YOUR_USER_ID', 'testuser', 'player');
```

### 2. Create a Test Developer Profile

```sql
-- Upgrade user to developer
UPDATE user_profiles
SET role = 'developer'
WHERE username = 'testuser';

-- Create developer profile
INSERT INTO developer_profiles (id)
VALUES ('YOUR_USER_ID');
```

### 3. Create a Test Game Project

```sql
INSERT INTO game_projects (developer_id, title, description, status)
VALUES (
  'YOUR_USER_ID',
  'Test Game',
  'A test game project',
  'published'
);
```

### 4. Create a Test Wallet

```sql
INSERT INTO grind_wallets (user_id, balance)
VALUES ('YOUR_USER_ID', 1000);
```

### 5. Test Transaction Processing

```sql
-- Get wallet ID
SELECT id FROM grind_wallets WHERE user_id = 'YOUR_USER_ID';

-- Create a test transaction (should automatically update balance)
INSERT INTO grind_transactions (to_wallet_id, amount, transaction_type, description)
VALUES ('YOUR_WALLET_ID', 100, 'reward', 'Test reward');

-- Verify balance increased
SELECT balance FROM grind_wallets WHERE user_id = 'YOUR_USER_ID';
-- Should now be 1100
```

## Rollback (if needed)

If you need to rollback the migration:

```sql
-- WARNING: This will delete all platform data!

DROP TABLE IF EXISTS game_access CASCADE;
DROP TABLE IF EXISTS game_analytics CASCADE;
DROP TABLE IF EXISTS game_reviews CASCADE;
DROP TABLE IF EXISTS grind_transactions CASCADE;
DROP TABLE IF EXISTS grind_wallets CASCADE;
DROP TABLE IF EXISTS game_assets CASCADE;
DROP TABLE IF EXISTS game_store_listings CASCADE;
DROP TABLE IF EXISTS game_projects CASCADE;
DROP TABLE IF EXISTS developer_profiles CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_game_rating() CASCADE;
DROP FUNCTION IF EXISTS process_grind_transaction() CASCADE;

-- Remove added column from games table
ALTER TABLE games DROP COLUMN IF EXISTS game_project_id;
```

## Common Issues

### Issue: "relation already exists"
**Solution**: Tables already created, migration partially applied. Check which tables exist and manually create missing ones.

### Issue: RLS policies failing
**Solution**: Verify you're using `auth.uid()` correctly. Make sure user is authenticated when testing.

### Issue: Triggers not firing
**Solution**: Check function syntax. Ensure `update_updated_at_column()` function exists from previous migrations.

### Issue: Foreign key violations
**Solution**: Ensure parent records exist before inserting child records. Order matters when creating test data.

## Post-Migration Steps

1. **Create Your Profile**
   - Sign in to the app
   - Profile will be auto-created on first login

2. **Initialize Wallet**
   - Wallet will be auto-created when needed
   - Or manually create via API/service

3. **Upgrade to Developer** (optional)
   - Use the "Upgrade to Developer" feature in-app
   - Or manually update role in database

4. **Create Your First Game**
   - Use Developer Portal in-app
   - Or use `GameProjectService` directly

## Support

If you encounter issues:
1. Check Supabase logs in dashboard
2. Verify all tables and policies exist
3. Test RLS policies with different user contexts
4. Check trigger functions are executing

The migration is designed to be idempotent - you can run it multiple times safely using `IF NOT EXISTS` and `IF NOT EXISTS` checks.

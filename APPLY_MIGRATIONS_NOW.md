# ⚠️ REQUIRED: Apply Database Migrations

Your app needs database tables to work. Follow these steps **right now**:

## Quick Fix (5 minutes)

### Step 1: Open Supabase Dashboard

Go to: https://supabase.com/dashboard/project/zwokzeyclzyptltesazj

### Step 2: Apply Platform Architecture

1. Click **SQL Editor** in the left sidebar
2. Click **New Query** button (top right)
3. Open this file in your editor: `supabase/migrations/20251116000000_platform_architecture.sql`
4. Copy **ALL** the contents
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)
7. ✅ You should see "Success. No rows returned"

### Step 3: Apply Sample Games

1. Still in SQL Editor, click **New Query** again
2. Open this file: `supabase/migrations/20251116000001_sample_games.sql`
3. Copy **ALL** the contents
4. Paste into the SQL Editor
5. Click **Run**
6. ✅ You should see "Success. No rows returned"

### Step 4: Verify It Worked

1. In Supabase Dashboard, click **Table Editor**
2. You should see these tables:
   - ✅ user_profiles
   - ✅ developer_profiles
   - ✅ game_projects
   - ✅ game_store_listings
   - ✅ grind_wallets
   - ✅ grind_transactions

3. Click on `game_projects` table
4. ✅ You should see 5 sample games

### Step 5: Refresh Your App

1. Go back to your app at http://localhost:5173
2. Refresh the page (F5 or Cmd+R)
3. ✅ Click "Try as Guest"
4. ✅ You should see 5 games in the store
5. ✅ Click "Developer" button should work

## Why This Is Needed

Your Supabase database exists but is empty. These migrations create:
- User and developer profile tables
- Game project and store tables
- Currency (Grind tokens) system
- 5 pre-made sample games

## Troubleshooting

### "Error: relation already exists"
✅ Good! It means the migration already ran. Skip to the next one.

### "Error: permission denied"
❌ Make sure you're logged into the correct Supabase project.

### Can't find SQL Editor?
Look for the **SQL Editor** icon (looks like `</>`) in the left sidebar of your Supabase dashboard.

### Still not working?
Make sure you:
1. Applied BOTH migration files (in order)
2. Refreshed your app after applying
3. Are using the correct Supabase project

## Need More Help?

See the full guide: [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

---

**🚨 Your app will NOT work until these migrations are applied! 🚨**

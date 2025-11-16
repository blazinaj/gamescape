# Gamescape Quick Start Guide

## What Just Happened?

Your existing game has been transformed into a full platform with three integrated systems:

1. **Game Store** - Players discover and purchase games
2. **Developer Portal** - Create and publish games
3. **Play Mode** - Experience the games

## Next Steps

### 1. Apply Database Migration

The database schema needs to be updated. Choose one method:

**Option A: Supabase Dashboard (Easiest)**
1. Open https://supabase.com/dashboard
2. Go to your project
3. Click "SQL Editor" → "New Query"
4. Copy/paste contents of: `supabase/migrations/20251116000000_platform_architecture.sql`
5. Click "Run"

**Option B: Direct SQL**
```bash
# If you have psql or Supabase CLI
supabase db push
```

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed instructions.

### 2. Test the Platform

```bash
# Start development server
npm run dev
```

Open http://localhost:5173

### 3. Try the Guest Feature

**Instant Access Without Signup:**
1. Click "Get Started" on the landing page
2. Click "Try as Guest" button
3. Instantly logged in with a temporary account
4. Starts with 1,000 Grind tokens
5. Full platform access for testing

**Guest Account Features:**
- Auto-generated username (e.g., "Guest123456")
- Pre-loaded wallet with 1,000 G
- Full access to store and games
- Can create save files
- Perfect for onboarding and development testing

**Note:** Guest accounts are temporary. Create a real account to save progress permanently.

### 4. Create Your First Game Project

1. **Sign Up** - Create an account (or use guest)
2. **Upgrade to Developer** - Enable developer features
3. **Create Project** - Name your game and add description
4. **Configure** - Set game parameters and scenarios
5. **Publish** - Make it available in the store

## Understanding the New Structure

### File Organization

**New Platform Files:**
- `src/types/PlatformTypes.ts` - All platform entity types
- `src/types/AppTypes.ts` - Application state types
- `src/services/ProfileService.ts` - User/developer profiles
- `src/services/GameProjectService.ts` - Game CRUD
- `src/services/GameStoreService.ts` - Store operations
- `src/services/GrindTokenService.ts` - Token economy
- `src/hooks/useProfile.ts` - Profile management
- `src/hooks/useGrindWallet.ts` - Wallet state
- `src/components/MainMenu.tsx` - Landing page
- `src/components/GameStore.tsx` - Marketplace
- `src/components/DeveloperPortal.tsx` - Developer workspace

**Updated Files:**
- `src/App.tsx` - Now handles three modes (store/play/develop)

**Existing Game Files:** (Unchanged)
- All components in `src/components/`
- All game services in `src/services/`
- All game types in `src/types/`

### App Flow

```
User Opens App
    ↓
Not Authenticated? → MainMenu (Sign Up/Login)
    ↓
Authenticated → GameStore (Browse Games)
    ↓
    ├── Click "Play" → Play Mode (Game3D)
    ├── Click "Developer" → Developer Portal
    └── User Menu → Profile/Wallet/Settings
```

## Developer Workflow

### Creating a Game

1. **Access Developer Portal**
   - Click "Developer" button in store
   - Or upgrade role via profile

2. **Create New Project**
   - Click "New Project"
   - Enter title and description
   - Project starts in "draft" status

3. **Configure Game**
   - Set starting scenario
   - Configure engine parameters
   - Upload custom assets (future)

4. **Test Your Game**
   - Click "Test Play"
   - Experience the game as a player would
   - Iterate on configuration

5. **Publish**
   - Click "Publish" when ready
   - Game appears in store
   - Start earning from plays

### Monetization

**Free Games:**
- Set price to 0 Grind
- Attract more players
- Earn from platform rewards

**Paid Games:**
- Set price in Grind tokens
- 90% revenue goes to you
- 10% platform fee

## Player Workflow

### Discovering Games

1. **Browse Store**
   - Featured games section
   - Category browsing
   - Search functionality

2. **Check Details**
   - Read description
   - View screenshots
   - Check ratings and reviews

3. **Get Access**
   - Free games: Instant access
   - Paid games: Purchase with Grind
   - Games added to library

4. **Play**
   - Click "Play Now"
   - Enters Play Mode
   - Progress auto-saves

5. **Review**
   - Rate 1-5 stars
   - Write review text
   - Help other players decide

### Earning Grind Tokens

- Play games and complete achievements
- Participate in platform events
- Receive rewards for activity
- Transfer from other players

## Technical Details

### Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_OPENAI_API_KEY=your_openai_key
```

### Database Tables

**Platform Tables** (New):
- user_profiles, developer_profiles
- game_projects, game_store_listings
- grind_wallets, grind_transactions
- game_reviews, game_analytics, game_access

**Game Tables** (Existing):
- games, map_tiles, npc_states
- player_skills, player_inventory, player_equipment

### Security

All tables use Row Level Security (RLS):
- Users can only access their own data
- Developers can only modify their games
- Public can view published listings
- Wallet transactions are strictly controlled

## Common Issues

### "Tables don't exist"
**Solution**: Run the database migration

### "Permission denied"
**Solution**: Check RLS policies, ensure authenticated

### "Can't create game project"
**Solution**: Upgrade to developer role first

### "Game won't load"
**Solution**: Ensure game_project is published

## What's Next?

### Immediate Features

Current implementation includes:
- ✅ Multi-tenant architecture
- ✅ Game store and discovery
- ✅ Developer project management
- ✅ Token economy basics
- ✅ Reviews and ratings
- ✅ User profiles and roles

### Future Enhancements

Plan for expansion:
- Visual game editor
- Asset marketplace
- Multiplayer support
- Advanced analytics
- Social features
- Mobile apps

## Getting Help

**Documentation:**
- [README.md](./README.md) - Overview and setup
- [PLATFORM_ARCHITECTURE.md](./PLATFORM_ARCHITECTURE.md) - Technical details
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Database setup

**Code Examples:**
- Check existing services for patterns
- Review component implementations
- Examine type definitions

**Testing:**
- Use Developer Portal to create test games
- Test purchases with Grind tokens
- Verify RLS policies work correctly

## Congratulations!

You now have a fully functional game development platform. Start creating, publishing, and monetizing your games!

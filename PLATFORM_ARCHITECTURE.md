# Gamescape Platform Architecture

## Overview

Gamescape has been transformed from a single-game experience into a comprehensive **game development platform and marketplace**. The platform enables developers to create, publish, and monetize games while providing players with a curated store of AI-generated gaming experiences.

## Core Concepts

### Three User Roles

1. **Players** - Browse the game store, purchase/play games, earn Grind tokens
2. **Developers** - Create and publish games, manage projects, earn revenue
3. **Admins** - Platform management (future expansion)

### Three Operating Modes

1. **Store Mode** - Browse and discover games
2. **Play Mode** - Experience individual games
3. **Develop Mode** - Create and manage game projects

## Database Architecture

### User Management Tables

#### `user_profiles`
Extends Supabase auth.users with platform-specific information
- username, display_name, avatar, bio
- role (player/developer/admin)
- Publicly viewable profiles

#### `developer_profiles`
Additional information for developers
- studio_name, website
- total_games, total_revenue, rating
- verified status

### Game System Tables

#### `game_projects`
Developer-created games (templates/definitions)
- title, description, version
- status (draft/testing/published/archived)
- engine_config, game_settings, starting_scenario
- statistics (plays, players, rating)

#### `game_store_listings`
Public store presence for games
- visibility (public/unlisted/private)
- pricing (free or Grind tokens)
- marketing content (descriptions, screenshots, video)
- featured status

#### `games` (existing table, enhanced)
Player save files/instances
- Links to game_project_id
- Player position, progression, inventory
- Scenario data

#### `game_assets`
Developer-uploaded resources
- models, textures, audio, scripts, configs
- file metadata and storage URLs

### Token Economy Tables

#### `grind_wallets`
User token balances
- balance (current Grind tokens)
- lifetime_earned, lifetime_spent
- One wallet per user

#### `grind_transactions`
Complete transaction history
- from_wallet_id, to_wallet_id, amount
- transaction_type (purchase/reward/transfer/refund/developer_payout)
- Related game information
- Automatic balance updates via triggers

### Social & Analytics Tables

#### `game_reviews`
Player reviews and ratings
- 1-5 star rating
- review text, helpful count
- One review per user per game
- Automatic rating aggregation

#### `game_analytics`
Daily metrics per game
- plays_count, unique_players
- playtime statistics
- revenue tracking

#### `game_access`
Access control system
- Tracks who can play which games
- access_type (owned/trial/demo/developer)
- Expiration dates for trials

## Service Layer

### ProfileService
- User profile management
- Developer profile creation and updates
- Role upgrades (player → developer)

### GameProjectService
- CRUD operations for game projects
- Status management (draft → testing → published)
- Store listing creation and management
- Play count tracking

### GameStoreService
- Game discovery (featured, search, categories)
- User library management
- Access verification
- Review submission

### GrindTokenService
- Wallet management
- Transaction processing
- Game purchases with platform fee (10%)
- Reward distribution

## UI Components

### MainMenu
Entry point for unauthenticated users
- Platform introduction
- Authentication flow
- Feature highlights

### GameStore
Primary player interface
- Featured games showcase
- Search and filtering
- User wallet display
- Direct play access
- Developer portal link

### DeveloperPortal
Developer workspace
- Project management dashboard
- Creation tools
- Publishing workflow
- Analytics overview
- Revenue tracking

### Game3D (existing, enhanced)
3D game renderer
- Now supports multiple game projects
- Linked to game_project_id
- Player save system integration

## Security Model

All tables use Row Level Security (RLS):

- **User Profiles**: Public read, owner write
- **Developer Profiles**: Public read, owner write (requires developer role)
- **Game Projects**: Public read for published, owner full access
- **Store Listings**: Public read for visible listings, owner management
- **Wallets**: Owner-only access
- **Transactions**: Participants can view, system creates
- **Game Access**: User can view own access
- **Reviews**: Public read, owner write (requires game access)

## Token Economy

### Grind Token System

- **Platform Currency**: Grind (G)
- **Earning**: Rewards, achievements, gameplay
- **Spending**: Game purchases, premium features
- **Revenue Share**: 90% to developer, 10% platform fee
- **Automatic Processing**: Triggers handle balance updates

### Transaction Types
- `purchase` - Player buys game
- `reward` - System rewards player
- `transfer` - Player-to-player transfer
- `refund` - Purchase reversal
- `developer_payout` - Revenue distribution

## API Integration

### Existing Integrations
- **Supabase**: Database, auth, storage
- **OpenAI**: AI-powered content generation
- **Three.js**: 3D rendering

### Future Integrations
- Payment processing (for Grind token purchases)
- Asset management (CDN for game assets)
- Analytics platform
- Social features

## Migration Path

### Database Migration
Apply the migration file:
```sql
supabase/migrations/20251116000000_platform_architecture.sql
```

This creates all new tables, indexes, RLS policies, and triggers while preserving existing data.

### Code Organization

```
src/
├── components/
│   ├── MainMenu.tsx          - Landing/auth
│   ├── GameStore.tsx         - Player marketplace
│   ├── DeveloperPortal.tsx   - Developer workspace
│   └── Game3D.tsx            - Game renderer (existing)
├── services/
│   ├── ProfileService.ts     - User/developer profiles
│   ├── GameProjectService.ts - Game CRUD
│   ├── GameStoreService.ts   - Store operations
│   └── GrindTokenService.ts  - Token economy
├── hooks/
│   ├── useProfile.ts         - Profile state
│   ├── useGrindWallet.ts     - Wallet state
│   ├── useAuth.ts            - Auth state (existing)
│   └── useGameState.ts       - Game state (existing)
└── types/
    ├── PlatformTypes.ts      - Platform entities
    └── AppTypes.ts           - App state types
```

## Development Workflow

### For Developers on the Platform

1. **Sign Up** → Create account
2. **Upgrade to Developer** → Enable developer features
3. **Create Project** → Define game concept
4. **Configure Game** → Set engine parameters, scenarios
5. **Test** → Play and iterate
6. **Create Listing** → Add store presence
7. **Publish** → Make available to players
8. **Monitor** → Track analytics and revenue

### For Players

1. **Sign Up** → Create account
2. **Browse Store** → Discover games
3. **Purchase/Play** → Spend Grind or play free games
4. **Earn Rewards** → Accumulate Grind through gameplay
5. **Review** → Rate and review games
6. **Build Library** → Collect favorite games

## Roadmap

### Phase 1 - Foundation (Current)
- ✅ Database architecture
- ✅ Core services
- ✅ Basic UI components
- ✅ Token system

### Phase 2 - Enhancement
- Visual game editor
- Asset marketplace
- Social features (friends, chat)
- Achievements system

### Phase 3 - Expansion
- Mobile apps
- Multiplayer support
- User-generated content tools
- Advanced analytics

### Phase 4 - Ecosystem
- Third-party integrations
- Modding support
- Community tools
- Creator programs

## Technical Notes

### Performance Considerations
- Indexed all foreign keys
- Materialized views for complex queries
- CDN for static assets
- Lazy loading for game assets

### Scalability
- Horizontal scaling via Supabase
- Asset storage via Supabase Storage or CDN
- Real-time features via Supabase Realtime
- Edge functions for compute-heavy operations

### Monitoring
- Transaction logs for all Grind movements
- Analytics tracking per game
- Error logging and reporting
- Performance metrics

## Support

For technical issues or platform questions:
- Check existing game projects for reference implementations
- Review service layer documentation
- Test in development mode before publishing
- Monitor analytics for player feedback

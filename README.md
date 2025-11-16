# Gamescape

**Gamescape** is a revolutionary browser-based game engine and platform that combines AI-powered game creation with a curated marketplace. Create, publish, and monetize games while players discover infinite procedurally-generated worlds.

## Platform Overview

Gamescape operates in three integrated modes:

### 🎮 Game Store
- Discover and play AI-generated games created by developers
- Browse featured games and top-rated experiences
- Purchase games with Grind tokens or play free titles
- Build your personal game library

### 🕹️ Play Mode
- Experience unique procedurally-generated adventures
- Intelligent NPCs with contextual dialogue
- Multi-skill progression system
- Persistent world with auto-save

### 💻 Developer Portal
- Create and publish games using AI tools
- Configure game parameters and scenarios
- Track analytics and revenue
- Manage multiple game projects

## Core Features

### For Players
- **Game Discovery** - Curated store with featured games, ratings, and reviews
- **Token Economy** - Earn and spend Grind tokens for games and rewards
- **Procedural Worlds** - AI-generated environments with infinite variety
- **Character Progression** - Skills, equipment, inventory, and crafting
- **Social Features** - Reviews, ratings, and community engagement

### For Developers
- **Game Creation** - AI-assisted world generation and NPC creation
- **Publishing Platform** - Deploy games directly to the store
- **Monetization** - Earn Grind tokens from game sales (90% revenue share)
- **Analytics Dashboard** - Track plays, players, ratings, and revenue
- **Asset Management** - Upload custom models, textures, and scripts

### Engine Features
- **AI-Powered Generation** - Dynamic world creation using OpenAI GPT-4
- **3D Rendering** - Real-time graphics with Three.js
- **Auto-Save System** - Cloud synchronization via Supabase
- **Multi-tenancy** - Isolated game instances per developer
- **Secure Economy** - Row-level security for all user data

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **3D Rendering**: Three.js
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **AI Integration**: OpenAI GPT-4 for content generation
- **Build Tool**: Vite
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd gamescape
```

2. Install dependencies
```bash
npm install
```

3. Environment Setup
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

5. Apply database migrations

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed instructions on setting up the database schema.

Quick method via Supabase Dashboard:
- Open SQL Editor
- Run the migration file: `supabase/migrations/20251116000000_platform_architecture.sql`

6. Start development server
```bash
npm run dev
```

## Quick Start - Guest Mode

Try Gamescape instantly without signing up:

1. Click "Get Started" on the landing page
2. Click "Try as Guest" button
3. Instantly access the platform with:
   - Auto-generated username
   - 1,000 Grind tokens welcome bonus
   - Full platform features
   - Perfect for testing and onboarding

Guest accounts are temporary - create a real account to save progress permanently.

## Platform Architecture

For detailed information about the platform architecture, database schema, and development workflow, see [PLATFORM_ARCHITECTURE.md](./PLATFORM_ARCHITECTURE.md).

### Key Concepts

- **User Roles**: Players, Developers, Admins
- **Game Projects**: Developer-created game templates
- **Game Instances**: Player save files
- **Grind Tokens**: Platform currency for transactions
- **Store Listings**: Public marketplace presence

## Controls

### Movement
- **WASD** - Move character
- **Shift** - Run/Sprint
- **Mouse** - Look around (click to lock cursor)
- **Escape** - Release cursor

### Interaction
- **E** - Interact with NPCs and objects
- **Left Click** - Use equipped tool
- **Right Click** - Use equipped weapon
- **1-2** - Quick select tools
- **3-4** - Quick select weapons
- **Tab** - Tool selection menu
- **Q** - Weapon selection menu

### Interface
- **I** - Inventory
- **C** - Character customization
- **X** - Skills and experience
- **H** - Controls help
- **Ctrl+S** - Manual save
- **Ctrl+Shift+L** - System logs

## Game Systems

### World Generation
The game generates terrain dynamically as players explore. Each area features:
- Biome-appropriate landscapes (forests, deserts, grasslands, mountains, lakes, villages)
- Interactive objects (trees, rocks, chests, plants)
- Resource nodes for gathering materials
- NPCs with location-specific personalities and knowledge

### Character Development
Players progress through multiple skill trees:
- **Combat** - Increases damage and effectiveness in battle
- **Gathering** - Improves resource collection efficiency
- **Crafting** - Enhances tool durability and creation
- **Movement** - Increases speed and stamina
- **Health** - Raises maximum health and regeneration
- **Exploration** - Expands detection range and world interaction

### Equipment and Tools
- **Tools**: Axes (woodcutting), pickaxes (mining), specialized harvesting equipment
- **Weapons**: Swords, daggers, spears, maces, bows for combat
- **Durability System**: Items degrade with use and require maintenance
- **Progression**: Better equipment unlocks through skill advancement

### Combat System
- Real-time combat with various weapon types
- Enemy AI with different behaviors and attack patterns
- Health and damage systems with critical hits
- Experience gains from successful encounters

## Grind Token Economy

Gamescape uses **Grind (G)** as its platform currency:

### For Players
- **Earn**: Complete achievements, play games, participate in events
- **Spend**: Purchase games, unlock premium features
- **Transfer**: Send tokens to other players

### For Developers
- **Earn**: 90% of game sales revenue
- **Platform Fee**: 10% supports platform operations
- **Payout**: Automatic via transaction system

### Transaction Types
- `purchase` - Buy games from the store
- `reward` - System rewards for achievements
- `transfer` - Player-to-player transactions
- `developer_payout` - Revenue distribution

All transactions are secure, transparent, and tracked in the blockchain-like ledger system.

## Project Structure

```
src/
├── components/
│   ├── MainMenu.tsx           # Landing and authentication
│   ├── GameStore.tsx          # Game marketplace
│   ├── DeveloperPortal.tsx    # Developer workspace
│   ├── Game3D.tsx             # 3D game renderer
│   ├── character/             # Character components
│   └── GameUI/                # Game interface
├── services/
│   ├── ProfileService.ts      # User/developer profiles
│   ├── GameProjectService.ts  # Game CRUD operations
│   ├── GameStoreService.ts    # Store and discovery
│   ├── GrindTokenService.ts   # Token economy
│   ├── SaveSystem.ts          # Game persistence
│   └── [game systems]         # Combat, inventory, etc.
├── types/
│   ├── PlatformTypes.ts       # Platform entities
│   ├── AppTypes.ts            # Application state
│   └── [game types]           # Game-specific types
├── hooks/
│   ├── useProfile.ts          # Profile management
│   ├── useGrindWallet.ts      # Wallet state
│   ├── useAuth.ts             # Authentication
│   └── useGameState.ts        # Game state
└── lib/
    └── supabase.ts            # Supabase client
```

## Development

### Build
```bash
npm run build
```

### Lint
```bash
npm run lint
```

### Type Checking
```bash
npx tsc --noEmit
```

## Database Schema

The platform uses Supabase with comprehensive multi-tenant architecture:

### User & Profile Tables
- `user_profiles` - Extended user information and roles
- `developer_profiles` - Developer-specific data

### Game Management Tables
- `game_projects` - Developer-created game templates
- `game_store_listings` - Public marketplace presence
- `game_assets` - Developer-uploaded resources
- `games` - Player save files/instances

### Player Progression Tables
- `map_tiles` - Generated world segments
- `player_skills` - Character progression
- `player_inventory` - Item storage
- `player_equipment` - Tools and weapons
- `npc_states` - Conversation history

### Economy Tables
- `grind_wallets` - Token balances
- `grind_transactions` - Transaction history

### Social Tables
- `game_reviews` - Player ratings and reviews
- `game_analytics` - Usage metrics
- `game_access` - Access control

See [PLATFORM_ARCHITECTURE.md](./PLATFORM_ARCHITECTURE.md) for complete schema documentation.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Configuration Notes

### AI Features
AI-powered content generation requires an OpenAI API key. Without this key, the game will use fallback systems for world generation and NPC interactions.

### Performance
The game is optimized for modern browsers with WebGL support. For optimal performance:
- Use browsers with hardware acceleration enabled
- Ensure adequate system memory for 3D rendering
- Close unnecessary browser tabs during gameplay

## Support

For technical issues or feature requests, please use the GitHub issue tracker.
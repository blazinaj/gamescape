# Gamescape: AI Development Guide

## Executive Summary

**Gamescape** is a browser-based game engine and marketplace platform built with React 18 + TypeScript + Three.js. It's a multi-tenant system where:

- **Players** discover and play games in a game store, with persistent character progression
- **Developers** create and publish games using the Developer Portal
- **Players** earn and spend **Grind tokens** (in-game currency) in a token economy
- All data persists via **Supabase** (with fallback to localStorage for guest users)
- **AI-powered** world generation and NPC conversations (OpenAI integration, fallback systems exist)

This guide explains the complete architecture, systems, and code organization for continued development.

---

## Architecture Overview

### Core Application Flow

```
App.tsx (Main Router)
├── MainMenu (Authentication/Login)
├── GameStore (Browse & Play Games)
├── Game3D (Play Mode - 3D Game Engine)
└── DeveloperPortal (Create/Publish Games)
```

### Three Application Modes

1. **Store Mode** (`appMode: 'store'`)
   - Game discovery and marketplace
   - Displays all public games with listings
   - Shows player's owned/accessible games
   - Main hub for players

2. **Play Mode** (`appMode: 'play'`)
   - 3D game rendering with Three.js
   - Character control, combat, exploration
   - Inventory, skills, NPC interactions
   - Automatic save system

3. **Develop Mode** (`appMode: 'develop'`)
   - Game project creation/editing
   - Custom object creation
   - Scenario configuration
   - Publishing to store

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Vite |
| **3D Engine** | Three.js (WebGL rendering) |
| **Styling** | Tailwind CSS |
| **Backend** | Supabase (PostgreSQL + Auth) |
| **AI** | OpenAI GPT-4 (map generation, NPC dialogue) |
| **Build** | Vite (dev server + production build) |
| **Icons** | Lucide React |
| **State Management** | React Hooks + Context (no Redux) |
| **Storage** | Browser localStorage + Supabase |

---

## Database Schema (Supabase)

### User & Profile Tables

```
auth.users (Supabase Auth)
    ↓
user_profiles
├── id (uuid, PK)
├── username (unique)
├── display_name
├── avatar_url
├── role: 'player' | 'developer' | 'admin'
└── timestamps

developer_profiles (extends user_profiles)
├── id (uuid, FK)
├── studio_name
├── verified
├── total_games / total_revenue
└── rating
```

### Game Project Tables

```
game_projects (Developer-created games)
├── id (uuid, PK)
├── developer_id (FK to developer_profiles)
├── title, description, version
├── status: 'draft' | 'testing' | 'published' | 'archived'
├── engine_config (jsonb) - Engine settings
├── game_settings (jsonb) - Game-specific config
├── starting_scenario (jsonb) - Initial world config
├── thumbnail_url, banner_url
└── analytics: total_plays, total_players, average_rating

game_store_listings (Public marketplace presence)
├── id (uuid, PK)
├── game_project_id (FK, unique)
├── visibility: 'public' | 'unlisted' | 'private'
├── price_grind (0 for free)
├── featured (boolean)
└── screenshots[], long_description

game_assets (Developer-uploaded resources)
├── id (uuid, PK)
├── game_project_id (FK)
├── asset_type: 'model' | 'texture' | 'audio' | 'script' | 'config'
└── metadata (jsonb)

game_access (Access control)
├── user_id (FK)
├── game_project_id (FK)
├── access_type: 'owned' | 'trial' | 'demo' | 'developer'
```

### Player Game Instance Tables

```
games (Player save files)
├── id (uuid, PK)
├── user_id (FK)
├── game_project_id (FK, can be null for custom games)
├── name (save name)
├── player_position: {x, y, z}
├── player_rotation: {x, y, z, w}
├── character_customization (jsonb)
├── health_data (jsonb)
└── timestamps

map_tiles (Generated world segments)
├── id (PK)
├── game_id (FK)
├── tile_x, tile_z
├── biome: 'forest' | 'desert' | 'grassland' | 'mountains' | 'lake' | 'village' | 'ruins'
├── objects[] (spawned objects)
└── description (AI-generated)

player_skills (Character progression)
├── game_id (FK)
├── skill_id
├── level, experience, total_experience

player_inventory (Item storage)
├── game_id (FK)
├── item_id
├── quantity, slot_index

player_equipment (Tools & weapons)
├── game_id (FK)
├── equipment_type: 'tool' | 'weapon'
├── item_id
├── durability, max_durability

npc_states (NPC interaction tracking)
├── game_id (FK)
├── npc_id
├── has_talked, conversation_count
```

### Token Economy Tables

```
grind_wallets (Player token balances)
├── user_id (FK, unique)
├── balance
├── lifetime_earned / lifetime_spent

grind_transactions (Transaction history)
├── id (uuid, PK)
├── from_wallet_id / to_wallet_id (nullable)
├── amount, type: 'purchase' | 'reward' | 'transfer' | 'refund' | 'developer_payout'
└── related_game_id, description
```

### Social & Analytics Tables

```
game_reviews
├── game_project_id (FK)
├── user_id (FK)
├── rating (1-5)
├── review_text

game_analytics
├── game_project_id (FK)
├── plays_count, unique_players
├── total_playtime_minutes
└── revenue_grind
```

---

## File Structure & Organization

### `/src`

#### Root Files
- **App.tsx** - Main application router, handles mode switching
- **main.tsx** - React entry point, initializes logger
- **index.css** - Global Tailwind styles
- **vite-env.d.ts** - Vite type definitions

#### `/components` (React Components)

**Core UI Components:**
- `MainMenu.tsx` - Authentication & login screen
- `GameStore.tsx` - Game discovery & marketplace
- `DeveloperPortal.tsx` - Game creation workspace
- `Game3D.tsx` - Main game renderer wrapper (orchestrates the 3D game)

**Game UI Components (in `GameUI/`):**
- `InventoryUI.tsx` - Item management
- `EquipmentUI.tsx` - Tool/weapon selection
- `ExperienceUI.tsx` - Skills & levels display
- `HealthUI.tsx` - Health bar & status
- `EquipmentUI.tsx` - Equipment display
- `NotificationDisplay.tsx` - Toast notifications
- `KeybindingsUI.tsx` - Control help/keybinds
- `LogViewer.tsx` - System logs viewer
- `ObjectInteractionUI.tsx` - Pop-up for nearby objects
- `ObjectManagerUI.tsx` - Developer tool for custom objects
- `SaveGameUI.tsx` - Save/load game screen
- `ScenarioSelector.tsx` - Choose starting scenario
- `StartMenu.tsx` - In-game menu

**Character Components (in `character/`):**
- `Character.tsx` - Player character (3D mesh + systems)
- `CharacterCustomizer.tsx` - Appearance editor UI
- `CharacterPreview.tsx` - 3D preview of customization
- `CharacterCustomizationService.ts` - Customization logic

**World Components:**
- `NPC.tsx` - Non-player character entity
- `Enemy.tsx` - Combat enemy entity
- `CameraController.tsx` - Third-person camera control
- `InputManager.tsx` - Keyboard/mouse input handler
- `GameRenderer.tsx` - Three.js scene & renderer setup
- `MapManager.tsx` - World tile generation & loading (see services)

**Utility Components:**
- `AuthForm.tsx` - Login/signup form
- `ConversationUI.tsx` - NPC dialogue UI
- `CustomObjectsButton.tsx` - Developer portal button
- `DeveloperPortal.tsx` - Dev workspace

#### `/services` (Core Game Logic - NOT React Components)

**World Generation & Management:**
- `AIMapGenerator.ts` - AI-powered map tile generation (uses OpenAI or fallback)
- `MapManager.ts` - Tile loading/unloading, NPC spawning, world streaming
- `ResourceNodeManager.ts` - Resource spawning & harvesting

**Character & Equipment:**
- `CharacterCustomizationService.ts` - Customization state management
- `EquipmentManager.ts` - Tool/weapon system & durability
- `InventorySystem.ts` - Item management, stacking, slots

**Game Systems:**
- `HealthSystem.ts` - HP, damage, death handling
- `ExperienceSystem.ts` - Skill leveling, XP multipliers
- `CollisionSystem.ts` - Physics/collision detection
- `ConversationSystem.ts` - NPC dialogue (OpenAI-based with fallback)

**Game State & Persistence:**
- `GameInitializer.ts` - Bootstrap game (create all systems)
- `GameLoader.ts` - Load saved games from Supabase/localStorage
- `SaveSystem.ts` - Save/load game data (handles both cloud & local)
- `LocalStorageService.ts` - Browser storage wrapper for offline mode

**Platform Systems:**
- `ProfileService.ts` - User profile CRUD
- `GameProjectService.ts` - Developer game management
- `GameStoreService.ts` - Store listing & discovery
- `GrindTokenService.ts` - Token wallet & transactions

**Interaction & Objects:**
- `InteractableObjectManager.ts` - Manages interactive objects in world
- `ObjectDefinitionSystem.ts` - Stores object definitions & templates
- `CustomObjectGenerator.ts` - Create custom game objects (for devs)
- `EnemyManager.tsx` - Enemy spawning & AI

**Utilities:**
- `Logger.ts` - Console logging wrapper
- `NotificationSystem.ts` - Toast notifications

#### `/types` (TypeScript Type Definitions)

**Platform Types:**
- `PlatformTypes.ts` - User, Developer, Game, Token economy types
- `AppTypes.ts` - App navigation & state types

**Game Types:**
- `CharacterTypes.ts` - Character customization & appearance
- `EquipmentTypes.ts` - Tools, weapons, durability
- `InventoryTypes.ts` - Items, stacks, slots
- `ExperienceTypes.ts` - Skills, levels, XP
- `HealthTypes.ts` - HP, damage, status effects
- `MapTypes.ts` - Tiles, biomes, NPCs, objects
- `CollisionTypes.ts` - Collision shapes & detection
- `CustomEnemyTypes.ts` - Enemy definitions
- `CustomItemTypes.ts` - Custom item definitions
- `CustomStructureTypes.ts` - Custom building definitions
- `CustomVegetationTypes.ts` - Custom plant/vegetation
- `BaseObjectTypes.ts` - Base types for game objects
- `EnemyTypes.ts` - Enemy state & AI

#### `/hooks` (React Hooks - Stateful Logic)

- `useAuth.ts` - Authentication state (login, logout, guest mode)
- `useProfile.ts` - User profile fetching & caching
- `useGameState.ts` - Game ref object + game UI state
- `useGrindWallet.ts` - Token balance state
- `useAutoSave.ts` - Auto-save timer logic
- `useKeyboardShortcuts.ts` - Global keyboard shortcuts
- `useUIState.ts` - UI visibility toggles (inventory, skills, etc)

#### `/lib` (External Library Wrappers)

- `supabase.ts` - Supabase client initialization

#### `/data`

- `sampleGames.ts` - Pre-loaded game data (5 sample games)

#### `/supabase/migrations`

SQL migration files for database setup:
- `20251116000000_platform_architecture.sql` - Main platform schema
- `20251116000001_sample_games.sql` - Sample game data
- `20250615151924_jolly_lantern.sql` - Initial schema
- `20250616201827_bitter_voice.sql` - Updates
- `20250619034157_gentle_bush.sql` - Updates

---

## Core Game Systems

### 1. Character System

**Files:** `components/Character.tsx`, `services/CharacterCustomizationService.ts`, `types/CharacterTypes.ts`

The `Character` class represents the player avatar:

```typescript
new Character(customization: CharacterCustomization)
  .getInventorySystem()      // InventorySystem
  .getEquipmentManager()     // EquipmentManager
  .getHealthSystem()         // HealthSystem
  .getExperienceSystem()     // ExperienceSystem
  .update(deltaTime)         // Animate character
  .move(direction, speed)    // Move in world
  .interact(object)          // Harvest/pickup
  .takeDamage(damage)        // Combat
  .getCurrentPosition()       // Get position
```

Customization parameters:
- `bodyColor`, `clothingColor`, `eyeColor` (hex colors)
- `scale`, `headScale`, `bodyWidth`, `armLength`, `legLength` (morphs)
- `name` (character name)

### 2. World & Map System

**Files:** `services/MapManager.ts`, `services/AIMapGenerator.ts`, `types/MapTypes.ts`

**Concept:** The world is procedurally generated in "tiles" (25x25 units each).

```
MapManager
├── generateTile(x, z)           // Create tile at position
│   └── AIMapGenerator           // Uses OpenAI or fallback
│       ├── 7 Biomes: forest, desert, grassland, mountains, lake, village, ruins
│       ├── Object spawning: trees, rocks, chests, NPCs, enemies
│       └── Returns: MapTile with description
├── loadTile(tile)               // Add to Three.js scene
├── unloadTile(tile)             // Remove from scene (memory optimization)
├── updateAroundPosition(pos)    // Load/unload tiles as player moves
└── getAllGeneratedTiles()       // For saving
```

**Biome Types:**
- **Forest:** Trees, bushes, mushrooms, logs
- **Desert:** Sand dunes, cacti, ancient ruins
- **Grassland:** Open fields, flowers, animals
- **Mountains:** Rocky terrain, caves, crystals
- **Lake:** Water, fishing spots, water lilies
- **Village:** Buildings, NPCs, crafting stations
- **Ruins:** Ancient structures, treasures, enemies

**Map Objects** can be:
- **Static:** trees, rocks, buildings (visual only)
- **Interactive:** chests (contain items), plants (harvestable), wells (drink), campfires (warmth)
- **Enemies:** Spawned for combat
- **NPCs:** Dialogue partners

### 3. Inventory & Equipment System

**Files:** `services/InventorySystem.ts`, `services/EquipmentManager.ts`, `types/InventoryTypes.ts`

**Inventory:**
```typescript
inventory.addItem(itemId, quantity)
inventory.removeItem(itemId, quantity)
inventory.getSlots()              // Returns InventoryStack[]
inventory.getItemCount(itemId)
inventory.moveItem(fromSlot, toSlot)
```

**Stacking Rules:**
- Max 30 slots
- Materials & consumables stack (max 16-64 per stack)
- Tools & weapons don't stack (1 per slot)

**Equipment:**
```typescript
equipment.equip(tool)             // Equip tool/weapon
equipment.getEquipped()           // Current tool
equipment.getDurability()         // Current durability
equipment.takeDurabilityDamage()  // Decreases on use
equipment.repair()                // Restore durability
```

**Item Types:**
- **Material:** Wood log, stone, iron ore (stackable, crafting ingredient)
- **Consumable:** Berries, mushrooms (stackable, usable)
- **Tool:** Axes, pickaxes (not stackable, durability system)
- **Weapon:** Swords, spears, bows (combat)

### 4. Experience & Skills System

**Files:** `services/ExperienceSystem.ts`, `types/ExperienceTypes.ts`

6 skill trees:
1. **Combat:** Increases weapon damage
2. **Gathering:** Faster resource collection
3. **Crafting:** Better tool durability
4. **Movement:** Speed & stamina
5. **Health:** Max HP & regeneration
6. **Exploration:** Detection range

```typescript
skills.getSkill(skillId)           // Get Skill object
skills.addExperience(skillId, xp)  // Gain XP → auto-level
skills.getCurrentLevel(skillId)
skills.getMultiplier(skillId)      // XP multiplier
```

**Leveling:** XP → Level progression (exponential requirements)

### 5. Health & Combat System

**Files:** `services/HealthSystem.ts`, `types/HealthTypes.ts`, `services/EnemyManager.tsx`

**Player Health:**
```typescript
health.getCurrentHP()
health.getMaxHP()
health.takeDamage(damage: DamageInfo)  // {amount, source}
health.heal(amount)
health.isDead()
```

**Enemy AI:**
- Patrols area
- Attacks player when nearby
- Different enemy types (different stats/behaviors)
- Drop loot on defeat

**Damage Types:** Physical (weapon), Environmental (falling, fire)

### 6. NPC & Conversation System

**Files:** `services/ConversationSystem.ts`, `components/NPC.tsx`

NPCs in the world:
```typescript
conversation.startConversation(npc)
conversation.generateNPCResponse(npc, history, playerMessage)
conversation.generateResponseOptions(npc, history, npcMessage)
```

**AI Generation:** Uses OpenAI GPT-4-turbo
- **Fallback:** Hardcoded responses if no API key
- **Context:** Scenario prompt, NPC personality, player history
- **Caching:** Conversations stored per NPC per game

**NPC Data:**
```typescript
interface NPCData {
  id: string
  name: string
  personality: string
  location: {x, y, z}
  knowledge: string[]  // What NPC knows
}
```

### 7. Persistence & Save System

**Files:** `services/SaveSystem.ts`, `services/LocalStorageService.ts`

**Save Data Structure:**
```typescript
CompleteGameData {
  game: GameSave              // Player pos, customization, health
  mapTiles: SavedMapTile[]   // Generated tiles
  npcStates: NPCState[]      // Who talked to whom
  skills: SavedSkill[]       // Skill levels & XP
  inventory: SavedInventoryItem[]
  equipment: SavedEquipment[]
}
```

**Storage Backends:**
1. **Supabase** (default): Persistent cloud storage
2. **localStorage** (fallback): Browser storage for guests

**Auto-Save:** Every 30 seconds during gameplay

**Loading Process:**
1. Load game metadata from Supabase
2. Load map tiles that were previously generated
3. Load character state (position, skills, inventory)
4. Regenerate missing tiles on-demand

### 8. Token Economy System

**Files:** `services/GrindTokenService.ts`, `types/PlatformTypes.ts`

**Grind Token (G):** In-game currency

**Transactions:**
- `purchase` - Buy game from store
- `reward` - Achievement/gameplay reward
- `transfer` - Player-to-player
- `refund` - Failed transaction
- `developer_payout` - Revenue split (90% to dev, 10% to platform)

**Wallet Management:**
```typescript
grindWallet.getBalance()
grindWallet.spend(amount, reason)
grindWallet.earn(amount, reason)
grindWallet.transfer(toUserId, amount)
```

**Starting Amount:** 1,000 G for guest users

### 9. Developer Portal System

**Files:** `components/DeveloperPortal.tsx`, `services/GameProjectService.ts`

Developers can:
1. Create new game projects
2. Configure game settings (title, description, category)
3. Set starting scenario (AI-generated world prompt)
4. Create custom objects/enemies/items
5. Publish to store
6. View analytics

**Game Project Workflow:**
```
Draft → Testing → Published → Archived
```

**Custom Objects:** Developers can define custom:
- **Structures:** Buildings, decorations
- **Vegetation:** Trees, plants
- **Enemies:** Custom enemy types
- **Items:** Custom inventory items

---

## Data Flow Examples

### Example 1: Playing a Game

```
1. Player selects game from store
   → GameStore.tsx calls onNavigateToPlay(gameId)
   
2. App.tsx switches to 'play' mode with currentGameId
   → Renders Game3D component
   
3. Game3D.tsx:
   → useGameState() hook creates game refs
   → GameInitializer.initializeGame():
      - Creates GameRenderer (Three.js scene)
      - Creates Character (player avatar)
      - Creates InputManager (keyboard/mouse)
      - Creates MapManager (world generation)
      - Creates SaveSystem (persistence)
      - Creates EnemyManager (combat)
      - etc.
   → GameLoader.loadGame(gameId) loads saved state
   → Game loop starts (requestAnimationFrame)
   
4. Game Loop:
   → InputManager processes keyboard/mouse
   → Character.update(deltaTime) moves/animates
   → MapManager.updateAroundPosition() loads/unloads tiles
   → Collision detection
   → Render scene with GameRenderer
   → SaveSystem auto-saves every 30s
   
5. Player interaction (e.g., harvest tree):
   → InputManager detects 'E' key
   → Character.interact(object)
   → InventorySystem.addItem('wood_log', 1)
   → ExperienceSystem.addExperience('gathering', 5)
   → NotificationSystem shows "+5 XP"
   
6. Player exits game:
   → SaveSystem.saveGame() uploads to Supabase
   → App switches back to 'store' mode
```

### Example 2: Creating & Publishing a Game

```
1. Player enters Developer Portal
   → DeveloperPortal.tsx loads
   → GameProjectService.getMyProjects()
   
2. Click "Create New Game":
   → Open project creation dialog
   → Set title, description, category
   → Choose/create scenario
   
3. Configure Scenario:
   → Write AI prompt for world generation
   → Select theme (medieval, sci-fi, etc)
   → MapManager.setScenario(prompt, theme)
   
4. Test Game:
   → Switch to play mode with game_project_id
   → Game initializes using project settings
   → Player tests gameplay
   
5. Add Custom Objects:
   → ObjectManagerUI displays object creation
   → CustomObjectGenerator creates new object types
   → ObjectDefinitionSystem stores definitions
   
6. Publish Game:
   → GameProjectService.updateProjectStatus('published')
   → GameStoreService.createListing()
   → Set price (0 for free, N for Grind tokens)
   → Game appears in store
   
7. Player purchases game:
   → GrindTokenService.purchase(gameId, price)
   → Transaction logged
   → Developer receives 90% of price
   → Player gains access
```

### Example 3: NPC Interaction

```
1. Player approaches NPC in world
   → MapManager detects distance < 10 units
   → ConversationUI.tsx shows "E to talk"
   
2. Player presses 'E':
   → NPCInteractionHandler.startConversation(npc)
   → ConversationSystem.startConversation(npc)
   
3. System generates greeting:
   → If OpenAI API key exists:
      - Send prompt to GPT-4-turbo with NPC personality
      - Return AI-generated greeting
   → Else:
      - Return hardcoded fallback greeting
   
4. ConversationUI displays NPC message & response options:
   → Option 1: Ask about quest
   → Option 2: Ask about location
   → Option 3: Leave conversation
   
5. Player selects option:
   → ConversationSystem.generateNPCResponse(npc, history, choice)
   → Returns NPC's next message
   → NPCState tracks conversation_count++
   
6. Conversation ends:
   → SaveSystem saves NPCState
   → NPCState persists in next save
```

---

## Authentication & User Management

**File:** `components/MainMenu.tsx`, `hooks/useAuth.ts`, `services/LocalAuthService.ts`

### Three Login Options

1. **Guest Mode** (Recommended for demos):
   - Click "Try as Guest"
   - Auto-generates username (Guest123456)
   - Gets developer role + 1,000 Grind tokens
   - Data stored in localStorage
   - No email required

2. **Email/Password** (Production):
   - Uses Supabase Auth
   - Requires valid email
   - Password hashed by Supabase
   - Data persists in Supabase

3. **OAuth** (Future):
   - Google, GitHub, Discord login
   - Configured in Supabase dashboard

### Auth Flow

```typescript
// In useAuth.ts
const { user, loading } = useAuth()

// Returns:
{
  user: { id, email, user_metadata: {username, role} }
  loading: boolean
  login(email, password)
  signup(email, password, username)
  logout()
  signupAsGuest()
}
```

**Guest Mode Details:**
- Auto-login without credentials
- Data stored in localStorage under key: `gamescape_data`
- Includes profiles, wallets, game saves
- Can be converted to real account later (future feature)

---

## AI Integration Points

### 1. Map Generation (AIMapGenerator.ts)

**Trigger:** When player moves to unexplored tile

**Process:**
```
Input: Tile position (x, z), nearby biomes
  ↓
If OpenAI API key exists:
  → Create prompt: "Generate biome description with objects"
  → Send to GPT-4o with function_call for structured output
  → Parse response: {biome, objects[], description}
Else:
  → Use fallback generation (hardcoded biomes/objects)
  ↓
Output: MapTile {id, biome, objects, description}
```

**Customization by Developer:**
- Set scenario prompt & theme in game project
- Prompt influences biome selection & object distribution
- Example: "Medieval fantasy" theme → more villages/NPCs

### 2. NPC Conversations (ConversationSystem.ts)

**Trigger:** When player talks to NPC

**Process:**
```
Input: NPC personality, location, conversation history, player message
  ↓
If OpenAI API key exists:
  → Create system prompt with NPC character
  → Include scenario context from GameScenario
  → Send conversation history to GPT-4-turbo
  → Get AI-generated response
Else:
  → Return hardcoded response from NPC personality
  ↓
Output: NPC dialogue message
```

**Configuration:**
- Each NPC has personality type (e.g., "merchant", "warrior")
- Game scenario provides world context
- Conversation history maintained per NPC per save

### 3. Character Customization (CharacterCustomizationService.ts - Optional AI)

**Currently:** Manual sliders in UI
**Future:** Could use AI to generate appearance from text description

---

## Development Workflow

### Adding a New Feature

#### 1. New Game System (e.g., Crafting)

**Files to create:**
```
src/services/CraftingSystem.ts          // Core logic
src/types/CraftingTypes.ts              // Type definitions
src/components/GameUI/CraftingUI.tsx    // UI component
```

**Integration:**
```typescript
// In GameInitializer.ts
gameRef.craftingSystem = new CraftingSystem()

// In Game3D.tsx hooks
const [craftingUI, setCraftingUI] = useUIState()
```

#### 2. New Item Type

**Steps:**
1. Add to `InventorySystem.ts` initializeItems()
2. Update `InventoryTypes.ts` with new icon
3. Create sprite/model for 3D world
4. Add crafting recipe if applicable
5. Add harvest source (which objects drop it)

#### 3. New Biome or Object Type

**Steps:**
1. Add to `AIMapGenerator.ts` biome enum & fallback generation
2. Add 3D model generation in `MapManager.ts`
3. Update `MapTypes.ts` with object definition
4. Add collision shape to `CollisionSystem.ts`
5. If interactive, add to `InteractableObjectManager.ts`

#### 4. New Skill

**Steps:**
1. Add skill ID to `ExperienceSystem.ts` skillDefinitions
2. Update `ExperienceTypes.ts`
3. Create effect in relevant system (HealthSystem for health skill, etc)
4. Add UI display in `ExperienceUI.tsx`
5. Add XP gains where applicable

### Testing & Debugging

**Keyboard Shortcuts:**
- `Ctrl+Shift+L` - Open LogViewer (system logs)
- `Ctrl+S` - Manual save
- `H` - Help/controls
- `I` - Inventory
- `C` - Character customization
- `X` - Skills
- `Escape` - Unlock mouse

**Development Logs:**
- `Logger.ts` maintains console.log wrapper
- All major systems log actions with emoji prefixes
- Logs visible in LogViewer UI and browser console

**Hot Reload:**
- Vite dev server supports React refresh
- Edit files, see changes without restart
- Game state persists during reload

---

## Common Patterns & Best Practices

### 1. Service Pattern

Services are **non-React classes** with game logic:

```typescript
// Good: Service class
export class MySystem {
  constructor() { }
  
  doSomething() { }
  
  getSomething() { }
}

// Instantiate in GameInitializer
gameRef.mySystem = new MySystem()
```

### 2. Hook Pattern

Hooks manage **React state** for UI:

```typescript
// Good: Hook
export const useMyState = () => {
  const [state, setState] = useState()
  
  return { state, setState }
}

// Use in component
const { state, setState } = useMyState()
```

### 3. Type Safety

Always use TypeScript interfaces:

```typescript
// Good
interface Item {
  id: string
  name: string
  type: 'material' | 'weapon'
}

const addItem = (item: Item) => { }

// Avoid any
const addItem = (item: any) => { }
```

### 4. Error Handling

Graceful fallbacks for AI features:

```typescript
try {
  if (this.apiKey) {
    return await this.generateWithAI()
  } else {
    return this.generateFallback()
  }
} catch (error) {
  console.error('Generation failed:', error)
  return this.generateFallback()
}
```

### 5. Memory Management

Clean up on component unmount:

```typescript
useEffect(() => {
  const handler = () => { }
  window.addEventListener('keydown', handler)
  
  return () => {
    window.removeEventListener('keydown', handler)
  }
}, [])
```

### 6. Persistence

Always consider save/load:

```typescript
// When creating new data
const saved = await saveSystem.saveGame()

// When loading
const loaded = await saveSystem.loadGame(gameId)
```

---

## Performance Optimization

### 1. Tile Streaming

**Why:** World is infinite; can't render all tiles

**How:** MapManager only loads tiles within 2 tiles of player
```typescript
loadDistance = 2  // Load 5x5 tile grid around player
unload tiles > 3 tiles away
```

### 2. Object Pooling

Reuse Three.js meshes for similar objects:
```typescript
objectMeshCache = new Map<string, THREE.Object3D>()
// When creating object: check cache first, clone if exists
```

### 3. LOD (Level of Detail)

Complex objects simplified based on distance from camera

### 4. Collision Optimization

Use spatial partitioning for collision checks:
```typescript
collisionSystem.getObjectsInArea(pos, radius)
// Only check nearby objects, not all in world
```

### 5. Lazy Loading

Load assets on-demand:
- 3D models load when tile loads
- Textures load after mesh
- Audio files stream

---

## Environment Variables

Create `.env` file in project root:

```
VITE_OPENAI_API_KEY=sk-...    # Optional: Enable AI features
VITE_SUPABASE_URL=https://...  # Supabase project URL
VITE_SUPABASE_ANON_KEY=...     # Supabase anon key
```

Without these, fallback systems activate automatically.

---

## Deployment

### Building

```bash
npm run build
# Output: dist/ folder (ready for deployment)
```

### Hosting Options

1. **Netlify** (Recommended)
   - Configured in `netlify.toml`
   - Auto-deploy on git push
   - Free tier sufficient for development

2. **Vercel**
   - Similar to Netlify
   - Good serverless function support

3. **GitHub Pages**
   - Static hosting only
   - Good for demos

### Environment in Production

Set environment variables in hosting platform:
- Netlify: Site settings → Build & deploy → Environment
- Vercel: Settings → Environment variables
- GitHub Pages: Secrets (for Actions)

---

## Troubleshooting

### Game Won't Load

**Check:**
1. Browser console for errors
2. Supabase connection (Project URL & key in env)
3. WebGL support (Check in DevTools)
4. Open LogViewer (Ctrl+Shift+L)

### NPCs Not Talking

**Check:**
1. OpenAI API key in .env
2. API quota not exceeded
3. Fallback dialogue working?
4. NPC distance < 10 units

### Game Won't Save

**Check:**
1. Supabase authenticated
2. localStorage not full (browser storage limit)
3. Check SaveSystem logs
4. Network connection

### Performance Issues

**Try:**
1. Close other browser tabs
2. Enable GPU acceleration in browser
3. Reduce draw distance in settings (future)
4. Check memory usage (DevTools)

---

## Future Development Roadmap

### Priority 1 (Foundation)
- [ ] Complete multiplayer support
- [ ] Advanced quest system
- [ ] Cosmetic shop
- [ ] User profiles & reputation

### Priority 2 (Enhancement)
- [ ] Mobile/touch controls
- [ ] Cloud save sync
- [ ] Voice chat with NPCs
- [ ] Persistent multiplayer world

### Priority 3 (Advanced)
- [ ] VR support
- [ ] Mod SDK for community creators
- [ ] Blockchain integration (token trading)
- [ ] Live events system

---

## Quick Reference Commands

```bash
# Development
npm run dev              # Start dev server (localhost:5173)
npm run build           # Production build
npm run lint            # Check code quality

# Testing
npm run test            # Run tests (setup needed)

# Type Checking
npx tsc --noEmit       # Check TypeScript errors

# Database
npm run migration       # Apply Supabase migrations
```

---

## Key Contacts/Resources

### Documentation
- React: https://react.dev
- Three.js: https://threejs.org/docs
- Supabase: https://supabase.com/docs
- OpenAI: https://platform.openai.com/docs
- Tailwind: https://tailwindcss.com/docs
- TypeScript: https://www.typescriptlang.org/docs

### Debugging Tools
- Chrome DevTools - F12
- Lighthouse - Performance audit
- Three.js Inspector - 3D debugging
- Supabase Dashboard - Database management

---

## Summary

**Gamescape** is a sophisticated game engine combining:
- ✅ **3D world generation** with AI
- ✅ **Multi-system gameplay** (inventory, skills, combat, etc)
- ✅ **Developer tools** for game creation
- ✅ **Platform features** (store, token economy, multiplayer foundation)
- ✅ **Cloud persistence** with offline fallback

This guide provides complete context for any AI assisting with development. Use this to understand architecture, locate relevant code, and maintain consistency when adding new features.

**Happy developing! 🎮**


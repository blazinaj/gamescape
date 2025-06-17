# GameScape

GameScape is an AI-powered procedural adventure game featuring infinite world generation, intelligent NPCs, and comprehensive character progression systems.

## Features

### Core Gameplay
- **Procedural World Generation** - Worlds are generated dynamically using AI, creating unique landscapes and environments
- **AI-Powered NPCs** - Non-player characters with contextual dialogue and personality-driven interactions
- **Character Progression** - Multi-skill system covering combat, gathering, crafting, and exploration
- **Equipment System** - Tools and weapons with durability, upgrades, and specialized functions
- **Resource Management** - Inventory system with harvestable materials and crafting components

### Technical Features
- **Auto-Save System** - Automatic progress saving with cloud synchronization
- **3D Graphics** - Real-time rendered environments using Three.js
- **Responsive Design** - Optimized interface for various screen sizes
- **Authentication** - Secure user accounts with individual save slots

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

5. Start development server
```bash
npm run dev
```

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

## Project Structure

```
src/
├── components/          # React components
│   ├── character/      # Character-related components
│   ├── GameUI/         # Game interface elements
│   └── [others]        # Various game components
├── services/           # Game logic and systems
├── types/              # TypeScript type definitions
├── hooks/              # Custom React hooks
└── lib/                # External library configurations
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

The game uses Supabase with the following primary tables:
- `games` - Save game data and player state
- `map_tiles` - Generated world segments
- `player_skills` - Character progression data
- `player_inventory` - Item storage
- `player_equipment` - Tool and weapon information
- `npc_states` - Conversation history and NPC interactions

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
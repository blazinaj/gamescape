# Meshy AI Integration - Setup Guide

## Quick Start (5 minutes)

### 1. Get Meshy API Key

1. Sign up at https://dashboard.meshy.ai/
2. Go to API Keys section
3. Create a new API key
4. Copy the key

### 2. Configure Supabase Secret

The Meshy API key is **automatically configured** in your Supabase Edge Function environment variables.

However, if you need to manually set it:

1. Go to Supabase Dashboard
2. Click **Settings** → **Edge Functions**
3. Set the secret: `MESHY_API_KEY=your_api_key_here`

### 3. Test the Integration

#### Option A: Using the UI Component
Add to your game interface:

```jsx
import { CharacterGenerator } from './components/CharacterGenerator';

export function GameDashboard() {
  return (
    <div>
      <CharacterGenerator />
    </div>
  );
}
```

#### Option B: Using the Hook Directly
```typescript
import { useCharacterGeneration } from './hooks/useCharacterGeneration';

export function MyComponent() {
  const { generateCharacter, character, generating } = useCharacterGeneration();

  const handleGenerate = async () => {
    await generateCharacter({
      description: 'A brave knight with glowing armor',
      artStyle: 'realistic'
    });
  };

  return (
    <button onClick={handleGenerate} disabled={generating}>
      {generating ? 'Generating...' : 'Create Character'}
    </button>
  );
}
```

## Architecture Overview

### Database Tables
The integration uses two Supabase tables:

#### `asset_library`
Stores all generated 3D models, textures, and animations
- Primary key: `id` (uuid)
- Indexes: asset_type, status, tags, created_at
- RLS: Public read for completed assets

#### `asset_generations`
Logs all generation requests for tracking and auditing
- Primary key: `id` (uuid)
- Tracks: user_id, asset_id, status, timestamps

### Edge Function
**Name:** `meshy-asset-generator`
**Type:** Serverless background processor
**Endpoints:**
- `POST /functions/v1/meshy-asset-generator/generate-model` - Start generation
- `POST /functions/v1/meshy-asset-generator/check-status` - Check progress

### How It Works

```
User clicks "Generate Character"
           ↓
CharacterGenerator component calls useCharacterGeneration
           ↓
Hook calls edge function with prompt
           ↓
Edge function creates asset_library record (status: pending)
           ↓
Edge function calls Meshy API (text-to-3d)
           ↓
Edge function returns immediately with asset_id
           ↓
Edge function starts background polling (via EdgeRuntime.waitUntil)
           ↓
Polling checks Meshy API every 3 seconds
           ↓
When complete, updates asset_library (status: completed, file_url)
           ↓
User can download/use the generated model
```

## Services

### CharacterGenerationService
Main service for character generation with smart caching.

**Location:** `src/services/CharacterGenerationService.ts`

**Key Methods:**
```typescript
// Initialize
const service = initializeCharacterGeneration(supabaseUrl, supabaseKey);

// Generate character
const result = await service.generateCharacter({
  description: 'A barbarian warrior',
  artStyle: 'realistic',
  userId: 'user-123',
  generateTextures: true,
  generateRigging: true
});

// Check status
const status = await service.checkGenerationStatus(meshyRequestId);

// Search existing characters
const similar = await service.searchCharacters('knight');

// Get by style
const realistic = await service.getCharactersByStyle('realistic');
```

### AssetLibraryService
Manages the centralized asset library.

**Location:** `src/services/AssetLibraryService.ts`

**Key Methods:**
```typescript
const library = new AssetLibraryService(supabase);

// Search
const results = await library.searchAssets('warrior');

// Get by type
const models = await library.getAssetsByType('model');

// Tag management
await library.addTagsToAsset(assetId, ['character', 'warrior']);

// Track usage
await library.incrementAssetUsage(assetId);

// Find similar
const similar = await library.findSimilarAssets('model', ['character', 'realistic']);
```

### AssetCacheService
Intelligent caching to prevent duplicate generations.

**Location:** `src/services/AssetCacheService.ts`

**Key Methods:**
```typescript
const cache = initializeAssetCache(supabaseUrl, supabaseKey);

// Find cached asset with similarity matching
const cached = await cache.findCachedAsset(
  prompt,
  artStyle,
  similarityThreshold = 0.7
);

// Get popular assets
const popular = await cache.getMostUsedAssets('model', 10);

// Get recent assets
const recent = await cache.getRecentAssets('model', 10);

// Statistics
const stats = await cache.getAssetStatistics();
```

## Components

### CharacterGenerator
Interactive component for generating characters.

**Features:**
- Text input for descriptions
- Art style selector (realistic, stylized, cartoon, anime)
- Real-time progress indicator
- Download link when complete
- Error handling and retry

**Usage:**
```jsx
import { CharacterGenerator } from './components/CharacterGenerator';

<CharacterGenerator />
```

### AssetLibraryBrowser
Browse and search generated assets.

**Features:**
- Full-text search
- Filter by tags
- Sort by popularity or recency
- Download assets
- View usage stats

**Usage:**
```jsx
import { AssetLibraryBrowser } from './components/AssetLibraryBrowser';

<AssetLibraryBrowser
  onAssetSelect={(asset) => {
    // Load asset into game
  }}
/>
```

## Hooks

### useCharacterGeneration
React hook managing generation state and polling.

**Returns:**
```typescript
{
  generating: boolean,           // Currently generating
  character: GeneratedCharacter, // Result
  error: string | null,          // Error message
  progress: 'idle' | 'generating' | 'completed' | 'failed',
  generateCharacter: (request) => Promise<void>,
  reset: () => void
}
```

## API Endpoints

### Generate Model
```
POST /functions/v1/meshy-asset-generator/generate-model

{
  "prompt": "A brave knight with glowing armor",
  "art_style": "realistic",
  "user_id": "optional",
  "name": "optional",
  "description": "optional",
  "tags": ["character"]
}

Response:
{
  "success": true,
  "asset_id": "uuid",
  "meshy_request_id": "string",
  "message": "Asset generation started..."
}
```

### Check Status
```
POST /functions/v1/meshy-asset-generator/check-status

{
  "meshyRequestId": "string"
}

Response:
{
  "status": "PENDING | SUCCEEDED | FAILED",
  "model_urls": {
    "glb": "url",
    "fbx": "url",
    "usdz": "url"
  },
  "error": "optional"
}
```

## File Structure

```
src/
├── services/
│   ├── CharacterGenerationService.ts    # Main character generation
│   ├── AssetLibraryService.ts           # Asset library management
│   ├── AssetCacheService.ts             # Intelligent caching
│   └── MeshyAssetService.ts             # Low-level Meshy API
├── hooks/
│   └── useCharacterGeneration.ts        # React hook for generation
├── components/
│   ├── CharacterGenerator.tsx           # Generation UI
│   └── AssetLibraryBrowser.tsx          # Asset browser UI
└── supabase/
    └── functions/
        └── meshy-asset-generator/
            └── index.ts                 # Edge function

Database:
├── asset_library              # All generated assets
└── asset_generations          # Generation logs
```

## Workflow Examples

### Example 1: Generate a Character
```typescript
import { useCharacterGeneration } from './hooks/useCharacterGeneration';

function GameCreator() {
  const { generateCharacter, character, progress } = useCharacterGeneration();

  const handleCreate = async () => {
    await generateCharacter({
      description: 'A powerful mage with crystal staff and mystical aura',
      artStyle: 'stylized'
    });
  };

  return (
    <>
      <button onClick={handleCreate}>Create Character</button>
      {progress === 'generating' && <p>Generating...</p>}
      {progress === 'completed' && character && (
        <p>Character ready! Asset ID: {character.assetId}</p>
      )}
    </>
  );
}
```

### Example 2: Search Existing Assets
```typescript
import { AssetLibraryBrowser } from './components/AssetLibraryBrowser';

function AssetSelect() {
  return (
    <AssetLibraryBrowser
      onAssetSelect={(asset) => {
        console.log('Selected asset:', asset.id);
        // Load model in Three.js
        loadModel(asset.file_url);
      }}
    />
  );
}
```

### Example 3: Batch Generation
```typescript
async function generateStarterCharacters() {
  const { generateCharacter } = useCharacterGeneration();

  const characters = [
    { description: 'Brave knight in shining armor', style: 'realistic' },
    { description: 'Mysterious wizard in dark robes', style: 'realistic' },
    { description: 'Skilled archer in leather armor', style: 'stylized' }
  ];

  for (const char of characters) {
    await generateCharacter({
      description: char.description,
      artStyle: char.style
    });
  }
}
```

## Configuration

### Environment Variables
In Supabase Dashboard → Settings → Edge Functions Secrets:

```bash
MESHY_API_KEY=your_api_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Customization
Edit in services:

```typescript
// MeshyAssetService.ts
private pollInterval = 3000;      // Poll every 3 seconds
private maxPolls = 600;           // 30 minute timeout

// AssetCacheService.ts
similarityThreshold = 0.7;        // 70% match required
```

## Troubleshooting

### Generation Fails with "API Error"
1. Check Meshy API key is correct
2. Verify API key has sufficient credits
3. Check Meshy status page

### Long Generation Times
1. Meshy typically takes 2-5 minutes
2. Complex prompts take longer
3. Try simpler descriptions

### Models Not Downloading
1. Check file_url in database
2. Verify Supabase Storage access
3. Check browser CORS settings

### Can't Find Similar Assets
1. Increase similarity threshold temporarily
2. Reduce filtering criteria
3. Try broader tag searches

## Best Practices

### Prompt Writing
```
Good:
"A heavily armored knight with sword and shield, standing proud, fantasy style"

Avoid:
"A guy with stuff"
"Character model"
```

### Tagging Strategy
```
Tags: ['character', 'male', 'warrior', 'realistic', 'game-ready']
NOT: ['model', 'thing']
```

### Caching
- Default similarity: 0.7 (70%)
- Most assets are reused after 3-5 generations
- Library grows exponentially with usage

### Performance
- Assets cache locally in memory
- Search is fast with indexes
- Batch requests for faster generation

## Next Steps

1. **Add to Your Game UI**
   - Import CharacterGenerator component
   - Place in game creation screen

2. **Customize Generation Prompts**
   - Edit prompt templates in CharacterGenerationService
   - Add game-specific style presets

3. **Build Asset Collections**
   - Create themed asset packs
   - Tag assets for easy discovery

4. **Monitor & Optimize**
   - Check asset_generations logs
   - Track popular/failed prompts
   - Iterate on templates

5. **Scale Up**
   - Batch generate assets
   - Create style-specific collections
   - Build asset marketplace

## Support & Resources

- **Meshy API Docs:** https://docs.meshy.ai/
- **Supabase Docs:** https://supabase.com/docs
- **Integration Guide:** See MESHY_INTEGRATION.md

## FAQ

**Q: How long does generation take?**
A: Typically 2-5 minutes. Backend polling handles this asynchronously.

**Q: Can I generate textures separately?**
A: Yes! Use `generateTextures: true` in the generation request.

**Q: Do I pay per generation?**
A: Per Meshy's pricing. Cache hits are free!

**Q: Can I use these models commercially?**
A: Yes! They're owned by your system/game.

**Q: How many concurrent generations?**
A: Check Meshy account limits. Scale with polling.

**Q: Can I export assets to other formats?**
A: Yes! Meshy provides GLB, FBX, and USDZ formats.

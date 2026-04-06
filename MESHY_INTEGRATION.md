# Meshy AI 3D Asset Generation Integration

## Overview

Gamescape now integrates with Meshy AI to generate high-quality 3D models, animations, and textures dynamically. All generated assets are stored in a centralized library owned by the system, allowing for infinite asset reuse and building a growing pool of game-ready 3D content.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌──────────────────┐  ┌────────────────────────┐           │
│  │ CharacterGenerator│  │ AssetLibraryBrowser   │           │
│  └────────┬─────────┘  └────────┬───────────────┘           │
│           │                     │                            │
└───────────┼─────────────────────┼────────────────────────────┘
            │                     │
     ┌──────▼─────────────────────▼──────┐
     │   Supabase Edge Functions         │
     │  (meshy-asset-generator)          │
     └──────┬──────────────────────┬──────┘
            │                      │
     ┌──────▼──────┐      ┌────────▼─────────┐
     │  Meshy API  │      │ Supabase (DB)    │
     │             │      │                  │
     │ • text-3d   │      │ • asset_library  │
     │ • remesh    │      │ • asset_gen_logs │
     │ • rigging   │      │                  │
     │ • retexture │      └──────────────────┘
     └─────────────┘
```

### Database Schema

#### `asset_library` Table
Stores all generated 3D assets with metadata:
- `id` - Unique asset identifier
- `asset_type` - 'model', 'animation', or 'texture'
- `name` - Human-readable asset name
- `prompt` - Original AI generation prompt
- `meshy_request_id` - Meshy API request ID for tracking
- `status` - 'pending', 'completed', or 'failed'
- `file_url` - URL to the generated GLB/FBX file
- `preview_url` - Thumbnail/preview image
- `tags` - Searchable tags for discovery
- `usage_count` - Number of times asset was reused
- `metadata` - JSON object with poly count, dimensions, etc.

#### `asset_generations` Table
Logs all generation requests for user tracking and auditing:
- `id` - Log entry ID
- `asset_id` - Reference to generated asset
- `user_id` - User who requested generation
- `meshy_request_id` - Meshy API request ID
- `status` - Generation status
- `error_message` - Error details if failed
- `created_at` - Request timestamp
- `completed_at` - Completion timestamp

## Services

### CharacterGenerationService
Main service for generating characters with automatic caching.

```typescript
const service = initializeCharacterGeneration(supabaseUrl, supabaseKey);

const character = await service.generateCharacter({
  description: 'A brave knight with glowing armor',
  artStyle: 'realistic',
  userId: 'user-123',
  generateTextures: true,
  generateRigging: true
});

// Check if similar asset exists first
const existing = await service.findExistingCharacter(description, artStyle);
```

### AssetLibraryService
Manages the centralized asset library.

```typescript
const library = new AssetLibraryService(supabase);

// Search for assets
const characters = await library.searchAssets('knight');

// Get by type
const models = await library.getAssetsByType('model');

// Add tags
await library.addTagsToAsset(assetId, ['character', 'warrior']);

// Track usage
await library.incrementAssetUsage(assetId);
```

### AssetCacheService
Intelligent caching to prevent duplicate generations.

```typescript
const cache = initializeAssetCache(supabaseUrl, supabaseKey);

// Find cached assets with similarity matching
const cached = await cache.findCachedAsset(
  prompt,
  artStyle,
  similarityThreshold = 0.7
);

// Get popular/recent assets
const popular = await cache.getMostUsedAssets('model', 10);
const recent = await cache.getRecentAssets('model', 10);

// Get statistics
const stats = await cache.getAssetStatistics();
```

### MeshyAssetService
Low-level Meshy API integration.

```typescript
const meshy = new MeshyAssetService(apiKey);

// Generate 3D model from text
const result = await meshy.generateCharacterModel(
  'A wise wizard',
  'stylized'
);

// Generate textures
const textures = await meshy.generateTextures(
  modelUrl,
  'photorealistic fantasy texture'
);

// Optimize mesh
const remeshed = await meshy.remesh(modelUrl, 100000);

// Add rigging for animation
const rigged = await meshy.generateRigging(modelUrl, 'biped');

// Poll for completion
const status = await meshy.pollForCompletion(taskId);
```

## Workflows

### Character Generation Workflow

1. **User Input**
   - User enters character description and selects art style
   - System extracts keywords from prompt

2. **Cache Check**
   - Search asset library for similar characters
   - If similarity >= 70%, return cached asset
   - Increment usage counter

3. **Generation Request**
   - If no cached match, call edge function
   - Edge function calls Meshy text-to-3d API
   - Create asset_library record with 'pending' status

4. **Async Processing**
   - Edge function starts background polling
   - Polls Meshy API every 3 seconds
   - Max 30 minute timeout

5. **Completion**
   - When model generated, update asset record
   - Download and store model URL
   - Update status to 'completed'
   - Log generation in asset_generations

### Asset Reuse Workflow

1. **Detection**
   - New generation request arrives
   - Calculate semantic similarity to existing prompts
   - Check for tag matches

2. **Prioritization**
   - Sort by usage count (popular assets first)
   - Filter by art style match
   - Apply similarity threshold

3. **Return Cached Asset**
   - Return immediate response with cached asset
   - Increment usage counter
   - Log in generation logs

4. **Library Growth**
   - As users generate assets, library grows
   - Most popular assets become default options
   - Create curated "best of" collections

## Components

### CharacterGenerator Component
Interactive UI for character generation.

```jsx
<CharacterGenerator />
```

Features:
- Text input for character description
- Art style selector (realistic, stylized, cartoon, anime)
- Progress indicator during generation
- Download link when complete
- Error handling with user-friendly messages

### AssetLibraryBrowser Component
Browse and search the asset library.

```jsx
<AssetLibraryBrowser onAssetSelect={(asset) => {
  // Use selected asset in game
}} />
```

Features:
- Full-text search across prompts and tags
- Sort by popularity or recency
- Tag filtering
- Download assets
- View usage statistics

## Hook: useCharacterGeneration

React hook for character generation with state management.

```typescript
const {
  generating,
  character,
  error,
  progress, // 'idle' | 'generating' | 'completed' | 'failed'
  generateCharacter,
  reset
} = useCharacterGeneration();

await generateCharacter({
  description: 'A brave knight',
  artStyle: 'realistic'
});
```

## API Endpoints

### Edge Function: meshy-asset-generator

#### POST /functions/v1/meshy-asset-generator/generate-model
Initiate character generation.

**Request:**
```json
{
  "prompt": "A brave knight with glowing armor",
  "art_style": "realistic",
  "user_id": "optional-user-id",
  "name": "optional-name",
  "description": "optional-description",
  "tags": ["character", "warrior"]
}
```

**Response:**
```json
{
  "success": true,
  "asset_id": "uuid",
  "meshy_request_id": "string",
  "message": "Asset generation started..."
}
```

#### POST /functions/v1/meshy-asset-generator/check-status
Check generation status.

**Request:**
```json
{
  "meshyRequestId": "string"
}
```

**Response:**
```json
{
  "status": "PENDING|SUCCEEDED|FAILED",
  "model_urls": {
    "glb": "url",
    "fbx": "url",
    "usdz": "url"
  },
  "error": "optional-error-message"
}
```

## Configuration

### Environment Variables

Set in Supabase Edge Function Secrets:

```bash
MESHY_API_KEY=your_meshy_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

Get Meshy API key from: https://dashboard.meshy.ai/

## Best Practices

### Prompt Engineering
- Be specific about character traits
- Include style keywords (e.g., "fantasy", "sci-fi")
- Mention detail level: "highly detailed", "minimalist"
- Specify intended use: "game-ready", "real-time rendering"

### Asset Tagging
```typescript
// Good tags
['character', 'male', 'warrior', 'realistic', 'fantasy', 'game-ready']

// Avoid
['thing', 'model'] // Too generic
```

### Caching Strategy
- Default similarity threshold: 0.7 (70% match)
- Check cache before every generation
- Increment usage for reused assets
- Periodic cache cleanup of unused assets

### Performance Optimization
- Cache results locally in memory
- Use tags for quick filtering
- Batch process generation requests
- Monitor Meshy API rate limits

## Limitations & Considerations

### Meshy API Limits
- Generation typically takes 2-5 minutes
- Max concurrent requests: check Meshy docs
- Quality improves with specific prompts
- Complex poses may require iteration

### Storage Considerations
- GLB files: 5-50MB per model
- Store in Supabase Storage or CDN
- Implement cleanup for failed/old assets
- Monitor storage costs

### Quality Control
- Failed generations are logged
- Allow user feedback/rating system
- Track which prompts fail most
- Iterate prompt templates

## Future Enhancements

1. **Animation Generation**
   - Generate walk/run/attack animations
   - Use rigging endpoint for biped/quadruped
   - Cache animation templates

2. **Texture Variations**
   - Generate multiple texture options per model
   - Store texture variants with same base model
   - Allow user texture selection

3. **Real-time Preview**
   - Stream model as it's being generated
   - Show progress with intermediate results
   - Live preview in Three.js viewer

4. **Asset Marketplace**
   - Allow developers to sell generated assets
   - Rating and review system
   - Bundle popular assets together

5. **Batch Generation**
   - Queue multiple requests
   - Generate asset packs for specific game types
   - Scheduled generation during off-peak hours

6. **Custom Training**
   - Train Meshy on game-specific styles
   - Fine-tune for character generation
   - Create style-consistent asset sets

## Troubleshooting

### Generation Hangs
- Check Meshy API status
- Verify API key is valid
- Check network connectivity
- Increase polling timeout

### Poor Quality Models
- Refine prompt with more details
- Specify art style explicitly
- Request smaller poly counts
- Try different "seed" values

### Missing Model Files
- Check Supabase Storage access
- Verify file URLs are accessible
- Check CORS settings
- Ensure Storage buckets are public

### Slow Performance
- Enable caching to reuse assets
- Batch generation requests
- Use similarity matching to find closest existing asset
- Consider pre-generating popular characters

## Examples

### Basic Character Generation
```typescript
const { generateCharacter } = useCharacterGeneration();

await generateCharacter({
  description: 'A barbarian with two-handed axe, tribal tattoos',
  artStyle: 'realistic'
});
```

### Batch Generate Starter Characters
```typescript
const prompts = [
  'A brave knight in shining armor',
  'A mysterious wizard in dark robes',
  'A swift archer in leather armor',
  'A noble paladin with sword and shield'
];

for (const prompt of prompts) {
  await generateCharacter({
    description: prompt,
    artStyle: 'realistic',
    generateTextures: true
  });
}
```

### Search and Reuse Asset
```typescript
const library = new AssetLibraryService(supabase);
const similar = await library.searchAssets('warrior');

// Use the most popular warrior character
if (similar.length > 0) {
  const asset = similar[0];
  loadModel(asset.file_url);
}
```

## Support

- Meshy API Docs: https://docs.meshy.ai/
- Report issues: Include Meshy request ID and timestamps
- Check generation logs in `asset_generations` table
- Review error messages in asset_library metadata

## License & Attribution

- Generated models are owned by Gamescape
- Proper attribution to Meshy AI required
- Follow Meshy's terms of service
- Respect copyright of prompt sources

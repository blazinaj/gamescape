# Meshy AI Integration - Quick Reference

## 60-Second Setup

1. **Get API Key**
   ```
   https://dashboard.meshy.ai/ → Copy API key
   ```

2. **Add to Supabase Secrets**
   ```
   Supabase Dashboard → Settings → Edge Functions →
   Add Secret: MESHY_API_KEY=your_key
   ```

3. **Use in Your App**
   ```jsx
   import { CharacterGenerator } from './components/CharacterGenerator';
   <CharacterGenerator />
   ```

Done! Generation works in 2-5 minutes.

## Core APIs

### Generate a Character
```typescript
import { useCharacterGeneration } from './hooks/useCharacterGeneration';

const { generateCharacter, character, generating } = useCharacterGeneration();

await generateCharacter({
  description: 'A brave knight with glowing armor',
  artStyle: 'realistic'
});
```

### Search Assets
```typescript
import { AssetLibraryService } from './services/AssetLibraryService';

const results = await library.searchAssets('knight');
const byTag = await library.getAssetsByTag('character');
const popular = await library.getMostUsedAssets('model', 10);
```

### Check Cache
```typescript
import { AssetCacheService } from './services/AssetCacheService';

const cached = await cache.findCachedAsset(
  prompt,
  artStyle,
  similarityThreshold = 0.7
);
```

## Components

### CharacterGenerator
```jsx
<CharacterGenerator />
```
- Interactive UI for character creation
- Handles everything: prompt, generation, download

### AssetLibraryBrowser
```jsx
<AssetLibraryBrowser
  onAssetSelect={(asset) => console.log(asset)}
/>
```
- Browse and search library
- Download assets

## Database Tables

### asset_library
```sql
SELECT * FROM asset_library WHERE status = 'completed'
LIMIT 10;
```
All generated 3D assets stored here.

### asset_generations
```sql
SELECT * FROM asset_generations WHERE user_id = 'your-id'
ORDER BY created_at DESC;
```
Your generation history and logs.

## API Endpoints

### Start Generation
```
POST /functions/v1/meshy-asset-generator/generate-model
Content-Type: application/json

{
  "prompt": "A brave knight",
  "art_style": "realistic",
  "user_id": "optional",
  "tags": ["character"]
}
```

### Check Status
```
POST /functions/v1/meshy-asset-generator/check-status
Content-Type: application/json

{
  "meshyRequestId": "your-request-id"
}
```

## Configuration

### Environment Variables
```bash
MESHY_API_KEY=your_api_key          # In Supabase secrets
SUPABASE_URL=https://...            # In .env
VITE_SUPABASE_ANON_KEY=pk_...       # In .env
```

### Customize Settings
```typescript
// AssetCacheService.ts
private similarityThreshold = 0.7;  // 0-1 (higher = exact matches only)

// MeshyAssetService.ts
private pollInterval = 3000;        // milliseconds between checks
private maxPolls = 600;             // 30 minute timeout
```

## Common Patterns

### Pattern 1: Generate and Wait
```typescript
const { generateCharacter } = useCharacterGeneration();
const result = await generateCharacter({
  description: 'A wizard',
  artStyle: 'stylized'
});
// Returns when complete (2-5 minutes)
```

### Pattern 2: Generate and Cache
```typescript
const cache = new AssetCacheService(supabaseUrl, supabaseKey);

// Check cache first
const cached = await cache.findCachedAsset('wizard', 'stylized', 0.7);
if (cached) return cached; // Instant!

// Otherwise generate
const newChar = await generateCharacter({...});
```

### Pattern 3: Batch Generation
```typescript
const prompts = [
  'A brave knight',
  'A mystical wizard',
  'A skilled archer'
];

for (const prompt of prompts) {
  await generateCharacter({ description: prompt });
}
```

### Pattern 4: Search Library
```typescript
// Full text search
const results = await library.searchAssets('knight');

// By type
const models = await library.getAssetsByType('model');

// By tag
const warriors = await library.getAssetsByTag('warrior');

// Popular
const popular = await cache.getMostUsedAssets('model', 5);
```

## Art Styles

```
'realistic'   - Photorealistic, detailed
'stylized'    - Stylized game graphics
'cartoon'     - Cartoon/cel-shading style
'anime'       - Anime/manga style
```

## File Formats

Meshy generates in multiple formats:
- **GLB** - Recommended for games (small, optimized)
- **FBX** - For animation/rigging
- **USDZ** - For AR applications

## Response Status

```
PENDING    → Still generating
SUCCEEDED  → Ready! file_url has model
FAILED     → Generation failed, check error
```

## Error Handling

```typescript
try {
  await generateCharacter({ description: 'knight' });
} catch (error) {
  console.error(error.message);
  // API key invalid? Rate limited? No credits?
}
```

## Polling

**Frontend polling** (useCharacterGeneration hook):
- Polls every 3 seconds
- Timeout: 2 minutes (40 attempts)
- For quick user feedback

**Backend polling** (Edge function):
- Polls every 3 seconds
- Timeout: 30 minutes (600 attempts)
- Completes generation in background

## Rate Limits

From Meshy API:
- Check your account tier limits
- Typically 5-10 concurrent requests
- Queue additional requests

From Supabase:
- Database: 100 inserts/second typical
- Edge functions: 1000 requests/second

## Common Prompts

### Good Prompts
```
✓ "A heavily armored knight in shining armor with sword and shield"
✓ "A mysterious wizard wearing flowing robes, holding a crystal staff"
✓ "A skilled archer in leather armor, holding a bow"
✓ "A barbarian with tribal tattoos, wielding an axe"
```

### Bad Prompts
```
✗ "A guy"
✗ "Character"
✗ "Model"
✗ "3D thing"
```

## Tags

Common tags:
```
['character', 'male', 'female', 'warrior', 'wizard', 'archer',
 'realistic', 'stylized', 'cartoon', 'anime', 'game-ready',
 'high-poly', 'low-poly', 'fantasy', 'sci-fi', 'medieval']
```

## Debugging

### Check Generation Status
```typescript
// In database
const asset = await supabase
  .from('asset_library')
  .select('*')
  .eq('meshy_request_id', 'request-id')
  .single();

console.log(asset);
```

### Check Edge Function Logs
```
Supabase Dashboard → Functions → meshy-asset-generator → Logs
```

### Monitor API Calls
```
Browser DevTools → Network tab → Filter by "meshy"
```

## Performance Tips

1. **Reuse assets** - Check cache before generating
2. **Use tags** - Better search and filtering
3. **Batch requests** - Schedule during off-peak
4. **Monitor usage** - Track popular assets
5. **Clean cache** - Remove old unused assets

## Costs

- **Meshy**: Per generation (check pricing)
- **Supabase Storage**: Asset file storage
- **Database**: Negligible (RLS checks cheap)
- **Edge functions**: Minimal (mostly waiting)

**Savings from caching**: 50-70% of generations reuse existing assets!

## Limits & Constraints

```
File size:        20-50 MB per model
Generation time:  2-5 minutes typical
Retry timeout:    30 minutes max
Concurrent:       5-10 per account tier
Storage:          Depends on Supabase plan
```

## Resources

| Resource | Link |
|----------|------|
| Meshy API Docs | https://docs.meshy.ai/ |
| Full Integration Guide | MESHY_INTEGRATION.md |
| Setup Instructions | MESHY_SETUP.md |
| Test Guide | MESHY_INTEGRATION_TEST.md |
| Architecture | MESHY_SUMMARY.md |

## Keyboard Shortcuts

In CharacterGenerator component:
- `Enter` - Generate character
- `Esc` - Reset form

## Success Indicators

✅ Generation completed successfully when:
- Status shows "completed"
- file_url is populated
- Model can be downloaded
- Asset appears in library

## Troubleshooting at a Glance

| Issue | Check | Fix |
|-------|-------|-----|
| Generation fails | API key | Add MESHY_API_KEY to secrets |
| Can't find models | Database | Check asset_library table exists |
| Cache not working | Threshold | Lower similarityThreshold to 0.5 |
| Slow search | Indexes | Verify indexes on asset_type, status |
| Models not downloading | Storage | Check file_url exists and is valid |

## Next Steps

1. ✅ **Setup** - Get API key and add to secrets
2. ✅ **Create** - Add CharacterGenerator to UI
3. ✅ **Generate** - Create your first character
4. ✅ **Search** - Browse asset library
5. ✅ **Integrate** - Use models in your game

You're ready to generate AI assets!

# Meshy Integration Testing Guide

## Test Setup

Before testing, ensure you have:
1. Meshy API key configured in Supabase Edge Function secrets
2. Supabase database with asset_library and asset_generations tables
3. Edge function deployed: meshy-asset-generator

## Unit Tests

### Test 1: MeshyAssetService - Text to 3D Generation
```typescript
import { MeshyAssetService } from '@/services/MeshyAssetService';

async function testMeshyGeneration() {
  const service = new MeshyAssetService(process.env.MESHY_API_KEY!);

  const result = await service.generateCharacterModel(
    'A brave knight with glowing armor',
    'realistic'
  );

  console.assert(result.taskId, 'Should return taskId');
  console.assert(result.status === 'pending', 'Status should be pending');
  console.assert(!result.error, 'Should not have error');
  console.log('✓ Text to 3D generation initiated');
}
```

### Test 2: AssetLibraryService - Create Asset
```typescript
import { AssetLibraryService } from '@/services/AssetLibraryService';
import { createClient } from '@supabase/supabase-js';

async function testCreateAsset() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const library = new AssetLibraryService(supabase);

  const asset = await library.createAsset(
    'model',
    'Test Character',
    'A brave knight',
    'test-meshy-id-12345'
  );

  console.assert(asset.id, 'Should have asset id');
  console.assert(asset.status === 'pending', 'Status should be pending');
  console.assert(asset.name === 'Test Character', 'Name should match');
  console.log('✓ Asset created successfully');
}
```

### Test 3: AssetCacheService - Caching
```typescript
import { AssetCacheService } from '@/services/AssetCacheService';

async function testAssetCaching() {
  const cache = new AssetCacheService(SUPABASE_URL, SUPABASE_KEY);

  // Generate first character
  const prompt = 'A warrior with sword and shield';
  const style = 'realistic';

  const cached = await cache.findCachedAsset(prompt, style, 0.7);

  if (cached) {
    console.log('✓ Found cached asset:', cached.id);
    console.log('  Usage count:', cached.usage_count);
  } else {
    console.log('✓ No cache hit (expected for first generation)');
  }
}
```

## Integration Tests

### Test 4: Full Generation Pipeline
```typescript
async function testFullGenerationPipeline() {
  const { generateCharacter } = useCharacterGeneration();

  console.log('Starting full generation test...');

  // Start generation
  const character = await generateCharacter({
    description: 'A mystical wizard with crystal staff',
    artStyle: 'stylized'
  });

  console.assert(character, 'Should return character object');
  console.assert(character.assetId, 'Should have assetId');
  console.assert(character.meshyRequestId, 'Should have meshyRequestId');
  console.log('✓ Generation initiated');

  // Poll for completion (with timeout)
  const startTime = Date.now();
  const timeout = 5 * 60 * 1000; // 5 minutes

  while (Date.now() - startTime < timeout) {
    const status = await checkGenerationStatus(character.meshyRequestId);
    console.log(`  Status: ${status.status}`);

    if (status.status === 'completed') {
      console.assert(status.modelUrl, 'Should have model URL');
      console.log('✓ Generation completed successfully');
      return true;
    }

    if (status.status === 'failed') {
      console.error('✗ Generation failed:', status.error);
      return false;
    }

    await new Promise(r => setTimeout(r, 5000)); // Wait 5 seconds
  }

  console.error('✗ Generation timeout');
  return false;
}
```

### Test 5: Edge Function Endpoints
```typescript
async function testEdgeFunctionEndpoints() {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Test generate-model endpoint
  const generateRes = await fetch(
    `${baseUrl}/functions/v1/meshy-asset-generator/generate-model`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'Test character for endpoint validation',
        art_style: 'realistic',
        tags: ['test']
      })
    }
  );

  console.assert(generateRes.ok, 'Generate endpoint should return 200');
  const generateData = await generateRes.json();
  console.assert(generateData.asset_id, 'Should return asset_id');
  console.assert(generateData.meshy_request_id, 'Should return meshy_request_id');
  console.log('✓ Generate endpoint works');

  // Test check-status endpoint
  const statusRes = await fetch(
    `${baseUrl}/functions/v1/meshy-asset-generator/check-status`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        meshyRequestId: generateData.meshy_request_id
      })
    }
  );

  console.assert(statusRes.ok, 'Status endpoint should return 200');
  const statusData = await statusRes.json();
  console.assert(['PENDING', 'SUCCEEDED', 'FAILED'].includes(statusData.status),
    'Should return valid status'
  );
  console.log('✓ Check status endpoint works');
}
```

## Component Tests

### Test 6: CharacterGenerator Component
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CharacterGenerator } from '@/components/CharacterGenerator';

async function testCharacterGeneratorComponent() {
  render(<CharacterGenerator />);

  // Check for UI elements
  const textarea = screen.getByPlaceholderText(/Describe your ideal character/i);
  const button = screen.getByRole('button', { name: /Generate Character/i });

  console.assert(textarea, 'Should have description textarea');
  console.assert(button, 'Should have generate button');

  // Enter description
  fireEvent.change(textarea, {
    target: { value: 'A brave knight' }
  });

  // Click generate
  fireEvent.click(button);

  // Wait for loading state
  await waitFor(() => {
    const loader = screen.queryByText(/Generating/i);
    console.assert(loader, 'Should show generating state');
  });

  console.log('✓ CharacterGenerator component works');
}
```

### Test 7: AssetLibraryBrowser Component
```typescript
import { render, screen } from '@testing-library/react';
import { AssetLibraryBrowser } from '@/components/AssetLibraryBrowser';

async function testAssetLibraryComponent() {
  const onSelect = jest.fn();
  render(<AssetLibraryBrowser onAssetSelect={onSelect} />);

  // Check for UI elements
  const searchInput = screen.getByPlaceholderText(/Search assets/i);
  const sortSelect = screen.getByDisplayValue(/Most Used/i);

  console.assert(searchInput, 'Should have search input');
  console.assert(sortSelect, 'Should have sort select');

  console.log('✓ AssetLibraryBrowser component mounts');
}
```

## Database Tests

### Test 8: Asset Library Queries
```typescript
import { createClient } from '@supabase/supabase-js';

async function testDatabaseQueries() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Test 1: Create asset
  const { data: newAsset, error: createError } = await supabase
    .from('asset_library')
    .insert({
      asset_type: 'model',
      content_type: 'gltf',
      name: 'Test Character',
      prompt: 'A test character',
      meshy_request_id: 'test-id-' + Date.now(),
      status: 'pending'
    })
    .select()
    .single();

  console.assert(!createError, 'Should create asset');
  console.assert(newAsset?.id, 'Asset should have id');

  // Test 2: Update asset
  const { error: updateError } = await supabase
    .from('asset_library')
    .update({
      status: 'completed',
      file_url: 'https://example.com/model.glb'
    })
    .eq('id', newAsset.id);

  console.assert(!updateError, 'Should update asset');

  // Test 3: Query asset
  const { data: fetchedAsset } = await supabase
    .from('asset_library')
    .select('*')
    .eq('id', newAsset.id)
    .single();

  console.assert(fetchedAsset?.status === 'completed', 'Asset should be completed');
  console.log('✓ Database queries work');
}
```

### Test 9: Generation Logging
```typescript
async function testGenerationLogging() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data: log, error } = await supabase
    .from('asset_generations')
    .insert({
      user_id: 'test-user',
      prompt: 'Test prompt',
      meshy_request_id: 'test-meshy-id',
      status: 'pending'
    })
    .select()
    .single();

  console.assert(!error, 'Should create generation log');
  console.assert(log?.id, 'Log should have id');
  console.log('✓ Generation logging works');
}
```

## Performance Tests

### Test 10: Cache Hit Rate
```typescript
async function testCacheHitRate() {
  const cache = new AssetCacheService(SUPABASE_URL, SUPABASE_KEY);

  const prompts = [
    'A warrior with sword',
    'A warrior with shield and sword',
    'A knight in armor',
    'A warrior in armor'
  ];

  let hits = 0;
  for (const prompt of prompts) {
    const cached = await cache.findCachedAsset(prompt, 'realistic', 0.65);
    if (cached) hits++;
  }

  const hitRate = (hits / prompts.length) * 100;
  console.log(`Cache hit rate: ${hitRate}%`);
  console.assert(hitRate > 0, 'Should have some cache hits');
}
```

### Test 11: Query Performance
```typescript
async function testQueryPerformance() {
  const library = new AssetLibraryService(supabase);

  const startTime = performance.now();
  const results = await library.searchAssets('character', 'model');
  const duration = performance.now() - startTime;

  console.log(`Search completed in ${duration.toFixed(2)}ms`);
  console.assert(duration < 1000, 'Search should complete in under 1 second');
  console.log('✓ Query performance acceptable');
}
```

## Manual Testing Checklist

- [ ] Component renders without errors
- [ ] Can enter character description
- [ ] Generate button triggers API call
- [ ] Loading state shows during generation
- [ ] Completion message shows when done
- [ ] Model URL is correct and downloadable
- [ ] Asset library displays generated assets
- [ ] Search functionality works
- [ ] Tag filtering works
- [ ] Sort options work
- [ ] Download links are valid
- [ ] Error messages are user-friendly
- [ ] Multiple concurrent generations work
- [ ] Cache prevents duplicate generations
- [ ] Database records are created correctly

## CI/CD Integration

Add to your test pipeline:

```yaml
# .github/workflows/test-meshy.yml
name: Meshy Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Set environment variables
        env:
          MESHY_API_KEY: ${{ secrets.MESHY_API_KEY }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
        run: |
          echo "MESHY_API_KEY=$MESHY_API_KEY" >> .env.test

      - name: Run tests
        run: npm test -- --testPathPattern=meshy
```

## Debugging Tips

### Enable Verbose Logging
```typescript
// In CharacterGenerationService
console.log('Generation request:', { prompt, artStyle });
console.log('API response:', response);
console.log('Poll status:', status);
```

### Check Database State
```typescript
// Quick database inspection
const { data: assets } = await supabase
  .from('asset_library')
  .select('id, name, status, created_at')
  .order('created_at', { ascending: false })
  .limit(10);

console.table(assets);
```

### Monitor Edge Function
In Supabase Dashboard → Functions → Logs:
- Check for API call success/failures
- Monitor polling status
- Review error messages

### Network Inspection
Using browser DevTools:
1. Open Network tab
2. Generate a character
3. Watch for edge function calls
4. Check response status and body
5. Monitor polling requests

## Expected Results

### Successful Generation Flow
```
Request submitted → [2s] Processing → [120s] Generating → [10s] Uploaded → Complete
Total time: ~2-5 minutes
```

### Database State Progression
```
Initial:  status=pending, file_url=null
→ Completion: status=completed, file_url=https://...
→ Usage: usage_count++
```

### Network Traffic
```
1. POST /generate-model (0.5KB request, 1KB response)
2. Polling: GET /check-status every 3s (~0.5KB each)
3. Total bandwidth: ~50KB over 5 minutes
```

## Success Criteria

All tests should verify:
- ✓ No TypeScript errors
- ✓ All database operations complete
- ✓ Edge function processes requests
- ✓ Model generation succeeds
- ✓ Cache prevents duplicates
- ✓ UI updates correctly
- ✓ Download links work
- ✓ Performance acceptable

## Support

If tests fail:
1. Check Meshy API key validity
2. Verify Supabase credentials
3. Review edge function logs
4. Check database permissions
5. Inspect network requests

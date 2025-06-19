import { MapTile, MapObject, GeneratedContent, NPCData } from '../types/MapTypes';

export class AIMapGenerator {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';
  private generatedTiles = new Map<string, MapTile>();

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OpenAI API key not found. Map generation will use fallback system.');
    }
  }

  async generateMapTile(x: number, z: number, nearbyBiomes: string[] = []): Promise<GeneratedContent> {
    const tileId = `${x}_${z}`;
    
    // Check if already generated
    if (this.generatedTiles.has(tileId)) {
      return {
        tile: this.generatedTiles.get(tileId)!,
        description: 'Previously generated tile',
        theme: 'cached'
      };
    }

    try {
      if (this.apiKey) {
        return await this.generateWithAI(x, z, nearbyBiomes);
      } else {
        return this.generateFallback(x, z, nearbyBiomes);
      }
    } catch (error) {
      console.error('AI generation failed, using fallback:', error);
      return this.generateFallback(x, z, nearbyBiomes);
    }
  }

  addToCache(tile: MapTile): void {
    this.generatedTiles.set(tile.id, tile);
  }

  private async generateWithAI(x: number, z: number, nearbyBiomes: string[]): Promise<GeneratedContent> {
    const prompt = this.createGenerationPrompt(x, z, nearbyBiomes);
    
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a creative game world generator. Generate diverse, interesting map tiles for a 3D walking game. Always respond with valid JSON matching the specified schema. Include interactive objects like chests, crates, plants, and other discoverable items that players can harvest or interact with.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        functions: [
          {
            name: 'generate_map_tile',
            description: 'Generate a map tile with objects and biome information',
            parameters: {
              type: 'object',
              properties: {
                biome: {
                  type: 'string',
                  enum: ['forest', 'desert', 'grassland', 'mountains', 'lake', 'village'],
                  description: 'The biome type for this tile'
                },
                objects: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      type: {
                        type: 'string',
                        enum: [
                          'tree', 'rock', 'building', 'water', 'hill', 'flower', 'bush', 'ruins', 'npc',
                          'chest', 'crate', 'plant', 'mushroom', 'crystal', 'log', 'berry_bush',
                          'well', 'campfire', 'statue', 'fence', 'bridge', 'cart'
                        ],
                        description: 'Type of object - includes harvestable items like chests, crates, plants, mushrooms, crystals, and logs'
                      },
                      position: {
                        type: 'object',
                        properties: {
                          x: { type: 'number' },
                          y: { type: 'number' },
                          z: { type: 'number' }
                        }
                      },
                      scale: {
                        type: 'object',
                        properties: {
                          x: { type: 'number' },
                          y: { type: 'number' },
                          z: { type: 'number' }
                        }
                      },
                      rotation: {
                        type: 'object',
                        properties: {
                          x: { type: 'number' },
                          y: { type: 'number' },
                          z: { type: 'number' }
                        }
                      },
                      color: { type: 'string' },
                      properties: { type: 'object' }
                    },
                    required: ['type', 'position', 'scale', 'rotation']
                  }
                },
                description: {
                  type: 'string',
                  description: 'A brief description of this map tile'
                },
                theme: {
                  type: 'string',
                  description: 'The overall theme or mood of this area'
                }
              },
              required: ['biome', 'objects', 'description', 'theme']
            }
          }
        ],
        function_call: { name: 'generate_map_tile' },
        temperature: 0.8,
        max_tokens: 1500
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const functionCall = data.choices[0]?.message?.function_call;
    
    if (!functionCall || functionCall.name !== 'generate_map_tile') {
      throw new Error('Invalid function call response');
    }

    const generatedData = JSON.parse(functionCall.arguments);
    return this.createMapTileFromAI(x, z, generatedData);
  }

  private createGenerationPrompt(x: number, z: number, nearbyBiomes: string[]): string {
    const distance = Math.sqrt(x * x + z * z);
    const nearbyContext = nearbyBiomes.length > 0 ? `Nearby biomes: ${nearbyBiomes.join(', ')}` : '';
    
    return `Generate a creative and diverse map tile for coordinates (${x}, ${z}). 
    Distance from origin: ${distance.toFixed(1)} units.
    ${nearbyContext}
    
    Consider:
    - Create varied, interesting landscapes with interactive elements
    - Include discoverable objects: chests (rare, contain valuable items), crates (common, basic supplies), plants (herbs, berries), mushrooms (forest areas), crystals (caves/mountains), fallen logs, berry bushes
    - Add scenic elements: wells, campfires, statues, fences, bridges, carts
    - Balance object density (4-10 objects per tile including interactive items)
    - Use realistic positioning within a 25x25 unit tile
    - Make it feel natural and immersive with things to discover
    - Ensure objects don't overlap with player spawn area if near origin
    - Consider biome transitions and natural geography
    - Include 1-3 harvestable/interactive objects per tile for gameplay
    - Occasionally include NPCs (1-15% chance) in appropriate locations
    
    Object placement tips:
    - Chests: Near ruins, hidden spots, or special locations (rare)
    - Crates: Near buildings, camps, or trade routes
    - Plants/Mushrooms: Natural growing areas appropriate to biome
    - Crystals: Rocky areas, cave entrances, or magical spots
    - Logs: Forest floors, near trees, or old clearings
    - Wells: Villages, settlements, or crossroads
    - Campfires: Clearings, rest spots, or abandoned camps
    
    Position objects within tile bounds (${x * 25 - 12.5} to ${x * 25 + 12.5}, ${z * 25 - 12.5} to ${z * 25 + 12.5})`;
  }

  private createMapTileFromAI(x: number, z: number, aiData: any): GeneratedContent {
    const tile: MapTile = {
      id: `${x}_${z}`,
      x,
      z,
      biome: aiData.biome,
      objects: aiData.objects.map((obj: any) => ({
        type: obj.type,
        position: obj.position,
        scale: obj.scale || { x: 1, y: 1, z: 1 },
        rotation: obj.rotation || { x: 0, y: 0, z: 0 },
        color: obj.color,
        properties: obj.properties || {}
      })),
      generated: true
    };

    this.generatedTiles.set(tile.id, tile);

    return {
      tile,
      description: aiData.description,
      theme: aiData.theme
    };
  }

  private generateFallback(x: number, z: number, nearbyBiomes: string[]): GeneratedContent {
    const biomes = ['forest', 'grassland', 'desert', 'mountains'] as const;
    const biome = biomes[Math.abs(x + z) % biomes.length];
    
    const objects: MapObject[] = [];
    const numObjects = 4 + Math.floor(Math.random() * 6); // 4-9 objects
    
    // Occasionally add NPCs (10% chance)
    const shouldAddNPC = Math.random() < 0.1;
    
    // Always include 1-2 interactive objects
    const interactiveCount = 1 + Math.floor(Math.random() * 2);
    
    for (let i = 0; i < numObjects; i++) {
      let objectType: MapObject['type'];
      
      if (i < interactiveCount) {
        // First few objects are interactive
        objectType = this.getRandomInteractiveObject(biome);
      } else {
        // Rest are environmental
        objectType = this.getRandomObjectForBiome(biome);
      }
      
      const obj: MapObject = {
        type: objectType,
        position: {
          x: x * 25 + (Math.random() - 0.5) * 20,
          y: 0,
          z: z * 25 + (Math.random() - 0.5) * 20
        },
        scale: {
          x: 0.8 + Math.random() * 0.4,
          y: 0.8 + Math.random() * 0.4,
          z: 0.8 + Math.random() * 0.4
        },
        rotation: {
          x: 0,
          y: Math.random() * Math.PI * 2,
          z: 0
        }
      };
      
      // Set colors based on object type
      if (objectType === 'tree') {
        obj.color = biome === 'desert' ? '#8B4513' : '#228B22';
      } else if (objectType === 'rock' || objectType === 'crystal') {
        obj.color = objectType === 'crystal' ? '#9370DB' : '#696969';
      } else if (objectType === 'chest') {
        obj.color = '#8B4513';
      } else if (objectType === 'crate') {
        obj.color = '#D2B48C';
      }
      
      objects.push(obj);
    }

    // Add NPC if determined
    if (shouldAddNPC) {
      const npcData = this.generateRandomNPC(x, z, biome);
      objects.push({
        type: 'npc',
        position: {
          x: x * 25 + (Math.random() - 0.5) * 15,
          y: 0,
          z: z * 25 + (Math.random() - 0.5) * 15
        },
        scale: { x: 1, y: 1, z: 1 },
        rotation: { x: 0, y: Math.random() * Math.PI * 2, z: 0 },
        properties: { npcData }
      });
    }

    const tile: MapTile = {
      id: `${x}_${z}`,
      x,
      z,
      biome,
      objects,
      generated: true
    };

    this.generatedTiles.set(tile.id, tile);

    return {
      tile,
      description: `A ${biome} area with various natural features and discoverable items`,
      theme: `procedural-${biome}`
    };
  }

  private getRandomInteractiveObject(biome: string): MapObject['type'] {
    const interactiveObjects = {
      forest: ['chest', 'mushroom', 'log', 'berry_bush', 'plant'],
      grassland: ['crate', 'plant', 'well', 'chest'],
      desert: ['crystal', 'crate', 'ruins', 'statue'],
      mountains: ['crystal', 'chest', 'rock', 'cave'],
      lake: ['crate', 'plant', 'well'],
      village: ['crate', 'chest', 'well', 'cart']
    };

    const objects = interactiveObjects[biome as keyof typeof interactiveObjects] || interactiveObjects.grassland;
    return objects[Math.floor(Math.random() * objects.length)] as MapObject['type'];
  }

  private generateRandomNPC(x: number, z: number, biome: string): NPCData {
    const names = ['Elena', 'Marcus', 'Aria', 'Finn', 'Luna', 'Kai', 'Nova', 'Sage', 'River', 'Atlas'];
    const personalities = [
      'friendly and outgoing',
      'wise and thoughtful',
      'mysterious and quiet',
      'cheerful and optimistic',
      'gruff but kind-hearted',
      'curious and inquisitive',
      'calm and peaceful',
      'energetic and enthusiastic'
    ];
    
    const occupations = {
      forest: ['ranger', 'herbalist', 'hunter', 'druid'],
      grassland: ['farmer', 'shepherd', 'trader', 'wanderer'],
      desert: ['nomad', 'merchant', 'guide', 'scholar'],
      mountains: ['miner', 'climber', 'hermit', 'blacksmith'],
      lake: ['fisherman', 'sailor', 'water keeper'],
      village: ['shopkeeper', 'innkeeper', 'mayor', 'craftsman']
    };

    const topics = {
      forest: ['nature', 'wildlife', 'herbs', 'ancient trees'],
      grassland: ['farming', 'weather', 'travel', 'seasons'],
      desert: ['survival', 'stars', 'ancient ruins', 'trade routes'],
      mountains: ['climbing', 'minerals', 'legends', 'solitude'],
      lake: ['fishing', 'boats', 'water spirits', 'tides'],
      village: ['local news', 'trade', 'crafts', 'community']
    };

    const bodyColors = ['#FFDBAC', '#F1C27D', '#E0AC69', '#C68642', '#8D5524'];
    const clothingColors = ['#8B4513', '#228B22', '#4169E1', '#DC143C', '#8A2BE2', '#DAA520'];

    const name = names[Math.floor(Math.random() * names.length)];
    const personality = personalities[Math.floor(Math.random() * personalities.length)];
    const biomeOccupations = occupations[biome as keyof typeof occupations] || occupations.grassland;
    const occupation = biomeOccupations[Math.floor(Math.random() * biomeOccupations.length)];
    const biomeTopics = topics[biome as keyof typeof topics] || topics.grassland;

    return {
      id: `npc_${x}_${z}_${Date.now()}`,
      name,
      personality,
      background: `A local ${occupation} who has spent years in this ${biome} region.`,
      occupation,
      mood: Math.random() > 0.2 ? 'content' : 'worried',
      topics: biomeTopics,
      appearance: {
        bodyColor: bodyColors[Math.floor(Math.random() * bodyColors.length)],
        clothingColor: clothingColors[Math.floor(Math.random() * clothingColors.length)],
        scale: 0.9 + Math.random() * 0.2
      }
    };
  }

  private getRandomObjectForBiome(biome: string): MapObject['type'] {
    const objectsByBiome = {
      forest: ['tree', 'bush', 'rock', 'flower', 'log', 'mushroom'],
      grassland: ['tree', 'flower', 'bush', 'rock', 'plant', 'fence'],
      desert: ['rock', 'bush', 'crystal', 'statue'],
      mountains: ['rock', 'tree', 'ruins', 'crystal'],
      lake: ['tree', 'rock', 'bush', 'plant', 'bridge'],
      village: ['building', 'tree', 'flower', 'fence', 'well', 'cart']
    };

    const objects = objectsByBiome[biome as keyof typeof objectsByBiome] || ['tree', 'rock'];
    return objects[Math.floor(Math.random() * objects.length)] as MapObject['type'];
  }

  getTileInfo(x: number, z: number): MapTile | null {
    const tileId = `${x}_${z}`;
    return this.generatedTiles.get(tileId) || null;
  }

  clearCache(): void {
    this.generatedTiles.clear();
  }
}
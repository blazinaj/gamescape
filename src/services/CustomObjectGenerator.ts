import { 
  ObjectCategory, 
  CustomizableObject,
  GeneratedObjectSet,
  EnvironmentContext
} from '../types/BaseObjectTypes';
import { CustomVegetation } from '../types/CustomVegetationTypes';
import { CustomEnemy } from '../types/CustomEnemyTypes';
import { CustomItem, CustomWeapon, CustomTool } from '../types/CustomItemTypes';
import { CustomStructure } from '../types/CustomStructureTypes';

export class CustomObjectGenerator {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';
  private cachedObjectSets: Map<string, GeneratedObjectSet> = new Map();

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OpenAI API key not found. Custom object generation will use fallback system.');
    }
  }

  async generateObjectSet(scenarioId: string, scenarioPrompt: string, theme: string): Promise<GeneratedObjectSet> {
    // Check if we already generated objects for this scenario
    if (this.cachedObjectSets.has(scenarioId)) {
      return this.cachedObjectSets.get(scenarioId)!;
    }
    
    try {
      if (this.apiKey) {
        console.log('🔮 Generating custom objects with AI for scenario:', scenarioId);
        return await this.generateWithAI(scenarioId, scenarioPrompt, theme);
      } else {
        console.log('🔮 Generating fallback custom objects for scenario:', scenarioId);
        return this.generateFallback(scenarioId, scenarioPrompt, theme);
      }
    } catch (error) {
      console.error('AI object generation failed, using fallback:', error);
      return this.generateFallback(scenarioId, scenarioPrompt, theme);
    }
  }

  private async generateWithAI(
    scenarioId: string, 
    scenarioPrompt: string,
    theme: string
  ): Promise<GeneratedObjectSet> {
    const prompt = this.createGenerationPrompt(scenarioPrompt, theme);
    
    try {
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
              content: `You are a creative game asset generator. Generate custom object definitions for a game world based on scenario descriptions. 
              Create thematic, cohesive objects that fit the world being described. Use creative names and descriptions, but make them practical for a game context.
              Always respond with valid JSON matching the specified schema.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          functions: [
            {
              name: 'generate_custom_objects',
              description: 'Generate a set of custom objects for the game scenario',
              parameters: {
                type: 'object',
                properties: {
                  enemies: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        type: { type: 'string' },
                        appearance: { type: 'object' },
                        stats: { type: 'object' },
                        behavior: { type: 'object' },
                        abilities: { type: 'array', items: { type: 'object' } },
                        drops: { type: 'array', items: { type: 'object' } }
                      },
                      required: ['id', 'name', 'description', 'type', 'appearance', 'stats']
                    },
                    description: 'Custom enemy types for this scenario'
                  },
                  vegetation: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        type: { type: 'string' },
                        appearance: { type: 'object' },
                        properties: { type: 'object' },
                        interaction: { type: 'object' }
                      },
                      required: ['id', 'name', 'description', 'type', 'appearance']
                    },
                    description: 'Custom vegetation types for this scenario'
                  },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        type: { type: 'string' },
                        appearance: { type: 'object' },
                        properties: { type: 'object' },
                        effects: { type: 'array', items: { type: 'object' } }
                      },
                      required: ['id', 'name', 'description', 'type', 'appearance', 'properties']
                    },
                    description: 'Custom item types for this scenario'
                  },
                  structures: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        type: { type: 'string' },
                        appearance: { type: 'object' },
                        properties: { type: 'object' },
                        interaction: { type: 'object' }
                      },
                      required: ['id', 'name', 'description', 'type', 'appearance', 'properties']
                    },
                    description: 'Custom structure types for this scenario'
                  },
                  weapons: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        weaponType: { type: 'string' },
                        appearance: { type: 'object' },
                        properties: { type: 'object' },
                        combatStats: { type: 'object' }
                      },
                      required: ['id', 'name', 'description', 'weaponType', 'appearance', 'properties', 'combatStats']
                    },
                    description: 'Custom weapon types for this scenario'
                  },
                  tools: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        toolType: { type: 'string' },
                        appearance: { type: 'object' },
                        properties: { type: 'object' },
                        toolStats: { type: 'object' }
                      },
                      required: ['id', 'name', 'description', 'toolType', 'appearance', 'properties', 'toolStats']
                    },
                    description: 'Custom tool types for this scenario'
                  }
                },
                required: ['enemies', 'vegetation', 'items', 'structures', 'weapons', 'tools']
              }
            }
          ],
          function_call: { name: 'generate_custom_objects' },
          temperature: 0.8,
          max_tokens: 2500
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const functionCall = data.choices[0]?.message?.function_call;
      
      if (!functionCall || functionCall.name !== 'generate_custom_objects') {
        throw new Error('Invalid function call response');
      }

      const generatedData = JSON.parse(functionCall.arguments);
      
      // Convert the generated data to our GeneratedObjectSet format
      const result: GeneratedObjectSet = {
        scenarioId,
        theme,
        environmentContexts: this.getDefaultEnvironmentContexts(theme),
        objects: {
          enemy: this.processEnemies(generatedData.enemies, scenarioId),
          vegetation: this.processVegetation(generatedData.vegetation, scenarioId),
          item: this.processItems(generatedData.items, scenarioId),
          structure: this.processStructures(generatedData.structures, scenarioId),
          weapon: this.processWeapons(generatedData.weapons, scenarioId),
          tool: this.processTools(generatedData.tools, scenarioId)
        }
      };

      // Cache the result
      this.cachedObjectSets.set(scenarioId, result);
      
      console.log(`✅ Generated ${Object.values(result.objects).reduce((sum, arr) => sum + (arr?.length || 0), 0)} custom objects for scenario: ${scenarioId}`);
      
      return result;
    } catch (error) {
      console.error('Failed to generate custom objects with AI:', error);
      return this.generateFallback(scenarioId, scenarioPrompt, theme);
    }
  }

  private createGenerationPrompt(scenarioPrompt: string, theme: string): string {
    return `Generate custom game objects for the following scenario:

SCENARIO DESCRIPTION:
${scenarioPrompt}

THEME: ${theme}

For this scenario, please create:
- 3-5 unique enemy types that fit the theme and environment
- 3-5 vegetation types appropriate for this setting
- 3-5 special items players might find
- 3-5 interesting structures or landmarks
- 2-3 unique weapons
- 2-3 specialized tools

Each object should:
- Have a unique, thematic name
- Include a brief description
- Have visual attributes appropriate to the setting
- Have gameplay properties and behaviors

IMPORTANT:
- Be creative but make objects practical for gameplay
- Maintain consistent theme and aesthetic
- Create objects that would be exciting for players to discover
- Balance objects for gameplay (not too overpowered)
- Give objects personality and character
- Consider how these objects interact with each other within the world
`;
  }

  private getDefaultEnvironmentContexts(theme: string): Record<string, EnvironmentContext> {
    // Create default environment contexts based on the theme
    const contexts: Record<string, EnvironmentContext> = {
      'default': {
        biome: 'temperate',
        climate: 'moderate'
      }
    };
    
    // Add theme-specific environments
    switch (theme) {
      case 'pastoral':
        contexts['rural'] = {
          biome: 'grassland',
          climate: 'temperate',
          proximity: { nearWater: true, nearMountains: false, nearSettlement: true }
        };
        break;
      case 'archaeological':
        contexts['ruins'] = {
          biome: 'desert',
          climate: 'arid',
          proximity: { nearWater: false, nearMountains: true, nearSettlement: false }
        };
        break;
      case 'survival':
        contexts['wilderness'] = {
          biome: 'forest',
          climate: 'harsh',
          proximity: { nearWater: true, nearMountains: true, nearSettlement: false }
        };
        break;
      case 'fantasy':
        contexts['enchanted'] = {
          biome: 'magical',
          climate: 'mystical',
          proximity: { nearWater: true, nearMountains: true, nearSettlement: true }
        };
        break;
      case 'nautical':
        contexts['coastal'] = {
          biome: 'coastal',
          climate: 'tropical',
          proximity: { nearWater: true, nearMountains: false, nearSettlement: true }
        };
        break;
      case 'industrial':
        contexts['city'] = {
          biome: 'urban',
          climate: 'polluted',
          proximity: { nearWater: true, nearMountains: false, nearSettlement: true }
        };
        break;
      case 'apocalyptic':
        contexts['wasteland'] = {
          biome: 'wasteland',
          climate: 'harsh',
          proximity: { nearWater: false, nearMountains: true, nearSettlement: false }
        };
        break;
    }
    
    return contexts;
  }

  private processEnemies(enemiesData: any[], scenarioId: string): CustomEnemy[] {
    return (enemiesData || []).map(enemy => ({
      ...enemy,
      id: `${scenarioId}_enemy_${enemy.id || this.generateId()}`,
      scenario: scenarioId,
      createdAt: Date.now(),
      sounds: enemy.sounds || {},
      abilities: enemy.abilities || [],
      drops: enemy.drops || []
    }));
  }

  private processVegetation(vegetationData: any[], scenarioId: string): CustomVegetation[] {
    return (vegetationData || []).map(veg => ({
      ...veg,
      id: `${scenarioId}_veg_${veg.id || this.generateId()}`,
      scenario: scenarioId,
      createdAt: Date.now(),
      properties: veg.properties || {},
      interaction: veg.interaction || {}
    }));
  }

  private processItems(itemsData: any[], scenarioId: string): CustomItem[] {
    return (itemsData || []).map(item => ({
      ...item,
      id: `${scenarioId}_item_${item.id || this.generateId()}`,
      scenario: scenarioId,
      createdAt: Date.now(),
      effects: item.effects || []
    }));
  }

  private processStructures(structuresData: any[], scenarioId: string): CustomStructure[] {
    return (structuresData || []).map(structure => ({
      ...structure,
      id: `${scenarioId}_struct_${structure.id || this.generateId()}`,
      scenario: scenarioId,
      createdAt: Date.now()
    }));
  }

  private processWeapons(weaponsData: any[], scenarioId: string): CustomWeapon[] {
    return (weaponsData || []).map(weapon => ({
      ...weapon,
      id: `${scenarioId}_weapon_${weapon.id || this.generateId()}`,
      type: 'resource', // Set standard type
      scenario: scenarioId,
      createdAt: Date.now(),
      effects: weapon.effects || []
    }));
  }

  private processTools(toolsData: any[], scenarioId: string): CustomTool[] {
    return (toolsData || []).map(tool => ({
      ...tool,
      id: `${scenarioId}_tool_${tool.id || this.generateId()}`,
      type: 'resource', // Set standard type
      scenario: scenarioId,
      createdAt: Date.now(),
      effects: tool.effects || []
    }));
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 10);
  }

  private generateFallback(scenarioId: string, scenarioPrompt: string, theme: string): GeneratedObjectSet {
    console.log('Using fallback object generation for scenario:', scenarioId);
    
    // Generate a set of thematic objects based on the scenario theme
    const objectSet: GeneratedObjectSet = {
      scenarioId,
      theme,
      environmentContexts: this.getDefaultEnvironmentContexts(theme),
      objects: {
        enemy: this.generateFallbackEnemies(scenarioId, theme),
        vegetation: this.generateFallbackVegetation(scenarioId, theme),
        item: this.generateFallbackItems(scenarioId, theme),
        structure: this.generateFallbackStructures(scenarioId, theme),
        weapon: this.generateFallbackWeapons(scenarioId, theme),
        tool: this.generateFallbackTools(scenarioId, theme)
      }
    };

    // Cache the result
    this.cachedObjectSets.set(scenarioId, objectSet);
    
    return objectSet;
  }

  private generateFallbackEnemies(scenarioId: string, theme: string): CustomEnemy[] {
    const enemies: Partial<CustomEnemy>[] = [];
    
    // Generate enemies based on theme
    switch (theme) {
      case 'pastoral':
        enemies.push({
          id: `${scenarioId}_enemy_wolf`,
          name: 'Gray Wolf',
          description: 'A territorial predator that hunts in packs',
          type: 'wolf',
          appearance: {
            bodyType: 'beast',
            skinTexture: 'furry',
            primaryColor: '#657383',
            size: 1.2
          },
          stats: {
            level: 3,
            health: 50,
            damage: 10,
            defense: 5,
            speed: 8,
            attackRange: 1.5,
            attackSpeed: 1.0,
            experienceValue: 15,
            detectRange: 12,
            aggression: 6
          },
          behavior: {
            isAggressive: true,
            isNocturnal: true,
            isPack: true,
            isTerritorial: true,
            patrolRadius: 20,
            preferredBiomes: ['forest', 'grassland']
          }
        });
        enemies.push({
          id: `${scenarioId}_enemy_boar`,
          name: 'Wild Boar',
          description: 'A sturdy forest dweller with sharp tusks',
          type: 'boar',
          appearance: {
            bodyType: 'beast',
            skinTexture: 'rough',
            primaryColor: '#5D4037',
            size: 1.0
          },
          stats: {
            level: 2,
            health: 40,
            damage: 8,
            defense: 8,
            speed: 6,
            attackRange: 1.2,
            attackSpeed: 0.8,
            experienceValue: 12,
            detectRange: 8,
            aggression: 5
          },
          behavior: {
            isAggressive: false,
            isNocturnal: false,
            isPack: false,
            isTerritorial: true,
            patrolRadius: 15,
            preferredBiomes: ['forest', 'grassland']
          }
        });
        break;
        
      case 'archaeological':
        enemies.push({
          id: `${scenarioId}_enemy_guardian`,
          name: 'Ancient Guardian',
          description: 'A stone construct awakened to protect ancient treasures',
          type: 'guardian',
          appearance: {
            bodyType: 'construct',
            skinTexture: 'rocky',
            primaryColor: '#7D7D7D',
            size: 2.0,
            glow: true,
            emissiveColor: '#3CB6D9'
          },
          stats: {
            level: 8,
            health: 120,
            damage: 25,
            defense: 20,
            speed: 3,
            attackRange: 2.5,
            attackSpeed: 0.6,
            experienceValue: 40,
            detectRange: 15,
            aggression: 9
          },
          behavior: {
            isAggressive: true,
            isNocturnal: false,
            isPack: false,
            isTerritorial: true,
            patrolRadius: 10,
            preferredBiomes: ['ruins', 'desert']
          }
        });
        break;
        
      case 'survival':
        enemies.push({
          id: `${scenarioId}_enemy_bear`,
          name: 'Grizzly Bear',
          description: 'A powerful apex predator that fiercely defends its territory',
          type: 'bear',
          appearance: {
            bodyType: 'beast',
            skinTexture: 'furry',
            primaryColor: '#5D4037',
            size: 2.2
          },
          stats: {
            level: 10,
            health: 150,
            damage: 35,
            defense: 15,
            speed: 7,
            attackRange: 2.0,
            attackSpeed: 1.0,
            experienceValue: 50,
            detectRange: 18,
            aggression: 7
          },
          behavior: {
            isAggressive: false,
            isNocturnal: false,
            isPack: false,
            isTerritorial: true,
            patrolRadius: 25,
            preferredBiomes: ['forest', 'mountains']
          }
        });
        break;
        
      case 'fantasy':
        enemies.push({
          id: `${scenarioId}_enemy_wisp`,
          name: 'Ethereal Wisp',
          description: 'A magical entity that floats through enchanted forests',
          type: 'wisp',
          appearance: {
            bodyType: 'elemental',
            skinTexture: 'ghostly',
            primaryColor: '#5D7FFF',
            secondaryColor: '#A1C4FF',
            size: 0.8,
            glow: true,
            emissiveColor: '#5D7FFF',
            emissiveIntensity: 2.0,
            opacity: 0.7
          },
          stats: {
            level: 5,
            health: 60,
            damage: 18,
            defense: 5,
            speed: 6,
            attackRange: 8.0,
            attackSpeed: 1.5,
            experienceValue: 25,
            detectRange: 20,
            aggression: 4
          },
          behavior: {
            isAggressive: false,
            isNocturnal: true,
            isPack: true,
            isTerritorial: false,
            patrolRadius: 30,
            preferredBiomes: ['forest', 'magical']
          }
        });
        break;
        
      case 'nautical':
        enemies.push({
          id: `${scenarioId}_enemy_crab`,
          name: 'Giant Crab',
          description: 'A massive crustacean with powerful pincers',
          type: 'crab',
          appearance: {
            bodyType: 'beast',
            skinTexture: 'scaly',
            primaryColor: '#E53935',
            secondaryColor: '#B71C1C',
            size: 1.5
          },
          stats: {
            level: 4,
            health: 80,
            damage: 22,
            defense: 25,
            speed: 4,
            attackRange: 2.5,
            attackSpeed: 0.7,
            experienceValue: 20,
            detectRange: 10,
            aggression: 6
          },
          behavior: {
            isAggressive: true,
            isNocturnal: false,
            isPack: false,
            isTerritorial: true,
            patrolRadius: 15,
            preferredBiomes: ['beach', 'coastal']
          }
        });
        break;
        
      case 'industrial':
        enemies.push({
          id: `${scenarioId}_enemy_automaton`,
          name: 'Malfunctioning Automaton',
          description: 'A steam-powered construct that has broken from its programming',
          type: 'automaton',
          appearance: {
            bodyType: 'construct',
            skinTexture: 'metallic',
            primaryColor: '#78909C',
            secondaryColor: '#FF9800',
            size: 1.8
          },
          stats: {
            level: 7,
            health: 100,
            damage: 20,
            defense: 18,
            speed: 5,
            attackRange: 3.0,
            attackSpeed: 1.0,
            experienceValue: 35,
            detectRange: 15,
            aggression: 8
          },
          behavior: {
            isAggressive: true,
            isNocturnal: false,
            isPack: false,
            isTerritorial: false,
            patrolRadius: 20,
            preferredBiomes: ['urban', 'village']
          }
        });
        break;
        
      case 'apocalyptic':
        enemies.push({
          id: `${scenarioId}_enemy_mutant`,
          name: 'Wasteland Mutant',
          description: 'A humanoid twisted by radiation and harsh conditions',
          type: 'mutant',
          appearance: {
            bodyType: 'humanoid',
            skinTexture: 'rough',
            primaryColor: '#8BC34A',
            secondaryColor: '#4CAF50',
            size: 1.7
          },
          stats: {
            level: 9,
            health: 85,
            damage: 30,
            defense: 10,
            speed: 6,
            attackRange: 2.0,
            attackSpeed: 1.2,
            experienceValue: 45,
            detectRange: 16,
            aggression: 9
          },
          behavior: {
            isAggressive: true,
            isNocturnal: false,
            isPack: true,
            isTerritorial: true,
            patrolRadius: 25,
            preferredBiomes: ['wasteland', 'ruins']
          }
        });
        break;
        
      default:
        enemies.push({
          id: `${scenarioId}_enemy_goblin`,
          name: 'Forest Goblin',
          description: 'A mischievous little creature that lurks in the woods',
          type: 'goblin',
          appearance: {
            bodyType: 'humanoid',
            skinTexture: 'rough',
            primaryColor: '#8BC34A',
            size: 0.8
          },
          stats: {
            level: 2,
            health: 30,
            damage: 8,
            defense: 5,
            speed: 7,
            attackRange: 1.5,
            attackSpeed: 1.2,
            experienceValue: 10,
            detectRange: 12,
            aggression: 7
          },
          behavior: {
            isAggressive: true,
            isNocturnal: false,
            isPack: true,
            isTerritorial: false,
            patrolRadius: 15,
            preferredBiomes: ['forest', 'grassland']
          }
        });
        break;
    }
    
    // Add a second enemy if we have only one
    if (enemies.length === 1) {
      enemies.push({
        id: `${scenarioId}_enemy_spider`,
        name: 'Cave Spider',
        description: 'A large arachnid that spins webs in dark corners',
        type: 'spider',
        appearance: {
          bodyType: 'insect',
          skinTexture: 'smooth',
          primaryColor: '#343434',
          secondaryColor: '#8B0000',
          size: 1.0
        },
        stats: {
          level: 3,
          health: 25,
          damage: 12,
          defense: 3,
          speed: 8,
          attackRange: 1.5,
          attackSpeed: 1.5,
          experienceValue: 15,
          detectRange: 10,
          aggression: 6
        },
        behavior: {
          isAggressive: false,
          isNocturnal: true,
          isPack: false,
          isTerritorial: true,
          patrolRadius: 10,
          preferredBiomes: ['cave', 'forest', 'ruins']
        }
      });
    }

    // Add required fields to all enemies
    return enemies.map(enemy => ({
      ...enemy,
      scenario: scenarioId,
      createdAt: Date.now(),
      abilities: enemy.abilities || [],
      drops: enemy.drops || [],
      sounds: enemy.sounds || {}
    })) as CustomEnemy[];
  }

  private generateFallbackVegetation(scenarioId: string, theme: string): CustomVegetation[] {
    const vegetation: Partial<CustomVegetation>[] = [];
    
    // Add theme-specific vegetation
    switch (theme) {
      case 'pastoral':
        vegetation.push({
          id: `${scenarioId}_veg_oak`,
          name: 'Mighty Oak',
          description: 'A towering oak tree with sprawling branches and thick foliage',
          type: 'tree',
          appearance: {
            trunkColor: '#5D4037',
            leafColor: '#2E7D32',
            height: 8.0,
            width: 2.0,
            leafDensity: 0.8
          },
          properties: {
            age: 100,
            health: 200,
            isHarvestable: true,
            growthStage: 'mature',
            biomes: ['grassland', 'forest']
          },
          interaction: {
            harvestable: true,
            harvestTool: 'axe',
            damageToHarvest: 50,
            harvestableResources: [
              { resourceId: 'wood_log', minAmount: 4, maxAmount: 8, chance: 1.0 },
              { resourceId: 'acorn', minAmount: 1, maxAmount: 3, chance: 0.5 }
            ]
          }
        });
        vegetation.push({
          id: `${scenarioId}_veg_wheat`,
          name: 'Golden Wheat',
          description: 'Tall stalks of golden wheat swaying in the breeze',
          type: 'plant',
          appearance: {
            primaryColor: '#F9A825',
            secondaryColor: '#FBC02D',
            height: 1.2,
            width: 0.3
          },
          properties: {
            age: 1,
            health: 10,
            isHarvestable: true,
            growthStage: 'mature',
            biomes: ['grassland']
          },
          interaction: {
            harvestable: true,
            harvestTool: 'hand',
            harvestRegrowth: 300,
            harvestableResources: [
              { resourceId: 'wheat', minAmount: 1, maxAmount: 3, chance: 1.0 }
            ]
          }
        });
        break;
        
      case 'archaeological':
        vegetation.push({
          id: `${scenarioId}_veg_ancient_tree`,
          name: 'Ancient Stone Tree',
          description: 'A petrified tree from a bygone era, its branches frozen in time',
          type: 'tree',
          appearance: {
            trunkColor: '#7D7D7D',
            leafColor: '#9E9E9E',
            height: 5.0,
            width: 1.5,
            leafDensity: 0.4
          },
          properties: {
            age: 1000,
            health: 500,
            isHarvestable: true,
            growthStage: 'ancient',
            biomes: ['ruins', 'desert']
          },
          interaction: {
            harvestable: true,
            harvestTool: 'pickaxe',
            damageToHarvest: 100,
            harvestableResources: [
              { resourceId: 'petrified_wood', minAmount: 1, maxAmount: 2, chance: 0.8 },
              { resourceId: 'ancient_pollen', minAmount: 1, maxAmount: 1, chance: 0.2 }
            ]
          }
        });
        break;
        
      case 'survival':
        vegetation.push({
          id: `${scenarioId}_veg_pine`,
          name: 'Frontier Pine',
          description: 'A tall, sturdy pine tree with valuable wood and sap',
          type: 'tree',
          appearance: {
            trunkColor: '#5D4037',
            leafColor: '#1B5E20',
            height: 10.0,
            width: 1.0,
            leafDensity: 0.7
          },
          properties: {
            age: 50,
            health: 150,
            isHarvestable: true,
            growthStage: 'mature',
            biomes: ['forest', 'mountains']
          },
          interaction: {
            harvestable: true,
            harvestTool: 'axe',
            damageToHarvest: 40,
            harvestableResources: [
              { resourceId: 'pine_log', minAmount: 3, maxAmount: 6, chance: 1.0 },
              { resourceId: 'pine_sap', minAmount: 1, maxAmount: 2, chance: 0.6 }
            ]
          }
        });
        break;
        
      case 'fantasy':
        vegetation.push({
          id: `${scenarioId}_veg_glowbloom`,
          name: 'Glowbloom Flower',
          description: 'A magical flower that emits a soft, enchanting light',
          type: 'flower',
          appearance: {
            primaryColor: '#5D7FFF',
            secondaryColor: '#A1C4FF',
            height: 0.5,
            width: 0.3,
            glow: true,
            emissiveColor: '#5D7FFF',
            emissiveIntensity: 1.5
          },
          properties: {
            age: 1,
            health: 10,
            isHarvestable: true,
            growthStage: 'mature',
            biomes: ['forest', 'magical']
          },
          interaction: {
            harvestable: true,
            harvestTool: 'hand',
            harvestRegrowth: 120,
            harvestableResources: [
              { resourceId: 'glowpetal', minAmount: 1, maxAmount: 3, chance: 1.0 }
            ],
            effects: [{
              type: 'buff',
              amount: 10,
              duration: 30,
              description: 'Grants night vision for a short time'
            }]
          }
        });
        break;
        
      case 'nautical':
        vegetation.push({
          id: `${scenarioId}_veg_palm`,
          name: 'Island Palm',
          description: 'A tropical palm tree with coconuts and broad fronds',
          type: 'tree',
          appearance: {
            trunkColor: '#8D6E63',
            leafColor: '#2E7D32',
            fruitColor: '#795548',
            height: 6.0,
            width: 0.6,
            hasFruits: true
          },
          properties: {
            age: 15,
            health: 80,
            isHarvestable: true,
            growthStage: 'mature',
            biomes: ['beach', 'coastal']
          },
          interaction: {
            harvestable: true,
            harvestTool: 'axe',
            harvestRegrowth: 300,
            harvestableResources: [
              { resourceId: 'coconut', minAmount: 1, maxAmount: 3, chance: 0.7 },
              { resourceId: 'palm_frond', minAmount: 2, maxAmount: 4, chance: 1.0 }
            ]
          }
        });
        break;
        
      case 'industrial':
        vegetation.push({
          id: `${scenarioId}_veg_smog_weed`,
          name: 'Smog Weed',
          description: 'A hardy plant that thrives in polluted industrial areas',
          type: 'plant',
          appearance: {
            primaryColor: '#78909C',
            secondaryColor: '#607D8B',
            height: 1.0,
            width: 0.5
          },
          properties: {
            age: 1,
            health: 30,
            isHarvestable: true,
            growthStage: 'mature',
            biomes: ['urban', 'industrial']
          },
          interaction: {
            harvestable: true,
            harvestTool: 'hand',
            harvestRegrowth: 120,
            harvestableResources: [
              { resourceId: 'filter_fiber', minAmount: 1, maxAmount: 3, chance: 1.0 }
            ],
            effects: [{
              type: 'heal',
              amount: 5,
              description: 'Purifies air, providing minor healing'
            }]
          }
        });
        break;
        
      case 'apocalyptic':
        vegetation.push({
          id: `${scenarioId}_veg_blast_scrub`,
          name: 'Blast Scrub',
          description: 'A radiation-resistant bush with thorny branches',
          type: 'bush',
          appearance: {
            primaryColor: '#827717',
            secondaryColor: '#9E9D24',
            height: 1.2,
            width: 1.0
          },
          properties: {
            age: 5,
            health: 60,
            isHarvestable: true,
            growthStage: 'mature',
            biomes: ['wasteland', 'desert']
          },
          interaction: {
            harvestable: true,
            harvestTool: 'knife',
            harvestRegrowth: 240,
            harvestableResources: [
              { resourceId: 'mutant_fiber', minAmount: 1, maxAmount: 3, chance: 1.0 },
              { resourceId: 'rad_berry', minAmount: 1, maxAmount: 2, chance: 0.4 }
            ]
          }
        });
        break;
        
      default:
        vegetation.push({
          id: `${scenarioId}_veg_maple`,
          name: 'Maple Tree',
          description: 'A beautiful maple tree with broad leaves',
          type: 'tree',
          appearance: {
            trunkColor: '#5D4037',
            leafColor: '#4CAF50',
            height: 7.0,
            width: 1.5,
            leafDensity: 0.9
          },
          properties: {
            age: 40,
            health: 120,
            isHarvestable: true,
            growthStage: 'mature',
            biomes: ['forest', 'grassland']
          },
          interaction: {
            harvestable: true,
            harvestTool: 'axe',
            harvestableResources: [
              { resourceId: 'wood_log', minAmount: 3, maxAmount: 6, chance: 1.0 },
              { resourceId: 'maple_sap', minAmount: 1, maxAmount: 2, chance: 0.5 }
            ]
          }
        });
        break;
    }
    
    // Add a default bush type if we only have one vegetation type
    if (vegetation.length === 1) {
      vegetation.push({
        id: `${scenarioId}_veg_bush`,
        name: 'Wild Berry Bush',
        description: 'A bushy plant with sweet berries',
        type: 'bush',
        appearance: {
          primaryColor: '#388E3C',
          fruitColor: '#D32F2F',
          height: 1.0,
          width: 1.0,
          hasFruits: true
        },
        properties: {
          age: 3,
          health: 30,
          isHarvestable: true,
          growthStage: 'mature',
          biomes: ['forest', 'grassland']
        },
        interaction: {
          harvestable: true,
          harvestTool: 'hand',
          harvestRegrowth: 180,
          harvestableResources: [
            { resourceId: 'berry', minAmount: 2, maxAmount: 5, chance: 1.0 }
          ]
        }
      });
    }

    // Add required fields to all vegetation
    return vegetation.map(veg => ({
      ...veg,
      scenario: scenarioId,
      createdAt: Date.now()
    })) as CustomVegetation[];
  }

  private generateFallbackItems(scenarioId: string, theme: string): CustomItem[] {
    const items: Partial<CustomItem>[] = [];
    
    // Theme-specific items
    switch (theme) {
      case 'pastoral':
        items.push({
          id: `${scenarioId}_item_milk`,
          name: 'Fresh Milk',
          description: 'Creamy milk from local cows, perfect for recipes',
          type: 'consumable',
          appearance: {
            icon: '🥛',
            primaryColor: '#FFFFFF',
            worldScale: { x: 0.5, y: 0.5, z: 0.5 }
          },
          properties: {
            value: 5,
            weight: 1,
            rarity: 'common',
            stackable: true,
            maxStack: 5,
            consumable: true,
            questItem: false,
            tradeable: true,
            craftingIngredient: true
          },
          effects: [{
            type: 'heal',
            value: 10,
            target: 'self',
            description: 'Restores health points'
          }]
        });
        break;
        
      case 'archaeological':
        items.push({
          id: `${scenarioId}_item_artifact`,
          name: 'Ancient Amulet',
          description: 'A mysterious amulet with faint magical properties',
          type: 'quest',
          appearance: {
            icon: '🧿',
            primaryColor: '#4FC3F7',
            secondaryColor: '#9575CD',
            worldScale: { x: 0.2, y: 0.2, z: 0.05 },
            glow: true
          },
          properties: {
            value: 50,
            weight: 0.5,
            rarity: 'rare',
            stackable: false,
            maxStack: 1,
            consumable: false,
            questItem: true,
            tradeable: true,
            lore: 'Said to have belonged to the high priests of a forgotten civilization',
            craftingIngredient: false
          }
        });
        break;
        
      case 'survival':
        items.push({
          id: `${scenarioId}_item_jerky`,
          name: 'Dried Meat',
          description: 'Long-lasting preserved meat for wilderness journeys',
          type: 'consumable',
          appearance: {
            icon: '🥩',
            primaryColor: '#A1887F',
            worldScale: { x: 0.3, y: 0.1, z: 0.2 }
          },
          properties: {
            value: 8,
            weight: 0.5,
            rarity: 'common',
            stackable: true,
            maxStack: 10,
            consumable: true,
            questItem: false,
            tradeable: true,
            craftingIngredient: false
          },
          effects: [{
            type: 'heal',
            value: 15,
            target: 'self',
            description: 'Restores health points and reduces hunger'
          }]
        });
        break;
        
      case 'fantasy':
        items.push({
          id: `${scenarioId}_item_mana_crystal`,
          name: 'Mana Crystal',
          description: 'A vibrant crystal humming with magical energy',
          type: 'resource',
          appearance: {
            icon: '💎',
            primaryColor: '#5D7FFF',
            worldScale: { x: 0.2, y: 0.3, z: 0.2 },
            glow: true,
            emissiveColor: '#5D7FFF',
            emissiveIntensity: 1.5
          },
          properties: {
            value: 25,
            weight: 0.3,
            rarity: 'uncommon',
            stackable: true,
            maxStack: 20,
            consumable: false,
            questItem: false,
            tradeable: true,
            craftingIngredient: true
          }
        });
        break;
        
      case 'nautical':
        items.push({
          id: `${scenarioId}_item_pearl`,
          name: 'Lustrous Pearl',
          description: 'A perfect pearl with a beautiful sheen',
          type: 'resource',
          appearance: {
            icon: '🔘',
            primaryColor: '#F5F5F5',
            worldScale: { x: 0.1, y: 0.1, z: 0.1 }
          },
          properties: {
            value: 35,
            weight: 0.1,
            rarity: 'uncommon',
            stackable: true,
            maxStack: 50,
            consumable: false,
            questItem: false,
            tradeable: true,
            craftingIngredient: true
          }
        });
        break;
        
      case 'industrial':
        items.push({
          id: `${scenarioId}_item_gear`,
          name: 'Brass Gear',
          description: 'A precision-crafted gear for machinery',
          type: 'resource',
          appearance: {
            icon: '⚙️',
            primaryColor: '#D4AF37',
            worldScale: { x: 0.2, y: 0.2, z: 0.05 }
          },
          properties: {
            value: 12,
            weight: 0.8,
            rarity: 'common',
            stackable: true,
            maxStack: 25,
            consumable: false,
            questItem: false,
            tradeable: true,
            craftingIngredient: true
          }
        });
        break;
        
      case 'apocalyptic':
        items.push({
          id: `${scenarioId}_item_ration`,
          name: 'Emergency Ration',
          description: 'A preserved food packet from before the collapse',
          type: 'consumable',
          appearance: {
            icon: '🥫',
            primaryColor: '#607D8B',
            worldScale: { x: 0.3, y: 0.2, z: 0.1 }
          },
          properties: {
            value: 15,
            weight: 0.5,
            rarity: 'uncommon',
            stackable: true,
            maxStack: 10,
            consumable: true,
            questItem: false,
            tradeable: true,
            craftingIngredient: false
          },
          effects: [{
            type: 'heal',
            value: 25,
            target: 'self',
            description: 'Restores significant health and provides radiation resistance'
          }]
        });
        break;
        
      default:
        items.push({
          id: `${scenarioId}_item_potion`,
          name: 'Health Potion',
          description: 'A red liquid that restores vitality',
          type: 'consumable',
          appearance: {
            icon: '🧪',
            primaryColor: '#F44336',
            worldScale: { x: 0.2, y: 0.4, z: 0.2 }
          },
          properties: {
            value: 10,
            weight: 0.2,
            rarity: 'common',
            stackable: true,
            maxStack: 10,
            consumable: true,
            questItem: false,
            tradeable: true,
            craftingIngredient: false
          },
          effects: [{
            type: 'heal',
            value: 20,
            target: 'self',
            description: 'Restores health points'
          }]
        });
        break;
    }
    
    // Add a second item if we only have one
    if (items.length === 1) {
      items.push({
        id: `${scenarioId}_item_coin`,
        name: 'Gold Coin',
        description: 'A standard currency unit accepted by most merchants',
        type: 'currency',
        appearance: {
          icon: '🪙',
          primaryColor: '#FFD700',
          worldScale: { x: 0.1, y: 0.1, z: 0.02 }
        },
        properties: {
          value: 1,
          weight: 0.01,
          rarity: 'common',
          stackable: true,
          maxStack: 999,
          consumable: false,
          questItem: false,
          tradeable: true,
          craftingIngredient: false
        }
      });
    }

    // Add required fields to all items
    return items.map(item => ({
      ...item,
      scenario: scenarioId,
      createdAt: Date.now()
    })) as CustomItem[];
  }

  private generateFallbackStructures(scenarioId: string, theme: string): CustomStructure[] {
    const structures: Partial<CustomStructure>[] = [];
    
    // Theme-specific structures
    switch (theme) {
      case 'pastoral':
        structures.push({
          id: `${scenarioId}_struct_barn`,
          name: 'Wooden Barn',
          description: 'A sturdy wooden barn for storing farm equipment and hay',
          type: 'building',
          appearance: {
            materialType: 'wood',
            style: 'rustic',
            primaryColor: '#A1887F',
            secondaryColor: '#D7CCC8',
            height: 8,
            width: 10,
            length: 15,
            hasDoor: true,
            hasRoof: true
          },
          properties: {
            age: 15,
            purpose: 'storage',
            isSolid: true,
            isFlammable: true,
            health: 500,
            biomes: ['grassland']
          },
          interaction: {
            canEnter: true,
            canLoot: true,
            lootTable: [
              { itemId: 'hay', minQuantity: 5, maxQuantity: 10, chance: 0.8 },
              { itemId: 'rope', minQuantity: 1, maxQuantity: 3, chance: 0.5 }
            ]
          }
        });
        break;
        
      case 'archaeological':
        structures.push({
          id: `${scenarioId}_struct_temple`,
          name: 'Ancient Temple',
          description: 'A weathered stone temple with mysterious carvings',
          type: 'ruin',
          appearance: {
            materialType: 'stone',
            style: 'ancient',
            primaryColor: '#9E9E9E',
            secondaryColor: '#607D8B',
            height: 12,
            width: 20,
            length: 25,
            hasDoor: true,
            isRuined: true,
            weathered: true
          },
          properties: {
            age: 2000,
            civilization: 'Lost Empire',
            purpose: 'worship',
            lore: 'Built to honor forgotten gods from a time before recorded history',
            isSolid: true,
            isClimbable: true,
            health: 2000,
            biomes: ['desert', 'ruins']
          },
          interaction: {
            canEnter: true,
            canLoot: true,
            lootTable: [
              { itemId: 'ancient_coin', minQuantity: 1, maxQuantity: 5, chance: 0.7 },
              { itemId: 'artifact', minQuantity: 1, maxQuantity: 1, chance: 0.2 }
            ],
            containsEnemy: true
          }
        });
        break;
        
      case 'survival':
        structures.push({
          id: `${scenarioId}_struct_cabin`,
          name: 'Abandoned Cabin',
          description: 'A lonely wooden cabin deep in the wilderness',
          type: 'building',
          appearance: {
            materialType: 'wood',
            style: 'rustic',
            primaryColor: '#5D4037',
            secondaryColor: '#795548',
            height: 6,
            width: 8,
            length: 10,
            hasDoor: true,
            hasWindows: true,
            hasRoof: true,
            weathered: true
          },
          properties: {
            age: 30,
            purpose: 'shelter',
            lore: 'Once belonged to a trapper who disappeared mysteriously',
            isSolid: true,
            isFlammable: true,
            health: 300,
            biomes: ['forest', 'mountains']
          },
          interaction: {
            canEnter: true,
            canLoot: true,
            lootTable: [
              { itemId: 'preserved_food', minQuantity: 1, maxQuantity: 3, chance: 0.6 },
              { itemId: 'hunting_knife', minQuantity: 1, maxQuantity: 1, chance: 0.3 }
            ]
          }
        });
        break;
        
      case 'fantasy':
        structures.push({
          id: `${scenarioId}_struct_tower`,
          name: 'Wizard\'s Tower',
          description: 'A tall magical tower with glowing crystals embedded in the walls',
          type: 'building',
          appearance: {
            materialType: 'stone',
            style: 'magical',
            primaryColor: '#303F9F',
            secondaryColor: '#7986CB',
            height: 20,
            width: 8,
            length: 8,
            hasDoor: true,
            hasWindows: true,
            hasRoof: true,
            glow: true,
            emissiveColor: '#3F51B5'
          },
          properties: {
            age: 300,
            purpose: 'magical research',
            lore: 'Home to a powerful but reclusive wizard',
            isSolid: true,
            isFlammable: false,
            health: 800,
            biomes: ['forest', 'mountains', 'magical']
          },
          interaction: {
            canEnter: false,
            triggers: [
              { 
                type: 'proximity',
                effect: 'magical_aura',
                description: 'A tingling sensation as magic flows through you'
              }
            ],
            containsNPC: true
          }
        });
        break;
        
      case 'nautical':
        structures.push({
          id: `${scenarioId}_struct_lighthouse`,
          name: 'Coastal Lighthouse',
          description: 'A tall lighthouse guiding ships safely to shore',
          type: 'building',
          appearance: {
            materialType: 'stone',
            style: 'rustic',
            primaryColor: '#FFFFFF',
            secondaryColor: '#FF5722',
            height: 15,
            width: 6,
            length: 6,
            hasDoor: true,
            hasWindows: true,
            hasRoof: true,
            glow: true,
            emissiveColor: '#FFEB3B'
          },
          properties: {
            age: 80,
            purpose: 'navigation',
            isSolid: true,
            isClimbable: true,
            health: 600,
            biomes: ['coastal', 'beach']
          },
          interaction: {
            canEnter: true,
            containsNPC: true,
            lootTable: [
              { itemId: 'telescope', minQuantity: 1, maxQuantity: 1, chance: 0.3 },
              { itemId: 'nautical_map', minQuantity: 1, maxQuantity: 1, chance: 0.5 }
            ]
          }
        });
        break;
        
      case 'industrial':
        structures.push({
          id: `${scenarioId}_struct_factory`,
          name: 'Steam Factory',
          description: 'A large industrial building with smoke stacks and machinery',
          type: 'building',
          appearance: {
            materialType: 'metal',
            style: 'technological',
            primaryColor: '#607D8B',
            secondaryColor: '#455A64',
            height: 14,
            width: 20,
            length: 30,
            hasDoor: true,
            hasWindows: true,
            hasRoof: true
          },
          properties: {
            age: 50,
            purpose: 'manufacturing',
            isSolid: true,
            isFlammable: false,
            health: 1000,
            biomes: ['urban', 'village']
          },
          interaction: {
            canEnter: true,
            containsNPC: true,
            containsEnemy: true,
            lootTable: [
              { itemId: 'gear', minQuantity: 1, maxQuantity: 5, chance: 0.7 },
              { itemId: 'blueprint', minQuantity: 1, maxQuantity: 1, chance: 0.4 }
            ]
          }
        });
        break;
        
      case 'apocalyptic':
        structures.push({
          id: `${scenarioId}_struct_bunker`,
          name: 'Survival Bunker',
          description: 'A reinforced underground shelter from before the collapse',
          type: 'building',
          appearance: {
            materialType: 'metal',
            style: 'technological',
            primaryColor: '#4E342E',
            secondaryColor: '#78909C',
            height: 3,
            width: 10,
            length: 15,
            hasDoor: true,
            hasWindows: false,
            hasRoof: true
          },
          properties: {
            age: 20,
            purpose: 'shelter',
            lore: 'Built to protect inhabitants from catastrophic events',
            isSolid: true,
            isFlammable: false,
            health: 2000,
            biomes: ['wasteland', 'ruins']
          },
          interaction: {
            canEnter: true,
            canLoot: true,
            lootTable: [
              { itemId: 'ration', minQuantity: 1, maxQuantity: 3, chance: 0.6 },
              { itemId: 'gas_mask', minQuantity: 1, maxQuantity: 1, chance: 0.3 },
              { itemId: 'radiation_pills', minQuantity: 1, maxQuantity: 2, chance: 0.4 }
            ],
            containsEnemy: true
          }
        });
        break;
        
      default:
        structures.push({
          id: `${scenarioId}_struct_cottage`,
          name: 'Stone Cottage',
          description: 'A cozy cottage with a thatched roof',
          type: 'building',
          appearance: {
            materialType: 'stone',
            style: 'rustic',
            primaryColor: '#9E9E9E',
            secondaryColor: '#8D6E63',
            height: 5,
            width: 7,
            length: 9,
            hasDoor: true,
            hasWindows: true,
            hasRoof: true
          },
          properties: {
            age: 40,
            purpose: 'dwelling',
            isSolid: true,
            isFlammable: false,
            health: 400,
            biomes: ['grassland', 'forest', 'village']
          },
          interaction: {
            canEnter: true,
            canLoot: true,
            lootTable: [
              { itemId: 'bread', minQuantity: 1, maxQuantity: 2, chance: 0.5 },
              { itemId: 'book', minQuantity: 1, maxQuantity: 1, chance: 0.3 }
            ],
            containsNPC: true
          }
        });
        break;
    }

    // Add required fields to all structures
    return structures.map(structure => ({
      ...structure,
      scenario: scenarioId,
      createdAt: Date.now()
    })) as CustomStructure[];
  }

  private generateFallbackWeapons(scenarioId: string, theme: string): CustomWeapon[] {
    const weapons: Partial<CustomWeapon>[] = [];
    
    // Theme-specific weapons
    switch (theme) {
      case 'pastoral':
        weapons.push({
          id: `${scenarioId}_weapon_pitchfork`,
          name: 'Farmer\'s Pitchfork',
          description: 'A simple farming tool that can also serve as a weapon',
          weaponType: 'spear',
          type: 'resource',
          appearance: {
            icon: '🍴',
            primaryColor: '#8D6E63',
            secondaryColor: '#795548'
          },
          properties: {
            value: 15,
            weight: 3.0,
            rarity: 'common',
            stackable: false,
            maxStack: 1,
            durability: 100,
            consumable: false,
            questItem: false,
            tradeable: true,
            craftingIngredient: false
          },
          combatStats: {
            damage: 12,
            criticalChance: 0.1,
            criticalMultiplier: 1.5,
            range: 2.5,
            speed: 0.8,
            durability: 100
          }
        });
        break;
        
      case 'archaeological':
        weapons.push({
          id: `${scenarioId}_weapon_ancient_blade`,
          name: 'Ancient Ceremonial Blade',
          description: 'A beautifully preserved blade from a lost civilization',
          weaponType: 'sword',
          type: 'resource',
          appearance: {
            icon: '🗡️',
            primaryColor: '#9E9E9E',
            secondaryColor: '#4DB6AC',
            glow: true,
            emissiveColor: '#4DB6AC'
          },
          properties: {
            value: 75,
            weight: 1.5,
            rarity: 'rare',
            stackable: false,
            maxStack: 1,
            durability: 150,
            consumable: false,
            questItem: false,
            tradeable: true,
            lore: 'Used in ancient rituals to honor forgotten gods',
            craftingIngredient: false
          },
          combatStats: {
            damage: 25,
            criticalChance: 0.15,
            criticalMultiplier: 2.0,
            range: 1.8,
            speed: 1.2,
            durability: 150
          }
        });
        break;
        
      case 'survival':
        weapons.push({
          id: `${scenarioId}_weapon_hunting_bow`,
          name: 'Frontier Hunting Bow',
          description: 'A well-crafted bow made from seasoned wood',
          weaponType: 'bow',
          type: 'resource',
          appearance: {
            icon: '🏹',
            primaryColor: '#5D4037',
            secondaryColor: '#8D6E63'
          },
          properties: {
            value: 30,
            weight: 1.0,
            rarity: 'uncommon',
            stackable: false,
            maxStack: 1,
            durability: 120,
            consumable: false,
            questItem: false,
            tradeable: true,
            craftingIngredient: false
          },
          combatStats: {
            damage: 18,
            criticalChance: 0.2,
            criticalMultiplier: 2.5,
            range: 10.0,
            speed: 1.0,
            durability: 120
          }
        });
        break;
        
      case 'fantasy':
        weapons.push({
          id: `${scenarioId}_weapon_staff`,
          name: 'Arcane Staff',
          description: 'A wooden staff infused with magical energy',
          weaponType: 'staff',
          type: 'resource',
          appearance: {
            icon: '🪄',
            primaryColor: '#4527A0',
            secondaryColor: '#5E35B1',
            glow: true,
            emissiveColor: '#7E57C2'
          },
          properties: {
            value: 65,
            weight: 1.5,
            rarity: 'uncommon',
            stackable: false,
            maxStack: 1,
            durability: 200,
            consumable: false,
            questItem: false,
            tradeable: true,
            lore: 'Crafted by the forest mages to channel natural energies',
            craftingIngredient: false
          },
          combatStats: {
            damage: 22,
            criticalChance: 0.15,
            criticalMultiplier: 2.0,
            range: 8.0,
            speed: 1.1,
            durability: 200
          }
        });
        break;
        
      case 'nautical':
        weapons.push({
          id: `${scenarioId}_weapon_harpoon`,
          name: 'Whaler\'s Harpoon',
          description: 'A long, heavy spear used for fishing and defense',
          weaponType: 'spear',
          type: 'resource',
          appearance: {
            icon: '🔱',
            primaryColor: '#8D6E63',
            secondaryColor: '#B0BEC5'
          },
          properties: {
            value: 45,
            weight: 4.0,
            rarity: 'uncommon',
            stackable: false,
            maxStack: 1,
            durability: 180,
            consumable: false,
            questItem: false,
            tradeable: true,
            craftingIngredient: false
          },
          combatStats: {
            damage: 30,
            criticalChance: 0.1,
            criticalMultiplier: 2.0,
            range: 3.0,
            speed: 0.7,
            durability: 180
          }
        });
        break;
        
      case 'industrial':
        weapons.push({
          id: `${scenarioId}_weapon_wrench`,
          name: 'Heavy Wrench',
          description: 'A large metal wrench that doubles as a bludgeoning weapon',
          weaponType: 'hammer',
          type: 'resource',
          appearance: {
            icon: '🔧',
            primaryColor: '#78909C',
            secondaryColor: '#607D8B'
          },
          properties: {
            value: 20,
            weight: 2.5,
            rarity: 'common',
            stackable: false,
            maxStack: 1,
            durability: 250,
            consumable: false,
            questItem: false,
            tradeable: true,
            craftingIngredient: false
          },
          combatStats: {
            damage: 15,
            criticalChance: 0.12,
            criticalMultiplier: 1.8,
            range: 1.5,
            speed: 0.9,
            durability: 250
          }
        });
        break;
        
      case 'apocalyptic':
        weapons.push({
          id: `${scenarioId}_weapon_pipe`,
          name: 'Reinforced Pipe',
          description: 'A length of metal pipe wrapped with wire for better grip',
          weaponType: 'hammer',
          type: 'resource',
          appearance: {
            icon: '🧰',
            primaryColor: '#78909C',
            secondaryColor: '#B0BEC5'
          },
          properties: {
            value: 12,
            weight: 2.0,
            rarity: 'common',
            stackable: false,
            maxStack: 1,
            durability: 150,
            consumable: false,
            questItem: false,
            tradeable: true,
            craftingIngredient: false
          },
          combatStats: {
            damage: 18,
            criticalChance: 0.1,
            criticalMultiplier: 1.7,
            range: 1.6,
            speed: 1.0,
            durability: 150
          }
        });
        break;
        
      default:
        weapons.push({
          id: `${scenarioId}_weapon_sword`,
          name: 'Simple Sword',
          description: 'A basic but reliable steel sword',
          weaponType: 'sword',
          type: 'resource',
          appearance: {
            icon: '⚔️',
            primaryColor: '#B0BEC5',
            secondaryColor: '#8D6E63'
          },
          properties: {
            value: 25,
            weight: 1.5,
            rarity: 'common',
            stackable: false,
            maxStack: 1,
            durability: 100,
            consumable: false,
            questItem: false,
            tradeable: true,
            craftingIngredient: false
          },
          combatStats: {
            damage: 15,
            criticalChance: 0.1,
            criticalMultiplier: 1.5,
            range: 1.5,
            speed: 1.0,
            durability: 100
          }
        });
        break;
    }

    // Add required fields to all weapons
    return weapons.map(weapon => ({
      ...weapon,
      scenario: scenarioId,
      createdAt: Date.now()
    })) as CustomWeapon[];
  }

  private generateFallbackTools(scenarioId: string, theme: string): CustomTool[] {
    const tools: Partial<CustomTool>[] = [];
    
    // Theme-specific tools
    switch (theme) {
      case 'pastoral':
        tools.push({
          id: `${scenarioId}_tool_hoe`,
          name: 'Farmer\'s Hoe',
          description: 'A sturdy tool for tilling soil',
          type: 'resource',
          toolType: 'hoe',
          appearance: {
            icon: '🧹',
            primaryColor: '#8D6E63',
            secondaryColor: '#795548'
          },
          properties: {
            value: 10,
            weight: 2.0,
            rarity: 'common',
            stackable: false,
            maxStack: 1,
            durability: 120,
            consumable: false,
            questItem: false,
            tradeable: true,
            craftingIngredient: false
          },
          toolStats: {
            efficiency: 1.0,
            durability: 120,
            harvestLevel: 1
          },
          effectiveAgainst: ['soil', 'clay']
        });
        break;
        
      case 'archaeological':
        tools.push({
          id: `${scenarioId}_tool_brush`,
          name: 'Archaeological Brush',
          description: 'A delicate brush for cleaning and examining artifacts',
          type: 'resource',
          toolType: 'custom',
          appearance: {
            icon: '🧹',
            primaryColor: '#D7CCC8',
            secondaryColor: '#A1887F'
          },
          properties: {
            value: 8,
            weight: 0.2,
            rarity: 'uncommon',
            stackable: false,
            maxStack: 1,
            durability: 50,
            consumable: false,
            questItem: false,
            tradeable: true,
            craftingIngredient: false
          },
          toolStats: {
            efficiency: 1.5,
            durability: 50,
            harvestLevel: 1
          },
          effectiveAgainst: ['artifact', 'ruin']
        });
        break;
        
      case 'survival':
        tools.push({
          id: `${scenarioId}_tool_hunting_knife`,
          name: 'Hunting Knife',
          description: 'A sharp knife perfect for skinning and preparing game',
          type: 'resource',
          toolType: 'custom',
          appearance: {
            icon: '🔪',
            primaryColor: '#B0BEC5',
            secondaryColor: '#8D6E63'
          },
          properties: {
            value: 20,
            weight: 0.5,
            rarity: 'common',
            stackable: false,
            maxStack: 1,
            durability: 100,
            consumable: false,
            questItem: false,
            tradeable: true,
            craftingIngredient: false
          },
          toolStats: {
            efficiency: 1.2,
            durability: 100,
            harvestLevel: 1
          },
          effectiveAgainst: ['animal', 'plant', 'rope']
        });
        break;
        
      case 'fantasy':
        tools.push({
          id: `${scenarioId}_tool_enchanted_sickle`,
          name: 'Enchanted Sickle',
          description: 'A magical sickle that helps harvest rare herbs',
          type: 'resource',
          toolType: 'custom',
          appearance: {
            icon: '🪓',
            primaryColor: '#7986CB',
            secondaryColor: '#3F51B5',
            glow: true,
            emissiveColor: '#7986CB'
          },
          properties: {
            value: 40,
            weight: 0.8,
            rarity: 'rare',
            stackable: false,
            maxStack: 1,
            durability: 150,
            consumable: false,
            questItem: false,
            tradeable: true,
            craftingIngredient: false
          },
          toolStats: {
            efficiency: 2.0,
            durability: 150,
            harvestLevel: 2
          },
          effectiveAgainst: ['magical_plant', 'herb']
        });
        break;
        
      case 'nautical':
        tools.push({
          id: `${scenarioId}_tool_fishing_rod`,
          name: 'Master Angler\'s Rod',
          description: 'A well-crafted fishing rod for catching exotic fish',
          type: 'resource',
          toolType: 'fishing_rod',
          appearance: {
            icon: '🎣',
            primaryColor: '#8D6E63',
            secondaryColor: '#B0BEC5'
          },
          properties: {
            value: 35,
            weight: 1.0,
            rarity: 'uncommon',
            stackable: false,
            maxStack: 1,
            durability: 80,
            consumable: false,
            questItem: false,
            tradeable: true,
            craftingIngredient: false
          },
          toolStats: {
            efficiency: 1.8,
            durability: 80,
            harvestLevel: 2
          },
          effectiveAgainst: ['fish', 'water_plant']
        });
        break;
        
      case 'industrial':
        tools.push({
          id: `${scenarioId}_tool_precision_screwdriver`,
          name: 'Precision Screwdriver',
          description: 'A finely-crafted tool for delicate mechanical work',
          type: 'resource',
          toolType: 'custom',
          appearance: {
            icon: '🔧',
            primaryColor: '#B0BEC5',
            secondaryColor: '#607D8B'
          },
          properties: {
            value: 18,
            weight: 0.3,
            rarity: 'uncommon',
            stackable: false,
            maxStack: 1,
            durability: 90,
            consumable: false,
            questItem: false,
            tradeable: true,
            craftingIngredient: false
          },
          toolStats: {
            efficiency: 1.5,
            durability: 90,
            harvestLevel: 2
          },
          effectiveAgainst: ['mechanical', 'electrical']
        });
        break;
        
      case 'apocalyptic':
        tools.push({
          id: `${scenarioId}_tool_scavenger_crowbar`,
          name: 'Scavenger\'s Crowbar',
          description: 'A versatile tool for prying open containers and salvaging materials',
          type: 'resource',
          toolType: 'custom',
          appearance: {
            icon: '⛏️',
            primaryColor: '#78909C',
            secondaryColor: '#607D8B'
          },
          properties: {
            value: 25,
            weight: 2.0,
            rarity: 'common',
            stackable: false,
            maxStack: 1,
            durability: 200,
            consumable: false,
            questItem: false,
            tradeable: true,
            craftingIngredient: false
          },
          toolStats: {
            efficiency: 1.3,
            durability: 200,
            harvestLevel: 2
          },
          effectiveAgainst: ['door', 'container', 'metal', 'wood']
        });
        break;
        
      default:
        tools.push({
          id: `${scenarioId}_tool_pickaxe`,
          name: 'Iron Pickaxe',
          description: 'A sturdy pickaxe for mining stone and minerals',
          type: 'resource',
          toolType: 'pickaxe',
          appearance: {
            icon: '⛏️',
            primaryColor: '#B0BEC5',
            secondaryColor: '#8D6E63'
          },
          properties: {
            value: 15,
            weight: 2.5,
            rarity: 'common',
            stackable: false,
            maxStack: 1,
            durability: 150,
            consumable: false,
            questItem: false,
            tradeable: true,
            craftingIngredient: false
          },
          toolStats: {
            efficiency: 1.0,
            durability: 150,
            harvestLevel: 1
          },
          effectiveAgainst: ['stone', 'ore', 'mineral']
        });
        break;
    }

    // Add required fields to all tools
    return tools.map(tool => ({
      ...tool,
      scenario: scenarioId,
      createdAt: Date.now()
    })) as CustomTool[];
  }

  getObjectsForScenario(scenarioId: string): GeneratedObjectSet | null {
    return this.cachedObjectSets.get(scenarioId) || null;
  }

  getObjectsByCategory(scenarioId: string, category: ObjectCategory): CustomizableObject[] | null {
    const objectSet = this.cachedObjectSets.get(scenarioId);
    if (!objectSet || !objectSet.objects[category]) return null;
    return objectSet.objects[category] || null;
  }

  clear(): void {
    this.cachedObjectSets.clear();
  }
}
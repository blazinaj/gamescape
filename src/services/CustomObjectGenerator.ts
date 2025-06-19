import { 
  GeneratedObjectSet,
  AppearanceProperties,
  EnvironmentContext,
  ObjectCategory
} from '../types/BaseObjectTypes';

import { CustomVegetation } from '../types/CustomVegetationTypes';
import { CustomEnemy } from '../types/CustomEnemyTypes';
import { CustomItem, CustomWeapon, CustomTool } from '../types/CustomItemTypes';
import { CustomStructure } from '../types/CustomStructureTypes';

/**
 * Generates custom objects based on scenario context
 * In a real implementation, this would use AI to generate objects
 * For now, it returns reasonable defaults based on scenario theme
 */
export class CustomObjectGenerator {
  private cache: Map<string, GeneratedObjectSet> = new Map();

  async generateObjectSet(
    scenarioId: string,
    scenarioPrompt: string,
    scenarioTheme: string
  ): Promise<GeneratedObjectSet> {
    console.log(`🌍 Generating object set for scenario: ${scenarioId}`);
    
    // Return from cache if available
    if (this.cache.has(scenarioId)) {
      console.log(`🔄 Using cached object set for scenario: ${scenarioId}`);
      return this.cache.get(scenarioId)!;
    }
    
    // Generate based on theme
    const objectSet = this.generateBasedOnTheme(scenarioId, scenarioTheme);
    
    // Cache for later use
    this.cache.set(scenarioId, objectSet);
    
    console.log(`✅ Generated object set with ${
      Object.values(objectSet.objects).reduce((sum, arr) => sum + (arr?.length || 0), 0)
    } total objects`);
    
    return objectSet;
  }
  
  private generateBasedOnTheme(scenarioId: string, theme: string): GeneratedObjectSet {
    // Base object set
    const objectSet: GeneratedObjectSet = {
      scenarioId,
      theme,
      environmentContexts: {
        default: {
          biome: 'grassland',
          climate: 'temperate'
        }
      },
      objects: {}
    };
    
    // Add theme-specific objects
    switch (theme) {
      case 'pastoral':
        objectSet.objects.enemy = this.generatePastoralEnemies();
        objectSet.objects.vegetation = this.generatePastoralVegetation();
        objectSet.objects.item = this.generatePastoralItems();
        break;
      case 'archaeological':
        objectSet.objects.enemy = this.generateArchaeologicalEnemies();
        objectSet.objects.structure = this.generateArchaeologicalStructures();
        objectSet.objects.item = this.generateArchaeologicalItems();
        break;
      case 'survival':
        objectSet.objects.enemy = this.generateSurvivalEnemies();
        objectSet.objects.tool = this.generateSurvivalTools();
        objectSet.objects.item = this.generateSurvivalItems();
        break;
      case 'fantasy':
        objectSet.objects.enemy = this.generateFantasyEnemies();
        objectSet.objects.weapon = this.generateFantasyWeapons();
        objectSet.objects.item = this.generateFantasyItems();
        break;
      case 'nautical':
        objectSet.objects.enemy = this.generateNauticalEnemies();
        objectSet.objects.item = this.generateNauticalItems();
        break;
      case 'industrial':
        objectSet.objects.enemy = this.generateIndustrialEnemies();
        objectSet.objects.tool = this.generateIndustrialTools();
        objectSet.objects.item = this.generateIndustrialItems();
        break;
      case 'apocalyptic':
        objectSet.objects.enemy = this.generateApocalypticEnemies();
        objectSet.objects.item = this.generateApocalypticItems();
        objectSet.objects.weapon = this.generateApocalypticWeapons();
        break;
      default:
        // Default objects
        objectSet.objects.enemy = this.generateDefaultEnemies();
        objectSet.objects.item = this.generateDefaultItems();
    }
    
    return objectSet;
  }
  
  // ======= Enemy Generators =======
  
  private generatePastoralEnemies(): CustomEnemy[] {
    return [
      {
        id: 'wild_boar',
        name: 'Wild Boar',
        description: 'A territorial wild boar that defends its territory',
        scenario: 'pastoral',
        type: 'boar',
        createdAt: Date.now(),
        appearance: {
          bodyType: 'beast',
          primaryColor: '#8B4513',
          skinTexture: 'furry',
          scale: 0.8
        },
        stats: {
          level: 1,
          health: 50,
          damage: 10,
          defense: 5,
          speed: 2.5,
          attackRange: 1.5,
          attackSpeed: 1,
          experienceValue: 15,
          detectRange: 6,
          aggression: 4
        },
        behavior: {
          isAggressive: false,
          isNocturnal: false,
          isPack: false,
          isTerritorial: true,
          fleeThreshold: 30,
          patrolRadius: 10,
          preferredBiomes: ['grassland', 'forest']
        },
        abilities: [
          {
            name: 'Charge',
            type: 'melee',
            damage: 15,
            cooldown: 8,
            range: 2
          }
        ],
        drops: [
          { itemId: 'wood_log', minQuantity: 1, maxQuantity: 2, chance: 0.6 }
        ],
        sounds: {
          idle: 'boar_grunt',
          attack: 'boar_charge'
        }
      },
      {
        id: 'farm_wolf',
        name: 'Farm Wolf',
        description: 'A wolf that prowls farmlands looking for prey',
        scenario: 'pastoral',
        type: 'wolf',
        createdAt: Date.now(),
        appearance: {
          bodyType: 'beast',
          primaryColor: '#A9A9A9',
          skinTexture: 'furry',
          scale: 0.9
        },
        stats: {
          level: 2,
          health: 60,
          damage: 12,
          defense: 3,
          speed: 3.5,
          attackRange: 2,
          attackSpeed: 1.2,
          experienceValue: 20,
          detectRange: 8,
          aggression: 6
        },
        behavior: {
          isAggressive: true,
          isNocturnal: true,
          isPack: true,
          isTerritorial: false,
          patrolRadius: 15
        },
        abilities: [
          {
            name: 'Bite',
            type: 'melee',
            damage: 12,
            cooldown: 3,
            range: 2
          }
        ],
        drops: [
          { itemId: 'rope', minQuantity: 1, maxQuantity: 1, chance: 0.4 }
        ],
        sounds: {
          idle: 'wolf_howl',
          attack: 'wolf_growl'
        }
      }
    ];
  }
  
  private generateArchaeologicalEnemies(): CustomEnemy[] {
    return [
      {
        id: 'ancient_guardian',
        name: 'Ancient Guardian',
        description: 'A stone construct that protects ancient ruins',
        scenario: 'archaeological',
        type: 'construct',
        createdAt: Date.now(),
        appearance: {
          bodyType: 'construct',
          primaryColor: '#696969',
          skinTexture: 'rocky',
          scale: 1.2
        },
        stats: {
          level: 3,
          health: 100,
          damage: 15,
          defense: 10,
          speed: 1.2,
          attackRange: 2.5,
          attackSpeed: 0.8,
          experienceValue: 30,
          detectRange: 12,
          aggression: 7
        },
        behavior: {
          isAggressive: true,
          isNocturnal: false,
          isPack: false,
          isTerritorial: true
        },
        abilities: [
          {
            name: 'Stone Fist',
            type: 'melee',
            damage: 20,
            cooldown: 5,
            range: 2.5
          }
        ],
        drops: [
          { itemId: 'crystal_shard', minQuantity: 1, maxQuantity: 3, chance: 0.7 }
        ],
        sounds: {
          idle: 'stone_grinding',
          attack: 'heavy_slam'
        }
      },
      {
        id: 'mummy_scout',
        name: 'Mummy Scout',
        description: 'A wrapped corpse awakened to protect ancient treasures',
        scenario: 'archaeological',
        type: 'undead',
        createdAt: Date.now(),
        appearance: {
          bodyType: 'undead',
          primaryColor: '#DEB887',
          skinTexture: 'rough',
          scale: 1.0
        },
        stats: {
          level: 2,
          health: 70,
          damage: 12,
          defense: 5,
          speed: 1.8,
          attackRange: 1.5,
          attackSpeed: 1.0,
          experienceValue: 25,
          detectRange: 10,
          aggression: 5
        },
        behavior: {
          isAggressive: true,
          isNocturnal: true,
          isPack: false,
          isTerritorial: true
        },
        abilities: [
          {
            name: 'Curse',
            type: 'special',
            damage: 5,
            cooldown: 10,
            range: 5,
            effects: [
              { type: 'debuff', duration: 5 }
            ]
          }
        ],
        drops: [
          { itemId: 'old_coin', minQuantity: 1, maxQuantity: 5, chance: 0.8 }
        ],
        sounds: {
          idle: 'mummy_groan',
          attack: 'mummy_attack'
        }
      }
    ];
  }

  private generateSurvivalEnemies(): CustomEnemy[] {
    return [
      {
        id: 'wilderness_bear',
        name: 'Wilderness Bear',
        description: 'A large bear defending its territory',
        scenario: 'survival',
        type: 'bear',
        createdAt: Date.now(),
        appearance: {
          bodyType: 'beast',
          primaryColor: '#5C3317',
          skinTexture: 'furry',
          scale: 1.4
        },
        stats: {
          level: 4,
          health: 120,
          damage: 20,
          defense: 8,
          speed: 2.2,
          attackRange: 2,
          attackSpeed: 0.9,
          experienceValue: 40,
          detectRange: 8,
          aggression: 6
        },
        behavior: {
          isAggressive: true,
          isNocturnal: false,
          isPack: false,
          isTerritorial: true,
          patrolRadius: 12
        },
        abilities: [
          {
            name: 'Swipe',
            type: 'melee',
            damage: 20,
            cooldown: 4,
            range: 2
          }
        ],
        drops: [
          { itemId: 'berry', minQuantity: 2, maxQuantity: 4, chance: 0.7 }
        ],
        sounds: {
          idle: 'bear_growl',
          attack: 'bear_roar'
        }
      }
    ];
  }

  private generateFantasyEnemies(): CustomEnemy[] {
    return [
      {
        id: 'forest_fairy',
        name: 'Forest Fairy',
        description: 'A mischievous fairy that plays tricks on travelers',
        scenario: 'fantasy',
        type: 'fairy',
        createdAt: Date.now(),
        appearance: {
          bodyType: 'humanoid',
          primaryColor: '#87CEFA',
          emissive: true,
          emissiveColor: '#00FFFF',
          scale: 0.5,
          particles: 'sparkles'
        },
        stats: {
          level: 1,
          health: 30,
          damage: 5,
          defense: 2,
          speed: 4,
          attackRange: 6,
          attackSpeed: 2,
          experienceValue: 15,
          detectRange: 10,
          aggression: 3
        },
        behavior: {
          isAggressive: false,
          isNocturnal: false,
          isPack: true,
          isTerritorial: false
        },
        abilities: [
          {
            name: 'Fairy Dust',
            type: 'magic',
            damage: 5,
            cooldown: 4,
            range: 6,
            effects: [
              { type: 'slow', duration: 3 }
            ]
          }
        ],
        drops: [
          { itemId: 'crystal_shard', minQuantity: 1, maxQuantity: 1, chance: 0.5 }
        ],
        sounds: {
          idle: 'fairy_giggle',
          attack: 'fairy_chime'
        }
      },
      {
        id: 'emerald_drake',
        name: 'Emerald Drake',
        description: 'A small dragon with emerald scales',
        scenario: 'fantasy',
        type: 'dragon',
        createdAt: Date.now(),
        appearance: {
          bodyType: 'beast',
          primaryColor: '#2E8B57',
          skinTexture: 'scaly',
          scale: 1.2,
          hasWings: true
        },
        stats: {
          level: 5,
          health: 150,
          damage: 25,
          defense: 12,
          speed: 3,
          attackRange: 3,
          attackSpeed: 1,
          experienceValue: 50,
          detectRange: 15,
          aggression: 8
        },
        behavior: {
          isAggressive: true,
          isNocturnal: false,
          isPack: false,
          isTerritorial: true
        },
        abilities: [
          {
            name: 'Fire Breath',
            type: 'magic',
            damage: 30,
            range: 5,
            cooldown: 10,
            areaOfEffect: 3,
            effects: [
              { type: 'fire', duration: 5, tickDamage: 2 }
            ]
          }
        ],
        drops: [
          { itemId: 'crystal_shard', minQuantity: 3, maxQuantity: 5, chance: 0.9 }
        ],
        sounds: {
          idle: 'drake_growl',
          attack: 'drake_roar',
          special: 'fire_breath'
        }
      }
    ];
  }

  private generateNauticalEnemies(): CustomEnemy[] {
    return [
      {
        id: 'beach_crab',
        name: 'Giant Beach Crab',
        description: 'A large crab that scuttles along the shoreline',
        scenario: 'nautical',
        type: 'crab',
        createdAt: Date.now(),
        appearance: {
          bodyType: 'insect',
          primaryColor: '#CD5C5C',
          skinTexture: 'rough',
          scale: 0.9
        },
        stats: {
          level: 1,
          health: 40,
          damage: 8,
          defense: 10,
          speed: 1.5,
          attackRange: 1.2,
          attackSpeed: 0.8,
          experienceValue: 12,
          detectRange: 5,
          aggression: 3
        },
        behavior: {
          isAggressive: false,
          isNocturnal: false,
          isPack: true,
          isTerritorial: true,
          patrolRadius: 8,
          preferredBiomes: ['lake']
        },
        abilities: [
          {
            name: 'Pinch',
            type: 'melee',
            damage: 8,
            cooldown: 2,
            range: 1.2
          }
        ],
        drops: [
          { itemId: 'flint', minQuantity: 1, maxQuantity: 2, chance: 0.5 }
        ],
        sounds: {
          idle: 'crab_click',
          attack: 'crab_snap'
        }
      }
    ];
  }

  private generateIndustrialEnemies(): CustomEnemy[] {
    return [
      {
        id: 'clockwork_sentinel',
        name: 'Clockwork Sentinel',
        description: 'A mechanical construct that patrols industrial areas',
        scenario: 'industrial',
        type: 'construct',
        createdAt: Date.now(),
        appearance: {
          bodyType: 'construct',
          primaryColor: '#B8860B',
          secondaryColor: '#C0C0C0',
          skinTexture: 'metallic',
          scale: 1.1
        },
        stats: {
          level: 3,
          health: 100,
          damage: 15,
          defense: 15,
          speed: 1.5,
          attackRange: 2,
          attackSpeed: 0.9,
          experienceValue: 35,
          detectRange: 12,
          aggression: 7
        },
        behavior: {
          isAggressive: true,
          isNocturnal: false,
          isPack: false,
          isTerritorial: true,
          patrolRadius: 20
        },
        abilities: [
          {
            name: 'Steam Blast',
            type: 'ranged',
            damage: 12,
            cooldown: 6,
            range: 4,
            areaOfEffect: 2
          }
        ],
        drops: [
          { itemId: 'iron_ore', minQuantity: 2, maxQuantity: 4, chance: 0.7 }
        ],
        sounds: {
          idle: 'gear_turning',
          attack: 'steam_hiss'
        }
      }
    ];
  }

  private generateApocalypticEnemies(): CustomEnemy[] {
    return [
      {
        id: 'wasteland_mutant',
        name: 'Wasteland Mutant',
        description: 'A creature twisted by the apocalyptic wasteland',
        scenario: 'apocalyptic',
        type: 'mutant',
        createdAt: Date.now(),
        appearance: {
          bodyType: 'humanoid',
          primaryColor: '#4A6741',
          skinTexture: 'rough',
          scale: 1.1
        },
        stats: {
          level: 4,
          health: 90,
          damage: 18,
          defense: 6,
          speed: 2.2,
          attackRange: 2,
          attackSpeed: 1.1,
          experienceValue: 35,
          detectRange: 10,
          aggression: 8
        },
        behavior: {
          isAggressive: true,
          isNocturnal: false,
          isPack: true,
          isTerritorial: true
        },
        abilities: [
          {
            name: 'Toxic Slash',
            type: 'melee',
            damage: 15,
            cooldown: 5,
            range: 2,
            effects: [
              { type: 'poison', duration: 3, tickDamage: 3 }
            ]
          }
        ],
        drops: [
          { itemId: 'rope', minQuantity: 1, maxQuantity: 2, chance: 0.6 }
        ],
        sounds: {
          idle: 'mutant_growl',
          attack: 'mutant_screech'
        }
      }
    ];
  }

  private generateDefaultEnemies(): CustomEnemy[] {
    return [
      {
        id: 'wild_wolf',
        name: 'Wild Wolf',
        description: 'A common wolf hunting for prey',
        scenario: 'default',
        type: 'wolf',
        createdAt: Date.now(),
        appearance: {
          bodyType: 'beast',
          primaryColor: '#808080',
          skinTexture: 'furry',
          scale: 1.0
        },
        stats: {
          level: 2,
          health: 60,
          damage: 10,
          defense: 5,
          speed: 3.0,
          attackRange: 1.8,
          attackSpeed: 1.2,
          experienceValue: 20,
          detectRange: 8,
          aggression: 6
        },
        behavior: {
          isAggressive: true,
          isNocturnal: true,
          isPack: true,
          isTerritorial: false
        },
        abilities: [
          {
            name: 'Bite',
            type: 'melee',
            damage: 10,
            cooldown: 3,
            range: 1.8
          }
        ],
        drops: [
          { itemId: 'wood_log', minQuantity: 1, maxQuantity: 2, chance: 0.4 }
        ],
        sounds: {
          idle: 'wolf_howl',
          attack: 'wolf_bite'
        }
      }
    ];
  }
  
  // ======= Item Generators =======
  
  private generatePastoralItems(): CustomItem[] {
    return [
      {
        id: 'farm_produce',
        name: 'Farm Produce',
        description: 'Fresh fruits and vegetables from the local farms',
        type: 'consumable',
        scenario: 'pastoral',
        createdAt: Date.now(),
        appearance: {
          icon: '🥕',
          primaryColor: '#FF6347'
        },
        properties: {
          value: 10,
          weight: 2,
          rarity: 'common',
          stackable: true,
          maxStack: 20,
          consumable: true,
          questItem: false,
          tradeable: true,
          craftingIngredient: true
        },
        effects: [
          {
            type: 'heal',
            value: 15,
            description: 'Restores health points'
          }
        ]
      }
    ];
  }
  
  private generateArchaeologicalItems(): CustomItem[] {
    return [
      {
        id: 'ancient_artifact',
        name: 'Ancient Artifact',
        description: 'A mysterious relic from a long-lost civilization',
        type: 'quest',
        scenario: 'archaeological',
        createdAt: Date.now(),
        appearance: {
          icon: '🏺',
          primaryColor: '#FFD700',
          glows: true
        },
        properties: {
          value: 50,
          weight: 1,
          rarity: 'rare',
          stackable: false,
          maxStack: 1,
          consumable: false,
          questItem: true,
          tradeable: true,
          craftingIngredient: false,
          lore: 'This artifact contains the knowledge of an ancient civilization'
        }
      }
    ];
  }

  private generateSurvivalItems(): CustomItem[] {
    return [
      {
        id: 'survival_kit',
        name: 'Survival Kit',
        description: 'Basic supplies for wilderness survival',
        type: 'consumable',
        scenario: 'survival',
        createdAt: Date.now(),
        appearance: {
          icon: '🧰',
          primaryColor: '#8B0000'
        },
        properties: {
          value: 25,
          weight: 3,
          rarity: 'uncommon',
          stackable: true,
          maxStack: 5,
          consumable: true,
          questItem: false,
          tradeable: true,
          craftingIngredient: true
        },
        effects: [
          {
            type: 'heal',
            value: 20,
            description: 'Provides basic healing'
          },
          {
            type: 'buff',
            value: 10,
            duration: 300,
            statAffected: 'defense',
            description: 'Improves defense temporarily'
          }
        ]
      }
    ];
  }

  private generateFantasyItems(): CustomItem[] {
    return [
      {
        id: 'magic_essence',
        name: 'Magic Essence',
        description: 'Pure magical energy crystallized into a usable form',
        type: 'resource',
        scenario: 'fantasy',
        createdAt: Date.now(),
        appearance: {
          icon: '✨',
          primaryColor: '#9370DB',
          glows: true,
          particles: 'magic_sparkles'
        },
        properties: {
          value: 30,
          weight: 0.1,
          rarity: 'uncommon',
          stackable: true,
          maxStack: 50,
          consumable: false,
          questItem: false,
          tradeable: true,
          craftingIngredient: true
        }
      }
    ];
  }

  private generateNauticalItems(): CustomItem[] {
    return [
      {
        id: 'sea_shell',
        name: 'Rare Sea Shell',
        description: 'A beautiful shell from the deep ocean',
        type: 'resource',
        scenario: 'nautical',
        createdAt: Date.now(),
        appearance: {
          icon: '🐚',
          primaryColor: '#FFE4C4'
        },
        properties: {
          value: 15,
          weight: 0.5,
          rarity: 'uncommon',
          stackable: true,
          maxStack: 20,
          consumable: false,
          questItem: false,
          tradeable: true,
          craftingIngredient: true
        }
      }
    ];
  }

  private generateIndustrialItems(): CustomItem[] {
    return [
      {
        id: 'mechanical_parts',
        name: 'Mechanical Parts',
        description: 'Various gears, springs, and components for machines',
        type: 'resource',
        scenario: 'industrial',
        createdAt: Date.now(),
        appearance: {
          icon: '⚙️',
          primaryColor: '#C0C0C0'
        },
        properties: {
          value: 20,
          weight: 1,
          rarity: 'common',
          stackable: true,
          maxStack: 30,
          consumable: false,
          questItem: false,
          tradeable: true,
          craftingIngredient: true
        }
      }
    ];
  }

  private generateApocalypticItems(): CustomItem[] {
    return [
      {
        id: 'scrap_metal',
        name: 'Scrap Metal',
        description: 'Salvaged metal from the ruins of the old world',
        type: 'resource',
        scenario: 'apocalyptic',
        createdAt: Date.now(),
        appearance: {
          icon: '🔧',
          primaryColor: '#708090'
        },
        properties: {
          value: 10,
          weight: 2,
          rarity: 'common',
          stackable: true,
          maxStack: 40,
          consumable: false,
          questItem: false,
          tradeable: true,
          craftingIngredient: true
        }
      }
    ];
  }

  private generateDefaultItems(): CustomItem[] {
    return [
      {
        id: 'healing_herb',
        name: 'Healing Herb',
        description: 'A common herb with medicinal properties',
        type: 'consumable',
        scenario: 'default',
        createdAt: Date.now(),
        appearance: {
          icon: '🌿',
          primaryColor: '#32CD32'
        },
        properties: {
          value: 8,
          weight: 0.1,
          rarity: 'common',
          stackable: true,
          maxStack: 25,
          consumable: true,
          questItem: false,
          tradeable: true,
          craftingIngredient: true
        },
        effects: [
          {
            type: 'heal',
            value: 10,
            description: 'Restores a small amount of health'
          }
        ]
      }
    ];
  }
  
  // ======= Tool Generators =======
  
  private generateSurvivalTools(): CustomTool[] {
    return [
      {
        id: 'survival_axe',
        name: 'Survival Axe',
        description: 'A multi-purpose axe designed for wilderness survival',
        type: 'tool',
        scenario: 'survival',
        createdAt: Date.now(),
        appearance: {
          icon: '🪓',
          primaryColor: '#708090'
        },
        properties: {
          value: 40,
          weight: 3,
          rarity: 'uncommon',
          stackable: false,
          maxStack: 1,
          consumable: false,
          questItem: false,
          tradeable: true,
          craftingIngredient: false
        },
        toolType: 'axe',
        toolStats: {
          efficiency: 1.2,
          durability: 150,
          harvestLevel: 2
        },
        effectiveAgainst: ['wood', 'bush', 'plant']
      }
    ];
  }

  private generateIndustrialTools(): CustomTool[] {
    return [
      {
        id: 'steam_drill',
        name: 'Steam-Powered Drill',
        description: 'A mechanical drill that uses steam power for greater efficiency',
        type: 'tool',
        scenario: 'industrial',
        createdAt: Date.now(),
        appearance: {
          icon: '⚒️',
          primaryColor: '#B87333'
        },
        properties: {
          value: 60,
          weight: 5,
          rarity: 'rare',
          stackable: false,
          maxStack: 1,
          consumable: false,
          questItem: false,
          tradeable: true,
          craftingIngredient: false
        },
        toolType: 'pickaxe',
        toolStats: {
          efficiency: 1.5,
          durability: 200,
          harvestLevel: 3
        },
        effectiveAgainst: ['stone', 'ore', 'metal']
      }
    ];
  }
  
  // ======= Weapon Generators =======
  
  private generateFantasyWeapons(): CustomWeapon[] {
    return [
      {
        id: 'enchanted_staff',
        name: 'Enchanted Staff',
        description: 'A wooden staff imbued with magical energy',
        type: 'weapon',
        scenario: 'fantasy',
        createdAt: Date.now(),
        appearance: {
          icon: '🪄',
          primaryColor: '#8A2BE2',
          glows: true
        },
        properties: {
          value: 75,
          weight: 2,
          rarity: 'rare',
          stackable: false,
          maxStack: 1,
          consumable: false,
          questItem: false,
          tradeable: true,
          craftingIngredient: false
        },
        weaponType: 'staff',
        combatStats: {
          damage: 25,
          criticalChance: 0.1,
          criticalMultiplier: 1.5,
          range: 6,
          speed: 1.0,
          durability: 150
        }
      }
    ];
  }

  private generateApocalypticWeapons(): CustomWeapon[] {
    return [
      {
        id: 'scrap_hammer',
        name: 'Scrap Metal Hammer',
        description: 'A crude but effective hammer made from salvaged metal',
        type: 'weapon',
        scenario: 'apocalyptic',
        createdAt: Date.now(),
        appearance: {
          icon: '🔨',
          primaryColor: '#708090'
        },
        properties: {
          value: 35,
          weight: 4,
          rarity: 'uncommon',
          stackable: false,
          maxStack: 1,
          consumable: false,
          questItem: false,
          tradeable: true,
          craftingIngredient: false
        },
        weaponType: 'hammer',
        combatStats: {
          damage: 30,
          criticalChance: 0.15,
          criticalMultiplier: 1.8,
          range: 2,
          speed: 0.8,
          durability: 120
        }
      }
    ];
  }
  
  // ======= Vegetation Generators =======
  
  private generatePastoralVegetation(): CustomVegetation[] {
    return [
      {
        id: 'apple_tree',
        name: 'Apple Tree',
        description: 'A tree bearing ripe, juicy apples',
        type: 'tree',
        scenario: 'pastoral',
        createdAt: Date.now(),
        appearance: {
          trunkColor: '#8B4513',
          leafColor: '#228B22',
          fruitColor: '#FF0000',
          height: 5,
          leafDensity: 0.8,
          hasFruits: true
        },
        properties: {
          health: 100,
          isHarvestable: true,
          growthStage: 'mature',
          biomes: ['grassland', 'forest']
        },
        interaction: {
          harvestable: true,
          harvestTool: 'axe',
          harvestableResources: [
            { resourceId: 'wood_log', minAmount: 2, maxAmount: 4, chance: 1.0 },
            { resourceId: 'berry', minAmount: 1, maxAmount: 3, chance: 0.8 }
          ]
        }
      }
    ];
  }
  
  // ======= Structure Generators =======
  
  private generateArchaeologicalStructures(): CustomStructure[] {
    return [
      {
        id: 'temple_ruins',
        name: 'Ancient Temple Ruins',
        description: 'The crumbling remains of a once-grand temple',
        type: 'ruin',
        scenario: 'archaeological',
        createdAt: Date.now(),
        appearance: {
          materialType: 'stone',
          style: 'ancient',
          weathered: true,
          overgrown: true,
          isRuined: true,
          scale: { x: 2, y: 2, z: 2 }
        },
        properties: {
          age: 3000,
          civilization: 'Lost Kingdom',
          purpose: 'Religious worship',
          lore: 'Once a center of worship for an ancient civilization, now abandoned to time',
          isClimbable: true,
          biomes: ['desert', 'mountains', 'ruins']
        },
        interaction: {
          canEnter: true,
          canLoot: true,
          lootTable: [
            { itemId: 'crystal_shard', minQuantity: 1, maxQuantity: 3, chance: 0.5 },
            { itemId: 'old_coin', minQuantity: 2, maxQuantity: 5, chance: 0.7 }
          ]
        }
      }
    ];
  }
  
  clear(): void {
    this.cache.clear();
  }
}
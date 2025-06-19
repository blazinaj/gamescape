import { Tool, EquipmentSlot, ToolAction } from '../types/EquipmentTypes';
import { CustomWeapon, CustomTool } from '../types/CustomItemTypes';

export class EquipmentManager {
  private tools: Map<string, Tool> = new Map();
  private weapons: Map<string, Tool> = new Map();
  private equippedTool: Tool | null = null;
  private equippedWeapon: Tool | null = null;
  private lastActionTime: number = 0;
  private subscribers: ((tool: Tool | null, weapon: Tool | null) => void)[] = [];
  private customWeapons: Map<string, CustomWeapon> = new Map();
  private customTools: Map<string, CustomTool> = new Map();

  constructor() {
    this.initializeDefaultTools();
    this.initializeDefaultWeapons();
    this.equipTool('iron_axe'); // Start with axe equipped
    this.equipWeapon('iron_sword'); // Start with sword equipped
  }

  private initializeDefaultTools(): void {
    const defaultTools: Tool[] = [
      {
        id: 'iron_axe',
        name: 'Iron Axe',
        type: 'axe',
        damage: 25,
        durability: 100,
        maxDurability: 100,
        range: 2.5,
        cooldown: 800,
        description: 'A sturdy iron axe for chopping wood',
        icon: '🪓',
        color: '#8B4513',
        targetTypes: ['tree', 'bush'],
        attackSpeed: 1.2,
        weaponType: 'tool'
      },
      {
        id: 'iron_pickaxe',
        name: 'Iron Pickaxe',
        type: 'pickaxe',
        damage: 30,
        durability: 100,
        maxDurability: 100,
        range: 2.0,
        cooldown: 1000,
        description: 'A reliable pickaxe for mining stone and ore',
        icon: '⛏️',
        color: '#696969',
        targetTypes: ['rock', 'ruins'],
        attackSpeed: 1.0,
        weaponType: 'tool'
      }
    ];

    defaultTools.forEach(tool => {
      this.tools.set(tool.id, tool);
    });
  }

  private initializeDefaultWeapons(): void {
    const defaultWeapons: Tool[] = [
      {
        id: 'iron_sword',
        name: 'Iron Sword',
        type: 'sword',
        damage: 35,
        durability: 120,
        maxDurability: 120,
        range: 2.2,
        cooldown: 600,
        description: 'A well-balanced iron sword for combat',
        icon: '⚔️',
        color: '#C0C0C0',
        targetTypes: ['enemy'],
        attackSpeed: 1.8,
        weaponType: 'weapon'
      },
      {
        id: 'steel_dagger',
        name: 'Steel Dagger',
        type: 'dagger',
        damage: 20,
        durability: 80,
        maxDurability: 80,
        range: 1.5,
        cooldown: 400,
        description: 'A quick and nimble steel dagger',
        icon: '🗡️',
        color: '#E6E6FA',
        targetTypes: ['enemy'],
        attackSpeed: 2.5,
        weaponType: 'weapon'
      },
      {
        id: 'war_spear',
        name: 'War Spear',
        type: 'spear',
        damage: 40,
        durability: 100,
        maxDurability: 100,
        range: 3.0,
        cooldown: 800,
        description: 'A long-reaching spear with excellent range',
        icon: '🔱',
        color: '#8B4513',
        targetTypes: ['enemy'],
        attackSpeed: 1.4,
        weaponType: 'weapon'
      },
      {
        id: 'iron_mace',
        name: 'Iron Mace',
        type: 'mace',
        damage: 45,
        durability: 150,
        maxDurability: 150,
        range: 1.8,
        cooldown: 1000,
        description: 'A heavy mace that deals crushing damage',
        icon: '🔨',
        color: '#696969',
        targetTypes: ['enemy'],
        attackSpeed: 1.0,
        weaponType: 'weapon'
      },
      {
        id: 'hunting_bow',
        name: 'Hunting Bow',
        type: 'bow',
        damage: 30,
        durability: 90,
        maxDurability: 90,
        range: 8.0,
        cooldown: 1200,
        description: 'A ranged bow for distant combat',
        icon: '🏹',
        color: '#8B4513',
        targetTypes: ['enemy'],
        attackSpeed: 1.2,
        weaponType: 'weapon'
      }
    ];

    defaultWeapons.forEach(weapon => {
      this.weapons.set(weapon.id, weapon);
    });
  }

  registerCustomWeapons(weapons: CustomWeapon[]): void {
    weapons.forEach(weapon => {
      // Store in custom weapons collection
      this.customWeapons.set(weapon.id, weapon);
      
      // Create standard tool representation
      const standardWeapon: Tool = {
        id: weapon.id,
        name: weapon.name,
        type: weapon.weaponType,
        damage: weapon.combatStats.damage,
        durability: weapon.combatStats.durability,
        maxDurability: weapon.combatStats.durability,
        range: weapon.combatStats.range,
        cooldown: Math.floor(1000 / weapon.combatStats.speed),
        description: weapon.description,
        icon: weapon.appearance.icon || '⚔️',
        color: weapon.appearance.primaryColor || '#C0C0C0',
        targetTypes: ['enemy'],
        attackSpeed: weapon.combatStats.speed,
        weaponType: 'weapon'
      };
      
      // Add to available weapons
      this.weapons.set(weapon.id, standardWeapon);
      
      console.log(`🔫 Registered custom weapon: ${weapon.name}`);
    });
    
    // Notify subscribers about new weapons
    this.notifySubscribers();
  }

  registerCustomTools(tools: CustomTool[]): void {
    tools.forEach(tool => {
      // Store in custom tools collection
      this.customTools.set(tool.id, tool);
      
      // Determine target types based on effectiveAgainst
      const targetTypes = this.mapEffectiveAgainstToTargetTypes(tool.effectiveAgainst);
      
      // Create standard tool representation
      const standardTool: Tool = {
        id: tool.id,
        name: tool.name,
        type: tool.toolType,
        damage: Math.floor(10 + tool.toolStats.efficiency * 10), // Base damage scaled by efficiency
        durability: tool.toolStats.durability,
        maxDurability: tool.toolStats.durability,
        range: 2.0, // Default range
        cooldown: Math.floor(1000 / (tool.toolStats.efficiency * 0.8)),
        description: tool.description,
        icon: tool.appearance.icon || '🔨',
        color: tool.appearance.primaryColor || '#8B4513',
        targetTypes: targetTypes,
        attackSpeed: tool.toolStats.efficiency,
        weaponType: 'tool'
      };
      
      // Add to available tools
      this.tools.set(tool.id, standardTool);
      
      console.log(`🔨 Registered custom tool: ${tool.name}`);
    });
    
    // Notify subscribers about new tools
    this.notifySubscribers();
  }

  private mapEffectiveAgainstToTargetTypes(effectiveAgainst: string[]): string[] {
    // Map the effectiveAgainst values to standard target types
    const targetMap: Record<string, string[]> = {
      'wood': ['tree', 'bush', 'log'],
      'stone': ['rock', 'ruins'],
      'ore': ['rock', 'mineral'],
      'plant': ['plant', 'flower', 'bush'],
      'animal': ['enemy'],
      'metal': ['ore', 'metal'],
      'soil': ['dirt', 'clay'],
      'magical_plant': ['plant', 'flower', 'magical'],
      'herb': ['plant', 'flower'],
      'artifact': ['ruins', 'treasure'],
      'ruin': ['ruins', 'statue'],
      'door': ['building', 'chest'],
      'container': ['chest', 'crate']
    };
    
    // Collect all target types
    const targetTypes: Set<string> = new Set();
    
    effectiveAgainst.forEach(type => {
      const mappedTypes = targetMap[type] || [type];
      mappedTypes.forEach(t => targetTypes.add(t));
    });
    
    return Array.from(targetTypes);
  }

  getAvailableTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  getAvailableWeapons(): Tool[] {
    return Array.from(this.weapons.values());
  }

  getEquippedTool(): Tool | null {
    return this.equippedTool;
  }

  getEquippedWeapon(): Tool | null {
    return this.equippedWeapon;
  }

  equipTool(toolId: string): boolean {
    const tool = this.tools.get(toolId);
    if (!tool) return false;

    this.equippedTool = tool;
    this.notifySubscribers();
    return true;
  }

  equipWeapon(weaponId: string): boolean {
    const weapon = this.weapons.get(weaponId);
    if (!weapon) return false;

    this.equippedWeapon = weapon;
    this.notifySubscribers();
    return true;
  }

  unequipTool(): void {
    this.equippedTool = null;
    this.notifySubscribers();
  }

  unequipWeapon(): void {
    this.equippedWeapon = null;
    this.notifySubscribers();
  }

  canUseTool(): boolean {
    if (!this.equippedTool) return false;
    if (this.equippedTool.durability <= 0) return false;
    
    const now = Date.now();
    return (now - this.lastActionTime) >= this.equippedTool.cooldown;
  }

  canUseWeapon(): boolean {
    if (!this.equippedWeapon) return false;
    if (this.equippedWeapon.durability <= 0) return false;
    
    const now = Date.now();
    return (now - this.lastActionTime) >= this.equippedWeapon.cooldown;
  }

  useTool(): ToolAction | null {
    if (!this.canUseTool() || !this.equippedTool) return null;

    this.lastActionTime = Date.now();
    
    // Reduce durability
    this.equippedTool.durability = Math.max(0, this.equippedTool.durability - 1);
    
    // Create tool action
    const action: ToolAction = {
      toolId: this.equippedTool.id,
      targetType: this.equippedTool.targetTypes[0],
      effect: this.getEffectForTool(this.equippedTool.type),
      amount: this.equippedTool.damage,
      animation: this.getAnimationForTool(this.equippedTool.type),
      particles: this.getParticlesForTool(this.equippedTool.type)
    };

    this.notifySubscribers();
    return action;
  }

  useWeapon(): ToolAction | null {
    if (!this.canUseWeapon() || !this.equippedWeapon) return null;

    this.lastActionTime = Date.now();
    
    // Reduce durability
    this.equippedWeapon.durability = Math.max(0, this.equippedWeapon.durability - 1);
    
    // Create weapon action
    const action: ToolAction = {
      toolId: this.equippedWeapon.id,
      targetType: 'enemy',
      effect: 'attack',
      amount: this.equippedWeapon.damage,
      animation: this.getAnimationForWeapon(this.equippedWeapon.type),
      particles: this.getParticlesForWeapon(this.equippedWeapon.type)
    };

    this.notifySubscribers();
    return action;
  }

  getCustomWeaponDetails(weaponId: string): CustomWeapon | undefined {
    return this.customWeapons.get(weaponId);
  }
  
  getCustomToolDetails(toolId: string): CustomTool | undefined {
    return this.customTools.get(toolId);
  }

  private getEffectForTool(toolType: string): ToolAction['effect'] {
    switch (toolType) {
      case 'axe': return 'harvest';
      case 'pickaxe': return 'mine';
      default: return 'damage';
    }
  }

  private getAnimationForTool(toolType: string): string {
    switch (toolType) {
      case 'axe': return 'chop';
      case 'pickaxe': return 'mine';
      case 'hoe': return 'till';
      case 'shovel': return 'dig';
      case 'fishing_rod': return 'cast';
      default: return 'swing';
    }
  }

  private getParticlesForTool(toolType: string): string {
    switch (toolType) {
      case 'axe': return 'wood_chips';
      case 'pickaxe': return 'rock_fragments';
      case 'hoe': return 'soil';
      case 'shovel': return 'dirt';
      case 'fishing_rod': return 'water_splash';
      default: return 'sparks';
    }
  }

  private getAnimationForWeapon(weaponType: string): string {
    switch (weaponType) {
      case 'sword': return 'slash';
      case 'dagger': return 'stab';
      case 'spear': return 'thrust';
      case 'mace': return 'smash';
      case 'hammer': return 'smash';
      case 'bow': return 'shoot';
      case 'staff': return 'cast';
      case 'wand': return 'cast';
      default: return 'attack';
    }
  }

  private getParticlesForWeapon(weaponType: string): string {
    switch (weaponType) {
      case 'sword': return 'slash_effect';
      case 'dagger': return 'blood_spatter';
      case 'spear': return 'impact_sparks';
      case 'mace': 
      case 'hammer': return 'crushing_debris';
      case 'bow': return 'arrow_trail';
      case 'staff':
      case 'wand': return 'magic_sparks';
      default: return 'combat_sparks';
    }
  }

  repairTool(toolId: string, amount: number = Infinity): boolean {
    const tool = this.tools.get(toolId);
    if (!tool) return false;

    tool.durability = Math.min(tool.maxDurability, tool.durability + amount);
    
    if (this.equippedTool?.id === toolId) {
      this.notifySubscribers();
    }
    
    return true;
  }

  repairWeapon(weaponId: string, amount: number = Infinity): boolean {
    const weapon = this.weapons.get(weaponId);
    if (!weapon) return false;

    weapon.durability = Math.min(weapon.maxDurability, weapon.durability + amount);
    
    if (this.equippedWeapon?.id === weaponId) {
      this.notifySubscribers();
    }
    
    return true;
  }

  subscribe(callback: (tool: Tool | null, weapon: Tool | null) => void): () => void {
    this.subscribers.push(callback);
    
    // Immediately call with current equipment
    callback(this.equippedTool, this.equippedWeapon);

    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      callback(this.equippedTool, this.equippedWeapon);
    });
  }
}
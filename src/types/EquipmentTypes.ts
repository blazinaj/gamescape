export interface Tool {
  id: string;
  name: string;
  type: 'axe' | 'pickaxe' | 'sword' | 'bow' | 'spear' | 'mace' | 'dagger';
  damage: number;
  durability: number;
  maxDurability: number;
  range: number;
  cooldown: number; // ms between uses
  description: string;
  icon: string; // emoji or icon identifier
  color: string;
  targetTypes: string[]; // what this tool can affect
  attackSpeed: number; // attacks per second
  weaponType?: 'tool' | 'weapon'; // distinguish between tools and weapons
}

export interface EquipmentSlot {
  id: string;
  name: string;
  type: 'tool' | 'weapon' | 'armor' | 'accessory';
  equippedItem: Tool | null;
}

export interface ToolAction {
  toolId: string;
  targetType: string;
  effect: 'damage' | 'harvest' | 'mine' | 'dig' | 'attack';
  amount: number;
  animation?: string;
  particles?: string;
  sound?: string;
}

export interface CombatStats {
  damage: number;
  range: number;
  attackSpeed: number;
  criticalChance: number;
  criticalMultiplier: number;
}
import { CustomizableObject, AppearanceProperties } from './BaseObjectTypes';

export interface CustomItem extends CustomizableObject {
  type: 'resource' | 'consumable' | 'quest' | 'currency' | 'armor' | 'crafting';
  appearance: ItemAppearance;
  properties: ItemProperties;
  effects?: ItemEffect[];
}

export interface ItemAppearance extends AppearanceProperties {
  icon: string; // Emoji or icon identifier
  worldScale?: { x: number; y: number; z: number };
  rotates?: boolean;
  bounces?: boolean;
  floats?: boolean;
  glows?: boolean;
}

export interface ItemProperties {
  value: number;
  weight: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  stackable: boolean;
  maxStack: number;
  durability?: number;
  consumable: boolean;
  questItem: boolean;
  tradeable: boolean;
  lore?: string;
  craftingIngredient: boolean;
  category?: string;
}

export interface ItemEffect {
  type: 'heal' | 'damage' | 'buff' | 'debuff' | 'resource' | 'teleport' | 'transform';
  value: number;
  duration?: number;
  target?: 'self' | 'enemy' | 'area';
  range?: number;
  statAffected?: 'health' | 'damage' | 'defense' | 'speed' | 'other';
  description: string;
  particles?: string;
  sound?: string;
}

export interface CustomWeapon extends CustomItem {
  weaponType: 'sword' | 'axe' | 'hammer' | 'dagger' | 'spear' | 'bow' | 'staff' | 'wand' | 'custom';
  combatStats: {
    damage: number;
    criticalChance: number;
    criticalMultiplier: number;
    range: number;
    speed: number;
    durability: number;
  };
  special?: {
    name: string;
    description: string;
    effect: ItemEffect;
    cooldown: number;
  };
}

export interface CustomTool extends CustomItem {
  toolType: 'axe' | 'pickaxe' | 'shovel' | 'hoe' | 'fishing_rod' | 'custom';
  toolStats: {
    efficiency: number;
    durability: number;
    harvestLevel: number;
  };
  effectiveAgainst: string[];
}
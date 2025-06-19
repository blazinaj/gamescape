export interface InventoryItem {
  id: string;
  name: string;
  type: 'material' | 'tool' | 'consumable';
  description: string;
  icon: string;
  stackable: boolean;
  maxStack: number;
  value: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export interface InventoryStack {
  item: InventoryItem;
  quantity: number;
}

export interface ResourceNode {
  id: string;
  type: string;
  maxHp: number;
  currentHp: number;
  position: { x: number; y: number; z: number };
  drops: {
    itemId: string;
    quantity: number;
    chance: number;
  }[];
  mesh?: any; // THREE.Object3D reference
}
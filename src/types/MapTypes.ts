export interface MapTile {
  id: string;
  x: number;
  z: number;
  biome: 'forest' | 'desert' | 'grassland' | 'mountains' | 'lake' | 'village';
  objects: MapObject[];
  generated: boolean;
}

export interface MapObject {
  type: 'tree' | 'rock' | 'building' | 'water' | 'hill' | 'flower' | 'bush' | 'ruins' | 'npc' | 
        'chest' | 'crate' | 'plant' | 'mushroom' | 'crystal' | 'log' | 'berry_bush' | 
        'well' | 'campfire' | 'statue' | 'fence' | 'bridge' | 'cart';
  position: { x: number, y: number, z: number };
  scale: { x: number, y: number, z: number };
  rotation: { x: number, y: number, z: number };
  color?: string;
  properties?: Record<string, any>;
}

export interface GeneratedContent {
  tile: MapTile;
  description: string;
  theme: string;
}

export interface NPCData {
  id: string;
  name: string;
  personality: string;
  background: string;
  occupation?: string;
  mood: string;
  topics: string[];
  appearance: {
    bodyColor: string;
    clothingColor: string;
    scale: number;
  };
}
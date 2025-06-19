export interface CollisionBounds {
  type: 'sphere' | 'box' | 'capsule';
  center?: { x: number; y: number; z: number };
  radius?: number; // for sphere and capsule
  size?: { x: number; y: number; z: number }; // for box
  height?: number; // for capsule
}

export interface CollisionObject {
  id: string;
  type: 'character' | 'enemy' | 'npc' | 'static' | 'dynamic' | 'interactable' | 'trigger' | 'projectile';
  bounds: CollisionBounds;
  position: { x: number; y: number; z: number };
  velocity?: { x: number; y: number; z: number };
  mass?: number;
  isStatic?: boolean;
  canCollideWith?: string[];
  userData?: any;
}

export interface CollisionResult {
  collided: boolean;
  penetration?: { x: number; y: number; z: number };
  normal?: { x: number; y: number; z: number };
  distance?: number;
  object?: CollisionObject;
  contactPoint?: { x: number; y: number; z: number };
}

export interface CollisionResponse {
  newPosition: { x: number; y: number; z: number };
  newVelocity?: { x: number; y: number; z: number };
  blocked: boolean;
  sliding: boolean;
  groundContact: boolean;
  triggers?: CollisionObject[]; // Objects that were triggered
}

export interface SpatialCell {
  objects: Set<string>;
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
}

export interface LineOfSightResult {
  clear: boolean;
  hitObject?: CollisionObject;
  hitPoint?: { x: number; y: number; z: number };
  distance?: number;
}

// Trigger zone interface
export interface TriggerZone extends CollisionObject {
  type: 'trigger';
  triggerType: 'interaction' | 'dialogue' | 'combat' | 'area_transition' | 'item_pickup';
  activationRadius: number;
  cooldown?: number;
  lastActivated?: number;
  onTrigger?: (triggeredBy: CollisionObject) => void;
}

// Combat hit detection
export interface HitDetection {
  attackerId: string;
  targetId: string;
  damage: number;
  hitPoint: { x: number; y: number; z: number };
  knockback?: { x: number; y: number; z: number };
  isCritical: boolean;
}
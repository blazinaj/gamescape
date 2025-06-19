export interface EnemyData {
  id: string;
  name: string;
  type: 'goblin' | 'orc' | 'skeleton' | 'wolf' | 'spider' | 'troll';
  maxHealth: number;
  currentHealth: number;
  damage: number;
  speed: number;
  attackRange: number;
  attackCooldown: number;
  experience: number;
  drops: {
    itemId: string;
    quantity: number;
    chance: number;
  }[];
  behavior: 'aggressive' | 'defensive' | 'neutral' | 'passive';
  detectionRange: number;
  appearance: {
    bodyColor: string;
    scale: number;
    modelType: string;
  };
}

export interface EnemyState {
  target: THREE.Vector3 | null;
  lastAttackTime: number;
  isAttacking: boolean;
  isDead: boolean;
  patrolCenter: THREE.Vector3;
  patrolRadius: number;
  alertLevel: number;
}
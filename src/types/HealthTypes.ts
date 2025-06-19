export interface HealthState {
  current: number;
  maximum: number;
  regeneration: number; // HP per second
  lastDamageTime: number;
  isRegenerating: boolean;
}

export interface DamageInfo {
  amount: number;
  type: 'physical' | 'magical' | 'fire' | 'ice' | 'poison';
  source: string;
  isCritical: boolean;
  position?: { x: number; y: number; z: number };
}

export interface CombatEvent {
  id: string;
  type: 'damage' | 'heal' | 'death' | 'critical';
  timestamp: number;
  data: any;
}
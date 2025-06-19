import { HealthState, DamageInfo, CombatEvent } from '../types/HealthTypes';

export class HealthSystem {
  private health: HealthState;
  private subscribers: ((health: HealthState) => void)[] = [];
  private combatEvents: CombatEvent[] = [];
  private eventSubscribers: ((events: CombatEvent[]) => void)[] = [];

  constructor(maxHealth: number = 100) {
    this.health = {
      current: maxHealth,
      maximum: maxHealth,
      regeneration: 1, // 1 HP per second
      lastDamageTime: 0,
      isRegenerating: false
    };
  }

  update(deltaTime: number): void {
    const now = Date.now();
    
    // Start regenerating after 5 seconds without damage
    if (now - this.health.lastDamageTime > 5000 && this.health.current < this.health.maximum) {
      this.health.isRegenerating = true;
      const regenAmount = this.health.regeneration * deltaTime / 1000;
      this.health.current = Math.min(this.health.maximum, this.health.current + regenAmount);
      this.notifySubscribers();
    }

    // Clean up old combat events (keep last 50)
    if (this.combatEvents.length > 50) {
      this.combatEvents = this.combatEvents.slice(-50);
      this.notifyEventSubscribers();
    }
  }

  takeDamage(damageInfo: DamageInfo): boolean {
    if (this.health.current <= 0) return false; // Already dead

    const actualDamage = Math.min(damageInfo.amount, this.health.current);
    this.health.current -= actualDamage;
    this.health.lastDamageTime = Date.now();
    this.health.isRegenerating = false;

    // Create damage event
    const event: CombatEvent = {
      id: `damage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: damageInfo.isCritical ? 'critical' : 'damage',
      timestamp: Date.now(),
      data: { ...damageInfo, actualDamage }
    };

    this.combatEvents.push(event);
    this.notifyEventSubscribers();

    console.log(`💔 Player takes ${actualDamage} ${damageInfo.type} damage from ${damageInfo.source}${damageInfo.isCritical ? ' (CRITICAL!)' : ''}`);

    // Check if dead
    if (this.health.current <= 0) {
      const deathEvent: CombatEvent = {
        id: `death_${Date.now()}`,
        type: 'death',
        timestamp: Date.now(),
        data: { source: damageInfo.source }
      };
      this.combatEvents.push(deathEvent);
      this.notifyEventSubscribers();
      console.log(`💀 Player has died!`);
      return true; // Player died
    }

    this.notifySubscribers();
    return false; // Player still alive
  }

  heal(amount: number, source: string = 'unknown'): number {
    if (this.health.current >= this.health.maximum) return 0;

    const actualHeal = Math.min(amount, this.health.maximum - this.health.current);
    this.health.current += actualHeal;

    // Create heal event
    const event: CombatEvent = {
      id: `heal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'heal',
      timestamp: Date.now(),
      data: { amount: actualHeal, source }
    };

    this.combatEvents.push(event);
    this.notifyEventSubscribers();

    console.log(`💚 Player heals ${actualHeal} HP from ${source}`);
    this.notifySubscribers();
    return actualHeal;
  }

  setMaxHealth(newMax: number): void {
    const ratio = this.health.current / this.health.maximum;
    this.health.maximum = newMax;
    this.health.current = Math.min(this.health.current, newMax);
    
    // Optionally scale current health proportionally
    // this.health.current = newMax * ratio;
    
    this.notifySubscribers();
  }

  setRegeneration(regenPerSecond: number): void {
    this.health.regeneration = regenPerSecond;
  }

  getHealth(): HealthState {
    return { ...this.health };
  }

  getHealthPercentage(): number {
    return (this.health.current / this.health.maximum) * 100;
  }

  isDead(): boolean {
    return this.health.current <= 0;
  }

  isAtFullHealth(): boolean {
    return this.health.current >= this.health.maximum;
  }

  canRegenerate(): boolean {
    return this.health.isRegenerating && this.health.current < this.health.maximum;
  }

  getRecentDamage(timeWindow: number = 5000): DamageInfo[] {
    const cutoff = Date.now() - timeWindow;
    return this.combatEvents
      .filter(event => event.type === 'damage' || event.type === 'critical')
      .filter(event => event.timestamp > cutoff)
      .map(event => event.data);
  }

  getCombatEvents(): CombatEvent[] {
    return [...this.combatEvents];
  }

  subscribe(callback: (health: HealthState) => void): () => void {
    this.subscribers.push(callback);
    callback({ ...this.health });

    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  subscribeToCombatEvents(callback: (events: CombatEvent[]) => void): () => void {
    this.eventSubscribers.push(callback);
    callback([...this.combatEvents]);

    return () => {
      const index = this.eventSubscribers.indexOf(callback);
      if (index > -1) {
        this.eventSubscribers.splice(index, 1);
      }
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      callback({ ...this.health });
    });
  }

  private notifyEventSubscribers(): void {
    this.eventSubscribers.forEach(callback => {
      callback([...this.combatEvents]);
    });
  }

  // Restore to full health (for respawn/healing items)
  fullHeal(): void {
    this.health.current = this.health.maximum;
    this.health.lastDamageTime = 0;
    this.health.isRegenerating = false;
    this.notifySubscribers();
  }

  // Reset health system (for new game/respawn)
  reset(maxHealth?: number): void {
    if (maxHealth) {
      this.health.maximum = maxHealth;
    }
    this.health.current = this.health.maximum;
    this.health.lastDamageTime = 0;
    this.health.isRegenerating = false;
    this.combatEvents = [];
    this.notifySubscribers();
    this.notifyEventSubscribers();
  }
}
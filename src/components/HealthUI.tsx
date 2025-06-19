import React, { useState, useEffect } from 'react';
import { HealthState, CombatEvent } from '../types/HealthTypes';
import { HealthSystem } from '../services/HealthSystem';
import { ExperienceSystem } from '../services/ExperienceSystem';
import { Skill } from '../types/ExperienceTypes';
import { Heart, Shield, Activity, Zap, Swords, Star } from 'lucide-react';

interface HealthUIProps {
  healthSystem: HealthSystem;
  experienceSystem: ExperienceSystem;
}

export const HealthUI: React.FC<HealthUIProps> = ({ healthSystem, experienceSystem }) => {
  const [health, setHealth] = useState<HealthState>({ current: 100, maximum: 100, regeneration: 1, lastDamageTime: 0, isRegenerating: false });
  const [recentEvents, setRecentEvents] = useState<CombatEvent[]>([]);
  const [combatSkill, setCombatSkill] = useState<Skill | null>(null);
  const [totalLevel, setTotalLevel] = useState<number>(0);

  useEffect(() => {
    // Subscribe to health changes
    const unsubscribeHealth = healthSystem.subscribe((newHealth) => {
      setHealth(newHealth);
    });

    // Subscribe to combat events
    const unsubscribeCombat = healthSystem.subscribeToCombatEvents((events) => {
      // Only show recent events (last 3 seconds)
      const cutoff = Date.now() - 3000;
      setRecentEvents(events.filter(event => event.timestamp > cutoff));
    });

    // Subscribe to experience changes
    const unsubscribeExperience = experienceSystem.subscribe((skillsMap) => {
      setCombatSkill(skillsMap.get('combat') || null);
      setTotalLevel(experienceSystem.getTotalLevel());
    });

    return () => {
      unsubscribeHealth();
      unsubscribeCombat();
      unsubscribeExperience();
    };
  }, [healthSystem, experienceSystem]);

  const getHealthPercentage = (): number => {
    return (health.current / health.maximum) * 100;
  };

  const getHealthColor = (): string => {
    const percentage = getHealthPercentage();
    if (percentage > 70) return 'bg-green-500';
    if (percentage > 40) return 'bg-yellow-500';
    if (percentage > 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getHealthTextColor = (): string => {
    const percentage = getHealthPercentage();
    if (percentage > 70) return 'text-green-300';
    if (percentage > 40) return 'text-yellow-300';
    if (percentage > 20) return 'text-orange-300';
    return 'text-red-300';
  };

  return (
    <div className="absolute top-4 left-4 space-y-2">
      {/* Main Health Bar with Levels */}
      <div className="bg-black bg-opacity-60 text-white p-4 rounded-lg backdrop-blur-sm border border-white border-opacity-20 min-w-80">
        <div className="flex items-center gap-4 mb-2">
          {/* Health Section */}
          <div className="flex items-center gap-3 flex-1">
            <Heart className="w-6 h-6 text-red-400" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-white">Health</span>
                <span className={`text-sm font-mono ${getHealthTextColor()}`}>
                  {Math.floor(health.current)}/{health.maximum}
                </span>
              </div>
              
              {/* Health Bar */}
              <div className="w-full bg-gray-700 rounded-full h-3 relative overflow-hidden">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${getHealthColor()}`}
                  style={{ width: `${getHealthPercentage()}%` }}
                />
                
                {/* Regeneration shimmer effect */}
                {health.isRegenerating && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></div>
                )}
              </div>
            </div>
          </div>

          {/* Level Section */}
          <div className="border-l border-gray-600 pl-4 space-y-2">
            {/* Combat Level */}
            <div className="flex items-center gap-2">
              <Swords className="w-4 h-4 text-red-400" />
              <div className="text-right">
                <div className="text-lg font-bold text-red-300">{combatSkill?.level || 1}</div>
                <div className="text-xs text-gray-400">Combat</div>
              </div>
            </div>

            {/* Total Level */}
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <div className="text-right">
                <div className="text-lg font-bold text-yellow-300">{totalLevel}</div>
                <div className="text-xs text-gray-400">Total</div>
              </div>
            </div>
          </div>
        </div>

        {/* Health Status Indicators */}
        <div className="flex items-center gap-4 text-xs">
          {health.isRegenerating && (
            <div className="flex items-center gap-1 text-green-300">
              <Activity className="w-3 h-3" />
              <span>Regenerating</span>
            </div>
          )}
          
          {health.current <= 0 && (
            <div className="flex items-center gap-1 text-red-300 animate-pulse">
              <Zap className="w-3 h-3" />
              <span>CRITICAL</span>
            </div>
          )}

          {!health.isRegenerating && health.current < health.maximum && (
            <div className="text-gray-400">
              Regen in {Math.max(0, 5 - (Date.now() - health.lastDamageTime) / 1000).toFixed(1)}s
            </div>
          )}

          {/* Combat Level Progress */}
          {combatSkill && combatSkill.level > 1 && (
            <div className="text-gray-400 border-l border-gray-600 pl-2">
              Combat: +{((combatSkill.level - 1) * 3).toFixed(0)}% damage
            </div>
          )}
        </div>

        {/* Regeneration Rate */}
        {health.regeneration > 0 && (
          <div className="mt-2 text-xs text-gray-400 border-t border-gray-600 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                <span>Regen: {health.regeneration.toFixed(1)} HP/s</span>
              </div>
              {totalLevel > 8 && (
                <div className="text-yellow-400">
                  Level {totalLevel} Adventurer
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Combat Events Display */}
      {recentEvents.length > 0 && (
        <div className="space-y-1">
          {recentEvents.slice(-3).map((event) => (
            <CombatEventDisplay key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Critical Health Warning */}
      {getHealthPercentage() <= 20 && health.current > 0 && (
        <div className="bg-red-900 bg-opacity-80 text-red-200 p-3 rounded-lg backdrop-blur-sm border border-red-500 animate-pulse">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            <div>
              <div className="font-bold">Critical Health!</div>
              <div className="text-xs">Find healing items or avoid combat</div>
            </div>
          </div>
        </div>
      )}

      {/* Death Screen */}
      {health.current <= 0 && (
        <div className="bg-black bg-opacity-90 text-red-300 p-4 rounded-lg backdrop-blur-sm border border-red-500">
          <div className="text-center">
            <div className="text-2xl font-bold mb-2">💀 DEFEATED</div>
            <div className="text-sm text-gray-400">
              You have fallen in combat...
            </div>
            {totalLevel > 1 && (
              <div className="text-xs text-yellow-400 mt-2">
                Level {totalLevel} • {combatSkill?.level || 1} Combat
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface CombatEventDisplayProps {
  event: CombatEvent;
}

const CombatEventDisplay: React.FC<CombatEventDisplayProps> = ({ event }) => {
  const [visible, setVisible] = useState(true);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    // Fade out after 2 seconds
    const fadeTimer = setTimeout(() => {
      setOpacity(0);
    }, 2000);

    // Remove after fade
    const removeTimer = setTimeout(() => {
      setVisible(false);
    }, 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  const getEventStyle = () => {
    switch (event.type) {
      case 'damage':
        return 'bg-red-900 bg-opacity-60 text-red-200 border-red-500';
      case 'critical':
        return 'bg-red-900 bg-opacity-80 text-red-100 border-red-400 animate-pulse';
      case 'heal':
        return 'bg-green-900 bg-opacity-60 text-green-200 border-green-500';
      case 'death':
        return 'bg-black bg-opacity-80 text-red-300 border-red-600';
      default:
        return 'bg-gray-900 bg-opacity-60 text-gray-200 border-gray-500';
    }
  };

  const getEventIcon = () => {
    switch (event.type) {
      case 'damage':
        return '💥';
      case 'critical':
        return '💥⚡';
      case 'heal':
        return '💚';
      case 'death':
        return '💀';
      default:
        return '⚡';
    }
  };

  const getEventText = () => {
    const data = event.data;
    switch (event.type) {
      case 'damage':
      case 'critical':
        return `-${data.actualDamage || data.amount} from ${data.source}${event.type === 'critical' ? ' (CRIT!)' : ''}`;
      case 'heal':
        return `+${data.amount} HP from ${data.source}`;
      case 'death':
        return `Defeated by ${data.source}`;
      default:
        return 'Combat event';
    }
  };

  return (
    <div 
      className={`px-3 py-2 rounded border transition-all duration-500 ${getEventStyle()}`}
      style={{ opacity }}
    >
      <div className="flex items-center gap-2 text-sm">
        <span>{getEventIcon()}</span>
        <span>{getEventText()}</span>
      </div>
    </div>
  );
};
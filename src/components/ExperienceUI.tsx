import React, { useState, useEffect } from 'react';
import { Skill, LevelUpEvent } from '../types/ExperienceTypes';
import { ExperienceSystem } from '../services/ExperienceSystem';
import { Star, TrendingUp, Award, X } from 'lucide-react';

interface ExperienceUIProps {
  experienceSystem: ExperienceSystem;
  isVisible: boolean;
  onClose: () => void;
}

export const ExperienceUI: React.FC<ExperienceUIProps> = ({ experienceSystem, isVisible, onClose }) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [recentLevelUps, setRecentLevelUps] = useState<LevelUpEvent[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (!isVisible) return;

    const unsubscribeSkills = experienceSystem.subscribe((skillsMap) => {
      setSkills(Array.from(skillsMap.values()));
    });

    const unsubscribeLevelUps = experienceSystem.subscribeLevelUps((event) => {
      setRecentLevelUps(prev => [...prev.slice(-9), event]); // Keep last 10
    });

    // Load recent level ups
    setRecentLevelUps(experienceSystem.getRecentLevelUps());

    return () => {
      unsubscribeSkills();
      unsubscribeLevelUps();
    };
  }, [experienceSystem, isVisible]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getSkillsByCategory = (category: string): Skill[] => {
    if (category === 'all') return skills;
    return skills.filter(skill => skill.category === category);
  };

  const getExperiencePercentage = (skill: Skill): number => {
    return (skill.experience / skill.experienceToNext) * 100;
  };

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'combat': return '⚔️';
      case 'gathering': return '🌾';
      case 'utility': return '🔧';
      case 'passive': return '✨';
      default: return '📊';
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'combat': return 'text-red-400 border-red-500';
      case 'gathering': return 'text-green-400 border-green-500';
      case 'utility': return 'text-blue-400 border-blue-500';
      case 'passive': return 'text-purple-400 border-purple-500';
      default: return 'text-gray-400 border-gray-500';
    }
  };

  const getSkillDescription = (skill: Skill): string => {
    const level = skill.level;
    switch (skill.id) {
      case 'movement':
        return `+${((level - 1) * 2).toFixed(0)}% movement speed`;
      case 'health':
        return `+${(level - 1) * 5} max health`;
      case 'combat':
        return `+${((level - 1) * 3).toFixed(0)}% damage`;
      case 'gathering':
        return `+${((level - 1) * 5).toFixed(0)}% yield bonus`;
      case 'woodcutting':
        return `+${((level - 1) * 4).toFixed(0)}% efficiency`;
      case 'mining':
        return `+${((level - 1) * 4).toFixed(0)}% efficiency`;
      case 'crafting':
        return `+${((level - 1) * 2).toFixed(0)}% durability`;
      case 'exploration':
        return `+${((level - 1) * 0.5).toFixed(1)}m detection range`;
      default:
        return 'Provides various bonuses';
    }
  };

  const totalLevel = skills.reduce((sum, skill) => sum + skill.level, 0);
  const categories = ['all', 'combat', 'gathering', 'utility', 'passive'];

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 pointer-events-auto"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-6xl max-h-5/6 flex flex-col m-4 border border-gray-700 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 rounded-t-lg flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-yellow-400" />
            <div>
              <h2 className="text-xl font-bold">Skills & Experience</h2>
              <p className="text-sm text-gray-400">Total Level: {totalLevel} • {skills.length} Skills</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="bg-gray-800 border-b border-gray-700">
          <div className="flex overflow-x-auto">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  selectedCategory === category
                    ? `${getCategoryColor(category)} bg-gray-700`
                    : 'text-gray-400 border-transparent hover:text-white'
                }`}
              >
                <span className="mr-2">{getCategoryIcon(category)}</span>
                {category === 'all' ? 'All Skills' : category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Skills List */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {getSkillsByCategory(selectedCategory).map(skill => (
                <div
                  key={skill.id}
                  className={`bg-gray-800 rounded-lg p-4 border ${getCategoryColor(skill.category)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{skill.icon}</div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{skill.name}</h3>
                        <p className="text-sm text-gray-400">{skill.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{skill.level}</div>
                      <div className="text-xs text-gray-400">Level</div>
                    </div>
                  </div>

                  {/* Experience Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Experience</span>
                      <span>{skill.experience} / {skill.experienceToNext}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all bg-gradient-to-r ${
                          skill.category === 'combat' ? 'from-red-600 to-red-400' :
                          skill.category === 'gathering' ? 'from-green-600 to-green-400' :
                          skill.category === 'utility' ? 'from-blue-600 to-blue-400' :
                          'from-purple-600 to-purple-400'
                        }`}
                        style={{ width: `${getExperiencePercentage(skill)}%` }}
                      />
                    </div>
                  </div>

                  {/* Skill Benefits */}
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-400">Current Bonus: </span>
                      <span className="text-white font-medium">{getSkillDescription(skill)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <div className="text-gray-400">
                        Total XP: {skill.totalExperience.toLocaleString()}
                      </div>
                      {skill.multiplier !== 1.0 && (
                        <div className="text-yellow-400">
                          {skill.multiplier}x XP Multiplier
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Level Ups Sidebar */}
          {recentLevelUps.length > 0 && (
            <div className="w-80 border-l border-gray-700 bg-gray-850">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  Recent Level Ups
                </h3>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto max-h-96">
                {recentLevelUps.slice().reverse().map((levelUp) => (
                  <div
                    key={`${levelUp.skillId}-${levelUp.timestamp}`}
                    className="bg-gray-800 rounded-lg p-3 border border-yellow-500"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{levelUp.skill.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-white">{levelUp.skill.name}</div>
                        <div className="text-sm text-yellow-400">
                          Level {levelUp.oldLevel} → {levelUp.newLevel}
                        </div>
                      </div>
                      <div className="flex">
                        {Array.from({ length: Math.min(levelUp.newLevel, 5) }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(levelUp.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-xs text-gray-300 mt-1">
                      {getSkillDescription(levelUp.skill)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-800 px-4 py-3 rounded-b-lg border-t border-gray-700 text-sm text-gray-400">
          <div className="flex justify-between items-center">
            <div>Press X to toggle experience window</div>
            <div>Gain experience by playing the game naturally</div>
          </div>
        </div>
      </div>
    </div>
  );
};
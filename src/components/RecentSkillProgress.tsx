import React, { useState, useEffect } from 'react';
import { Skill } from '../types/ExperienceTypes';
import { ExperienceSystem } from '../services/ExperienceSystem';

interface RecentSkillProgressProps {
  experienceSystem: ExperienceSystem;
  isUIActive: boolean;
}

export const RecentSkillProgress: React.FC<RecentSkillProgressProps> = ({ 
  experienceSystem, 
  isUIActive 
}) => {
  const [recentSkills, setRecentSkills] = useState<Skill[]>([]);

  useEffect(() => {
    const unsubscribe = experienceSystem.subscribe(() => {
      // Update recent skills whenever any skill changes
      const recent = experienceSystem.getRecentlyUpdatedSkills(3, 30000); // Last 3 skills updated in 30 seconds
      setRecentSkills(recent);
    });

    // Initial load
    setRecentSkills(experienceSystem.getRecentlyUpdatedSkills(3, 30000));

    return unsubscribe;
  }, [experienceSystem]);

  // Don't show when UI is active or no recent skills
  if (isUIActive || recentSkills.length === 0) {
    return null;
  }

  const getExperiencePercentage = (skill: Skill): number => {
    return (skill.experience / skill.experienceToNext) * 100;
  };

  const getCategoryColor = (skill: Skill): string => {
    switch (skill.category) {
      case 'combat': return 'border-red-500 bg-red-900';
      case 'gathering': return 'border-green-500 bg-green-900';
      case 'utility': return 'border-blue-500 bg-blue-900';
      case 'passive': return 'border-purple-500 bg-purple-900';
      default: return 'border-gray-500 bg-gray-900';
    }
  };

  const getProgressBarColor = (skill: Skill): string => {
    switch (skill.category) {
      case 'combat': return 'bg-red-500';
      case 'gathering': return 'bg-green-500';
      case 'utility': return 'bg-blue-500';
      case 'passive': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="fixed bottom-32 right-4 space-y-2 z-30 pointer-events-none">
      {recentSkills.map((skill, index) => (
        <div
          key={skill.id}
          className={`bg-black bg-opacity-60 text-white p-3 rounded-lg backdrop-blur-sm border-2 ${getCategoryColor(skill)} bg-opacity-40 transform transition-all duration-300`}
          style={{
            opacity: 1 - (index * 0.2), // Fade out older skills
            transform: `translateX(${index * 4}px)` // Slight offset for stacking effect
          }}
        >
          <div className="flex items-center gap-3 min-w-64">
            <div className="text-2xl">{skill.icon}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm">{skill.name}</span>
                <span className="text-xs text-gray-300">Lv.{skill.level}</span>
              </div>
              
              {/* Experience Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor(skill)}`}
                  style={{ width: `${getExperiencePercentage(skill)}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-400">
                  {skill.experience} / {skill.experienceToNext} XP
                </span>
                <span className="text-xs text-gray-400">
                  {getExperiencePercentage(skill).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {recentSkills.length > 0 && (
        <div className="text-center">
          <div className="text-xs text-gray-400 bg-black bg-opacity-40 px-2 py-1 rounded">
            Recent Skill Progress • Press X for details
          </div>
        </div>
      )}
    </div>
  );
};
import React from 'react';
import { InteractableObject, InteractionOption } from '../services/InteractableObjectManager';
import { X } from 'lucide-react';

interface ObjectInteractionUIProps {
  object: InteractableObject;
  options: InteractionOption[];
  onClose: () => void;
  onAction: (actionId: string) => void;
}

export const ObjectInteractionUI: React.FC<ObjectInteractionUIProps> = ({
  object,
  options,
  onClose,
  onAction
}) => {
  const handleAction = (option: InteractionOption) => {
    option.action();
    onAction(option.id);
    onClose();
  };

  const getHealthPercentage = () => {
    return (object.currentHp / object.maxHp) * 100;
  };

  const getHealthColor = () => {
    const percentage = getHealthPercentage();
    if (percentage > 70) return 'bg-green-500';
    if (percentage > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-2xl">
                {object.type === 'tree' ? '🌳' :
                 object.type === 'rock' ? '🪨' :
                 object.type === 'chest' ? '📦' :
                 object.type === 'plant' ? '🌿' :
                 object.type === 'mushroom' ? '🍄' :
                 object.type === 'crystal' ? '💎' :
                 object.type === 'bush' || object.type === 'berry_bush' ? '🌿' :
                 object.type === 'well' ? '🏗️' :
                 object.type === 'campfire' ? '🔥' :
                 object.type === 'statue' ? '🗿' :
                 object.type === 'cart' ? '🛒' :
                 object.type === 'crate' ? '📦' :
                 object.type === 'log' ? '🪵' : '📦'}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold">{object.name}</h2>
              <p className="text-sm opacity-90 capitalize">{object.type.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Description */}
          <div className="mb-4">
            <p className="text-gray-700">{object.description}</p>
          </div>

          {/* Health Bar (for harvestable objects) */}
          {object.canHarvest && object.maxHp < 999 && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Condition</span>
                <span>{object.currentHp}/{object.maxHp}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${getHealthColor()}`}
                  style={{ width: `${getHealthPercentage()}%` }}
                />
              </div>
            </div>
          )}

          {/* Interaction Options */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">What would you like to do?</h3>
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleAction(option)}
                className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 hover:border-blue-300 border border-gray-200 rounded-lg transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{option.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 group-hover:text-blue-700">
                      {option.label}
                    </div>
                    <div className="text-sm text-gray-600 group-hover:text-blue-600">
                      {option.description}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Tips */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              💡 <strong>Tip:</strong> Some objects can be harvested multiple times before being depleted.
              {object.canHarvest && " Use tools for better yields!"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
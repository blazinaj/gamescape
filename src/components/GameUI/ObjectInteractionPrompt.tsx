import React from 'react';
import { Package } from 'lucide-react';
import { InteractableObject } from '../../services/InteractableObjectManager';

interface ObjectInteractionPromptProps {
  object: InteractableObject;
  onInteract: () => void;
}

export const ObjectInteractionPrompt: React.FC<ObjectInteractionPromptProps> = ({
  object,
  onInteract,
}) => {
  const getObjectIcon = () => {
    switch (object.type) {
      case 'tree': return '🌳';
      case 'rock': return '🪨';
      case 'chest': return '📦';
      case 'plant': return '🌿';
      case 'mushroom': return '🍄';
      case 'crystal': return '💎';
      case 'bush':
      case 'berry_bush': return '🌿';
      case 'well': return '🏗️';
      case 'campfire': return '🔥';
      case 'statue': return '🗿';
      case 'cart': return '🛒';
      case 'crate': return '📦';
      case 'log': return '🪵';
      default: return '📦';
    }
  };

  const getInteractionText = () => {
    if (object.canTake && ['chest', 'crate', 'cart'].includes(object.type)) {
      return 'Open';
    } else if (object.canTake) {
      return 'Take';
    } else if (object.canHarvest) {
      return 'Harvest';
    } else {
      return 'Examine';
    }
  };

  return (
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-40">
      <div className="bg-black bg-opacity-40 text-white px-4 py-2 rounded-lg backdrop-blur-sm border border-green-400 border-opacity-60">
        <div className="flex items-center gap-3">
          <span className="text-lg">{getObjectIcon()}</span>
          <div className="text-center">
            <div className="text-sm font-medium text-green-300">{object.name}</div>
            <div className="text-xs text-gray-300">Press <span className="text-green-400 font-bold">E</span> to {getInteractionText().toLowerCase()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
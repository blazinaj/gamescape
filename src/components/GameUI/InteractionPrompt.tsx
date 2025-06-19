import React from 'react';
import { MessageCircle } from 'lucide-react';
import { NPC } from '../NPC';

interface InteractionPromptProps {
  npc: NPC;
  onInteract: () => void;
}

export const InteractionPrompt: React.FC<InteractionPromptProps> = ({
  npc,
  onInteract,
}) => {
  return (
    <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2">
      <div className="bg-black bg-opacity-70 text-white px-6 py-3 rounded-lg backdrop-blur-sm border-2 border-yellow-400 animate-pulse">
        <div className="text-center">
          <div className="text-lg font-bold text-yellow-300 mb-1">{npc.data.name}</div>
          <div className="text-sm text-gray-300 mb-3">{npc.data.occupation}</div>
          <button
            onClick={onInteract}
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center gap-2 mx-auto"
          >
            <MessageCircle className="w-4 h-4" />
            Interact [E]
          </button>
        </div>
      </div>
    </div>
  );
};
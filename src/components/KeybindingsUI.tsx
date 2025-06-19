import React from 'react';
import { X, Keyboard, Gamepad2, Mouse, Zap } from 'lucide-react';

interface KeybindingsUIProps {
  isVisible: boolean;
  onClose: () => void;
}

export const KeybindingsUI: React.FC<KeybindingsUIProps> = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 pointer-events-auto"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-4xl max-h-5/6 flex flex-col m-4 border border-gray-700 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 rounded-t-lg flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Keyboard className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold">Controls & Keybindings</h2>
              <p className="text-sm text-gray-400">Learn how to play and navigate the world</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Movement Controls */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Gamepad2 className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-semibold text-white">Movement</h3>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <span className="text-gray-300">Move Forward</span>
                  <kbd className="px-2 py-1 bg-gray-700 text-white rounded text-sm font-mono">W</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <span className="text-gray-300">Move Backward</span>
                  <kbd className="px-2 py-1 bg-gray-700 text-white rounded text-sm font-mono">S</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <span className="text-gray-300">Move Left</span>
                  <kbd className="px-2 py-1 bg-gray-700 text-white rounded text-sm font-mono">A</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <span className="text-gray-300">Move Right</span>
                  <kbd className="px-2 py-1 bg-gray-700 text-white rounded text-sm font-mono">D</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <span className="text-gray-300">Run</span>
                  <kbd className="px-2 py-1 bg-gray-700 text-white rounded text-sm font-mono">Shift</kbd>
                </div>
              </div>
            </div>

            {/* Mouse Controls */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Mouse className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Mouse Controls</h3>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <span className="text-gray-300">Look Around</span>
                  <kbd className="px-2 py-1 bg-gray-700 text-white rounded text-sm font-mono">Mouse Move</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <span className="text-gray-300">Lock Mouse</span>
                  <kbd className="px-2 py-1 bg-gray-700 text-white rounded text-sm font-mono">Left Click</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <span className="text-gray-300">Use Tool</span>
                  <kbd className="px-2 py-1 bg-gray-700 text-white rounded text-sm font-mono">Left Click</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <span className="text-gray-300">Attack with Weapon</span>
                  <kbd className="px-2 py-1 bg-gray-700 text-white rounded text-sm font-mono">Right Click</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <span className="text-gray-300">Unlock Mouse</span>
                  <kbd className="px-2 py-1 bg-gray-700 text-white rounded text-sm font-mono">Esc</kbd>
                </div>
              </div>
            </div>

            {/* Interaction Controls */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Interactions</h3>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <span className="text-gray-300">Interact with NPCs/Objects</span>
                  <kbd className="px-2 py-1 bg-gray-700 text-white rounded text-sm font-mono">E</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <span className="text-gray-300">Quick Tool 1</span>
                  <kbd className="px-2 py-1 bg-gray-700 text-white rounded text-sm font-mono">1</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <span className="text-gray-300">Quick Tool 2</span>
                  <kbd className="px-2 py-1 bg-gray-700 text-white rounded text-sm font-mono">2</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <span className="text-gray-300">Quick Weapon 1</span>
                  <kbd className="px-2 py-1 bg-gray-700 text-white rounded text-sm font-mono">3</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <span className="text-gray-300">Quick Weapon 2</span>
                  <kbd className="px-2 py-1 bg-gray-700 text-white rounded text-sm font-mono">4</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <span className="text-gray-300">Tool Selection Menu</span>
                  <kbd className="px-2 py-1 bg-gray-700 text-white rounded text-sm font-mono">Tab</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <span className="text-gray-300">Weapon Selection Menu</span>
                  <kbd className="px-2 py-1 bg-gray-700 text-white rounded text-sm font-mono">Q</kbd>
                </div>
              </div>
            </div>

            {/* UI Controls */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Mouse className="w-5 h-5 text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">User Interface</h3>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <span className="text-gray-300">Open Inventory</span>
                  <kbd className="px-2 py-1 bg-gray-700 text-white rounded text-sm font-mono">I</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <span className="text-gray-300">Character Customizer</span>
                  <kbd className="px-2 py-1 bg-gray-700 text-white rounded text-sm font-mono">C</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <span className="text-gray-300">Skills & Experience</span>
                  <kbd className="px-2 py-1 bg-gray-700 text-white rounded text-sm font-mono">X</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <span className="text-gray-300">Controls Help</span>
                  <kbd className="px-2 py-1 bg-gray-700 text-white rounded text-sm font-mono">H</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <span className="text-gray-300">Save Game</span>
                  <kbd className="px-2 py-1 bg-gray-700 text-white rounded text-sm font-mono">Ctrl + S</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <span className="text-gray-300">System Logs</span>
                  <kbd className="px-2 py-1 bg-gray-700 text-white rounded text-sm font-mono">Ctrl + Shift + L</kbd>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-800 rounded">
                  <span className="text-gray-300">Close Menus</span>
                  <kbd className="px-2 py-1 bg-gray-700 text-white rounded text-sm font-mono">Esc</kbd>
                </div>
              </div>
            </div>
          </div>

          {/* Tips Section */}
          <div className="mt-8 p-4 bg-blue-900 bg-opacity-30 rounded-lg border border-blue-500">
            <h3 className="text-lg font-semibold text-blue-300 mb-3">💡 Tips</h3>
            <ul className="space-y-2 text-sm text-blue-200">
              <li>• Click anywhere on the game area to activate mouse look</li>
              <li>• Use tools (axe, pickaxe) to gather resources and gain experience</li>
              <li>• Equip weapons to defend yourself against enemies and gain combat XP</li>
              <li>• Walking around naturally levels up your Movement skill</li>
              <li>• Each skill provides passive bonuses as it levels up</li>
              <li>• Check your Skills window (X) to see progress and bonuses</li>
              <li>• Talk to NPCs to learn about the world and get quests</li>
              <li>• Your progress is automatically saved every 30 seconds</li>
              <li>• Health regenerates after 5 seconds without taking damage</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
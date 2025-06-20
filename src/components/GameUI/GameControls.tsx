import React from 'react';
import { Package, Terminal, Home, User, Keyboard, TrendingUp, Save, CheckCircle, XCircle, Loader2, Clock, Settings, Box } from 'lucide-react';
import { AutoSaveState } from '../../hooks/useAutoSave';

interface GameControlsProps {
  onShowCharacterCustomizer: () => void;
  onShowInventory: () => void;
  onShowKeybindings: () => void;
  onShowExperience: () => void;
  onShowLogViewer: () => void;
  onShowSaveUI: () => void;
  onShowSettings: () => void;
  onShowObjectManager: () => void;
  onReturnToMenu: () => void;
  autoSaveState: AutoSaveState;
  customObjectCount?: number;
}

export const GameControls: React.FC<GameControlsProps> = ({
  onShowCharacterCustomizer,
  onShowInventory,
  onShowKeybindings,
  onShowExperience,
  onShowLogViewer,
  onShowSaveUI,
  onShowSettings,
  onShowObjectManager,
  onReturnToMenu,
  autoSaveState,
  customObjectCount = 0
}) => {
  const getSaveButtonIcon = () => {
    switch (autoSaveState.status) {
      case 'saving':
        return <Loader2 className="w-5 h-5 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Save className="w-5 h-5" />;
    }
  };

  const getSaveButtonColor = () => {
    switch (autoSaveState.status) {
      case 'saving':
        return 'bg-blue-600 bg-opacity-70';
      case 'success':
        return 'bg-green-600 bg-opacity-70';
      case 'error':
        return 'bg-red-600 bg-opacity-70';
      default:
        return 'bg-black bg-opacity-50 hover:bg-opacity-70';
    }
  };

  const getSaveButtonTitle = () => {
    switch (autoSaveState.status) {
      case 'saving':
        return 'Auto-saving...';
      case 'success':
        return 'Auto-saved successfully';
      case 'error':
        return `Auto-save failed: ${autoSaveState.errorMessage || 'Unknown error'}`;
      default: {
        if (autoSaveState.timeUntilNextSave <= 0) {
          return 'Save Game (Ctrl+S) - Auto-save ready';
        }
        const seconds = Math.ceil(autoSaveState.timeUntilNextSave / 1000);
        return `Save Game (Ctrl+S) - Auto-save in ${seconds}s`;
      }
    }
  };

  return (
    <div className="absolute top-4 right-4 flex gap-2">
      <button
        onClick={onShowObjectManager}
        className="bg-black bg-opacity-50 text-white p-2 rounded-lg backdrop-blur-sm hover:bg-opacity-70 transition-all relative"
        title="Manage Custom Objects"
      >
        <Box className="w-5 h-5" />
        {customObjectCount > 0 && (
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border border-black flex items-center justify-center text-[8px] font-bold">
            {customObjectCount}
          </div>
        )}
      </button>
      <button
        onClick={onShowCharacterCustomizer}
        className="bg-black bg-opacity-50 text-white p-2 rounded-lg backdrop-blur-sm hover:bg-opacity-70 transition-all"
        title="Character Customizer (C)"
      >
        <User className="w-5 h-5" />
      </button>
      <button
        onClick={onShowInventory}
        className="bg-black bg-opacity-50 text-white p-2 rounded-lg backdrop-blur-sm hover:bg-opacity-70 transition-all"
        title="Inventory (I)"
      >
        <Package className="w-5 h-5" />
      </button>
      <button
        onClick={onShowExperience}
        className="bg-black bg-opacity-50 text-white p-2 rounded-lg backdrop-blur-sm hover:bg-opacity-70 transition-all"
        title="Skills & Experience (X)"
      >
        <TrendingUp className="w-5 h-5" />
      </button>
      <button
        onClick={onShowKeybindings}
        className="bg-black bg-opacity-50 text-white p-2 rounded-lg backdrop-blur-sm hover:bg-opacity-70 transition-all"
        title="Controls & Keybindings (H)"
      >
        <Keyboard className="w-5 h-5" />
      </button>
      <button
        onClick={onShowSettings}
        className="bg-black bg-opacity-50 text-white p-2 rounded-lg backdrop-blur-sm hover:bg-opacity-70 transition-all"
        title="Game Settings"
      >
        <Settings className="w-5 h-5" />
      </button>
      <button
        onClick={onShowLogViewer}
        className="bg-black bg-opacity-50 text-white p-2 rounded-lg backdrop-blur-sm hover:bg-opacity-70 transition-all"
        title="System Logs (Ctrl+Shift+L)"
      >
        <Terminal className="w-5 h-5" />
      </button>
      
      {/* Enhanced Save Button with Auto-Save Status */}
      <div className="relative">
        <button
          onClick={onShowSaveUI}
          className={`text-white p-2 rounded-lg backdrop-blur-sm transition-all relative ${getSaveButtonColor()}`}
          title={getSaveButtonTitle()}
        >
          {getSaveButtonIcon()}
          
          {/* Auto-save progress indicator */}
          {autoSaveState.status === 'idle' && autoSaveState.timeUntilNextSave > 0 && (
            <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
              <div 
                className="absolute bottom-0 left-0 h-1 bg-green-400 transition-all duration-1000"
                style={{ 
                  width: `${100 - (autoSaveState.timeUntilNextSave / autoSaveState.interval) * 100}%` 
                }}
              />
            </div>
          )}
          
          {/* Status indicator dot */}
          <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800 ${
            autoSaveState.status === 'saving' ? 'bg-blue-400' :
            autoSaveState.status === 'success' ? 'bg-green-400' :
            autoSaveState.status === 'error' ? 'bg-red-400' :
            'bg-gray-500'
          }`} />
        </button>
        
        {/* Countdown text for idle state */}
        {autoSaveState.status === 'idle' && autoSaveState.timeUntilNextSave > 0 && (
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap">
            {Math.ceil(autoSaveState.timeUntilNextSave / 1000)}s
          </div>
        )}
      </div>
      
      <button
        onClick={onReturnToMenu}
        className="bg-black bg-opacity-50 text-white p-2 rounded-lg backdrop-blur-sm hover:bg-opacity-70 transition-all"
        title="Return to Main Menu"
      >
        <Home className="w-5 h-5" />
      </button>
    </div>
  );
};
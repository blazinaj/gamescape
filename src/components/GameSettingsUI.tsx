import React, { useState, useEffect } from 'react';
import { Settings, X, Monitor, Gamepad2, Volume2, Code, Eye, EyeOff, Square, RotateCcw } from 'lucide-react';
import { collisionSystem } from '../services/CollisionSystem';

interface GameSettingsUIProps {
  isVisible: boolean;
  onClose: () => void;
}

interface GameSettings {
  // Graphics settings
  graphics: {
    shadows: boolean;
    antialiasing: boolean;
    renderDistance: number;
    fpsLimit: number;
  };
  // Audio settings
  audio: {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    muted: boolean;
  };
  // Gameplay settings
  gameplay: {
    mouseSensitivity: number;
    invertY: boolean;
    autoSave: boolean;
    autoSaveInterval: number;
  };
  // Developer settings
  developer: {
    showCollisionBounds: boolean;
    disableCollision: boolean;
    showFPS: boolean;
    showDebugInfo: boolean;
    wireframeMode: boolean;
  };
}

const DEFAULT_SETTINGS: GameSettings = {
  graphics: {
    shadows: true,
    antialiasing: true,
    renderDistance: 100,
    fpsLimit: 60
  },
  audio: {
    masterVolume: 80,
    musicVolume: 70,
    sfxVolume: 85,
    muted: false
  },
  gameplay: {
    mouseSensitivity: 50,
    invertY: false,
    autoSave: true,
    autoSaveInterval: 30
  },
  developer: {
    showCollisionBounds: false,
    disableCollision: false,
    showFPS: false,
    showDebugInfo: false,
    wireframeMode: false
  }
};

export const GameSettingsUI: React.FC<GameSettingsUIProps> = ({ isVisible, onClose }) => {
  const [activeTab, setActiveTab] = useState<'graphics' | 'audio' | 'gameplay' | 'developer'>('graphics');
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [isDirty, setIsDirty] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('gamescape_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (error) {
        console.warn('Failed to parse saved settings:', error);
      }
    }
  }, []);

  // Apply developer settings to systems
  useEffect(() => {
    // Apply collision debug settings
    collisionSystem.setDebugMode(settings.developer.showCollisionBounds);
    
    // Apply other developer settings here as needed
    if (settings.developer.showFPS) {
      // Enable FPS counter if available
    }
  }, [settings.developer]);

  const updateSetting = (category: keyof GameSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    setIsDirty(true);
  };

  const saveSettings = () => {
    localStorage.setItem('gamescape_settings', JSON.stringify(settings));
    setIsDirty(false);
    console.log('🎮 Settings saved successfully');
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    setIsDirty(true);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isVisible) return null;

  const tabs = [
    { id: 'graphics' as const, label: 'Graphics', icon: Monitor },
    { id: 'audio' as const, label: 'Audio', icon: Volume2 },
    { id: 'gameplay' as const, label: 'Gameplay', icon: Gamepad2 },
    { id: 'developer' as const, label: 'Developer', icon: Code }
  ];

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
            <Settings className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold">Game Settings</h2>
              <p className="text-sm text-gray-400">Configure your GameScape experience</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Tab Navigation */}
          <div className="w-64 bg-gray-800 border-r border-gray-700">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
                Categories
              </h3>
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {activeTab === 'graphics' && (
                <GraphicsSettings settings={settings.graphics} updateSetting={updateSetting} />
              )}
              {activeTab === 'audio' && (
                <AudioSettings settings={settings.audio} updateSetting={updateSetting} />
              )}
              {activeTab === 'gameplay' && (
                <GameplaySettings settings={settings.gameplay} updateSetting={updateSetting} />
              )}
              {activeTab === 'developer' && (
                <DeveloperSettings settings={settings.developer} updateSetting={updateSetting} />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-800 px-6 py-4 rounded-b-lg border-t border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isDirty && (
              <span className="text-yellow-400 text-sm flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                Unsaved changes
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={resetSettings}
              className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white border border-gray-600 hover:border-gray-500 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </button>
            <button
              onClick={saveSettings}
              disabled={!isDirty}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              {isDirty ? 'Save Settings' : 'Saved'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Graphics Settings Component
const GraphicsSettings: React.FC<{
  settings: GameSettings['graphics'];
  updateSetting: (category: 'graphics', key: string, value: any) => void;
}> = ({ settings, updateSetting }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">Graphics Quality</h3>
      <div className="space-y-4">
        <SettingToggle
          label="Shadows"
          description="Enable dynamic shadows for better visual quality"
          value={settings.shadows}
          onChange={(value) => updateSetting('graphics', 'shadows', value)}
        />
        <SettingToggle
          label="Anti-aliasing"
          description="Smooth jagged edges for cleaner visuals"
          value={settings.antialiasing}
          onChange={(value) => updateSetting('graphics', 'antialiasing', value)}
        />
        <SettingSlider
          label="Render Distance"
          description="How far objects are visible (affects performance)"
          value={settings.renderDistance}
          min={50}
          max={200}
          step={10}
          unit="m"
          onChange={(value) => updateSetting('graphics', 'renderDistance', value)}
        />
        <SettingSlider
          label="FPS Limit"
          description="Maximum frames per second"
          value={settings.fpsLimit}
          min={30}
          max={144}
          step={15}
          unit="fps"
          onChange={(value) => updateSetting('graphics', 'fpsLimit', value)}
        />
      </div>
    </div>
  </div>
);

// Audio Settings Component
const AudioSettings: React.FC<{
  settings: GameSettings['audio'];
  updateSetting: (category: 'audio', key: string, value: any) => void;
}> = ({ settings, updateSetting }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">Volume Controls</h3>
      <div className="space-y-4">
        <SettingToggle
          label="Mute All Audio"
          description="Disable all game audio"
          value={settings.muted}
          onChange={(value) => updateSetting('audio', 'muted', value)}
        />
        <SettingSlider
          label="Master Volume"
          description="Overall audio level"
          value={settings.masterVolume}
          min={0}
          max={100}
          step={5}
          unit="%"
          disabled={settings.muted}
          onChange={(value) => updateSetting('audio', 'masterVolume', value)}
        />
        <SettingSlider
          label="Music Volume"
          description="Background music level"
          value={settings.musicVolume}
          min={0}
          max={100}
          step={5}
          unit="%"
          disabled={settings.muted}
          onChange={(value) => updateSetting('audio', 'musicVolume', value)}
        />
        <SettingSlider
          label="Sound Effects"
          description="Game sound effects level"
          value={settings.sfxVolume}
          min={0}
          max={100}
          step={5}
          unit="%"
          disabled={settings.muted}
          onChange={(value) => updateSetting('audio', 'sfxVolume', value)}
        />
      </div>
    </div>
  </div>
);

// Gameplay Settings Component
const GameplaySettings: React.FC<{
  settings: GameSettings['gameplay'];
  updateSetting: (category: 'gameplay', key: string, value: any) => void;
}> = ({ settings, updateSetting }) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">Controls</h3>
      <div className="space-y-4">
        <SettingSlider
          label="Mouse Sensitivity"
          description="Camera movement sensitivity"
          value={settings.mouseSensitivity}
          min={10}
          max={100}
          step={5}
          unit="%"
          onChange={(value) => updateSetting('gameplay', 'mouseSensitivity', value)}
        />
        <SettingToggle
          label="Invert Y-Axis"
          description="Invert vertical mouse movement"
          value={settings.invertY}
          onChange={(value) => updateSetting('gameplay', 'invertY', value)}
        />
      </div>
    </div>
    
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">Auto-Save</h3>
      <div className="space-y-4">
        <SettingToggle
          label="Enable Auto-Save"
          description="Automatically save progress periodically"
          value={settings.autoSave}
          onChange={(value) => updateSetting('gameplay', 'autoSave', value)}
        />
        <SettingSlider
          label="Auto-Save Interval"
          description="Time between automatic saves"
          value={settings.autoSaveInterval}
          min={10}
          max={300}
          step={10}
          unit="sec"
          disabled={!settings.autoSave}
          onChange={(value) => updateSetting('gameplay', 'autoSaveInterval', value)}
        />
      </div>
    </div>
  </div>
);

// Developer Settings Component
const DeveloperSettings: React.FC<{
  settings: GameSettings['developer'];
  updateSetting: (category: 'developer', key: string, value: any) => void;
}> = ({ settings, updateSetting }) => (
  <div className="space-y-6">
    <div className="bg-yellow-900 bg-opacity-30 border border-yellow-500 border-opacity-50 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <Code className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="text-yellow-300 font-medium">Developer Mode</h4>
          <p className="text-yellow-200 text-sm mt-1">
            These settings are for debugging and development purposes. Some may impact game performance.
          </p>
        </div>
      </div>
    </div>

    <div>
      <h3 className="text-lg font-semibold text-white mb-4">Collision System</h3>
      <div className="space-y-4">
        <SettingToggle
          label="Show Collision Boundaries"
          description="Display wireframe outlines of collision boxes, spheres, and capsules"
          value={settings.showCollisionBounds}
          onChange={(value) => updateSetting('developer', 'showCollisionBounds', value)}
          icon={settings.showCollisionBounds ? Eye : EyeOff}
        />
        <SettingToggle
          label="Disable Collision"
          description="Turn off all collision detection (allows walking through walls)"
          value={settings.disableCollision}
          onChange={(value) => updateSetting('developer', 'disableCollision', value)}
          icon={Square}
          dangerous
        />
      </div>
    </div>

    <div>
      <h3 className="text-lg font-semibold text-white mb-4">Performance</h3>
      <div className="space-y-4">
        <SettingToggle
          label="Show FPS Counter"
          description="Display frames per second in the top corner"
          value={settings.showFPS}
          onChange={(value) => updateSetting('developer', 'showFPS', value)}
        />
        <SettingToggle
          label="Show Debug Info"
          description="Display debug information panel"
          value={settings.showDebugInfo}
          onChange={(value) => updateSetting('developer', 'showDebugInfo', value)}
        />
      </div>
    </div>

    <div>
      <h3 className="text-lg font-semibold text-white mb-4">Rendering</h3>
      <div className="space-y-4">
        <SettingToggle
          label="Wireframe Mode"
          description="Render all objects as wireframes"
          value={settings.wireframeMode}
          onChange={(value) => updateSetting('developer', 'wireframeMode', value)}
          dangerous
        />
      </div>
    </div>

    {/* Collision System Status */}
    <div className="mt-8 p-4 bg-gray-800 rounded-lg border border-gray-600">
      <h4 className="text-white font-medium mb-3">Collision System Status</h4>
      <CollisionSystemStatus />
    </div>
  </div>
);

// Collision System Status Component
const CollisionSystemStatus: React.FC = () => {
  const [stats, setStats] = useState(collisionSystem.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(collisionSystem.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <span className="text-gray-400">Objects:</span>
        <span className="text-white ml-2">{stats.objectCount}</span>
      </div>
      <div>
        <span className="text-gray-400">Grid Cells:</span>
        <span className="text-white ml-2">{stats.gridCells}</span>
      </div>
      <div>
        <span className="text-gray-400">Debug Mode:</span>
        <span className={`ml-2 ${stats.debugMode ? 'text-green-400' : 'text-red-400'}`}>
          {stats.debugMode ? 'Enabled' : 'Disabled'}
        </span>
      </div>
      <div>
        <span className="text-gray-400">System:</span>
        <span className="text-green-400 ml-2">Active</span>
      </div>
    </div>
  );
};

// Reusable Setting Components
const SettingToggle: React.FC<{
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  icon?: React.ComponentType<{ className?: string }>;
  dangerous?: boolean;
}> = ({ label, description, value, onChange, icon: Icon, dangerous }) => (
  <div className="flex items-start justify-between">
    <div className="flex-1">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <label className={`font-medium ${dangerous ? 'text-red-300' : 'text-white'}`}>
          {label}
        </label>
      </div>
      <p className="text-sm text-gray-400 mt-1">{description}</p>
    </div>
    <button
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        value 
          ? dangerous ? 'bg-red-600' : 'bg-blue-600'
          : 'bg-gray-700'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          value ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

const SettingSlider: React.FC<{
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
  disabled?: boolean;
}> = ({ label, description, value, min, max, step, unit, onChange, disabled }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <div>
        <label className={`font-medium ${disabled ? 'text-gray-500' : 'text-white'}`}>
          {label}
        </label>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
      <span className={`text-sm ${disabled ? 'text-gray-500' : 'text-blue-400'}`}>
        {value}{unit}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      disabled={disabled}
      className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
        disabled ? 'bg-gray-700' : 'bg-gray-700'
      } slider`}
    />
  </div>
);
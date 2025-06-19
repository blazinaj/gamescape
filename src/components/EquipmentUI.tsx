import React, { useState, useEffect } from 'react';
import { Tool } from '../types/EquipmentTypes';
import { EquipmentManager } from '../services/EquipmentManager';
import { Package, Wrench, Target, Sword } from 'lucide-react';

interface EquipmentUIProps {
  equipmentManager: EquipmentManager;
}

export const EquipmentUI: React.FC<EquipmentUIProps> = ({ equipmentManager }) => {
  const [equippedTool, setEquippedTool] = useState<Tool | null>(null);
  const [equippedWeapon, setEquippedWeapon] = useState<Tool | null>(null);
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  const [availableWeapons, setAvailableWeapons] = useState<Tool[]>([]);
  const [showToolSelect, setShowToolSelect] = useState(false);
  const [showWeaponSelect, setShowWeaponSelect] = useState(false);

  useEffect(() => {
    // Subscribe to equipment changes
    const unsubscribe = equipmentManager.subscribe((tool, weapon) => {
      setEquippedTool(tool);
      setEquippedWeapon(weapon);
    });

    // Get available tools and weapons
    setAvailableTools(equipmentManager.getAvailableTools());
    setAvailableWeapons(equipmentManager.getAvailableWeapons());

    return unsubscribe;
  }, [equipmentManager]);

  // Handle number key shortcuts for tool and weapon switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Digit1') {
        e.preventDefault();
        const tools = equipmentManager.getAvailableTools();
        if (tools[0]) equipmentManager.equipTool(tools[0].id);
      } else if (e.code === 'Digit2') {
        e.preventDefault();
        const tools = equipmentManager.getAvailableTools();
        if (tools[1]) equipmentManager.equipTool(tools[1].id);
      } else if (e.code === 'Digit3') {
        e.preventDefault();
        const weapons = equipmentManager.getAvailableWeapons();
        if (weapons[0]) equipmentManager.equipWeapon(weapons[0].id);
      } else if (e.code === 'Digit4') {
        e.preventDefault();
        const weapons = equipmentManager.getAvailableWeapons();
        if (weapons[1]) equipmentManager.equipWeapon(weapons[1].id);
      } else if (e.code === 'Tab') {
        e.preventDefault();
        setShowToolSelect(prev => !prev);
      } else if (e.code === 'KeyQ') {
        e.preventDefault();
        setShowWeaponSelect(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [equipmentManager]);

  const getDurabilityColor = (percentage: number): string => {
    if (percentage > 60) return 'bg-green-500';
    if (percentage > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getDurabilityPercentage = (item: Tool): number => {
    return (item.durability / item.maxDurability) * 100;
  };

  const handleToolSelect = (toolId: string) => {
    equipmentManager.equipTool(toolId);
    setShowToolSelect(false);
  };

  const handleWeaponSelect = (weaponId: string) => {
    equipmentManager.equipWeapon(weaponId);
    setShowWeaponSelect(false);
  };

  const canUseTool = equipmentManager.canUseTool();
  const canUseWeapon = equipmentManager.canUseWeapon();

  return (
    <div className="absolute bottom-20 left-4 space-y-2">
      {/* Compact Equipment Display */}
      <div className="bg-black bg-opacity-40 text-white p-2 rounded backdrop-blur-sm border border-white border-opacity-20 min-w-48">
        <div className="flex items-center gap-4">
          {/* Tool Slot */}
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-400">Tool:</div>
            {equippedTool ? (
              <div className="flex items-center gap-1">
                <span className="text-lg">{equippedTool.icon}</span>
                <div className="text-xs">
                  <div className="text-yellow-300 font-medium">{equippedTool.name}</div>
                  <div className="w-12 bg-gray-700 rounded-full h-1">
                    <div 
                      className={`h-1 rounded-full ${getDurabilityColor(getDurabilityPercentage(equippedTool))}`}
                      style={{ width: `${getDurabilityPercentage(equippedTool)}%` }}
                    />
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${canUseTool ? 'bg-green-400' : 'bg-red-400'}`} />
              </div>
            ) : (
              <div className="text-xs text-gray-500">None</div>
            )}
          </div>

          {/* Weapon Slot */}
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-400">Weapon:</div>
            {equippedWeapon ? (
              <div className="flex items-center gap-1">
                <span className="text-lg">{equippedWeapon.icon}</span>
                <div className="text-xs">
                  <div className="text-red-300 font-medium">{equippedWeapon.name}</div>
                  <div className="w-12 bg-gray-700 rounded-full h-1">
                    <div 
                      className={`h-1 rounded-full ${getDurabilityColor(getDurabilityPercentage(equippedWeapon))}`}
                      style={{ width: `${getDurabilityPercentage(equippedWeapon)}%` }}
                    />
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${canUseWeapon ? 'bg-green-400' : 'bg-red-400'}`} />
              </div>
            ) : (
              <div className="text-xs text-gray-500">None</div>
            )}
          </div>
        </div>
      </div>

      {/* Tool Selection Menu */}
      {showToolSelect && (
        <div className="bg-black bg-opacity-80 text-white p-3 rounded-lg backdrop-blur-sm border border-white border-opacity-20">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4" />
            <h3 className="font-bold text-sm">Select Tool</h3>
          </div>
          
          <div className="space-y-1">
            {availableTools.map((tool, index) => (
              <button
                key={tool.id}
                onClick={() => handleToolSelect(tool.id)}
                className={`w-full p-2 rounded border transition-all text-left text-xs ${
                  equippedTool?.id === tool.id
                    ? 'border-yellow-400 bg-yellow-900 bg-opacity-50'
                    : 'border-gray-600 hover:border-gray-400 hover:bg-gray-800 bg-opacity-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{tool.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{tool.name}</div>
                    <div className="text-blue-400">
                      Dmg: {tool.damage} • Range: {tool.range}m
                    </div>
                  </div>
                  <div className="text-gray-400">[{index + 1}]</div>
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-2 text-xs text-gray-400 text-center">
            Tab to close • 1-2 for quick switch
          </div>
        </div>
      )}

      {/* Weapon Selection Menu */}
      {showWeaponSelect && (
        <div className="bg-black bg-opacity-80 text-white p-3 rounded-lg backdrop-blur-sm border border-red-400 border-opacity-40">
          <div className="flex items-center gap-2 mb-2">
            <Sword className="w-4 h-4" />
            <h3 className="font-bold text-sm">Select Weapon</h3>
          </div>
          
          <div className="space-y-1">
            {availableWeapons.map((weapon, index) => (
              <button
                key={weapon.id}
                onClick={() => handleWeaponSelect(weapon.id)}
                className={`w-full p-2 rounded border transition-all text-left text-xs ${
                  equippedWeapon?.id === weapon.id
                    ? 'border-red-400 bg-red-900 bg-opacity-50'
                    : 'border-gray-600 hover:border-gray-400 hover:bg-gray-800 bg-opacity-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{weapon.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{weapon.name}</div>
                    <div className="text-red-400">
                      Dmg: {weapon.damage} • Range: {weapon.range}m
                    </div>
                  </div>
                  <div className="text-gray-400">[{index + 3}]</div>
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-2 text-xs text-gray-400 text-center">
            Q to close • 3-4 for quick switch
          </div>
        </div>
      )}

      {/* No Equipment Warning */}
      {!equippedTool && !equippedWeapon && (
        <div className="bg-red-900 bg-opacity-60 text-white p-2 rounded backdrop-blur-sm border border-red-500">
          <div className="flex items-center gap-2 text-xs">
            <Wrench className="w-4 h-4" />
            <span>No equipment • Press Tab/Q to equip</span>
          </div>
        </div>
      )}

      {/* Quick Help */}
      <div className="bg-black bg-opacity-30 text-white p-2 rounded backdrop-blur-sm text-xs">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div><kbd className="bg-gray-700 px-1 rounded">LClick</kbd> Use tool</div>
          <div><kbd className="bg-gray-700 px-1 rounded">RClick</kbd> Attack</div>
          <div><kbd className="bg-gray-700 px-1 rounded">Tab</kbd> Tool menu</div>
          <div><kbd className="bg-gray-700 px-1 rounded">Q</kbd> Weapon menu</div>
        </div>
      </div>
    </div>
  );
};
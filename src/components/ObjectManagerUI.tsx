import React, { useState, useEffect } from 'react';
import { 
  Box, 
  X, 
  Edit, 
  Eye, 
  EyeOff, 
  Trash2, 
  Plus, 
  List, 
  Filter, 
  Search, 
  Copy,
  Save,
  Undo,
  AlertCircle,
  Code as CodeIcon,
  RotateCcw,
  Sparkles,
  Database
} from 'lucide-react';
import { ObjectDefinitionSystem } from '../services/ObjectDefinitionSystem';
import { CustomObjectGenerator } from '../services/CustomObjectGenerator';
import { CustomEnemy } from '../types/CustomEnemyTypes';
import { CustomItem } from '../types/CustomItemTypes';
import { CustomWeapon } from '../types/CustomItemTypes';
import { CustomTool } from '../types/CustomItemTypes';
import { CustomVegetation } from '../types/CustomVegetationTypes';
import { CustomStructure } from '../types/CustomStructureTypes';

interface ObjectManagerUIProps {
  isVisible: boolean;
  onClose: () => void;
  objectDefinitionSystem: ObjectDefinitionSystem | null;
  customObjectGenerator: CustomObjectGenerator | null;
  onApplyChanges: (changes: any) => void;
}

type ObjectCategory = 'enemy' | 'item' | 'weapon' | 'tool' | 'vegetation' | 'structure';

export const ObjectManagerUI: React.FC<ObjectManagerUIProps> = ({
  isVisible,
  onClose,
  objectDefinitionSystem,
  customObjectGenerator,
  onApplyChanges
}) => {
  const [activeTab, setActiveTab] = useState<ObjectCategory>('enemy');
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [objectList, setObjectList] = useState<any[]>([]);
  const [selectedObject, setSelectedObject] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedObject, setEditedObject] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');

  // Load objects when tab changes or object system updates
  useEffect(() => {
    loadObjects(activeTab);
  }, [activeTab, objectDefinitionSystem]);

  const loadObjects = (category: ObjectCategory) => {
    if (!objectDefinitionSystem) {
      setObjectList([]);
      setError("Object system not available");
      return;
    }

    try {
      const objectMap = objectDefinitionSystem.getObjectsByCategory(category);
      const objects = Array.from(objectMap.values());
      setObjectList(objects);
      setError(null);
    } catch (err) {
      console.error("Error loading objects:", err);
      setObjectList([]);
      setError(`Failed to load ${category} objects`);
    }
  };

  const handleSelectObject = (id: string) => {
    setSelectedObjectId(id);
    const obj = objectList.find(o => o.id === id);
    setSelectedObject(obj);
    setEditedObject(obj ? JSON.parse(JSON.stringify(obj)) : null);
    setIsEditing(false);
    setError(null);
  };

  const handleStartEdit = () => {
    if (selectedObject) {
      setEditedObject(JSON.parse(JSON.stringify(selectedObject)));
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedObject(selectedObject ? JSON.parse(JSON.stringify(selectedObject)) : null);
  };

  const handleSaveChanges = () => {
    if (!editedObject) return;
    
    try {
      // Here you would implement the actual save functionality
      // For now we'll just update our local state and simulate a successful save
      
      // In a real implementation, you would update the object in the objectDefinitionSystem
      // objectDefinitionSystem.updateObject(activeTab, editedObject);
      
      setSelectedObject(editedObject);
      const updatedList = objectList.map(obj => 
        obj.id === editedObject.id ? editedObject : obj
      );
      setObjectList(updatedList);
      setIsEditing(false);
      setSuccess("Changes saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
      
      // Notify parent component of changes
      onApplyChanges({ category: activeTab, action: 'update', object: editedObject });
    } catch (err) {
      console.error("Error saving changes:", err);
      setError(`Failed to save changes: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleInputChange = (path: string, value: any) => {
    if (!editedObject) return;

    const keys = path.split('.');
    const newObj = { ...editedObject };
    let current = newObj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setEditedObject(newObj);
  };

  const getDisplayProperties = (category: ObjectCategory): {label: string, path: string, type: 'text' | 'number' | 'color' | 'select' | 'boolean' | 'textarea', options?: string[]}[] => {
    switch (category) {
      case 'enemy':
        return [
          { label: 'Name', path: 'name', type: 'text' },
          { label: 'Type', path: 'type', type: 'text' },
          { label: 'Health', path: 'stats.health', type: 'number' },
          { label: 'Damage', path: 'stats.damage', type: 'number' },
          { label: 'Speed', path: 'stats.speed', type: 'number' },
          { label: 'Experience', path: 'stats.experienceValue', type: 'number' },
          { label: 'Description', path: 'description', type: 'textarea' },
          { label: 'Is Aggressive', path: 'behavior.isAggressive', type: 'boolean' },
          { label: 'Primary Color', path: 'appearance.primaryColor', type: 'color' }
        ];
      case 'item':
        return [
          { label: 'Name', path: 'name', type: 'text' },
          { label: 'Type', path: 'type', type: 'select', options: ['resource', 'consumable', 'quest', 'currency', 'armor', 'crafting'] },
          { label: 'Value', path: 'properties.value', type: 'number' },
          { label: 'Weight', path: 'properties.weight', type: 'number' },
          { label: 'Rarity', path: 'properties.rarity', type: 'select', options: ['common', 'uncommon', 'rare', 'epic', 'legendary'] },
          { label: 'Stackable', path: 'properties.stackable', type: 'boolean' },
          { label: 'Max Stack', path: 'properties.maxStack', type: 'number' },
          { label: 'Description', path: 'description', type: 'textarea' },
          { label: 'Icon', path: 'appearance.icon', type: 'text' },
          { label: 'Color', path: 'appearance.primaryColor', type: 'color' }
        ];
      case 'weapon':
        return [
          { label: 'Name', path: 'name', type: 'text' },
          { label: 'Weapon Type', path: 'weaponType', type: 'select', options: ['sword', 'axe', 'hammer', 'dagger', 'spear', 'bow', 'staff', 'wand'] },
          { label: 'Damage', path: 'combatStats.damage', type: 'number' },
          { label: 'Critical Chance', path: 'combatStats.criticalChance', type: 'number' },
          { label: 'Range', path: 'combatStats.range', type: 'number' },
          { label: 'Speed', path: 'combatStats.speed', type: 'number' },
          { label: 'Durability', path: 'combatStats.durability', type: 'number' },
          { label: 'Description', path: 'description', type: 'textarea' },
          { label: 'Icon', path: 'appearance.icon', type: 'text' },
          { label: 'Color', path: 'appearance.primaryColor', type: 'color' }
        ];
      case 'tool':
        return [
          { label: 'Name', path: 'name', type: 'text' },
          { label: 'Tool Type', path: 'toolType', type: 'select', options: ['axe', 'pickaxe', 'shovel', 'hoe', 'fishing_rod'] },
          { label: 'Efficiency', path: 'toolStats.efficiency', type: 'number' },
          { label: 'Durability', path: 'toolStats.durability', type: 'number' },
          { label: 'Harvest Level', path: 'toolStats.harvestLevel', type: 'number' },
          { label: 'Description', path: 'description', type: 'textarea' },
          { label: 'Icon', path: 'appearance.icon', type: 'text' },
          { label: 'Color', path: 'appearance.primaryColor', type: 'color' }
        ];
      case 'vegetation':
        return [
          { label: 'Name', path: 'name', type: 'text' },
          { label: 'Type', path: 'type', type: 'select', options: ['tree', 'bush', 'flower', 'plant', 'mushroom', 'grass', 'vine', 'log'] },
          { label: 'Height', path: 'appearance.height', type: 'number' },
          { label: 'Has Fruits', path: 'appearance.hasFruits', type: 'boolean' },
          { label: 'Has Flowers', path: 'appearance.hasFlowers', type: 'boolean' },
          { label: 'Trunk Color', path: 'appearance.trunkColor', type: 'color' },
          { label: 'Leaf Color', path: 'appearance.leafColor', type: 'color' },
          { label: 'Harvestable', path: 'interaction.harvestable', type: 'boolean' },
          { label: 'Health', path: 'properties.health', type: 'number' },
          { label: 'Description', path: 'description', type: 'textarea' }
        ];
      case 'structure':
        return [
          { label: 'Name', path: 'name', type: 'text' },
          { label: 'Type', path: 'type', type: 'select', options: ['building', 'ruin', 'monument', 'bridge', 'cave', 'wall', 'well', 'statue', 'altar'] },
          { label: 'Material Type', path: 'appearance.materialType', type: 'select', options: ['stone', 'wood', 'metal', 'crystal', 'bone', 'plant', 'ice'] },
          { label: 'Style', path: 'appearance.style', type: 'select', options: ['ancient', 'modern', 'magical', 'natural', 'corrupted', 'divine', 'technological', 'rustic'] },
          { label: 'Height', path: 'appearance.height', type: 'number' },
          { label: 'Width', path: 'appearance.width', type: 'number' },
          { label: 'Length', path: 'appearance.length', type: 'number' },
          { label: 'Is Ruined', path: 'appearance.isRuined', type: 'boolean' },
          { label: 'Can Enter', path: 'interaction.canEnter', type: 'boolean' },
          { label: 'Can Loot', path: 'interaction.canLoot', type: 'boolean' },
          { label: 'Description', path: 'description', type: 'textarea' }
        ];
      default:
        return [];
    }
  };

  const getNestedValue = (obj: any, path: string): any => {
    if (!obj) return null;
    const keys = path.split('.');
    let value = obj;
    
    for (const key of keys) {
      if (value === undefined || value === null) return null;
      value = value[key];
    }
    
    return value;
  };

  const renderFormFields = () => {
    if (!editedObject) return null;
    
    const properties = getDisplayProperties(activeTab);
    
    return (
      <div className="space-y-4 mt-4">
        {properties.map((prop) => (
          <div key={prop.path} className="space-y-1">
            <label className="block text-sm font-medium text-gray-300">{prop.label}</label>
            {prop.type === 'text' && (
              <input
                type="text"
                value={getNestedValue(editedObject, prop.path) || ''}
                onChange={(e) => handleInputChange(prop.path, e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
            {prop.type === 'number' && (
              <input
                type="number"
                value={getNestedValue(editedObject, prop.path) || 0}
                onChange={(e) => handleInputChange(prop.path, Number(e.target.value))}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
            {prop.type === 'color' && (
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={getNestedValue(editedObject, prop.path) || '#FFFFFF'}
                  onChange={(e) => handleInputChange(prop.path, e.target.value)}
                  className="p-0 h-8 w-12 bg-transparent border-none rounded-md"
                />
                <input
                  type="text"
                  value={getNestedValue(editedObject, prop.path) || '#FFFFFF'}
                  onChange={(e) => handleInputChange(prop.path, e.target.value)}
                  className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
            {prop.type === 'select' && (
              <select
                value={getNestedValue(editedObject, prop.path) || ''}
                onChange={(e) => handleInputChange(prop.path, e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select...</option>
                {prop.options?.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            )}
            {prop.type === 'boolean' && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={!!getNestedValue(editedObject, prop.path)}
                  onChange={(e) => handleInputChange(prop.path, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-400">
                  {!!getNestedValue(editedObject, prop.path) ? 'Yes' : 'No'}
                </span>
              </div>
            )}
            {prop.type === 'textarea' && (
              <textarea
                value={getNestedValue(editedObject, prop.path) || ''}
                onChange={(e) => handleInputChange(prop.path, e.target.value)}
                rows={3}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderJSON = () => {
    if (!editedObject && !selectedObject) return null;
    
    const jsonValue = JSON.stringify(isEditing ? editedObject : selectedObject, null, 2);
    
    return (
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-300">JSON Data</label>
          {isEditing ? (
            <div className="text-xs text-yellow-500">
              <AlertCircle className="w-3 h-3 inline mr-1" />
              Editing JSON directly is for advanced users
            </div>
          ) : (
            <button
              onClick={() => {
                navigator.clipboard.writeText(jsonValue);
                setSuccess("JSON copied to clipboard");
                setTimeout(() => setSuccess(null), 2000);
              }}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Copy className="w-3 h-3 inline mr-1" />
              Copy
            </button>
          )}
        </div>
        
        {isEditing ? (
          <textarea
            value={jsonValue}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setEditedObject(parsed);
                setError(null);
              } catch (err) {
                setError("Invalid JSON: " + (err instanceof Error ? err.message : String(err)));
              }
            }}
            rows={20}
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-sm font-mono text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        ) : (
          <pre className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-sm font-mono text-white max-h-96 overflow-y-auto">
            {jsonValue}
          </pre>
        )}
      </div>
    );
  };

  const renderObjectList = () => {
    const filteredObjects = objectList.filter(obj => {
      if (!searchTerm) return true;
      return obj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             obj.id.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
      <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
        {filteredObjects.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            {objectList.length === 0 
              ? `No ${activeTab} objects available` 
              : `No results matching "${searchTerm}"`}
          </div>
        ) : (
          filteredObjects.map((obj) => (
            <button
              key={obj.id}
              onClick={() => handleSelectObject(obj.id)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                selectedObjectId === obj.id 
                  ? 'bg-blue-700 text-white' 
                  : 'bg-gray-800 hover:bg-gray-750 text-gray-300 hover:text-white'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{obj.name || obj.id}</div>
                  <div className="text-xs text-gray-400 truncate">{obj.id}</div>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    );
  };

  const getCategoryColor = (category: ObjectCategory): string => {
    switch(category) {
      case 'enemy': return 'border-red-600';
      case 'item': return 'border-green-600';
      case 'weapon': return 'border-yellow-600';
      case 'tool': return 'border-blue-600';
      case 'vegetation': return 'border-emerald-600';
      case 'structure': return 'border-indigo-600';
      default: return 'border-gray-600';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl border border-gray-700 flex flex-col w-full max-w-6xl max-h-[90vh]">
        {/* Header */}
        <div className="bg-gray-800 p-4 rounded-t-xl border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-700 rounded-lg">
              <Box className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Custom Object Manager</h2>
              <p className="text-sm text-gray-400">View and manage objects for your game world</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Object Categories */}
          <div className="w-48 bg-gray-800 border-r border-gray-700 p-4">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Categories</h3>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab('enemy')}
                className={`w-full text-left p-2 rounded-lg flex items-center gap-2 ${
                  activeTab === 'enemy' ? 'bg-red-900 bg-opacity-50 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span>Enemies</span>
              </button>
              <button
                onClick={() => setActiveTab('item')}
                className={`w-full text-left p-2 rounded-lg flex items-center gap-2 ${
                  activeTab === 'item' ? 'bg-green-900 bg-opacity-50 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Items</span>
              </button>
              <button
                onClick={() => setActiveTab('weapon')}
                className={`w-full text-left p-2 rounded-lg flex items-center gap-2 ${
                  activeTab === 'weapon' ? 'bg-yellow-900 bg-opacity-50 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span>Weapons</span>
              </button>
              <button
                onClick={() => setActiveTab('tool')}
                className={`w-full text-left p-2 rounded-lg flex items-center gap-2 ${
                  activeTab === 'tool' ? 'bg-blue-900 bg-opacity-50 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>Tools</span>
              </button>
              <button
                onClick={() => setActiveTab('vegetation')}
                className={`w-full text-left p-2 rounded-lg flex items-center gap-2 ${
                  activeTab === 'vegetation' ? 'bg-emerald-900 bg-opacity-50 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span>Vegetation</span>
              </button>
              <button
                onClick={() => setActiveTab('structure')}
                className={`w-full text-left p-2 rounded-lg flex items-center gap-2 ${
                  activeTab === 'structure' ? 'bg-indigo-900 bg-opacity-50 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <span>Structures</span>
              </button>
            </div>
          </div>

          {/* Middle Column - Object List */}
          <div className="w-1/3 p-4 border-r border-gray-700 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search objects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full py-2 pl-9 pr-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button className="p-2 bg-gray-800 text-gray-400 hover:text-white border border-gray-600 rounded-lg transition-colors">
                  <Filter className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white flex items-center">
                  <List className="w-4 h-4 mr-1" />
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Objects
                </h3>
                <div className="text-xs text-gray-400">
                  {objectList.length} objects
                </div>
              </div>

              {renderObjectList()}
            </div>
          </div>

          {/* Right Column - Object Details */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-850">
            {selectedObject ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      activeTab === 'enemy' ? 'bg-red-900' :
                      activeTab === 'item' ? 'bg-green-900' :
                      activeTab === 'weapon' ? 'bg-yellow-900' :
                      activeTab === 'tool' ? 'bg-blue-900' :
                      activeTab === 'vegetation' ? 'bg-emerald-900' :
                      activeTab === 'structure' ? 'bg-indigo-900' : 'bg-gray-700'
                    }`}>
                      <Box className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{selectedObject.name || selectedObject.id}</h3>
                      <p className="text-sm text-gray-400">{selectedObject.id}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleSaveChanges}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <Undo className="w-4 h-4" />
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleStartEdit}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                    )}
                  </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex bg-gray-800 rounded-lg p-1 w-fit">
                  <button
                    onClick={() => setViewMode('visual')}
                    className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1 ${
                      viewMode === 'visual' 
                        ? 'bg-gray-700 text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    Visual Editor
                  </button>
                  <button
                    onClick={() => setViewMode('json')}
                    className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1 ${
                      viewMode === 'json' 
                        ? 'bg-gray-700 text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <CodeIcon className="w-4 h-4" />
                    JSON View
                  </button>
                </div>

                {/* Status Messages */}
                {error && (
                  <div className="bg-red-900 bg-opacity-30 border border-red-600 text-red-300 px-3 py-2 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                {success && (
                  <div className="bg-green-900 bg-opacity-30 border border-green-600 text-green-300 px-3 py-2 rounded-lg flex items-center gap-2">
                    <Sparkles className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{success}</span>
                  </div>
                )}

                {/* Object Details */}
                <div className={`bg-gray-800 rounded-lg border ${getCategoryColor(activeTab)}`}>
                  {viewMode === 'visual' ? (
                    <div className="p-4">
                      {isEditing ? renderFormFields() : (
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-400 mb-2">Basic Information</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-xs text-gray-400">ID</div>
                                <div className="text-white">{selectedObject.id}</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-400">Name</div>
                                <div className="text-white">{selectedObject.name}</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-400">Type</div>
                                <div className="text-white capitalize">{selectedObject.type}</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-400">Scenario</div>
                                <div className="text-white">{selectedObject.scenario}</div>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-400 mb-2">Description</h4>
                            <p className="text-white bg-gray-700 p-3 rounded-lg">
                              {selectedObject.description || "No description available."}
                            </p>
                          </div>

                          {/* Category-specific properties */}
                          {activeTab === 'enemy' && selectedObject.stats && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-2">Stats</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="text-xs text-gray-400">Health</div>
                                  <div className="text-white">{selectedObject.stats.health}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-400">Damage</div>
                                  <div className="text-white">{selectedObject.stats.damage}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-400">Speed</div>
                                  <div className="text-white">{selectedObject.stats.speed}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-400">Experience</div>
                                  <div className="text-white">{selectedObject.stats.experienceValue}</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeTab === 'item' && selectedObject.properties && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-2">Properties</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="text-xs text-gray-400">Value</div>
                                  <div className="text-white">{selectedObject.properties.value}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-400">Rarity</div>
                                  <div className="text-white capitalize">{selectedObject.properties.rarity}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-400">Stackable</div>
                                  <div className="text-white">{selectedObject.properties.stackable ? 'Yes' : 'No'}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-400">Max Stack</div>
                                  <div className="text-white">{selectedObject.properties.maxStack}</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Appearance Preview */}
                          {selectedObject.appearance && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-2">Appearance</h4>
                              <div className="bg-gray-700 p-3 rounded-lg flex items-center gap-3">
                                {selectedObject.appearance.icon && (
                                  <div className="text-3xl">{selectedObject.appearance.icon}</div>
                                )}
                                {selectedObject.appearance.primaryColor && (
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-6 h-6 rounded-full border border-gray-500" 
                                      style={{backgroundColor: selectedObject.appearance.primaryColor}}
                                    />
                                    <span className="text-white text-sm">{selectedObject.appearance.primaryColor}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    renderJSON()
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Database className="w-12 h-12 text-gray-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-400">Select an object to view details</h3>
                <p className="text-sm text-gray-500 max-w-md mt-2">
                  Choose an object from the list to view its properties and make changes.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-800 p-4 rounded-b-xl border-t border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            <Database className="w-4 h-4 inline mr-1" />
            {objectList.length} objects available in this category
          </div>
          {isEditing ? (
            <div className="text-sm text-yellow-400">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              You have unsaved changes
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {}}
                disabled={true} // Currently disabled since this would require integration with object creation
                className="px-3 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-1 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Object
              </button>
              <button
                onClick={() => {}}
                disabled={!selectedObject || isEditing} // Disabled when editing or no selection
                className="px-3 py-2 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
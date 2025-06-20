import React, { useState, useEffect } from 'react';
import { 
  Package, X, Edit, Save, Plus, Trash2, ChevronRight, ChevronDown, 
  LayoutList, Sword, Axe, Scroll, Mountain, Eye, Download, Upload, Info,
  Tree, Building, PanelLeft, Brush, RotateCw, Search
} from 'lucide-react';

// Import all object types
import { CustomizableObject } from '../types/BaseObjectTypes';
import { CustomEnemy } from '../types/CustomEnemyTypes';
import { CustomItem, CustomWeapon, CustomTool } from '../types/CustomItemTypes';
import { CustomStructure } from '../types/CustomStructureTypes';
import { CustomVegetation } from '../types/CustomVegetationTypes';

interface ObjectManagerUIProps {
  isVisible: boolean;
  onClose: () => void;
  objectDefinitionSystem?: any;
  customObjectGenerator?: any;
  onApplyChanges?: (objects: any) => void;
}

type ObjectCategory = 'enemy' | 'item' | 'weapon' | 'tool' | 'vegetation' | 'structure';

export const ObjectManagerUI: React.FC<ObjectManagerUIProps> = ({
  isVisible,
  onClose,
  objectDefinitionSystem,
  customObjectGenerator,
  onApplyChanges
}) => {
  const [activeCategory, setActiveCategory] = useState<ObjectCategory>('enemy');
  const [objects, setObjects] = useState<Map<string, CustomizableObject>>(new Map());
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [editingObject, setEditingObject] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [scenarioList, setScenarioList] = useState<string[]>([]);
  const [activeScenario, setActiveScenario] = useState<string>('all');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    appearance: true,
    properties: true,
    stats: true,
    behavior: true,
    abilities: false,
    drops: false,
    effects: false
  });

  // Load objects when component mounts or category changes
  useEffect(() => {
    if (!isVisible || !objectDefinitionSystem) return;
    
    loadObjectsByCategory(activeCategory);
    
    // Load available scenarios
    const scenarios = new Set<string>();
    objectDefinitionSystem.objectSets.forEach((_, scenarioId: string) => {
      scenarios.add(scenarioId);
    });
    setScenarioList(Array.from(scenarios));
    
  }, [isVisible, activeCategory, objectDefinitionSystem]);

  const loadObjectsByCategory = (category: ObjectCategory) => {
    if (!objectDefinitionSystem) return;
    
    let objectMap;
    
    if (activeScenario === 'all') {
      // Load all objects of this category
      objectMap = objectDefinitionSystem.getObjectsByCategory(category);
    } else {
      // Load only objects from the selected scenario
      const objectsForScenario = objectDefinitionSystem.getObjectsByTypeAndScenario(category, activeScenario);
      objectMap = new Map();
      objectsForScenario.forEach((obj: CustomizableObject) => {
        objectMap.set(obj.id, obj);
      });
    }
    
    setObjects(objectMap);
    
    // Clear selection if needed
    if (selectedObjectId && !objectMap.has(selectedObjectId)) {
      setSelectedObjectId(null);
      setEditingObject(null);
      setIsEditing(false);
    }
  };
  
  const handleObjectSelect = (objectId: string) => {
    setSelectedObjectId(objectId);
    const object = objects.get(objectId);
    if (object) {
      setEditingObject({...object});
      setIsEditing(false);
    }
  };
  
  const handleEditStart = () => {
    setIsEditing(true);
  };
  
  const handleEditCancel = () => {
    const object = objects.get(selectedObjectId!);
    if (object) {
      setEditingObject({...object});
    }
    setIsEditing(false);
  };
  
  const handleEditSave = () => {
    if (!editingObject || !selectedObjectId) return;
    
    // Update object in the system
    // This would need to integrate with your object systems
    if (onApplyChanges) {
      onApplyChanges({
        category: activeCategory,
        id: selectedObjectId,
        data: editingObject
      });
    }
    
    // Update local state
    const updatedObjects = new Map(objects);
    updatedObjects.set(selectedObjectId, editingObject);
    setObjects(updatedObjects);
    setIsEditing(false);
    
    // Show success message
    alert(`${editingObject.name} updated successfully`);
  };
  
  const handleInputChange = (path: string, value: any) => {
    if (!editingObject) return;
    
    // Handle nested properties using path notation (e.g., "appearance.primaryColor")
    const updateNestedProperty = (obj: any, path: string, value: any) => {
      const keys = path.split('.');
      const lastKey = keys.pop();
      const target = keys.reduce((obj, key) => {
        if (!obj[key]) obj[key] = {};
        return obj[key];
      }, obj);
      
      if (lastKey) {
        target[lastKey] = value;
      }
    };
    
    const updatedObject = {...editingObject};
    updateNestedProperty(updatedObject, path, value);
    setEditingObject(updatedObject);
  };
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const exportObjects = () => {
    if (selectedObjectId) {
      // Export single object
      const object = objects.get(selectedObjectId);
      if (object) {
        downloadObjectAsJson(object, `${object.id}.json`);
      }
    } else {
      // Export all objects in category
      const objectsArray = Array.from(objects.values());
      downloadObjectAsJson(objectsArray, `${activeCategory}_objects.json`);
    }
  };
  
  const downloadObjectAsJson = (objectData: any, filename: string) => {
    const dataStr = JSON.stringify(objectData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Filter objects by search term
  const filteredObjects = Array.from(objects.values()).filter(obj => 
    obj.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    obj.id.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getCategoryIcon = (category: ObjectCategory) => {
    switch (category) {
      case 'enemy': return <Sword />;
      case 'item': return <Package />;
      case 'weapon': return <Sword />;
      case 'tool': return <Axe />;
      case 'vegetation': return <Tree />;
      case 'structure': return <Building />;
      default: return <Package />;
    }
  };
  
  const getObjectTypeColor = (type: string, category: ObjectCategory): string => {
    // Colors for different object types
    const typeColors: Record<string, string> = {
      // Enemies
      goblin: 'bg-green-700',
      orc: 'bg-red-800',
      skeleton: 'bg-gray-300 text-gray-800',
      wolf: 'bg-gray-700',
      spider: 'bg-purple-900',
      troll: 'bg-lime-800',
      // Vegetation
      tree: 'bg-green-800',
      bush: 'bg-emerald-700',
      plant: 'bg-teal-700',
      flower: 'bg-pink-700',
      // Structures
      building: 'bg-amber-800',
      ruin: 'bg-stone-700',
      monument: 'bg-blue-900',
      // Items
      resource: 'bg-sky-800',
      consumable: 'bg-orange-700',
      quest: 'bg-yellow-600',
      // Weapons
      sword: 'bg-red-700',
      bow: 'bg-indigo-700',
      staff: 'bg-purple-700',
      // Tools
      axe: 'bg-orange-800',
      pickaxe: 'bg-gray-600',
      shovel: 'bg-amber-700',
    };
    
    // Default colors by category
    const categoryColors: Record<ObjectCategory, string> = {
      enemy: 'bg-red-700',
      item: 'bg-blue-700',
      weapon: 'bg-violet-700',
      tool: 'bg-yellow-700',
      vegetation: 'bg-green-700',
      structure: 'bg-stone-700'
    };
    
    return typeColors[type] || categoryColors[category] || 'bg-gray-700';
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 rounded-t-lg flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold">Object Manager</h2>
              <p className="text-sm text-gray-400">View and modify game objects</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Categories */}
          <div className="w-48 bg-gray-800 border-r border-gray-700 flex flex-col">
            <div className="p-3 border-b border-gray-700">
              <h3 className="text-sm font-medium text-gray-300">Object Categories</h3>
            </div>
            <div className="flex-1 overflow-auto">
              {(['enemy', 'item', 'weapon', 'tool', 'vegetation', 'structure'] as ObjectCategory[]).map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-2 transition-colors ${
                    activeCategory === category
                      ? 'bg-blue-900 text-white'
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {getCategoryIcon(category)}
                  <span className="capitalize">{category}</span>
                </button>
              ))}
            </div>
            
            {/* Scenario Filter */}
            <div className="p-3 border-t border-gray-700">
              <h3 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-1">
                <Scroll className="w-4 h-4" />
                Filter by Scenario
              </h3>
              <select
                value={activeScenario}
                onChange={(e) => {
                  setActiveScenario(e.target.value);
                  setSelectedObjectId(null);
                  setEditingObject(null);
                }}
                className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600"
              >
                <option value="all">All Scenarios</option>
                {scenarioList.map((scenario) => (
                  <option key={scenario} value={scenario}>{scenario}</option>
                ))}
              </select>
            </div>
            
            {/* Actions */}
            <div className="p-3 border-t border-gray-700 space-y-2">
              <button 
                onClick={exportObjects}
                className="w-full px-3 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-md text-sm flex items-center gap-1 justify-center"
              >
                <Download className="w-4 h-4" />
                Export Objects
              </button>
            </div>
          </div>
          
          {/* Middle Panel - Object List */}
          <div className="w-72 border-r border-gray-700 flex flex-col">
            <div className="p-3 border-b border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white capitalize">{activeCategory} Objects</h3>
                <span className="text-xs text-gray-400">{filteredObjects.length} items</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search objects..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-white pr-8"
                />
                <Search className="w-4 h-4 text-gray-400 absolute right-2 top-[9px]" />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {filteredObjects.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No objects found in this category
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {filteredObjects.map((obj) => (
                    <button
                      key={obj.id}
                      onClick={() => handleObjectSelect(obj.id)}
                      className={`w-full text-left p-3 ${
                        selectedObjectId === obj.id
                          ? 'bg-blue-800 hover:bg-blue-700'
                          : 'hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${
                          obj.scenario === activeScenario || activeScenario === 'all'
                            ? 'bg-green-500'
                            : 'bg-gray-500'
                        }`} />
                        <div>
                          <div className="font-medium text-white">{obj.name}</div>
                          <div className="text-xs text-gray-400">ID: {obj.id}</div>
                          <div className="flex items-center gap-1 mt-1">
                            <span className={`px-1.5 py-0.5 text-xs rounded-sm ${getObjectTypeColor(
                              'type' in obj ? obj.type : activeCategory, 
                              activeCategory
                            )}`}>
                              {'type' in obj ? obj.type : activeCategory}
                            </span>
                            <span className="text-xs text-gray-500">{obj.scenario}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Right Panel - Object Details */}
          <div className="flex-1 flex flex-col">
            {selectedObjectId && editingObject ? (
              <>
                <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{editingObject.name}</h3>
                    <p className="text-sm text-gray-400">
                      {editingObject.id} • {activeCategory}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleEditCancel}
                          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleEditSave}
                          className="px-3 py-1 bg-green-700 hover:bg-green-600 text-white rounded-md text-sm flex items-center gap-1"
                        >
                          <Save className="w-4 h-4" />
                          Save Changes
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleEditStart}
                        className="px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded-md text-sm flex items-center gap-1"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          value={editingObject.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white disabled:opacity-70"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Description
                        </label>
                        <textarea
                          value={editingObject.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          disabled={!isEditing}
                          rows={2}
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white disabled:opacity-70 resize-none"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            ID
                          </label>
                          <input
                            type="text"
                            value={editingObject.id}
                            disabled={true}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white opacity-70"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Scenario
                          </label>
                          <input
                            type="text"
                            value={editingObject.scenario}
                            onChange={(e) => handleInputChange('scenario', e.target.value)}
                            disabled={!isEditing}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white disabled:opacity-70"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Appearance Section */}
                    {editingObject.appearance && (
                      <div className="border border-gray-700 rounded-lg overflow-hidden">
                        <div 
                          className="bg-gray-800 p-3 flex justify-between items-center cursor-pointer"
                          onClick={() => toggleSection('appearance')}
                        >
                          <h3 className="font-medium text-white flex items-center gap-2">
                            <Brush className="w-4 h-4 text-blue-400" />
                            Appearance
                          </h3>
                          {expandedSections.appearance ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        
                        {expandedSections.appearance && (
                          <div className="p-4 space-y-4 bg-gray-850">
                            <div className="grid grid-cols-2 gap-4">
                              {editingObject.appearance.primaryColor && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Primary Color
                                  </label>
                                  <div className="flex gap-2">
                                    <input
                                      type="color"
                                      value={editingObject.appearance.primaryColor}
                                      onChange={(e) => handleInputChange('appearance.primaryColor', e.target.value)}
                                      disabled={!isEditing}
                                      className="h-9 w-9 rounded border border-gray-600"
                                    />
                                    <input
                                      type="text"
                                      value={editingObject.appearance.primaryColor}
                                      onChange={(e) => handleInputChange('appearance.primaryColor', e.target.value)}
                                      disabled={!isEditing}
                                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white disabled:opacity-70"
                                    />
                                  </div>
                                </div>
                              )}
                              
                              {editingObject.appearance.secondaryColor && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Secondary Color
                                  </label>
                                  <div className="flex gap-2">
                                    <input
                                      type="color"
                                      value={editingObject.appearance.secondaryColor}
                                      onChange={(e) => handleInputChange('appearance.secondaryColor', e.target.value)}
                                      disabled={!isEditing}
                                      className="h-9 w-9 rounded border border-gray-600"
                                    />
                                    <input
                                      type="text"
                                      value={editingObject.appearance.secondaryColor}
                                      onChange={(e) => handleInputChange('appearance.secondaryColor', e.target.value)}
                                      disabled={!isEditing}
                                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white disabled:opacity-70"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {editingObject.appearance.icon && (
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Icon
                                </label>
                                <div className="flex items-center gap-2">
                                  <div className="w-9 h-9 flex items-center justify-center bg-gray-700 rounded border border-gray-600 text-xl">
                                    {editingObject.appearance.icon}
                                  </div>
                                  <input
                                    type="text"
                                    value={editingObject.appearance.icon}
                                    onChange={(e) => handleInputChange('appearance.icon', e.target.value)}
                                    disabled={!isEditing}
                                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white disabled:opacity-70"
                                  />
                                </div>
                              </div>
                            )}
                            
                            {editingObject.appearance.scale && (
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Scale: {editingObject.appearance.scale}
                                </label>
                                <input
                                  type="range"
                                  min={0.5}
                                  max={2.0}
                                  step={0.1}
                                  value={editingObject.appearance.scale}
                                  onChange={(e) => handleInputChange('appearance.scale', parseFloat(e.target.value))}
                                  disabled={!isEditing}
                                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-70"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Stats Section for Enemies */}
                    {activeCategory === 'enemy' && editingObject.stats && (
                      <div className="border border-gray-700 rounded-lg overflow-hidden">
                        <div 
                          className="bg-gray-800 p-3 flex justify-between items-center cursor-pointer"
                          onClick={() => toggleSection('stats')}
                        >
                          <h3 className="font-medium text-white flex items-center gap-2">
                            <Sword className="w-4 h-4 text-red-400" />
                            Combat Stats
                          </h3>
                          {expandedSections.stats ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        
                        {expandedSections.stats && (
                          <div className="p-4 space-y-4 bg-gray-850">
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Health
                                </label>
                                <input
                                  type="number"
                                  value={editingObject.stats.health}
                                  onChange={(e) => handleInputChange('stats.health', parseInt(e.target.value))}
                                  disabled={!isEditing}
                                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white disabled:opacity-70"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Damage
                                </label>
                                <input
                                  type="number"
                                  value={editingObject.stats.damage}
                                  onChange={(e) => handleInputChange('stats.damage', parseInt(e.target.value))}
                                  disabled={!isEditing}
                                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white disabled:opacity-70"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Defense
                                </label>
                                <input
                                  type="number"
                                  value={editingObject.stats.defense}
                                  onChange={(e) => handleInputChange('stats.defense', parseInt(e.target.value))}
                                  disabled={!isEditing}
                                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white disabled:opacity-70"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Speed
                                </label>
                                <input
                                  type="number"
                                  value={editingObject.stats.speed}
                                  onChange={(e) => handleInputChange('stats.speed', parseFloat(e.target.value))}
                                  step={0.1}
                                  disabled={!isEditing}
                                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white disabled:opacity-70"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Attack Range
                                </label>
                                <input
                                  type="number"
                                  value={editingObject.stats.attackRange}
                                  onChange={(e) => handleInputChange('stats.attackRange', parseFloat(e.target.value))}
                                  step={0.1}
                                  disabled={!isEditing}
                                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white disabled:opacity-70"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Attack Speed
                                </label>
                                <input
                                  type="number"
                                  value={editingObject.stats.attackSpeed}
                                  onChange={(e) => handleInputChange('stats.attackSpeed', parseFloat(e.target.value))}
                                  step={0.1}
                                  disabled={!isEditing}
                                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white disabled:opacity-70"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Level
                                </label>
                                <input
                                  type="number"
                                  value={editingObject.stats.level}
                                  onChange={(e) => handleInputChange('stats.level', parseInt(e.target.value))}
                                  disabled={!isEditing}
                                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white disabled:opacity-70"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  XP Value
                                </label>
                                <input
                                  type="number"
                                  value={editingObject.stats.experienceValue}
                                  onChange={(e) => handleInputChange('stats.experienceValue', parseInt(e.target.value))}
                                  disabled={!isEditing}
                                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white disabled:opacity-70"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Detection Range
                                </label>
                                <input
                                  type="number"
                                  value={editingObject.stats.detectRange}
                                  onChange={(e) => handleInputChange('stats.detectRange', parseInt(e.target.value))}
                                  disabled={!isEditing}
                                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white disabled:opacity-70"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Behavior Section for Enemies */}
                    {activeCategory === 'enemy' && editingObject.behavior && (
                      <div className="border border-gray-700 rounded-lg overflow-hidden">
                        <div 
                          className="bg-gray-800 p-3 flex justify-between items-center cursor-pointer"
                          onClick={() => toggleSection('behavior')}
                        >
                          <h3 className="font-medium text-white flex items-center gap-2">
                            <Activity className="w-4 h-4 text-yellow-400" />
                            Behavior
                          </h3>
                          {expandedSections.behavior ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        
                        {expandedSections.behavior && (
                          <div className="p-4 space-y-4 bg-gray-850">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id="isAggressive"
                                  checked={editingObject.behavior.isAggressive}
                                  onChange={(e) => handleInputChange('behavior.isAggressive', e.target.checked)}
                                  disabled={!isEditing}
                                  className="mr-2 h-4 w-4"
                                />
                                <label htmlFor="isAggressive" className="text-gray-300 text-sm">
                                  Aggressive
                                </label>
                              </div>
                              
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id="isNocturnal"
                                  checked={editingObject.behavior.isNocturnal}
                                  onChange={(e) => handleInputChange('behavior.isNocturnal', e.target.checked)}
                                  disabled={!isEditing}
                                  className="mr-2 h-4 w-4"
                                />
                                <label htmlFor="isNocturnal" className="text-gray-300 text-sm">
                                  Nocturnal
                                </label>
                              </div>
                              
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id="isPack"
                                  checked={editingObject.behavior.isPack}
                                  onChange={(e) => handleInputChange('behavior.isPack', e.target.checked)}
                                  disabled={!isEditing}
                                  className="mr-2 h-4 w-4"
                                />
                                <label htmlFor="isPack" className="text-gray-300 text-sm">
                                  Pack Behavior
                                </label>
                              </div>
                              
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id="isTerritorial"
                                  checked={editingObject.behavior.isTerritorial}
                                  onChange={(e) => handleInputChange('behavior.isTerritorial', e.target.checked)}
                                  disabled={!isEditing}
                                  className="mr-2 h-4 w-4"
                                />
                                <label htmlFor="isTerritorial" className="text-gray-300 text-sm">
                                  Territorial
                                </label>
                              </div>
                            </div>
                            
                            {editingObject.behavior.patrolRadius !== undefined && (
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Patrol Radius: {editingObject.behavior.patrolRadius}m
                                </label>
                                <input
                                  type="range"
                                  min={5}
                                  max={30}
                                  step={1}
                                  value={editingObject.behavior.patrolRadius}
                                  onChange={(e) => handleInputChange('behavior.patrolRadius', parseInt(e.target.value))}
                                  disabled={!isEditing}
                                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-70"
                                />
                              </div>
                            )}
                            
                            {editingObject.behavior.fleeThreshold !== undefined && (
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Flee Threshold: {editingObject.behavior.fleeThreshold}% health
                                </label>
                                <input
                                  type="range"
                                  min={0}
                                  max={100}
                                  step={5}
                                  value={editingObject.behavior.fleeThreshold}
                                  onChange={(e) => handleInputChange('behavior.fleeThreshold', parseInt(e.target.value))}
                                  disabled={!isEditing}
                                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-70"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Properties Section for Items */}
                    {(activeCategory === 'item' || activeCategory === 'weapon' || activeCategory === 'tool') && 
                     editingObject.properties && (
                      <div className="border border-gray-700 rounded-lg overflow-hidden">
                        <div 
                          className="bg-gray-800 p-3 flex justify-between items-center cursor-pointer"
                          onClick={() => toggleSection('properties')}
                        >
                          <h3 className="font-medium text-white flex items-center gap-2">
                            <Package className="w-4 h-4 text-blue-400" />
                            Properties
                          </h3>
                          {expandedSections.properties ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        
                        {expandedSections.properties && (
                          <div className="p-4 space-y-4 bg-gray-850">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Value
                                </label>
                                <input
                                  type="number"
                                  value={editingObject.properties.value}
                                  onChange={(e) => handleInputChange('properties.value', parseInt(e.target.value))}
                                  disabled={!isEditing}
                                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white disabled:opacity-70"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Weight
                                </label>
                                <input
                                  type="number"
                                  value={editingObject.properties.weight}
                                  onChange={(e) => handleInputChange('properties.weight', parseFloat(e.target.value))}
                                  step={0.1}
                                  disabled={!isEditing}
                                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white disabled:opacity-70"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Rarity
                                </label>
                                <select
                                  value={editingObject.properties.rarity}
                                  onChange={(e) => handleInputChange('properties.rarity', e.target.value)}
                                  disabled={!isEditing}
                                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white disabled:opacity-70"
                                >
                                  <option value="common">Common</option>
                                  <option value="uncommon">Uncommon</option>
                                  <option value="rare">Rare</option>
                                  <option value="epic">Epic</option>
                                  <option value="legendary">Legendary</option>
                                </select>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Max Stack
                                </label>
                                <input
                                  type="number"
                                  value={editingObject.properties.maxStack}
                                  onChange={(e) => handleInputChange('properties.maxStack', parseInt(e.target.value))}
                                  disabled={!isEditing || !editingObject.properties.stackable}
                                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white disabled:opacity-70"
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id="stackable"
                                  checked={editingObject.properties.stackable}
                                  onChange={(e) => handleInputChange('properties.stackable', e.target.checked)}
                                  disabled={!isEditing}
                                  className="mr-2 h-4 w-4"
                                />
                                <label htmlFor="stackable" className="text-gray-300 text-sm">
                                  Stackable
                                </label>
                              </div>
                              
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id="consumable"
                                  checked={editingObject.properties.consumable}
                                  onChange={(e) => handleInputChange('properties.consumable', e.target.checked)}
                                  disabled={!isEditing}
                                  className="mr-2 h-4 w-4"
                                />
                                <label htmlFor="consumable" className="text-gray-300 text-sm">
                                  Consumable
                                </label>
                              </div>
                              
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id="questItem"
                                  checked={editingObject.properties.questItem}
                                  onChange={(e) => handleInputChange('properties.questItem', e.target.checked)}
                                  disabled={!isEditing}
                                  className="mr-2 h-4 w-4"
                                />
                                <label htmlFor="questItem" className="text-gray-300 text-sm">
                                  Quest Item
                                </label>
                              </div>
                              
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id="tradeable"
                                  checked={editingObject.properties.tradeable}
                                  onChange={(e) => handleInputChange('properties.tradeable', e.target.checked)}
                                  disabled={!isEditing}
                                  className="mr-2 h-4 w-4"
                                />
                                <label htmlFor="tradeable" className="text-gray-300 text-sm">
                                  Tradeable
                                </label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Tool Stats (only for tools) */}
                    {activeCategory === 'tool' && editingObject.toolStats && (
                      <div className="border border-gray-700 rounded-lg overflow-hidden">
                        <div 
                          className="bg-gray-800 p-3 flex justify-between items-center cursor-pointer"
                          onClick={() => toggleSection('toolStats')}
                        >
                          <h3 className="font-medium text-white flex items-center gap-2">
                            <Axe className="w-4 h-4 text-orange-400" />
                            Tool Stats
                          </h3>
                          {expandedSections.toolStats ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        
                        {expandedSections.toolStats && (
                          <div className="p-4 space-y-4 bg-gray-850">
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Efficiency
                                </label>
                                <input
                                  type="number"
                                  value={editingObject.toolStats.efficiency}
                                  onChange={(e) => handleInputChange('toolStats.efficiency', parseFloat(e.target.value))}
                                  step={0.1}
                                  min={0.1}
                                  max={5}
                                  disabled={!isEditing}
                                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white disabled:opacity-70"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Durability
                                </label>
                                <input
                                  type="number"
                                  value={editingObject.toolStats.durability}
                                  onChange={(e) => handleInputChange('toolStats.durability', parseInt(e.target.value))}
                                  disabled={!isEditing}
                                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white disabled:opacity-70"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Harvest Level
                                </label>
                                <input
                                  type="number"
                                  value={editingObject.toolStats.harvestLevel}
                                  onChange={(e) => handleInputChange('toolStats.harvestLevel', parseInt(e.target.value))}
                                  min={1}
                                  max={5}
                                  disabled={!isEditing}
                                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white disabled:opacity-70"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">
                                Effective Against
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {editingObject.effectiveAgainst && editingObject.effectiveAgainst.map((material: string, index: number) => (
                                  <span 
                                    key={index} 
                                    className="px-2 py-1 bg-blue-900 text-blue-200 rounded text-xs"
                                  >
                                    {material}
                                    {isEditing && (
                                      <button
                                        onClick={() => {
                                          const newArray = [...editingObject.effectiveAgainst];
                                          newArray.splice(index, 1);
                                          handleInputChange('effectiveAgainst', newArray);
                                        }}
                                        className="ml-2 text-blue-300 hover:text-blue-100"
                                      >
                                        ×
                                      </button>
                                    )}
                                  </span>
                                ))}
                                
                                {isEditing && (
                                  <button 
                                    className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs hover:bg-gray-600"
                                    onClick={() => {
                                      const material = prompt('Enter material name (e.g., wood, stone, ore):');
                                      if (material && material.trim()) {
                                        const newArray = [...(editingObject.effectiveAgainst || [])];
                                        newArray.push(material.trim());
                                        handleInputChange('effectiveAgainst', newArray);
                                      }
                                    }}
                                  >
                                    + Add
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Weapon Stats (only for weapons) */}
                    {activeCategory === 'weapon' && editingObject.combatStats && (
                      <div className="border border-gray-700 rounded-lg overflow-hidden">
                        <div 
                          className="bg-gray-800 p-3 flex justify-between items-center cursor-pointer"
                          onClick={() => toggleSection('combatStats')}
                        >
                          <h3 className="font-medium text-white flex items-center gap-2">
                            <Sword className="w-4 h-4 text-red-400" />
                            Combat Stats
                          </h3>
                          {expandedSections.combatStats ? (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        
                        {expandedSections.combatStats && (
                          <div className="p-4 space-y-4 bg-gray-850">
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Damage
                                </label>
                                <input
                                  type="number"
                                  value={editingObject.combatStats.damage}
                                  onChange={(e) => handleInputChange('combatStats.damage', parseInt(e.target.value))}
                                  disabled={!isEditing}
                                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white disabled:opacity-70"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Range (m)
                                </label>
                                <input
                                  type="number"
                                  value={editingObject.combatStats.range}
                                  onChange={(e) => handleInputChange('combatStats.range', parseFloat(e.target.value))}
                                  step={0.1}
                                  disabled={!isEditing}
                                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white disabled:opacity-70"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Speed
                                </label>
                                <input
                                  type="number"
                                  value={editingObject.combatStats.speed}
                                  onChange={(e) => handleInputChange('combatStats.speed', parseFloat(e.target.value))}
                                  step={0.1}
                                  disabled={!isEditing}
                                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white disabled:opacity-70"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Critical Chance
                                </label>
                                <input
                                  type="number"
                                  value={editingObject.combatStats.criticalChance * 100}
                                  onChange={(e) => handleInputChange('combatStats.criticalChance', parseFloat(e.target.value) / 100)}
                                  step={1}
                                  min={0}
                                  max={100}
                                  disabled={!isEditing}
                                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white disabled:opacity-70"
                                />
                                <span className="text-gray-400 text-xs ml-2">%</span>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Critical Multiplier
                                </label>
                                <input
                                  type="number"
                                  value={editingObject.combatStats.criticalMultiplier}
                                  onChange={(e) => handleInputChange('combatStats.criticalMultiplier', parseFloat(e.target.value))}
                                  step={0.1}
                                  min={1}
                                  max={5}
                                  disabled={!isEditing}
                                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white disabled:opacity-70"
                                />
                                <span className="text-gray-400 text-xs ml-2">×</span>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Durability
                                </label>
                                <input
                                  type="number"
                                  value={editingObject.combatStats.durability}
                                  onChange={(e) => handleInputChange('combatStats.durability', parseInt(e.target.value))}
                                  disabled={!isEditing}
                                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white disabled:opacity-70"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* JSON Editor for Advanced Editing */}
                    <div className="border border-gray-700 rounded-lg overflow-hidden mt-6">
                      <div 
                        className="bg-gray-800 p-3 flex justify-between items-center cursor-pointer"
                        onClick={() => toggleSection('json')}
                      >
                        <h3 className="font-medium text-white flex items-center gap-2">
                          <Code className="w-4 h-4 text-green-400" />
                          JSON Data
                        </h3>
                        {expandedSections.json ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      
                      {expandedSections.json && (
                        <div className="p-4 bg-gray-850">
                          <div className="text-xs text-gray-400 mb-2">
                            Advanced editor - Be careful when editing raw JSON
                          </div>
                          <textarea
                            value={JSON.stringify(editingObject, null, 2)}
                            onChange={(e) => {
                              try {
                                setEditingObject(JSON.parse(e.target.value));
                              } catch (error) {
                                // Don't update if invalid JSON
                                console.error('Invalid JSON', error);
                              }
                            }}
                            disabled={!isEditing}
                            rows={15}
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white font-mono text-sm disabled:opacity-70"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center text-gray-400">
                  <Eye className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <h3 className="text-xl font-medium text-gray-300">Select an Object</h3>
                  <p className="mt-2 text-sm max-w-md mx-auto">
                    Select an object from the list to view its details and properties
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-800 p-3 border-t border-gray-700 flex justify-between items-center">
          <div className="text-sm text-gray-400 flex items-center gap-2">
            <Info className="w-4 h-4" />
            <span>Changes will affect gameplay immediately</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
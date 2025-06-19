import React, { useState, useEffect } from 'react';
import { InventoryStack } from '../types/InventoryTypes';
import { InventorySystem } from '../services/InventorySystem';
import { Package, X, Star, Coins } from 'lucide-react';

interface InventoryUIProps {
  inventorySystem: InventorySystem;
  isVisible: boolean;
  onClose: () => void;
}

export const InventoryUI: React.FC<InventoryUIProps> = ({ 
  inventorySystem, 
  isVisible, 
  onClose 
}) => {
  const [inventory, setInventory] = useState<InventoryStack[]>([]);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  useEffect(() => {
    if (!isVisible) return;

    const unsubscribe = inventorySystem.subscribe((newInventory) => {
      setInventory(newInventory);
    });

    return unsubscribe;
  }, [inventorySystem, isVisible]);

  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'common': return 'border-gray-400 bg-gray-800';
      case 'uncommon': return 'border-green-400 bg-green-900';
      case 'rare': return 'border-blue-400 bg-blue-900';
      case 'epic': return 'border-purple-400 bg-purple-900';
      case 'legendary': return 'border-yellow-400 bg-yellow-900';
      default: return 'border-gray-400 bg-gray-800';
    }
  };

  const getRarityStars = (rarity: string): number => {
    switch (rarity) {
      case 'common': return 1;
      case 'uncommon': return 2;
      case 'rare': return 3;
      case 'epic': return 4;
      case 'legendary': return 5;
      default: return 1;
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking the backdrop, not the modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isVisible) return null;

  const usedSlots = inventorySystem.getUsedSlots();
  const maxSlots = inventorySystem.getMaxSlots();
  const totalValue = inventorySystem.getTotalValue();

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
            <Package className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-bold">Inventory</h2>
              <div className="text-sm text-gray-400 flex items-center gap-4">
                <span>Slots: {usedSlots}/{maxSlots}</span>
                <span className="flex items-center gap-1">
                  <Coins className="w-4 h-4" />
                  Total Value: {totalValue}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inventory Grid */}
        <div className="flex-1 p-4 overflow-y-auto">
          {inventory.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-medium mb-2">Empty Inventory</h3>
              <p>Use tools to gather resources and items will appear here!</p>
            </div>
          ) : (
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 relative">
              {inventory.map((stack, index) => (
                <div
                  key={`${stack.item.id}-${index}`}
                  className={`aspect-square rounded-lg border-2 p-2 relative ${getRarityColor(stack.item.rarity)} bg-opacity-20 hover:bg-opacity-40 transition-all cursor-pointer group`}
                  onMouseEnter={() => setHoveredItem(`${stack.item.id}-${index}`)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Item Icon */}
                  <div className="text-2xl text-center mb-1">
                    {stack.item.icon}
                  </div>
                  
                  {/* Quantity */}
                  {stack.quantity > 1 && (
                    <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs rounded px-1 min-w-4 text-center">
                      {stack.quantity}
                    </div>
                  )}
                  
                  {/* Rarity Stars */}
                  <div className="absolute top-1 left-1 flex">
                    {Array.from({ length: getRarityStars(stack.item.rarity) }).map((_, i) => (
                      <Star key={i} className="w-2 h-2 text-yellow-400 fill-current" />
                    ))}
                  </div>

                  {/* Enhanced Tooltip */}
                  {hoveredItem === `${stack.item.id}-${index}` && (
                    <div className="fixed pointer-events-none z-[60]" 
                         style={{
                           left: '50%',
                           top: '50%',
                           transform: 'translate(-50%, -120%)'
                         }}>
                      <div className="bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-2xl max-w-xs">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{stack.item.icon}</span>
                          <div className="font-bold text-white">{stack.item.name}</div>
                          <div className="flex">
                            {Array.from({ length: getRarityStars(stack.item.rarity) }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                            ))}
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-300 mb-2">{stack.item.description}</div>
                        
                        <div className="flex justify-between items-center text-xs">
                          <div>
                            <div className="text-yellow-400">Value: {stack.item.value * stack.quantity}</div>
                            <div className="text-blue-400 capitalize">{stack.item.type}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-white">Quantity: {stack.quantity}</div>
                            <div className="text-gray-400 capitalize">{stack.item.rarity}</div>
                          </div>
                        </div>
                        
                        {stack.item.stackable && (
                          <div className="text-xs text-gray-400 mt-2 border-t border-gray-700 pt-2">
                            Stackable (Max: {stack.item.maxStack})
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Empty Slots */}
              {Array.from({ length: maxSlots - usedSlots }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="aspect-square rounded-lg border-2 border-gray-700 border-dashed bg-gray-800 bg-opacity-20"
                  onClick={(e) => e.stopPropagation()}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-800 px-4 py-3 rounded-b-lg border-t border-gray-700 text-sm text-gray-400">
          <div className="flex justify-between items-center">
            <div>Press I to toggle inventory</div>
            <div>Gather resources by using tools on trees, rocks, and other objects</div>
          </div>
        </div>
      </div>
    </div>
  );
};
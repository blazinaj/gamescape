import { InventoryItem, InventoryStack } from '../types/InventoryTypes';
import { CustomItem } from '../types/CustomItemTypes';

export class InventorySystem {
  private items: Map<string, InventoryItem> = new Map();
  private inventory: InventoryStack[] = [];
  private maxSlots: number = 30;
  private subscribers: ((inventory: InventoryStack[]) => void)[] = [];
  private customItems: Map<string, CustomItem> = new Map();

  constructor() {
    this.initializeItems();
  }

  private initializeItems(): void {
    const defaultItems: InventoryItem[] = [
      {
        id: 'wood_log',
        name: 'Wood Log',
        type: 'material',
        description: 'A sturdy piece of wood from a felled tree',
        icon: '🪵',
        stackable: true,
        maxStack: 64,
        value: 2,
        rarity: 'common'
      },
      {
        id: 'wood_plank',
        name: 'Wood Plank',
        type: 'material',
        description: 'Processed wood ready for construction',
        icon: '🪵',
        stackable: true,
        maxStack: 64,
        value: 5,
        rarity: 'common'
      },
      {
        id: 'stone',
        name: 'Stone',
        type: 'material',
        description: 'Raw stone material',
        icon: '🪨',
        stackable: true,
        maxStack: 64,
        value: 1,
        rarity: 'common'
      },
      {
        id: 'stone_brick',
        name: 'Stone Brick',
        type: 'material',
        description: 'Refined stone for building',
        icon: '🧱',
        stackable: true,
        maxStack: 32,
        value: 8,
        rarity: 'uncommon'
      },
      {
        id: 'iron_ore',
        name: 'Iron Ore',
        type: 'material',
        description: 'Raw iron ore that can be smelted',
        icon: '⚙️',
        stackable: true,
        maxStack: 32,
        value: 15,
        rarity: 'uncommon'
      },
      {
        id: 'leaves',
        name: 'Leaves',
        type: 'material',
        description: 'Fresh green leaves',
        icon: '🍃',
        stackable: true,
        maxStack: 64,
        value: 1,
        rarity: 'common'
      },
      {
        id: 'berry',
        name: 'Wild Berry',
        type: 'consumable',
        description: 'A small edible berry found in nature',
        icon: '🫐',
        stackable: true,
        maxStack: 16,
        value: 3,
        rarity: 'common'
      },
      {
        id: 'flint',
        name: 'Flint',
        type: 'material',
        description: 'Sharp stone fragment',
        icon: '🪨',
        stackable: true,
        maxStack: 32,
        value: 4,
        rarity: 'common'
      },
      // New items for new objects
      {
        id: 'crystal_shard',
        name: 'Crystal Shard',
        type: 'material',
        description: 'A sparkling fragment of magical crystal',
        icon: '💎',
        stackable: true,
        maxStack: 16,
        value: 25,
        rarity: 'rare'
      },
      {
        id: 'mushroom',
        name: 'Forest Mushroom',
        type: 'consumable',
        description: 'An edible mushroom with restorative properties',
        icon: '🍄',
        stackable: true,
        maxStack: 8,
        value: 8,
        rarity: 'uncommon'
      },
      {
        id: 'herb',
        name: 'Medicinal Herb',
        type: 'consumable',
        description: 'A valuable plant with healing properties',
        icon: '🌿',
        stackable: true,
        maxStack: 12,
        value: 12,
        rarity: 'uncommon'
      },
      {
        id: 'old_coin',
        name: 'Ancient Coin',
        type: 'material',
        description: 'A weathered coin from a forgotten era',
        icon: '🪙',
        stackable: true,
        maxStack: 64,
        value: 20,
        rarity: 'rare'
      },
      {
        id: 'rope',
        name: 'Rope',
        type: 'material',
        description: 'Sturdy rope useful for many purposes',
        icon: '🪢',
        stackable: true,
        maxStack: 16,
        value: 6,
        rarity: 'common'
      }
    ];

    defaultItems.forEach(item => {
      this.items.set(item.id, item);
    });
  }

  registerCustomItems(customItems: CustomItem[]): void {
    if (!customItems || !Array.isArray(customItems)) {
      console.warn('⚠️ No valid items array provided to registerCustomItems');
      return;
    }

    customItems.forEach(item => {
      if (!item || typeof item !== 'object') {
        console.warn('⚠️ Invalid item object in registerCustomItems');
        return;
      }

      // Check if properties exist before accessing them
      if (!item.properties) {
        console.warn(`⚠️ Custom item ${item.id} missing properties, using defaults`);
      }

      // Store in custom items collection
      this.customItems.set(item.id, item);
      
      // Default properties if missing
      const properties = item.properties || {
        value: 10,
        weight: 1,
        rarity: 'common',
        stackable: true,
        maxStack: 10,
        consumable: false,
        questItem: false,
        tradeable: true,
        craftingIngredient: false
      };

      // Default appearance if missing
      const appearance = item.appearance || {
        icon: '📦',
        primaryColor: '#A9A9A9'
      };
      
      // Create standard inventory item representation
      const standardItem: InventoryItem = {
        id: item.id,
        name: item.name || 'Unknown Item',
        type: item.type || 'material',
        description: item.description || 'A custom item',
        icon: appearance.icon || '📦',
        stackable: properties.stackable,
        maxStack: properties.maxStack,
        value: properties.value,
        rarity: properties.rarity || 'common'
      };
      
      // Add to available items
      this.items.set(item.id, standardItem);
      
      console.log(`📦 Registered custom item: ${item.name || item.id}`);
    });
  }

  getCustomItemDetails(itemId: string): CustomItem | undefined {
    return this.customItems.get(itemId);
  }

  addItem(itemId: string, quantity: number = 1): boolean {
    const item = this.items.get(itemId);
    if (!item) {
      console.warn(`Item not found: ${itemId}`);
      return false;
    }

    // Check if item is stackable and already exists
    if (item.stackable) {
      const existingStack = this.inventory.find(stack => stack.item.id === itemId);
      if (existingStack) {
        const spaceInStack = existingStack.item.maxStack - existingStack.quantity;
        const canAdd = Math.min(quantity, spaceInStack);
        
        existingStack.quantity += canAdd;
        quantity -= canAdd;
        
        console.log(`📦 Added ${canAdd} ${item.name} to existing stack (${existingStack.quantity}/${item.maxStack})`);
        
        if (quantity <= 0) {
          this.notifySubscribers();
          return true;
        }
      }
    }

    // Create new stacks for remaining quantity
    while (quantity > 0 && this.inventory.length < this.maxSlots) {
      const stackSize = item.stackable ? Math.min(quantity, item.maxStack) : 1;
      
      this.inventory.push({
        item: { ...item },
        quantity: stackSize
      });
      
      quantity -= stackSize;
      console.log(`📦 Added ${stackSize} ${item.name} to new stack`);
    }

    this.notifySubscribers();
    
    if (quantity > 0) {
      console.warn(`Inventory full! Could not add ${quantity} more ${item.name}`);
      return false;
    }
    
    return true;
  }

  removeItem(itemId: string, quantity: number = 1): boolean {
    const stackIndex = this.inventory.findIndex(stack => stack.item.id === itemId);
    if (stackIndex === -1) return false;

    const stack = this.inventory[stackIndex];
    
    if (stack.quantity >= quantity) {
      stack.quantity -= quantity;
      
      if (stack.quantity === 0) {
        this.inventory.splice(stackIndex, 1);
      }
      
      this.notifySubscribers();
      return true;
    }
    
    return false;
  }

  getInventory(): InventoryStack[] {
    return [...this.inventory];
  }

  getItemCount(itemId: string): number {
    return this.inventory
      .filter(stack => stack.item.id === itemId)
      .reduce((total, stack) => total + stack.quantity, 0);
  }

  hasItem(itemId: string, quantity: number = 1): boolean {
    return this.getItemCount(itemId) >= quantity;
  }

  getTotalValue(): number {
    return this.inventory.reduce((total, stack) => 
      total + (stack.item.value * stack.quantity), 0
    );
  }

  getUsedSlots(): number {
    return this.inventory.length;
  }

  getMaxSlots(): number {
    return this.maxSlots;
  }

  subscribe(callback: (inventory: InventoryStack[]) => void): () => void {
    this.subscribers.push(callback);
    callback([...this.inventory]);

    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      callback([...this.inventory]);
    });
  }

  // Debug method to add test items
  addTestItems(): void {
    this.addItem('wood_log', 10);
    this.addItem('stone', 20);
    this.addItem('iron_ore', 5);
    this.addItem('berry', 8);
    this.addItem('crystal_shard', 2);
    this.addItem('mushroom', 3);
    console.log('🧪 Added test items to inventory');
  }
}
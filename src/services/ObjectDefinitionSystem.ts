import { 
  GeneratedObjectSet,
  ObjectCategory,
  CustomizableObject
} from '../types/BaseObjectTypes';

/**
 * System for managing and retrieving object definitions
 * Acts as the central registry for all custom objects in the game
 */
export class ObjectDefinitionSystem {
  private objectSets: Map<string, GeneratedObjectSet> = new Map();
  
  // Indexes for faster lookups
  private objectsByCategory: Map<ObjectCategory, Map<string, CustomizableObject>> = new Map();
  private objectsByScenario: Map<string, Map<string, CustomizableObject>> = new Map();
  
  constructor() {
    // Initialize category maps
    this.initializeIndexes();
  }
  
  private initializeIndexes() {
    const categories: ObjectCategory[] = [
      'enemy', 'npc', 'vegetation', 'structure', 
      'item', 'weapon', 'tool', 'resource', 
      'terrain', 'effect'
    ];
    
    // Initialize maps for each category
    categories.forEach(category => {
      this.objectsByCategory.set(category, new Map());
    });
  }
  
  registerObjectSet(objectSet: GeneratedObjectSet): void {
    console.log(`🎭 Registering object set for scenario: ${objectSet.scenarioId}`);
    this.objectSets.set(objectSet.scenarioId, objectSet);
    
    // Initialize scenario map if needed
    if (!this.objectsByScenario.has(objectSet.scenarioId)) {
      this.objectsByScenario.set(objectSet.scenarioId, new Map());
    }
    
    // Index all objects for quick lookup
    const scenarioObjectMap = this.objectsByScenario.get(objectSet.scenarioId)!;
    
    // Process each category of objects
    Object.entries(objectSet.objects).forEach(([category, objects]) => {
      const categoryMap = this.objectsByCategory.get(category as ObjectCategory);
      
      if (categoryMap && objects) {
        objects.forEach(obj => {
          // Add to category index
          categoryMap.set(obj.id, obj);
          
          // Add to scenario index
          scenarioObjectMap.set(obj.id, obj);
          
          console.log(`✓ Registered ${category}: ${obj.name}`);
        });
      }
    });
    
    console.log(`✅ Registered ${scenarioObjectMap.size} total objects for scenario ${objectSet.scenarioId}`);
  }
  
  getObjectSet(scenarioId: string): GeneratedObjectSet | undefined {
    return this.objectSets.get(scenarioId);
  }
  
  getObject(id: string): CustomizableObject | undefined {
    // Check all categories for the object
    for (const categoryMap of this.objectsByCategory.values()) {
      const obj = categoryMap.get(id);
      if (obj) return obj;
    }
    return undefined;
  }
  
  getObjectsByCategory(category: ObjectCategory): Map<string, CustomizableObject> {
    return this.objectsByCategory.get(category) || new Map();
  }
  
  getObjectsForScenario(scenarioId: string): Map<string, CustomizableObject> | undefined {
    return this.objectsByScenario.get(scenarioId);
  }
  
  getObjectsByTypeAndScenario(category: ObjectCategory, scenarioId: string): CustomizableObject[] {
    const scenarioMap = this.objectsByScenario.get(scenarioId);
    if (!scenarioMap) return [];
    
    // Filter scenario objects by category
    const result: CustomizableObject[] = [];
    
    for (const obj of scenarioMap.values()) {
      // Check if the object matches the category
      if (this.objectMatchesCategory(obj, category)) {
        result.push(obj);
      }
    }
    
    return result;
  }
  
  private objectMatchesCategory(obj: CustomizableObject, category: ObjectCategory): boolean {
    // Different object types have different ways to identify their category
    if ('type' in obj) {
      if (category === 'vegetation' && ['tree', 'bush', 'flower', 'plant', 'mushroom'].includes(obj.type as string)) {
        return true;
      }
      
      if (category === 'structure' && ['building', 'ruin', 'monument', 'bridge'].includes(obj.type as string)) {
        return true;
      }
      
      if (category === 'enemy' && ['enemy', 'monster', 'creature'].includes(obj.type as string)) {
        return true;
      }
      
      // Direct match for resources and items
      if (category === 'item' || category === 'resource') {
        return obj.type === category;
      }
    }
    
    // Check for weapons and tools by specialized properties
    if (category === 'weapon' && 'weaponType' in obj) {
      return true;
    }
    
    if (category === 'tool' && 'toolType' in obj) {
      return true;
    }
    
    return false;
  }
  
  clear(): void {
    this.objectSets.clear();
    this.initializeIndexes();
    this.objectsByScenario.clear();
  }
}
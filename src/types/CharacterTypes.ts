export interface CharacterCustomization {
  bodyColor: string; // Hex color for skin
  clothingColor: string; // Hex color for clothing
  eyeColor: string; // Hex color for eyes
  scale: number; // Overall character size (0.5 - 2.0)
  headScale: number; // Head size multiplier (0.8 - 1.5)
  bodyWidth: number; // Body width multiplier (0.7 - 1.3)
  armLength: number; // Arm length multiplier (0.8 - 1.2)
  legLength: number; // Leg length multiplier (0.8 - 1.2)
  name?: string; // Character name
}

export const DEFAULT_CUSTOMIZATION: CharacterCustomization = {
  bodyColor: '#FFDBAC',
  clothingColor: '#3B82F6',
  eyeColor: '#000000',
  scale: 1.0,
  headScale: 1.0,
  bodyWidth: 1.0,
  armLength: 1.0,
  legLength: 1.0,
  name: 'Adventurer'
};

export interface CustomizationRequest {
  description: string;
  currentCustomization: CharacterCustomization;
}

export interface CustomizationResponse {
  customization: CharacterCustomization;
  explanation: string;
}
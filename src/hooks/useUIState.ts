import { useState } from 'react';
import { NPC } from '../components/NPC';
import { InteractableObject } from '../services/InteractableObjectManager';

export const useUIState = () => {
  const [activeConversation, setActiveConversation] = useState<NPC | null>(null);
  const [activeObjectInteraction, setActiveObjectInteraction] = useState<InteractableObject | null>(null);
  const [showSaveUI, setShowSaveUI] = useState(false);
  const [showLogViewer, setShowLogViewer] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showCharacterCustomizer, setShowCharacterCustomizer] = useState(false);
  const [showKeybindings, setShowKeybindings] = useState(false);
  const [showExperience, setShowExperience] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const isUIActive = activeConversation !== null || 
                    activeObjectInteraction !== null || 
                    showSaveUI || 
                    showLogViewer || 
                    showInventory || 
                    showCharacterCustomizer || 
                    showKeybindings ||
                    showExperience ||
                    showSettings;

  const closeAllUI = () => {
    setActiveConversation(null);
    setActiveObjectInteraction(null);
    setShowSaveUI(false);
    setShowLogViewer(false);
    setShowInventory(false);
    setShowCharacterCustomizer(false);
    setShowKeybindings(false);
    setShowExperience(false);
    setShowSettings(false);
  };

  return {
    activeConversation,
    setActiveConversation,
    activeObjectInteraction,
    setActiveObjectInteraction,
    showSaveUI,
    setShowSaveUI,
    showLogViewer,
    setShowLogViewer,
    showInventory,
    setShowInventory,
    showCharacterCustomizer,
    setShowCharacterCustomizer,
    showKeybindings,
    setShowKeybindings,
    showExperience,
    setShowExperience,
    showSettings,
    setShowSettings,
    isUIActive,
    closeAllUI,
  };
};
import { useEffect } from 'react';
import { useUIState } from './useUIState';

interface UseKeyboardShortcutsProps {
  uiState: ReturnType<typeof useUIState>;
  onSave: () => void;
}

export const useKeyboardShortcuts = ({ uiState, onSave }: UseKeyboardShortcutsProps) => {
  const {
    activeConversation,
    setShowLogViewer,
    setShowInventory,
    setShowCharacterCustomizer,
    setShowKeybindings,
    setShowExperience,
    setShowSaveUI,
    setShowSettings,
    showLogViewer,
    showInventory,
    showCharacterCustomizer,
    showKeybindings,
    showExperience,
    showSaveUI,
    showSettings,
  } = uiState;

  useEffect(() => {
    const isTypingInInput = (event: KeyboardEvent): boolean => {
      const target = event.target as HTMLElement;
      if (!target) return false;

      const typingElements = ['INPUT', 'TEXTAREA', 'SELECT'];
      const isTypingElement = typingElements.includes(target.tagName);
      const isContentEditable = target.contentEditable === 'true';
      const isInForm = target.closest('form') !== null;
      const hasInputRole = target.getAttribute('role') === 'textbox';
      
      return isTypingElement || isContentEditable || (isInForm && hasInputRole);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingInInput(e)) {
        return;
      }

      if (activeConversation) return;

      // Ctrl+Shift+L to toggle log viewer
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setShowLogViewer(prev => !prev);
        console.log('🔍 Log viewer toggled:', !showLogViewer);
      }
      
      // I key to toggle inventory
      if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setShowInventory(prev => !prev);
        console.log('📦 Inventory toggled:', !showInventory);
      }

      // C key to toggle character customizer
      if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setShowCharacterCustomizer(prev => !prev);
        console.log('👤 Character customizer toggled:', !showCharacterCustomizer);
      }

      // H key to toggle keybindings
      if (e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setShowKeybindings(prev => !prev);
        console.log('⌨️ Keybindings toggled:', !showKeybindings);
      }

      // X key to toggle experience window
      if (e.key.toLowerCase() === 'x') {
        e.preventDefault();
        setShowExperience(prev => !prev);
        console.log('📈 Experience window toggled:', !showExperience);
      }

      // Escape key to close any open UI
      if (e.key === 'Escape') {
        if (showSaveUI) {
          setShowSaveUI(false);
        } else if (showLogViewer) {
          setShowLogViewer(false);
        } else if (showInventory) {
          setShowInventory(false);
        } else if (showCharacterCustomizer) {
          setShowCharacterCustomizer(false);
        } else if (showKeybindings) {
          setShowKeybindings(false);
        } else if (showExperience) {
          setShowExperience(false);
        } else if (showSettings) {
          setShowSettings(false);
        }
      }
    };

    const handleSaveShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTyping = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      
      if ((event.ctrlKey || event.metaKey) && event.key === 's' && !activeConversation && !isTyping) {
        event.preventDefault();
        onSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleSaveShortcut);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleSaveShortcut);
    };
  }, [
    activeConversation,
    showLogViewer,
    showInventory,
    showCharacterCustomizer,
    showKeybindings,
    showExperience,
    showSaveUI,
    showSettings,
    setShowLogViewer,
    setShowInventory,
    setShowCharacterCustomizer,
    setShowKeybindings,
    setShowExperience,
    setShowSaveUI,
    setShowSettings,
    onSave,
  ]);
};
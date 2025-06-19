import React, { useState } from 'react';
import { Save, Loader2, Check, X } from 'lucide-react';

interface SaveGameUIProps {
  onSave: () => Promise<boolean>;
  isVisible: boolean;
  onClose: () => void;
}

export const SaveGameUI: React.FC<SaveGameUIProps> = ({ onSave, isVisible, onClose }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    
    try {
      const success = await onSave();
      setSaveStatus(success ? 'success' : 'error');
      
      if (success) {
        setTimeout(() => {
          onClose();
          setSaveStatus('idle');
        }, 1500);
      }
    } catch (error) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mb-4">
            {saveStatus === 'idle' && (
              <Save className="w-12 h-12 text-blue-600 mx-auto" />
            )}
            {saveStatus === 'success' && (
              <Check className="w-12 h-12 text-green-600 mx-auto" />
            )}
            {saveStatus === 'error' && (
              <X className="w-12 h-12 text-red-600 mx-auto" />
            )}
          </div>
          
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {saveStatus === 'idle' && 'Save Your Adventure'}
            {saveStatus === 'success' && 'Game Saved!'}
            {saveStatus === 'error' && 'Save Failed'}
          </h2>
          
          <p className="text-gray-600 mb-6">
            {saveStatus === 'idle' && 'Save your current progress and continue your journey later.'}
            {saveStatus === 'success' && 'Your adventure has been saved successfully.'}
            {saveStatus === 'error' && 'There was an error saving your game. Please try again.'}
          </p>
          
          <div className="flex gap-3 justify-center">
            {saveStatus === 'idle' && (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Game
                    </>
                  )}
                </button>
                <button
                  onClick={onClose}
                  disabled={isSaving}
                  className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
            
            {saveStatus === 'error' && (
              <>
                <button
                  onClick={handleSave}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
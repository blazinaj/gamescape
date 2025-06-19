import { useState, useEffect, useRef, useCallback } from 'react';

export interface AutoSaveState {
  isEnabled: boolean;
  interval: number;
  lastSaveTime: number | null;
  timeUntilNextSave: number;
  status: 'idle' | 'saving' | 'success' | 'error';
  errorMessage?: string;
}

interface UseAutoSaveOptions {
  enabled: boolean;
  interval: number; // in milliseconds
  onSave: () => Promise<boolean>;
  gameLoaded: boolean;
}

export const useAutoSave = (options: UseAutoSaveOptions): AutoSaveState => {
  const { enabled, interval, onSave, gameLoaded } = options;
  
  const [autoSaveState, setAutoSaveState] = useState<AutoSaveState>({
    isEnabled: enabled,
    interval,
    lastSaveTime: null,
    timeUntilNextSave: interval,
    status: 'idle'
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveTimeRef = useRef<number | null>(null);

  const performAutoSave = useCallback(async () => {
    if (!gameLoaded || !enabled) return;

    console.log('💾 Performing auto-save...');
    setAutoSaveState(prev => ({ ...prev, status: 'saving' }));

    try {
      const success = await onSave();
      const now = Date.now();
      lastSaveTimeRef.current = now;

      if (success) {
        setAutoSaveState(prev => ({ 
          ...prev, 
          status: 'success', 
          lastSaveTime: now,
          timeUntilNextSave: interval,
          errorMessage: undefined
        }));
        console.log('✅ Auto-save completed successfully');
        
        // Reset to idle after showing success briefly
        setTimeout(() => {
          setAutoSaveState(prev => ({ ...prev, status: 'idle' }));
        }, 2000);
      } else {
        throw new Error('Save operation returned false');
      }
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
      setAutoSaveState(prev => ({ 
        ...prev, 
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Auto-save failed',
        timeUntilNextSave: interval // Reset countdown even on error
      }));
      
      // Reset to idle after showing error briefly
      setTimeout(() => {
        setAutoSaveState(prev => ({ ...prev, status: 'idle' }));
      }, 3000);
    }
  }, [onSave, gameLoaded, enabled, interval]);

  // Update countdown timer
  useEffect(() => {
    if (!enabled || !gameLoaded) return;

    const updateCountdown = () => {
      setAutoSaveState(prev => {
        const now = Date.now();
        const timeSinceLastSave = lastSaveTimeRef.current ? now - lastSaveTimeRef.current : interval;
        const timeUntilNext = Math.max(0, interval - timeSinceLastSave);
        
        return {
          ...prev,
          timeUntilNextSave: timeUntilNext
        };
      });
    };

    // Update countdown every second
    countdownRef.current = setInterval(updateCountdown, 1000);
    updateCountdown(); // Initial update

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [enabled, gameLoaded, interval]);

  // Setup auto-save interval
  useEffect(() => {
    if (!enabled || !gameLoaded) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Start auto-save interval
    intervalRef.current = setInterval(performAutoSave, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, gameLoaded, interval, performAutoSave]);

  // Update state when options change
  useEffect(() => {
    setAutoSaveState(prev => ({
      ...prev,
      isEnabled: enabled,
      interval
    }));
  }, [enabled, interval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  return autoSaveState;
};
import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles, Mountain, Castle, TreePine, Globe, Check } from 'lucide-react';
import { GameScenario } from '../ScenarioSelector';

interface WorldGenerationLoadingProps {
  scenario?: GameScenario | null;
  onForceComplete?: () => void;
}

export const WorldGenerationLoading: React.FC<WorldGenerationLoadingProps> = ({ scenario, onForceComplete }) => {
  const [loadingMessage, setLoadingMessage] = useState('Generating world...');
  const [progress, setProgress] = useState(0);
  const [timeoutTriggered, setTimeoutTriggered] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const startTime = Date.now();
    
    // Update loading time counter
    const timeInterval = setInterval(() => {
      if (!isMounted) return;
      setLoadingTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    // Simulate loading progress
    const interval = setInterval(() => {
      if (!isMounted) return;
      
      setProgress(prev => {
        // Slow down as we approach 100% to wait for actual generation
        if (prev >= 90) {
          return Math.min(99, prev + 0.2);
        }
        return Math.min(90, prev + Math.random() * 1.5);
      });
    }, 200);

    // Set multiple timeouts with increasing urgency
    
    // First timeout at 10 seconds
    const firstTimeout = setTimeout(() => {
      if (!isMounted) return;
      console.log('⏱️ 10-second timeout reached for world generation');
      if (progress < 60) {
        setProgress(Math.max(progress, 60));
      }
    }, 10000);
    
    // Main timeout at 20 seconds - this should normally complete
    const forceTimeout = setTimeout(() => {
      if (!isMounted) return;
      
      console.log('⏱️ 20-second timeout reached for world generation');
      setTimeoutTriggered(true);
      setProgress(100);
      setCompleted(true);
      
      if (onForceComplete) {
        console.log('🚀 Calling onForceComplete callback from timeout');
        onForceComplete();
      }
    }, 20000);

    // Emergency timeout at 30 seconds as a safety measure
    const emergencyTimeout = setTimeout(() => {
      if (!isMounted) return;
      
      console.log('⚠️ EMERGENCY 30-second timeout reached, forcing completion');
      setTimeoutTriggered(true);
      setProgress(100);
      setCompleted(true);
      
      if (onForceComplete) {
        console.log('🚨 Calling onForceComplete callback from emergency timeout');
        onForceComplete();
      }
    }, 30000);
    
    // Final failsafe at 45 seconds that will definitely force completion
    const finalFailsafe = setTimeout(() => {
      if (!isMounted) return;
      
      console.log('🚨 CRITICAL 45-second timeout reached, forcing completion with direct DOM manipulation');
      setTimeoutTriggered(true);
      setProgress(100);
      setCompleted(true);
      
      if (onForceComplete) {
        onForceComplete();
      }
      
      // Try to forcibly update the app state via a synthetic event if nothing else works
      try {
        const event = new Event('gameloaded', { bubbles: true });
        document.dispatchEvent(event);
      } catch (e) {
        console.error('Failed to dispatch synthetic event:', e);
      }
    }, 45000);

    // Update loading messages to provide context
    const messages = [
      'Initializing terrain...',
      'Creating landscapes...',
      'Growing forests...',
      'Shaping mountains...',
      'Placing interactive objects...',
      'Generating resources...',
      'Spawning NPCs...',
      'Setting up quests...',
      'Adding wildlife...',
      'Finalizing world details...'
    ];

    // Add scenario-specific messages if available
    if (scenario) {
      switch (scenario.theme) {
        case 'pastoral':
          messages.push('Growing peaceful villages...', 'Planting bountiful fields...', 'Setting up farm houses...');
          break;
        case 'archaeological':
          messages.push('Unearthing ancient ruins...', 'Placing mysterious artifacts...', 'Creating forgotten temples...');
          break;
        case 'survival':
          messages.push('Making challenging terrain...', 'Adding survival challenges...', 'Creating hidden resources...');
          break;
        case 'fantasy':
          messages.push('Adding magical elements...', 'Creating enchanted forests...', 'Placing mystical creatures...');
          break;
        case 'nautical':
          messages.push('Shaping coastlines...', 'Creating island chains...', 'Placing shipwrecks...');
          break;
        case 'industrial':
          messages.push('Building factories...', 'Creating steam-powered machines...', 'Laying railways...');
          break;
        case 'apocalyptic':
          messages.push('Creating wasteland terrain...', 'Placing destroyed structures...', 'Adding survivor outposts...');
          break;
      }
    }

    // Cycle through messages
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      if (!isMounted) return;
      
      messageIndex = (messageIndex + 1) % messages.length;
      setLoadingMessage(messages[messageIndex]);
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      clearInterval(messageInterval);
      clearInterval(timeInterval);
      clearTimeout(firstTimeout);
      clearTimeout(forceTimeout);
      clearTimeout(emergencyTimeout);
      clearTimeout(finalFailsafe);
    };
  }, [scenario, onForceComplete, progress]);

  // Auto-call onForceComplete when progress reaches 100%
  useEffect(() => {
    if (progress >= 100 && !completed && onForceComplete) {
      console.log('🚀 Progress reached 100%, triggering completion');
      setCompleted(true);
      onForceComplete();
    }
  }, [progress, completed, onForceComplete]);

  // Select icon based on scenario theme
  const getIcon = () => {
    if (!scenario) return <Globe className="w-10 h-10" />;
    
    switch (scenario.theme) {
      case 'pastoral':
      case 'fantasy':
        return <TreePine className="w-10 h-10" />;
      case 'archaeological':
      case 'industrial':
        return <Castle className="w-10 h-10" />;
      case 'survival':
      case 'apocalyptic':
        return <Mountain className="w-10 h-10" />;
      default:
        return <Globe className="w-10 h-10" />;
    }
  };

  const handleForceComplete = () => {
    if (onForceComplete && !completed) {
      console.log('👆 Manual force completion requested by user');
      setTimeoutTriggered(true);
      setProgress(100);
      setCompleted(true);
      onForceComplete();
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 to-blue-900 flex flex-col items-center justify-center z-50">
      <div className="max-w-lg w-full px-6 py-8 text-center">
        {/* Header */}
        <div className="mb-8 animate-float">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full mb-4">
            {getIcon()}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {scenario ? `Creating ${scenario.name}` : 'Generating New World'}
          </h1>
          <p className="text-blue-200">
            {scenario?.description || 'Please wait while we create your adventure...'}
          </p>
        </div>

        {/* Loading bar */}
        <div className="w-full bg-gray-700 rounded-full h-4 mb-6 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progress, 99.9)}%` }}
          ></div>
        </div>

        {/* Loading message */}
        <div className="flex items-center justify-center gap-3 text-lg text-white mb-8">
          {progress >= 100 ? (
            <>
              <Check className="w-6 h-6 text-green-400" />
              <p>World generation complete!</p>
            </>
          ) : (
            <>
              <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              <p className="animate-pulse">{timeoutTriggered ? "Final preparations..." : loadingMessage}</p>
            </>
          )}
        </div>

        {/* Generation details */}
        <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4 text-left">
          <h3 className="text-lg font-medium text-blue-300 flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5" />
            World Generation Details
          </h3>
          
          <div className="space-y-2 text-sm text-gray-300">
            {scenario && (
              <p><span className="text-gray-400">Scenario:</span> {scenario.name}</p>
            )}
            <p><span className="text-gray-400">Terrain:</span> Procedurally generated landscapes</p>
            <p><span className="text-gray-400">Objects:</span> Interactive resources and items</p>
            <p><span className="text-gray-400">NPCs:</span> Dynamic characters with unique dialogues</p>
            {scenario?.theme && (
              <p><span className="text-gray-400">Theme:</span> {scenario.theme.charAt(0).toUpperCase() + scenario.theme.slice(1)}</p>
            )}
            <p><span className="text-gray-400">Time Elapsed:</span> {loadingTime}s</p>
          </div>
        </div>

        {/* Tips and Manual Override */}
        <div className="mt-8 text-sm text-blue-200">
          <p>This may take a minute for your first-time generation.</p>
          <p>A whole world is being created just for you!</p>
          
          {/* Add manual force complete button if it's taking too long */}
          {loadingTime > 15 && !completed && (
            <button 
              onClick={handleForceComplete}
              className="mt-4 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Skip Loading
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
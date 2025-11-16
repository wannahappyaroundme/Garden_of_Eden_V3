/**
 * Proactive Notification Component
 * Displays AI-generated suggestions when proactive triggers are detected
 */

import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { Button } from './ui/button';
import { X, AlertTriangle, Info, CheckCircle, Clock, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

export interface ProactiveSuggestion {
  id: string;
  suggestion: string;
  priority: number;
  context: string;
  trigger_type: 'ErrorDetected' | 'WarningDetected' | 'TodoDetected' | 'LongRunningProcess';
  timestamp: number;
}

interface ProactiveNotificationProps {
  onAccept?: (suggestion: ProactiveSuggestion) => void;
  onDismiss?: (suggestionId: string) => void;
  onOpenSettings?: () => void;
}

export function ProactiveNotification({
  onAccept,
  onDismiss,
  onOpenSettings,
}: ProactiveNotificationProps) {
  const [currentSuggestion, setCurrentSuggestion] = useState<ProactiveSuggestion | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Listen for proactive suggestion events from backend
    const unlisten = listen<ProactiveSuggestion>('proactive-suggestion', (event) => {
      console.log('Received proactive suggestion:', event.payload);
      setCurrentSuggestion(event.payload);
      setIsVisible(true);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const handleAccept = () => {
    if (currentSuggestion && onAccept) {
      onAccept(currentSuggestion);
    }
    handleDismiss();
  };

  const handleDismiss = () => {
    if (currentSuggestion && onDismiss) {
      onDismiss(currentSuggestion.id);
    }
    setIsVisible(false);
    setTimeout(() => setCurrentSuggestion(null), 300);
  };

  const getTriggerIcon = (triggerType: ProactiveSuggestion['trigger_type']) => {
    switch (triggerType) {
      case 'ErrorDetected':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'WarningDetected':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'TodoDetected':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'LongRunningProcess':
        return <Clock className="w-5 h-5 text-purple-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTriggerLabel = (triggerType: ProactiveSuggestion['trigger_type']) => {
    switch (triggerType) {
      case 'ErrorDetected':
        return 'Error Detected';
      case 'WarningDetected':
        return 'Warning Detected';
      case 'TodoDetected':
        return 'TODO Found';
      case 'LongRunningProcess':
        return 'Long Process';
      default:
        return 'Notification';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 0.8) return 'border-red-500 bg-red-50 dark:bg-red-950/20';
    if (priority >= 0.5) return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20';
    return 'border-blue-500 bg-blue-50 dark:bg-blue-950/20';
  };

  if (!currentSuggestion) return null;

  return (
    <div
      className={cn(
        'fixed top-20 right-4 z-50 w-96 transition-all duration-300',
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <div
        className={cn(
          'rounded-lg border-2 shadow-2xl backdrop-blur-sm p-4',
          getPriorityColor(currentSuggestion.priority)
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getTriggerIcon(currentSuggestion.trigger_type)}
            <div>
              <h3 className="font-semibold text-sm">
                {getTriggerLabel(currentSuggestion.trigger_type)}
              </h3>
              <p className="text-xs text-muted-foreground">
                Priority: {(currentSuggestion.priority * 100).toFixed(0)}%
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-6 w-6 rounded-full"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Context */}
        {currentSuggestion.context && (
          <div className="mb-3 p-2 bg-muted/50 rounded text-xs font-mono">
            {currentSuggestion.context}
          </div>
        )}

        {/* Suggestion */}
        <div className="mb-4">
          <p className="text-sm leading-relaxed">{currentSuggestion.suggestion}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleAccept}
            className="flex-1"
          >
            Accept
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismiss}
            className="flex-1"
          >
            Dismiss
          </Button>
          {onOpenSettings && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenSettings}
              className="h-8 w-8"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {new Date(currentSuggestion.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

/**
 * Hook to manage proactive notifications
 */
export function useProactiveNotifications() {
  const [suggestions, setSuggestions] = useState<ProactiveSuggestion[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unlisten = listen<ProactiveSuggestion>('proactive-suggestion', (event) => {
      const suggestion = event.payload;

      // Don't show if already dismissed
      if (dismissedIds.has(suggestion.id)) return;

      setSuggestions((prev) => {
        // Remove duplicates and sort by priority
        const filtered = prev.filter((s) => s.id !== suggestion.id);
        return [...filtered, suggestion].sort((a, b) => b.priority - a.priority);
      });
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [dismissedIds]);

  const dismissSuggestion = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  };

  const clearAll = () => {
    setSuggestions([]);
  };

  return {
    suggestions,
    currentSuggestion: suggestions[0] || null,
    dismissSuggestion,
    clearAll,
  };
}

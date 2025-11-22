/**
 * Style Adaptation Toggle Component (v3.9.0 Phase 5 Stage 4)
 *
 * Toggle to enable/disable learning style adaptation in chat
 */

import { useState } from 'react';
import { cn } from '../../lib/utils';

interface StyleAdaptationToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  className?: string;
}

export function StyleAdaptationToggle({ enabled, onToggle, className }: StyleAdaptationToggleProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <button
        onClick={() => onToggle(!enabled)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
          enabled
            ? "bg-gradient-to-r from-blue-500 to-purple-600"
            : "bg-gray-300 dark:bg-gray-600"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
            enabled ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>

      <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        🎓 Style Adaptation
      </span>

      {/* Tooltip */}
      {isHovered && (
        <div className="absolute top-full left-0 mt-2 z-50 w-64 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {enabled
              ? "AI responses are being adapted to your learning style (Visual, Auditory, Kinesthetic, Reading/Writing)"
              : "Enable to personalize AI responses based on your learning preferences"}
          </p>
        </div>
      )}
    </div>
  );
}

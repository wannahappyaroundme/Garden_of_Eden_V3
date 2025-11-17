/**
 * ToolToggle Component (v3.7.0 Phase 2)
 * Individual tool enable/disable switch with status indicator
 */

import { useState } from 'react';
import { TOOL_DISPLAY_NAMES, TOOL_COLORS } from '../../../shared/types/tool.types';
import { cn } from '../../lib/utils';

export interface ToolToggleProps {
  toolName: string;
  enabled: boolean;
  onToggle: (toolName: string, enabled: boolean) => void;
  requiresPermission?: boolean;
  className?: string;
}

export function ToolToggle({
  toolName,
  enabled,
  onToggle,
  requiresPermission = false,
  className,
}: ToolToggleProps) {
  const [isToggling, setIsToggling] = useState(false);
  const displayName = TOOL_DISPLAY_NAMES[toolName] || toolName;
  const colors = TOOL_COLORS[toolName] || {
    bg: 'bg-gray-500/10',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-500/20',
  };

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await onToggle(toolName, !enabled);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 rounded-lg border transition-colors',
        colors.border,
        enabled ? colors.bg : 'bg-gray-50 dark:bg-gray-800',
        className
      )}
    >
      <div className="flex items-center gap-3 flex-1">
        {/* Tool name and status */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className={cn('font-medium text-sm', enabled ? colors.text : 'text-gray-500')}>
              {displayName}
            </span>
            {requiresPermission && (
              <span className="px-1.5 py-0.5 text-xs rounded bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20">
                Requires Permission
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500">
            {enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      {/* Toggle switch */}
      <button
        onClick={handleToggle}
        disabled={isToggling}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
        )}
        aria-label={`Toggle ${displayName}`}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            enabled ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
}

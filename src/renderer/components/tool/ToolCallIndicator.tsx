/**
 * ToolCallIndicator Component (v3.7.0)
 * Displays an inline badge showing active tool usage during AI responses
 */

import { Loader2 } from 'lucide-react';
import { ToolStatus, TOOL_DISPLAY_NAMES, TOOL_COLORS } from '../../../shared/types/tool.types';
import { cn } from '../../lib/utils';

export interface ToolCallIndicatorProps {
  toolName: string;
  status: ToolStatus;
  executionTime?: number;
  className?: string;
}

export function ToolCallIndicator({
  toolName,
  status,
  executionTime,
  className,
}: ToolCallIndicatorProps) {
  const displayName = TOOL_DISPLAY_NAMES[toolName] || toolName;
  const colors = TOOL_COLORS[toolName] || {
    bg: 'bg-gray-500/10',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-500/20',
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-3 w-3 animate-spin" />;
      case 'success':
        return (
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case 'error':
        return (
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'loading':
        return `Using ${displayName}...`;
      case 'success':
        return executionTime
          ? `${displayName} (${(executionTime / 1000).toFixed(1)}s)`
          : displayName;
      case 'error':
        return `${displayName} failed`;
    }
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        'transition-all duration-200',
        colors.bg,
        colors.text,
        colors.border,
        status === 'error' && 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
        className
      )}
    >
      {getStatusIcon()}
      <span>{getStatusText()}</span>
    </div>
  );
}

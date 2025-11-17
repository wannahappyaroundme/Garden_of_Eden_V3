/**
 * ToolResultCard Component (v3.7.0)
 * Expandable card showing detailed tool input/output information
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ToolCall, TOOL_DISPLAY_NAMES, TOOL_COLORS } from '../../../shared/types/tool.types';
import { cn } from '../../lib/utils';

export interface ToolResultCardProps {
  toolCall: ToolCall;
  className?: string;
}

export function ToolResultCard({ toolCall, className }: ToolResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayName = TOOL_DISPLAY_NAMES[toolCall.toolName] || toolCall.toolName;
  const colors = TOOL_COLORS[toolCall.toolName] || {
    bg: 'bg-gray-500/10',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-500/20',
  };

  const formatInput = (input: Record<string, any> | undefined): string => {
    if (!input) return 'No input';
    const entries = Object.entries(input);
    if (entries.length === 0) return 'No input';
    if (entries.length === 1) {
      const [key, value] = entries[0];
      return `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`;
    }
    return JSON.stringify(input, null, 2);
  };

  const formatOutput = (output: any): string => {
    if (output === null || output === undefined) return 'No output';
    if (typeof output === 'string') return output;
    if (typeof output === 'object') {
      // Check if it's a simple object with result field
      if ('result' in output) {
        return typeof output.result === 'string'
          ? output.result
          : JSON.stringify(output.result, null, 2);
      }
      return JSON.stringify(output, null, 2);
    }
    return String(output);
  };

  const getStatusBadge = () => {
    switch (toolCall.status) {
      case 'success':
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
            Success
          </span>
        );
      case 'error':
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            Error
          </span>
        );
      case 'loading':
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            Running...
          </span>
        );
    }
  };

  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden transition-all duration-200',
        colors.border,
        colors.bg,
        className
      )}
    >
      {/* Header (always visible) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full px-4 py-3 flex items-center justify-between',
          'hover:bg-black/5 dark:hover:bg-white/5 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        )}
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          )}
          <div className="flex items-center gap-2">
            <span className={cn('font-medium text-sm', colors.text)}>{displayName}</span>
            {getStatusBadge()}
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {toolCall.executionTimeMs && `${(toolCall.executionTimeMs / 1000).toFixed(2)}s`}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
          {/* Input section */}
          {toolCall.input && (
            <div>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                Input:
              </div>
              <div className="bg-black/5 dark:bg-white/5 rounded px-3 py-2 text-xs font-mono overflow-x-auto">
                <pre className="whitespace-pre-wrap break-words">
                  {formatInput(toolCall.input)}
                </pre>
              </div>
            </div>
          )}

          {/* Output section */}
          {toolCall.status === 'success' && toolCall.output && (
            <div>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                Output:
              </div>
              <div className="bg-black/5 dark:bg-white/5 rounded px-3 py-2 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
                <pre className="whitespace-pre-wrap break-words">
                  {formatOutput(toolCall.output)}
                </pre>
              </div>
            </div>
          )}

          {/* Error section */}
          {toolCall.status === 'error' && toolCall.error && (
            <div>
              <div className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1.5">
                Error:
              </div>
              <div className="bg-red-500/10 rounded px-3 py-2 text-xs text-red-700 dark:text-red-300">
                {toolCall.error}
              </div>
            </div>
          )}

          {/* Execution info */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Started: {new Date(toolCall.startTime).toLocaleTimeString()}</span>
            {toolCall.endTime && (
              <span>Ended: {new Date(toolCall.endTime).toLocaleTimeString()}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

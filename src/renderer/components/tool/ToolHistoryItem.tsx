/**
 * ToolHistoryItem Component (v3.7.0 Phase 3)
 * Individual tool call history entry
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import type { ToolCallRecord } from '../../../shared/types/tool-history.types';
import {
  getToolDisplayName,
  getToolMetadata,
  formatDuration,
  formatTimestamp,
  getStatusColor,
  getStatusIcon,
} from '../../../shared/types/tool-history.types';
import { cn } from '../../lib/utils';

export interface ToolHistoryItemProps {
  record: ToolCallRecord;
  onCopy?: (record: ToolCallRecord) => void;
  className?: string;
}

export function ToolHistoryItem({ record, onCopy, className }: ToolHistoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const metadata = getToolMetadata(record.toolName);
  const displayName = getToolDisplayName(record.toolName);
  const statusColor = getStatusColor(record.status);
  const statusIcon = getStatusIcon(record.status);

  const handleCopy = () => {
    if (onCopy) {
      onCopy(record);
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const renderInputSummary = () => {
    const keys = Object.keys(record.input);
    if (keys.length === 0) return 'No input';
    if (keys.length === 1) {
      const value = record.input[keys[0]];
      const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
      return valueStr.length > 50 ? `${valueStr.substring(0, 50)}...` : valueStr;
    }
    return `${keys.length} parameters`;
  };

  const renderOutputSummary = () => {
    if (record.error) return record.error.message;
    if (!record.output) return 'No output';
    const outputStr = typeof record.output === 'string' ? record.output : JSON.stringify(record.output);
    return outputStr.length > 50 ? `${outputStr.substring(0, 50)}...` : outputStr;
  };

  return (
    <div className={cn('border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <div
        className="p-3 bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-3">
          {/* Expand/Collapse Icon */}
          <button
            className="mt-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {/* Tool Icon */}
          <div className="text-2xl" title={displayName}>
            {metadata.icon}
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">{displayName}</h3>
              <span className={cn('px-2 py-0.5 text-xs rounded-full font-medium', statusColor)}>
                {statusIcon} {record.status}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span>{formatTimestamp(record.timestamp)}</span>
              {record.duration !== null && <span>⏱ {formatDuration(record.duration)}</span>}
            </div>

            {!isExpanded && (
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-300 line-clamp-1">
                {record.status === 'error' ? renderOutputSummary() : renderInputSummary()}
              </p>
            )}
          </div>

          {/* Copy Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="Copy to clipboard"
          >
            {isCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 space-y-3">
          {/* Input */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Input</h4>
            <pre className="text-xs bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto">
              {JSON.stringify(record.input, null, 2)}
            </pre>
          </div>

          {/* Output */}
          {record.status === 'success' && record.output && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Output</h4>
              <pre className="text-xs bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto max-h-64 overflow-y-auto">
                {typeof record.output === 'string' ? record.output : JSON.stringify(record.output, null, 2)}
              </pre>
            </div>
          )}

          {/* Error */}
          {record.error && (
            <div>
              <h4 className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Error</h4>
              <div className="text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800">
                <p className="font-medium text-red-700 dark:text-red-300">{record.error.message}</p>
                {record.error.code && (
                  <p className="mt-1 text-red-600 dark:text-red-400">Code: {record.error.code}</p>
                )}
                {record.error.stack && (
                  <pre className="mt-2 text-xs text-red-600 dark:text-red-400 overflow-x-auto">
                    {record.error.stack}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500 dark:text-gray-400">ID:</span>
                <span className="ml-2 text-gray-700 dark:text-gray-300 font-mono">{record.id.substring(0, 8)}</span>
              </div>
              {record.conversationId && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Conversation:</span>
                  <span className="ml-2 text-gray-700 dark:text-gray-300 font-mono">
                    {record.conversationId.substring(0, 8)}
                  </span>
                </div>
              )}
              {record.messageId && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Message:</span>
                  <span className="ml-2 text-gray-700 dark:text-gray-300 font-mono">
                    {record.messageId.substring(0, 8)}
                  </span>
                </div>
              )}
              <div>
                <span className="text-gray-500 dark:text-gray-400">Category:</span>
                <span className="ml-2 text-gray-700 dark:text-gray-300">{metadata.category}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * ToolHistory Component (v3.7.0 Phase 3)
 * Main tool call history panel with filtering, search, and export
 */

import { useState, useEffect, useMemo } from 'react';
import { History, TrendingUp, AlertCircle } from 'lucide-react';
import { ToolHistoryItem } from './ToolHistoryItem';
import { ToolHistoryFilter } from './ToolHistoryFilter';
import { ToolHistoryExport } from './ToolHistoryExport';
import type {
  ToolCallRecord,
  ToolHistoryFilter as FilterType,
  ToolHistorySortOptions,
  ToolStats,
} from '../../../shared/types/tool-history.types';
import { cn } from '../../lib/utils';

export interface ToolHistoryProps {
  records: ToolCallRecord[];
  onRefresh?: () => void;
  onClearHistory?: () => void;
  className?: string;
}

export function ToolHistory({ records, onRefresh, onClearHistory, className }: ToolHistoryProps) {
  const [filter, setFilter] = useState<FilterType>({});
  const [sortOptions, setSortOptions] = useState<ToolHistorySortOptions>({
    sortBy: 'timestamp',
    order: 'desc',
  });
  const [showExport, setShowExport] = useState(false);

  // Get unique tool names from records
  const availableTools = useMemo(() => {
    const tools = new Set(records.map((r) => r.toolName));
    return Array.from(tools).sort();
  }, [records]);

  // Filter and sort records
  const filteredRecords = useMemo(() => {
    let filtered = [...records];

    // Apply tool name filter
    if (filter.toolNames?.length) {
      filtered = filtered.filter((r) => filter.toolNames!.includes(r.toolName));
    }

    // Apply status filter
    if (filter.status?.length) {
      filtered = filtered.filter((r) => filter.status!.includes(r.status));
    }

    // Apply date range filter
    if (filter.dateFrom) {
      filtered = filtered.filter((r) => r.timestamp >= filter.dateFrom!);
    }
    if (filter.dateTo) {
      filtered = filtered.filter((r) => r.timestamp <= filter.dateTo!);
    }

    // Apply search query
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filtered = filtered.filter((r) => {
        const inputStr = JSON.stringify(r.input).toLowerCase();
        const outputStr = r.output ? JSON.stringify(r.output).toLowerCase() : '';
        const errorStr = r.error ? r.error.message.toLowerCase() : '';
        return (
          r.toolName.toLowerCase().includes(query) ||
          r.displayName.toLowerCase().includes(query) ||
          inputStr.includes(query) ||
          outputStr.includes(query) ||
          errorStr.includes(query)
        );
      });
    }

    // Apply conversation filter
    if (filter.conversationId) {
      filtered = filtered.filter((r) => r.conversationId === filter.conversationId);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortOptions.sortBy) {
        case 'timestamp':
          comparison = a.timestamp - b.timestamp;
          break;
        case 'duration':
          comparison = (a.duration || 0) - (b.duration || 0);
          break;
        case 'toolName':
          comparison = a.toolName.localeCompare(b.toolName);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortOptions.order === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [records, filter, sortOptions]);

  // Calculate statistics
  const stats = useMemo(() => {
    const toolStatsMap = new Map<string, ToolStats>();

    for (const record of records) {
      if (!toolStatsMap.has(record.toolName)) {
        toolStatsMap.set(record.toolName, {
          toolName: record.toolName,
          totalCalls: 0,
          successCount: 0,
          errorCount: 0,
          averageDuration: 0,
          lastUsed: 0,
        });
      }

      const stats = toolStatsMap.get(record.toolName)!;
      stats.totalCalls++;
      if (record.status === 'success') stats.successCount++;
      if (record.status === 'error') stats.errorCount++;
      if (record.timestamp > stats.lastUsed) stats.lastUsed = record.timestamp;
    }

    // Calculate average duration
    for (const stats of toolStatsMap.values()) {
      const durations = records
        .filter((r) => r.toolName === stats.toolName && r.duration !== null)
        .map((r) => r.duration!);
      if (durations.length > 0) {
        stats.averageDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      }
    }

    return Array.from(toolStatsMap.values());
  }, [records]);

  const totalCalls = records.length;
  const successRate = totalCalls > 0 ? (records.filter((r) => r.status === 'success').length / totalCalls) * 100 : 0;

  const handleCopy = (record: ToolCallRecord) => {
    const text = JSON.stringify(record, null, 2);
    navigator.clipboard.writeText(text);
  };

  return (
    <div className={cn('flex flex-col h-full bg-gray-50 dark:bg-gray-900', className)}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <History className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tool History</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {totalCalls} total call{totalCalls !== 1 ? 's' : ''} · {successRate.toFixed(1)}% success rate
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowExport(!showExport)}
              className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              {showExport ? 'Hide Export' : 'Export'}
            </button>
            {onClearHistory && (
              <button
                onClick={onClearHistory}
                className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Statistics */}
        {stats.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <div className="flex-1 flex flex-wrap gap-4 text-xs">
              {stats.slice(0, 3).map((stat) => (
                <div key={stat.toolName}>
                  <span className="text-gray-600 dark:text-gray-400">{stat.toolName}:</span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-gray-100">
                    {stat.totalCalls} call{stat.totalCalls !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
              {stats.length > 3 && (
                <span className="text-gray-500 dark:text-gray-400">+{stats.length - 3} more</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Export Panel */}
      {showExport && (
        <div className="flex-shrink-0 p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <ToolHistoryExport records={filteredRecords} />
        </div>
      )}

      {/* Filter Panel */}
      <div className="flex-shrink-0 p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <ToolHistoryFilter filter={filter} onFilterChange={setFilter} availableTools={availableTools} />
      </div>

      {/* Records List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredRecords.length > 0 ? (
          filteredRecords.map((record) => <ToolHistoryItem key={record.id} record={record} onCopy={handleCopy} />)
        ) : records.length > 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400">No records match your filters</p>
            <button
              onClick={() => setFilter({})}
              className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <History className="h-12 w-12 text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400">No tool calls yet</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Tool calls will appear here when the AI uses tools
            </p>
          </div>
        )}
      </div>

      {/* Footer with Count */}
      {filteredRecords.length > 0 && (
        <div className="flex-shrink-0 px-4 py-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 text-center">
          Showing {filteredRecords.length} of {totalCalls} record{totalCalls !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

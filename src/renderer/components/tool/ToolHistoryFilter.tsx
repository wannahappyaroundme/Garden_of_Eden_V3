/**
 * ToolHistoryFilter Component (v3.7.0 Phase 3)
 * Filter and search controls for tool history
 */

import { useState } from 'react';
import { Search, Filter, X, Calendar } from 'lucide-react';
import type { ToolHistoryFilter, ToolCallStatus } from '../../../shared/types/tool-history.types';
import { getToolDisplayName, getToolMetadata } from '../../../shared/types/tool-history.types';
import { cn } from '../../lib/utils';

export interface ToolHistoryFilterProps {
  filter: ToolHistoryFilter;
  onFilterChange: (filter: ToolHistoryFilter) => void;
  availableTools: string[];
  className?: string;
}

const STATUS_OPTIONS: ToolCallStatus[] = ['success', 'error', 'running', 'pending', 'cancelled'];

export function ToolHistoryFilter({ filter, onFilterChange, availableTools, className }: ToolHistoryFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchInput, setSearchInput] = useState(filter.searchQuery || '');

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    onFilterChange({ ...filter, searchQuery: value || undefined });
  };

  const handleToolToggle = (toolName: string) => {
    const currentTools = filter.toolNames || [];
    const newTools = currentTools.includes(toolName)
      ? currentTools.filter((t) => t !== toolName)
      : [...currentTools, toolName];

    onFilterChange({
      ...filter,
      toolNames: newTools.length > 0 ? newTools : undefined,
    });
  };

  const handleStatusToggle = (status: ToolCallStatus) => {
    const currentStatuses = filter.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];

    onFilterChange({
      ...filter,
      status: newStatuses.length > 0 ? newStatuses : undefined,
    });
  };

  const handleDateFromChange = (dateStr: string) => {
    const timestamp = dateStr ? new Date(dateStr).getTime() : undefined;
    onFilterChange({ ...filter, dateFrom: timestamp });
  };

  const handleDateToChange = (dateStr: string) => {
    const timestamp = dateStr ? new Date(dateStr).getTime() : undefined;
    onFilterChange({ ...filter, dateTo: timestamp });
  };

  const clearAllFilters = () => {
    setSearchInput('');
    onFilterChange({});
  };

  const hasActiveFilters =
    filter.toolNames?.length ||
    filter.status?.length ||
    filter.dateFrom ||
    filter.dateTo ||
    filter.searchQuery;

  const activeFilterCount =
    (filter.toolNames?.length || 0) +
    (filter.status?.length || 0) +
    (filter.dateFrom ? 1 : 0) +
    (filter.dateTo ? 1 : 0) +
    (filter.searchQuery ? 1 : 0);

  return (
    <div className={cn('space-y-3', className)}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search tool history..."
          className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {searchInput && (
          <button
            onClick={() => handleSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">{activeFilterCount}</span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
          {/* Tool Filter */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Tools</h4>
            <div className="flex flex-wrap gap-2">
              {availableTools.map((toolName) => {
                const metadata = getToolMetadata(toolName);
                const isSelected = filter.toolNames?.includes(toolName);
                return (
                  <button
                    key={toolName}
                    onClick={() => handleToolToggle(toolName)}
                    className={cn(
                      'px-3 py-1.5 text-xs rounded-full border transition-colors',
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'
                    )}
                  >
                    <span className="mr-1">{metadata.icon}</span>
                    {getToolDisplayName(toolName)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Status</h4>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((status) => {
                const isSelected = filter.status?.includes(status);
                return (
                  <button
                    key={status}
                    onClick={() => handleStatusToggle(status)}
                    className={cn(
                      'px-3 py-1.5 text-xs rounded-full border transition-colors capitalize',
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'
                    )}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Date Range
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From</label>
                <input
                  type="date"
                  value={filter.dateFrom ? new Date(filter.dateFrom).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleDateFromChange(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">To</label>
                <input
                  type="date"
                  value={filter.dateTo ? new Date(filter.dateTo).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleDateToChange(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

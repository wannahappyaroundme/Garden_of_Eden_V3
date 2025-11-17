/**
 * Tool History Types (v3.7.0 Phase 3)
 * Type definitions for tool call history tracking
 */

/**
 * Tool call execution status
 */
export type ToolCallStatus = 'pending' | 'running' | 'success' | 'error' | 'cancelled';

/**
 * Tool call record
 */
export interface ToolCallRecord {
  id: string;
  toolName: string;
  displayName: string;
  timestamp: number;
  duration: number | null; // milliseconds, null if still running
  status: ToolCallStatus;
  input: Record<string, any>;
  output: any;
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
  conversationId?: string;
  messageId?: string;
}

/**
 * Tool call statistics for a specific tool
 */
export interface ToolStats {
  toolName: string;
  totalCalls: number;
  successCount: number;
  errorCount: number;
  averageDuration: number; // milliseconds
  lastUsed: number; // timestamp
}

/**
 * Filter options for tool history
 */
export interface ToolHistoryFilter {
  toolNames?: string[];
  status?: ToolCallStatus[];
  dateFrom?: number; // timestamp
  dateTo?: number; // timestamp
  searchQuery?: string;
  conversationId?: string;
}

/**
 * Sort options for tool history
 */
export type ToolHistorySortBy = 'timestamp' | 'duration' | 'toolName' | 'status';
export type ToolHistorySortOrder = 'asc' | 'desc';

export interface ToolHistorySortOptions {
  sortBy: ToolHistorySortBy;
  order: ToolHistorySortOrder;
}

/**
 * Pagination options
 */
export interface ToolHistoryPagination {
  limit: number;
  offset: number;
}

/**
 * Tool history query result
 */
export interface ToolHistoryQueryResult {
  records: ToolCallRecord[];
  total: number;
  hasMore: boolean;
}

/**
 * Export format options
 */
export type ToolHistoryExportFormat = 'json' | 'csv';

export interface ToolHistoryExportOptions {
  format: ToolHistoryExportFormat;
  filter?: ToolHistoryFilter;
  includeErrors?: boolean;
  includeInput?: boolean;
  includeOutput?: boolean;
}

/**
 * Tool call metadata for UI display
 */
export interface ToolCallMetadata {
  icon: string; // emoji or icon name
  color: string; // tailwind color class
  category: 'web' | 'file' | 'system' | 'calculation' | 'other';
  description: string;
}

/**
 * Map of tool names to metadata
 */
export const TOOL_METADATA: Record<string, ToolCallMetadata> = {
  web_search: {
    icon: '🔍',
    color: 'blue',
    category: 'web',
    description: 'Search the web for information',
  },
  fetch_url: {
    icon: '🌐',
    color: 'indigo',
    category: 'web',
    description: 'Fetch content from a URL',
  },
  read_file: {
    icon: '📖',
    color: 'green',
    category: 'file',
    description: 'Read file contents',
  },
  write_file: {
    icon: '✍️',
    color: 'emerald',
    category: 'file',
    description: 'Write content to a file',
  },
  get_system_info: {
    icon: '💻',
    color: 'purple',
    category: 'system',
    description: 'Get system information',
  },
  calculate: {
    icon: '🔢',
    color: 'orange',
    category: 'calculation',
    description: 'Perform mathematical calculations',
  },
};

/**
 * Get display name for a tool
 */
export function getToolDisplayName(toolName: string): string {
  const names: Record<string, string> = {
    web_search: 'Web Search',
    fetch_url: 'URL Fetch',
    read_file: 'Read File',
    write_file: 'Write File',
    get_system_info: 'System Info',
    calculate: 'Calculator',
  };
  return names[toolName] || toolName;
}

/**
 * Get tool metadata with fallback
 */
export function getToolMetadata(toolName: string): ToolCallMetadata {
  return (
    TOOL_METADATA[toolName] || {
      icon: '🔧',
      color: 'gray',
      category: 'other',
      description: 'Unknown tool',
    }
  );
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number | null): string {
  if (ms === null) return 'Running...';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

/**
 * Format timestamp in human-readable format
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - timestamp;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get status color for UI display
 */
export function getStatusColor(status: ToolCallStatus): string {
  switch (status) {
    case 'pending':
      return 'text-gray-500 bg-gray-100 dark:bg-gray-800';
    case 'running':
      return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    case 'success':
      return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    case 'error':
      return 'text-red-600 bg-red-100 dark:bg-red-900/30';
    case 'cancelled':
      return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
  }
}

/**
 * Get status icon
 */
export function getStatusIcon(status: ToolCallStatus): string {
  switch (status) {
    case 'pending':
      return '⏳';
    case 'running':
      return '⏱️';
    case 'success':
      return '✅';
    case 'error':
      return '❌';
    case 'cancelled':
      return '🚫';
  }
}

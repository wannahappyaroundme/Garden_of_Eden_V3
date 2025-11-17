/**
 * Tool Calling Type Definitions (v3.7.0)
 * Types for tool execution visualization and tracking
 */

export type ToolStatus = 'loading' | 'success' | 'error';

export interface ToolCall {
  id: string;
  toolName: string;
  displayName: string;
  status: ToolStatus;
  startTime: number;
  endTime?: number;
  executionTimeMs?: number;
  input?: Record<string, any>;
  output?: any;
  error?: string;
}

export interface ToolCallEvent {
  messageId: string;
  toolCall: ToolCall;
}

// Tool execution events (emitted from backend)
export interface ToolExecutionStartEvent {
  messageId: string;
  toolName: string;
  input: Record<string, any>;
}

export interface ToolExecutionProgressEvent {
  messageId: string;
  toolName: string;
  progress: number; // 0-100
  message?: string;
}

export interface ToolExecutionCompleteEvent {
  messageId: string;
  toolName: string;
  output: any;
  executionTimeMs: number;
}

export interface ToolExecutionErrorEvent {
  messageId: string;
  toolName: string;
  error: string;
}

// Tool display names mapping
export const TOOL_DISPLAY_NAMES: Record<string, string> = {
  web_search: 'Web Search',
  fetch_url: 'Fetch URL',
  read_file: 'Read File',
  write_file: 'Write File',
  get_system_info: 'System Info',
  calculate: 'Calculator',
};

// Tool icons mapping (using lucide-react icon names)
export const TOOL_ICONS: Record<string, string> = {
  web_search: 'Search',
  fetch_url: 'Globe',
  read_file: 'FileText',
  write_file: 'FilePlus',
  get_system_info: 'Cpu',
  calculate: 'Calculator',
};

// Tool color themes
export const TOOL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  web_search: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/20',
  },
  fetch_url: {
    bg: 'bg-green-500/10',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-500/20',
  },
  read_file: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/20',
  },
  write_file: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-500/20',
  },
  get_system_info: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-500/20',
  },
  calculate: {
    bg: 'bg-pink-500/10',
    text: 'text-pink-600 dark:text-pink-400',
    border: 'border-pink-500/20',
  },
};

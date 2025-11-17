/**
 * Tool Settings Type Definitions (v3.7.0 Phase 2)
 * Types for tool configuration and user preferences
 */

// Individual tool settings
export interface WebSearchSettings {
  enabled: boolean;
  maxResults: number;
  engine: 'duckduckgo' | 'searx';
  rateLimit: number; // seconds between searches
}

export interface UrlFetchSettings {
  enabled: boolean;
  timeout: number; // milliseconds
  maxContentSize: number; // bytes
  respectRobotsTxt: boolean;
}

export interface FileOperationsSettings {
  readEnabled: boolean;
  writeEnabled: boolean;
  allowedPaths: string[];
  requireConfirmation: boolean;
}

export interface SystemInfoSettings {
  enabled: boolean;
  privacyLevel: 'minimal' | 'standard' | 'full';
}

export interface CalculatorSettings {
  enabled: boolean;
  precision: number; // decimal places
}

// Master tool settings
export interface ToolSettings {
  globalEnabled: boolean; // Master toggle for all tools
  webSearch: WebSearchSettings;
  urlFetch: UrlFetchSettings;
  fileOperations: FileOperationsSettings;
  systemInfo: SystemInfoSettings;
  calculator: CalculatorSettings;
}

// Tool privacy information
export interface ToolPrivacyInfo {
  toolName: string;
  displayName: string;
  dataAccess: string[]; // What data this tool can access
  privacyLevel: 'low' | 'medium' | 'high'; // Privacy risk level
  requiresPermission: boolean;
}

// Tool usage statistics
export interface ToolUsageStats {
  toolName: string;
  displayName: string;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageExecutionTime: number; // milliseconds
  lastUsed?: number; // timestamp
}

// Default settings
export const DEFAULT_TOOL_SETTINGS: ToolSettings = {
  globalEnabled: true,
  webSearch: {
    enabled: false, // Disabled by default for privacy
    maxResults: 5,
    engine: 'duckduckgo',
    rateLimit: 2, // 2 seconds between searches
  },
  urlFetch: {
    enabled: false, // Disabled by default for privacy
    timeout: 10000, // 10 seconds
    maxContentSize: 1048576, // 1 MB
    respectRobotsTxt: true,
  },
  fileOperations: {
    readEnabled: true,
    writeEnabled: true,
    allowedPaths: [],
    requireConfirmation: false,
  },
  systemInfo: {
    enabled: true,
    privacyLevel: 'standard',
  },
  calculator: {
    enabled: true,
    precision: 2,
  },
};

// Tool privacy information database
export const TOOL_PRIVACY_INFO: Record<string, ToolPrivacyInfo> = {
  web_search: {
    toolName: 'web_search',
    displayName: 'Web Search',
    dataAccess: [
      'Search queries you enter',
      'Search results from DuckDuckGo/SearX',
      'Timestamps of searches',
    ],
    privacyLevel: 'medium',
    requiresPermission: true,
  },
  fetch_url: {
    toolName: 'fetch_url',
    displayName: 'Fetch URL',
    dataAccess: [
      'URLs you request',
      'Website content fetched',
      'Your IP address (visible to websites)',
    ],
    privacyLevel: 'medium',
    requiresPermission: true,
  },
  read_file: {
    toolName: 'read_file',
    displayName: 'Read File',
    dataAccess: [
      'File paths on your computer',
      'File contents read',
      'File metadata (size, modified date)',
    ],
    privacyLevel: 'high',
    requiresPermission: false,
  },
  write_file: {
    toolName: 'write_file',
    displayName: 'Write File',
    dataAccess: [
      'File paths on your computer',
      'Content written to files',
      'File creation/modification times',
    ],
    privacyLevel: 'high',
    requiresPermission: false,
  },
  get_system_info: {
    toolName: 'get_system_info',
    displayName: 'System Info',
    dataAccess: [
      'CPU model and core count',
      'Total and available RAM',
      'GPU information (if available)',
      'Operating system version',
    ],
    privacyLevel: 'low',
    requiresPermission: false,
  },
  calculate: {
    toolName: 'calculate',
    displayName: 'Calculator',
    dataAccess: [
      'Math expressions you enter',
      'Calculation results',
    ],
    privacyLevel: 'low',
    requiresPermission: false,
  },
};

// Settings validation
export function validateToolSettings(settings: Partial<ToolSettings>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate web search settings
  if (settings.webSearch) {
    if (settings.webSearch.maxResults < 1 || settings.webSearch.maxResults > 20) {
      errors.push('Web search max results must be between 1 and 20');
    }
    if (settings.webSearch.rateLimit < 0 || settings.webSearch.rateLimit > 60) {
      errors.push('Web search rate limit must be between 0 and 60 seconds');
    }
  }

  // Validate URL fetch settings
  if (settings.urlFetch) {
    if (settings.urlFetch.timeout < 1000 || settings.urlFetch.timeout > 60000) {
      errors.push('URL fetch timeout must be between 1 and 60 seconds');
    }
    if (
      settings.urlFetch.maxContentSize < 10240 ||
      settings.urlFetch.maxContentSize > 10485760
    ) {
      errors.push('URL fetch max content size must be between 10 KB and 10 MB');
    }
  }

  // Validate calculator settings
  if (settings.calculator) {
    if (settings.calculator.precision < 0 || settings.calculator.precision > 10) {
      errors.push('Calculator precision must be between 0 and 10 decimal places');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

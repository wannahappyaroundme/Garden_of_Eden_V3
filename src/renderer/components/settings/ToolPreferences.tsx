/**
 * ToolPreferences Component (v3.7.0 Phase 2)
 * Per-tool configuration panel with specific settings
 */

import { useState } from 'react';
import type {
  WebSearchSettings,
  UrlFetchSettings,
  FileOperationsSettings,
  SystemInfoSettings,
  CalculatorSettings,
} from '../../../shared/types/tool-settings.types';
import { cn } from '../../lib/utils';

type ToolSpecificSettings =
  | WebSearchSettings
  | UrlFetchSettings
  | FileOperationsSettings
  | SystemInfoSettings
  | CalculatorSettings;

export interface ToolPreferencesProps {
  toolName: string;
  settings: ToolSpecificSettings;
  onUpdate: (toolName: string, settings: Partial<ToolSpecificSettings>) => void;
  className?: string;
}

export function ToolPreferences({
  toolName,
  settings,
  onUpdate,
  className,
}: ToolPreferencesProps) {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleChange = (key: string, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onUpdate(toolName, newSettings);
  };

  const renderWebSearchSettings = (settings: WebSearchSettings) => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Search Engine
        </label>
        <select
          value={settings.engine}
          onChange={(e) => handleChange('engine', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="duckduckgo">DuckDuckGo (Privacy-focused)</option>
          <option value="searx">SearX (Meta-search)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Max Results: {settings.maxResults}
        </label>
        <input
          type="range"
          min="1"
          max="20"
          value={settings.maxResults}
          onChange={(e) => handleChange('maxResults', parseInt(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1</span>
          <span>20</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Rate Limit: {settings.rateLimit}s between searches
        </label>
        <input
          type="range"
          min="0"
          max="60"
          value={settings.rateLimit}
          onChange={(e) => handleChange('rateLimit', parseInt(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0s (No limit)</span>
          <span>60s</span>
        </div>
      </div>
    </div>
  );

  const renderUrlFetchSettings = (settings: UrlFetchSettings) => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Timeout: {(settings.timeout / 1000).toFixed(0)}s
        </label>
        <input
          type="range"
          min="1000"
          max="60000"
          step="1000"
          value={settings.timeout}
          onChange={(e) => handleChange('timeout', parseInt(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1s</span>
          <span>60s</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Max Content Size: {(settings.maxContentSize / 1048576).toFixed(1)} MB
        </label>
        <input
          type="range"
          min="10240"
          max="10485760"
          step="10240"
          value={settings.maxContentSize}
          onChange={(e) => handleChange('maxContentSize', parseInt(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>10 KB</span>
          <span>10 MB</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="respectRobotsTxt"
          checked={settings.respectRobotsTxt}
          onChange={(e) => handleChange('respectRobotsTxt', e.target.checked)}
          className="rounded"
        />
        <label htmlFor="respectRobotsTxt" className="text-sm text-gray-700 dark:text-gray-300">
          Respect robots.txt
        </label>
      </div>
    </div>
  );

  const renderFileOperationsSettings = (settings: FileOperationsSettings) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="readEnabled"
          checked={settings.readEnabled}
          onChange={(e) => handleChange('readEnabled', e.target.checked)}
          className="rounded"
        />
        <label htmlFor="readEnabled" className="text-sm text-gray-700 dark:text-gray-300">
          Allow file reading
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="writeEnabled"
          checked={settings.writeEnabled}
          onChange={(e) => handleChange('writeEnabled', e.target.checked)}
          className="rounded"
        />
        <label htmlFor="writeEnabled" className="text-sm text-gray-700 dark:text-gray-300">
          Allow file writing
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="requireConfirmation"
          checked={settings.requireConfirmation}
          onChange={(e) => handleChange('requireConfirmation', e.target.checked)}
          className="rounded"
        />
        <label htmlFor="requireConfirmation" className="text-sm text-gray-700 dark:text-gray-300">
          Require confirmation before file operations
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Allowed Paths
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Leave empty to allow all paths. Add specific directories to restrict access.
        </p>
        <textarea
          value={settings.allowedPaths.join('\n')}
          onChange={(e) =>
            handleChange(
              'allowedPaths',
              e.target.value.split('\n').filter((p) => p.trim())
            )
          }
          placeholder="/Users/username/Documents&#10;/Users/username/Projects"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-xs"
          rows={4}
        />
      </div>
    </div>
  );

  const renderSystemInfoSettings = (settings: SystemInfoSettings) => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Privacy Level
        </label>
        <select
          value={settings.privacyLevel}
          onChange={(e) => handleChange('privacyLevel', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="minimal">Minimal (CPU cores, RAM only)</option>
          <option value="standard">Standard (CPU, RAM, GPU)</option>
          <option value="full">Full (All system information)</option>
        </select>
      </div>
    </div>
  );

  const renderCalculatorSettings = (settings: CalculatorSettings) => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Decimal Precision: {settings.precision} places
        </label>
        <input
          type="range"
          min="0"
          max="10"
          value={settings.precision}
          onChange={(e) => handleChange('precision', parseInt(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0 (Integer)</span>
          <span>10</span>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => {
    switch (toolName) {
      case 'web_search':
        return renderWebSearchSettings(localSettings as WebSearchSettings);
      case 'fetch_url':
        return renderUrlFetchSettings(localSettings as UrlFetchSettings);
      case 'read_file':
      case 'write_file':
        return renderFileOperationsSettings(localSettings as FileOperationsSettings);
      case 'get_system_info':
        return renderSystemInfoSettings(localSettings as SystemInfoSettings);
      case 'calculate':
        return renderCalculatorSettings(localSettings as CalculatorSettings);
      default:
        return <p className="text-sm text-gray-500">No preferences available for this tool.</p>;
    }
  };

  return <div className={cn('p-4 bg-gray-50 dark:bg-gray-800 rounded-lg', className)}>{renderSettings()}</div>;
}

/**
 * ToolsSettings Component (v3.7.0 Phase 2)
 * Main settings page for tool configuration
 */

import { useState, useEffect } from 'react';
import { Settings, ChevronDown, ChevronRight } from 'lucide-react';
import { ToolToggle } from './ToolToggle';
import { ToolPreferences } from './ToolPreferences';
import { ToolPrivacyInfo } from './ToolPrivacyInfo';
import type { ToolSettings } from '../../../shared/types/tool-settings.types';
import {
  DEFAULT_TOOL_SETTINGS,
  TOOL_PRIVACY_INFO,
} from '../../../shared/types/tool-settings.types';
import { cn } from '../../lib/utils';

export interface ToolsSettingsProps {
  className?: string;
}

// Tool configuration
const TOOLS = [
  { name: 'web_search', settingsKey: 'webSearch' as const },
  { name: 'fetch_url', settingsKey: 'urlFetch' as const },
  { name: 'read_file', settingsKey: 'fileOperations' as const, sharedSettings: 'write_file' },
  { name: 'write_file', settingsKey: 'fileOperations' as const, sharedSettings: 'read_file' },
  { name: 'get_system_info', settingsKey: 'systemInfo' as const },
  { name: 'calculate', settingsKey: 'calculator' as const },
];

export function ToolsSettings({ className }: ToolsSettingsProps) {
  const [settings, setSettings] = useState<ToolSettings>(DEFAULT_TOOL_SETTINGS);
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load settings from backend
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // TODO: Load from backend when settings service is implemented
        // const loadedSettings = await window.api.invoke('settings:get-tool-settings', {});
        // setSettings(loadedSettings);
        console.log('Loading tool settings...');
      } catch (error) {
        console.error('Failed to load tool settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Save settings to backend
  const saveSettings = async (newSettings: ToolSettings) => {
    setIsSaving(true);
    try {
      // TODO: Save to backend when settings service is implemented
      // await window.api.invoke('settings:update-tool-settings', { settings: newSettings });
      console.log('Saving tool settings:', newSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save tool settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGlobalToggle = async (enabled: boolean) => {
    const newSettings = { ...settings, globalEnabled: enabled };
    await saveSettings(newSettings);
  };

  const handleToolToggle = async (toolName: string, enabled: boolean) => {
    const tool = TOOLS.find((t) => t.name === toolName);
    if (!tool) return;

    const newSettings = {
      ...settings,
      [tool.settingsKey]: {
        ...settings[tool.settingsKey],
        enabled,
      },
    };

    await saveSettings(newSettings);
  };

  const handlePreferencesUpdate = async (toolName: string, toolSettings: any) => {
    const tool = TOOLS.find((t) => t.name === toolName);
    if (!tool) return;

    const newSettings = {
      ...settings,
      [tool.settingsKey]: {
        ...settings[tool.settingsKey],
        ...toolSettings,
      },
    };

    await saveSettings(newSettings);
  };

  const toggleExpanded = (toolName: string) => {
    setExpandedTool(expandedTool === toolName ? null : toolName);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
        <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Tool Settings
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure which tools the AI can use and how they behave
          </p>
        </div>
      </div>

      {/* Global Enable/Disable */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">
              Enable All Tools
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Master switch to enable or disable all tool calling functionality
            </p>
          </div>
          <button
            onClick={() => handleGlobalToggle(!settings.globalEnabled)}
            disabled={isSaving}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              settings.globalEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                settings.globalEnabled ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
      </div>

      {/* Individual Tool Settings */}
      <div className="space-y-3">
        {TOOLS.map((tool) => {
          // Skip duplicate settings for shared tools (read_file and write_file)
          if (tool.name === 'write_file') return null;

          const toolSettings = settings[tool.settingsKey];
          const privacyInfo = TOOL_PRIVACY_INFO[tool.name];
          const isExpanded = expandedTool === tool.name;

          // Determine enabled state based on tool settings type
          const enabled = tool.settingsKey === 'fileOperations'
            ? (toolSettings as typeof settings.fileOperations).readEnabled
            : 'enabled' in toolSettings ? toolSettings.enabled : false;

          return (
            <div key={tool.name} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              {/* Tool Header */}
              <div className="p-4 bg-white dark:bg-gray-800">
                <ToolToggle
                  toolName={tool.name}
                  enabled={enabled}
                  onToggle={handleToolToggle}
                  requiresPermission={privacyInfo?.requiresPermission}
                />

                {/* Expand/Collapse Button */}
                <button
                  onClick={() => toggleExpanded(tool.name)}
                  className="mt-3 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {isExpanded ? (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <ChevronRight className="h-4 w-4" />
                      Show Details
                    </>
                  )}
                </button>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 space-y-4">
                  {/* Privacy Information */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Privacy & Data Access
                    </h4>
                    <ToolPrivacyInfo toolName={tool.name} />
                  </div>

                  {/* Tool Preferences */}
                  {toolSettings && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Preferences
                      </h4>
                      <ToolPreferences
                        toolName={tool.name}
                        settings={toolSettings}
                        onUpdate={handlePreferencesUpdate}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Save Indicator */}
      {isSaving && (
        <div className="fixed bottom-4 right-4 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg">
          Saving settings...
        </div>
      )}
    </div>
  );
}

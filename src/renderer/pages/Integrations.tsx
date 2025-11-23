/**
 * Integrations Page
 * Manage webhooks and external service integrations
 */

import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { api, type WebhookRecord, type CreateWebhookArgs } from '../lib/tauri-api';
import { toast } from '../stores/toast.store';

interface IntegrationsProps {
  onClose: () => void;
}

type PresetType = 'slack' | 'discord' | 'notion' | 'custom';

interface PresetInfo {
  name: string;
  icon: string;
  description: string;
  urlPlaceholder: string;
  docsUrl: string;
}

const PRESETS: Record<PresetType, PresetInfo> = {
  slack: {
    name: 'Slack',
    icon: '💬',
    description: 'Send notifications to Slack channels',
    urlPlaceholder: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
    docsUrl: 'https://api.slack.com/messaging/webhooks',
  },
  discord: {
    name: 'Discord',
    icon: '🎮',
    description: 'Post messages to Discord channels',
    urlPlaceholder: 'https://discord.com/api/webhooks/YOUR/WEBHOOK/URL',
    docsUrl: 'https://discord.com/developers/docs/resources/webhook',
  },
  notion: {
    name: 'Notion',
    icon: '📝',
    description: 'Create pages in Notion databases',
    urlPlaceholder: 'https://api.notion.com/v1/pages',
    docsUrl: 'https://developers.notion.com/reference/post-page',
  },
  custom: {
    name: 'Custom Webhook',
    icon: '⚙️',
    description: 'Configure a custom HTTP webhook',
    urlPlaceholder: 'https://your-api.com/webhook',
    docsUrl: '',
  },
};

export function Integrations({ onClose }: IntegrationsProps) {
  // TODO: Use translation when needed
  // const { t } = useTranslation();
  const [webhooks, setWebhooks] = useState<WebhookRecord[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PresetType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formMethod, setFormMethod] = useState('POST');
  const [formHeaders, setFormHeaders] = useState('');
  const [formTimeout, setFormTimeout] = useState(5000);
  const [formRetries, setFormRetries] = useState(3);

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      const hooks = await api.listWebhooks();
      setWebhooks(hooks);
    } catch (error) {
      console.error('Failed to load webhooks:', error);
      toast.error('Failed to load integrations');
    }
  };

  const handleAddWebhook = async () => {
    if (!formName.trim() || !formUrl.trim()) {
      toast.error('Name and URL are required');
      return;
    }

    try {
      setIsLoading(true);

      // Parse headers if provided
      let headers: Record<string, string> = {};
      if (formHeaders.trim()) {
        try {
          headers = JSON.parse(formHeaders);
        } catch {
          toast.error('Invalid JSON in headers field');
          return;
        }
      }

      // Add authorization header for Notion
      if (selectedPreset === 'notion' && !headers['Authorization']) {
        toast.error('Notion requires an Authorization header with your integration token');
        return;
      }

      const args: CreateWebhookArgs = {
        name: formName,
        preset: selectedPreset || 'custom',
        url: formUrl,
        method: formMethod,
        headers,
        timeout: formTimeout,
        retries: formRetries,
      };

      await api.registerWebhook(args);
      toast.success(`${formName} integration added successfully`);

      // Reset form
      setFormName('');
      setFormUrl('');
      setFormMethod('POST');
      setFormHeaders('');
      setFormTimeout(5000);
      setFormRetries(3);
      setShowAddDialog(false);
      setSelectedPreset(null);

      // Reload webhooks
      await loadWebhooks();
    } catch (error: any) {
      console.error('Failed to add webhook:', error);
      toast.error(`Failed to add integration: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleWebhook = async (name: string, enabled: boolean) => {
    try {
      await api.toggleWebhook(name, enabled);
      toast.success(enabled ? 'Integration enabled' : 'Integration disabled');
      await loadWebhooks();
    } catch (error: any) {
      console.error('Failed to toggle webhook:', error);
      toast.error('Failed to toggle integration');
    }
  };

  const handleDeleteWebhook = async (name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await api.deleteWebhook(name);
      toast.success('Integration deleted');
      await loadWebhooks();
    } catch (error: any) {
      console.error('Failed to delete webhook:', error);
      toast.error('Failed to delete integration');
    }
  };

  const handleTestWebhook = async (name: string) => {
    try {
      setIsLoading(true);
      const result = await api.testWebhook(name);
      toast.success(`Test successful: ${result}`);
    } catch (error: any) {
      console.error('Failed to test webhook:', error);
      toast.error(`Test failed: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreset = (preset: PresetType) => {
    setSelectedPreset(preset);
    setShowAddDialog(true);
    setFormMethod('POST');

    // Set default headers for each preset
    if (preset === 'slack' || preset === 'discord') {
      setFormHeaders(JSON.stringify({ 'Content-Type': 'application/json' }, null, 2));
    } else if (preset === 'notion') {
      setFormHeaders(JSON.stringify({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_NOTION_API_KEY',
        'Notion-Version': '2022-06-28'
      }, null, 2));
    } else {
      setFormHeaders('{}');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Integrations</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Connect external services via webhooks
          </p>
        </div>
        <Button onClick={onClose} variant="outline">Close</Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Preset Selection (when no dialog) */}
        {!showAddDialog && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add Integration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(Object.keys(PRESETS) as PresetType[]).map((preset) => {
                const info = PRESETS[preset];
                return (
                  <button
                    key={preset}
                    onClick={() => handleSelectPreset(preset)}
                    className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors text-left"
                  >
                    <div className="text-3xl mb-2">{info.icon}</div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{info.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {info.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Add Webhook Dialog */}
        {showAddDialog && selectedPreset && (
          <div className="mb-8 p-6 border-2 border-blue-500 dark:border-blue-400 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {PRESETS[selectedPreset].icon} Add {PRESETS[selectedPreset].name}
              </h2>
              <Button onClick={() => { setShowAddDialog(false); setSelectedPreset(null); }} variant="outline" size="sm">
                Cancel
              </Button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Integration Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Development Team Slack"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Webhook URL *
                </label>
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder={PRESETS[selectedPreset].urlPlaceholder}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
                {PRESETS[selectedPreset].docsUrl && (
                  <a
                    href={PRESETS[selectedPreset].docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
                  >
                    How to get webhook URL →
                  </a>
                )}
              </div>

              {/* Headers (for advanced users) */}
              <details className="border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                  Advanced Settings
                </summary>
                <div className="mt-3 space-y-3">
                  {/* Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      HTTP Method
                    </label>
                    <select
                      value={formMethod}
                      onChange={(e) => setFormMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="PATCH">PATCH</option>
                    </select>
                  </div>

                  {/* Headers */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Headers (JSON)
                    </label>
                    <textarea
                      value={formHeaders}
                      onChange={(e) => setFormHeaders(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                      placeholder='{"Content-Type": "application/json"}'
                    />
                  </div>

                  {/* Timeout */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Timeout (ms)
                    </label>
                    <input
                      type="number"
                      value={formTimeout}
                      onChange={(e) => setFormTimeout(Number(e.target.value))}
                      min={1000}
                      max={30000}
                      step={1000}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>

                  {/* Retries */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Retry Attempts
                    </label>
                    <input
                      type="number"
                      value={formRetries}
                      onChange={(e) => setFormRetries(Number(e.target.value))}
                      min={0}
                      max={5}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </details>

              <Button onClick={handleAddWebhook} disabled={isLoading} className="w-full">
                {isLoading ? 'Adding...' : 'Add Integration'}
              </Button>
            </div>
          </div>
        )}

        {/* Existing Webhooks */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Active Integrations ({webhooks.length})
          </h2>

          {webhooks.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="text-lg mb-2">No integrations configured yet</p>
              <p className="text-sm">Add your first integration above to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {webhooks.map((webhook) => {
                const preset = webhook.preset || 'custom';
                const presetInfo = PRESETS[preset as PresetType];

                return (
                  <div
                    key={webhook.name}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="text-2xl">{presetInfo?.icon || '⚙️'}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {webhook.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {webhook.url}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>Method: {webhook.method}</span>
                            <span>Timeout: {webhook.timeout}ms</span>
                            <span>Retries: {webhook.retries}</span>
                            {webhook.last_used_at && (
                              <span>
                                Last used: {new Date(webhook.last_used_at).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={webhook.enabled}
                          onCheckedChange={(checked) =>
                            handleToggleWebhook(webhook.name, checked)
                          }
                        />
                        <Button
                          onClick={() => handleTestWebhook(webhook.name)}
                          variant="outline"
                          size="sm"
                          disabled={!webhook.enabled || isLoading}
                        >
                          Test
                        </Button>
                        <Button
                          onClick={() => handleDeleteWebhook(webhook.name)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

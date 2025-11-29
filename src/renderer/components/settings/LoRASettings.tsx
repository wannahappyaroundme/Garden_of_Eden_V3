/**
 * LoRA Settings Panel (v3.6.0)
 * Manage LoRA training data export and adapter management
 */

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import {
  Brain, Download, Trash2, RefreshCw,
  CheckCircle, AlertTriangle, Settings2, Database,
  Play, FileText
} from 'lucide-react';
import { toast } from '../../stores/toast.store';
import { Skeleton } from '../ui/skeleton';

interface DataFilter {
  min_satisfaction: number;
  min_message_length: number;
  max_message_length: number;
  positive_only: boolean;
  exclude_negative: boolean;
  min_turns: number;
}

interface LoRAAdapter {
  id: string;
  name: string;
  description: string;
  base_model: string;
  adapter_path: string;
  created_at: number;
  version: string;
  is_active: boolean;
  performance_metrics?: {
    avg_satisfaction: number;
    total_conversations: number;
  };
}

interface LoRAStats {
  available_training_examples: number;
  registered_adapters: number;
  active_adapters: number;
  current_filter: {
    min_satisfaction: number;
    min_turns: number;
  };
}

export function LoRASettings() {
  const [stats, setStats] = useState<LoRAStats | null>(null);
  const [adapters, setAdapters] = useState<LoRAAdapter[]>([]);
  const [filter, setFilter] = useState<DataFilter>({
    min_satisfaction: 0.6,
    min_message_length: 10,
    max_message_length: 4000,
    positive_only: true,
    exclude_negative: true,
    min_turns: 2,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'alpaca' | 'sharegpt' | 'jsonl'>('alpaca');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, filterData, adaptersList] = await Promise.all([
        invoke<LoRAStats>('lora_get_stats'),
        invoke<DataFilter>('lora_get_filter'),
        invoke<LoRAAdapter[]>('lora_list_adapters'),
      ]);
      setStats(statsData);
      setFilter(filterData);
      setAdapters(adaptersList);
    } catch (error) {
      console.error('Failed to load LoRA data:', error);
      toast.error('Failed to load LoRA settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = async <K extends keyof DataFilter>(key: K, value: DataFilter[K]) => {
    const newFilter = { ...filter, [key]: value };
    setFilter(newFilter);

    try {
      await invoke('lora_update_filter', newFilter);
    } catch (error) {
      console.error('Failed to update filter:', error);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // Get desktop path for export
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `eden_training_data_${exportFormat}_${timestamp}.json`;

      // For now, collect data and show in console (desktop path would need Tauri dialog)
      const result = await invoke<{
        success: boolean;
        examples_count: number;
        metadata: object;
        examples: object[];
      }>('lora_collect_data', {
        format: exportFormat,
        limit: null
      });

      if (result.success) {
        // Download as file
        const blob = new Blob([JSON.stringify(result.examples, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success(
          `Exported ${result.examples_count} training examples`,
          `Format: ${exportFormat.toUpperCase()}`
        );
      }
    } catch (error) {
      console.error('Failed to export training data:', error);
      toast.error('Failed to export training data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleActivateAdapter = async (adapterId: string) => {
    try {
      await invoke('lora_activate_adapter', { adapterId });
      toast.success('Adapter activated');
      loadData();
    } catch (error) {
      console.error('Failed to activate adapter:', error);
      toast.error('Failed to activate adapter');
    }
  };

  const handleDeleteAdapter = async (adapterId: string) => {
    if (!confirm('Are you sure you want to delete this adapter?')) return;

    try {
      await invoke('lora_delete_adapter', { adapterId });
      toast.success('Adapter deleted');
      loadData();
    } catch (error) {
      console.error('Failed to delete adapter:', error);
      toast.error('Failed to delete adapter');
    }
  };

  const handleGenerateModelfile = async (adapterId: string) => {
    try {
      const modelfile = await invoke<string>('lora_generate_modelfile', {
        adapterId,
        systemPrompt: null
      });

      // Download modelfile
      const blob = new Blob([modelfile], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Modelfile_${adapterId}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Modelfile generated', 'Use with: ollama create [name] -f Modelfile');
    } catch (error) {
      console.error('Failed to generate Modelfile:', error);
      toast.error('Failed to generate Modelfile');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Brain className="w-6 h-6 text-purple-500" />
        <div>
          <h2 className="text-lg font-semibold">LoRA Fine-Tuning</h2>
          <p className="text-sm text-muted-foreground">
            Export training data and manage LoRA adapters
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-400">
                Training Examples
              </span>
            </div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-300">
              {stats.available_training_examples.toLocaleString()}
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Settings2 className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                Registered Adapters
              </span>
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
              {stats.registered_adapters}
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                Active Adapters
              </span>
            </div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-300">
              {stats.active_adapters}
            </div>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-800 dark:text-amber-300 mb-1">
              External Training Required
            </p>
            <p className="text-amber-700 dark:text-amber-400">
              Ollama doesn't support built-in LoRA training. Export your training data below,
              then use external tools like <code className="bg-amber-200 dark:bg-amber-900 px-1 rounded">LLaMA-Factory</code> or{' '}
              <code className="bg-amber-200 dark:bg-amber-900 px-1 rounded">Axolotl</code> to train LoRA adapters.
            </p>
          </div>
        </div>
      </div>

      {/* Data Filter Settings */}
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Settings2 className="w-4 h-4" />
          Data Filter Settings
        </h3>

        <div className="p-4 bg-muted/50 rounded-lg space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Minimum Satisfaction Score: {(filter.min_satisfaction * 100).toFixed(0)}%
              </label>
            </div>
            <Slider
              value={[filter.min_satisfaction * 100]}
              onValueChange={([v]) => handleFilterChange('min_satisfaction', v / 100)}
              max={100}
              step={5}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                Minimum Turns: {filter.min_turns}
              </label>
            </div>
            <Slider
              value={[filter.min_turns]}
              onValueChange={([v]) => handleFilterChange('min_turns', v)}
              max={10}
              min={1}
              step={1}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Positive Examples Only</div>
              <div className="text-xs text-muted-foreground">
                Only include high-quality conversations
              </div>
            </div>
            <Switch
              checked={filter.positive_only}
              onCheckedChange={(v) => handleFilterChange('positive_only', v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Exclude Negative Feedback</div>
              <div className="text-xs text-muted-foreground">
                Remove conversations with thumbs down
              </div>
            </div>
            <Switch
              checked={filter.exclude_negative}
              onCheckedChange={(v) => handleFilterChange('exclude_negative', v)}
            />
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Training Data
        </h3>

        <div className="p-4 bg-muted/50 rounded-lg space-y-4">
          <div className="flex gap-2">
            {(['alpaca', 'sharegpt', 'jsonl'] as const).map((format) => (
              <Button
                key={format}
                variant={exportFormat === format ? 'default' : 'outline'}
                size="sm"
                onClick={() => setExportFormat(format)}
              >
                {format.toUpperCase()}
              </Button>
            ))}
          </div>

          <div className="text-xs text-muted-foreground">
            {exportFormat === 'alpaca' && (
              <>Alpaca format: instruction, input, output fields. Compatible with most fine-tuning tools.</>
            )}
            {exportFormat === 'sharegpt' && (
              <>ShareGPT format: conversation array with from/value fields. Good for multi-turn training.</>
            )}
            {exportFormat === 'jsonl' && (
              <>JSONL format: One JSON object per line. Universal format for many tools.</>
            )}
          </div>

          <Button
            onClick={handleExportData}
            disabled={isExporting || (stats?.available_training_examples ?? 0) === 0}
            className="w-full"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export {stats?.available_training_examples ?? 0} Examples
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Registered Adapters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Registered Adapters
          </h3>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {adapters.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No adapters registered yet</p>
            <p className="text-xs mt-1">
              Train a LoRA adapter externally, then register it here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {adapters.map((adapter) => (
              <div
                key={adapter.id}
                className={`p-4 border rounded-lg ${
                  adapter.is_active
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                    : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{adapter.name}</span>
                      <span className="text-xs px-2 py-0.5 bg-muted rounded">
                        v{adapter.version}
                      </span>
                      {adapter.is_active && (
                        <span className="text-xs px-2 py-0.5 bg-green-500 text-white rounded">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {adapter.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Base: {adapter.base_model}</span>
                      {adapter.performance_metrics && (
                        <span>
                          Satisfaction: {(adapter.performance_metrics.avg_satisfaction * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateModelfile(adapter.id)}
                      title="Generate Modelfile"
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                    {!adapter.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleActivateAdapter(adapter.id)}
                        title="Activate"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAdapter(adapter.id)}
                      className="text-red-500 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

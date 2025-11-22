/**
 * RAFT (Retrieval Augmented Fine-Tuning) Settings Component (v3.4.0 Phase 7)
 *
 * Settings panel for configuring RAFT hallucination reduction system
 */

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { toast } from '../../stores/toast.store';

interface RaftConfig {
  relevanceThreshold: number;
  numDistractors: number;
  confidenceThreshold: number;
  useChainOfThought: boolean;
}

export function RaftSettings() {
  const [config, setConfig] = useState<RaftConfig>({
    relevanceThreshold: 0.5,
    numDistractors: 2,
    confidenceThreshold: 0.6,
    useChainOfThought: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load RAFT configuration on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const raftConfig = await window.api.invoke<RaftConfig>('get_raft_config');
      setConfig(raftConfig);
    } catch (error) {
      console.error('Failed to load RAFT config:', error);
      toast.error('Failed to load RAFT settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await window.api.invoke('update_raft_config', { config });
      toast.success('RAFT settings saved successfully');
    } catch (error) {
      console.error('Failed to save RAFT config:', error);
      toast.error(`Failed to save RAFT settings: ${error}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsSaving(true);
      const defaultConfig = await window.api.invoke<RaftConfig>('reset_raft_config');
      setConfig(defaultConfig);
      toast.success('RAFT settings reset to defaults');
    } catch (error) {
      console.error('Failed to reset RAFT config:', error);
      toast.error('Failed to reset RAFT settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          RAFT Hallucination Reduction
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Configure how the AI handles irrelevant context and prevents hallucinations
        </p>
      </div>

      {/* Relevance Threshold */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Relevance Threshold: {config.relevanceThreshold.toFixed(2)}
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Minimum similarity score (0.0-1.0) for context to be considered relevant
        </p>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={config.relevanceThreshold}
          onChange={(e) => setConfig({ ...config, relevanceThreshold: parseFloat(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0.0 (Permissive)</span>
          <span>0.5 (Default)</span>
          <span>1.0 (Strict)</span>
        </div>
      </div>

      {/* Confidence Threshold */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Confidence Threshold: {config.confidenceThreshold.toFixed(2)}
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Minimum confidence (0.0-1.0) required to answer. Below this, AI says "I don't know"
        </p>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={config.confidenceThreshold}
          onChange={(e) => setConfig({ ...config, confidenceThreshold: parseFloat(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0.0 (Always Answer)</span>
          <span>0.6 (Default)</span>
          <span>1.0 (Very Cautious)</span>
        </div>
      </div>

      {/* Number of Distractors */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Number of Distractors: {config.numDistractors}
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          How many irrelevant examples to include (0-10) to teach the AI to ignore bad context
        </p>
        <input
          type="range"
          min="0"
          max="10"
          step="1"
          value={config.numDistractors}
          onChange={(e) => setConfig({ ...config, numDistractors: parseInt(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>0 (None)</span>
          <span>2 (Default)</span>
          <span>10 (Max)</span>
        </div>
      </div>

      {/* Chain-of-Thought Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Chain-of-Thought Reasoning
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Ask AI to explain its reasoning step-by-step before answering
          </p>
        </div>
        <Switch
          checked={config.useChainOfThought}
          onCheckedChange={(checked) => setConfig({ ...config, useChainOfThought: checked })}
        />
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          How RAFT Works
        </h4>
        <ul className="mt-2 text-xs text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
          <li><strong>Filters irrelevant context</strong> below the relevance threshold</li>
          <li><strong>Adds distractor documents</strong> to teach AI to ignore bad information</li>
          <li><strong>Enables "I don't know"</strong> responses when confidence is low</li>
          <li><strong>Chain-of-thought</strong> makes reasoning explicit and verifiable</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
        <Button
          onClick={handleReset}
          disabled={isSaving}
          variant="outline"
          className="flex-1"
        >
          Reset to Defaults
        </Button>
      </div>

      {/* Current Configuration Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          Current Configuration
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Relevance:</span>
            <span className="ml-2 font-mono text-gray-900 dark:text-gray-100">
              {config.relevanceThreshold.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
            <span className="ml-2 font-mono text-gray-900 dark:text-gray-100">
              {config.confidenceThreshold.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Distractors:</span>
            <span className="ml-2 font-mono text-gray-900 dark:text-gray-100">
              {config.numDistractors}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">CoT:</span>
            <span className="ml-2 font-mono text-gray-900 dark:text-gray-100">
              {config.useChainOfThought ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

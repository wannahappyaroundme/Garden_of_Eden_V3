/**
 * ReAct Agent Panel Component (v3.7.0)
 *
 * Interactive UI for Reasoning + Acting framework
 */

import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface ReActStep {
  type: string;
  content: string;
}

interface ReActExecution {
  steps: ReActStep[];
  final_answer: string | null;
  iterations_used: number;
  success: boolean;
  error: string | null;
}

interface ReActConfig {
  max_iterations: number;
  model: string;
  temperature: number;
  enable_verbose: boolean;
}

export const ReActPanel: React.FC = () => {
  const [query, setQuery] = useState('');
  const [execution, setExecution] = useState<ReActExecution | null>(null);
  const [config, setConfig] = useState<ReActConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);

  // Load config on mount
  React.useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const configData = await invoke<ReActConfig>('react_get_config');
      setConfig(configData);
    } catch (err) {
      console.error('Failed to load ReAct config:', err);
    }
  };

  const handleExecute = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setExecution(null);

    try {
      const result = await invoke<ReActExecution>('react_execute', { query });
      setExecution(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const getStepIcon = (stepType: string) => {
    switch (stepType) {
      case 'Thought':
        return '💭';
      case 'Action':
        return '⚡';
      case 'Observation':
        return '👁️';
      case 'Answer':
        return '✅';
      default:
        return '•';
    }
  };

  const getStepColor = (stepType: string) => {
    switch (stepType) {
      case 'Thought':
        return 'text-blue-600 dark:text-blue-400';
      case 'Action':
        return 'text-orange-600 dark:text-orange-400';
      case 'Observation':
        return 'text-purple-600 dark:text-purple-400';
      case 'Answer':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="react-panel p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          ReAct Agent (Reasoning + Acting)
        </h2>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
        >
          {showConfig ? 'Hide Config' : 'Show Config'}
        </button>
      </div>

      {/* Configuration Section */}
      {showConfig && config && (
        <div className="config-section mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">
            Configuration
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Model:
              </span>{' '}
              <span className="text-gray-600 dark:text-gray-400">
                {config.model}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Max Iterations:
              </span>{' '}
              <span className="text-gray-600 dark:text-gray-400">
                {config.max_iterations}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Temperature:
              </span>{' '}
              <span className="text-gray-600 dark:text-gray-400">
                {config.temperature}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Verbose:
              </span>{' '}
              <span className="text-gray-600 dark:text-gray-400">
                {config.enable_verbose ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Query Input Section */}
      <div className="query-section mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Enter your task:
        </label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., Search for information about quantum computing and summarize the key concepts..."
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
          disabled={loading}
        />
        <button
          onClick={handleExecute}
          disabled={loading || !query.trim()}
          className="mt-3 w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
        >
          {loading ? 'Executing ReAct Loop...' : 'Execute'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Execution Results */}
      {execution && (
        <div className="execution-results">
          <div className="result-header mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  Execution Results
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Completed in {execution.iterations_used} iterations
                </p>
              </div>
              <div
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  execution.success
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}
              >
                {execution.success ? 'Success' : 'Failed'}
              </div>
            </div>
          </div>

          {/* Steps Timeline */}
          <div className="steps-timeline space-y-3 mb-6">
            <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300">
              Reasoning Steps:
            </h4>
            {execution.steps.map((step, index) => (
              <div
                key={index}
                className="step-card p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4"
                style={{
                  borderLeftColor:
                    step.type === 'Answer'
                      ? '#10b981'
                      : step.type === 'Action'
                      ? '#f59e0b'
                      : step.type === 'Observation'
                      ? '#8b5cf6'
                      : '#3b82f6',
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getStepIcon(step.type)}</span>
                  <div className="flex-1">
                    <div
                      className={`text-sm font-semibold mb-1 ${getStepColor(
                        step.type
                      )}`}
                    >
                      {step.type}
                    </div>
                    <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {step.content}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Final Answer */}
          {execution.final_answer && (
            <div className="final-answer p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border-2 border-green-300 dark:border-green-700">
              <h4 className="text-lg font-bold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                <span>✅</span> Final Answer
              </h4>
              <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                {execution.final_answer}
              </p>
            </div>
          )}

          {/* Error Message */}
          {execution.error && (
            <div className="execution-error mt-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400">
              <strong>Error:</strong> {execution.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReActPanel;

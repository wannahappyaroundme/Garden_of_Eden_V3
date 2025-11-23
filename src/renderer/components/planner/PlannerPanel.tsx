/**
 * Plan-and-Solve Panel Component (v3.7.0)
 *
 * Interactive UI for multi-step planning with user approval
 */

import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface PlanStep {
  step_number: number;
  description: string;
  action: string;
  expected_output: string;
  depends_on: number[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  result?: string;
  error?: string;
}

interface Plan {
  id: string;
  goal: string;
  steps: PlanStep[];
  estimated_time: string;
  required_tools: string[];
  risks: string[];
  created_at: number;
  user_approved: boolean;
  execution_started: boolean;
  completed: boolean;
}

interface PlanExecution {
  plan_id: string;
  success: boolean;
  completed_steps: number;
  failed_steps: number;
  skipped_steps: number;
  total_steps: number;
  execution_log: string[];
  final_result?: string;
  error?: string;
}

interface PlannerStats {
  total_plans: number;
  completed_plans: number;
  in_progress_plans: number;
  pending_approval: number;
  average_steps_per_plan: number;
}

export const PlannerPanel: React.FC = () => {
  const [goal, setGoal] = useState('');
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [execution, setExecution] = useState<PlanExecution | null>(null);
  const [stats, setStats] = useState<PlannerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'input' | 'review' | 'execution' | 'history'>(
    'input'
  );

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const statsData = await invoke<PlannerStats>('planner_stats');
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load planner stats:', err);
    }
  };

  const handleGeneratePlan = async () => {
    if (!goal.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const plan = await invoke<Plan>('planner_generate', { goal });
      setCurrentPlan(plan);
      setView('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePlan = async () => {
    if (!currentPlan) return;

    setLoading(true);
    setError(null);

    try {
      const planJson = JSON.stringify(currentPlan);
      await invoke('planner_approve', { planJson });

      // Execute the plan
      const execResult = await invoke<PlanExecution>('planner_execute', {
        planId: currentPlan.id,
      });

      setExecution(execResult);
      setView('execution');
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRejectPlan = async () => {
    if (!currentPlan) return;

    try {
      await invoke('planner_reject', { planId: currentPlan.id });
      setCurrentPlan(null);
      setView('input');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  // TODO: Use these helper functions for UI display
  // const getStatusColor = (status: PlanStep['status']) => { ... }
  // const getStatusIcon = (status: PlanStep['status']) => { ... }

  return (
    <div className="planner-panel p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          Plan-and-Solve Agent
        </h2>
        {stats && (
          <div className="stats-badge px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow text-sm">
            <span className="text-gray-600 dark:text-gray-400">Total Plans:</span>{' '}
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {stats.total_plans}
            </span>
          </div>
        )}
      </div>

      {/* View Tabs */}
      <div className="tabs mb-6 flex gap-2">
        <button
          onClick={() => setView('input')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            view === 'input'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          New Plan
        </button>
        {currentPlan && (
          <button
            onClick={() => setView('review')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              view === 'review'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Review Plan
          </button>
        )}
        {execution && (
          <button
            onClick={() => setView('execution')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              view === 'execution'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Execution
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Input View */}
      {view === 'input' && (
        <div className="input-view">
          <div className="goal-input mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Describe your goal:
            </label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g., Create a comprehensive report on climate change impacts, including data from multiple sources and visualizations..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 resize-none"
              rows={5}
              disabled={loading}
            />
            <button
              onClick={handleGeneratePlan}
              disabled={loading || !goal.trim()}
              className="mt-3 w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
            >
              {loading ? 'Generating Plan...' : 'Generate Plan'}
            </button>
          </div>

          {stats && (
            <div className="stats-section p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">
                Statistics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="stat">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Completed
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.completed_plans}
                  </div>
                </div>
                <div className="stat">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    In Progress
                  </div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.in_progress_plans}
                  </div>
                </div>
                <div className="stat">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Avg Steps
                  </div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.average_steps_per_plan.toFixed(1)}
                  </div>
                </div>
                <div className="stat">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Pending Approval
                  </div>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {stats.pending_approval}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Review View */}
      {view === 'review' && currentPlan && (
        <div className="review-view">
          <div className="plan-header mb-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
              {currentPlan.goal}
            </h3>
            <div className="plan-meta text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <div>
                <strong>Estimated Time:</strong> {currentPlan.estimated_time}
              </div>
              <div>
                <strong>Total Steps:</strong> {currentPlan.steps.length}
              </div>
              {currentPlan.required_tools.length > 0 && (
                <div>
                  <strong>Required Tools:</strong>{' '}
                  {currentPlan.required_tools.join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Risks */}
          {currentPlan.risks.length > 0 && (
            <div className="risks-section mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-400 mb-2">
                ⚠️ Potential Risks:
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                {currentPlan.risks.map((risk, index) => (
                  <li key={index}>{risk}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Steps */}
          <div className="steps-section mb-6">
            <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Execution Steps:
            </h4>
            <div className="space-y-3">
              {currentPlan.steps.map((step, index) => (
                <div
                  key={index}
                  className="step-card p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="step-number flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full font-bold text-sm">
                      {step.step_number}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                        {step.description}
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <strong>Action:</strong> {step.action}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <strong>Expected Output:</strong> {step.expected_output}
                      </p>
                      {step.depends_on.length > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Depends on steps: {step.depends_on.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons flex gap-3">
            <button
              onClick={handleApprovePlan}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
            >
              {loading ? 'Executing...' : '✅ Approve & Execute'}
            </button>
            <button
              onClick={handleRejectPlan}
              disabled={loading}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
            >
              ❌ Reject
            </button>
          </div>
        </div>
      )}

      {/* Execution View */}
      {view === 'execution' && execution && (
        <div className="execution-view">
          <div className="execution-header mb-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                Execution Results
              </h3>
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
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Completed
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {execution.completed_steps}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Failed
                </div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {execution.failed_steps}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Skipped
                </div>
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {execution.skipped_steps}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total
                </div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {execution.total_steps}
                </div>
              </div>
            </div>
          </div>

          {/* Execution Log */}
          {execution.execution_log.length > 0 && (
            <div className="execution-log mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
              <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Execution Log:
              </h4>
              <div className="space-y-1 text-sm font-mono">
                {execution.execution_log.map((log, index) => (
                  <div
                    key={index}
                    className="text-gray-700 dark:text-gray-300 py-1 border-b border-gray-200 dark:border-gray-700 last:border-0"
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Final Result */}
          {execution.final_result && (
            <div className="final-result p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border-2 border-green-300 dark:border-green-700">
              <h4 className="text-lg font-bold text-green-700 dark:text-green-400 mb-3">
                ✅ Final Result
              </h4>
              <p className="text-gray-800 dark:text-gray-200">
                {execution.final_result}
              </p>
            </div>
          )}

          {/* Error */}
          {execution.error && (
            <div className="execution-error p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400">
              <strong>Error:</strong> {execution.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlannerPanel;

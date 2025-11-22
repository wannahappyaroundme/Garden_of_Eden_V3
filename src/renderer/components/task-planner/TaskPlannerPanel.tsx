/**
 * Task Planner Panel Component (v3.9.0 Phase 5 Stage 4)
 *
 * Displays task decomposition, dependency graph, and execution planning
 */

import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import { TaskCard } from './TaskCard';
import { ExecutionTimeline } from './ExecutionTimeline';

export interface Task {
  id: string;
  parent_id?: string | null;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[];
  estimated_duration_minutes?: number | null;
  actual_duration_minutes?: number | null;
  progress_percentage: number;
  created_at: number;
  started_at?: number | null;
  completed_at?: number | null;
  tags: string[];
}

export interface TaskBreakdown {
  subtasks: Task[];
  dependencies: Record<string, string[]>;
}

export interface ExecutionPlan {
  root_task_id: string;
  ordered_tasks: string[];
  parallel_groups: string[][];
  estimated_total_duration_minutes: number;
  critical_path: string[];
}

export function TaskPlannerPanel() {
  const [taskDescription, setTaskDescription] = useState('');
  const [context, setContext] = useState('');
  const [breakdown, setBreakdown] = useState<TaskBreakdown | null>(null);
  const [executionPlan, setExecutionPlan] = useState<ExecutionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdRootTask, setCreatedRootTask] = useState<Task | null>(null);

  const handleDecompose = async () => {
    if (!taskDescription.trim()) {
      setError('Please enter a task description');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await invoke<TaskBreakdown>('task_decompose', {
        description: taskDescription,
        context: context.trim() || null,
      });

      setBreakdown(result);

      // Auto-create root task and subtasks
      if (result.subtasks.length > 0) {
        await createTasksFromBreakdown(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const createTasksFromBreakdown = async (breakdown: TaskBreakdown) => {
    try {
      // Create root task
      const rootTask: Task = {
        id: crypto.randomUUID(),
        parent_id: null,
        title: taskDescription,
        description: context || 'Parent task',
        status: 'pending',
        priority: 'high',
        dependencies: [],
        estimated_duration_minutes: breakdown.subtasks.reduce(
          (sum, t) => sum + (t.estimated_duration_minutes || 0),
          0
        ),
        actual_duration_minutes: null,
        progress_percentage: 0,
        created_at: Date.now() / 1000,
        started_at: null,
        completed_at: null,
        tags: ['auto-generated'],
      };

      await invoke<string>('task_create', { task: rootTask });
      setCreatedRootTask(rootTask);

      // Create subtasks with parent reference
      for (const subtask of breakdown.subtasks) {
        subtask.parent_id = rootTask.id;
        await invoke<string>('task_create', { task: subtask });
      }

      // Generate execution plan
      const plan = await invoke<ExecutionPlan>('task_generate_execution_plan', {
        rootTaskId: rootTask.id,
      });
      setExecutionPlan(plan);
    } catch (err) {
      console.error('Failed to create tasks:', err);
      setError('Failed to create tasks from breakdown');
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      await invoke('task_update_status', { taskId, status });

      // Refresh breakdown
      if (breakdown) {
        const updatedSubtasks = breakdown.subtasks.map(t =>
          t.id === taskId ? { ...t, status } : t
        );
        setBreakdown({ ...breakdown, subtasks: updatedSubtasks });
      }
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const handleUpdateProgress = async (taskId: string, progress: number) => {
    try {
      await invoke('task_update_progress', { taskId, progress });

      // Refresh breakdown
      if (breakdown) {
        const updatedSubtasks = breakdown.subtasks.map(t =>
          t.id === taskId ? { ...t, progress_percentage: progress } : t
        );
        setBreakdown({ ...breakdown, subtasks: updatedSubtasks });
      }
    } catch (err) {
      console.error('Failed to update task progress:', err);
    }
  };

  const getTasksByPriority = (tasks: Task[]) => {
    const groups = {
      critical: tasks.filter(t => t.priority === 'critical'),
      high: tasks.filter(t => t.priority === 'high'),
      medium: tasks.filter(t => t.priority === 'medium'),
      low: tasks.filter(t => t.priority === 'low'),
    };
    return groups;
  };

  const completedCount = breakdown?.subtasks.filter(t => t.status === 'completed').length || 0;
  const totalCount = breakdown?.subtasks.length || 0;
  const overallProgress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="flex flex-col h-full p-6 space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            🎯 Task Planner
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            AI-powered task decomposition and execution planning
          </p>
        </div>
      </div>

      {/* Input Section */}
      <Card className="p-4 space-y-4 bg-white dark:bg-gray-800 shadow-lg">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Task Description
          </label>
          <Input
            placeholder="e.g., Build a personal finance tracker app"
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            className="w-full"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Context (Optional)
          </label>
          <Input
            placeholder="e.g., Using React + Tauri, needs to support multiple currencies"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="w-full"
            disabled={isLoading}
          />
        </div>

        <Button
          onClick={handleDecompose}
          disabled={isLoading || !taskDescription.trim()}
          className="w-full"
        >
          {isLoading ? '🤔 Analyzing task...' : '✨ Decompose Task'}
        </Button>

        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
            {error}
          </div>
        )}
      </Card>

      {/* Results Section */}
      {breakdown && (
        <div className="space-y-6">
          {/* Overall Progress */}
          <Card className="p-4 bg-white dark:bg-gray-800 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Overall Progress
              </h3>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {completedCount} / {totalCount} tasks
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {overallProgress.toFixed(0)}% complete
            </p>
          </Card>

          {/* Execution Timeline */}
          {executionPlan && (
            <ExecutionTimeline
              plan={executionPlan}
              tasks={breakdown.subtasks}
            />
          )}

          {/* Tasks by Priority */}
          {(() => {
            const grouped = getTasksByPriority(breakdown.subtasks);
            return (
              <div className="space-y-4">
                {grouped.critical.length > 0 && (
                  <TaskGroup
                    title="🔴 Critical Priority"
                    tasks={grouped.critical}
                    onUpdateStatus={handleUpdateTaskStatus}
                    onUpdateProgress={handleUpdateProgress}
                  />
                )}
                {grouped.high.length > 0 && (
                  <TaskGroup
                    title="🟠 High Priority"
                    tasks={grouped.high}
                    onUpdateStatus={handleUpdateTaskStatus}
                    onUpdateProgress={handleUpdateProgress}
                  />
                )}
                {grouped.medium.length > 0 && (
                  <TaskGroup
                    title="🟡 Medium Priority"
                    tasks={grouped.medium}
                    onUpdateStatus={handleUpdateTaskStatus}
                    onUpdateProgress={handleUpdateProgress}
                  />
                )}
                {grouped.low.length > 0 && (
                  <TaskGroup
                    title="🟢 Low Priority"
                    tasks={grouped.low}
                    onUpdateStatus={handleUpdateTaskStatus}
                    onUpdateProgress={handleUpdateProgress}
                  />
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

interface TaskGroupProps {
  title: string;
  tasks: Task[];
  onUpdateStatus: (taskId: string, status: Task['status']) => void;
  onUpdateProgress: (taskId: string, progress: number) => void;
}

function TaskGroup({ title, tasks, onUpdateStatus, onUpdateProgress }: TaskGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card className="p-4 bg-white dark:bg-gray-800 shadow-lg">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full mb-3"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title} <span className="text-sm text-gray-500">({tasks.length})</span>
        </h3>
        <span className="text-gray-500">
          {isExpanded ? '▼' : '▶'}
        </span>
      </button>

      {isExpanded && (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onUpdateStatus={onUpdateStatus}
              onUpdateProgress={onUpdateProgress}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

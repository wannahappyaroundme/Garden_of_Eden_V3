/**
 * Execution Timeline Component (v3.9.0 Phase 5 Stage 4)
 *
 * Visualizes the execution plan with parallel groups and critical path
 */

import { Card } from '../ui/card';
import { cn } from '../../lib/utils';

interface Task {
  id: string;
  title: string;
  status: string;
  estimated_duration_minutes?: number | null;
}

interface ExecutionPlan {
  root_task_id: string;
  ordered_tasks: string[];
  parallel_groups: string[][];
  estimated_total_duration_minutes: number;
  critical_path: string[];
}

interface ExecutionTimelineProps {
  plan: ExecutionPlan;
  tasks: Task[];
}

export function ExecutionTimeline({ plan, tasks }: ExecutionTimelineProps) {
  const getTaskById = (id: string) => tasks.find(t => t.id === id);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <Card className="p-4 bg-white dark:bg-gray-800 shadow-lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
          📊 Execution Timeline
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Estimated total duration: {formatDuration(plan.estimated_total_duration_minutes)}
        </p>
      </div>

      {/* Parallel Groups */}
      <div className="space-y-4">
        {plan.parallel_groups.map((group, groupIndex) => (
          <div key={groupIndex} className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-purple-600 rounded-full" />

            <div className="pl-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Step {groupIndex + 1}
                </span>
                {group.length > 1 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    ⚡ {group.length} tasks can run in parallel
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {group.map((taskId) => {
                  const task = getTaskById(taskId);
                  if (!task) return null;

                  const isOnCriticalPath = plan.critical_path.includes(taskId);

                  return (
                    <div
                      key={taskId}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-all",
                        isOnCriticalPath
                          ? "border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-600"
                          : "border-gray-200 bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600",
                        task.status === 'completed' && "opacity-60"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {task.title}
                          </p>
                          {task.estimated_duration_minutes && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              ⏱ {formatDuration(task.estimated_duration_minutes)}
                            </p>
                          )}
                        </div>

                        {isOnCriticalPath && (
                          <span
                            className="ml-2 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 whitespace-nowrap"
                            title="On critical path - delays will impact total duration"
                          >
                            🔴 Critical
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Critical Path Summary */}
      {plan.critical_path.length > 0 && (
        <div className="mt-6 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <h4 className="text-sm font-semibold text-red-900 dark:text-red-300 mb-2">
            🔴 Critical Path ({plan.critical_path.length} tasks)
          </h4>
          <p className="text-xs text-red-700 dark:text-red-400 mb-2">
            These tasks form the longest chain and determine the minimum project duration.
            Delays here will directly impact the total timeline.
          </p>
          <div className="flex flex-wrap gap-2">
            {plan.critical_path.map((taskId) => {
              const task = getTaskById(taskId);
              if (!task) return null;
              return (
                <span
                  key={taskId}
                  className="text-xs px-2 py-1 rounded bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                >
                  {task.title}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Optimization Tips */}
      <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
          💡 Optimization Tips
        </h4>
        <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
          <li>• Focus on critical path tasks first to reduce overall duration</li>
          <li>• Parallel tasks can be worked on simultaneously</li>
          <li>• Look for opportunities to split tasks with dependencies</li>
        </ul>
      </div>
    </Card>
  );
}

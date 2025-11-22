/**
 * Task Card Component (v3.9.0 Phase 5 Stage 4)
 *
 * Individual task card with status, progress, and controls
 */

import { useState } from 'react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[];
  estimated_duration_minutes?: number | null;
  progress_percentage: number;
  tags: string[];
}

interface TaskCardProps {
  task: Task;
  onUpdateStatus: (taskId: string, status: Task['status']) => void;
  onUpdateProgress: (taskId: string, progress: number) => void;
}

export function TaskCard({ task, onUpdateStatus, onUpdateProgress }: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showProgressInput, setShowProgressInput] = useState(false);
  const [progressValue, setProgressValue] = useState(task.progress_percentage.toString());

  const statusColors = {
    pending: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    blocked: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
  };

  const statusIcons = {
    pending: '⏸',
    in_progress: '▶',
    completed: '✅',
    blocked: '🚫',
    cancelled: '❌',
  };

  const handleStatusChange = (newStatus: Task['status']) => {
    onUpdateStatus(task.id, newStatus);
  };

  const handleProgressUpdate = () => {
    const progress = parseFloat(progressValue);
    if (!isNaN(progress) && progress >= 0 && progress <= 100) {
      onUpdateProgress(task.id, progress);
      setShowProgressInput(false);
    }
  };

  const formatDuration = (minutes?: number | null) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className={cn(
      "border rounded-lg p-4 transition-all",
      "bg-white dark:bg-gray-800",
      "hover:shadow-md",
      task.status === 'completed' && "opacity-75"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">
              {statusIcons[task.status]}
            </span>
            <h4 className={cn(
              "font-semibold text-gray-900 dark:text-gray-100",
              task.status === 'completed' && "line-through"
            )}>
              {task.title}
            </h4>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              "text-xs px-2 py-1 rounded-full font-medium",
              statusColors[task.status]
            )}>
              {task.status.replace('_', ' ')}
            </span>

            {task.estimated_duration_minutes && (
              <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                ⏱ {formatDuration(task.estimated_duration_minutes)}
              </span>
            )}

            {task.dependencies.length > 0 && (
              <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                🔗 {task.dependencies.length} dep{task.dependencies.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 ml-2"
        >
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
          <span>Progress</span>
          <button
            onClick={() => setShowProgressInput(!showProgressInput)}
            className="hover:text-blue-600 dark:hover:text-blue-400"
          >
            {task.progress_percentage.toFixed(0)}%
          </button>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              task.status === 'completed'
                ? "bg-green-500"
                : task.status === 'in_progress'
                ? "bg-blue-500"
                : "bg-gray-400"
            )}
            style={{ width: `${task.progress_percentage}%` }}
          />
        </div>

        {showProgressInput && (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="number"
              min="0"
              max="100"
              value={progressValue}
              onChange={(e) => setProgressValue(e.target.value)}
              className="flex-1 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
              placeholder="0-100"
            />
            <Button
              size="sm"
              onClick={handleProgressUpdate}
              className="text-xs"
            >
              Update
            </Button>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="space-y-3 pt-3 border-t dark:border-gray-700">
          {/* Description */}
          {task.description && (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {task.description}
              </p>
            </div>
          )}

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Status Actions */}
          <div className="flex flex-wrap gap-2">
            {task.status !== 'in_progress' && task.status !== 'completed' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange('in_progress')}
                className="text-xs"
              >
                ▶ Start
              </Button>
            )}

            {task.status === 'in_progress' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange('completed')}
                className="text-xs"
              >
                ✅ Complete
              </Button>
            )}

            {task.status !== 'blocked' && task.status !== 'completed' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange('blocked')}
                className="text-xs text-red-600 dark:text-red-400"
              >
                🚫 Block
              </Button>
            )}

            {task.status === 'blocked' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange('pending')}
                className="text-xs"
              >
                🔓 Unblock
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Goal Card Component (v3.9.0 Phase 5 Stage 4)
 *
 * Individual goal card with milestones and progress tracking
 */

import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';
import { MilestoneProgress } from './MilestoneProgress';

interface Milestone {
  id: string;
  goal_id: string;
  title: string;
  description: string;
  target_date?: number | null;
  completed: boolean;
  completed_at?: number | null;
  order: number;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  time_frame: string;
  target_date?: number | null;
  progress_percentage: number;
  milestones: Milestone[];
  success_criteria: string[];
  obstacles: string[];
  created_at: number;
  updated_at: number;
  completed_at?: number | null;
  last_check_in?: number | null;
  tags: string[];
}

interface GoalCardProps {
  goal: Goal;
  onUpdateProgress: (goalId: string, progressDelta: number, description: string) => void;
  onCompleteMilestone: (milestoneId: string) => void;
  categoryIcon: string;
  timeFrameLabel: string;
}

export function GoalCard({
  goal,
  onUpdateProgress,
  onCompleteMilestone,
  categoryIcon,
  timeFrameLabel,
}: GoalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showProgressInput, setShowProgressInput] = useState(false);
  const [progressValue, setProgressValue] = useState('');
  const [progressDescription, setProgressDescription] = useState('');

  const statusColors = {
    active: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    abandoned: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
  };

  const handleProgressUpdate = () => {
    const delta = parseFloat(progressValue);
    if (!isNaN(delta) && delta !== 0 && progressDescription.trim()) {
      onUpdateProgress(goal.id, delta, progressDescription);
      setShowProgressInput(false);
      setProgressValue('');
      setProgressDescription('');
    }
  };

  const formatDate = (timestamp?: number | null) => {
    if (!timestamp) return 'No deadline';
    const date = new Date(timestamp * 1000);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const getDaysRemaining = () => {
    if (!goal.target_date) return null;
    const now = Date.now() / 1000;
    const daysLeft = Math.ceil((goal.target_date - now) / 86400);
    return daysLeft;
  };

  const daysRemaining = getDaysRemaining();
  const completedMilestones = goal.milestones.filter((m) => m.completed).length;
  const totalMilestones = goal.milestones.length;

  return (
    <Card
      className={cn(
        'p-5 transition-all hover:shadow-lg',
        'bg-white dark:bg-gray-800',
        goal.status === 'completed' && 'opacity-75 bg-green-50 dark:bg-green-900/10'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{categoryIcon}</span>
            <h3
              className={cn(
                'text-xl font-semibold text-gray-900 dark:text-gray-100',
                goal.status === 'completed' && 'line-through'
              )}
            >
              {goal.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-xs px-2 py-1 rounded-full font-medium', statusColors[goal.status])}>
              {goal.status}
            </span>

            <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
              {timeFrameLabel}
            </span>

            {daysRemaining !== null && (
              <span
                className={cn(
                  'text-xs px-2 py-1 rounded-full',
                  daysRemaining < 0
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    : daysRemaining < 7
                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                )}
              >
                {daysRemaining < 0
                  ? `${Math.abs(daysRemaining)}d overdue`
                  : `${daysRemaining}d remaining`}
              </span>
            )}

            {totalMilestones > 0 && (
              <span className="text-xs px-2 py-1 rounded-full bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300">
                🎯 {completedMilestones}/{totalMilestones} milestones
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 ml-4"
        >
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
          <span>Overall Progress</span>
          <button
            onClick={() => setShowProgressInput(!showProgressInput)}
            className="hover:text-purple-600 dark:hover:text-purple-400 font-medium"
          >
            {goal.progress_percentage.toFixed(0)}%
          </button>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className={cn(
              'h-3 rounded-full transition-all duration-500',
              goal.status === 'completed'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                : 'bg-gradient-to-r from-purple-500 to-pink-500'
            )}
            style={{ width: `${goal.progress_percentage}%` }}
          />
        </div>

        {/* Progress Input */}
        {showProgressInput && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="-100"
                max="100"
                value={progressValue}
                onChange={(e) => setProgressValue(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                placeholder="+10 or -5"
              />
              <span className="text-xs text-gray-500">%</span>
            </div>
            <input
              type="text"
              value={progressDescription}
              onChange={(e) => setProgressDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
              placeholder="What did you accomplish?"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleProgressUpdate} className="flex-1">
                Update
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowProgressInput(false);
                  setProgressValue('');
                  setProgressDescription('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="space-y-4 pt-4 border-t dark:border-gray-700">
          {/* Description */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">{goal.description}</p>
          </div>

          {/* Success Criteria */}
          {goal.success_criteria.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                ✓ Success Criteria
              </h4>
              <ul className="space-y-1">
                {goal.success_criteria.map((criterion, idx) => (
                  <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>{criterion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Milestones */}
          {goal.milestones.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                🎯 Milestones ({completedMilestones}/{totalMilestones})
              </h4>
              <MilestoneProgress milestones={goal.milestones} onComplete={onCompleteMilestone} />
            </div>
          )}

          {/* Obstacles */}
          {goal.obstacles.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">⚠️ Obstacles</h4>
              <ul className="space-y-1">
                {goal.obstacles.map((obstacle, idx) => (
                  <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">⚠️</span>
                    <span>{obstacle}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          {goal.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {goal.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t dark:border-gray-700">
            <div>Created: {formatDate(goal.created_at)}</div>
            {goal.target_date && <div>Target: {formatDate(goal.target_date)}</div>}
            {goal.last_check_in && (
              <div>Last check-in: {formatDate(goal.last_check_in)}</div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

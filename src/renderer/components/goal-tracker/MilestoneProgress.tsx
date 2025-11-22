/**
 * Milestone Progress Component (v3.9.0 Phase 5 Stage 4)
 *
 * Displays milestone list with completion tracking
 */

import { cn } from '../../lib/utils';

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

interface MilestoneProgressProps {
  milestones: Milestone[];
  onComplete: (milestoneId: string) => void;
}

export function MilestoneProgress({ milestones, onComplete }: MilestoneProgressProps) {
  const sortedMilestones = [...milestones].sort((a, b) => a.order - b.order);

  const formatDate = (timestamp?: number | null) => {
    if (!timestamp) return null;
    const date = new Date(timestamp * 1000);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="space-y-2">
      {sortedMilestones.map((milestone, index) => {
        const isLast = index === sortedMilestones.length - 1;

        return (
          <div key={milestone.id} className="flex items-start gap-3">
            {/* Timeline */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => !milestone.completed && onComplete(milestone.id)}
                disabled={milestone.completed}
                className={cn(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                  milestone.completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-400 cursor-pointer'
                )}
              >
                {milestone.completed && '✓'}
              </button>
              {!isLast && (
                <div
                  className={cn(
                    'w-0.5 h-12 mt-1',
                    milestone.completed
                      ? 'bg-green-500'
                      : 'bg-gray-200 dark:bg-gray-700'
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-8">
              <div className="flex items-start justify-between">
                <div>
                  <h5
                    className={cn(
                      'text-sm font-medium text-gray-900 dark:text-gray-100',
                      milestone.completed && 'line-through text-gray-500 dark:text-gray-500'
                    )}
                  >
                    {milestone.title}
                  </h5>
                  {milestone.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {milestone.description}
                    </p>
                  )}
                </div>

                {milestone.target_date && (
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded whitespace-nowrap',
                      milestone.completed
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    )}
                  >
                    {milestone.completed && milestone.completed_at
                      ? `✓ ${formatDate(milestone.completed_at)}`
                      : `📅 ${formatDate(milestone.target_date)}`}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

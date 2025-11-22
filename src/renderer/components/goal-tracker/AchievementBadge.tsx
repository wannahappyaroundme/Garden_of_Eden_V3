/**
 * Achievement Badge Component (v3.9.0 Phase 5 Stage 4)
 *
 * Displays earned achievement badges
 */

interface Achievement {
  id: string;
  goal_id: string;
  title: string;
  description: string;
  earned_at: number;
  celebration_message: string;
}

interface AchievementBadgeProps {
  achievement: Achievement;
}

export function AchievementBadge({ achievement }: AchievementBadgeProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div
      className="group relative inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 border border-yellow-300 dark:border-yellow-700 hover:scale-105 transition-transform cursor-pointer"
      title={achievement.celebration_message}
    >
      <span className="text-xl">🏆</span>
      <div className="text-left">
        <div className="text-sm font-semibold text-yellow-900 dark:text-yellow-300">
          {achievement.title}
        </div>
        <div className="text-xs text-yellow-700 dark:text-yellow-400">
          {formatDate(achievement.earned_at)}
        </div>
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
        {achievement.celebration_message}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
}

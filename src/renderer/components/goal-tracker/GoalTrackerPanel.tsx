/**
 * Goal Tracker Panel Component (v3.9.0 Phase 5 Stage 4)
 *
 * Long-term goal management with AI progress detection
 */

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { GoalCard } from './GoalCard';
import { CreateGoalDialog } from './CreateGoalDialog';
import { AchievementBadge } from './AchievementBadge';

export interface Milestone {
  id: string;
  goal_id: string;
  title: string;
  description: string;
  target_date?: number | null;
  completed: boolean;
  completed_at?: number | null;
  order: number;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'learning' | 'project' | 'habit' | 'career' | 'personal' | 'health' | 'creative' | 'other';
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  time_frame: 'short' | 'medium' | 'long';
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

export interface Achievement {
  id: string;
  goal_id: string;
  title: string;
  description: string;
  earned_at: number;
  celebration_message: string;
}

export interface GoalReminder {
  goal_id: string;
  goal_title: string;
  message: string;
  days_since_update: number;
  progress: number;
}

export function GoalTrackerPanel() {
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
  const [staleGoals, setStaleGoals] = useState<GoalReminder[]>([]);
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  useEffect(() => {
    loadGoals();
    loadStaleGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setIsLoading(true);
      const goals = await invoke<Goal[]>('goal_get_active');
      setActiveGoals(goals);

      // Load recent achievements
      if (goals.length > 0) {
        const achievements: Achievement[] = [];
        for (const goal of goals.slice(0, 3)) {
          try {
            const goalAchievements = await invoke<Achievement[]>('goal_get_achievements', {
              goalId: goal.id,
            });
            achievements.push(...goalAchievements);
          } catch (err) {
            console.error('Failed to load achievements:', err);
          }
        }
        setRecentAchievements(achievements.slice(0, 5));
      }
    } catch (err) {
      console.error('Failed to load goals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStaleGoals = async () => {
    try {
      const stale = await invoke<GoalReminder[]>('goal_get_stale', {
        daysThreshold: 7,
      });
      setStaleGoals(stale);
    } catch (err) {
      console.error('Failed to load stale goals:', err);
    }
  };

  const handleCreateGoal = async (goal: Partial<Goal>) => {
    try {
      const newGoal: Goal = {
        id: crypto.randomUUID(),
        title: goal.title || '',
        description: goal.description || '',
        category: goal.category || 'other',
        status: 'active',
        time_frame: goal.time_frame || 'medium',
        target_date: goal.target_date || null,
        progress_percentage: 0,
        milestones: goal.milestones || [],
        success_criteria: goal.success_criteria || [],
        obstacles: [],
        created_at: Date.now() / 1000,
        updated_at: Date.now() / 1000,
        completed_at: null,
        last_check_in: null,
        tags: goal.tags || [],
      };

      await invoke<string>('goal_create', { goal: newGoal });
      await loadGoals();
      setIsCreateDialogOpen(false);
    } catch (err) {
      console.error('Failed to create goal:', err);
    }
  };

  const handleUpdateProgress = async (goalId: string, progressDelta: number, description: string) => {
    try {
      await invoke('goal_update_progress', {
        goalId,
        progressDelta,
        description,
      });
      await loadGoals();
    } catch (err) {
      console.error('Failed to update progress:', err);
    }
  };

  const handleCompleteMilestone = async (milestoneId: string) => {
    try {
      await invoke('goal_complete_milestone', { milestoneId });
      await loadGoals();
    } catch (err) {
      console.error('Failed to complete milestone:', err);
    }
  };

  const getCategoryIcon = (category: Goal['category']) => {
    const icons = {
      learning: '📚',
      project: '🚀',
      habit: '🔄',
      career: '💼',
      personal: '🌱',
      health: '💪',
      creative: '🎨',
      other: '🎯',
    };
    return icons[category];
  };

  const getTimeFrameLabel = (timeFrame: Goal['time_frame']) => {
    const labels = {
      short: '< 1 month',
      medium: '1-6 months',
      long: '> 6 months',
    };
    return labels[timeFrame];
  };

  const filteredGoals = activeGoals.filter((goal) => {
    if (filter === 'all') return true;
    if (filter === 'active') return goal.status === 'active';
    if (filter === 'completed') return goal.status === 'completed';
    return true;
  });

  const overallProgress = activeGoals.length > 0
    ? activeGoals.reduce((sum, g) => sum + g.progress_percentage, 0) / activeGoals.length
    : 0;

  return (
    <div className="flex flex-col h-full p-6 space-y-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-purple-900/20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            🎯 Goal Tracker
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Track long-term goals with AI-powered progress detection
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-gradient-to-r from-purple-600 to-pink-600">
          ✨ New Goal
        </Button>
      </div>

      {/* Stale Goals Alert */}
      {staleGoals.length > 0 && (
        <Card className="p-4 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
          <h3 className="text-sm font-semibold text-orange-900 dark:text-orange-300 mb-2">
            ⚠️ Goals Need Attention ({staleGoals.length})
          </h3>
          <div className="space-y-2">
            {staleGoals.map((reminder) => (
              <div
                key={reminder.goal_id}
                className="text-sm text-orange-700 dark:text-orange-400 flex items-center justify-between"
              >
                <span>
                  <strong>{reminder.goal_title}</strong> - {reminder.message}
                </span>
                <span className="text-xs px-2 py-1 rounded bg-orange-100 dark:bg-orange-900/40">
                  {reminder.days_since_update} days
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
          <h3 className="text-sm font-semibold text-yellow-900 dark:text-yellow-300 mb-3">
            🏆 Recent Achievements
          </h3>
          <div className="flex flex-wrap gap-2">
            {recentAchievements.map((achievement) => (
              <AchievementBadge key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </Card>
      )}

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-white dark:bg-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400">Active Goals</div>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {activeGoals.filter((g) => g.status === 'active').length}
          </div>
        </Card>
        <Card className="p-4 bg-white dark:bg-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400">Overall Progress</div>
          <div className="text-3xl font-bold text-pink-600 dark:text-pink-400 mt-1">
            {overallProgress.toFixed(0)}%
          </div>
        </Card>
        <Card className="p-4 bg-white dark:bg-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
            {activeGoals.filter((g) => g.status === 'completed').length}
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          size="sm"
        >
          All ({activeGoals.length})
        </Button>
        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          onClick={() => setFilter('active')}
          size="sm"
        >
          Active ({activeGoals.filter((g) => g.status === 'active').length})
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          onClick={() => setFilter('completed')}
          size="sm"
        >
          Completed ({activeGoals.filter((g) => g.status === 'completed').length})
        </Button>
      </div>

      {/* Goals List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading goals...</div>
      ) : filteredGoals.length === 0 ? (
        <Card className="p-12 text-center bg-white dark:bg-gray-800">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No goals yet
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Create your first goal to start tracking your progress
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            ✨ Create First Goal
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onUpdateProgress={handleUpdateProgress}
              onCompleteMilestone={handleCompleteMilestone}
              categoryIcon={getCategoryIcon(goal.category)}
              timeFrameLabel={getTimeFrameLabel(goal.time_frame)}
            />
          ))}
        </div>
      )}

      {/* Create Goal Dialog */}
      {isCreateDialogOpen && (
        <CreateGoalDialog
          onClose={() => setIsCreateDialogOpen(false)}
          onCreate={handleCreateGoal}
        />
      )}
    </div>
  );
}

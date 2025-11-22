/**
 * Create Goal Dialog Component (v3.9.0 Phase 5 Stage 4)
 *
 * Dialog for creating new goals with milestones
 */

import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';

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

interface CreateGoalDialogProps {
  onClose: () => void;
  onCreate: (goal: Partial<any>) => void;
}

export function CreateGoalDialog({ onClose, onCreate }: CreateGoalDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('other');
  const [timeFrame, setTimeFrame] = useState<string>('medium');
  const [targetDate, setTargetDate] = useState('');
  const [successCriteria, setSuccessCriteria] = useState<string[]>(['']);
  const [milestones, setMilestones] = useState<Partial<Milestone>[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const categories = [
    { value: 'learning', label: '📚 Learning', icon: '📚' },
    { value: 'project', label: '🚀 Project', icon: '🚀' },
    { value: 'habit', label: '🔄 Habit', icon: '🔄' },
    { value: 'career', label: '💼 Career', icon: '💼' },
    { value: 'personal', label: '🌱 Personal', icon: '🌱' },
    { value: 'health', label: '💪 Health', icon: '💪' },
    { value: 'creative', label: '🎨 Creative', icon: '🎨' },
    { value: 'other', label: '🎯 Other', icon: '🎯' },
  ];

  const handleAddSuccessCriterion = () => {
    setSuccessCriteria([...successCriteria, '']);
  };

  const handleUpdateSuccessCriterion = (index: number, value: string) => {
    const updated = [...successCriteria];
    updated[index] = value;
    setSuccessCriteria(updated);
  };

  const handleRemoveSuccessCriterion = (index: number) => {
    setSuccessCriteria(successCriteria.filter((_, i) => i !== index));
  };

  const handleAddMilestone = () => {
    setMilestones([
      ...milestones,
      {
        id: crypto.randomUUID(),
        title: '',
        description: '',
        completed: false,
        order: milestones.length,
      },
    ]);
  };

  const handleUpdateMilestone = (index: number, field: string, value: any) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    const goal = {
      title: title.trim(),
      description: description.trim(),
      category,
      time_frame: timeFrame,
      target_date: targetDate ? new Date(targetDate).getTime() / 1000 : null,
      success_criteria: successCriteria.filter((c) => c.trim()),
      milestones: milestones.filter((m) => m.title?.trim()),
      tags,
    };

    onCreate(goal);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">✨ Create New Goal</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Goal Title *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Learn advanced TypeScript patterns"
              className="w-full"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you want to achieve and why"
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600 min-h-[80px]"
            />
          </div>

          {/* Category & Time Frame */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time Frame
              </label>
              <select
                value={timeFrame}
                onChange={(e) => setTimeFrame(e.target.value)}
                className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="short">Short (< 1 month)</option>
                <option value="medium">Medium (1-6 months)</option>
                <option value="long">Long (> 6 months)</option>
              </select>
            </div>
          </div>

          {/* Target Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Date (Optional)
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          {/* Success Criteria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Success Criteria
            </label>
            <div className="space-y-2">
              {successCriteria.map((criterion, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={criterion}
                    onChange={(e) => handleUpdateSuccessCriterion(index, e.target.value)}
                    placeholder="e.g., Complete 5 real-world projects"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveSuccessCriterion(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={handleAddSuccessCriterion}>
                + Add Criterion
              </Button>
            </div>
          </div>

          {/* Milestones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Milestones (Optional)
            </label>
            <div className="space-y-3">
              {milestones.map((milestone, index) => (
                <div key={index} className="p-3 border rounded dark:border-gray-600 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Milestone {index + 1}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveMilestone(index)}
                    >
                      ×
                    </Button>
                  </div>
                  <Input
                    value={milestone.title || ''}
                    onChange={(e) => handleUpdateMilestone(index, 'title', e.target.value)}
                    placeholder="Milestone title"
                    className="w-full"
                  />
                  <Input
                    value={milestone.description || ''}
                    onChange={(e) => handleUpdateMilestone(index, 'description', e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full"
                  />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={handleAddMilestone}>
                + Add Milestone
              </Button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add tag and press Enter"
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-sm"
                  >
                    #{tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t dark:border-gray-700">
            <Button onClick={handleSubmit} disabled={!title.trim()} className="flex-1">
              Create Goal
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

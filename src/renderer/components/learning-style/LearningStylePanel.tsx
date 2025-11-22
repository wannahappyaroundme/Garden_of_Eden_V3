/**
 * Learning Style Panel Component (v3.9.0 Phase 5 Stage 4)
 *
 * Main interface for learning style detection and adaptation
 */

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';

export interface LearningStyleProfile {
  user_id: string;
  primary_modality: string;
  secondary_modality?: string | null;
  complexity_level: string;
  confidence_score: number;
  prefers_step_by_step: boolean;
  prefers_code_examples: boolean;
  prefers_visual_aids: boolean;
  attention_span_minutes: number;
  last_updated: number;
}

export interface InteractionRecord {
  id: string;
  user_id: string;
  interaction_type: string;
  content: string;
  response_time_seconds?: number | null;
  engagement_score?: number | null;
  created_at: number;
}

export function LearningStylePanel() {
  const [profile, setProfile] = useState<LearningStyleProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId] = useState('default-user'); // TODO: Get from auth context
  const [showManualConfig, setShowManualConfig] = useState(false);

  // Manual configuration state
  const [manualModality, setManualModality] = useState<string>('visual');
  const [manualComplexity, setManualComplexity] = useState<string>('intermediate');
  const [manualStepByStep, setManualStepByStep] = useState(true);
  const [manualCodeExamples, setManualCodeExamples] = useState(true);
  const [manualVisualAids, setManualVisualAids] = useState(true);
  const [manualAttentionSpan, setManualAttentionSpan] = useState(30);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await invoke<LearningStyleProfile>('learning_style_get_profile', {
        userId,
      });
      setProfile(result);

      // Sync manual controls with profile
      setManualModality(result.primary_modality);
      setManualComplexity(result.complexity_level);
      setManualStepByStep(result.prefers_step_by_step);
      setManualCodeExamples(result.prefers_code_examples);
      setManualVisualAids(result.prefers_visual_aids);
      setManualAttentionSpan(result.attention_span_minutes);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await invoke('learning_style_update_manual', {
        userId,
        primaryModality: manualModality,
        complexityLevel: manualComplexity,
        prefersStepByStep: manualStepByStep,
        prefersCodeExamples: manualCodeExamples,
        prefersVisualAids: manualVisualAids,
        attentionSpanMinutes: manualAttentionSpan,
      });

      await loadProfile();
      setShowManualConfig(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeInteractions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const updated = await invoke<LearningStyleProfile>('learning_style_update_profile', {
        userId,
      });
      setProfile(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const modalityLabels: Record<string, { label: string; icon: string; description: string }> = {
    visual: {
      label: 'Visual',
      icon: '👁️',
      description: 'Learns best with diagrams, charts, and visual representations'
    },
    auditory: {
      label: 'Auditory',
      icon: '👂',
      description: 'Prefers verbal explanations and discussions'
    },
    kinesthetic: {
      label: 'Kinesthetic',
      icon: '✋',
      description: 'Learns by doing, hands-on examples and practice'
    },
    reading_writing: {
      label: 'Reading/Writing',
      icon: '📝',
      description: 'Prefers text-based learning and documentation'
    },
  };

  const complexityLabels: Record<string, { label: string; color: string }> = {
    beginner: { label: 'Beginner', color: 'text-green-600 dark:text-green-400' },
    intermediate: { label: 'Intermediate', color: 'text-blue-600 dark:text-blue-400' },
    advanced: { label: 'Advanced', color: 'text-purple-600 dark:text-purple-400' },
    expert: { label: 'Expert', color: 'text-red-600 dark:text-red-400' },
  };

  if (isLoading && !profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-2xl mb-2">🤔</div>
          <p className="text-gray-600 dark:text-gray-400">Loading learning profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-6 space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            🎓 Learning Style Profile
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Personalized learning preferences based on VARK model
          </p>
        </div>
        <Button
          onClick={handleAnalyzeInteractions}
          disabled={isLoading}
          variant="outline"
        >
          {isLoading ? '🔄 Analyzing...' : '🔍 Analyze Interactions'}
        </Button>
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
          {error}
        </div>
      )}

      {profile && (
        <div className="space-y-6">
          {/* Current Profile Summary */}
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Current Profile
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowManualConfig(!showManualConfig)}
              >
                ⚙️ {showManualConfig ? 'Cancel' : 'Manual Config'}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Primary Modality */}
              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">
                    {modalityLabels[profile.primary_modality]?.icon}
                  </span>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Learning Style</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {modalityLabels[profile.primary_modality]?.label || profile.primary_modality}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {modalityLabels[profile.primary_modality]?.description}
                </p>
              </div>

              {/* Complexity Level */}
              <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Complexity Level</p>
                    <p className={cn("font-semibold", complexityLabels[profile.complexity_level]?.color)}>
                      {complexityLabels[profile.complexity_level]?.label || profile.complexity_level}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Confidence:</p>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-teal-500 h-2 rounded-full"
                      style={{ width: `${profile.confidence_score * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">{(profile.confidence_score * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <PreferenceCard
                icon="📋"
                label="Step-by-Step"
                enabled={profile.prefers_step_by_step}
              />
              <PreferenceCard
                icon="💻"
                label="Code Examples"
                enabled={profile.prefers_code_examples}
              />
              <PreferenceCard
                icon="📊"
                label="Visual Aids"
                enabled={profile.prefers_visual_aids}
              />
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⏱️</span>
                  <div className="flex-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Attention Span</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {profile.attention_span_minutes}m
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              Last updated: {new Date(profile.last_updated * 1000).toLocaleString()}
            </p>
          </Card>

          {/* Manual Configuration */}
          {showManualConfig && (
            <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Manual Configuration
              </h3>

              <div className="space-y-4">
                {/* Learning Modality */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Primary Learning Style
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(modalityLabels).map(([key, { label, icon }]) => (
                      <button
                        key={key}
                        onClick={() => setManualModality(key)}
                        className={cn(
                          "p-3 rounded-lg border-2 transition-all",
                          manualModality === key
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                            : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
                        )}
                      >
                        <div className="text-2xl mb-1">{icon}</div>
                        <p className="text-xs font-medium">{label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Complexity Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Complexity Level
                  </label>
                  <select
                    value={manualComplexity}
                    onChange={(e) => setManualComplexity(e.target.value)}
                    className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  >
                    {Object.entries(complexityLabels).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Preferences */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Preferences
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={manualStepByStep}
                        onChange={(e) => setManualStepByStep(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Prefer step-by-step explanations</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={manualCodeExamples}
                        onChange={(e) => setManualCodeExamples(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Prefer code examples</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={manualVisualAids}
                        onChange={(e) => setManualVisualAids(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Prefer visual aids and diagrams</span>
                    </label>
                  </div>
                </div>

                {/* Attention Span */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Attention Span: {manualAttentionSpan} minutes
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="90"
                    step="5"
                    value={manualAttentionSpan}
                    onChange={(e) => setManualAttentionSpan(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>5m</span>
                    <span>90m</span>
                  </div>
                </div>

                {/* Save Button */}
                <Button
                  onClick={handleUpdateProfile}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Saving...' : '💾 Save Configuration'}
                </Button>
              </div>
            </Card>
          )}

          {/* How It Works */}
          <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              📚 How Learning Style Adaptation Works
            </h3>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-start gap-2">
                <span className="text-lg">1️⃣</span>
                <p>
                  <strong className="text-gray-900 dark:text-gray-100">Detection:</strong> AI analyzes your interaction patterns, response times, and engagement to detect your learning style
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-lg">2️⃣</span>
                <p>
                  <strong className="text-gray-900 dark:text-gray-100">VARK Model:</strong> Uses Visual, Auditory, Reading/Writing, and Kinesthetic modalities
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-lg">3️⃣</span>
                <p>
                  <strong className="text-gray-900 dark:text-gray-100">Adaptation:</strong> AI responses are automatically tailored to match your preferences
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-lg">4️⃣</span>
                <p>
                  <strong className="text-gray-900 dark:text-gray-100">Continuous Learning:</strong> Profile improves over time based on your interactions
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

interface PreferenceCardProps {
  icon: string;
  label: string;
  enabled: boolean;
}

function PreferenceCard({ icon, label, enabled }: PreferenceCardProps) {
  return (
    <div className={cn(
      "p-3 rounded-lg border",
      enabled
        ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
        : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
    )}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <div className="flex-1">
          <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
          <p className={cn(
            "text-sm font-medium",
            enabled ? "text-green-700 dark:text-green-400" : "text-gray-500 dark:text-gray-400"
          )}>
            {enabled ? 'Enabled' : 'Disabled'}
          </p>
        </div>
      </div>
    </div>
  );
}

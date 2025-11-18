/**
 * Persona Settings Page
 * Customize AI personality with 10 adjustable parameters
 * Learning system optimization based on user feedback
 */

import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Button } from '../components/ui/button';
import { ArrowLeft, Brain, TrendingUp, RotateCcw, Save, Download, Upload } from 'lucide-react';

interface PersonaSettingsProps {
  onClose: () => void;
}

interface PersonaParameters {
  formality: number;        // 0.0 = casual, 1.0 = formal
  verbosity: number;        // 0.0 = concise, 1.0 = detailed
  humor: number;            // 0.0 = serious, 1.0 = humorous
  emoji_usage: number;      // 0.0 = none, 1.0 = frequent
  proactiveness: number;    // 0.0 = reactive, 1.0 = proactive
  technical_depth: number;  // 0.0 = simple, 1.0 = technical
  empathy: number;          // 0.0 = task-focused, 1.0 = supportive
  code_examples: number;    // 0.0 = rarely, 1.0 = always
  questioning: number;      // 0.0 = rarely ask, 1.0 = clarify often
  suggestions: number;      // 0.0 = wait, 1.0 = offer suggestions
}

interface LearningStats {
  total_feedback_count: number;
  average_satisfaction: number;
  positive_feedback_count: number;
  negative_feedback_count: number;
  optimization_count: number;
  last_optimization: number | null;
}

const DEFAULT_PERSONA: PersonaParameters = {
  formality: 0.3,
  verbosity: 0.5,
  humor: 0.2,
  emoji_usage: 0.1,
  proactiveness: 0.4,
  technical_depth: 0.6,
  empathy: 0.5,
  code_examples: 0.7,
  questioning: 0.5,
  suggestions: 0.4,
};

export function PersonaSettings({ onClose }: PersonaSettingsProps) {
  const [persona, setPersona] = useState<PersonaParameters>(DEFAULT_PERSONA);
  const [originalPersona, setOriginalPersona] = useState<PersonaParameters>(DEFAULT_PERSONA);
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<number | null>(null);
  const { isAuthenticated } = useAuthStore();

  // Load stats and persona on mount
  useEffect(() => {
    loadStats();
    loadPersona();
    if (isAuthenticated) {
      checkLastBackup();
    }
  }, [isAuthenticated]);

  // Track changes
  useEffect(() => {
    const changed = JSON.stringify(persona) !== JSON.stringify(originalPersona);
    setHasChanges(changed);
  }, [persona, originalPersona]);

  // Regenerate system prompt when persona changes
  useEffect(() => {
    generateSystemPrompt(persona);
  }, [persona]);

  const loadStats = async () => {
    try {
      const learningStats = await invoke<LearningStats>('learning_get_stats');
      setStats(learningStats);
    } catch (error) {
      console.error('Failed to load learning stats:', error);
    }
  };

  const loadPersona = async () => {
    try {
      const loadedPersona = await invoke<PersonaParameters>('learning_load_persona');
      setPersona(loadedPersona);
      setOriginalPersona(loadedPersona);
      generateSystemPrompt(loadedPersona);
    } catch (error) {
      console.error('Failed to load persona:', error);
    }
  };

  const checkLastBackup = async () => {
    try {
      const time = await CloudSyncService.getLastBackupTime();
      setLastBackupTime(time);
    } catch (error) {
      console.error('Failed to check last backup:', error);
    }
  };

  const generateSystemPrompt = async (currentPersona: PersonaParameters) => {
    try {
      const prompt = await invoke<string>('learning_generate_system_prompt', {
        persona: currentPersona,
      });
      setSystemPrompt(prompt);
    } catch (error) {
      console.error('Failed to generate system prompt:', error);
    }
  };

  const handleOptimize = async () => {
    if (!stats || stats.total_feedback_count < 5) {
      alert('Need at least 5 feedback samples to optimize persona');
      return;
    }

    setIsOptimizing(true);
    try {
      const optimized = await invoke<PersonaParameters>('learning_optimize_persona', {
        currentPersona: persona,
      });
      setPersona(optimized);
      await loadStats();
      alert('Persona optimized based on your feedback!');
    } catch (error) {
      console.error('Failed to optimize persona:', error);
      alert('Optimization failed. Try again later.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSave = useCallback(async () => {
    try {
      // Save to local database (backend)
      await invoke('learning_save_persona', { persona });
      setOriginalPersona(persona);
      setHasChanges(false);
      alert('Persona settings saved locally!');
    } catch (error) {
      console.error('Failed to save persona:', error);
      alert('Failed to save persona settings.');
    }
  }, [persona]);

  const handleUploadToCloud = useCallback(async () => {
    if (!isAuthenticated) {
      alert('Please login with Google to backup to cloud');
      return;
    }

    setIsSyncing(true);
    try {
      const backupData: CloudBackupData = {
        persona,
        timestamp: Date.now(),
      };
      await CloudSyncService.uploadBackup(backupData);
      await checkLastBackup();
      alert('Persona backed up to Google Drive!');
    } catch (error) {
      console.error('Failed to backup to cloud:', error);
      alert('Failed to backup to cloud: ' + error);
    } finally {
      setIsSyncing(false);
    }
  }, [persona, isAuthenticated]);

  const handleDownloadFromCloud = useCallback(async () => {
    if (!isAuthenticated) {
      alert('Please login with Google to restore from cloud');
      return;
    }

    setIsSyncing(true);
    try {
      const backupData = await CloudSyncService.downloadBackup();
      if (backupData && backupData.persona) {
        setPersona(backupData.persona);
        // Save to local database
        await invoke('learning_save_persona', { persona: backupData.persona });
        alert('Persona restored from cloud backup!');
      } else {
        alert('No cloud backup found');
      }
    } catch (error) {
      console.error('Failed to restore from cloud:', error);
      alert('Failed to restore from cloud: ' + error);
    } finally {
      setIsSyncing(false);
    }
  }, [isAuthenticated]);

  const handleReset = useCallback(() => {
    setPersona(DEFAULT_PERSONA);
  }, []);

  const updateParameter = (key: keyof PersonaParameters, value: number) => {
    setPersona(prev => ({ ...prev, [key]: value }));
  };

  const getParameterLabel = (value: number, lowLabel: string, highLabel: string): string => {
    if (value < 0.33) return lowLabel;
    if (value > 0.67) return highLabel;
    return 'Moderate';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Persona Settings</h1>
          </div>
          <div className="flex gap-2">
            {hasChanges && (
              <>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Cloud Backup Section */}
        {isAuthenticated && (
          <section className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Cloud className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Cloud Backup</h2>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Backup your persona settings to Google Drive for easy restoration across devices.
              </p>
              {lastBackupTime && (
                <p className="text-xs text-muted-foreground">
                  Last backup: {new Date(lastBackupTime).toLocaleString()}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleUploadToCloud}
                  disabled={isSyncing}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isSyncing ? 'Uploading...' : 'Backup to Cloud'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadFromCloud}
                  disabled={isSyncing}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isSyncing ? 'Downloading...' : 'Restore from Cloud'}
                </Button>
              </div>
            </div>
          </section>
        )}

        {!isAuthenticated && (
          <section className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <CloudOff className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Cloud Backup Disabled</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Login with Google in Account settings to enable cloud backup for your persona settings.
            </p>
          </section>
        )}

        {/* Learning Statistics */}
        {stats && (
          <section className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Learning Statistics</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Feedback</p>
                <p className="text-2xl font-bold">{stats.total_feedback_count}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Avg Satisfaction</p>
                <p className="text-2xl font-bold">{(stats.average_satisfaction * 100).toFixed(0)}%</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Positive</p>
                <p className="text-2xl font-bold text-green-600">{stats.positive_feedback_count}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Negative</p>
                <p className="text-2xl font-bold text-red-600">{stats.negative_feedback_count}</p>
              </div>
            </div>
            <Button
              className="mt-4 w-full"
              onClick={handleOptimize}
              disabled={isOptimizing || stats.total_feedback_count < 5}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              {isOptimizing ? 'Optimizing...' : 'Optimize Based on Feedback'}
            </Button>
            {stats.total_feedback_count < 5 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Need {5 - stats.total_feedback_count} more feedback samples to enable optimization
              </p>
            )}
          </section>
        )}

        {/* Persona Parameters */}
        <section className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6">Personality Parameters</h2>
          <div className="space-y-6">
            {/* Formality */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-medium">Formality</label>
                <span className="text-sm text-muted-foreground">
                  {getParameterLabel(persona.formality, 'Casual', 'Formal')}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={persona.formality}
                onChange={(e) => updateParameter('formality', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Casual & Friendly</span>
                <span>Professional & Formal</span>
              </div>
            </div>

            {/* Verbosity */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-medium">Verbosity</label>
                <span className="text-sm text-muted-foreground">
                  {getParameterLabel(persona.verbosity, 'Concise', 'Detailed')}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={persona.verbosity}
                onChange={(e) => updateParameter('verbosity', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Brief & Direct</span>
                <span>Detailed & Thorough</span>
              </div>
            </div>

            {/* Humor */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-medium">Humor</label>
                <span className="text-sm text-muted-foreground">
                  {getParameterLabel(persona.humor, 'Serious', 'Humorous')}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={persona.humor}
                onChange={(e) => updateParameter('humor', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Serious & Focused</span>
                <span>Playful & Humorous</span>
              </div>
            </div>

            {/* Emoji Usage */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-medium">Emoji Usage</label>
                <span className="text-sm text-muted-foreground">
                  {getParameterLabel(persona.emoji_usage, 'None', 'Frequent')}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={persona.emoji_usage}
                onChange={(e) => updateParameter('emoji_usage', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>No Emojis</span>
                <span>Frequent Emojis</span>
              </div>
            </div>

            {/* Proactiveness */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-medium">Proactiveness</label>
                <span className="text-sm text-muted-foreground">
                  {getParameterLabel(persona.proactiveness, 'Reactive', 'Proactive')}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={persona.proactiveness}
                onChange={(e) => updateParameter('proactiveness', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Wait for Questions</span>
                <span>Suggest Actively</span>
              </div>
            </div>

            {/* Technical Depth */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-medium">Technical Depth</label>
                <span className="text-sm text-muted-foreground">
                  {getParameterLabel(persona.technical_depth, 'Simple', 'Technical')}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={persona.technical_depth}
                onChange={(e) => updateParameter('technical_depth', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Simple Explanations</span>
                <span>Technical Details</span>
              </div>
            </div>

            {/* Empathy */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-medium">Empathy</label>
                <span className="text-sm text-muted-foreground">
                  {getParameterLabel(persona.empathy, 'Task-Focused', 'Supportive')}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={persona.empathy}
                onChange={(e) => updateParameter('empathy', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Task-Focused</span>
                <span>Emotionally Supportive</span>
              </div>
            </div>

            {/* Code Examples */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-medium">Code Examples</label>
                <span className="text-sm text-muted-foreground">
                  {getParameterLabel(persona.code_examples, 'Rarely', 'Always')}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={persona.code_examples}
                onChange={(e) => updateParameter('code_examples', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Explain Conceptually</span>
                <span>Show Code Examples</span>
              </div>
            </div>

            {/* Questioning */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-medium">Questioning</label>
                <span className="text-sm text-muted-foreground">
                  {getParameterLabel(persona.questioning, 'Rarely Ask', 'Clarify Often')}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={persona.questioning}
                onChange={(e) => updateParameter('questioning', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Assume Context</span>
                <span>Ask for Clarification</span>
              </div>
            </div>

            {/* Suggestions */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-medium">Suggestions</label>
                <span className="text-sm text-muted-foreground">
                  {getParameterLabel(persona.suggestions, 'Wait', 'Offer')}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={persona.suggestions}
                onChange={(e) => updateParameter('suggestions', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Wait for Requests</span>
                <span>Offer Suggestions</span>
              </div>
            </div>
          </div>
        </section>

        {/* System Prompt Preview */}
        <section className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">System Prompt Preview</h2>
          <div className="bg-muted p-4 rounded-lg font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
            {systemPrompt || 'Generating...'}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            This is the system prompt that will be used to configure Adam's personality based on your settings.
          </p>
        </section>
      </main>
    </div>
  );
}

/**
 * Phase 5 Settings Component (v3.9.0)
 *
 * Settings panel for Reasoning Engine 2.0 features
 */

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface Phase5SettingsState {
  // Chain-of-Thought Settings
  cotEnabled: boolean;
  cotMaxSteps: number;
  cotConfidenceThreshold: number;

  // Visual Analyzer Settings
  visualAnalyzerEnabled: boolean;
  visualAnalyzerAutoLoad: boolean; // Auto-load LLaVA when image detected

  // Context Enricher Settings
  contextEnricherEnabled: boolean;
  contextSourcesEnabled: {
    activeWindow: boolean;
    screenContext: boolean;
    conversationHistory: boolean;
    semanticMemory: boolean;
    taskContext: boolean;
  };

  // Semantic Wiki Settings
  semanticWikiEnabled: boolean;
  wikiAutoExtract: boolean; // Auto-extract facts from conversations
  wikiSearchThreshold: number; // Similarity threshold for fact search

  // Memory Enhancer Settings
  memoryEnhancerEnabled: boolean;
  enhancementAutoApply: boolean; // Auto-enhance low-quality memories
  enhancementQualityThreshold: number; // 0-10 scale

  // Task Planner Settings
  taskPlannerEnabled: boolean;
  taskAutoDecompose: boolean; // Auto-detect and decompose complex tasks
  taskDependencyTracking: boolean;

  // Learning Style Adapter Settings
  learningStyleEnabled: boolean;
  learningStyleAutoDetect: boolean; // Auto-update profile from interactions
  learningStyleConfidenceMin: number;

  // Goal Tracker Settings
  goalTrackerEnabled: boolean;
  goalAutoDetectProgress: boolean; // Auto-detect progress from conversations
  goalStaleAlertDays: number; // Alert if no update for N days
}

export function Phase5Settings() {
  const [settings, setSettings] = useState<Phase5SettingsState>({
    cotEnabled: true,
    cotMaxSteps: 10,
    cotConfidenceThreshold: 0.7,
    visualAnalyzerEnabled: true,
    visualAnalyzerAutoLoad: false,
    contextEnricherEnabled: true,
    contextSourcesEnabled: {
      activeWindow: true,
      screenContext: false,
      conversationHistory: true,
      semanticMemory: true,
      taskContext: true,
    },
    semanticWikiEnabled: true,
    wikiAutoExtract: true,
    wikiSearchThreshold: 0.75,
    memoryEnhancerEnabled: true,
    enhancementAutoApply: false,
    enhancementQualityThreshold: 6.0,
    taskPlannerEnabled: true,
    taskAutoDecompose: true,
    taskDependencyTracking: true,
    learningStyleEnabled: true,
    learningStyleAutoDetect: true,
    learningStyleConfidenceMin: 0.5,
    goalTrackerEnabled: true,
    goalAutoDetectProgress: true,
    goalStaleAlertDays: 7,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  // Backend response type (snake_case)
  interface BackendPhase5Settings {
    cot_enabled: boolean;
    cot_max_steps: number;
    cot_confidence_threshold: number;
    visual_analyzer_enabled: boolean;
    visual_analyzer_auto_load: boolean;
    context_enricher_enabled: boolean;
    context_sources_enabled: {
      active_window: boolean;
      screen_context: boolean;
      conversation_history: boolean;
      semantic_memory: boolean;
      task_context: boolean;
    };
    semantic_wiki_enabled: boolean;
    wiki_auto_extract: boolean;
    wiki_search_threshold: number;
    memory_enhancer_enabled: boolean;
    enhancement_auto_apply: boolean;
    enhancement_quality_threshold: number;
    task_planner_enabled: boolean;
    task_auto_decompose: boolean;
    task_dependency_tracking: boolean;
    learning_style_enabled: boolean;
    learning_style_auto_detect: boolean;
    learning_style_confidence_min: number;
    goal_tracker_enabled: boolean;
    goal_auto_detect_progress: boolean;
    goal_stale_alert_days: number;
  }

  const loadSettings = async () => {
    try {
      const backendSettings = await invoke<BackendPhase5Settings>('get_phase5_settings');
      // Convert snake_case to camelCase
      setSettings({
        cotEnabled: backendSettings.cot_enabled,
        cotMaxSteps: backendSettings.cot_max_steps,
        cotConfidenceThreshold: backendSettings.cot_confidence_threshold,
        visualAnalyzerEnabled: backendSettings.visual_analyzer_enabled,
        visualAnalyzerAutoLoad: backendSettings.visual_analyzer_auto_load,
        contextEnricherEnabled: backendSettings.context_enricher_enabled,
        contextSourcesEnabled: {
          activeWindow: backendSettings.context_sources_enabled.active_window,
          screenContext: backendSettings.context_sources_enabled.screen_context,
          conversationHistory: backendSettings.context_sources_enabled.conversation_history,
          semanticMemory: backendSettings.context_sources_enabled.semantic_memory,
          taskContext: backendSettings.context_sources_enabled.task_context,
        },
        semanticWikiEnabled: backendSettings.semantic_wiki_enabled,
        wikiAutoExtract: backendSettings.wiki_auto_extract,
        wikiSearchThreshold: backendSettings.wiki_search_threshold,
        memoryEnhancerEnabled: backendSettings.memory_enhancer_enabled,
        enhancementAutoApply: backendSettings.enhancement_auto_apply,
        enhancementQualityThreshold: backendSettings.enhancement_quality_threshold,
        taskPlannerEnabled: backendSettings.task_planner_enabled,
        taskAutoDecompose: backendSettings.task_auto_decompose,
        taskDependencyTracking: backendSettings.task_dependency_tracking,
        learningStyleEnabled: backendSettings.learning_style_enabled,
        learningStyleAutoDetect: backendSettings.learning_style_auto_detect,
        learningStyleConfidenceMin: backendSettings.learning_style_confidence_min,
        goalTrackerEnabled: backendSettings.goal_tracker_enabled,
        goalAutoDetectProgress: backendSettings.goal_auto_detect_progress,
        goalStaleAlertDays: backendSettings.goal_stale_alert_days,
      });
    } catch (err) {
      console.error('Failed to load Phase 5 settings:', err);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Convert camelCase to snake_case for backend
      const backendSettings: BackendPhase5Settings = {
        cot_enabled: settings.cotEnabled,
        cot_max_steps: settings.cotMaxSteps,
        cot_confidence_threshold: settings.cotConfidenceThreshold,
        visual_analyzer_enabled: settings.visualAnalyzerEnabled,
        visual_analyzer_auto_load: settings.visualAnalyzerAutoLoad,
        context_enricher_enabled: settings.contextEnricherEnabled,
        context_sources_enabled: {
          active_window: settings.contextSourcesEnabled.activeWindow,
          screen_context: settings.contextSourcesEnabled.screenContext,
          conversation_history: settings.contextSourcesEnabled.conversationHistory,
          semantic_memory: settings.contextSourcesEnabled.semanticMemory,
          task_context: settings.contextSourcesEnabled.taskContext,
        },
        semantic_wiki_enabled: settings.semanticWikiEnabled,
        wiki_auto_extract: settings.wikiAutoExtract,
        wiki_search_threshold: settings.wikiSearchThreshold,
        memory_enhancer_enabled: settings.memoryEnhancerEnabled,
        enhancement_auto_apply: settings.enhancementAutoApply,
        enhancement_quality_threshold: settings.enhancementQualityThreshold,
        task_planner_enabled: settings.taskPlannerEnabled,
        task_auto_decompose: settings.taskAutoDecompose,
        task_dependency_tracking: settings.taskDependencyTracking,
        learning_style_enabled: settings.learningStyleEnabled,
        learning_style_auto_detect: settings.learningStyleAutoDetect,
        learning_style_confidence_min: settings.learningStyleConfidenceMin,
        goal_tracker_enabled: settings.goalTrackerEnabled,
        goal_auto_detect_progress: settings.goalAutoDetectProgress,
        goal_stale_alert_days: settings.goalStaleAlertDays,
      };

      await invoke('update_phase5_settings', { settings: backendSettings });
      setSaveMessage('Settings saved successfully');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error('Failed to save Phase 5 settings:', err);
      setSaveMessage('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          🧠 Reasoning Engine 2.0 Settings
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Configure Phase 5 advanced reasoning features
        </p>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={cn(
          "p-3 rounded-lg text-sm",
          saveMessage.includes('success')
            ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
            : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
        )}>
          {saveMessage}
        </div>
      )}

      {/* Stage 3: Chain-of-Thought */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              🔗 Chain-of-Thought Reasoning
              <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                Stage 3
              </span>
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Step-by-step reasoning with self-correction
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.cotEnabled}
              onChange={(e) => setSettings({ ...settings, cotEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-purple-600"></div>
          </label>
        </div>

        {settings.cotEnabled && (
          <div className="space-y-4 border-t dark:border-gray-700 pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Reasoning Steps: {settings.cotMaxSteps}
              </label>
              <input
                type="range"
                min="3"
                max="20"
                value={settings.cotMaxSteps}
                onChange={(e) => setSettings({ ...settings, cotMaxSteps: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>3</span>
                <span>20</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confidence Threshold: {(settings.cotConfidenceThreshold * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.05"
                value={settings.cotConfidenceThreshold}
                onChange={(e) => setSettings({ ...settings, cotConfidenceThreshold: parseFloat(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Minimum confidence to accept reasoning result
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Stage 1: Visual Analyzer */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              👁️ Visual Analyzer
              <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                Stage 1
              </span>
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              LLaVA-powered image understanding
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.visualAnalyzerEnabled}
              onChange={(e) => setSettings({ ...settings, visualAnalyzerEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-purple-600"></div>
          </label>
        </div>

        {settings.visualAnalyzerEnabled && (
          <div className="border-t dark:border-gray-700 pt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.visualAnalyzerAutoLoad}
                onChange={(e) => setSettings({ ...settings, visualAnalyzerAutoLoad: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Auto-load LLaVA when image detected (uses ~2GB VRAM)
              </span>
            </label>
          </div>
        )}
      </Card>

      {/* Stage 1: Context Enricher */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              🔍 Context Enricher
              <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                Stage 1
              </span>
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Multi-source context aggregation
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.contextEnricherEnabled}
              onChange={(e) => setSettings({ ...settings, contextEnricherEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-purple-600"></div>
          </label>
        </div>

        {settings.contextEnricherEnabled && (
          <div className="space-y-2 border-t dark:border-gray-700 pt-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Context Sources:
            </p>
            {Object.entries(settings.contextSourcesEnabled).map(([key, enabled]) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    contextSourcesEnabled: {
                      ...settings.contextSourcesEnabled,
                      [key]: e.target.checked
                    }
                  })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </label>
            ))}
          </div>
        )}
      </Card>

      {/* Stage 2: Semantic Wiki */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              📚 Semantic Wiki
              <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                Stage 2
              </span>
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Automatic fact extraction and knowledge base
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.semanticWikiEnabled}
              onChange={(e) => setSettings({ ...settings, semanticWikiEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-purple-600"></div>
          </label>
        </div>

        {settings.semanticWikiEnabled && (
          <div className="space-y-4 border-t dark:border-gray-700 pt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.wikiAutoExtract}
                onChange={(e) => setSettings({ ...settings, wikiAutoExtract: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Auto-extract facts from conversations
              </span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Similarity Threshold: {(settings.wikiSearchThreshold * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.05"
                value={settings.wikiSearchThreshold}
                onChange={(e) => setSettings({ ...settings, wikiSearchThreshold: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Stage 2: Memory Enhancer */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              ✨ Memory Enhancer
              <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                Stage 2
              </span>
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Quality scoring and automatic enhancement
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.memoryEnhancerEnabled}
              onChange={(e) => setSettings({ ...settings, memoryEnhancerEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-purple-600"></div>
          </label>
        </div>

        {settings.memoryEnhancerEnabled && (
          <div className="space-y-4 border-t dark:border-gray-700 pt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.enhancementAutoApply}
                onChange={(e) => setSettings({ ...settings, enhancementAutoApply: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Auto-enhance low-quality memories
              </span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quality Threshold: {settings.enhancementQualityThreshold.toFixed(1)} / 10
              </label>
              <input
                type="range"
                min="4"
                max="8"
                step="0.5"
                value={settings.enhancementQualityThreshold}
                onChange={(e) => setSettings({ ...settings, enhancementQualityThreshold: parseFloat(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Memories below this score will be enhanced
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Stage 4: Task Planner */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              🎯 Task Planner
              <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                Stage 4
              </span>
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Autonomous task decomposition and planning
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.taskPlannerEnabled}
              onChange={(e) => setSettings({ ...settings, taskPlannerEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-purple-600"></div>
          </label>
        </div>

        {settings.taskPlannerEnabled && (
          <div className="space-y-2 border-t dark:border-gray-700 pt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.taskAutoDecompose}
                onChange={(e) => setSettings({ ...settings, taskAutoDecompose: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Auto-detect and decompose complex tasks
              </span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.taskDependencyTracking}
                onChange={(e) => setSettings({ ...settings, taskDependencyTracking: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Enable dependency tracking and critical path analysis
              </span>
            </label>
          </div>
        )}
      </Card>

      {/* Stage 4: Learning Style Adapter */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              🎓 Learning Style Adapter
              <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                Stage 4
              </span>
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              VARK learning style detection and adaptation
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.learningStyleEnabled}
              onChange={(e) => setSettings({ ...settings, learningStyleEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-purple-600"></div>
          </label>
        </div>

        {settings.learningStyleEnabled && (
          <div className="space-y-4 border-t dark:border-gray-700 pt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.learningStyleAutoDetect}
                onChange={(e) => setSettings({ ...settings, learningStyleAutoDetect: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Auto-update profile from interaction patterns
              </span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Minimum Confidence: {(settings.learningStyleConfidenceMin * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.3"
                max="0.9"
                step="0.1"
                value={settings.learningStyleConfidenceMin}
                onChange={(e) => setSettings({ ...settings, learningStyleConfidenceMin: parseFloat(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Minimum confidence to apply style adaptation
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Stage 4: Goal Tracker */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              🏆 Goal Tracker
              <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                Stage 4
              </span>
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Long-term goal monitoring with AI progress detection
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.goalTrackerEnabled}
              onChange={(e) => setSettings({ ...settings, goalTrackerEnabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-purple-600"></div>
          </label>
        </div>

        {settings.goalTrackerEnabled && (
          <div className="space-y-4 border-t dark:border-gray-700 pt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.goalAutoDetectProgress}
                onChange={(e) => setSettings({ ...settings, goalAutoDetectProgress: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Auto-detect progress from conversations
              </span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stale Goal Alert: {settings.goalStaleAlertDays} days
              </label>
              <input
                type="range"
                min="3"
                max="30"
                value={settings.goalStaleAlertDays}
                onChange={(e) => setSettings({ ...settings, goalStaleAlertDays: parseInt(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Alert if goal has no updates for this many days
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6"
        >
          {isSaving ? 'Saving...' : '💾 Save All Settings'}
        </Button>
      </div>
    </div>
  );
}

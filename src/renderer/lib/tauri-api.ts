/**
 * Tauri API Wrapper
 * Type-safe interface for Tauri commands
 */

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export interface ChatRequest {
  message: string;
  conversationId?: string;
  contextLevel?: 1 | 2 | 3;
}

export interface ChatResponse {
  conversationId: string;
  messageId: string;
  response: string;
}

export interface SystemInfo {
  platform: string;
  arch: string;
  osVersion: string;
  appVersion: string;
}

export interface PersonaSettings {
  id?: number;
  formality: number;
  humor: number;
  verbosity: number;
  emojiUsage: number;
  enthusiasm: number;
  empathy: number;
  directness: number;
  technicality: number;
  creativity: number;
  proactivity: number;
  languagePreference: string;
  codeLanguagePreference: string;
  patience: number;
  encouragement: number;
  formalityHonorifics: number;
  reasoningDepth: number;
  contextAwareness: number;
  createdAt: number;
  updatedAt: number;
}

export interface Settings {
  persona: PersonaSettings;
  theme: string;
  language: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  mode: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  lastMessagePreview?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tokens?: number;
  responseTime?: number;
  contextLevel?: 1 | 2 | 3;
  satisfaction?: 'positive' | 'negative';
}

// ==================== ONBOARDING TYPES ====================

export interface SystemSpecs {
  total_ram_gb: number;
  available_ram_gb: number;
  cpu_cores: number;
  cpu_name: string;
  has_gpu: boolean;
  gpu_name?: string;
  disk_free_gb: number;
  os: string;
  os_version: string;
}

export interface ModelRecommendation {
  recommendation_type: 'insufficient' | 'lightweight' | 'moderate' | 'optimal';
  model?: string;
  model_display_name?: string;
  size_gb?: number;
  reason: string;
  notes: string[];
  expected_ram_usage_gb?: number;
}

export interface RequiredModels {
  llm: string;
  llava: string;
  whisper: string;
  total_size_gb: number;
  total_ram_usage_gb: number;
}

export interface DownloadProgress {
  model_name: string;
  status: 'not_started' | 'downloading' | 'completed' | 'failed';
  downloaded_bytes: number;
  total_bytes?: number;
  progress_percent: number;
  speed_mbps?: number;
  eta_seconds?: number;
}

export interface ModelDownloadState {
  llm_model: DownloadProgress;
  llava_model: DownloadProgress;
  whisper_model: DownloadProgress;
}

export interface SurveyResults {
  primary_use: string;
  ai_experience: string;
  primary_language: string;
  speech_style: string;
  ideal_ai_personality: string;
  previous_ai_lacking: string;
  desired_features: string;
}

export interface ModelConfig {
  temperature: number;
  top_p: number;
  top_k: number;
  repeat_penalty: number;
  context_length_limit: number;
  response_diversity: number;
}

/**
 * Tauri API
 * Drop-in replacement for Electron IPC
 */
export const api = {
  /**
   * Chat with AI
   */
  chat: async (args: ChatRequest): Promise<ChatResponse> => {
    return await invoke<ChatResponse>('chat', { request: args });
  },

  /**
   * Chat with AI using streaming
   * @param args ChatRequest
   * @param onChunk Callback for each chunk of text
   * @returns Promise<ChatResponse>
   */
  chatStream: async (
    args: ChatRequest,
    onChunk: (chunk: string) => void
  ): Promise<ChatResponse> => {
    // Listen for stream chunks
    const unlistenChunk = await listen<{ chunk: string }>('chat-stream-chunk', (event) => {
      onChunk(event.payload.chunk);
    });

    // Listen for stream completion
    const unlistenComplete = await listen('chat-stream-complete', () => {
      unlistenChunk();
      unlistenComplete();
    });

    // Invoke the streaming command
    return await invoke<ChatResponse>('chat_stream', { request: args });
  },

  /**
   * Start voice input
   */
  voiceInputStart: async (): Promise<boolean> => {
    return await invoke<boolean>('voice_input_start');
  },

  /**
   * Stop voice input
   */
  voiceInputStop: async (): Promise<string> => {
    return await invoke<string>('voice_input_stop');
  },

  /**
   * Get system info
   */
  getSystemInfo: async (): Promise<SystemInfo> => {
    return await invoke<SystemInfo>('get_system_info');
  },

  /**
   * Get settings
   */
  getSettings: async (): Promise<Settings> => {
    return await invoke<Settings>('get_settings');
  },

  /**
   * Update settings
   */
  updateSettings: async (settings: Settings): Promise<void> => {
    return await invoke<void>('update_settings', { settings });
  },

  /**
   * Get all conversations
   */
  getConversations: async (): Promise<ConversationSummary[]> => {
    return await invoke<ConversationSummary[]>('get_conversations');
  },

  /**
   * Get messages for a conversation
   */
  getConversationMessages: async (conversationId: string): Promise<Message[]> => {
    return await invoke<Message[]>('get_conversation_messages', { conversationId });
  },

  /**
   * Delete a conversation
   */
  deleteConversation: async (conversationId: string): Promise<void> => {
    return await invoke<void>('delete_conversation', { conversationId });
  },

  /**
   * Update conversation title
   */
  updateConversationTitle: async (conversationId: string, newTitle: string): Promise<void> => {
    return await invoke<void>('update_conversation_title', { conversationId, newTitle });
  },

  // ==================== ONBOARDING APIS ====================

  /**
   * Detect system specifications
   */
  detectSystemSpecs: async (): Promise<SystemSpecs> => {
    return await invoke<SystemSpecs>('detect_system_specs');
  },

  /**
   * Get model recommendation based on system specs
   */
  getModelRecommendation: async (specs: SystemSpecs): Promise<ModelRecommendation> => {
    return await invoke<ModelRecommendation>('get_model_recommendation', { specs });
  },

  /**
   * Get required models for a specific LLM
   */
  getRequiredModels: async (llmModel: string): Promise<RequiredModels> => {
    return await invoke<RequiredModels>('get_required_models', { llmModel });
  },

  /**
   * Check if Ollama is installed
   */
  checkOllamaInstalled: async (): Promise<boolean> => {
    return await invoke<boolean>('check_ollama_installed');
  },

  /**
   * Check if a specific model exists locally
   */
  checkModelExists: async (modelName: string): Promise<boolean> => {
    return await invoke<boolean>('check_model_exists', { modelName });
  },

  /**
   * Start downloading a model
   */
  startModelDownload: async (modelName: string, modelType: 'llm' | 'llava' | 'whisper'): Promise<void> => {
    return await invoke<void>('start_model_download', { modelName, modelType });
  },

  /**
   * Get download progress
   */
  getDownloadProgress: async (): Promise<ModelDownloadState> => {
    return await invoke<ModelDownloadState>('get_download_progress');
  },

  /**
   * Generate custom prompt from survey results
   */
  generateCustomPrompt: async (survey: SurveyResults): Promise<string> => {
    return await invoke<string>('generate_custom_prompt', { survey });
  },

  /**
   * Generate model config from survey results
   */
  generateModelConfig: async (survey: SurveyResults, modelName: string): Promise<ModelConfig> => {
    return await invoke<ModelConfig>('generate_model_config', { survey, modelName });
  },

  /**
   * Save onboarding state to database
   */
  saveOnboardingState: async (
    systemSpecsJson: string,
    recommendedModel: string,
    selectedModel: string
  ): Promise<void> => {
    return await invoke<void>('save_onboarding_state', {
      systemSpecsJson,
      recommendedModel,
      selectedModel,
    });
  },

  /**
   * Save survey results and custom prompt
   */
  saveSurveyResults: async (surveyJson: string, customPrompt: string): Promise<void> => {
    return await invoke<void>('save_survey_results', { surveyJson, customPrompt });
  },

  /**
   * Mark onboarding as completed
   */
  markOnboardingCompleted: async (): Promise<void> => {
    return await invoke<void>('mark_onboarding_completed');
  },

  // Platform info (from Tauri)
  platform: typeof window !== 'undefined' ? navigator.platform : 'unknown',
  versions: {
    app: '1.0.0', // Will be replaced with actual version
  },
};

// Make it available globally for backwards compatibility
if (typeof window !== 'undefined') {
  (window as any).api = api;
}

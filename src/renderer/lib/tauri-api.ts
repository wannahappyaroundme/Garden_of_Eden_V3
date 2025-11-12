/**
 * Tauri API Wrapper
 * Type-safe interface for Tauri commands
 */

import { invoke } from '@tauri-apps/api/core';

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

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

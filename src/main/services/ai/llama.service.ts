/**
 * Llama Service
 * Manages Llama 3.1 8B model for AI conversations
 */

import { LlamaModel, LlamaContext, LlamaChatSession } from 'node-llama-cpp';
import * as path from 'path';
import * as fs from 'fs/promises';
import { log } from '../../utils/logger';
import { personaService } from '../learning/persona.service';

export interface LlamaConfig {
  modelPath: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  maxTokens?: number;
  contextSize?: number;
  gpuLayers?: number; // Number of layers to offload to GPU
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface StreamCallback {
  onToken: (token: string) => void;
  onComplete: (fullResponse: string) => void;
  onError: (error: Error) => void;
}

/**
 * Llama Service
 * Handles local AI model loading and inference
 */
export class LlamaService {
  private model: LlamaModel | null = null;
  private context: LlamaContext | null = null;
  private session: LlamaChatSession | null = null;
  private config: LlamaConfig;
  private isLoading: boolean = false;
  private conversationHistory: ChatMessage[] = [];

  constructor(config: LlamaConfig) {
    this.config = {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxTokens: 2048,
      contextSize: 4096,
      gpuLayers: 33, // Default for M3 chips (offload most layers to GPU)
      ...config,
    };
  }

  /**
   * Initialize and load the Llama model
   */
  async initialize(): Promise<void> {
    if (this.isLoading) {
      throw new Error('Model is already loading');
    }

    if (this.model) {
      log.ai.info('Llama model already loaded');
      return;
    }

    this.isLoading = true;

    try {
      log.ai.info('Loading Llama model...', { path: this.config.modelPath });

      // Check if model file exists
      try {
        await fs.access(this.config.modelPath);
      } catch {
        throw new Error(\`Model file not found: \${this.config.modelPath}\`);
      }

      // Load model
      this.model = new LlamaModel({
        modelPath: this.config.modelPath,
        gpuLayers: this.config.gpuLayers,
      });

      log.ai.info('Llama model loaded successfully');

      // Create context
      this.context = new LlamaContext({
        model: this.model,
        contextSize: this.config.contextSize,
      });

      log.ai.info('Llama context created', { contextSize: this.config.contextSize });

      // Create chat session
      this.session = new LlamaChatSession({
        context: this.context,
      });

      // Set system prompt from persona
      const systemPrompt = personaService.generateSystemPrompt();
      this.conversationHistory.push({
        role: 'system',
        content: systemPrompt,
      });

      log.ai.info('Llama chat session ready');
    } catch (error) {
      log.ai.error('Failed to load Llama model', error);
      this.cleanup();
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Check if model is loaded and ready
   */
  isReady(): boolean {
    return this.model !== null && this.context !== null && this.session !== null;
  }

  /**
   * Generate a chat response (streaming)
   */
  async chat(
    message: string,
    options?: {
      conversationId?: string;
      temperature?: number;
      maxTokens?: number;
      stream?: StreamCallback;
    }
  ): Promise<string> {
    if (!this.isReady()) {
      throw new Error('Llama model not initialized. Call initialize() first.');
    }

    try {
      log.ai.info('Generating chat response', {
        messageLength: message.length,
        conversationId: options?.conversationId,
      });

      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: message,
      });

      const temperature = options?.temperature ?? this.config.temperature!;
      const maxTokens = options?.maxTokens ?? this.config.maxTokens!;

      let fullResponse = '';

      // Generate response with streaming
      const response = await this.session!.prompt(message, {
        temperature,
        maxTokens,
        topP: this.config.topP,
        topK: this.config.topK,
        onToken: (token: number[]) => {
          const decodedToken = this.model!.detokenize(token);
          fullResponse += decodedToken;
          options?.stream?.onToken(decodedToken);
        },
      });

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: fullResponse,
      });

      // Manage context window (keep last N messages)
      this.trimConversationHistory();

      log.ai.info('Chat response generated', {
        responseLength: fullResponse.length,
        conversationHistorySize: this.conversationHistory.length,
      });

      options?.stream?.onComplete(fullResponse);

      return fullResponse;
    } catch (error) {
      log.ai.error('Failed to generate chat response', error);
      options?.stream?.onError(error as Error);
      throw error;
    }
  }

  /**
   * Generate a response without streaming
   */
  async generate(prompt: string, systemPrompt?: string): Promise<string> {
    if (!this.isReady()) {
      throw new Error('Llama model not initialized. Call initialize() first.');
    }

    try {
      log.ai.info('Generating response', { promptLength: prompt.length });

      const fullPrompt = systemPrompt
        ? \`\${systemPrompt}\n\nUser: \${prompt}\n\nAssistant:\`
        : prompt;

      const response = await this.session!.prompt(fullPrompt, {
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
        topP: this.config.topP,
        topK: this.config.topK,
      });

      log.ai.info('Response generated', { responseLength: response.length });

      return response;
    } catch (error) {
      log.ai.error('Failed to generate response', error);
      throw error;
    }
  }

  /**
   * Clear conversation history and start fresh
   */
  clearHistory(): void {
    const systemPrompt = this.conversationHistory.find((msg) => msg.role === 'system');
    this.conversationHistory = systemPrompt ? [systemPrompt] : [];
    log.ai.info('Conversation history cleared');
  }

  /**
   * Update system prompt (for persona changes)
   */
  updateSystemPrompt(systemPrompt: string): void {
    const systemMessage = this.conversationHistory.find((msg) => msg.role === 'system');
    if (systemMessage) {
      systemMessage.content = systemPrompt;
    } else {
      this.conversationHistory.unshift({
        role: 'system',
        content: systemPrompt,
      });
    }
    log.ai.info('System prompt updated');
  }

  /**
   * Get conversation history
   */
  getHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Trim conversation history to fit context window
   */
  private trimConversationHistory(): void {
    // Keep system prompt + last N messages that fit in context
    const maxMessages = 20; // Adjust based on context size
    const systemMessage = this.conversationHistory.find((msg) => msg.role === 'system');

    if (this.conversationHistory.length > maxMessages) {
      const recentMessages = this.conversationHistory.slice(-maxMessages);
      this.conversationHistory = systemMessage
        ? [systemMessage, ...recentMessages.filter((msg) => msg.role !== 'system')]
        : recentMessages;

      log.ai.info('Conversation history trimmed', {
        newSize: this.conversationHistory.length,
      });
    }
  }

  /**
   * Get model info
   */
  getModelInfo(): { loaded: boolean; modelPath: string; config: LlamaConfig } {
    return {
      loaded: this.isReady(),
      modelPath: this.config.modelPath,
      config: this.config,
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.session) {
        // Session cleanup is automatic
        this.session = null;
      }

      if (this.context) {
        await this.context.dispose();
        this.context = null;
      }

      if (this.model) {
        await this.model.dispose();
        this.model = null;
      }

      this.conversationHistory = [];
      log.ai.info('Llama service cleaned up');
    } catch (error) {
      log.ai.error('Error during cleanup', error);
      throw error;
    }
  }
}

// Singleton instance
// Model path will be set during first-run setup
const defaultModelPath = path.join(
  process.env.HOME || process.env.USERPROFILE || '.',
  '.garden-of-eden-v3',
  'models',
  'llama-3.1-8b-instruct-q4_k_m.gguf'
);

export const llamaService = new LlamaService({
  modelPath: defaultModelPath,
});

/**
 * LLM Service
 * Manages Qwen 2.5 32B Instruct model for AI conversations
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { log } from '../../utils/logger';
import { personaService } from '../learning/persona.service';

// Types for node-llama-cpp (will be imported dynamically)
type LlamaModel = any;
type LlamaContext = any;
type LlamaChatSession = any;
type GetLlamaFunction = () => Promise<any>;

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
      contextSize: 8192, // Qwen 2.5 32B supports up to 32K, using 8K for efficiency
      gpuLayers: 50, // Qwen 2.5 32B has more layers, offload more to GPU (M3 MAX)
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
        throw new Error(`Model file not found: ${this.config.modelPath}`);
      }

      // Dynamically import node-llama-cpp (ES Module)
      const { getLlama, LlamaChatSession } = await import('node-llama-cpp');

      // Get Llama instance
      const llama = await getLlama();

      // Load model
      this.model = await llama.loadModel({
        modelPath: this.config.modelPath,
        gpuLayers: this.config.gpuLayers,
      });

      log.ai.info('Llama model loaded successfully');

      // Create context
      this.context = await this.model.createContext({
        contextSize: this.config.contextSize,
      });

      log.ai.info('Llama context created', { contextSize: this.config.contextSize });

      // Create chat session
      this.session = new LlamaChatSession({
        contextSequence: this.context.getSequence(),
      });

      // Set system prompt from persona
      const systemPrompt = personaService.generateSystemPrompt();
      this.conversationHistory.push({
        role: 'system',
        content: systemPrompt,
      });

      log.ai.info('Llama chat session ready');
    } catch (error) {
      log.ai.error('Failed to initialize Llama model', error);
      this.isLoading = false;
      throw error;
    }

    this.isLoading = false;
  }

  /**
   * Generate a response (non-streaming)
   */
  async generateResponse(
    prompt: string,
    systemPrompt?: string
  ): Promise<string> {
    await this.ensureInitialized();

    if (!this.session) {
      throw new Error('Chat session not initialized');
    }

    try {
      log.ai.info('Generating response', { promptLength: prompt.length });

      // Simple prompt-based generation for now
      const response = await this.session.prompt(prompt, {
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
      });

      log.ai.info('Response generated', { responseLength: response.length });

      return response;
    } catch (error) {
      log.ai.error('Failed to generate response', error);
      throw error;
    }
  }

  /**
   * Generate streaming response
   */
  async generateStreamingResponse(
    prompt: string,
    onToken: (token: string) => void,
    systemPrompt?: string
  ): Promise<string> {
    await this.ensureInitialized();

    if (!this.session) {
      throw new Error('Chat session not initialized');
    }

    try {
      log.ai.info('Generating streaming response', { promptLength: prompt.length });

      let fullResponse = '';

      const response = await this.session.prompt(prompt, {
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
        onTextChunk: (chunk: string) => {
          fullResponse += chunk;
          onToken(chunk);
        },
      });

      log.ai.info('Streaming response complete', { responseLength: fullResponse.length });

      return fullResponse;
    } catch (error) {
      log.ai.error('Failed to generate streaming response', error);
      throw error;
    }
  }

  /**
   * Add message to conversation history
   */
  addToHistory(role: 'user' | 'assistant', content: string): void {
    this.conversationHistory.push({ role, content });

    // Trim history if it gets too long (keep last 10 messages + system)
    const maxHistory = 11; // system + 10 messages
    if (this.conversationHistory.length > maxHistory) {
      const systemMessage = this.conversationHistory[0];
      const recentMessages = this.conversationHistory.slice(-10);
      this.conversationHistory = [systemMessage, ...recentMessages];
    }
  }

  /**
   * Get conversation history
   */
  getHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Clear conversation history (keep system prompt)
   */
  clearHistory(): void {
    const systemMessage = this.conversationHistory[0];
    this.conversationHistory = systemMessage ? [systemMessage] : [];
  }

  /**
   * Check if model is initialized
   */
  isInitialized(): boolean {
    return this.model !== null && this.context !== null && this.session !== null;
  }

  /**
   * Ensure model is initialized (lazy initialization)
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized()) {
      await this.initialize();
    }
  }

  /**
   * Shutdown and cleanup resources
   */
  async shutdown(): Promise<void> {
    log.ai.info('Shutting down Llama service');

    if (this.context) {
      this.context.dispose();
      this.context = null;
    }

    if (this.model) {
      this.model.dispose();
      this.model = null;
    }

    this.session = null;
    this.conversationHistory = [];
  }
}

// Create default instance with model path
const defaultModelPath = path.join(
  process.env.HOME || process.env.USERPROFILE || '.',
  '.garden-of-eden-v3',
  'models',
  'qwen2.5-32b-instruct-q4_k_m.gguf'
);

export const llamaService = new LlamaService({
  modelPath: defaultModelPath,
  contextSize: 8192, // Qwen 2.5 32B: 32K max, using 8K for performance
  gpuLayers: 50, // Offload most layers to Metal GPU (M3 MAX)
});

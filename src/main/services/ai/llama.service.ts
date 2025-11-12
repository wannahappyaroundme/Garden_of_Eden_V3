/**
 * Llama Service
 * Handles Llama 3.1 8B model for conversation generation
 */

// Type-only imports for node-llama-cpp (package not installed yet)
type LlamaModel = any;
type LlamaContext = any;
type LlamaChatSession = any;

import path from 'path';
import fs from 'fs';
import log from 'electron-log';
import type { LLMConfig, StreamToken, GenerationMetrics } from '@shared/types/ai.types';
import type { PersonaParameters } from '@shared/types/persona.types';

export class LlamaService {
  private model: LlamaModel | null = null;
  private context: LlamaContext | null = null;
  private session: LlamaChatSession | null = null;
  private modelPath: string;
  private _config: LLMConfig;
  private isInitialized = false;

  constructor(config?: Partial<LLMConfig>) {
    // Determine model path
    const isDev = process.env.NODE_ENV === 'development';
    const resourcesPath = isDev
      ? path.join(process.cwd(), 'resources')
      : path.join(process.resourcesPath, 'resources');

    this.modelPath = path.join(resourcesPath, 'models', 'llama-3.1-8b-instruct-q4.gguf');

    // Default configuration
    this._config = {
      modelPath: this.modelPath,
      contextSize: config?.contextSize ?? 8192,
      temperature: config?.temperature ?? 0.7,
      topP: config?.topP ?? 0.9,
      topK: config?.topK ?? 40,
      maxTokens: config?.maxTokens ?? 2048,
      repeatPenalty: config?.repeatPenalty ?? 1.1,
      seed: config?.seed,
    };
  }

  /**
   * Get current config
   */
  getConfig(): LLMConfig {
    return this._config;
  }

  /**
   * Initialize Llama model
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      log.info('Llama model already initialized');
      return;
    }

    try {
      log.info(`Loading Llama model from: ${this.modelPath}`);

      // Check if model file exists
      if (!fs.existsSync(this.modelPath)) {
        throw new Error(
          `Model file not found: ${this.modelPath}. Please run 'npm run download:llama' first.`
        );
      }

      const startTime = Date.now();

      // TODO: Load model with node-llama-cpp once arm64 compatible
      // For now, keep as placeholder structure
      throw new Error('Llama model integration pending - awaiting arm64 Node.js or alternative');

      // This will be enabled in Phase 3:
      // this.model = await LlamaModel.load({ modelPath: this.modelPath });
      // this.context = await this.model.createContext({ contextSize: this.config.contextSize });
      // this.session = new LlamaChatSession({ contextSequence: this.context.getSequence() });

      const loadTime = Date.now() - startTime;
      log.info(`Llama model loaded successfully in ${loadTime}ms`);

      this.isInitialized = true;
    } catch (error) {
      log.error('Failed to initialize Llama model:', error);
      throw error;
    }
  }

  /**
   * Check if model is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.session !== null;
  }

  /**
   * Generate system prompt from persona parameters
   */
  private generateSystemPrompt(persona: PersonaParameters): string {
    const formality = persona.formality > 60 ? 'formal' : persona.formality < 40 ? 'casual' : 'balanced';
    const verbosity = persona.verbosity > 60 ? 'detailed' : persona.verbosity < 40 ? 'concise' : 'balanced';
    const humor = persona.humor > 50 ? 'with humor and wit' : 'professionally';
    const lang = persona.languagePreference === 'ko' ? 'Korean' : persona.languagePreference === 'en' ? 'English' : 'the user\'s language';

    return `You are Eden, a friendly and helpful AI assistant. Your personality:
- Communication style: ${formality}, ${verbosity}
- You respond ${humor}
- Primary language: ${lang}
- Empathy level: ${persona.empathy > 70 ? 'very empathetic' : 'professional'}
- Technical depth: ${persona.technicality > 60 ? 'technical and detailed' : 'simple and clear'}

Your role is to assist users with their tasks, provide emotional support, and help boost their productivity. Be encouraging and patient.`;
  }

  /**
   * Generate response (non-streaming)
   */
  async generate(
    prompt: string,
    persona: PersonaParameters,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<{ response: string; metrics: GenerationMetrics }> {
    if (!this.isReady()) {
      await this.initialize();
    }

    try {
      const startTime = Date.now();
      const systemPrompt = this.generateSystemPrompt(persona);

      log.info(`Generating response for prompt: ${prompt.substring(0, 50)}...`);

      // Build conversation context
      let fullPrompt = `${systemPrompt}\n\n`;

      if (conversationHistory && conversationHistory.length > 0) {
        for (const msg of conversationHistory.slice(-10)) {
          // Last 10 messages
          const role = msg.role === 'user' ? 'User' : 'Eden';
          fullPrompt += `${role}: ${msg.content}\n`;
        }
      }

      fullPrompt += `User: ${prompt}\nEden:`;

      // Generate response
      // TODO: Uncomment when node-llama-cpp is compatible
      // const response = await this.session!.prompt(fullPrompt, {
      //   temperature: this.config.temperature,
      //   topP: this.config.topP,
      //   topK: this.config.topK,
      //   maxTokens: this.config.maxTokens,
      //   repeatPenalty: { ... },
      // });
      const response = 'Placeholder response';

      const totalTime = Date.now() - startTime;
      const tokenCount = response.split(' ').length; // Rough estimate

      const metrics: GenerationMetrics = {
        tokensGenerated: tokenCount,
        tokensPerSecond: tokenCount / (totalTime / 1000),
        totalTimeMs: totalTime,
        promptTokens: fullPrompt.split(' ').length,
      };

      log.info(
        `Response generated in ${totalTime}ms (${metrics.tokensPerSecond.toFixed(1)} tokens/s)`
      );

      return {
        response: response.trim(),
        metrics,
      };
    } catch (error) {
      log.error('Failed to generate response:', error);
      throw error;
    }
  }

  /**
   * Generate response with streaming
   */
  async *generateStream(
    prompt: string,
    persona: PersonaParameters,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): AsyncGenerator<StreamToken> {
    if (!this.isReady()) {
      await this.initialize();
    }

    try {
      const systemPrompt = this.generateSystemPrompt(persona);
      log.info(`Streaming response for prompt: ${prompt.substring(0, 50)}...`);

      // Build conversation context
      let fullPrompt = `${systemPrompt}\n\n`;

      if (conversationHistory && conversationHistory.length > 0) {
        for (const msg of conversationHistory.slice(-10)) {
          const role = msg.role === 'user' ? 'User' : 'Eden';
          fullPrompt += `${role}: ${msg.content}\n`;
        }
      }

      fullPrompt += `User: ${prompt}\nEden:`;

      let index = 0;

      // Stream tokens
      // TODO: Uncomment when node-llama-cpp is compatible
      // for await (const token of this.session!.promptTokens(fullPrompt, { ... })) {
      //   yield { token, index: index++ };
      // }

      // Placeholder: yield the full prompt in chunks
      const words = fullPrompt.split(' ');
      for (const word of words) {
        yield { token: word + ' ', index: index++ };
      }
    } catch (error) {
      log.error('Failed to stream response:', error);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    log.info('Cleaning up Llama service...');

    if (this.session) {
      // Session cleanup is automatic
      this.session = null;
    }

    if (this.context) {
      // Context cleanup is automatic
      this.context = null;
    }

    if (this.model) {
      // Model cleanup is automatic
      this.model = null;
    }

    this.isInitialized = false;
    log.info('Llama service cleaned up');
  }
}

// Singleton instance
let llamaServiceInstance: LlamaService | null = null;

export function getLlamaService(): LlamaService {
  if (!llamaServiceInstance) {
    llamaServiceInstance = new LlamaService();
  }
  return llamaServiceInstance;
}

export async function cleanupLlamaService(): Promise<void> {
  if (llamaServiceInstance) {
    await llamaServiceInstance.cleanup();
    llamaServiceInstance = null;
  }
}

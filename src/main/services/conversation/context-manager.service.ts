/**
 * Conversation Context Manager
 * Orchestrates RAFT, Proactive AI, VAD, and Wake Word services
 * Manages conversation state and mode switching
 */

import log from 'electron-log';
import { EventEmitter } from 'events';
import { RAFTService, type RAFTContext } from '../ai/raft.service';
import { ProactiveAIService, type ProactiveEvent } from '../ai/proactive-ai.service';
import { VADService, type VADEvent } from '../voice/vad.service';
import { WakeWordService, type WakeWordEvent } from '../voice/wakeword.service';
import { getRAGService } from '../learning/rag.service';
import { llamaService } from '../ai/llama.service';
import type { RetrievedEpisode } from '../../../shared/types/memory.types';
import type { ConversationMode, ConversationState } from '../../../shared/types/conversation.types';

export interface ConversationConfig {
  // RAFT settings
  raftEnabled: boolean;
  groundingThreshold: number; // 0.7 default
  hallucinationRiskTolerance: 'low' | 'medium' | 'high';

  // Proactive settings
  proactiveEnabled: boolean;
  proactiveFrequency: 'low' | 'medium' | 'high';
  proactivePersonality: 'reserved' | 'friendly' | 'enthusiastic';

  // Voice settings
  vadEnabled: boolean;
  vadSensitivity: 'low' | 'medium' | 'high';
  wakeWordEnabled: boolean;
  wakeWords: string[];

  // Response settings
  fastModeThreshold: number; // Similarity threshold for fast vs detailed mode (0.8)
  maxContextLength: number; // Max tokens to include in context (2000)
}

export interface ConversationContext {
  mode: ConversationMode; // 'fast' | 'detailed' | 'proactive'
  raftContext?: RAFTContext;
  proactiveEvent?: ProactiveEvent;
  vadState: 'idle' | 'listening' | 'speaking';
  lastInteraction: Date;
  idleMinutes: number;
}

/**
 * Conversation Context Manager
 * Central orchestrator for all conversation-related services
 */
export class ConversationContextManager extends EventEmitter {
  private config: ConversationConfig = {
    raftEnabled: true,
    groundingThreshold: 0.7,
    hallucinationRiskTolerance: 'medium',

    proactiveEnabled: true,
    proactiveFrequency: 'medium',
    proactivePersonality: 'friendly',

    vadEnabled: true,
    vadSensitivity: 'medium',
    wakeWordEnabled: true,
    wakeWords: ['eden', '에덴', 'hey eden', '에이든'],

    fastModeThreshold: 0.8,
    maxContextLength: 2000,
  };

  private context: ConversationContext = {
    mode: 'fast',
    vadState: 'idle',
    lastInteraction: new Date(),
    idleMinutes: 0,
  };

  private raftService: RAFTService;
  private proactiveService: ProactiveAIService;
  private vadService: VADService;
  private wakeWordService: WakeWordService;

  private isInitialized = false;
  private idleTimer: NodeJS.Timeout | null = null;

  constructor() {
    super();

    this.raftService = new RAFTService();
    this.proactiveService = new ProactiveAIService();
    this.vadService = new VADService();
    this.wakeWordService = new WakeWordService();

    this.setupEventListeners();
  }

  /**
   * Initialize all services
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      log.warn('Conversation context manager already initialized');
      return;
    }

    try {
      log.info('Initializing conversation context manager...');

      // Start proactive AI if enabled
      if (this.config.proactiveEnabled) {
        this.proactiveService.updateConfig({
          enabled: true,
          frequency: this.config.proactiveFrequency,
          personality: this.config.proactivePersonality,
        });
        this.proactiveService.start();
        log.info('Proactive AI started');
      }

      // Start VAD if enabled
      if (this.config.vadEnabled) {
        this.vadService.updateConfig({
          enabled: true,
          sensitivity: this.config.vadSensitivity,
        });
        await this.vadService.start();
        log.info('VAD started');
      }

      // Start wake word detection if enabled
      if (this.config.wakeWordEnabled) {
        this.wakeWordService.updateConfig({
          enabled: true,
          wakeWords: this.config.wakeWords,
          sensitivity: 'medium',
        });
        await this.wakeWordService.start();
        log.info('Wake word detection started');
      }

      // Start idle timer
      this.startIdleTimer();

      this.isInitialized = true;
      log.info('Conversation context manager initialized successfully');
    } catch (error) {
      log.error('Failed to initialize conversation context manager:', error);
      throw error;
    }
  }

  /**
   * Setup event listeners for all services
   */
  private setupEventListeners(): void {
    // Proactive AI events
    this.proactiveService.on('proactive-message', (event: ProactiveEvent) => {
      log.info(`Proactive message: ${event.type}`);
      this.context.mode = 'proactive';
      this.context.proactiveEvent = event;

      this.emit('proactive-message', event);
    });

    // VAD events
    this.vadService.on('vad-event', (event: VADEvent) => {
      log.info(`VAD event: ${event.type}`);

      if (event.type === 'speech_start') {
        this.context.vadState = 'speaking';
        this.emit('speech-start', event);

        // Pause proactive AI when user speaks
        if (this.config.proactiveEnabled) {
          this.proactiveService.pauseForConversation();
        }
      } else if (event.type === 'speech_end') {
        this.context.vadState = 'listening';
        this.emit('speech-end', event);

        // Trigger recording after speech ends
        log.info('Speech ended, triggering recording...');
        this.emit('trigger-recording', {
          duration: event.duration,
          timestamp: event.timestamp,
        });
      }
    });

    // Wake word events
    this.wakeWordService.on('wake-word-detected', (event: WakeWordEvent) => {
      log.info(`Wake word detected: ${event.wakeWord} (confidence: ${event.confidence})`);

      this.emit('wake-word-detected', event);

      // Activate VAD after wake word
      if (this.config.vadEnabled) {
        this.context.vadState = 'listening';
        this.emit('start-listening');
      }
    });
  }

  /**
   * Process user query with RAFT and mode detection
   */
  async processQuery(
    query: string,
    options: {
      forceMode?: ConversationMode;
      skipRAFT?: boolean;
    } = {}
  ): Promise<{
    response: string;
    context: ConversationContext;
    raftValidation?: {
      isGrounded: boolean;
      hallucinationRisk: 'low' | 'medium' | 'high';
      confidence: number;
    };
  }> {
    log.info(`Processing query: "${query.substring(0, 50)}..."`);

    // Update last interaction
    this.context.lastInteraction = new Date();
    this.context.idleMinutes = 0;

    // Retrieve relevant memory
    const ragService = getRAGService();
    const searchResult = await ragService.searchEpisodes({ query, topK: 5 });
    const retrievedDocs = searchResult.episodes;

    log.info(`Retrieved ${retrievedDocs.length} relevant episodes`);

    // Determine conversation mode
    let mode: ConversationMode = options.forceMode || this.determineMode(query, retrievedDocs);
    this.context.mode = mode;

    log.info(`Using conversation mode: ${mode}`);

    let response: string;
    let raftContext: RAFTContext | undefined;
    let validation: any;

    if (this.config.raftEnabled && !options.skipRAFT) {
      // Use RAFT for grounded response
      raftContext = await this.raftService.generateGroundedResponse(query, retrievedDocs);

      response = await this.generateResponse(query, raftContext, mode);

      // Validate response
      const groundingCheck = this.raftService.validateResponse(response, raftContext);
      const hallucinationRisk = this.raftService.assessHallucinationRisk(response, raftContext, groundingCheck);

      validation = {
        isGrounded: groundingCheck.isGrounded,
        hallucinationRisk,
        confidence: groundingCheck.confidence,
      };

      log.info(
        `Response validation - Grounded: ${validation.isGrounded}, Risk: ${validation.hallucinationRisk}`
      );

      // If hallucination risk too high, regenerate
      if (
        this.shouldRegenerateResponse(validation.hallucinationRisk, this.config.hallucinationRiskTolerance)
      ) {
        log.warn('Hallucination risk too high, regenerating response...');
        mode = 'detailed'; // Switch to detailed mode for safer response
        raftContext = await this.raftService.generateGroundedResponse(query, retrievedDocs);
        response = await this.generateResponse(query, raftContext, mode);
      }

      this.context.raftContext = raftContext;
    } else {
      // Direct response without RAFT
      response = await this.generateResponse(query, { documents: retrievedDocs } as any, mode);
    }

    // Resume proactive AI after response
    if (this.config.proactiveEnabled) {
      this.proactiveService.resumeProactive();
    }

    return {
      response,
      context: { ...this.context },
      raftValidation: validation,
    };
  }

  /**
   * Determine conversation mode based on query and context
   */
  private determineMode(query: string, retrievedDocs: RetrievedEpisode[]): ConversationMode {
    // Check for casual conversation indicators
    const casualPatterns = [
      /^(hi|hello|hey|안녕|ㅎㅇ)/i,
      /\b(how are you|what's up|what are you doing|뭐해|잘지내)\b/i,
      /^(ok|okay|thanks|thank you|cool|nice|감사|고마워|ㅇㅋ)/i,
    ];

    if (casualPatterns.some((pattern) => pattern.test(query))) {
      return 'fast';
    }

    // Check query length (short = fast, long = detailed)
    if (query.length < 30) {
      return 'fast';
    }

    // Check retrieval confidence
    if (retrievedDocs.length > 0) {
      const maxSimilarity = Math.max(...retrievedDocs.map((d) => d.similarity));

      // High similarity = fast (we have good context)
      if (maxSimilarity >= this.config.fastModeThreshold) {
        return 'fast';
      }
    }

    // Check for deep question indicators
    const deepPatterns = [
      /\b(how|why|explain|describe|what is|설명|왜|어떻게|무엇|원리)\b/i,
      /\b(implement|create|build|design|만들|구현|설계)\b/i,
      /\b(analyze|compare|review|분석|비교|검토)\b/i,
    ];

    if (deepPatterns.some((pattern) => pattern.test(query))) {
      return 'detailed';
    }

    // Default to fast mode
    return 'fast';
  }

  /**
   * Generate response using Qwen 2.5 32B LLM
   */
  private async generateResponse(
    query: string,
    context: RAFTContext | { documents: RetrievedEpisode[] },
    mode: ConversationMode
  ): Promise<string> {
    try {
      // Determine prompt mode
      let promptMode: 'fast' | 'detailed' = 'detailed';
      if (mode === 'fast') {
        promptMode = 'fast';
      } else if (mode === 'detailed') {
        promptMode = 'detailed';
      }

      // Create prompt (RAFT or standard)
      const prompt = this.config.raftEnabled
        ? this.raftService.createRAFTPrompt(query, context as RAFTContext, promptMode)
        : this.createStandardPrompt(query, context.documents, mode);

      log.debug(`Generated prompt (${mode} mode): ${prompt.substring(0, 100)}...`);

      // Adjust LLM parameters based on mode
      const temperature = mode === 'fast' ? 0.8 : 0.7; // Slightly higher temp for casual chat
      const maxTokens = mode === 'fast' ? 150 : 500; // Shorter responses for fast mode

      // Initialize LLM if needed
      if (!llamaService.isInitialized()) {
        log.info('Initializing Qwen 2.5 32B model...');
        await llamaService.initialize();
      }

      // Generate response with Qwen 2.5 32B
      const response = await llamaService.generateResponse(prompt);

      log.info(`LLM response generated (mode: ${mode}, length: ${response.length})`);

      return response;
    } catch (error) {
      log.error('Failed to generate LLM response', error);

      // Fallback to simple response on error
      if (mode === 'fast') {
        return '죄송해요, 지금은 응답할 수 없어요. 다시 시도해주세요!';
      } else {
        return '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      }
    }
  }

  /**
   * Create standard prompt without RAFT
   */
  private createStandardPrompt(
    query: string,
    documents: RetrievedEpisode[],
    mode: ConversationMode
  ): string {
    let prompt = '';

    if (documents.length > 0) {
      prompt += '## Context from memory:\n\n';
      for (const doc of documents.slice(0, 3)) {
        prompt += `User: ${doc.userMessage}\n`;
        prompt += `Eden: ${doc.edenResponse}\n\n`;
      }
      prompt += '---\n\n';
    }

    if (mode === 'fast') {
      prompt += `User: ${query}\n\nRespond briefly in 1-2 sentences.`;
    } else {
      prompt += `User: ${query}\n\nProvide a detailed, well-reasoned response.`;
    }

    return prompt;
  }

  /**
   * Check if response should be regenerated due to hallucination risk
   */
  private shouldRegenerateResponse(
    risk: 'low' | 'medium' | 'high',
    tolerance: 'low' | 'medium' | 'high'
  ): boolean {
    const riskLevels = { low: 1, medium: 2, high: 3 };
    const toleranceLevels = { low: 1, medium: 2, high: 3 };

    return riskLevels[risk] > toleranceLevels[tolerance];
  }

  /**
   * Start idle timer (checks every minute)
   */
  private startIdleTimer(): void {
    this.idleTimer = setInterval(() => {
      const now = new Date();
      const diffMs = now.getTime() - this.context.lastInteraction.getTime();
      this.context.idleMinutes = Math.floor(diffMs / 60000);

      // Notify if idle for extended period
      if (this.context.idleMinutes > 0 && this.context.idleMinutes % 15 === 0) {
        log.debug(`User idle for ${this.context.idleMinutes} minutes`);
        this.emit('idle-update', { idleMinutes: this.context.idleMinutes });
      }
    }, 60000);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ConversationConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };

    // Update child services
    if (config.proactiveEnabled !== undefined || config.proactiveFrequency || config.proactivePersonality) {
      this.proactiveService.updateConfig({
        enabled: config.proactiveEnabled ?? this.config.proactiveEnabled,
        frequency: config.proactiveFrequency ?? this.config.proactiveFrequency,
        personality: config.proactivePersonality ?? this.config.proactivePersonality,
      });
    }

    if (config.vadEnabled !== undefined || config.vadSensitivity) {
      this.vadService.updateConfig({
        enabled: config.vadEnabled ?? this.config.vadEnabled,
        sensitivity: config.vadSensitivity ?? this.config.vadSensitivity,
      });
    }

    if (config.wakeWordEnabled !== undefined || config.wakeWords) {
      this.wakeWordService.updateConfig({
        enabled: config.wakeWordEnabled ?? this.config.wakeWordEnabled,
        wakeWords: config.wakeWords ?? this.config.wakeWords,
      });
    }

    log.info('Conversation config updated:', this.config);
  }

  /**
   * Get current context
   */
  getContext(): ConversationContext {
    return { ...this.context };
  }

  /**
   * Get current configuration
   */
  getConfig(): ConversationConfig {
    return { ...this.config };
  }

  /**
   * Manually trigger proactive message
   */
  triggerProactiveMessage(): void {
    if (this.config.proactiveEnabled) {
      this.proactiveService.triggerProactive();
    }
  }

  /**
   * Start voice listening
   */
  async startListening(): Promise<void> {
    if (this.config.vadEnabled) {
      await this.vadService.start();
      this.context.vadState = 'listening';
    }
  }

  /**
   * Stop voice listening
   */
  stopListening(): void {
    if (this.config.vadEnabled) {
      this.vadService.stop();
      this.context.vadState = 'idle';
    }
  }

  /**
   * Enable/disable proactive mode
   */
  setProactiveEnabled(enabled: boolean): void {
    this.config.proactiveEnabled = enabled;

    if (enabled) {
      this.proactiveService.start();
    } else {
      this.proactiveService.stop();
    }

    log.info(`Proactive mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    log.info('Cleaning up conversation context manager...');

    if (this.idleTimer) {
      clearInterval(this.idleTimer);
      this.idleTimer = null;
    }

    this.proactiveService.stop();
    this.vadService.stop();
    this.wakeWordService.stop();

    this.removeAllListeners();
    this.isInitialized = false;

    log.info('Conversation context manager cleaned up');
  }

  /**
   * Check if initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Singleton instance
let contextManagerInstance: ConversationContextManager | null = null;

export function getConversationContextManager(): ConversationContextManager {
  if (!contextManagerInstance) {
    contextManagerInstance = new ConversationContextManager();
  }
  return contextManagerInstance;
}

export function cleanupConversationContextManager(): void {
  if (contextManagerInstance) {
    contextManagerInstance.cleanup();
    contextManagerInstance = null;
  }
}

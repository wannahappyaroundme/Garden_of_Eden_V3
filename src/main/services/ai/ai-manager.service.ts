/**
 * AI Manager Service
 * Orchestrates all AI services (Llama, Whisper, TTS)
 */

import log from 'electron-log';
import { getTTSService, cleanupTTSService } from './tts.service';
import { getWhisperService, cleanupWhisperService } from './whisper.service';
import type { PersonaParameters } from '@shared/types/persona.types';

export class AIManagerService {
  private ttsService = getTTSService();
  private whisperService = getWhisperService();
  private isInitialized = false;

  /**
   * Initialize all AI services
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      log.info('AI Manager already initialized');
      return;
    }

    try {
      log.info('Initializing AI Manager...');

      // Initialize TTS (system native, always available)
      await this.ttsService.initialize();

      // Initialize Whisper (optional, requires model)
      try {
        await this.whisperService.initialize();
      } catch (error) {
        log.warn('Whisper initialization failed (will use placeholder):', error);
      }

      // Note: Llama service will be initialized on-demand when needed
      // to avoid long startup time

      this.isInitialized = true;
      log.info('AI Manager initialized successfully');
    } catch (error) {
      log.error('Failed to initialize AI Manager:', error);
      throw error;
    }
  }

  /**
   * Generate chat response
   * Uses placeholder response for now, will integrate Llama when model is available
   */
  async generateResponse(
    message: string,
    persona: PersonaParameters,
    _conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<{ response: string; metrics?: { responseTime: number; tokens?: number } }> {
    const startTime = Date.now();

    try {
      log.info(`Generating response for: "${message.substring(0, 50)}..."`);

      // TODO: When Llama model is available, use it here
      // For now, generate a smart placeholder response based on persona

      const response = this.generatePlaceholderResponse(message, persona);
      const responseTime = Date.now() - startTime;

      log.info(`Response generated in ${responseTime}ms`);

      return {
        response,
        metrics: {
          responseTime,
          tokens: response.split(' ').length,
        },
      };
    } catch (error) {
      log.error('Failed to generate response:', error);
      throw error;
    }
  }

  /**
   * Generate placeholder response based on persona
   */
  private generatePlaceholderResponse(message: string, persona: PersonaParameters): string {
    const isKorean = true; // Default to Korean for now
    const isFormal = persona.formality > 60;
    const isHumorous = persona.humor > 50;
    const isVerbose = persona.verbosity > 60;

    // Detect message intent
    const isGreeting = /안녕|hello|hi|hey/i.test(message);
    const isQuestion = message.includes('?') || /무엇|어떻게|왜|what|how|why/i.test(message);
    const isCode = /코드|code|프로그래밍|programming/i.test(message);

    if (isKorean) {
      const honorific = isFormal ? '요' : '';

      if (isGreeting) {
        return isHumorous
          ? `안녕하세${honorific}! 반가워${honorific} 🌟 오늘 기분이 어떠세${honorific}?`
          : `안녕하세${honorific}. 무엇을 도와드릴까${honorific}?`;
      }

      if (isQuestion) {
        const verbose = isVerbose ? '자세히 설명드리자면, ' : '';
        return `${verbose}좋은 질문이에${honorific}! "${message}"에 대해 ${
          isVerbose ? '상세하게' : ''
        } 답변해드릴게${honorific}.\n\n💡 참고: 현재 AI 모델 통합 중이라 임시 응답을 제공하고 있어${honorific}. 곧 실제 AI 기능이 추가될 예정이에${honorific}!`;
      }

      if (isCode) {
        return `코드 관련 질문이시군${honorific}! ${
          isVerbose ? '프로그래밍은 제가 가장 좋아하는 분야 중 하나에${honorific}. ' : ''
        }실제 AI 모델이 통합되면 더 정확한 코드 지원을 제공할 수 있을 거에${honorific}.\n\n입력하신 내용: "${message}"`;
      }

      return `알겠${isVerbose ? '습니다' : '어${honorific}'}! "${message}"${
        isVerbose ? '에 대해 말씀하셨군요' : ''
      }.\n\n현재 저는 개발 중이며, ${
        isHumorous ? '열심히 배우는 중이에요 📚✨' : '곧 완전한 기능을 제공할 예정이에요'
      }. ${isFormal ? '조금만 기다려주세요.' : '기대해주세요!'}`;
    } else {
      // English
      if (isGreeting) {
        return isHumorous
          ? `Hello! Nice to meet you! 🌟 How are you doing today?`
          : `Hello. How can I help you?`;
      }

      if (isQuestion) {
        const verbose = isVerbose ? 'Let me explain in detail. ' : '';
        return `${verbose}Great question about "${message}"! ${
          isVerbose ? 'I would love to provide a comprehensive answer. ' : ''
        }\n\n💡 Note: I'm currently in development with AI model integration in progress. Full AI capabilities coming soon!`;
      }

      if (isCode) {
        return `A coding question! ${
          isVerbose ? 'Programming is one of my favorite topics. ' : ''
        }Once the AI model is integrated, I'll provide much better code assistance.\n\nYour input: "${message}"`;
      }

      const verboseExtra = isVerbose ? ' - I understand what you\'re asking about' : '';
      const devStatus = isHumorous ? 'and learning fast! 📚✨' : 'and will soon have full AI capabilities';
      const closing = isFormal ? 'Please stay tuned.' : 'Stay tuned!';

      return `Got it! "${message}"${verboseExtra}.\n\nI'm currently under development ${devStatus}. ${closing}`;
    }
  }

  /**
   * Start voice recording
   */
  async startVoiceInput(): Promise<boolean> {
    try {
      await this.whisperService.startRecording();
      return true;
    } catch (error) {
      log.error('Failed to start voice input:', error);
      return false;
    }
  }

  /**
   * Stop voice recording and get transcript
   */
  async stopVoiceInput(): Promise<{ transcript: string; language: 'ko' | 'en' }> {
    try {
      return await this.whisperService.stopRecording();
    } catch (error) {
      log.error('Failed to stop voice input:', error);
      return { transcript: '', language: 'ko' };
    }
  }

  /**
   * Speak text using TTS
   */
  async speak(text: string): Promise<void> {
    try {
      await this.ttsService.speak(text);
    } catch (error) {
      log.error('Failed to speak text:', error);
      throw error;
    }
  }

  /**
   * Stop current TTS speech
   */
  async stopSpeaking(): Promise<void> {
    try {
      await this.ttsService.stop();
    } catch (error) {
      log.error('Failed to stop speaking:', error);
    }
  }

  /**
   * Get TTS voices
   */
  getTTSVoices(): string[] {
    return this.ttsService.getAvailableVoices();
  }

  /**
   * Cleanup all AI services
   */
  async cleanup(): Promise<void> {
    log.info('Cleaning up AI Manager...');

    await cleanupTTSService();
    await cleanupWhisperService();
    // Llama cleanup will be added when integrated

    this.isInitialized = false;
    log.info('AI Manager cleaned up');
  }
}

// Singleton instance
let aiManagerInstance: AIManagerService | null = null;

export function getAIManager(): AIManagerService {
  if (!aiManagerInstance) {
    aiManagerInstance = new AIManagerService();
  }
  return aiManagerInstance;
}

export async function cleanupAIManager(): Promise<void> {
  if (aiManagerInstance) {
    await aiManagerInstance.cleanup();
    aiManagerInstance = null;
  }
}

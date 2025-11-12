/**
 * Whisper Service
 * Handles Whisper Large V3 for speech-to-text using @huggingface/transformers
 */

import path from 'path';
import fs from 'fs/promises';
import log from 'electron-log';
import type { WhisperConfig } from '@shared/types/ai.types';

// Types for @huggingface/transformers (will be imported dynamically)
type WhisperPipeline = any;

export class WhisperService {
  private modelPath: string;
  private _config: WhisperConfig;
  private isInitialized = false;
  private isRecording = false;
  private pipeline: WhisperPipeline | null = null;
  private isLoading = false;

  constructor(config?: Partial<WhisperConfig>) {
    // Determine model path - use user home directory for models
    const homeDir = process.env.HOME || process.env.USERPROFILE || '.';
    this.modelPath = path.join(homeDir, '.garden-of-eden-v3', 'models', 'whisper-large-v3');

    // Default configuration
    this._config = {
      modelPath: this.modelPath,
      language: config?.language ?? 'auto',
      task: config?.task ?? 'transcribe',
    };
  }

  /**
   * Get current config
   */
  getConfig(): WhisperConfig {
    return this._config;
  }

  /**
   * Initialize Whisper model
   */
  async initialize(): Promise<void> {
    if (this.isLoading) {
      throw new Error('Whisper model is already loading');
    }

    if (this.isInitialized) {
      log.info('Whisper model already initialized');
      return;
    }

    this.isLoading = true;

    try {
      log.info(`Initializing Whisper model from: ${this.modelPath}`);

      // Dynamically import @huggingface/transformers (ES Module)
      const { pipeline } = await import('@huggingface/transformers');

      // Check if local model exists, otherwise use Hugging Face model
      let modelSource = this.modelPath;
      try {
        await fs.access(this.modelPath);
        log.info('Using local Whisper model');
      } catch {
        log.warn(
          `Local model not found at ${this.modelPath}. Using Hugging Face model (will auto-download)`
        );
        // Use Hugging Face model - Xenova/whisper-small for faster initial setup
        // Can be changed to whisper-large-v3 for better accuracy (but much larger)
        modelSource = 'Xenova/whisper-small';
      }

      // Create Whisper pipeline for automatic speech recognition
      log.info('Creating Whisper pipeline...', { model: modelSource });
      this.pipeline = await pipeline('automatic-speech-recognition', modelSource, {
        device: 'cpu', // Use CPU for stability
      });

      log.info('Whisper model loaded successfully');
      this.isInitialized = true;
    } catch (error) {
      log.error('Failed to initialize Whisper model:', error);
      this.isLoading = false;
      throw error;
    }

    this.isLoading = false;
  }

  /**
   * Check if model is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Start audio recording
   */
  async startRecording(): Promise<void> {
    if (this.isRecording) {
      log.warn('Recording already in progress');
      return;
    }

    log.info('Starting audio recording...');

    // TODO: Start recording audio from microphone
    // This requires audio capture library (e.g., node-record-lpcm16)

    this.isRecording = true;
    log.info('Audio recording started (placeholder)');
  }

  /**
   * Stop audio recording and transcribe
   */
  async stopRecording(): Promise<{ transcript: string; language: 'ko' | 'en' }> {
    if (!this.isRecording) {
      log.warn('No recording in progress');
      return { transcript: '', language: 'ko' };
    }

    log.info('Stopping audio recording and transcribing...');

    // TODO: Stop recording and save audio file
    // TODO: Pass audio file to Whisper for transcription
    // For now, return placeholder

    this.isRecording = false;

    const placeholderTranscript = '음성 인식 기능은 구현 중입니다.';
    const language: 'ko' | 'en' = 'ko';

    log.info('Audio transcription completed (placeholder)');

    return {
      transcript: placeholderTranscript,
      language,
    };
  }

  /**
   * Transcribe audio file
   */
  async transcribeFile(audioFilePath: string): Promise<{ transcript: string; language: 'ko' | 'en' }> {
    if (!this.isReady()) {
      await this.initialize();
    }

    if (!this.pipeline) {
      throw new Error('Whisper pipeline not initialized');
    }

    log.info(`Transcribing audio file: ${audioFilePath}`);

    // Check if file exists
    try {
      await fs.access(audioFilePath);
    } catch {
      throw new Error(`Audio file not found: ${audioFilePath}`);
    }

    try {
      const startTime = Date.now();

      // Run transcription
      const result = await this.pipeline(audioFilePath, {
        language: this._config.language === 'auto' ? undefined : this._config.language,
        task: this._config.task,
        return_timestamps: false,
      });

      const duration = Date.now() - startTime;

      log.info('Audio file transcription completed', {
        duration,
        textLength: result.text?.length || 0
      });

      // Detect language if auto
      let detectedLanguage: 'ko' | 'en' = 'ko';
      if (result.language) {
        detectedLanguage = result.language === 'korean' ? 'ko' : 'en';
      }

      return {
        transcript: result.text || '',
        language: detectedLanguage,
      };
    } catch (error) {
      log.error('Failed to transcribe audio file:', error);
      throw error;
    }
  }

  /**
   * Check if currently recording
   */
  isRecordingActive(): boolean {
    return this.isRecording;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    log.info('Cleaning up Whisper service...');

    if (this.isRecording) {
      // Stop recording if active
      this.isRecording = false;
    }

    // Cleanup pipeline
    if (this.pipeline) {
      this.pipeline = null;
    }

    this.isInitialized = false;
    log.info('Whisper service cleaned up');
  }

  /**
   * Set language configuration
   */
  setLanguage(language: 'auto' | 'ko' | 'en'): void {
    this._config.language = language;
    log.info('Whisper language updated', { language });
  }

  /**
   * Set task configuration
   */
  setTask(task: 'transcribe' | 'translate'): void {
    this._config.task = task;
    log.info('Whisper task updated', { task });
  }
}

// Singleton instance
let whisperServiceInstance: WhisperService | null = null;

export function getWhisperService(): WhisperService {
  if (!whisperServiceInstance) {
    whisperServiceInstance = new WhisperService();
  }
  return whisperServiceInstance;
}

export async function cleanupWhisperService(): Promise<void> {
  if (whisperServiceInstance) {
    await whisperServiceInstance.cleanup();
    whisperServiceInstance = null;
  }
}

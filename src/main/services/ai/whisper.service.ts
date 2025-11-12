/**
 * Whisper Service
 * Handles Whisper Large V3 for speech-to-text
 * TODO: Integrate actual Whisper model (requires whisper.cpp Node bindings or subprocess)
 */

import path from 'path';
import fs from 'fs';
import log from 'electron-log';
import type { WhisperConfig } from '@shared/types/ai.types';

export class WhisperService {
  private modelPath: string;
  private _config: WhisperConfig;
  private isInitialized = false;
  private isRecording = false;

  constructor(config?: Partial<WhisperConfig>) {
    // Determine model path
    const isDev = process.env.NODE_ENV === 'development';
    const resourcesPath = isDev
      ? path.join(process.cwd(), 'resources')
      : path.join(process.resourcesPath, 'resources');

    this.modelPath = path.join(resourcesPath, 'models', 'whisper-large-v3.bin');

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
    if (this.isInitialized) {
      log.info('Whisper model already initialized');
      return;
    }

    try {
      log.info(`Initializing Whisper model from: ${this.modelPath}`);

      // Check if model file exists
      if (!fs.existsSync(this.modelPath)) {
        log.warn(
          `Model file not found: ${this.modelPath}. Please run 'npm run download:whisper' first.`
        );
        // Don't throw error, allow app to run without Whisper
        return;
      }

      // TODO: Load Whisper model
      // This requires whisper.cpp bindings or calling whisper executable as subprocess
      // For now, we'll mark as initialized with placeholder
      log.info('Whisper service initialized (placeholder)');

      this.isInitialized = true;
    } catch (error) {
      log.error('Failed to initialize Whisper model:', error);
      throw error;
    }
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

    log.info(`Transcribing audio file: ${audioFilePath}`);

    // Check if file exists
    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file not found: ${audioFilePath}`);
    }

    // TODO: Call Whisper model to transcribe audio
    // This requires whisper.cpp bindings

    const placeholderTranscript = '음성 파일 인식 기능은 구현 중입니다.';
    const language: 'ko' | 'en' = 'ko';

    log.info('Audio file transcription completed (placeholder)');

    return {
      transcript: placeholderTranscript,
      language,
    };
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

    // TODO: Cleanup Whisper model resources

    this.isInitialized = false;
    log.info('Whisper service cleaned up');
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

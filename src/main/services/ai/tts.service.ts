/**
 * Text-to-Speech Service
 * Uses system native TTS (macOS: AVFoundation, Windows: SAPI)
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import log from 'electron-log';
import type { TTSConfig } from '../../../shared/types/ai.types';

const execAsync = promisify(exec);

export class TTSService {
  private config: TTSConfig;
  private platform: NodeJS.Platform;
  private availableVoices: string[] = [];
  private isInitialized = false;
  private isSpeaking = false;

  constructor(config?: Partial<TTSConfig>) {
    this.platform = process.platform;

    // Default configuration
    this.config = {
      voice: config?.voice ?? this.getDefaultVoice(),
      rate: config?.rate ?? 1.0,
      volume: config?.volume ?? 1.0,
      language: config?.language ?? 'ko',
    };
  }

  /**
   * Get default voice based on platform and language
   */
  private getDefaultVoice(): string {
    if (this.platform === 'darwin') {
      // macOS
      return this.config?.language === 'ko' ? 'Yuna' : 'Samantha';
    } else if (this.platform === 'win32') {
      // Windows
      return this.config?.language === 'ko' ? 'Microsoft Heami Desktop' : 'Microsoft Zira Desktop';
    }
    return '';
  }

  /**
   * Initialize TTS service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      log.info('TTS service already initialized');
      return;
    }

    try {
      log.info(`Initializing TTS service on ${this.platform}...`);

      // Get available voices
      await this.loadAvailableVoices();

      this.isInitialized = true;
      log.info(`TTS service initialized with ${this.availableVoices.length} voices`);
    } catch (error) {
      log.error('Failed to initialize TTS service:', error);
      throw error;
    }
  }

  /**
   * Load available voices from system
   */
  private async loadAvailableVoices(): Promise<void> {
    try {
      if (this.platform === 'darwin') {
        // macOS: Use 'say -v ?' to list voices
        const { stdout } = await execAsync('say -v ?');
        this.availableVoices = stdout
          .split('\n')
          .filter((line) => line.trim())
          .map((line) => line.split(/\s+/)[0]);
      } else if (this.platform === 'win32') {
        // Windows: List voices using PowerShell
        const script = `Add-Type -AssemblyName System.Speech;
          $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;
          $synth.GetInstalledVoices() | ForEach-Object { $_.VoiceInfo.Name }`;
        const { stdout } = await execAsync(`powershell -Command "${script}"`);
        this.availableVoices = stdout
          .split('\n')
          .filter((line) => line.trim())
          .map((line) => line.trim());
      } else {
        log.warn(`TTS not supported on platform: ${this.platform}`);
        this.availableVoices = [];
      }

      log.info(`Available TTS voices: ${this.availableVoices.join(', ')}`);
    } catch (error) {
      log.error('Failed to load TTS voices:', error);
      this.availableVoices = [];
    }
  }

  /**
   * Check if TTS is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): string[] {
    return [...this.availableVoices];
  }

  /**
   * Speak text using system TTS
   */
  async speak(text: string): Promise<void> {
    if (!this.isReady()) {
      await this.initialize();
    }

    if (this.isSpeaking) {
      log.warn('TTS already speaking, stopping previous speech');
      await this.stop();
    }

    try {
      log.info(`Speaking text: "${text.substring(0, 50)}..."`);
      this.isSpeaking = true;

      if (this.platform === 'darwin') {
        // macOS: Use 'say' command
        const rateArg = Math.round(this.config.rate * 200); // Convert to words per minute
        const voiceArg = this.config.voice ? `-v ${this.config.voice}` : '';
        const command = `say ${voiceArg} -r ${rateArg} "${text.replace(/"/g, '\\"')}"`;

        await execAsync(command);
      } else if (this.platform === 'win32') {
        // Windows: Use PowerShell with System.Speech
        const script = `
          Add-Type -AssemblyName System.Speech;
          $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;
          ${this.config.voice ? `$synth.SelectVoice('${this.config.voice}');` : ''}
          $synth.Rate = ${Math.round((this.config.rate - 1) * 10)};
          $synth.Volume = ${Math.round(this.config.volume * 100)};
          $synth.Speak('${text.replace(/'/g, "''")}');
        `;
        await execAsync(`powershell -Command "${script}"`);
      } else {
        log.warn(`TTS not supported on platform: ${this.platform}`);
      }

      this.isSpeaking = false;
      log.info('Speech completed');
    } catch (error) {
      this.isSpeaking = false;
      log.error('Failed to speak text:', error);
      throw error;
    }
  }

  /**
   * Stop current speech
   */
  async stop(): Promise<void> {
    if (!this.isSpeaking) {
      return;
    }

    log.info('Stopping TTS speech...');

    try {
      if (this.platform === 'darwin') {
        // macOS: Kill 'say' process
        await execAsync('killall say');
      } else if (this.platform === 'win32') {
        // Windows: More complex, would need process ID tracking
        // For now, just mark as not speaking
      }

      this.isSpeaking = false;
      log.info('TTS speech stopped');
    } catch (error) {
      log.error('Failed to stop TTS speech:', error);
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeakingActive(): boolean {
    return this.isSpeaking;
  }

  /**
   * Update TTS configuration
   */
  updateConfig(config: Partial<TTSConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
    log.info('TTS configuration updated:', this.config);
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    log.info('Cleaning up TTS service...');

    if (this.isSpeaking) {
      await this.stop();
    }

    this.isInitialized = false;
    log.info('TTS service cleaned up');
  }
}

// Singleton instance
let ttsServiceInstance: TTSService | null = null;

export function getTTSService(): TTSService {
  if (!ttsServiceInstance) {
    ttsServiceInstance = new TTSService();
  }
  return ttsServiceInstance;
}

export async function cleanupTTSService(): Promise<void> {
  if (ttsServiceInstance) {
    await ttsServiceInstance.cleanup();
    ttsServiceInstance = null;
  }
}

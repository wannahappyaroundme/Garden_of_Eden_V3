/**
 * Wake Word Detection Service
 * Detects "Eden" or custom wake words to activate voice assistant
 *
 * NOTE: This service requires Web Speech API and should eventually
 * run in the renderer process where browser APIs are available.
 * For now, we use type declarations to satisfy TypeScript.
 */

import log from 'electron-log';
import { EventEmitter } from 'events';

// Declare browser types for TypeScript (will be available in renderer)
declare const window: any;
declare const AudioContext: any;

export interface WakeWordConfig {
  enabled: boolean;
  wakeWords: string[]; // ["eden", "에덴", "hey eden"]
  sensitivity: 'low' | 'medium' | 'high';
  confirmationSound: boolean; // Play sound when wake word detected
}

export interface WakeWordEvent {
  wakeWord: string;
  confidence: number;
  timestamp: Date;
}

/**
 * Wake Word Detection Service
 * Listens for wake words to activate assistant
 */
export class WakeWordService extends EventEmitter {
  private config: WakeWordConfig = {
    enabled: true,
    wakeWords: ['eden', '에덴', 'hey eden', '에이든'],
    sensitivity: 'medium',
    confirmationSound: true,
  };

  private isListening = false;
  private audioContext: any | null = null;
  private recognizer: any = null; // Will use Web Speech API or custom model

  /**
   * Start wake word detection
   */
  async start(): Promise<void> {
    if (this.isListening) {
      log.warn('Wake word detection already running');
      return;
    }

    try {
      log.info('Starting wake word detection...');

      // Use Web Speech API for wake word detection
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        await this.startWebSpeechRecognition();
      } else {
        log.warn('Speech recognition not supported, falling back to pattern matching');
        await this.startPatternMatching();
      }

      this.isListening = true;
      log.info('Wake word detection started');
    } catch (error) {
      log.error('Failed to start wake word detection:', error);
      throw error;
    }
  }

  /**
   * Stop wake word detection
   */
  stop(): void {
    if (!this.isListening) {
      return;
    }

    log.info('Stopping wake word detection...');

    if (this.recognizer) {
      this.recognizer.stop();
      this.recognizer = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isListening = false;
    log.info('Wake word detection stopped');
  }

  /**
   * Start Web Speech API recognition
   */
  private async startWebSpeechRecognition(): Promise<void> {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    this.recognizer = new SpeechRecognition();
    this.recognizer.continuous = true;
    this.recognizer.interimResults = true;
    this.recognizer.lang = 'ko-KR'; // Korean + English

    this.recognizer.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript.toLowerCase().trim();

      log.debug(`Speech recognized: "${transcript}"`);

      // Check if transcript contains wake word
      const detectedWakeWord = this.checkWakeWord(transcript);

      if (detectedWakeWord) {
        const confidence = result[0].confidence;

        this.emit('wake-word-detected', {
          wakeWord: detectedWakeWord,
          confidence,
          timestamp: new Date(),
        } as WakeWordEvent);

        log.info(`Wake word detected: "${detectedWakeWord}" (confidence: ${confidence.toFixed(2)})`);

        if (this.config.confirmationSound) {
          this.playConfirmationSound();
        }
      }
    };

    this.recognizer.onerror = (event: any) => {
      log.error('Speech recognition error:', event.error);
    };

    this.recognizer.onend = () => {
      // Restart if still supposed to be listening
      if (this.isListening) {
        setTimeout(() => {
          if (this.recognizer && this.isListening) {
            this.recognizer.start();
          }
        }, 100);
      }
    };

    this.recognizer.start();
  }

  /**
   * Start simple pattern matching (fallback)
   */
  private async startPatternMatching(): Promise<void> {
    // This would use a more basic audio analysis
    // For now, we'll just log that it's not fully implemented
    log.warn('Pattern matching wake word detection not fully implemented');
    log.info('Please use a browser that supports Web Speech API');
  }

  /**
   * Check if transcript contains wake word
   */
  private checkWakeWord(transcript: string): string | null {
    const threshold = this.getSensitivityThreshold();

    for (const wakeWord of this.config.wakeWords) {
      // Exact match
      if (transcript === wakeWord) {
        return wakeWord;
      }

      // Contains match
      if (transcript.includes(wakeWord)) {
        return wakeWord;
      }

      // Fuzzy match (edit distance)
      if (this.fuzzyMatch(transcript, wakeWord, threshold)) {
        return wakeWord;
      }
    }

    return null;
  }

  /**
   * Fuzzy string matching (Levenshtein distance)
   */
  private fuzzyMatch(str1: string, str2: string, threshold: number): boolean {
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    const similarity = 1 - distance / maxLength;

    return similarity >= threshold;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // Substitution
            matrix[i][j - 1] + 1, // Insertion
            matrix[i - 1][j] + 1 // Deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get sensitivity threshold for fuzzy matching
   */
  private getSensitivityThreshold(): number {
    const thresholds = {
      low: 0.6, // 60% similarity required
      medium: 0.75, // 75% similarity
      high: 0.85, // 85% similarity
    };

    return thresholds[this.config.sensitivity];
  }

  /**
   * Play confirmation sound
   */
  private playConfirmationSound(): void {
    // Create a simple beep sound
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = 800; // 800 Hz tone
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  /**
   * Add custom wake word
   */
  addWakeWord(wakeWord: string): void {
    if (!this.config.wakeWords.includes(wakeWord.toLowerCase())) {
      this.config.wakeWords.push(wakeWord.toLowerCase());
      log.info(`Added wake word: "${wakeWord}"`);
    }
  }

  /**
   * Remove wake word
   */
  removeWakeWord(wakeWord: string): void {
    const index = this.config.wakeWords.indexOf(wakeWord.toLowerCase());
    if (index !== -1) {
      this.config.wakeWords.splice(index, 1);
      log.info(`Removed wake word: "${wakeWord}"`);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<WakeWordConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };

    log.info('Wake word config updated:', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): WakeWordConfig {
    return { ...this.config };
  }

  /**
   * Get listening status
   */
  isActive(): boolean {
    return this.isListening;
  }
}

// Singleton instance
let wakeWordServiceInstance: WakeWordService | null = null;

export function getWakeWordService(): WakeWordService {
  if (!wakeWordServiceInstance) {
    wakeWordServiceInstance = new WakeWordService();
  }
  return wakeWordServiceInstance;
}

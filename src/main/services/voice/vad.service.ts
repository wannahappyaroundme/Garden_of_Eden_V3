/**
 * Voice Activity Detection (VAD) Service
 * Detects when user starts/stops speaking for automatic recording
 *
 * NOTE: This service requires Web Audio API and should eventually
 * run in the renderer process where browser APIs are available.
 * For now, we use type declarations to satisfy TypeScript.
 */

import log from 'electron-log';
import { EventEmitter } from 'events';

// Declare browser types for TypeScript (will be available in renderer)
declare const AudioContext: any;
declare const navigator: any;

export interface VADConfig {
  enabled: boolean;
  sensitivity: 'low' | 'medium' | 'high'; // Detection sensitivity
  minSpeechDuration: number; // Minimum speech duration in ms
  silenceDuration: number; // Silence duration to stop recording
  energyThreshold: number; // Audio energy threshold
}

export interface VADEvent {
  type: 'speech_start' | 'speech_end' | 'speech_detected';
  timestamp: Date;
  confidence: number; // 0-1 confidence
  duration?: number; // Speech duration in ms
}

/**
 * Voice Activity Detection Service
 * Monitors audio input and detects speech
 */
export class VADService extends EventEmitter {
  private config: VADConfig = {
    enabled: true,
    sensitivity: 'medium',
    minSpeechDuration: 300, // 300ms minimum
    silenceDuration: 1500, // 1.5s silence = end
    energyThreshold: 0.01, // Adjust based on testing
  };

  private isMonitoring = false;
  private isSpeaking = false;
  private speechStartTime: number | null = null;
  private lastSpeechTime: number | null = null;
  private audioContext: any | null = null;
  private analyser: any | null = null;
  private microphone: any | null = null;
  private monitorInterval: NodeJS.Timeout | null = null;

  /**
   * Start VAD monitoring
   */
  async start(): Promise<void> {
    if (this.isMonitoring) {
      log.warn('VAD already monitoring');
      return;
    }

    try {
      log.info('Starting VAD service...');

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Create audio context
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      // Connect microphone
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);

      // Start monitoring
      this.isMonitoring = true;
      this.monitorInterval = setInterval(() => {
        this.checkAudioLevel();
      }, 100); // Check every 100ms

      log.info('VAD service started');
    } catch (error) {
      log.error('Failed to start VAD:', error);
      throw error;
    }
  }

  /**
   * Stop VAD monitoring
   */
  stop(): void {
    if (!this.isMonitoring) {
      return;
    }

    log.info('Stopping VAD service...');

    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }

    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isMonitoring = false;
    this.isSpeaking = false;
    this.speechStartTime = null;
    this.lastSpeechTime = null;

    log.info('VAD service stopped');
  }

  /**
   * Check audio level for speech detection
   */
  private checkAudioLevel(): void {
    if (!this.analyser || !this.config.enabled) {
      return;
    }

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(dataArray);

    // Calculate RMS energy
    const energy = this.calculateEnergy(dataArray);

    const threshold = this.getEnergyThreshold();
    const isSpeech = energy > threshold;

    const now = Date.now();

    if (isSpeech) {
      this.lastSpeechTime = now;

      if (!this.isSpeaking) {
        // Speech started
        this.speechStartTime = now;
        this.isSpeaking = true;

        this.emit('vad-event', {
          type: 'speech_start',
          timestamp: new Date(),
          confidence: Math.min(energy / threshold, 1.0),
        } as VADEvent);

        log.debug('Speech started');
      }
    } else if (this.isSpeaking && this.lastSpeechTime) {
      // Check if silence duration exceeded
      const silenceDuration = now - this.lastSpeechTime;

      if (silenceDuration >= this.config.silenceDuration) {
        // Speech ended
        const speechDuration = this.lastSpeechTime - this.speechStartTime!;

        // Only emit if speech was long enough
        if (speechDuration >= this.config.minSpeechDuration) {
          this.emit('vad-event', {
            type: 'speech_end',
            timestamp: new Date(),
            confidence: 0.9,
            duration: speechDuration,
          } as VADEvent);

          log.debug(`Speech ended (duration: ${speechDuration}ms)`);
        }

        this.isSpeaking = false;
        this.speechStartTime = null;
      }
    }
  }

  /**
   * Calculate audio energy (RMS)
   */
  private calculateEnergy(dataArray: Uint8Array): number {
    let sum = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const normalized = (dataArray[i] - 128) / 128; // Normalize to -1 to 1
      sum += normalized * normalized;
    }

    return Math.sqrt(sum / dataArray.length);
  }

  /**
   * Get energy threshold based on sensitivity
   */
  private getEnergyThreshold(): number {
    const thresholds = {
      low: 0.02, // Less sensitive
      medium: 0.01,
      high: 0.005, // More sensitive
    };

    return thresholds[this.config.sensitivity];
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<VADConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };

    log.info('VAD config updated:', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): VADConfig {
    return { ...this.config };
  }

  /**
   * Check if currently detecting speech
   */
  isSpeechActive(): boolean {
    return this.isSpeaking;
  }

  /**
   * Get monitoring status
   */
  isActive(): boolean {
    return this.isMonitoring;
  }
}

// Singleton instance
let vadServiceInstance: VADService | null = null;

export function getVADService(): VADService {
  if (!vadServiceInstance) {
    vadServiceInstance = new VADService();
  }
  return vadServiceInstance;
}

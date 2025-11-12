/**
 * AI Model and Service Type Definitions
 */

export interface LLMConfig {
  modelPath: string;
  contextSize: number;
  temperature: number;
  topP: number;
  topK: number;
  maxTokens: number;
  repeatPenalty: number;
  seed?: number;
}

export interface WhisperConfig {
  modelPath: string;
  language: 'auto' | 'ko' | 'en';
  task: 'transcribe' | 'translate';
}

export interface LLaVAConfig {
  modelPath: string;
  imageSize: number;
}

export interface TTSConfig {
  voice: string;
  rate: number;
  volume: number;
  language: 'ko' | 'en';
}

export interface AIModelStatus {
  llama: {
    loaded: boolean;
    modelSize?: number;
    contextSize?: number;
  };
  whisper: {
    loaded: boolean;
    modelSize?: number;
  };
  llava: {
    loaded: boolean;
    modelSize?: number;
  };
  tts: {
    available: boolean;
    voices: string[];
  };
}

export interface StreamToken {
  token: string;
  index: number;
  logprob?: number;
}

export interface GenerationMetrics {
  tokensGenerated: number;
  tokensPerSecond: number;
  totalTimeMs: number;
  promptTokens: number;
}

export interface ScreenContext {
  level: 1 | 2 | 3;
  timestamp: Date;
  imageData?: string; // Base64 encoded image
  analysis?: string; // LLaVA analysis
  extractedText?: string;
  metadata: {
    windowTitle?: string;
    applicationName?: string;
    workspaceRoot?: string;
  };
}

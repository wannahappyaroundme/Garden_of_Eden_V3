/**
 * AI Model and Service Type Definitions
 */

export type ModelType = 'qwen-2.5-32b' | 'qwen-2.5-14b' | 'whisper-large-v3' | 'llava-7b';

export interface LLMConfig {
  modelPath: string;
  modelType?: ModelType;
  contextSize: number; // Qwen 2.5 14B: 8K default, 32K max
  temperature: number;
  topP: number;
  topK: number;
  maxTokens: number;
  repeatPenalty: number;
  gpuLayers?: number; // Number of layers to offload to GPU (Metal/CUDA)
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
  qwen: {
    loaded: boolean;
    modelType: ModelType;
    modelSize?: number; // Qwen 2.5 14B Q4_K_M: ~9.0GB
    contextSize?: number; // 8K default, 32K max
    ramUsage?: number; // ~12GB
    tokensPerSecond?: number; // Moderate speed on Apple Silicon
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

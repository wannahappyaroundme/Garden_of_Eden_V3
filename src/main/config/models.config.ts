/**
 * Model Configuration
 * Centralized configuration for all AI models
 */

import * as path from 'path';

export interface ModelInfo {
  name: string;
  filename: string;
  type: 'llm' | 'stt' | 'vision';
  size: string;
  description: string;
}

// Base directory for models
const MODEL_BASE_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE || '.',
  '.garden-of-eden-v3',
  'models'
);

/**
 * Model registry
 */
export const MODELS = {
  // Primary LLM (via Ollama)
  qwen14b: {
    name: 'Qwen 2.5 14B Instruct',
    filename: 'qwen2.5:14b',
    type: 'llm' as const,
    size: '9.0 GB',
    description: 'Main conversational AI model with Korean language support (via Ollama)',
    path: 'qwen2.5:14b', // Ollama model reference
    config: {
      contextSize: 32768, // 32K context window
      gpuLayers: 33, // All layers offloaded to GPU (14B has 33 layers)
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxTokens: 2048,
    },
  },

  // Speech-to-Text
  whisper: {
    name: 'Whisper Large V3',
    filename: 'whisper-large-v3.bin',
    type: 'stt' as const,
    size: '3.1 GB',
    description: 'Speech-to-text for Korean and English',
    path: path.join(MODEL_BASE_DIR, 'whisper-large-v3.bin'),
  },

  // Vision model
  llava: {
    name: 'LLaVA 7B',
    filename: 'llava-7b-q4.gguf',
    type: 'vision' as const,
    size: '4.0 GB',
    description: 'Screen analysis and image understanding',
    path: path.join(MODEL_BASE_DIR, 'llava-7b-q4.gguf'),
  },
} as const;

/**
 * Get model path by key
 */
export function getModelPath(modelKey: keyof typeof MODELS): string {
  return MODELS[modelKey].path;
}

/**
 * Get all model paths
 */
export function getAllModelPaths(): Record<string, string> {
  return {
    qwen14b: MODELS.qwen14b.path,
    whisper: MODELS.whisper.path,
    llava: MODELS.llava.path,
  };
}

/**
 * Check if model file exists
 */
export async function modelExists(modelKey: keyof typeof MODELS): Promise<boolean> {
  const fs = await import('fs/promises');
  try {
    await fs.access(MODELS[modelKey].path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get model configuration for LLM
 */
export function getLLMConfig() {
  return MODELS.qwen14b.config;
}

/**
 * Environment-specific overrides
 */
export const ENV_CONFIG = {
  development: {
    // Faster loading for dev
    contextSize: 8192,
    gpuLayers: 20,
  },
  production: {
    // Full performance for prod
    contextSize: 32768,
    gpuLayers: 33,
  },
} as const;

/**
 * Get config for current environment
 */
export function getEnvConfig() {
  const env = process.env.NODE_ENV || 'development';
  return ENV_CONFIG[env as keyof typeof ENV_CONFIG] || ENV_CONFIG.development;
}

/**
 * Total models size
 */
export const TOTAL_MODELS_SIZE = '~16.5 GB';

/**
 * Expected RAM usage during operation
 */
export const EXPECTED_RAM_USAGE = '10-14 GB';

/**
 * Minimum system requirements
 */
export const SYSTEM_REQUIREMENTS = {
  ram: '16 GB minimum (24 GB recommended)',
  disk: '20 GB free space',
  gpu: 'Apple Silicon or CUDA-capable GPU',
  os: 'macOS 12+ or Windows 10/11',
} as const;

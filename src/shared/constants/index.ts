/**
 * Application-wide Constants
 */

export const APP_NAME = 'Garden of Eden V3';
export const APP_VERSION = '1.0.0';
export const APP_AUTHOR = 'Garden of Eden Team';

// Database
export const DB_NAME = 'eden.db';
export const DB_VERSION = 1;

// AI Models
export const MODEL_PATHS = {
  LLAMA: 'resources/models/llama-3.1-8b.gguf',
  WHISPER: 'resources/models/whisper-large-v3.bin',
  LLAVA: 'resources/models/llava-7b.gguf',
} as const;

// Model download URLs (placeholder - replace with actual URLs)
export const MODEL_DOWNLOAD_URLS = {
  LLAMA: 'https://huggingface.co/TheBloke/Llama-3.1-8B-GGUF/resolve/main/llama-3.1-8b.Q4_K_M.gguf',
  WHISPER: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin',
  LLAVA: 'https://huggingface.co/mys/ggml_llava-v1.5-7b/resolve/main/ggml-model-q4_k.gguf',
} as const;

// Default configurations
export const DEFAULT_LLM_CONFIG = {
  contextSize: 8192,
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  maxTokens: 2048,
  repeatPenalty: 1.1,
} as const;

export const DEFAULT_WHISPER_CONFIG = {
  language: 'auto' as const,
  task: 'transcribe' as const,
} as const;

export const DEFAULT_TTS_CONFIG = {
  rate: 1.0,
  volume: 1.0,
} as const;

// UI Constants
export const CHAT_INPUT_MAX_LENGTH = 10000;
export const MESSAGE_BUBBLE_MAX_WIDTH = 600;
export const TYPING_INDICATOR_DELAY = 500; // ms

// Screen Context
export const SCREEN_CAPTURE_LEVELS = {
  CURRENT: 1,
  RECENT: 2,
  FULL: 3,
} as const;

export const SCREEN_CAPTURE_INTERVAL = {
  [SCREEN_CAPTURE_LEVELS.CURRENT]: 0, // On-demand only
  [SCREEN_CAPTURE_LEVELS.RECENT]: 30000, // Every 30 seconds
  [SCREEN_CAPTURE_LEVELS.FULL]: 60000, // Every 60 seconds
} as const;

// Modes
export const APP_MODES = {
  USER_LED: 'user-led',
  AI_LED: 'ai-led',
} as const;

// Languages
export const SUPPORTED_LANGUAGES = ['ko', 'en'] as const;
export const DEFAULT_LANGUAGE = 'ko' as const;

// IPC Channels (for reference, actual types in ipc.types.ts)
export const IPC_CHANNELS = {
  AI: {
    CHAT: 'ai:chat',
    STREAM_TOKEN: 'ai:stream-token',
    STREAM_COMPLETE: 'ai:stream-complete',
    VOICE_INPUT_START: 'ai:voice-input-start',
    VOICE_INPUT_STOP: 'ai:voice-input-stop',
    CANCEL: 'ai:cancel',
    ANALYZE_SCREEN: 'ai:analyze-screen',
  },
  FILE: {
    READ: 'file:read',
    WRITE: 'file:write',
    SEARCH: 'file:search',
    WORKSPACE_DETECT: 'file:workspace-detect',
  },
  GIT: {
    STATUS: 'git:status',
    DIFF: 'git:diff',
    COMMIT: 'git:commit',
    PUSH: 'git:push',
  },
  SYSTEM: {
    MINIMIZE: 'system:minimize',
    MAXIMIZE: 'system:maximize',
    CLOSE: 'system:close',
    GET_PLATFORM: 'system:get-platform',
  },
  SETTINGS: {
    GET: 'settings:get',
    SET: 'settings:set',
    GET_ALL: 'settings:get-all',
  },
} as const;

// Keyboard Shortcuts
export const SHORTCUTS = {
  FOCUS_INPUT: 'CmdOrCtrl+K',
  NEW_CONVERSATION: 'CmdOrCtrl+N',
  OPEN_SETTINGS: 'CmdOrCtrl+,',
  OPEN_HISTORY: 'CmdOrCtrl+H',
  CANCEL_GENERATION: 'Escape',
  TOGGLE_DARK_MODE: 'CmdOrCtrl+Shift+D',
} as const;

// File paths
export const USER_DATA_PATH = 'user-data';
export const LOGS_PATH = 'logs';
export const PLUGINS_PATH = 'plugins';
export const DB_PATH = 'database';

// Performance targets
export const PERFORMANCE_TARGETS = {
  RESPONSE_TIME_MS: 3000, // 3 seconds
  STARTUP_TIME_MS: 5000, // 5 seconds
  MAX_MEMORY_MB: 30720, // 30GB (v3.4.0: Increased for LanceDB performance)
  TARGET_FPS: 60,
} as const;

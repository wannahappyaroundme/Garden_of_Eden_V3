/**
 * IPC Type Definitions
 * Type-safe communication between main and renderer processes
 */

// AI-related IPC channels
export interface AIChannels {
  'ai:chat': {
    request: {
      message: string;
      conversationId?: string;
      contextLevel?: 1 | 2 | 3;
    };
    response: {
      conversationId: string;
      messageId: string;
      response: string;
    };
  };
  'ai:stream-token': {
    payload: {
      token: string;
      messageId: string;
    };
  };
  'ai:stream-complete': {
    payload: {
      messageId: string;
      fullResponse: string;
    };
  };
  'ai:voice-input-start': {
    request: void;
    response: { recording: boolean };
  };
  'ai:voice-input-stop': {
    request: void;
    response: {
      transcript: string;
      language: 'ko' | 'en';
    };
  };
  'ai:cancel': {
    request: { messageId: string };
    response: { cancelled: boolean };
  };
  'ai:analyze-screen': {
    request: {
      level: 1 | 2 | 3;
    };
    response: {
      analysis: string;
      contextData: Record<string, unknown>;
    };
  };
}

// File system IPC channels
export interface FileChannels {
  'file:read': {
    request: { path: string };
    response: { content: string };
  };
  'file:write': {
    request: { path: string; content: string };
    response: { success: boolean };
  };
  'file:search': {
    request: { pattern: string; directory?: string };
    response: { files: string[] };
  };
  'file:workspace-detect': {
    request: void;
    response: {
      root: string | null;
      type: 'vscode' | 'intellij' | 'unknown' | null;
    };
  };
}

// Git IPC channels
export interface GitChannels {
  'git:status': {
    request: { repoPath: string };
    response: {
      modified: string[];
      added: string[];
      deleted: string[];
      untracked: string[];
      branch: string;
    };
  };
  'git:diff': {
    request: { repoPath: string; file?: string };
    response: { diff: string };
  };
  'git:commit': {
    request: { repoPath: string; message: string; files?: string[] };
    response: { success: boolean; commitHash: string };
  };
  'git:push': {
    request: { repoPath: string };
    response: { success: boolean };
  };
}

// System IPC channels
export interface SystemChannels {
  'system:minimize': { request: void; response: void };
  'system:maximize': { request: void; response: void };
  'system:close': { request: void; response: void };
  'system:get-platform': {
    request: void;
    response: { platform: 'darwin' | 'win32' | 'linux' };
  };
}

// Settings IPC channels
export interface SettingsChannels {
  'settings:get': {
    request: { key: string };
    response: { value: unknown };
  };
  'settings:set': {
    request: { key: string; value: unknown };
    response: { success: boolean };
  };
  'settings:get-all': {
    request: void;
    response: { settings: Record<string, unknown> };
  };
}

// All IPC channels combined
export type IPCChannels = AIChannels &
  FileChannels &
  GitChannels &
  SystemChannels &
  SettingsChannels;

// Helper type to extract channel names
export type IPCChannelName = keyof IPCChannels;

// Helper type for IPC invocation
export type IPCInvoke<T extends IPCChannelName> = IPCChannels[T] extends {
  request: infer R;
  response: infer S;
}
  ? (request: R) => Promise<S>
  : never;

// Helper type for IPC sending (one-way)
export type IPCSend<T extends IPCChannelName> = IPCChannels[T] extends { payload: infer P }
  ? (payload: P) => void
  : never;

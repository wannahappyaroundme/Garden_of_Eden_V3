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
export interface FileInfo {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size: number;
  modified: number; // timestamp
  extension?: string;
}

export interface FileChannels {
  'file:read': {
    request: { path: string; encoding?: string; maxSize?: number };
    response: { content: string };
  };
  'file:write': {
    request: { path: string; content: string; encoding?: string; createDir?: boolean };
    response: { success: boolean };
  };
  'file:delete': {
    request: { path: string };
    response: { success: boolean };
  };
  'file:exists': {
    request: { path: string };
    response: { exists: boolean };
  };
  'file:info': {
    request: { path: string };
    response: { info: FileInfo };
  };
  'file:list-directory': {
    request: { path: string };
    response: { files: FileInfo[] };
  };
  'file:search': {
    request: {
      pattern: string;
      cwd?: string;
      maxResults?: number;
      ignore?: string[];
    };
    response: { files: string[] };
  };
  'file:workspace-root': {
    request: { startPath: string };
    response: { root: string | null };
  };
  'file:create-directory': {
    request: { path: string };
    response: { success: boolean };
  };
  'file:copy': {
    request: { source: string; destination: string };
    response: { success: boolean };
  };
  'file:move': {
    request: { source: string; destination: string };
    response: { success: boolean };
  };
}

// Git IPC channels
export interface GitFileStatus {
  path: string;
  status: string;
  workingDir: string;
  index: string;
}

export interface GitStatus {
  current: string;
  tracking: string | null;
  files: GitFileStatus[];
  ahead: number;
  behind: number;
  isClean: boolean;
}

export interface GitCommit {
  hash: string;
  date: string;
  message: string;
  author: string;
  body?: string;
}

export interface GitBranch {
  name: string;
  current: boolean;
  commit: string;
}

export interface GitChannels {
  'git:init': {
    request: { repoPath: string };
    response: { success: boolean };
  };
  'git:status': {
    request: void;
    response: { status: GitStatus };
  };
  'git:diff': {
    request: { filePath?: string };
    response: { diff: string };
  };
  'git:diff-staged': {
    request: { filePath?: string };
    response: { diff: string };
  };
  'git:add': {
    request: { files: string | string[] };
    response: { success: boolean };
  };
  'git:reset': {
    request: { files?: string | string[] };
    response: { success: boolean };
  };
  'git:commit': {
    request: { message: string };
    response: { commitHash: string };
  };
  'git:push': {
    request: { remote?: string; branch?: string };
    response: { success: boolean };
  };
  'git:pull': {
    request: { remote?: string; branch?: string };
    response: { success: boolean };
  };
  'git:log': {
    request: { maxCount?: number };
    response: { commits: GitCommit[] };
  };
  'git:branches': {
    request: void;
    response: { branches: GitBranch[] };
  };
  'git:create-branch': {
    request: { branchName: string };
    response: { success: boolean };
  };
  'git:checkout': {
    request: { branchName: string };
    response: { success: boolean };
  };
  'git:current-branch': {
    request: void;
    response: { branch: string };
  };
  'git:remote-url': {
    request: { remote?: string };
    response: { url: string };
  };
  'git:stash': {
    request: { message?: string };
    response: { success: boolean };
  };
  'git:stash-pop': {
    request: void;
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

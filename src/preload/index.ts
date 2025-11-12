/**
 * Preload Script
 * Secure IPC bridge between main and renderer processes
 */

import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import type { IPCChannelName, FileInfo, GitStatus, GitCommit, GitBranch } from '../shared/types/ipc.types';

/**
 * Exposed API for renderer process
 * Available as window.api in renderer
 */
const api = {
  /**
   * Invoke IPC call and wait for response
   */
  invoke: async <T extends IPCChannelName>(
    channel: T,
    data: unknown
  ): Promise<unknown> => {
    return await ipcRenderer.invoke(channel, data);
  },

  /**
   * Send one-way IPC message (no response expected)
   */
  send: (channel: string, data: unknown): void => {
    ipcRenderer.send(channel, data);
  },

  /**
   * Listen for IPC events from main process
   */
  on: (channel: string, callback: (event: IpcRendererEvent, ...args: unknown[]) => void): void => {
    ipcRenderer.on(channel, callback);
  },

  /**
   * Remove IPC event listener
   */
  off: (channel: string, callback: (event: IpcRendererEvent, ...args: unknown[]) => void): void => {
    ipcRenderer.removeListener(channel, callback);
  },

  /**
   * Remove all listeners for a channel
   */
  removeAllListeners: (channel: string): void => {
    ipcRenderer.removeAllListeners(channel);
  },

  // Type-safe helper methods
  chat: async (args: { message: string; conversationId?: string; contextLevel?: 1 | 2 | 3 }) => {
    return await ipcRenderer.invoke('ai:chat', args) as { conversationId: string; messageId: string; response: string };
  },

  // Chat with streaming support
  chatStream: async (
    args: { message: string; conversationId?: string; contextLevel?: 1 | 2 | 3 },
    onToken: (token: string) => void
  ) => {
    // Setup streaming listeners
    const tokenHandler = (_event: IpcRendererEvent, data: { token: string; messageId: string }) => {
      onToken(data.token);
    };

    ipcRenderer.on('ai:stream-token', tokenHandler);

    try {
      const response = await ipcRenderer.invoke('ai:chat', args) as { conversationId: string; messageId: string; response: string };

      // Cleanup listener
      ipcRenderer.removeListener('ai:stream-token', tokenHandler);

      return response;
    } catch (error) {
      // Cleanup listener on error
      ipcRenderer.removeListener('ai:stream-token', tokenHandler);
      throw error;
    }
  },

  voiceInputStart: async () => {
    return await ipcRenderer.invoke('ai:voice-input-start') as { recording: boolean };
  },

  voiceInputStop: async () => {
    return await ipcRenderer.invoke('ai:voice-input-stop') as { transcript: string; language: 'ko' | 'en' };
  },

  // File operations
  fileRead: async (path: string, options?: { encoding?: string; maxSize?: number }) => {
    return await ipcRenderer.invoke('file:read', { path, ...options }) as { content: string };
  },

  fileWrite: async (path: string, content: string, options?: { encoding?: string; createDir?: boolean }) => {
    return await ipcRenderer.invoke('file:write', { path, content, ...options }) as { success: boolean };
  },

  fileDelete: async (path: string) => {
    return await ipcRenderer.invoke('file:delete', { path }) as { success: boolean };
  },

  fileExists: async (path: string) => {
    return await ipcRenderer.invoke('file:exists', { path }) as { exists: boolean };
  },

  fileInfo: async (path: string) => {
    return await ipcRenderer.invoke('file:info', { path }) as { info: FileInfo };
  },

  fileListDirectory: async (path: string) => {
    return await ipcRenderer.invoke('file:list-directory', { path }) as { files: FileInfo[] };
  },

  fileSearch: async (pattern: string, options?: { cwd?: string; maxResults?: number; ignore?: string[] }) => {
    return await ipcRenderer.invoke('file:search', { pattern, ...options }) as { files: string[] };
  },

  fileWorkspaceRoot: async (startPath: string) => {
    return await ipcRenderer.invoke('file:workspace-root', { startPath }) as { root: string | null };
  },

  fileCreateDirectory: async (path: string) => {
    return await ipcRenderer.invoke('file:create-directory', { path }) as { success: boolean };
  },

  fileCopy: async (source: string, destination: string) => {
    return await ipcRenderer.invoke('file:copy', { source, destination }) as { success: boolean };
  },

  fileMove: async (source: string, destination: string) => {
    return await ipcRenderer.invoke('file:move', { source, destination }) as { success: boolean };
  },

  // Git operations
  gitInit: async (repoPath: string) => {
    return await ipcRenderer.invoke('git:init', { repoPath }) as { success: boolean };
  },

  gitStatus: async () => {
    return await ipcRenderer.invoke('git:status') as { status: GitStatus };
  },

  gitDiff: async (filePath?: string) => {
    return await ipcRenderer.invoke('git:diff', { filePath }) as { diff: string };
  },

  gitDiffStaged: async (filePath?: string) => {
    return await ipcRenderer.invoke('git:diff-staged', { filePath }) as { diff: string };
  },

  gitAdd: async (files: string | string[]) => {
    return await ipcRenderer.invoke('git:add', { files }) as { success: boolean };
  },

  gitReset: async (files?: string | string[]) => {
    return await ipcRenderer.invoke('git:reset', { files }) as { success: boolean };
  },

  gitCommit: async (message: string) => {
    return await ipcRenderer.invoke('git:commit', { message }) as { commitHash: string };
  },

  gitPush: async (remote?: string, branch?: string) => {
    return await ipcRenderer.invoke('git:push', { remote, branch }) as { success: boolean };
  },

  gitPull: async (remote?: string, branch?: string) => {
    return await ipcRenderer.invoke('git:pull', { remote, branch }) as { success: boolean };
  },

  gitLog: async (maxCount?: number) => {
    return await ipcRenderer.invoke('git:log', { maxCount }) as { commits: GitCommit[] };
  },

  gitBranches: async () => {
    return await ipcRenderer.invoke('git:branches') as { branches: GitBranch[] };
  },

  gitCreateBranch: async (branchName: string) => {
    return await ipcRenderer.invoke('git:create-branch', { branchName }) as { success: boolean };
  },

  gitCheckout: async (branchName: string) => {
    return await ipcRenderer.invoke('git:checkout', { branchName }) as { success: boolean };
  },

  gitCurrentBranch: async () => {
    return await ipcRenderer.invoke('git:current-branch') as { branch: string };
  },

  gitRemoteUrl: async (remote?: string) => {
    return await ipcRenderer.invoke('git:remote-url', { remote }) as { url: string };
  },

  gitStash: async (message?: string) => {
    return await ipcRenderer.invoke('git:stash', { message }) as { success: boolean };
  },

  gitStashPop: async () => {
    return await ipcRenderer.invoke('git:stash-pop') as { success: boolean };
  },

  // Message operations
  messageSave: async (args: {
    conversationId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata?: {
      tokens?: number;
      responseTime?: number;
      contextLevel?: 1 | 2 | 3;
    };
  }) => {
    return await ipcRenderer.invoke('message:save', args);
  },

  messageGetByConversation: async (args: {
    conversationId: string;
    limit?: number;
    offset?: number;
  }) => {
    return await ipcRenderer.invoke('message:get-by-conversation', args);
  },

  messageGetRecent: async (args: {
    conversationId: string;
    count?: number;
  }) => {
    return await ipcRenderer.invoke('message:get-recent', args);
  },

  messageUpdateSatisfaction: async (args: {
    messageId: string;
    satisfaction: 'positive' | 'negative';
  }) => {
    return await ipcRenderer.invoke('message:update-satisfaction', args) as Promise<boolean>;
  },

  messageSearch: async (args: {
    query: string;
    limit?: number;
  }) => {
    return await ipcRenderer.invoke('message:search', args);
  },

  messageDelete: async (args: {
    messageId: string;
  }) => {
    return await ipcRenderer.invoke('message:delete', args) as Promise<boolean>;
  },

  // Platform info
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
};

// Expose API to renderer process
contextBridge.exposeInMainWorld('api', api);

// TypeScript declaration for window.api
declare global {
  interface Window {
    api: typeof api;
  }
}

export type { };

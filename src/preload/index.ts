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

  // Conversation operations
  conversationCreate: async (args?: {
    title?: string;
    mode?: 'user-led' | 'ai-led';
  }) => {
    return await ipcRenderer.invoke('conversation:create', args || {});
  },

  conversationGetAll: async (args?: {
    limit?: number;
    offset?: number;
  }) => {
    return await ipcRenderer.invoke('conversation:get-all', args);
  },

  conversationGetById: async (args: {
    id: string;
  }) => {
    return await ipcRenderer.invoke('conversation:get-by-id', args);
  },

  conversationUpdate: async (args: {
    id: string;
    updates: {
      title?: string;
      mode?: 'user-led' | 'ai-led';
    };
  }) => {
    return await ipcRenderer.invoke('conversation:update', args) as Promise<boolean>;
  },

  conversationDelete: async (args: {
    id: string;
  }) => {
    return await ipcRenderer.invoke('conversation:delete', args) as Promise<boolean>;
  },

  conversationSearch: async (args: {
    query: string;
    limit?: number;
  }) => {
    return await ipcRenderer.invoke('conversation:search', args);
  },

  conversationGetCount: async () => {
    return await ipcRenderer.invoke('conversation:get-count') as Promise<number>;
  },

  // Screen tracking APIs
  screenStartTracking: async (args?: { interval?: number }) => {
    return await ipcRenderer.invoke('screen:start-tracking', args || {}) as Promise<{ started: boolean; interval: number }>;
  },

  screenStopTracking: async () => {
    return await ipcRenderer.invoke('screen:stop-tracking') as Promise<{ stopped: boolean }>;
  },

  screenToggleTracking: async (args?: { interval?: number }) => {
    return await ipcRenderer.invoke('screen:toggle-tracking', args || {}) as Promise<{ isTracking: boolean; interval: number }>;
  },

  screenGetStatus: async () => {
    return await ipcRenderer.invoke('screen:get-status') as Promise<{
      isTracking: boolean;
      lastCaptureTime: number;
      captureCount: number;
      captureInterval: number;
    }>;
  },

  // Screen tracking event listeners
  onScreenStatusUpdate: (callback: (status: {
    isTracking: boolean;
    lastCaptureTime: number;
    captureCount: number;
    captureInterval: number;
  }) => void) => {
    const handler = (_event: IpcRendererEvent, status: any) => callback(status);
    ipcRenderer.on('screen:status-update', handler);
    return () => ipcRenderer.removeListener('screen:status-update', handler);
  },

  onScreenTrackingNotification: (callback: (data: {
    action: 'started' | 'stopped';
    interval: number;
    timestamp: number;
  }) => void) => {
    const handler = (_event: IpcRendererEvent, data: any) => callback(data);
    ipcRenderer.on('screen:tracking-notification', handler);
    return () => ipcRenderer.removeListener('screen:tracking-notification', handler);
  },

  onScreenIdleNotification: (callback: (data: { idleDurationMinutes: number }) => void) => {
    const handler = (_event: IpcRendererEvent, data: any) => callback(data);
    ipcRenderer.on('screen:notify-idle', handler);
    return () => ipcRenderer.removeListener('screen:notify-idle', handler);
  },

  // Workspace operations
  workspaceOpen: async (args: { rootPath: string }) => {
    return await ipcRenderer.invoke('workspace:open', args);
  },

  workspaceGetCurrent: async () => {
    return await ipcRenderer.invoke('workspace:current');
  },

  workspaceAnalyze: async (args?: { rootPath?: string }) => {
    return await ipcRenderer.invoke('workspace:analyze', args || {});
  },

  workspaceGetRecent: async (args?: { limit?: number }) => {
    return await ipcRenderer.invoke('workspace:recent', args || {});
  },

  workspaceDetectType: async (args: { rootPath: string }) => {
    return await ipcRenderer.invoke('workspace:detect-type', args);
  },

  workspaceDetectEditor: async () => {
    return await ipcRenderer.invoke('workspace:detect-editor');
  },

  workspaceClose: async () => {
    return await ipcRenderer.invoke('workspace:close') as Promise<{ success: boolean }>;
  },

  // Webhook operations
  webhookRegister: async (args: { config: any }) => {
    return await ipcRenderer.invoke('webhook:register', args);
  },

  webhookTrigger: async (args: { name: string; payload: any }) => {
    return await ipcRenderer.invoke('webhook:trigger', args);
  },

  webhookList: async () => {
    return await ipcRenderer.invoke('webhook:list');
  },

  webhookGet: async (args: { name: string }) => {
    return await ipcRenderer.invoke('webhook:get', args);
  },

  webhookUpdate: async (args: { name: string; updates: any }) => {
    return await ipcRenderer.invoke('webhook:update', args);
  },

  webhookDelete: async (args: { name: string }) => {
    return await ipcRenderer.invoke('webhook:delete', args) as Promise<{ success: boolean }>;
  },

  webhookTest: async (args: { name: string }) => {
    return await ipcRenderer.invoke('webhook:test', args);
  },

  webhookSendSlack: async (args: { webhookUrl: string; message: any }) => {
    return await ipcRenderer.invoke('webhook:send-slack', args);
  },

  webhookSendDiscord: async (args: { webhookUrl: string; message: any }) => {
    return await ipcRenderer.invoke('webhook:send-discord', args);
  },

  webhookSendNotion: async (args: { apiKey: string; page: any }) => {
    return await ipcRenderer.invoke('webhook:send-notion', args);
  },

  // Calendar operations
  calendarSync: async (args: { icsUrl: string }) => {
    return await ipcRenderer.invoke('calendar:sync', args);
  },

  calendarGetToday: async () => {
    return await ipcRenderer.invoke('calendar:today');
  },

  calendarGetUpcoming: async (args: { hours: number }) => {
    return await ipcRenderer.invoke('calendar:upcoming', args);
  },

  calendarGetFreeSlots: async (args: { date: Date; minDurationMinutes?: number; workingHoursOnly?: boolean }) => {
    return await ipcRenderer.invoke('calendar:free-slots', args);
  },

  calendarGetEvent: async (args: { eventId: string }) => {
    return await ipcRenderer.invoke('calendar:get-event', args);
  },

  calendarSearch: async (args: { query: string; limit?: number }) => {
    return await ipcRenderer.invoke('calendar:search', args);
  },

  calendarGetDaySchedule: async (args: { date: Date }) => {
    return await ipcRenderer.invoke('calendar:day-schedule', args);
  },

  calendarClearCache: async () => {
    return await ipcRenderer.invoke('calendar:clear-cache') as Promise<{ success: boolean }>;
  },

  // Feedback operations
  feedbackUpdateSatisfaction: async (args: { messageId: string; satisfaction: 'positive' | 'negative' }) => {
    return await ipcRenderer.invoke('feedback:update-satisfaction', args);
  },

  feedbackGetStats: async () => {
    return await ipcRenderer.invoke('feedback:get-stats');
  },

  feedbackGetTrend: async (args: { days: number }) => {
    return await ipcRenderer.invoke('feedback:get-trend', args);
  },

  feedbackResetLearning: async () => {
    return await ipcRenderer.invoke('feedback:reset-learning') as Promise<{ success: boolean; deletedCount: number }>;
  },

  feedbackGetLearningRate: async () => {
    return await ipcRenderer.invoke('feedback:get-learning-rate') as Promise<{ rate: number }>;
  },

  feedbackSetLearningRate: async (args: { rate: number }) => {
    return await ipcRenderer.invoke('feedback:set-learning-rate', args) as Promise<{ success: boolean }>;
  },

  // Memory operations
  memoryStoreEpisode: async (args: { episode: any }) => {
    return await ipcRenderer.invoke('memory:store-episode', args);
  },

  memorySearch: async (args: { query: string; topK?: number; minSimilarity?: number; conversationId?: string; timeRange?: { start: Date; end: Date } }) => {
    return await ipcRenderer.invoke('memory:search', args);
  },

  memoryGetStats: async () => {
    return await ipcRenderer.invoke('memory:get-stats');
  },

  memoryGetEpisode: async (args: { episodeId: string }) => {
    return await ipcRenderer.invoke('memory:get-episode', args);
  },

  memoryDeleteEpisode: async (args: { episodeId: string }) => {
    return await ipcRenderer.invoke('memory:delete-episode', args) as Promise<{ success: boolean }>;
  },

  memoryClearAll: async (args?: { conversationId?: string }) => {
    return await ipcRenderer.invoke('memory:clear-all', args || {}) as Promise<{ success: boolean; deletedCount: number }>;
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

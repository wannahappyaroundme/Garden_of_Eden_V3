/**
 * Window API Type Definitions
 * Shared between preload and renderer for type-safe IPC
 */

import type { IpcRendererEvent } from 'electron';
import type { IPCChannelName, FileInfo, GitStatus, GitCommit, GitBranch } from './ipc.types';

export interface WindowAPI {
  // Base IPC methods
  invoke: <T extends IPCChannelName>(channel: T, data: unknown) => Promise<unknown>;
  send: (channel: string, data: unknown) => void;
  on: (channel: string, callback: (event: IpcRendererEvent, ...args: unknown[]) => void) => void;
  off: (channel: string, callback: (event: IpcRendererEvent, ...args: unknown[]) => void) => void;
  removeAllListeners: (channel: string) => void;

  // Chat operations
  chat: (args: { message: string; conversationId?: string; contextLevel?: 1 | 2 | 3 }) => Promise<{ conversationId: string; messageId: string; response: string }>;
  chatStream: (
    args: { message: string; conversationId?: string; contextLevel?: 1 | 2 | 3 },
    onToken: (token: string) => void
  ) => Promise<{ conversationId: string; messageId: string; response: string }>;

  // Voice operations
  voiceInputStart: () => Promise<{ recording: boolean }>;
  voiceInputStop: () => Promise<{ transcript: string; language: 'ko' | 'en' }>;

  // File operations
  fileRead: (path: string, options?: { encoding?: string; maxSize?: number }) => Promise<{ content: string }>;
  fileWrite: (path: string, content: string, options?: { encoding?: string; createDir?: boolean }) => Promise<{ success: boolean }>;
  fileDelete: (path: string) => Promise<{ success: boolean }>;
  fileExists: (path: string) => Promise<{ exists: boolean }>;
  fileInfo: (path: string) => Promise<{ info: FileInfo }>;
  fileListDirectory: (path: string) => Promise<{ files: FileInfo[] }>;
  fileSearch: (pattern: string, options?: { cwd?: string; maxResults?: number; ignore?: string[] }) => Promise<{ files: string[] }>;
  fileWorkspaceRoot: (startPath: string) => Promise<{ root: string | null }>;
  fileCreateDirectory: (path: string) => Promise<{ success: boolean }>;
  fileCopy: (source: string, destination: string) => Promise<{ success: boolean }>;
  fileMove: (source: string, destination: string) => Promise<{ success: boolean }>;

  // Git operations
  gitInit: (repoPath: string) => Promise<{ success: boolean }>;
  gitStatus: () => Promise<{ status: GitStatus }>;
  gitDiff: (filePath?: string) => Promise<{ diff: string }>;
  gitDiffStaged: (filePath?: string) => Promise<{ diff: string }>;
  gitAdd: (files: string | string[]) => Promise<{ success: boolean }>;
  gitReset: (files?: string | string[]) => Promise<{ success: boolean }>;
  gitCommit: (message: string) => Promise<{ commitHash: string }>;
  gitPush: (remote?: string, branch?: string) => Promise<{ success: boolean }>;
  gitPull: (remote?: string, branch?: string) => Promise<{ success: boolean }>;
  gitLog: (maxCount?: number) => Promise<{ commits: GitCommit[] }>;
  gitBranches: () => Promise<{ branches: GitBranch[] }>;
  gitCreateBranch: (branchName: string) => Promise<{ success: boolean }>;
  gitCheckout: (branchName: string) => Promise<{ success: boolean }>;
  gitCurrentBranch: () => Promise<{ branch: string }>;
  gitRemoteUrl: (remote?: string) => Promise<{ url: string }>;
  gitStash: (message?: string) => Promise<{ success: boolean }>;
  gitStashPop: () => Promise<{ success: boolean }>;

  // Message operations
  messageSave: (args: {
    conversationId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata?: {
      tokens?: number;
      responseTime?: number;
      contextLevel?: 1 | 2 | 3;
    };
  }) => Promise<unknown>;
  messageGetByConversation: (args: {
    conversationId: string;
    limit?: number;
    offset?: number;
  }) => Promise<unknown>;
  messageGetRecent: (args: {
    conversationId: string;
    count?: number;
  }) => Promise<unknown>;
  messageUpdateSatisfaction: (args: {
    messageId: string;
    satisfaction: 'positive' | 'negative';
  }) => Promise<boolean>;
  messageSearch: (args: {
    query: string;
    limit?: number;
  }) => Promise<unknown>;
  messageDelete: (args: {
    messageId: string;
  }) => Promise<boolean>;

  // Conversation operations
  conversationCreate: (args?: {
    title?: string;
    mode?: 'user-led' | 'ai-led';
  }) => Promise<unknown>;
  conversationGetAll: (args?: {
    limit?: number;
    offset?: number;
  }) => Promise<unknown>;
  conversationGetById: (args: {
    id: string;
  }) => Promise<unknown>;
  conversationUpdate: (args: {
    id: string;
    updates: {
      title?: string;
      mode?: 'user-led' | 'ai-led';
    };
  }) => Promise<boolean>;
  conversationDelete: (args: {
    id: string;
  }) => Promise<boolean>;
  conversationSearch: (args: {
    query: string;
    limit?: number;
  }) => Promise<unknown>;
  conversationGetCount: () => Promise<number>;

  // Screen tracking APIs
  screenStartTracking: (args?: { interval?: number }) => Promise<{ started: boolean; interval: number }>;
  screenStopTracking: () => Promise<{ stopped: boolean }>;
  screenToggleTracking: (args?: { interval?: number }) => Promise<{ isTracking: boolean; interval: number }>;
  screenGetStatus: () => Promise<{
    isTracking: boolean;
    lastCaptureTime: number;
    captureCount: number;
    captureInterval: number;
  }>;

  // Screen tracking event listeners
  onScreenStatusUpdate: (callback: (status: {
    isTracking: boolean;
    lastCaptureTime: number;
    captureCount: number;
    captureInterval: number;
  }) => void) => () => void;
  onScreenTrackingNotification: (callback: (data: {
    action: 'started' | 'stopped';
    interval: number;
    timestamp: number;
  }) => void) => () => void;
  onScreenIdleNotification: (callback: (data: { idleDurationMinutes: number }) => void) => () => void;

  // Workspace operations
  workspaceOpen: (args: { rootPath: string }) => Promise<unknown>;
  workspaceGetCurrent: () => Promise<unknown>;
  workspaceAnalyze: (args?: { rootPath?: string }) => Promise<unknown>;
  workspaceGetRecent: (args?: { limit?: number }) => Promise<unknown>;
  workspaceDetectType: (args: { rootPath: string }) => Promise<unknown>;
  workspaceDetectEditor: () => Promise<unknown>;
  workspaceClose: () => Promise<{ success: boolean }>;

  // Webhook operations
  webhookRegister: (args: { config: any }) => Promise<unknown>;
  webhookTrigger: (args: { name: string; payload: any }) => Promise<unknown>;
  webhookList: () => Promise<unknown>;
  webhookGet: (args: { name: string }) => Promise<unknown>;
  webhookUpdate: (args: { name: string; updates: any }) => Promise<unknown>;
  webhookDelete: (args: { name: string }) => Promise<{ success: boolean }>;
  webhookTest: (args: { name: string }) => Promise<unknown>;
  webhookSendSlack: (args: { webhookUrl: string; message: any }) => Promise<unknown>;
  webhookSendDiscord: (args: { webhookUrl: string; message: any }) => Promise<unknown>;
  webhookSendNotion: (args: { apiKey: string; page: any }) => Promise<unknown>;

  // Calendar operations
  calendarSync: (args: { icsUrl: string }) => Promise<unknown>;
  calendarGetToday: () => Promise<unknown>;
  calendarGetUpcoming: (args: { hours: number }) => Promise<unknown>;
  calendarGetFreeSlots: (args: { date: Date; minDurationMinutes?: number; workingHoursOnly?: boolean }) => Promise<unknown>;
  calendarGetEvent: (args: { eventId: string }) => Promise<unknown>;
  calendarSearch: (args: { query: string; limit?: number }) => Promise<unknown>;
  calendarGetDaySchedule: (args: { date: Date }) => Promise<unknown>;
  calendarClearCache: () => Promise<{ success: boolean }>;

  // Feedback operations
  feedbackUpdateSatisfaction: (args: { messageId: string; satisfaction: 'positive' | 'negative' }) => Promise<unknown>;
  feedbackGetStats: () => Promise<unknown>;
  feedbackGetTrend: (args: { days: number }) => Promise<unknown>;
  feedbackResetLearning: () => Promise<{ success: boolean; deletedCount: number }>;
  feedbackGetLearningRate: () => Promise<{ rate: number }>;
  feedbackSetLearningRate: (args: { rate: number }) => Promise<{ success: boolean }>;

  // Memory operations
  memoryStoreEpisode: (args: { episode: any }) => Promise<unknown>;
  memorySearch: (args: { query: string; topK?: number; minSimilarity?: number; conversationId?: string; timeRange?: { start: Date; end: Date } }) => Promise<unknown>;
  memoryGetStats: () => Promise<unknown>;
  memoryGetEpisode: (args: { episodeId: string }) => Promise<unknown>;
  memoryDeleteEpisode: (args: { episodeId: string }) => Promise<{ success: boolean }>;
  memoryClearAll: (args?: { conversationId?: string }) => Promise<{ success: boolean; deletedCount: number }>;

  // Onboarding operations
  checkOnboardingStatus: () => Promise<{ completed: boolean; profile: any | null }>;
  completeOnboarding: (answers: {
    name: string;
    selected_persona: string;
    tone_preference: string;
    occupation: string;
    proactive_frequency: string;
    interests: string;
  }) => Promise<any>;

  // Settings operations
  getSettings: () => Promise<unknown>;
  updateSettings: (settings: any) => Promise<unknown>;

  // Update operations
  updateCheck: () => Promise<unknown>;
  updateDownload: () => Promise<unknown>;
  updateInstall: () => Promise<unknown>;
  updateGetStatus: () => Promise<unknown>;
  updateGetVersion: () => Promise<unknown>;
  updateSetAutoDownload: (enabled: boolean) => Promise<unknown>;

  // Update event listeners
  onUpdateAvailable: (callback: (data: { version: string; releaseDate: string; releaseNotes: string }) => void) => () => void;
  onUpdateProgress: (callback: (data: { percent: number; bytesPerSecond: number; transferred: number; total: number }) => void) => () => void;
  onUpdateDownloaded: (callback: (data: { version: string }) => void) => () => void;
  onUpdateError: (callback: (error: string) => void) => () => void;
  onUpdateStatus: (callback: (status: any) => void) => () => void;

  // Download operations
  downloadGetModels: () => Promise<unknown>;
  downloadGetDirectory: () => Promise<unknown>;
  downloadIsDownloaded: (modelId: string) => Promise<unknown>;
  downloadGetDownloaded: () => Promise<unknown>;
  downloadModel: (modelId: string) => Promise<unknown>;
  downloadAllModels: () => Promise<unknown>;
  downloadPause: (modelId: string) => Promise<unknown>;
  downloadResume: (modelId: string) => Promise<unknown>;
  downloadCancel: (modelId: string) => Promise<unknown>;
  downloadDelete: (modelId: string) => Promise<unknown>;
  downloadGetStatus: () => Promise<unknown>;
  downloadGetDiskSpace: () => Promise<unknown>;

  // Download event listeners
  onDownloadProgress: (callback: (status: any) => void) => () => void;

  // Platform info
  platform: NodeJS.Platform;
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
}

declare global {
  interface Window {
    api: WindowAPI;
  }
}

export {};

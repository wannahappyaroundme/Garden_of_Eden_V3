/**
 * Jest Setup for Renderer Process Tests
 * Runs before each test file in the renderer process
 */

import '@testing-library/jest-dom';

// Mock window.api (Electron preload API)
global.window.api = {
  // Mock all API methods
  invoke: jest.fn(),
  send: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  removeAllListeners: jest.fn(),

  // Mock specific APIs
  chat: jest.fn(),
  chatStream: jest.fn(),
  voiceInputStart: jest.fn(),
  voiceInputStop: jest.fn(),

  // File operations
  fileRead: jest.fn(),
  fileWrite: jest.fn(),
  fileDelete: jest.fn(),
  fileExists: jest.fn(),
  fileInfo: jest.fn(),
  fileListDirectory: jest.fn(),
  fileSearch: jest.fn(),
  fileWorkspaceRoot: jest.fn(),
  fileCreateDirectory: jest.fn(),
  fileCopy: jest.fn(),
  fileMove: jest.fn(),

  // Git operations
  gitInit: jest.fn(),
  gitStatus: jest.fn(),
  gitDiff: jest.fn(),
  gitDiffStaged: jest.fn(),
  gitAdd: jest.fn(),
  gitReset: jest.fn(),
  gitCommit: jest.fn(),
  gitPush: jest.fn(),
  gitPull: jest.fn(),
  gitLog: jest.fn(),
  gitBranches: jest.fn(),
  gitCreateBranch: jest.fn(),
  gitCheckout: jest.fn(),
  gitCurrentBranch: jest.fn(),
  gitRemoteUrl: jest.fn(),
  gitStash: jest.fn(),
  gitStashPop: jest.fn(),

  // Message operations
  messageSave: jest.fn(),
  messageGetByConversation: jest.fn(),
  messageGetRecent: jest.fn(),
  messageUpdateSatisfaction: jest.fn(),
  messageSearch: jest.fn(),
  messageDelete: jest.fn(),

  // Conversation operations
  conversationCreate: jest.fn(),
  conversationGetAll: jest.fn(),
  conversationGetById: jest.fn(),
  conversationUpdate: jest.fn(),
  conversationDelete: jest.fn(),
  conversationSearch: jest.fn(),
  conversationGetCount: jest.fn(),

  // Screen tracking
  screenStartTracking: jest.fn(),
  screenStopTracking: jest.fn(),
  screenToggleTracking: jest.fn(),
  screenGetStatus: jest.fn(),
  onScreenStatusUpdate: jest.fn(),
  onScreenTrackingNotification: jest.fn(),
  onScreenIdleNotification: jest.fn(),

  // Workspace
  workspaceOpen: jest.fn(),
  workspaceGetCurrent: jest.fn(),
  workspaceAnalyze: jest.fn(),
  workspaceGetRecent: jest.fn(),
  workspaceDetectType: jest.fn(),
  workspaceDetectEditor: jest.fn(),
  workspaceClose: jest.fn(),

  // Webhooks
  webhookRegister: jest.fn(),
  webhookTrigger: jest.fn(),
  webhookList: jest.fn(),
  webhookGet: jest.fn(),
  webhookUpdate: jest.fn(),
  webhookDelete: jest.fn(),
  webhookTest: jest.fn(),
  webhookSendSlack: jest.fn(),
  webhookSendDiscord: jest.fn(),
  webhookSendNotion: jest.fn(),

  // Calendar
  calendarSync: jest.fn(),
  calendarGetToday: jest.fn(),
  calendarGetUpcoming: jest.fn(),
  calendarGetFreeSlots: jest.fn(),
  calendarGetEvent: jest.fn(),
  calendarSearch: jest.fn(),
  calendarGetDaySchedule: jest.fn(),
  calendarClearCache: jest.fn(),

  // Feedback
  feedbackUpdateSatisfaction: jest.fn(),
  feedbackGetStats: jest.fn(),
  feedbackGetTrend: jest.fn(),
  feedbackResetLearning: jest.fn(),
  feedbackGetLearningRate: jest.fn(),
  feedbackSetLearningRate: jest.fn(),

  // Memory
  memoryStoreEpisode: jest.fn(),
  memorySearch: jest.fn(),
  memoryGetStats: jest.fn(),
  memoryGetEpisode: jest.fn(),
  memoryDeleteEpisode: jest.fn(),
  memoryClearAll: jest.fn(),

  // Platform
  platform: 'darwin',
  versions: {
    node: '20.0.0',
    chrome: '120.0.0',
    electron: '28.0.0',
  },
} as any;

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

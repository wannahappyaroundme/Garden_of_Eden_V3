/**
 * Electron Main Process Entry Point
 * Garden of Eden V3 - 100% Local AI Assistant
 */

import type { WebContents } from 'electron';
import { WindowManager } from './window';
import { initializeDatabase, closeDatabase } from './database';
import { registerSystemHandlers } from './ipc/system.handler';
import { registerSettingsHandlers } from './ipc/settings.handler';
import { registerAIHandlers, cleanupAIResources } from './ipc/ai.handler';
import { registerFileHandlers } from './ipc/file.handler';
import { registerGitHandlers } from './ipc/git.handler';
import { registerMessageHandlers } from './ipc/message.handler';
import { registerConversationHandlers } from './ipc/conversation.handler';
import log from 'electron-log';

// Lazy-load electron to avoid module loading issues
let app: any;
let BrowserWindow: any;

function getElectron() {
  if (!app) {
    const electron = require('electron');
    app = electron.app;
    BrowserWindow = electron.BrowserWindow;
    console.log('Electron loaded - app type:', typeof app);
    console.log('Electron loaded - BrowserWindow type:', typeof BrowserWindow);
  }
  return { app, BrowserWindow };
}

// Initialize logger
log.transports.file.level = 'info';
log.info('Starting Garden of Eden V3...');

// Global reference to window manager
let windowManager: WindowManager | null = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling
try {
  const squirrelStartup = require('electron-squirrel-startup');
  if (squirrelStartup) {
    const { app: electronApp } = getElectron();
    if (electronApp) {
      electronApp.quit();
    }
  }
} catch (error) {
  log.warn('electron-squirrel-startup not available:', error);
}

/**
 * Initialize the application
 */
const initialize = async () => {
  const { app: electronApp } = getElectron();

  try {
    log.info('Initializing application...');

    // Initialize database
    initializeDatabase();

    // Create window manager
    windowManager = new WindowManager();
    await windowManager.createMainWindow();

    // Register IPC handlers (AI handler needs mainWindow)
    registerSystemHandlers();
    registerSettingsHandlers();
    registerAIHandlers(windowManager.mainWindow!);
    registerFileHandlers();
    registerGitHandlers();
    registerMessageHandlers();
    registerConversationHandlers();

    log.info('Application initialized successfully');
  } catch (error) {
    log.error('Failed to initialize application:', error);
    electronApp.quit();
  }
};

/**
 * App lifecycle: Ready
 */
// Load electron and set up event handlers
const { app: electronApp } = getElectron();

electronApp.on('ready', async () => {
  log.info('App ready event');

  // Single instance lock
  const gotTheLock = electronApp.requestSingleInstanceLock();

  if (!gotTheLock) {
    log.warn('Another instance is already running');
    electronApp.quit();
    return;
  }

  electronApp.on('second-instance', () => {
    // Someone tried to run a second instance, focus our window
    if (windowManager?.mainWindow) {
      if (windowManager.mainWindow.isMinimized()) {
        windowManager.mainWindow.restore();
      }
      windowManager.mainWindow.focus();
    }
  });

  await initialize();
});

/**
 * App lifecycle: All windows closed
 */
electronApp.on('window-all-closed', () => {
  log.info('All windows closed');

  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    electronApp.quit();
  }
});

/**
 * App lifecycle: Activate (macOS)
 */
electronApp.on('activate', async () => {
  const { BrowserWindow: ElectronBrowserWindow } = getElectron();
  log.info('App activate event');

  // On macOS, re-create window when dock icon is clicked and no windows exist
  if (ElectronBrowserWindow.getAllWindows().length === 0) {
    await initialize();
  }
});

/**
 * App lifecycle: Before quit
 */
electronApp.on('before-quit', async () => {
  log.info('App quitting...');

  // Cleanup
  if (windowManager) {
    windowManager.cleanup();
  }

  // Close database
  closeDatabase();

  // Cleanup AI services
  await cleanupAIResources();
});

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  log.error('Uncaught exception:', error);
  // Don't crash the app, just log the error
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled rejection at:', promise, 'reason:', reason);
});

/**
 * Security: Disable navigation to external URLs
 */
electronApp.on('web-contents-created', (_event: any, contents: WebContents) => {
  contents.on('will-navigate', (event: any, navigationUrl: string) => {
    const parsedUrl = new URL(navigationUrl);

    // Only allow localhost during development
    if (parsedUrl.origin !== 'http://localhost:5173' && !navigationUrl.startsWith('file://')) {
      log.warn('Blocked navigation to:', navigationUrl);
      event.preventDefault();
    }
  });

  contents.setWindowOpenHandler(({ url }: { url: string }) => {
    log.warn('Blocked new window:', url);
    return { action: 'deny' as const };
  });
});

// Enable DevTools in development
if (process.env.NODE_ENV === 'development') {
  app.whenReady().then(() => {
    // Install React DevTools
    // Note: electron-devtools-installer is optional
  });
}

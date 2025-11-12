/**
 * Electron Main Process Entry Point
 * Garden of Eden V3 - 100% Local AI Assistant
 */

import { app, BrowserWindow } from 'electron';
import { WindowManager } from './window';
import { initializeDatabase, closeDatabase } from './database';
import { registerSystemHandlers } from './ipc/system.handler';
import { registerSettingsHandlers } from './ipc/settings.handler';
import { registerAIHandlers } from './ipc/ai.handler';
import log from 'electron-log';

// Initialize logger
log.transports.file.level = 'info';
log.info('Starting Garden of Eden V3...');

// Global reference to window manager
let windowManager: WindowManager | null = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

/**
 * Initialize the application
 */
const initialize = async () => {
  try {
    log.info('Initializing application...');

    // Initialize database
    initializeDatabase();

    // Register IPC handlers
    registerSystemHandlers();
    registerSettingsHandlers();
    registerAIHandlers();

    // Create window manager
    windowManager = new WindowManager();
    await windowManager.createMainWindow();

    log.info('Application initialized successfully');
  } catch (error) {
    log.error('Failed to initialize application:', error);
    app.quit();
  }
};

/**
 * App lifecycle: Ready
 */
app.on('ready', async () => {
  log.info('App ready event');

  // Single instance lock
  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    log.warn('Another instance is already running');
    app.quit();
    return;
  }

  app.on('second-instance', () => {
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
app.on('window-all-closed', () => {
  log.info('All windows closed');

  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * App lifecycle: Activate (macOS)
 */
app.on('activate', async () => {
  log.info('App activate event');

  // On macOS, re-create window when dock icon is clicked and no windows exist
  if (BrowserWindow.getAllWindows().length === 0) {
    await initialize();
  }
});

/**
 * App lifecycle: Before quit
 */
app.on('before-quit', () => {
  log.info('App quitting...');

  // Cleanup
  if (windowManager) {
    windowManager.cleanup();
  }

  // Close database
  closeDatabase();
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
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    // Only allow localhost during development
    if (parsedUrl.origin !== 'http://localhost:5173' && !navigationUrl.startsWith('file://')) {
      log.warn('Blocked navigation to:', navigationUrl);
      event.preventDefault();
    }
  });

  contents.setWindowOpenHandler(({ url }) => {
    log.warn('Blocked new window:', url);
    return { action: 'deny' };
  });
});

// Enable DevTools in development
if (process.env.NODE_ENV === 'development') {
  app.whenReady().then(() => {
    // Install React DevTools
    // Note: electron-devtools-installer is optional
  });
}

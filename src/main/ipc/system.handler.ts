/**
 * System IPC Handler
 * Handles system-level operations (window controls, platform info, etc.)
 */

import { ipcMain, BrowserWindow } from 'electron';
import log from 'electron-log';

export function registerSystemHandlers(): void {
  log.info('Registering system IPC handlers');

  /**
   * Minimize window
   */
  ipcMain.handle('system:minimize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) {
      window.minimize();
    }
  });

  /**
   * Maximize/unmaximize window
   */
  ipcMain.handle('system:maximize', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) {
      if (window.isMaximized()) {
        window.unmaximize();
      } else {
        window.maximize();
      }
    }
  });

  /**
   * Close window
   */
  ipcMain.handle('system:close', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) {
      window.close();
    }
  });

  /**
   * Get platform information
   */
  ipcMain.handle('system:get-platform', () => {
    return {
      platform: process.platform,
    };
  });

  log.info('System IPC handlers registered');
}

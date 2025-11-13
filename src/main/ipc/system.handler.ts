/**
 * System IPC Handler
 * Handles system-level operations (window controls, platform info, etc.)
 */

import { ipcMain, BrowserWindow } from 'electron';
import log from 'electron-log';
import { getAutoUpdaterService } from '../services/update/auto-updater.service';

export function registerSystemHandlers(): void {
  log.info('Registering system IPC handlers');

  const autoUpdaterService = getAutoUpdaterService();

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

  /**
   * Check for updates
   */
  ipcMain.handle('update:check', async () => {
    try {
      const updateInfo = await autoUpdaterService.checkForUpdates();
      return {
        success: true,
        updateInfo,
      };
    } catch (error) {
      log.error('Failed to check for updates:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  /**
   * Download update
   */
  ipcMain.handle('update:download', async () => {
    try {
      await autoUpdaterService.downloadUpdate();
      return {
        success: true,
      };
    } catch (error) {
      log.error('Failed to download update:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  /**
   * Install update and restart
   */
  ipcMain.handle('update:install', () => {
    try {
      autoUpdaterService.quitAndInstall();
      return {
        success: true,
      };
    } catch (error) {
      log.error('Failed to install update:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  /**
   * Get update status
   */
  ipcMain.handle('update:get-status', () => {
    return autoUpdaterService.getStatus();
  });

  /**
   * Get current app version
   */
  ipcMain.handle('update:get-version', () => {
    return autoUpdaterService.getCurrentVersion();
  });

  /**
   * Set auto-download preference
   */
  ipcMain.handle('update:set-auto-download', (_event, enabled: boolean) => {
    autoUpdaterService.setAutoDownload(enabled);
    return {
      success: true,
    };
  });

  log.info('System IPC handlers registered');
}

/**
 * Auto-Updater Service
 * Handles application updates using electron-updater
 */

import { autoUpdater } from 'electron-updater';
import { app, BrowserWindow } from 'electron';
import log from 'electron-log';
import type { UpdateInfo, ProgressInfo } from 'electron-updater';

export interface UpdateStatus {
  checking: boolean;
  available: boolean;
  downloading: boolean;
  downloaded: boolean;
  error: string | null;
  version: string | null;
  progress: number;
}

/**
 * Auto-Updater Service
 * Manages automatic updates for the application
 */
export class AutoUpdaterService {
  private mainWindow: BrowserWindow | null = null;
  private updateStatus: UpdateStatus = {
    checking: false,
    available: false,
    downloading: false,
    downloaded: false,
    error: null,
    version: null,
    progress: 0,
  };

  constructor() {
    this.setupAutoUpdater();
  }

  /**
   * Setup auto-updater configuration
   */
  private setupAutoUpdater(): void {
    // Configure logger
    autoUpdater.logger = log;
    (autoUpdater.logger as typeof log).transports.file.level = 'info';

    // Auto-download updates
    autoUpdater.autoDownload = false; // Manual download for user control
    autoUpdater.autoInstallOnAppQuit = true;

    // Setup event handlers
    this.setupEventHandlers();

    log.info('Auto-updater service initialized');
  }

  /**
   * Setup event handlers for auto-updater
   */
  private setupEventHandlers(): void {
    autoUpdater.on('checking-for-update', () => {
      log.info('Checking for update...');
      this.updateStatus.checking = true;
      this.sendStatusToRenderer();
    });

    autoUpdater.on('update-available', (info: UpdateInfo) => {
      log.info('Update available:', info.version);
      this.updateStatus.checking = false;
      this.updateStatus.available = true;
      this.updateStatus.version = info.version;
      this.sendStatusToRenderer();

      // Notify renderer
      if (this.mainWindow) {
        this.mainWindow.webContents.send('update:available', {
          version: info.version,
          releaseDate: info.releaseDate,
          releaseNotes: info.releaseNotes,
        });
      }
    });

    autoUpdater.on('update-not-available', (info: UpdateInfo) => {
      log.info('Update not available. Current version:', info.version);
      this.updateStatus.checking = false;
      this.updateStatus.available = false;
      this.sendStatusToRenderer();
    });

    autoUpdater.on('error', (error: Error) => {
      log.error('Auto-updater error:', error);
      this.updateStatus.checking = false;
      this.updateStatus.error = error.message;
      this.sendStatusToRenderer();

      if (this.mainWindow) {
        this.mainWindow.webContents.send('update:error', error.message);
      }
    });

    autoUpdater.on('download-progress', (progressInfo: ProgressInfo) => {
      log.info('Download progress:', progressInfo.percent.toFixed(2) + '%');
      this.updateStatus.downloading = true;
      this.updateStatus.progress = progressInfo.percent;
      this.sendStatusToRenderer();

      if (this.mainWindow) {
        this.mainWindow.webContents.send('update:progress', {
          percent: progressInfo.percent,
          bytesPerSecond: progressInfo.bytesPerSecond,
          transferred: progressInfo.transferred,
          total: progressInfo.total,
        });
      }
    });

    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      log.info('Update downloaded:', info.version);
      this.updateStatus.downloading = false;
      this.updateStatus.downloaded = true;
      this.updateStatus.progress = 100;
      this.sendStatusToRenderer();

      if (this.mainWindow) {
        this.mainWindow.webContents.send('update:downloaded', {
          version: info.version,
        });
      }
    });
  }

  /**
   * Set the main window reference
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  /**
   * Check for updates
   */
  async checkForUpdates(): Promise<UpdateInfo | null> {
    try {
      log.info('Manually checking for updates...');
      const result = await autoUpdater.checkForUpdates();
      return result?.updateInfo || null;
    } catch (error) {
      log.error('Failed to check for updates:', error);
      throw error;
    }
  }

  /**
   * Check for updates on startup (delayed)
   */
  checkForUpdatesOnStartup(delayMs: number = 10000): void {
    // Wait a bit before checking (don't slow down startup)
    setTimeout(() => {
      this.checkForUpdates().catch((error) => {
        log.warn('Startup update check failed:', error);
      });
    }, delayMs);
  }

  /**
   * Download update
   */
  async downloadUpdate(): Promise<void> {
    try {
      log.info('Starting update download...');
      await autoUpdater.downloadUpdate();
    } catch (error) {
      log.error('Failed to download update:', error);
      throw error;
    }
  }

  /**
   * Install update and restart app
   */
  quitAndInstall(): void {
    log.info('Quitting and installing update...');
    autoUpdater.quitAndInstall(false, true);
  }

  /**
   * Get current update status
   */
  getStatus(): UpdateStatus {
    return { ...this.updateStatus };
  }

  /**
   * Get current app version
   */
  getCurrentVersion(): string {
    return app.getVersion();
  }

  /**
   * Send status to renderer process
   */
  private sendStatusToRenderer(): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('update:status', this.updateStatus);
    }
  }

  /**
   * Set update feed URL (for custom update server)
   */
  setFeedURL(url: string): void {
    autoUpdater.setFeedURL({
      provider: 'generic',
      url,
    });
    log.info('Update feed URL set:', url);
  }

  /**
   * Enable/disable auto-download
   */
  setAutoDownload(enabled: boolean): void {
    autoUpdater.autoDownload = enabled;
    log.info('Auto-download set to:', enabled);
  }
}

// Singleton instance
let autoUpdaterServiceInstance: AutoUpdaterService | null = null;

export function getAutoUpdaterService(): AutoUpdaterService {
  if (!autoUpdaterServiceInstance) {
    autoUpdaterServiceInstance = new AutoUpdaterService();
  }
  return autoUpdaterServiceInstance;
}

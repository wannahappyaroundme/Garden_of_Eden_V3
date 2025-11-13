/**
 * Tracking Monitor Service
 * Manages automatic screen tracking, idle detection, and notifications
 */

import { BrowserWindow, Notification } from 'electron';
import log from 'electron-log';
import { getScreenCaptureService } from './capture.service';

export interface TrackingMonitorConfig {
  captureInterval: number; // seconds
  idleThresholdMinutes: number;
  idleNotificationEnabled: boolean;
}

/**
 * Tracking Monitor Service
 * Monitors screen tracking state and sends idle notifications
 */
export class TrackingMonitorService {
  private isTracking: boolean = false;
  private captureTimer: NodeJS.Timeout | null = null;
  private idleCheckTimer: NodeJS.Timeout | null = null;
  private lastCaptureTime: number = 0;
  private captureCount: number = 0;
  private config: TrackingMonitorConfig;
  private mainWindow: BrowserWindow | null = null;

  constructor(config: Partial<TrackingMonitorConfig> = {}) {
    this.config = {
      captureInterval: config.captureInterval ?? 10, // 10 seconds default
      idleThresholdMinutes: config.idleThresholdMinutes ?? 60, // 1 hour default
      idleNotificationEnabled: config.idleNotificationEnabled ?? true,
    };
  }

  /**
   * Set main window for sending notifications
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  /**
   * Start screen tracking
   */
  async startTracking(interval?: number): Promise<boolean> {
    if (this.isTracking) {
      log.info('Screen tracking already active');
      return true;
    }

    try {
      const captureInterval = interval ?? this.config.captureInterval;
      this.config.captureInterval = captureInterval;

      log.info('Starting screen tracking', { interval: captureInterval });

      const screenCaptureService = getScreenCaptureService();
      await screenCaptureService.initialize();

      // Start automatic capture
      this.captureTimer = screenCaptureService.startAutomaticCapture(captureInterval);

      // Track capture times
      this.lastCaptureTime = Date.now();
      this.captureCount = 0;

      // Update capture count periodically
      const originalStartCapture = screenCaptureService.captureScreen.bind(screenCaptureService);
      screenCaptureService.captureScreen = async (contextLevel) => {
        const result = await originalStartCapture(contextLevel);
        this.lastCaptureTime = Date.now();
        this.captureCount++;

        // Send status update to renderer
        this.sendStatusUpdate();

        return result;
      };

      // Start idle monitoring
      this.startIdleMonitoring();

      this.isTracking = true;

      // Send initial status update
      this.sendStatusUpdate();

      // Send notification to renderer for Dynamic Island animation
      this.sendTrackingNotification('started', captureInterval);

      log.info('Screen tracking started successfully');
      return true;
    } catch (error) {
      log.error('Failed to start screen tracking:', error);
      return false;
    }
  }

  /**
   * Stop screen tracking
   */
  async stopTracking(): Promise<boolean> {
    if (!this.isTracking) {
      log.info('Screen tracking already stopped');
      return true;
    }

    try {
      log.info('Stopping screen tracking');

      // Stop capture timer
      if (this.captureTimer) {
        const screenCaptureService = getScreenCaptureService();
        screenCaptureService.stopAutomaticCapture(this.captureTimer);
        this.captureTimer = null;
      }

      // Stop idle monitoring
      this.stopIdleMonitoring();

      this.isTracking = false;

      // Send status update
      this.sendStatusUpdate();

      // Send notification to renderer for Dynamic Island animation
      this.sendTrackingNotification('stopped', 0);

      log.info('Screen tracking stopped successfully');
      return true;
    } catch (error) {
      log.error('Failed to stop screen tracking:', error);
      return false;
    }
  }

  /**
   * Toggle screen tracking
   */
  async toggleTracking(interval?: number): Promise<{ isTracking: boolean; interval: number }> {
    if (this.isTracking) {
      await this.stopTracking();
      return { isTracking: false, interval: 0 };
    } else {
      await this.startTracking(interval);
      return { isTracking: true, interval: this.config.captureInterval };
    }
  }

  /**
   * Get current tracking status
   */
  getStatus(): {
    isTracking: boolean;
    lastCaptureTime: number;
    captureCount: number;
    captureInterval: number;
  } {
    return {
      isTracking: this.isTracking,
      lastCaptureTime: this.lastCaptureTime,
      captureCount: this.captureCount,
      captureInterval: this.config.captureInterval,
    };
  }

  /**
   * Start idle monitoring
   */
  private startIdleMonitoring(): void {
    if (!this.config.idleNotificationEnabled) {
      return;
    }

    // Check every 5 minutes
    this.idleCheckTimer = setInterval(() => {
      this.checkIdleState();
    }, 5 * 60 * 1000);

    log.info('Idle monitoring started');
  }

  /**
   * Stop idle monitoring
   */
  private stopIdleMonitoring(): void {
    if (this.idleCheckTimer) {
      clearInterval(this.idleCheckTimer);
      this.idleCheckTimer = null;
      log.info('Idle monitoring stopped');
    }
  }

  /**
   * Check if tracking has been idle for too long
   */
  private checkIdleState(): void {
    if (this.isTracking) {
      // Tracking is active, no need to notify
      return;
    }

    const now = Date.now();
    const idleTime = now - this.lastCaptureTime;
    const idleThreshold = this.config.idleThresholdMinutes * 60 * 1000;

    if (idleTime >= idleThreshold) {
      const idleDurationMinutes = Math.floor(idleTime / 1000 / 60);
      this.sendIdleNotification(idleDurationMinutes);
    }
  }

  /**
   * Send idle notification (system + in-app)
   */
  private sendIdleNotification(idleDurationMinutes: number): void {
    log.info('Sending idle notification', { idleDurationMinutes });

    // System notification (macOS/Windows)
    const notification = new Notification({
      title: '화면 추적 알림',
      body: `${idleDurationMinutes}분 동안 화면 추적이 비활성화되어 있습니다.\n다시 시작하시겠습니까?`,
      silent: false,
      urgency: 'normal',
    });

    notification.on('click', async () => {
      log.info('User clicked idle notification, restarting tracking');
      await this.startTracking();

      // Focus the app window
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.show();
        this.mainWindow.focus();
      }
    });

    notification.show();

    // Send to renderer for in-app notification
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('screen:notify-idle', {
        idleDurationMinutes,
      });
    }
  }

  /**
   * Send tracking notification to renderer (for Dynamic Island animation)
   */
  private sendTrackingNotification(action: 'started' | 'stopped', interval: number): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('screen:tracking-notification', {
        action,
        interval,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Send status update to renderer
   */
  private sendStatusUpdate(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('screen:status-update', this.getStatus());
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<TrackingMonitorConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };

    // Restart tracking if interval changed and tracking is active
    if (config.captureInterval && this.isTracking) {
      this.stopTracking().then(() => {
        this.startTracking(config.captureInterval);
      });
    }

    log.info('Tracking monitor config updated', this.config);
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    log.info('Cleaning up tracking monitor service');
    await this.stopTracking();
    this.mainWindow = null;
  }
}

// Singleton instance
let trackingMonitorServiceInstance: TrackingMonitorService | null = null;

export function getTrackingMonitorService(): TrackingMonitorService {
  if (!trackingMonitorServiceInstance) {
    trackingMonitorServiceInstance = new TrackingMonitorService();
  }
  return trackingMonitorServiceInstance;
}

export async function cleanupTrackingMonitorService(): Promise<void> {
  if (trackingMonitorServiceInstance) {
    await trackingMonitorServiceInstance.cleanup();
    trackingMonitorServiceInstance = null;
  }
}

/**
 * Screen Tracking IPC Handler
 * Handles screen tracking controls from renderer process
 */

import { ipcMain, BrowserWindow } from 'electron';
import { getTrackingMonitorService } from '../services/screen/tracking-monitor.service';
import type { ScreenTrackingChannels } from '../../shared/types/ipc.types';
import log from 'electron-log';

/**
 * Register all screen tracking IPC handlers
 */
export function registerScreenHandlers(mainWindow: BrowserWindow): void {
  const trackingMonitor = getTrackingMonitorService();
  trackingMonitor.setMainWindow(mainWindow);

  // Start tracking
  ipcMain.handle(
    'screen:start-tracking',
    async (_, request: ScreenTrackingChannels['screen:start-tracking']['request']) => {
      try {
        log.info('Screen tracking start requested', { interval: request.interval });
        const started = await trackingMonitor.startTracking(request.interval);
        const interval = trackingMonitor.getStatus().captureInterval;

        return { started, interval };
      } catch (error) {
        log.error('Failed to start screen tracking', error);
        throw new Error(
          'Failed to start tracking: ' + (error instanceof Error ? error.message : String(error))
        );
      }
    }
  );

  // Stop tracking
  ipcMain.handle('screen:stop-tracking', async () => {
    try {
      log.info('Screen tracking stop requested');
      const stopped = await trackingMonitor.stopTracking();

      return { stopped };
    } catch (error) {
      log.error('Failed to stop screen tracking', error);
      throw new Error(
        'Failed to stop tracking: ' + (error instanceof Error ? error.message : String(error))
      );
    }
  });

  // Toggle tracking
  ipcMain.handle(
    'screen:toggle-tracking',
    async (_, request: ScreenTrackingChannels['screen:toggle-tracking']['request']) => {
      try {
        log.info('Screen tracking toggle requested', { interval: request.interval });
        const result = await trackingMonitor.toggleTracking(request.interval);

        return result;
      } catch (error) {
        log.error('Failed to toggle screen tracking', error);
        throw new Error(
          'Failed to toggle tracking: ' + (error instanceof Error ? error.message : String(error))
        );
      }
    }
  );

  // Get status
  ipcMain.handle('screen:get-status', async () => {
    try {
      const status = trackingMonitor.getStatus();
      return status;
    } catch (error) {
      log.error('Failed to get screen tracking status', error);
      throw new Error(
        'Failed to get status: ' + (error instanceof Error ? error.message : String(error))
      );
    }
  });

  console.log('[IPC] Screen tracking handlers registered');
}

/**
 * Cleanup screen tracking resources on app quit
 */
export async function cleanupScreenResources(): Promise<void> {
  try {
    log.info('Cleaning up screen tracking resources...');
    const { cleanupTrackingMonitorService } = await import(
      '../services/screen/tracking-monitor.service'
    );
    await cleanupTrackingMonitorService();

    const { cleanupScreenCaptureService } = await import('../services/screen/capture.service');
    await cleanupScreenCaptureService();

    log.info('Screen tracking resources cleaned up');
  } catch (error) {
    log.error('Error cleaning up screen tracking resources', error);
  }
}

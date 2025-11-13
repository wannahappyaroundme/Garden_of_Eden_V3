/**
 * Settings IPC Handler
 * Handles user preferences and settings storage
 */

import { ipcMain } from 'electron';
import Store from 'electron-store';
import log from 'electron-log';

// Initialize settings store
const settingsStore = new Store({
  name: 'settings',
  defaults: {
    language: 'ko',
    theme: 'dark',
    mode: 'user-led',
    voiceEnabled: true,
    screenCaptureLevel: 1,
    // Screen tracking settings
    screenTrackingEnabled: false,
    screenCaptureInterval: 10, // seconds
    idleNotificationEnabled: true,
    idleThresholdMinutes: 60, // 1 hour
    // Calendar settings
    calendarEnabled: false,
    calendarIcsUrl: '',
    calendarSyncInterval: 30, // minutes
    calendarWorkingHoursStart: 9,
    calendarWorkingHoursEnd: 18,
  },
});

export function registerSettingsHandlers(): void {
  log.info('Registering settings IPC handlers');

  /**
   * Get a specific setting
   */
  ipcMain.handle('settings:get', (_event, args: { key: string }) => {
    const { key } = args;
    const value = settingsStore.get(key);
    log.debug(`Getting setting: ${key} = ${value}`);
    return { value };
  });

  /**
   * Set a specific setting
   */
  ipcMain.handle('settings:set', (_event, args: { key: string; value: unknown }) => {
    const { key, value } = args;
    try {
      settingsStore.set(key, value);
      log.info(`Setting updated: ${key} = ${value}`);
      return { success: true };
    } catch (error) {
      log.error(`Failed to set setting ${key}:`, error);
      return { success: false };
    }
  });

  /**
   * Get all settings
   */
  ipcMain.handle('settings:get-all', () => {
    const settings = settingsStore.store;
    log.debug('Getting all settings');
    return { settings };
  });

  log.info('Settings IPC handlers registered');
}

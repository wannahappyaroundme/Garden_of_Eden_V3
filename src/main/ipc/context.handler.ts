/**
 * Conversation Context IPC Handler
 * Handles conversation context manager, voice, and proactive AI IPC communication
 */

import { ipcMain, type IpcMainInvokeEvent, BrowserWindow } from 'electron';
import log from 'electron-log';
import {
  getConversationContextManager,
  type ConversationConfig,
} from '../services/conversation/context-manager.service';
import type { ProactiveEvent } from '../services/ai/proactive-ai.service';
import type { VADEvent } from '../services/voice/vad.service';
import type { WakeWordEvent } from '../services/voice/wakeword.service';

/**
 * Register conversation context IPC handlers
 */
export function registerContextHandlers(): void {
  log.info('Registering conversation context IPC handlers...');

  const contextManager = getConversationContextManager();

  // Initialize conversation manager
  ipcMain.handle('context:initialize', async (_event: IpcMainInvokeEvent) => {
    try {
      log.info('IPC: Initialize conversation context manager');
      await contextManager.initialize();
      return { success: true };
    } catch (error) {
      log.error('IPC: Failed to initialize context manager:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Process user query
  ipcMain.handle(
    'context:process-query',
    async (
      _event: IpcMainInvokeEvent,
      query: string,
      options?: { forceMode?: 'fast' | 'detailed'; skipRAFT?: boolean }
    ) => {
      try {
        log.info(`IPC: Process query: "${query.substring(0, 50)}..."`);

        const result = await contextManager.processQuery(query, options);

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        log.error('IPC: Failed to process query:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Get conversation context
  ipcMain.handle('context:get-context', (_event: IpcMainInvokeEvent) => {
    try {
      const context = contextManager.getContext();
      return { success: true, data: context };
    } catch (error) {
      log.error('IPC: Failed to get context:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get conversation config
  ipcMain.handle('context:get-config', (_event: IpcMainInvokeEvent) => {
    try {
      const config = contextManager.getConfig();
      return { success: true, data: config };
    } catch (error) {
      log.error('IPC: Failed to get config:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Update conversation config
  ipcMain.handle(
    'context:update-config',
    (_event: IpcMainInvokeEvent, config: Partial<ConversationConfig>) => {
      try {
        log.info('IPC: Update conversation config');
        contextManager.updateConfig(config);
        return { success: true };
      } catch (error) {
        log.error('IPC: Failed to update config:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Voice control handlers

  // Start listening
  ipcMain.handle('voice:start-listening', async (_event: IpcMainInvokeEvent) => {
    try {
      log.info('IPC: Start voice listening');
      await contextManager.startListening();
      return { success: true };
    } catch (error) {
      log.error('IPC: Failed to start listening:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Stop listening
  ipcMain.handle('voice:stop-listening', (_event: IpcMainInvokeEvent) => {
    try {
      log.info('IPC: Stop voice listening');
      contextManager.stopListening();
      return { success: true };
    } catch (error) {
      log.error('IPC: Failed to stop listening:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Proactive AI handlers

  // Enable/disable proactive mode
  ipcMain.handle('proactive:set-enabled', (_event: IpcMainInvokeEvent, enabled: boolean) => {
    try {
      log.info(`IPC: Set proactive mode: ${enabled}`);
      contextManager.setProactiveEnabled(enabled);
      return { success: true };
    } catch (error) {
      log.error('IPC: Failed to set proactive mode:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Manually trigger proactive message
  ipcMain.handle('proactive:trigger', (_event: IpcMainInvokeEvent) => {
    try {
      log.info('IPC: Trigger proactive message');
      contextManager.triggerProactiveMessage();
      return { success: true };
    } catch (error) {
      log.error('IPC: Failed to trigger proactive message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Event forwarding to renderer

  // Forward proactive messages
  contextManager.on('proactive-message', (event: ProactiveEvent) => {
    log.debug('Forwarding proactive message to renderer');
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('context:proactive-message', event);
    }
  });

  // Forward speech detection events
  contextManager.on('speech-start', (event: VADEvent) => {
    log.debug('Forwarding speech-start to renderer');
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('context:speech-start', event);
    }
  });

  contextManager.on('speech-end', (event: VADEvent) => {
    log.debug('Forwarding speech-end to renderer');
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('context:speech-end', event);
    }
  });

  // Forward recording trigger
  contextManager.on('trigger-recording', (data: { duration?: number; timestamp: Date }) => {
    log.debug('Forwarding trigger-recording to renderer');
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('context:trigger-recording', data);
    }
  });

  // Forward wake word detection
  contextManager.on('wake-word-detected', (event: WakeWordEvent) => {
    log.debug('Forwarding wake-word-detected to renderer');
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('context:wake-word-detected', event);
    }
  });

  // Forward listening start
  contextManager.on('start-listening', () => {
    log.debug('Forwarding start-listening to renderer');
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('context:start-listening');
    }
  });

  // Forward idle updates
  contextManager.on('idle-update', (data: { idleMinutes: number }) => {
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.send('context:idle-update', data);
    }
  });

  log.info('Conversation context IPC handlers registered');
}

/**
 * Get main window (helper function)
 */
function getMainWindow() {
  const windows = BrowserWindow.getAllWindows();
  return windows[0] || null;
}

/**
 * Cleanup context handlers
 */
export function cleanupContextHandlers(): void {
  log.info('Cleaning up conversation context IPC handlers...');

  ipcMain.removeHandler('context:initialize');
  ipcMain.removeHandler('context:process-query');
  ipcMain.removeHandler('context:get-context');
  ipcMain.removeHandler('context:get-config');
  ipcMain.removeHandler('context:update-config');
  ipcMain.removeHandler('voice:start-listening');
  ipcMain.removeHandler('voice:stop-listening');
  ipcMain.removeHandler('proactive:set-enabled');
  ipcMain.removeHandler('proactive:trigger');

  const contextManager = getConversationContextManager();
  contextManager.removeAllListeners();

  log.info('Conversation context IPC handlers cleaned up');
}

/**
 * Download IPC Handler
 * Handles model download operations
 */

import { ipcMain } from 'electron';
import log from 'electron-log';
import { getModelDownloaderService } from '../services/download/model-downloader.service';

export function registerDownloadHandlers(): void {
  log.info('Registering download IPC handlers');

  const downloaderService = getModelDownloaderService();

  /**
   * Get available models
   */
  ipcMain.handle('download:get-models', () => {
    return downloaderService.getAvailableModels();
  });

  /**
   * Get models directory
   */
  ipcMain.handle('download:get-directory', () => {
    return downloaderService.getModelsDirectory();
  });

  /**
   * Check if model is downloaded
   */
  ipcMain.handle('download:is-downloaded', async (_event, modelId: string) => {
    try {
      return await downloaderService.isModelDownloaded(modelId);
    } catch (error) {
      log.error('Failed to check if model is downloaded:', error);
      return false;
    }
  });

  /**
   * Get downloaded models
   */
  ipcMain.handle('download:get-downloaded', async () => {
    try {
      return await downloaderService.getDownloadedModels();
    } catch (error) {
      log.error('Failed to get downloaded models:', error);
      return [];
    }
  });

  /**
   * Download a single model
   */
  ipcMain.handle('download:model', async (_event, modelId: string) => {
    try {
      await downloaderService.downloadModel(modelId);
      return {
        success: true,
      };
    } catch (error) {
      log.error(`Failed to download model ${modelId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  /**
   * Download all models
   */
  ipcMain.handle('download:all-models', async () => {
    try {
      await downloaderService.downloadAllModels();
      return {
        success: true,
      };
    } catch (error) {
      log.error('Failed to download all models:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  /**
   * Pause download
   */
  ipcMain.handle('download:pause', (_event, modelId: string) => {
    try {
      downloaderService.pauseDownload(modelId);
      return {
        success: true,
      };
    } catch (error) {
      log.error(`Failed to pause download for ${modelId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  /**
   * Resume download
   */
  ipcMain.handle('download:resume', async (_event, modelId: string) => {
    try {
      await downloaderService.resumeDownload(modelId);
      return {
        success: true,
      };
    } catch (error) {
      log.error(`Failed to resume download for ${modelId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  /**
   * Cancel download
   */
  ipcMain.handle('download:cancel', async (_event, modelId: string) => {
    try {
      await downloaderService.cancelDownload(modelId);
      return {
        success: true,
      };
    } catch (error) {
      log.error(`Failed to cancel download for ${modelId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  /**
   * Delete model
   */
  ipcMain.handle('download:delete', async (_event, modelId: string) => {
    try {
      await downloaderService.deleteModel(modelId);
      return {
        success: true,
      };
    } catch (error) {
      log.error(`Failed to delete model ${modelId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  /**
   * Get download status
   */
  ipcMain.handle('download:get-status', () => {
    return downloaderService.getDownloadStatus();
  });

  /**
   * Get disk space information
   */
  ipcMain.handle('download:get-disk-space', async () => {
    try {
      return await downloaderService.getDiskSpace();
    } catch (error) {
      log.error('Failed to get disk space:', error);
      return {
        available: 0,
        required: 0,
        sufficient: false,
      };
    }
  });

  log.info('Download IPC handlers registered');
}

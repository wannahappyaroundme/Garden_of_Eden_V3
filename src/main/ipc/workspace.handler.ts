/**
 * Workspace IPC Handler
 * Handles workspace operations from renderer process
 */

import { ipcMain } from 'electron';
import { getWorkspaceService } from '../services/workspace/workspace.service';
import type { WorkspaceChannels } from '../../shared/types/workspace.types';
import log from 'electron-log';

/**
 * Register all workspace IPC handlers
 */
export function registerWorkspaceHandlers(): void {
  const workspaceService = getWorkspaceService();

  // Open workspace
  ipcMain.handle(
    'workspace:open',
    async (_, request: WorkspaceChannels['workspace:open']['request']) => {
      try {
        log.info('Workspace open requested', { rootPath: request.rootPath });
        const workspace = await workspaceService.openWorkspace(request.rootPath);

        return { workspace };
      } catch (error) {
        log.error('Failed to open workspace', error);
        throw new Error(
          'Failed to open workspace: ' + (error instanceof Error ? error.message : String(error))
        );
      }
    }
  );

  // Get current workspace
  ipcMain.handle('workspace:current', async () => {
    try {
      const workspace = workspaceService.getCurrentWorkspace();
      return { workspace };
    } catch (error) {
      log.error('Failed to get current workspace', error);
      throw new Error(
        'Failed to get current workspace: ' +
          (error instanceof Error ? error.message : String(error))
      );
    }
  });

  // Analyze workspace
  ipcMain.handle(
    'workspace:analyze',
    async (_, request: WorkspaceChannels['workspace:analyze']['request']) => {
      try {
        log.info('Workspace analysis requested', { rootPath: request.rootPath });
        const analysis = await workspaceService.analyzeProject(request.rootPath);

        return { analysis };
      } catch (error) {
        log.error('Failed to analyze workspace', error);
        throw new Error(
          'Failed to analyze workspace: ' +
            (error instanceof Error ? error.message : String(error))
        );
      }
    }
  );

  // Get recent workspaces
  ipcMain.handle(
    'workspace:recent',
    async (_, request: WorkspaceChannels['workspace:recent']['request']) => {
      try {
        const workspaces = workspaceService.getRecentWorkspaces(request.limit);
        return { workspaces };
      } catch (error) {
        log.error('Failed to get recent workspaces', error);
        throw new Error(
          'Failed to get recent workspaces: ' +
            (error instanceof Error ? error.message : String(error))
        );
      }
    }
  );

  // Detect workspace type
  ipcMain.handle(
    'workspace:detect-type',
    async (_, request: WorkspaceChannels['workspace:detect-type']['request']) => {
      try {
        log.info('Workspace type detection requested', { rootPath: request.rootPath });
        const workspaceType = await workspaceService.detectWorkspaceType(request.rootPath);

        return { workspaceType };
      } catch (error) {
        log.error('Failed to detect workspace type', error);
        throw new Error(
          'Failed to detect workspace type: ' +
            (error instanceof Error ? error.message : String(error))
        );
      }
    }
  );

  // Detect active editor
  ipcMain.handle('workspace:detect-editor', async () => {
    try {
      const editor = await workspaceService.detectActiveEditor();
      return { editor };
    } catch (error) {
      log.error('Failed to detect active editor', error);
      throw new Error(
        'Failed to detect active editor: ' +
          (error instanceof Error ? error.message : String(error))
      );
    }
  });

  // Close workspace
  ipcMain.handle('workspace:close', async () => {
    try {
      log.info('Workspace close requested');
      const success = workspaceService.closeWorkspace();

      return { success };
    } catch (error) {
      log.error('Failed to close workspace', error);
      throw new Error(
        'Failed to close workspace: ' + (error instanceof Error ? error.message : String(error))
      );
    }
  });

  log.info('[IPC] Workspace handlers registered');
}

/**
 * Cleanup workspace resources on app quit
 */
export async function cleanupWorkspaceResources(): Promise<void> {
  try {
    log.info('Cleaning up workspace resources...');
    const { cleanupWorkspaceService } = await import('../services/workspace/workspace.service');
    await cleanupWorkspaceService();

    log.info('Workspace resources cleaned up');
  } catch (error) {
    log.error('Error cleaning up workspace resources', error);
  }
}

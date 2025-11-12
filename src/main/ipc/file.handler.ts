/**
 * File IPC Handler
 * Handles file system operations from renderer process
 */

import { ipcMain } from 'electron';
import { fileService } from '../services/integration/file.service';
import type { FileChannels, FileInfo } from '../../shared/types/ipc.types';

/**
 * Register all file-related IPC handlers
 */
export function registerFileHandlers(): void {
  // Read file
  ipcMain.handle('file:read', async (_, request: FileChannels['file:read']['request']) => {
    try {
      const content = await fileService.readFile(request.path, {
        encoding: request.encoding as BufferEncoding,
        maxSize: request.maxSize,
      });
      return { content };
    } catch (error) {
      throw new Error(
        `Failed to read file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });

  // Write file
  ipcMain.handle('file:write', async (_, request: FileChannels['file:write']['request']) => {
    try {
      await fileService.writeFile(request.path, request.content, {
        encoding: request.encoding as BufferEncoding,
        createDir: request.createDir,
      });
      return { success: true };
    } catch (error) {
      throw new Error(
        `Failed to write file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });

  // Delete file or directory
  ipcMain.handle('file:delete', async (_, request: FileChannels['file:delete']['request']) => {
    try {
      await fileService.delete(request.path);
      return { success: true };
    } catch (error) {
      throw new Error(
        `Failed to delete: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });

  // Check if file exists
  ipcMain.handle('file:exists', async (_, request: FileChannels['file:exists']['request']) => {
    try {
      const exists = await fileService.exists(request.path);
      return { exists };
    } catch (error) {
      throw new Error(
        `Failed to check existence: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });

  // Get file info
  ipcMain.handle('file:info', async (_, request: FileChannels['file:info']['request']) => {
    try {
      const info = await fileService.getInfo(request.path);
      // Convert Date to timestamp for IPC transfer
      const fileInfo: FileInfo = {
        ...info,
        modified: info.modified.getTime(),
      };
      return { info: fileInfo };
    } catch (error) {
      throw new Error(
        `Failed to get file info: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });

  // List directory
  ipcMain.handle(
    'file:list-directory',
    async (_, request: FileChannels['file:list-directory']['request']) => {
      try {
        const files = await fileService.listDirectory(request.path);
        // Convert Date to timestamp for IPC transfer
        const fileInfos: FileInfo[] = files.map((file) => ({
          ...file,
          modified: file.modified.getTime(),
        }));
        return { files: fileInfos };
      } catch (error) {
        throw new Error(
          `Failed to list directory: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // Search files
  ipcMain.handle('file:search', async (_, request: FileChannels['file:search']['request']) => {
    try {
      const files = await fileService.search({
        pattern: request.pattern,
        cwd: request.cwd,
        maxResults: request.maxResults,
        ignore: request.ignore,
      });
      return { files };
    } catch (error) {
      throw new Error(
        `Failed to search files: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });

  // Find workspace root
  ipcMain.handle(
    'file:workspace-root',
    async (_, request: FileChannels['file:workspace-root']['request']) => {
      try {
        const root = await fileService.findWorkspaceRoot(request.startPath);
        return { root };
      } catch (error) {
        throw new Error(
          `Failed to find workspace root: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // Create directory
  ipcMain.handle(
    'file:create-directory',
    async (_, request: FileChannels['file:create-directory']['request']) => {
      try {
        await fileService.createDirectory(request.path);
        return { success: true };
      } catch (error) {
        throw new Error(
          `Failed to create directory: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // Copy file or directory
  ipcMain.handle('file:copy', async (_, request: FileChannels['file:copy']['request']) => {
    try {
      await fileService.copy(request.source, request.destination);
      return { success: true };
    } catch (error) {
      throw new Error(
        `Failed to copy: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });

  // Move file or directory
  ipcMain.handle('file:move', async (_, request: FileChannels['file:move']['request']) => {
    try {
      await fileService.move(request.source, request.destination);
      return { success: true };
    } catch (error) {
      throw new Error(
        `Failed to move: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });

  console.log('[IPC] File handlers registered');
}

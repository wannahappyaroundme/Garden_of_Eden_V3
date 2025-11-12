/**
 * Git IPC Handler
 * Handles Git operations from renderer process
 */

import { ipcMain } from 'electron';
import { gitService } from '../services/integration/git.service';
import type { GitChannels } from '../../shared/types/ipc.types';

/**
 * Register all Git-related IPC handlers
 */
export function registerGitHandlers(): void {
  // Initialize Git repository
  ipcMain.handle('git:init', async (_, request: GitChannels['git:init']['request']) => {
    try {
      await gitService.init(request.repoPath);
      return { success: true };
    } catch (error) {
      throw new Error(
        `Failed to initialize Git: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });

  // Get repository status
  ipcMain.handle('git:status', async () => {
    try {
      const status = await gitService.status();
      return { status };
    } catch (error) {
      throw new Error(
        `Failed to get status: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });

  // Get diff
  ipcMain.handle('git:diff', async (_, request: GitChannels['git:diff']['request']) => {
    try {
      const diff = await gitService.diff(request.filePath);
      return { diff };
    } catch (error) {
      throw new Error(
        `Failed to get diff: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });

  // Get staged diff
  ipcMain.handle(
    'git:diff-staged',
    async (_, request: GitChannels['git:diff-staged']['request']) => {
      try {
        const diff = await gitService.diffStaged(request.filePath);
        return { diff };
      } catch (error) {
        throw new Error(
          `Failed to get staged diff: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // Stage files
  ipcMain.handle('git:add', async (_, request: GitChannels['git:add']['request']) => {
    try {
      await gitService.add(request.files);
      return { success: true };
    } catch (error) {
      throw new Error(
        `Failed to stage files: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });

  // Unstage files
  ipcMain.handle('git:reset', async (_, request: GitChannels['git:reset']['request']) => {
    try {
      await gitService.reset(request.files);
      return { success: true };
    } catch (error) {
      throw new Error(
        `Failed to unstage files: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });

  // Commit changes
  ipcMain.handle('git:commit', async (_, request: GitChannels['git:commit']['request']) => {
    try {
      const commitHash = await gitService.commit(request.message);
      return { commitHash };
    } catch (error) {
      throw new Error(
        `Failed to commit: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });

  // Push to remote
  ipcMain.handle('git:push', async (_, request: GitChannels['git:push']['request']) => {
    try {
      await gitService.push(request.remote, request.branch);
      return { success: true };
    } catch (error) {
      throw new Error(
        `Failed to push: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });

  // Pull from remote
  ipcMain.handle('git:pull', async (_, request: GitChannels['git:pull']['request']) => {
    try {
      await gitService.pull(request.remote, request.branch);
      return { success: true };
    } catch (error) {
      throw new Error(
        `Failed to pull: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });

  // Get commit log
  ipcMain.handle('git:log', async (_, request: GitChannels['git:log']['request']) => {
    try {
      const commits = await gitService.log(request.maxCount);
      return { commits };
    } catch (error) {
      throw new Error(
        `Failed to get log: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });

  // List branches
  ipcMain.handle('git:branches', async () => {
    try {
      const branches = await gitService.branches();
      return { branches };
    } catch (error) {
      throw new Error(
        `Failed to list branches: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });

  // Create new branch
  ipcMain.handle(
    'git:create-branch',
    async (_, request: GitChannels['git:create-branch']['request']) => {
      try {
        await gitService.createBranch(request.branchName);
        return { success: true };
      } catch (error) {
        throw new Error(
          `Failed to create branch: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // Checkout branch
  ipcMain.handle('git:checkout', async (_, request: GitChannels['git:checkout']['request']) => {
    try {
      await gitService.checkout(request.branchName);
      return { success: true };
    } catch (error) {
      throw new Error(
        `Failed to checkout branch: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });

  // Get current branch
  ipcMain.handle('git:current-branch', async () => {
    try {
      const branch = await gitService.currentBranch();
      return { branch };
    } catch (error) {
      throw new Error(
        `Failed to get current branch: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });

  // Get remote URL
  ipcMain.handle(
    'git:remote-url',
    async (_, request: GitChannels['git:remote-url']['request']) => {
      try {
        const url = await gitService.getRemoteUrl(request.remote);
        return { url };
      } catch (error) {
        throw new Error(
          `Failed to get remote URL: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );

  // Stash changes
  ipcMain.handle('git:stash', async (_, request: GitChannels['git:stash']['request']) => {
    try {
      await gitService.stash(request.message);
      return { success: true };
    } catch (error) {
      throw new Error(
        `Failed to stash: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });

  // Pop stash
  ipcMain.handle('git:stash-pop', async () => {
    try {
      await gitService.stashPop();
      return { success: true };
    } catch (error) {
      throw new Error(
        `Failed to pop stash: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  });

  console.log('[IPC] Git handlers registered');
}

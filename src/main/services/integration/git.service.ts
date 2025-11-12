/**
 * Git Service
 * Handles Git operations (status, diff, commit, push, pull, etc.)
 */

import simpleGit, { SimpleGit, StatusResult, DiffResult, LogResult } from 'simple-git';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface GitStatus {
  current: string;
  tracking: string | null;
  files: GitFileStatus[];
  ahead: number;
  behind: number;
  isClean: boolean;
}

export interface GitFileStatus {
  path: string;
  status: string; // e.g., 'M', 'A', 'D', '??'
  workingDir: string;
  index: string;
}

export interface GitCommit {
  hash: string;
  date: string;
  message: string;
  author: string;
  body?: string;
}

export interface GitBranch {
  name: string;
  current: boolean;
  commit: string;
}

export interface GitDiff {
  file: string;
  changes: string;
}

/**
 * Git Service
 * Provides Git integration for workspace management
 */
export class GitService {
  private git: SimpleGit | null = null;
  private repoPath: string | null = null;

  /**
   * Initialize Git for a repository path
   */
  async init(repoPath: string): Promise<void> {
    try {
      const absolutePath = path.resolve(repoPath);

      // Check if path exists
      try {
        await fs.access(absolutePath);
      } catch {
        throw new Error(`Path does not exist: ${absolutePath}`);
      }

      // Initialize simple-git
      this.git = simpleGit(absolutePath);
      this.repoPath = absolutePath;

      // Verify it's a git repository
      const isRepo = await this.git.checkIsRepo();
      if (!isRepo) {
        throw new Error(`Not a git repository: ${absolutePath}`);
      }
    } catch (error) {
      this.git = null;
      this.repoPath = null;
      throw new Error(
        `Failed to initialize Git: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Check if Git is initialized
   */
  private ensureInitialized(): void {
    if (!this.git || !this.repoPath) {
      throw new Error('Git not initialized. Call init() first.');
    }
  }

  /**
   * Get repository status
   */
  async status(): Promise<GitStatus> {
    this.ensureInitialized();

    try {
      const status: StatusResult = await this.git!.status();

      return {
        current: status.current,
        tracking: status.tracking,
        files: status.files.map((file) => ({
          path: file.path,
          status: file.index + file.working_dir,
          workingDir: file.working_dir,
          index: file.index,
        })),
        ahead: status.ahead,
        behind: status.behind,
        isClean: status.isClean(),
      };
    } catch (error) {
      throw new Error(
        `Failed to get status: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get diff for file(s)
   */
  async diff(filePath?: string): Promise<string> {
    this.ensureInitialized();

    try {
      if (filePath) {
        const diff = await this.git!.diff(['--', filePath]);
        return diff;
      } else {
        const diff = await this.git!.diff();
        return diff;
      }
    } catch (error) {
      throw new Error(
        `Failed to get diff: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get staged diff
   */
  async diffStaged(filePath?: string): Promise<string> {
    this.ensureInitialized();

    try {
      if (filePath) {
        const diff = await this.git!.diff(['--cached', '--', filePath]);
        return diff;
      } else {
        const diff = await this.git!.diff(['--cached']);
        return diff;
      }
    } catch (error) {
      throw new Error(
        `Failed to get staged diff: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Stage file(s)
   */
  async add(files: string | string[]): Promise<void> {
    this.ensureInitialized();

    try {
      if (Array.isArray(files)) {
        await this.git!.add(files);
      } else {
        await this.git!.add(files);
      }
    } catch (error) {
      throw new Error(
        `Failed to stage files: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Unstage file(s)
   */
  async reset(files?: string | string[]): Promise<void> {
    this.ensureInitialized();

    try {
      if (files) {
        const fileList = Array.isArray(files) ? files : [files];
        await this.git!.reset(['HEAD', '--', ...fileList]);
      } else {
        await this.git!.reset(['HEAD']);
      }
    } catch (error) {
      throw new Error(
        `Failed to unstage files: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Commit changes
   */
  async commit(message: string): Promise<string> {
    this.ensureInitialized();

    try {
      const result = await this.git!.commit(message);
      return result.commit;
    } catch (error) {
      throw new Error(
        `Failed to commit: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Push to remote
   */
  async push(remote: string = 'origin', branch?: string): Promise<void> {
    this.ensureInitialized();

    try {
      if (branch) {
        await this.git!.push(remote, branch);
      } else {
        await this.git!.push();
      }
    } catch (error) {
      throw new Error(
        `Failed to push: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Pull from remote
   */
  async pull(remote: string = 'origin', branch?: string): Promise<void> {
    this.ensureInitialized();

    try {
      if (branch) {
        await this.git!.pull(remote, branch);
      } else {
        await this.git!.pull();
      }
    } catch (error) {
      throw new Error(
        `Failed to pull: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get commit log
   */
  async log(maxCount: number = 20): Promise<GitCommit[]> {
    this.ensureInitialized();

    try {
      const log: LogResult = await this.git!.log({ maxCount });

      return log.all.map((commit) => ({
        hash: commit.hash,
        date: commit.date,
        message: commit.message,
        author: `${commit.author_name} <${commit.author_email}>`,
        body: commit.body,
      }));
    } catch (error) {
      throw new Error(
        `Failed to get log: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * List branches
   */
  async branches(): Promise<GitBranch[]> {
    this.ensureInitialized();

    try {
      const branches = await this.git!.branch();

      return branches.all.map((name) => ({
        name,
        current: name === branches.current,
        commit: branches.branches[name]?.commit || '',
      }));
    } catch (error) {
      throw new Error(
        `Failed to list branches: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Create new branch
   */
  async createBranch(branchName: string): Promise<void> {
    this.ensureInitialized();

    try {
      await this.git!.checkoutLocalBranch(branchName);
    } catch (error) {
      throw new Error(
        `Failed to create branch: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Checkout branch
   */
  async checkout(branchName: string): Promise<void> {
    this.ensureInitialized();

    try {
      await this.git!.checkout(branchName);
    } catch (error) {
      throw new Error(
        `Failed to checkout branch: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get current branch name
   */
  async currentBranch(): Promise<string> {
    this.ensureInitialized();

    try {
      const branch = await this.git!.branch();
      return branch.current;
    } catch (error) {
      throw new Error(
        `Failed to get current branch: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get remote URL
   */
  async getRemoteUrl(remote: string = 'origin'): Promise<string> {
    this.ensureInitialized();

    try {
      const remotes = await this.git!.getRemotes(true);
      const remoteObj = remotes.find((r) => r.name === remote);

      if (!remoteObj) {
        throw new Error(`Remote '${remote}' not found`);
      }

      return remoteObj.refs.fetch || remoteObj.refs.push || '';
    } catch (error) {
      throw new Error(
        `Failed to get remote URL: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Stash changes
   */
  async stash(message?: string): Promise<void> {
    this.ensureInitialized();

    try {
      if (message) {
        await this.git!.stash(['push', '-m', message]);
      } else {
        await this.git!.stash();
      }
    } catch (error) {
      throw new Error(
        `Failed to stash: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Apply stash
   */
  async stashPop(): Promise<void> {
    this.ensureInitialized();

    try {
      await this.git!.stash(['pop']);
    } catch (error) {
      throw new Error(
        `Failed to pop stash: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get repository root path
   */
  getRepoPath(): string | null {
    return this.repoPath;
  }
}

// Singleton instance
export const gitService = new GitService();

/**
 * Unit Tests for GitService
 *
 * Tests all Git operations including:
 * - Repository initialization
 * - Status and diff operations
 * - Staging operations (add, reset)
 * - Commit and sync operations
 * - Branch management
 * - Advanced operations (log, stash)
 */

import { GitService } from '@/main/services/integration/git.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import simpleGit, { SimpleGit } from 'simple-git';

// Mock simple-git
jest.mock('simple-git');

describe('GitService', () => {
  let gitService: GitService;
  let mockGit: jest.Mocked<SimpleGit>;
  let tempDir: string;

  beforeEach(() => {
    gitService = new GitService();

    // Create mock SimpleGit instance
    mockGit = {
      status: jest.fn(),
      diff: jest.fn(),
      diffSummary: jest.fn(),
      add: jest.fn(),
      reset: jest.fn(),
      commit: jest.fn(),
      push: jest.fn(),
      pull: jest.fn(),
      log: jest.fn(),
      branch: jest.fn(),
      checkoutLocalBranch: jest.fn(),
      checkout: jest.fn(),
      revparse: jest.fn(),
      getRemotes: jest.fn(),
      stash: jest.fn(),
    } as any;

    (simpleGit as jest.MockedFunction<typeof simpleGit>).mockReturnValue(mockGit);
  });

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'git-service-test-'));
  });

  afterAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('init', () => {
    it('should initialize with valid repository path', async () => {
      const repoPath = path.join(tempDir, 'test-repo');
      await fs.mkdir(repoPath, { recursive: true });

      await gitService.init(repoPath);

      expect(simpleGit).toHaveBeenCalledWith(repoPath);
      expect(gitService.getRepoPath()).toBe(repoPath);
    });

    it('should throw error for non-existent path', async () => {
      const nonExistentPath = path.join(tempDir, 'non-existent');

      await expect(gitService.init(nonExistentPath)).rejects.toThrow('Repository path does not exist');
    });

    it('should throw error for file path instead of directory', async () => {
      const filePath = path.join(tempDir, 'test-file.txt');
      await fs.writeFile(filePath, 'test content');

      await expect(gitService.init(filePath)).rejects.toThrow('Repository path must be a directory');
    });

    it('should reinitialize with different path', async () => {
      const repoPath1 = path.join(tempDir, 'repo1');
      const repoPath2 = path.join(tempDir, 'repo2');
      await fs.mkdir(repoPath1, { recursive: true });
      await fs.mkdir(repoPath2, { recursive: true });

      await gitService.init(repoPath1);
      expect(gitService.getRepoPath()).toBe(repoPath1);

      await gitService.init(repoPath2);
      expect(gitService.getRepoPath()).toBe(repoPath2);
      expect(simpleGit).toHaveBeenCalledTimes(2);
    });
  });

  describe('status', () => {
    beforeEach(async () => {
      const repoPath = path.join(tempDir, 'status-repo');
      await fs.mkdir(repoPath, { recursive: true });
      await gitService.init(repoPath);
    });

    it('should return git status successfully', async () => {
      const mockStatus = {
        modified: ['file1.ts', 'file2.ts'],
        created: ['new-file.ts'],
        deleted: ['old-file.ts'],
        renamed: [],
        staged: ['staged-file.ts'],
        conflicted: [],
        isClean: () => false,
        current: 'main',
        tracking: 'origin/main',
        ahead: 2,
        behind: 1,
      };

      mockGit.status.mockResolvedValue(mockStatus as any);

      const result = await gitService.status();

      expect(mockGit.status).toHaveBeenCalled();
      expect(result).toEqual({
        modified: ['file1.ts', 'file2.ts'],
        added: ['new-file.ts'],
        deleted: ['old-file.ts'],
        renamed: [],
        staged: ['staged-file.ts'],
        conflicted: [],
        isClean: false,
        currentBranch: 'main',
        trackingBranch: 'origin/main',
        ahead: 2,
        behind: 1,
      });
    });

    it('should handle clean repository', async () => {
      const mockStatus = {
        modified: [],
        created: [],
        deleted: [],
        renamed: [],
        staged: [],
        conflicted: [],
        isClean: () => true,
        current: 'main',
        tracking: null,
        ahead: 0,
        behind: 0,
      };

      mockGit.status.mockResolvedValue(mockStatus as any);

      const result = await gitService.status();

      expect(result.isClean).toBe(true);
      expect(result.modified).toEqual([]);
      expect(result.added).toEqual([]);
    });

    it('should throw error when not initialized', async () => {
      const uninitializedService = new GitService();
      await expect(uninitializedService.status()).rejects.toThrow('Git service not initialized');
    });
  });

  describe('diff', () => {
    beforeEach(async () => {
      const repoPath = path.join(tempDir, 'diff-repo');
      await fs.mkdir(repoPath, { recursive: true });
      await gitService.init(repoPath);
    });

    it('should get diff for entire repository', async () => {
      const mockDiff = 'diff --git a/file.ts b/file.ts\n+added line\n-removed line';
      mockGit.diff.mockResolvedValue(mockDiff);

      const result = await gitService.diff();

      expect(mockGit.diff).toHaveBeenCalledWith(['HEAD']);
      expect(result).toBe(mockDiff);
    });

    it('should get diff for specific file', async () => {
      const mockDiff = 'diff --git a/specific.ts b/specific.ts\n+change';
      mockGit.diff.mockResolvedValue(mockDiff);

      const result = await gitService.diff('src/specific.ts');

      expect(mockGit.diff).toHaveBeenCalledWith(['HEAD', 'src/specific.ts']);
      expect(result).toBe(mockDiff);
    });

    it('should handle empty diff', async () => {
      mockGit.diff.mockResolvedValue('');

      const result = await gitService.diff();

      expect(result).toBe('');
    });
  });

  describe('diffStaged', () => {
    beforeEach(async () => {
      const repoPath = path.join(tempDir, 'diff-staged-repo');
      await fs.mkdir(repoPath, { recursive: true });
      await gitService.init(repoPath);
    });

    it('should get staged diff for entire repository', async () => {
      const mockDiff = 'diff --git a/staged.ts b/staged.ts\n+staged change';
      mockGit.diff.mockResolvedValue(mockDiff);

      const result = await gitService.diffStaged();

      expect(mockGit.diff).toHaveBeenCalledWith(['--cached']);
      expect(result).toBe(mockDiff);
    });

    it('should get staged diff for specific file', async () => {
      const mockDiff = 'diff --git a/staged.ts b/staged.ts\n+staged change';
      mockGit.diff.mockResolvedValue(mockDiff);

      const result = await gitService.diffStaged('src/staged.ts');

      expect(mockGit.diff).toHaveBeenCalledWith(['--cached', 'src/staged.ts']);
      expect(result).toBe(mockDiff);
    });
  });

  describe('add', () => {
    beforeEach(async () => {
      const repoPath = path.join(tempDir, 'add-repo');
      await fs.mkdir(repoPath, { recursive: true });
      await gitService.init(repoPath);
    });

    it('should add single file', async () => {
      mockGit.add.mockResolvedValue(undefined as any);

      await gitService.add('file.ts');

      expect(mockGit.add).toHaveBeenCalledWith('file.ts');
    });

    it('should add multiple files', async () => {
      mockGit.add.mockResolvedValue(undefined as any);

      await gitService.add(['file1.ts', 'file2.ts', 'file3.ts']);

      expect(mockGit.add).toHaveBeenCalledWith(['file1.ts', 'file2.ts', 'file3.ts']);
    });

    it('should add all files with "."', async () => {
      mockGit.add.mockResolvedValue(undefined as any);

      await gitService.add('.');

      expect(mockGit.add).toHaveBeenCalledWith('.');
    });
  });

  describe('reset', () => {
    beforeEach(async () => {
      const repoPath = path.join(tempDir, 'reset-repo');
      await fs.mkdir(repoPath, { recursive: true });
      await gitService.init(repoPath);
    });

    it('should reset all staged files when no files specified', async () => {
      mockGit.reset.mockResolvedValue(undefined as any);

      await gitService.reset();

      expect(mockGit.reset).toHaveBeenCalledWith(['HEAD']);
    });

    it('should reset specific file', async () => {
      mockGit.reset.mockResolvedValue(undefined as any);

      await gitService.reset('file.ts');

      expect(mockGit.reset).toHaveBeenCalledWith(['HEAD', 'file.ts']);
    });

    it('should reset multiple files', async () => {
      mockGit.reset.mockResolvedValue(undefined as any);

      await gitService.reset(['file1.ts', 'file2.ts']);

      expect(mockGit.reset).toHaveBeenCalledWith(['HEAD', 'file1.ts', 'file2.ts']);
    });
  });

  describe('commit', () => {
    beforeEach(async () => {
      const repoPath = path.join(tempDir, 'commit-repo');
      await fs.mkdir(repoPath, { recursive: true });
      await gitService.init(repoPath);
    });

    it('should create commit successfully', async () => {
      const mockCommitResult = {
        commit: 'abc123',
        summary: {
          changes: 3,
          insertions: 10,
          deletions: 5,
        },
      };

      mockGit.commit.mockResolvedValue(mockCommitResult as any);

      const result = await gitService.commit('feat: add new feature');

      expect(mockGit.commit).toHaveBeenCalledWith('feat: add new feature');
      expect(result).toBe('abc123');
    });

    it('should handle empty commit message', async () => {
      mockGit.commit.mockRejectedValue(new Error('Commit message is required'));

      await expect(gitService.commit('')).rejects.toThrow();
    });

    it('should handle multiline commit message', async () => {
      const mockCommitResult = {
        commit: 'def456',
        summary: { changes: 1, insertions: 5, deletions: 0 },
      };

      mockGit.commit.mockResolvedValue(mockCommitResult as any);

      const multilineMessage = 'feat: add feature\n\nDetailed description\nof the changes';
      const result = await gitService.commit(multilineMessage);

      expect(mockGit.commit).toHaveBeenCalledWith(multilineMessage);
      expect(result).toBe('def456');
    });
  });

  describe('push', () => {
    beforeEach(async () => {
      const repoPath = path.join(tempDir, 'push-repo');
      await fs.mkdir(repoPath, { recursive: true });
      await gitService.init(repoPath);
    });

    it('should push to default remote and current branch', async () => {
      mockGit.revparse.mockResolvedValue('main');
      mockGit.push.mockResolvedValue(undefined as any);

      await gitService.push();

      expect(mockGit.revparse).toHaveBeenCalledWith(['--abbrev-ref', 'HEAD']);
      expect(mockGit.push).toHaveBeenCalledWith('origin', 'main');
    });

    it('should push to specified remote and branch', async () => {
      mockGit.push.mockResolvedValue(undefined as any);

      await gitService.push('upstream', 'feature-branch');

      expect(mockGit.push).toHaveBeenCalledWith('upstream', 'feature-branch');
      expect(mockGit.revparse).not.toHaveBeenCalled();
    });

    it('should push to custom remote with current branch', async () => {
      mockGit.revparse.mockResolvedValue('develop');
      mockGit.push.mockResolvedValue(undefined as any);

      await gitService.push('custom-remote');

      expect(mockGit.revparse).toHaveBeenCalledWith(['--abbrev-ref', 'HEAD']);
      expect(mockGit.push).toHaveBeenCalledWith('custom-remote', 'develop');
    });
  });

  describe('pull', () => {
    beforeEach(async () => {
      const repoPath = path.join(tempDir, 'pull-repo');
      await fs.mkdir(repoPath, { recursive: true });
      await gitService.init(repoPath);
    });

    it('should pull from default remote and current branch', async () => {
      mockGit.revparse.mockResolvedValue('main');
      mockGit.pull.mockResolvedValue(undefined as any);

      await gitService.pull();

      expect(mockGit.revparse).toHaveBeenCalledWith(['--abbrev-ref', 'HEAD']);
      expect(mockGit.pull).toHaveBeenCalledWith('origin', 'main');
    });

    it('should pull from specified remote and branch', async () => {
      mockGit.pull.mockResolvedValue(undefined as any);

      await gitService.pull('upstream', 'main');

      expect(mockGit.pull).toHaveBeenCalledWith('upstream', 'main');
      expect(mockGit.revparse).not.toHaveBeenCalled();
    });
  });

  describe('log', () => {
    beforeEach(async () => {
      const repoPath = path.join(tempDir, 'log-repo');
      await fs.mkdir(repoPath, { recursive: true });
      await gitService.init(repoPath);
    });

    it('should get commit log with default count', async () => {
      const mockLog = {
        all: [
          {
            hash: 'abc123',
            date: '2025-01-13',
            message: 'feat: add feature',
            author_name: 'Test User',
            author_email: 'test@example.com',
          },
          {
            hash: 'def456',
            date: '2025-01-12',
            message: 'fix: fix bug',
            author_name: 'Test User',
            author_email: 'test@example.com',
          },
        ],
      };

      mockGit.log.mockResolvedValue(mockLog as any);

      const result = await gitService.log();

      expect(mockGit.log).toHaveBeenCalledWith({ maxCount: 20 });
      expect(result).toHaveLength(2);
      expect(result[0].hash).toBe('abc123');
      expect(result[0].message).toBe('feat: add feature');
    });

    it('should get commit log with custom count', async () => {
      const mockLog = {
        all: [
          {
            hash: 'abc123',
            date: '2025-01-13',
            message: 'feat: add feature',
            author_name: 'Test User',
            author_email: 'test@example.com',
          },
        ],
      };

      mockGit.log.mockResolvedValue(mockLog as any);

      const result = await gitService.log(5);

      expect(mockGit.log).toHaveBeenCalledWith({ maxCount: 5 });
      expect(result).toHaveLength(1);
    });

    it('should handle empty log', async () => {
      const mockLog = { all: [] };
      mockGit.log.mockResolvedValue(mockLog as any);

      const result = await gitService.log();

      expect(result).toEqual([]);
    });
  });

  describe('branches', () => {
    beforeEach(async () => {
      const repoPath = path.join(tempDir, 'branches-repo');
      await fs.mkdir(repoPath, { recursive: true });
      await gitService.init(repoPath);
    });

    it('should list all branches', async () => {
      const mockBranches = {
        all: ['main', 'develop', 'feature/test'],
        current: 'main',
        branches: {
          main: { current: true, name: 'main', commit: 'abc123' },
          develop: { current: false, name: 'develop', commit: 'def456' },
          'feature/test': { current: false, name: 'feature/test', commit: 'ghi789' },
        },
      };

      mockGit.branch.mockResolvedValue(mockBranches as any);

      const result = await gitService.branches();

      expect(mockGit.branch).toHaveBeenCalled();
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('main');
      expect(result[0].current).toBe(true);
      expect(result[1].current).toBe(false);
    });

    it('should handle repository with single branch', async () => {
      const mockBranches = {
        all: ['main'],
        current: 'main',
        branches: {
          main: { current: true, name: 'main', commit: 'abc123' },
        },
      };

      mockGit.branch.mockResolvedValue(mockBranches as any);

      const result = await gitService.branches();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('main');
    });
  });

  describe('createBranch', () => {
    beforeEach(async () => {
      const repoPath = path.join(tempDir, 'create-branch-repo');
      await fs.mkdir(repoPath, { recursive: true });
      await gitService.init(repoPath);
    });

    it('should create new branch successfully', async () => {
      mockGit.checkoutLocalBranch.mockResolvedValue(undefined as any);

      await gitService.createBranch('feature/new-feature');

      expect(mockGit.checkoutLocalBranch).toHaveBeenCalledWith('feature/new-feature');
    });

    it('should handle invalid branch names', async () => {
      mockGit.checkoutLocalBranch.mockRejectedValue(new Error('Invalid branch name'));

      await expect(gitService.createBranch('invalid..name')).rejects.toThrow();
    });
  });

  describe('checkout', () => {
    beforeEach(async () => {
      const repoPath = path.join(tempDir, 'checkout-repo');
      await fs.mkdir(repoPath, { recursive: true });
      await gitService.init(repoPath);
    });

    it('should checkout existing branch', async () => {
      mockGit.checkout.mockResolvedValue(undefined as any);

      await gitService.checkout('develop');

      expect(mockGit.checkout).toHaveBeenCalledWith('develop');
    });

    it('should handle non-existent branch', async () => {
      mockGit.checkout.mockRejectedValue(new Error('Branch not found'));

      await expect(gitService.checkout('non-existent')).rejects.toThrow();
    });
  });

  describe('currentBranch', () => {
    beforeEach(async () => {
      const repoPath = path.join(tempDir, 'current-branch-repo');
      await fs.mkdir(repoPath, { recursive: true });
      await gitService.init(repoPath);
    });

    it('should get current branch name', async () => {
      mockGit.revparse.mockResolvedValue('main');

      const result = await gitService.currentBranch();

      expect(mockGit.revparse).toHaveBeenCalledWith(['--abbrev-ref', 'HEAD']);
      expect(result).toBe('main');
    });

    it('should handle detached HEAD state', async () => {
      mockGit.revparse.mockResolvedValue('HEAD');

      const result = await gitService.currentBranch();

      expect(result).toBe('HEAD');
    });
  });

  describe('getRemoteUrl', () => {
    beforeEach(async () => {
      const repoPath = path.join(tempDir, 'remote-url-repo');
      await fs.mkdir(repoPath, { recursive: true });
      await gitService.init(repoPath);
    });

    it('should get remote URL for default remote', async () => {
      const mockRemotes = [
        { name: 'origin', refs: { fetch: 'https://github.com/user/repo.git', push: 'https://github.com/user/repo.git' } },
      ];

      mockGit.getRemotes.mockResolvedValue(mockRemotes as any);

      const result = await gitService.getRemoteUrl();

      expect(mockGit.getRemotes).toHaveBeenCalledWith(true);
      expect(result).toBe('https://github.com/user/repo.git');
    });

    it('should get remote URL for specified remote', async () => {
      const mockRemotes = [
        { name: 'origin', refs: { fetch: 'https://github.com/user/repo.git', push: 'https://github.com/user/repo.git' } },
        { name: 'upstream', refs: { fetch: 'https://github.com/org/repo.git', push: 'https://github.com/org/repo.git' } },
      ];

      mockGit.getRemotes.mockResolvedValue(mockRemotes as any);

      const result = await gitService.getRemoteUrl('upstream');

      expect(result).toBe('https://github.com/org/repo.git');
    });

    it('should throw error when remote not found', async () => {
      const mockRemotes = [
        { name: 'origin', refs: { fetch: 'https://github.com/user/repo.git', push: 'https://github.com/user/repo.git' } },
      ];

      mockGit.getRemotes.mockResolvedValue(mockRemotes as any);

      await expect(gitService.getRemoteUrl('non-existent')).rejects.toThrow('Remote "non-existent" not found');
    });
  });

  describe('stash', () => {
    beforeEach(async () => {
      const repoPath = path.join(tempDir, 'stash-repo');
      await fs.mkdir(repoPath, { recursive: true });
      await gitService.init(repoPath);
    });

    it('should stash changes without message', async () => {
      mockGit.stash.mockResolvedValue(undefined as any);

      await gitService.stash();

      expect(mockGit.stash).toHaveBeenCalledWith([]);
    });

    it('should stash changes with message', async () => {
      mockGit.stash.mockResolvedValue(undefined as any);

      await gitService.stash('WIP: feature in progress');

      expect(mockGit.stash).toHaveBeenCalledWith(['push', '-m', 'WIP: feature in progress']);
    });
  });

  describe('stashPop', () => {
    beforeEach(async () => {
      const repoPath = path.join(tempDir, 'stash-pop-repo');
      await fs.mkdir(repoPath, { recursive: true });
      await gitService.init(repoPath);
    });

    it('should pop latest stash', async () => {
      mockGit.stash.mockResolvedValue(undefined as any);

      await gitService.stashPop();

      expect(mockGit.stash).toHaveBeenCalledWith(['pop']);
    });

    it('should handle empty stash', async () => {
      mockGit.stash.mockRejectedValue(new Error('No stash entries found'));

      await expect(gitService.stashPop()).rejects.toThrow();
    });
  });

  describe('getRepoPath', () => {
    it('should return null when not initialized', () => {
      const uninitializedService = new GitService();
      expect(uninitializedService.getRepoPath()).toBeNull();
    });

    it('should return repo path after initialization', async () => {
      const repoPath = path.join(tempDir, 'repo-path-test');
      await fs.mkdir(repoPath, { recursive: true });

      await gitService.init(repoPath);

      expect(gitService.getRepoPath()).toBe(repoPath);
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      const repoPath = path.join(tempDir, 'error-handling-repo');
      await fs.mkdir(repoPath, { recursive: true });
      await gitService.init(repoPath);
    });

    it('should propagate git errors with context', async () => {
      mockGit.status.mockRejectedValue(new Error('Git command failed'));

      await expect(gitService.status()).rejects.toThrow('Git command failed');
    });

    it('should handle network errors during push', async () => {
      mockGit.revparse.mockResolvedValue('main');
      mockGit.push.mockRejectedValue(new Error('Network error'));

      await expect(gitService.push()).rejects.toThrow('Network error');
    });

    it('should handle conflicts during pull', async () => {
      mockGit.revparse.mockResolvedValue('main');
      mockGit.pull.mockRejectedValue(new Error('Merge conflict'));

      await expect(gitService.pull()).rejects.toThrow('Merge conflict');
    });
  });
});

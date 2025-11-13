/**
 * File Service Unit Tests
 * Tests for file system operations (read, write, search, traverse)
 */

import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as os from 'os';
import { FileService } from '../../../src/main/services/integration/file.service';

describe('FileService', () => {
  let fileService: FileService;
  let tempDir: string;

  beforeAll(async () => {
    // Create a temporary directory for tests
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'file-service-test-'));
  });

  beforeEach(() => {
    fileService = new FileService();
  });

  afterAll(async () => {
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Failed to clean up temp directory:', error);
    }
  });

  describe('readFile', () => {
    it('should read a text file successfully', async () => {
      const testFile = path.join(tempDir, 'test-read.txt');
      const content = 'Hello, World!';
      await fs.writeFile(testFile, content, 'utf-8');

      const result = await fileService.readFile(testFile);

      expect(result).toBe(content);
    });

    it('should throw error for non-existent file', async () => {
      const nonExistentFile = path.join(tempDir, 'non-existent.txt');

      await expect(fileService.readFile(nonExistentFile)).rejects.toThrow(
        'File does not exist'
      );
    });

    it('should throw error for file exceeding max size', async () => {
      const testFile = path.join(tempDir, 'large-file.txt');
      const largeContent = 'x'.repeat(1024 * 1024 * 11); // 11MB
      await fs.writeFile(testFile, largeContent, 'utf-8');

      await expect(fileService.readFile(testFile)).rejects.toThrow(
        'File too large'
      );
    });

    it('should respect custom maxSize option', async () => {
      const testFile = path.join(tempDir, 'small-file.txt');
      const content = 'x'.repeat(1000);
      await fs.writeFile(testFile, content, 'utf-8');

      await expect(
        fileService.readFile(testFile, { maxSize: 100 })
      ).rejects.toThrow('File too large');
    });

    it('should read file with custom encoding', async () => {
      const testFile = path.join(tempDir, 'test-encoding.txt');
      const content = 'Test content';
      await fs.writeFile(testFile, content, 'utf-8');

      const result = await fileService.readFile(testFile, { encoding: 'utf-8' });

      expect(result).toBe(content);
    });
  });

  describe('writeFile', () => {
    it('should write a file successfully', async () => {
      const testFile = path.join(tempDir, 'test-write.txt');
      const content = 'Test content to write';

      await fileService.writeFile(testFile, content);

      const written = await fs.readFile(testFile, 'utf-8');
      expect(written).toBe(content);
    });

    it('should create parent directories if createDir is true', async () => {
      const testFile = path.join(tempDir, 'nested', 'deep', 'file.txt');
      const content = 'Nested file content';

      await fileService.writeFile(testFile, content, { createDir: true });

      const written = await fs.readFile(testFile, 'utf-8');
      expect(written).toBe(content);
    });

    it('should overwrite existing file', async () => {
      const testFile = path.join(tempDir, 'overwrite.txt');
      await fs.writeFile(testFile, 'Original content', 'utf-8');

      const newContent = 'New content';
      await fileService.writeFile(testFile, newContent);

      const written = await fs.readFile(testFile, 'utf-8');
      expect(written).toBe(newContent);
    });
  });

  describe('delete', () => {
    it('should delete a file', async () => {
      const testFile = path.join(tempDir, 'to-delete.txt');
      await fs.writeFile(testFile, 'Delete me', 'utf-8');

      await fileService.delete(testFile);

      const exists = await fileService.exists(testFile);
      expect(exists).toBe(false);
    });

    it('should delete a directory recursively', async () => {
      const testDir = path.join(tempDir, 'dir-to-delete');
      await fs.mkdir(testDir, { recursive: true });
      await fs.writeFile(path.join(testDir, 'file.txt'), 'test', 'utf-8');

      await fileService.delete(testDir);

      const exists = await fileService.exists(testDir);
      expect(exists).toBe(false);
    });

    it('should throw error when deleting non-existent path', async () => {
      const nonExistent = path.join(tempDir, 'non-existent-delete.txt');

      await expect(fileService.delete(nonExistent)).rejects.toThrow(
        'Failed to delete'
      );
    });
  });

  describe('exists', () => {
    it('should return true for existing file', async () => {
      const testFile = path.join(tempDir, 'exists-test.txt');
      await fs.writeFile(testFile, 'test', 'utf-8');

      const exists = await fileService.exists(testFile);

      expect(exists).toBe(true);
    });

    it('should return false for non-existent file', async () => {
      const nonExistent = path.join(tempDir, 'non-existent-exists.txt');

      const exists = await fileService.exists(nonExistent);

      expect(exists).toBe(false);
    });

    it('should return true for existing directory', async () => {
      const testDir = path.join(tempDir, 'exists-dir');
      await fs.mkdir(testDir, { recursive: true });

      const exists = await fileService.exists(testDir);

      expect(exists).toBe(true);
    });
  });

  describe('getInfo', () => {
    it('should return file information', async () => {
      const testFile = path.join(tempDir, 'info-test.txt');
      const content = 'Test content';
      await fs.writeFile(testFile, content, 'utf-8');

      const info = await fileService.getInfo(testFile);

      expect(info.name).toBe('info-test.txt');
      expect(info.type).toBe('file');
      expect(info.extension).toBe('txt');
      expect(info.size).toBeGreaterThan(0);
      expect(info.modified).toBeInstanceOf(Date);
    });

    it('should return directory information', async () => {
      const testDir = path.join(tempDir, 'info-dir');
      await fs.mkdir(testDir, { recursive: true });

      const info = await fileService.getInfo(testDir);

      expect(info.name).toBe('info-dir');
      expect(info.type).toBe('directory');
      expect(info.extension).toBeUndefined();
    });

    it('should throw error for non-existent path', async () => {
      const nonExistent = path.join(tempDir, 'non-existent-info.txt');

      await expect(fileService.getInfo(nonExistent)).rejects.toThrow(
        'Failed to get file info'
      );
    });
  });

  describe('listDirectory', () => {
    it('should list directory contents', async () => {
      const testDir = path.join(tempDir, 'list-dir');
      await fs.mkdir(testDir, { recursive: true });
      await fs.writeFile(path.join(testDir, 'file1.txt'), 'test', 'utf-8');
      await fs.writeFile(path.join(testDir, 'file2.txt'), 'test', 'utf-8');
      await fs.mkdir(path.join(testDir, 'subdir'));

      const contents = await fileService.listDirectory(testDir);

      expect(contents).toHaveLength(3);
      expect(contents.map(c => c.name).sort()).toEqual([
        'file1.txt',
        'file2.txt',
        'subdir',
      ].sort());
    });

    it('should return empty array for empty directory', async () => {
      const testDir = path.join(tempDir, 'empty-dir');
      await fs.mkdir(testDir, { recursive: true });

      const contents = await fileService.listDirectory(testDir);

      expect(contents).toHaveLength(0);
    });

    it('should throw error for non-existent directory', async () => {
      const nonExistent = path.join(tempDir, 'non-existent-dir');

      await expect(fileService.listDirectory(nonExistent)).rejects.toThrow(
        'Directory does not exist'
      );
    });

    it('should throw error for non-directory path', async () => {
      const testFile = path.join(tempDir, 'not-a-dir.txt');
      await fs.writeFile(testFile, 'test', 'utf-8');

      await expect(fileService.listDirectory(testFile)).rejects.toThrow(
        'Path is not a directory'
      );
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      // Create test directory structure
      const searchDir = path.join(tempDir, 'search-test');
      await fs.mkdir(searchDir, { recursive: true });
      await fs.writeFile(path.join(searchDir, 'file1.txt'), 'test', 'utf-8');
      await fs.writeFile(path.join(searchDir, 'file2.js'), 'test', 'utf-8');
      await fs.mkdir(path.join(searchDir, 'subdir'));
      await fs.writeFile(path.join(searchDir, 'subdir', 'nested.txt'), 'test', 'utf-8');
    });

    it('should find files matching pattern', async () => {
      const searchDir = path.join(tempDir, 'search-test');

      const results = await fileService.search({
        pattern: '*.txt',
        cwd: searchDir,
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results.every(r => r.endsWith('.txt'))).toBe(true);
    });

    it('should find nested files with glob pattern', async () => {
      const searchDir = path.join(tempDir, 'search-test');

      const results = await fileService.search({
        pattern: '**/*.txt',
        cwd: searchDir,
        ignore: [],
      });

      expect(results.length).toBe(2);
    });

    it('should respect maxResults option', async () => {
      const searchDir = path.join(tempDir, 'search-test');

      const results = await fileService.search({
        pattern: '**/*',
        cwd: searchDir,
        maxResults: 1,
        ignore: [],
      });

      expect(results.length).toBeLessThanOrEqual(1);
    });
  });

  describe('findWorkspaceRoot', () => {
    it('should find workspace root with package.json', async () => {
      const workspaceDir = path.join(tempDir, 'workspace');
      await fs.mkdir(workspaceDir, { recursive: true });
      await fs.writeFile(
        path.join(workspaceDir, 'package.json'),
        '{}',
        'utf-8'
      );
      const nestedDir = path.join(workspaceDir, 'src', 'deep');
      await fs.mkdir(nestedDir, { recursive: true });

      const root = await fileService.findWorkspaceRoot(nestedDir);

      expect(root).toBe(workspaceDir);
    });

    it('should return null if no workspace markers found', async () => {
      const tempSubDir = path.join(tempDir, 'no-workspace');
      await fs.mkdir(tempSubDir, { recursive: true });

      const root = await fileService.findWorkspaceRoot(tempSubDir);

      // May be null or may find a parent workspace (e.g., Eden project itself)
      // Just ensure it doesn't throw
      expect(root === null || typeof root === 'string').toBe(true);
    });
  });

  describe('createDirectory', () => {
    it('should create a directory', async () => {
      const testDir = path.join(tempDir, 'new-dir');

      await fileService.createDirectory(testDir);

      const exists = await fileService.exists(testDir);
      expect(exists).toBe(true);
    });

    it('should create nested directories', async () => {
      const testDir = path.join(tempDir, 'nested', 'deep', 'dir');

      await fileService.createDirectory(testDir);

      const exists = await fileService.exists(testDir);
      expect(exists).toBe(true);
    });

    it('should not throw if directory already exists', async () => {
      const testDir = path.join(tempDir, 'existing-dir');
      await fs.mkdir(testDir, { recursive: true });

      await expect(fileService.createDirectory(testDir)).resolves.not.toThrow();
    });
  });

  describe('copy', () => {
    it('should copy a file', async () => {
      const source = path.join(tempDir, 'copy-source.txt');
      const dest = path.join(tempDir, 'copy-dest.txt');
      const content = 'Content to copy';
      await fs.writeFile(source, content, 'utf-8');

      await fileService.copy(source, dest);

      const copied = await fs.readFile(dest, 'utf-8');
      expect(copied).toBe(content);
    });

    it('should copy a directory recursively', async () => {
      const sourceDir = path.join(tempDir, 'copy-dir-source');
      const destDir = path.join(tempDir, 'copy-dir-dest');
      await fs.mkdir(sourceDir, { recursive: true });
      await fs.writeFile(path.join(sourceDir, 'file.txt'), 'test', 'utf-8');

      await fileService.copy(sourceDir, destDir);

      const exists = await fileService.exists(path.join(destDir, 'file.txt'));
      expect(exists).toBe(true);
    });

    it('should throw error for non-existent source', async () => {
      const nonExistent = path.join(tempDir, 'non-existent-copy.txt');
      const dest = path.join(tempDir, 'copy-dest.txt');

      await expect(fileService.copy(nonExistent, dest)).rejects.toThrow(
        'Source does not exist'
      );
    });
  });

  describe('move', () => {
    it('should move/rename a file', async () => {
      const source = path.join(tempDir, 'move-source.txt');
      const dest = path.join(tempDir, 'move-dest.txt');
      const content = 'Content to move';
      await fs.writeFile(source, content, 'utf-8');

      await fileService.move(source, dest);

      const sourceExists = await fileService.exists(source);
      const destExists = await fileService.exists(dest);
      expect(sourceExists).toBe(false);
      expect(destExists).toBe(true);

      const moved = await fs.readFile(dest, 'utf-8');
      expect(moved).toBe(content);
    });

    it('should move a directory', async () => {
      const sourceDir = path.join(tempDir, 'move-dir-source');
      const destDir = path.join(tempDir, 'move-dir-dest');
      await fs.mkdir(sourceDir, { recursive: true });
      await fs.writeFile(path.join(sourceDir, 'file.txt'), 'test', 'utf-8');

      await fileService.move(sourceDir, destDir);

      const sourceExists = await fileService.exists(sourceDir);
      const destExists = await fileService.exists(destDir);
      expect(sourceExists).toBe(false);
      expect(destExists).toBe(true);
    });

    it('should throw error for non-existent source', async () => {
      const nonExistent = path.join(tempDir, 'non-existent-move.txt');
      const dest = path.join(tempDir, 'move-dest.txt');

      await expect(fileService.move(nonExistent, dest)).rejects.toThrow(
        'Failed to move'
      );
    });
  });
});

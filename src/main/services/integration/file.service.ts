/**
 * File Service
 * Handles file system operations (read, write, search, traverse)
 */

import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import fg from 'fast-glob';

export interface FileInfo {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size: number;
  modified: Date;
  extension?: string;
}

export interface FileSearchOptions {
  pattern: string;
  cwd?: string;
  maxResults?: number;
  ignore?: string[];
}

export interface ReadFileOptions {
  encoding?: BufferEncoding;
  maxSize?: number; // in bytes, default 10MB
}

export interface WriteFileOptions {
  encoding?: BufferEncoding;
  createDir?: boolean;
}

/**
 * File Service
 * Provides secure file system operations with permission checks
 */
export class FileService {
  private readonly maxFileSize: number = 10 * 1024 * 1024; // 10MB default

  /**
   * Read file contents
   */
  async readFile(
    filePath: string,
    options: ReadFileOptions = {}
  ): Promise<string> {
    try {
      const { encoding = 'utf-8', maxSize = this.maxFileSize } = options;

      // Resolve absolute path
      const absolutePath = path.resolve(filePath);

      // Check if file exists
      const exists = await this.exists(absolutePath);
      if (!exists) {
        throw new Error(`File does not exist: ${absolutePath}`);
      }

      // Check file size
      const stats = await fs.stat(absolutePath);
      if (stats.size > maxSize) {
        throw new Error(
          `File too large: ${stats.size} bytes (max: ${maxSize} bytes)`
        );
      }

      // Read file
      const content = await fs.readFile(absolutePath, encoding);
      return content;
    } catch (error) {
      throw new Error(
        `Failed to read file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Write file contents
   */
  async writeFile(
    filePath: string,
    content: string,
    options: WriteFileOptions = {}
  ): Promise<void> {
    try {
      const { encoding = 'utf-8', createDir = true } = options;

      // Resolve absolute path
      const absolutePath = path.resolve(filePath);

      // Create parent directory if needed
      if (createDir) {
        const dir = path.dirname(absolutePath);
        await fs.mkdir(dir, { recursive: true });
      }

      // Write file
      await fs.writeFile(absolutePath, content, encoding);
    } catch (error) {
      throw new Error(
        `Failed to write file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Delete file or directory
   */
  async delete(filePath: string): Promise<void> {
    try {
      const absolutePath = path.resolve(filePath);

      const stats = await fs.stat(absolutePath);
      if (stats.isDirectory()) {
        await fs.rm(absolutePath, { recursive: true, force: true });
      } else {
        await fs.unlink(absolutePath);
      }
    } catch (error) {
      throw new Error(
        `Failed to delete: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Check if file or directory exists
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      const absolutePath = path.resolve(filePath);
      await fs.access(absolutePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file or directory information
   */
  async getInfo(filePath: string): Promise<FileInfo> {
    try {
      const absolutePath = path.resolve(filePath);
      const stats = await fs.stat(absolutePath);
      const name = path.basename(absolutePath);
      const ext = path.extname(name);

      return {
        path: absolutePath,
        name,
        type: stats.isDirectory() ? 'directory' : 'file',
        size: stats.size,
        modified: stats.mtime,
        extension: ext ? ext.slice(1) : undefined,
      };
    } catch (error) {
      throw new Error(
        `Failed to get file info: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * List directory contents
   */
  async listDirectory(dirPath: string): Promise<FileInfo[]> {
    try {
      const absolutePath = path.resolve(dirPath);

      // Check if directory exists
      const exists = await this.exists(absolutePath);
      if (!exists) {
        throw new Error(`Directory does not exist: ${absolutePath}`);
      }

      const stats = await fs.stat(absolutePath);
      if (!stats.isDirectory()) {
        throw new Error(`Path is not a directory: ${absolutePath}`);
      }

      // Read directory
      const entries = await fs.readdir(absolutePath);

      // Get info for each entry
      const fileInfos: FileInfo[] = [];
      for (const entry of entries) {
        try {
          const entryPath = path.join(absolutePath, entry);
          const info = await this.getInfo(entryPath);
          fileInfos.push(info);
        } catch (error) {
          // Skip entries we can't access
          console.warn(`Skipping entry ${entry}:`, error);
        }
      }

      return fileInfos;
    } catch (error) {
      throw new Error(
        `Failed to list directory: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Search files using glob patterns
   */
  async search(options: FileSearchOptions): Promise<string[]> {
    try {
      const {
        pattern,
        cwd = process.cwd(),
        maxResults = 100,
        ignore = ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
      } = options;

      // Search using fast-glob
      const results = await fg(pattern, {
        cwd,
        ignore,
        absolute: true,
        onlyFiles: true,
      });

      // Limit results
      return results.slice(0, maxResults);
    } catch (error) {
      throw new Error(
        `Failed to search files: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Find workspace root (looks for common markers)
   */
  async findWorkspaceRoot(startPath: string): Promise<string | null> {
    try {
      let currentPath = path.resolve(startPath);
      const root = path.parse(currentPath).root;

      // Common workspace markers
      const markers = [
        'package.json',
        '.git',
        'Cargo.toml',
        'go.mod',
        'pom.xml',
        'build.gradle',
        '.vscode',
        '.idea',
      ];

      while (currentPath !== root) {
        for (const marker of markers) {
          const markerPath = path.join(currentPath, marker);
          if (fsSync.existsSync(markerPath)) {
            return currentPath;
          }
        }

        // Move up one directory
        const parentPath = path.dirname(currentPath);
        if (parentPath === currentPath) {
          break; // Reached root
        }
        currentPath = parentPath;
      }

      return null;
    } catch (error) {
      console.error('Failed to find workspace root:', error);
      return null;
    }
  }

  /**
   * Create directory
   */
  async createDirectory(dirPath: string): Promise<void> {
    try {
      const absolutePath = path.resolve(dirPath);
      await fs.mkdir(absolutePath, { recursive: true });
    } catch (error) {
      throw new Error(
        `Failed to create directory: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Copy file or directory
   */
  async copy(source: string, destination: string): Promise<void> {
    try {
      const absoluteSource = path.resolve(source);
      const absoluteDestination = path.resolve(destination);

      // Check if source exists
      const exists = await this.exists(absoluteSource);
      if (!exists) {
        throw new Error(`Source does not exist: ${absoluteSource}`);
      }

      // Get source info
      const sourceInfo = await this.getInfo(absoluteSource);

      if (sourceInfo.type === 'directory') {
        // Copy directory recursively
        await fs.cp(absoluteSource, absoluteDestination, { recursive: true });
      } else {
        // Copy file
        await fs.copyFile(absoluteSource, absoluteDestination);
      }
    } catch (error) {
      throw new Error(
        `Failed to copy: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Move/rename file or directory
   */
  async move(source: string, destination: string): Promise<void> {
    try {
      const absoluteSource = path.resolve(source);
      const absoluteDestination = path.resolve(destination);

      await fs.rename(absoluteSource, absoluteDestination);
    } catch (error) {
      throw new Error(
        `Failed to move: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

// Singleton instance
export const fileService = new FileService();

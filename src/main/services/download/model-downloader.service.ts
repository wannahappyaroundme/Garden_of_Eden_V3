/**
 * Model Downloader Service
 * Handles downloading AI models (~12GB) with progress tracking and resume capability
 */

import fs from 'fs/promises';
import { createWriteStream, existsSync } from 'fs';
import path from 'path';
import { app, BrowserWindow } from 'electron';
import log from 'electron-log';
import https from 'https';
import crypto from 'crypto';

export interface ModelInfo {
  id: string;
  name: string;
  filename: string;
  url: string;
  size: number; // bytes
  checksum: string; // SHA-256
  description: string;
}

export interface DownloadProgress {
  modelId: string;
  downloaded: number;
  total: number;
  percent: number;
  speed: number; // bytes per second
  eta: number; // seconds
  status: 'pending' | 'downloading' | 'completed' | 'error' | 'paused';
  error?: string;
}

export interface DownloadStatus {
  overall: {
    downloaded: number;
    total: number;
    percent: number;
    speed: number;
    eta: number;
  };
  models: Record<string, DownloadProgress>;
}

/**
 * Available AI models for download
 */
export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'llama-3.1-8b',
    name: 'Llama 3.1 8B',
    filename: 'llama-3.1-8b-instruct-q4_k_m.gguf',
    url: 'https://huggingface.co/lmstudio-community/Meta-Llama-3.1-8B-Instruct-GGUF/resolve/main/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf',
    size: 4_920_000_000, // ~4.92 GB
    checksum: '', // TODO: Add actual checksums
    description: 'Main conversational AI model',
  },
  {
    id: 'llava-7b',
    name: 'LLaVA 7B',
    filename: 'llava-v1.6-mistral-7b-q4_k_m.gguf',
    url: 'https://huggingface.co/cjpais/llava-v1.6-mistral-7b-gguf/resolve/main/llava-v1.6-mistral-7b.Q4_K_M.gguf',
    size: 4_370_000_000, // ~4.37 GB
    checksum: '',
    description: 'Vision model for screen understanding',
  },
  {
    id: 'whisper-large-v3',
    name: 'Whisper Large V3',
    filename: 'ggml-large-v3.bin',
    url: 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin',
    size: 3_090_000_000, // ~3.09 GB
    checksum: '',
    description: 'Speech-to-text model (Korean + English)',
  },
];

/**
 * Model Downloader Service
 */
export class ModelDownloaderService {
  private mainWindow: BrowserWindow | null = null;
  private modelsDir: string;
  private downloadStatus: DownloadStatus = {
    overall: {
      downloaded: 0,
      total: 0,
      percent: 0,
      speed: 0,
      eta: 0,
    },
    models: {},
  };
  private activeDownloads: Map<string, NodeJS.Timeout> = new Map();
  private abortControllers: Map<string, AbortController> = new Map();

  constructor() {
    this.modelsDir = path.join(app.getPath('userData'), 'models');
    this.initializeModelsDirectory();
  }

  /**
   * Initialize models directory
   */
  private async initializeModelsDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.modelsDir, { recursive: true });
      log.info('Models directory initialized:', this.modelsDir);
    } catch (error) {
      log.error('Failed to create models directory:', error);
      throw error;
    }
  }

  /**
   * Set main window reference
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  /**
   * Get available models
   */
  getAvailableModels(): ModelInfo[] {
    return AVAILABLE_MODELS;
  }

  /**
   * Get models directory path
   */
  getModelsDirectory(): string {
    return this.modelsDir;
  }

  /**
   * Check if a model is already downloaded
   */
  async isModelDownloaded(modelId: string): Promise<boolean> {
    const model = AVAILABLE_MODELS.find((m) => m.id === modelId);
    if (!model) {
      return false;
    }

    const modelPath = path.join(this.modelsDir, model.filename);

    try {
      const exists = existsSync(modelPath);
      if (!exists) {
        return false;
      }

      // Check file size
      const stats = await fs.stat(modelPath);
      const sizeMatch = Math.abs(stats.size - model.size) < 1_000_000; // Within 1MB tolerance

      // TODO: Verify checksum when checksums are added

      return sizeMatch;
    } catch {
      return false;
    }
  }

  /**
   * Get downloaded models
   */
  async getDownloadedModels(): Promise<string[]> {
    const downloaded: string[] = [];

    for (const model of AVAILABLE_MODELS) {
      if (await this.isModelDownloaded(model.id)) {
        downloaded.push(model.id);
      }
    }

    return downloaded;
  }

  /**
   * Download a single model
   */
  async downloadModel(modelId: string): Promise<void> {
    const model = AVAILABLE_MODELS.find((m) => m.id === modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    // Check if already downloaded
    if (await this.isModelDownloaded(modelId)) {
      log.info(`Model ${modelId} already downloaded`);
      return;
    }

    const modelPath = path.join(this.modelsDir, model.filename);
    const tempPath = `${modelPath}.download`;

    // Initialize progress
    this.downloadStatus.models[modelId] = {
      modelId,
      downloaded: 0,
      total: model.size,
      percent: 0,
      speed: 0,
      eta: 0,
      status: 'downloading',
    };

    log.info(`Starting download for ${model.name}...`);

    try {
      await this.downloadFile(model.url, tempPath, modelId);

      // Move temp file to final location
      await fs.rename(tempPath, modelPath);

      // Update status
      this.downloadStatus.models[modelId].status = 'completed';
      this.downloadStatus.models[modelId].percent = 100;
      this.sendProgressToRenderer();

      log.info(`Successfully downloaded ${model.name}`);
    } catch (error) {
      this.downloadStatus.models[modelId].status = 'error';
      this.downloadStatus.models[modelId].error = error instanceof Error ? error.message : 'Unknown error';
      this.sendProgressToRenderer();

      // Clean up temp file
      try {
        await fs.unlink(tempPath);
      } catch {}

      throw error;
    }
  }

  /**
   * Download all models
   */
  async downloadAllModels(): Promise<void> {
    log.info('Starting download for all models...');

    // Calculate total size
    this.downloadStatus.overall.total = AVAILABLE_MODELS.reduce((sum, model) => sum + model.size, 0);
    this.downloadStatus.overall.downloaded = 0;

    // Download models sequentially (to avoid bandwidth issues)
    for (const model of AVAILABLE_MODELS) {
      if (await this.isModelDownloaded(model.id)) {
        log.info(`Skipping ${model.name} (already downloaded)`);
        continue;
      }

      try {
        await this.downloadModel(model.id);
      } catch (error) {
        log.error(`Failed to download ${model.name}:`, error);
        throw error;
      }
    }

    log.info('All models downloaded successfully');
  }

  /**
   * Download a file with progress tracking
   */
  private async downloadFile(url: string, destPath: string, modelId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      let startTime = Date.now();
      let lastUpdate = Date.now();
      let lastBytes = 0;

      // Check if partial download exists
      let downloaded = 0;
      if (existsSync(destPath)) {
        const stats = require('fs').statSync(destPath);
        downloaded = stats.size;
        log.info(`Resuming download from ${downloaded} bytes`);
      }

      const options = {
        headers: downloaded > 0 ? { Range: `bytes=${downloaded}-` } : {},
      };

      const request = https.get(url, options, (response) => {
        if (response.statusCode === 416) {
          // Range not satisfiable - file already complete
          resolve();
          return;
        }

        if (response.statusCode !== 200 && response.statusCode !== 206) {
          reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
          return;
        }

        const totalSize = parseInt(response.headers['content-length'] || '0', 10) + downloaded;
        const writeStream = createWriteStream(destPath, { flags: 'a' });

        response.on('data', (chunk: Buffer) => {
          downloaded += chunk.length;

          // Update progress every 500ms
          const now = Date.now();
          if (now - lastUpdate > 500) {
            const elapsed = (now - startTime) / 1000; // seconds
            const speed = (downloaded - lastBytes) / ((now - lastUpdate) / 1000);
            const eta = speed > 0 ? (totalSize - downloaded) / speed : 0;

            this.downloadStatus.models[modelId].downloaded = downloaded;
            this.downloadStatus.models[modelId].total = totalSize;
            this.downloadStatus.models[modelId].percent = (downloaded / totalSize) * 100;
            this.downloadStatus.models[modelId].speed = speed;
            this.downloadStatus.models[modelId].eta = eta;

            // Update overall progress
            this.updateOverallProgress();
            this.sendProgressToRenderer();

            lastUpdate = now;
            lastBytes = downloaded;
          }
        });

        response.pipe(writeStream);

        writeStream.on('finish', () => {
          writeStream.close();
          resolve();
        });

        writeStream.on('error', (error) => {
          writeStream.close();
          reject(error);
        });
      });

      request.on('error', (error) => {
        reject(error);
      });

      // Store request for cancellation
      this.abortControllers.set(modelId, new AbortController());
    });
  }

  /**
   * Pause download
   */
  pauseDownload(modelId: string): void {
    const controller = this.abortControllers.get(modelId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(modelId);
    }

    if (this.downloadStatus.models[modelId]) {
      this.downloadStatus.models[modelId].status = 'paused';
      this.sendProgressToRenderer();
    }

    log.info(`Paused download for model: ${modelId}`);
  }

  /**
   * Resume download
   */
  async resumeDownload(modelId: string): Promise<void> {
    if (this.downloadStatus.models[modelId]?.status === 'paused') {
      this.downloadStatus.models[modelId].status = 'downloading';
      await this.downloadModel(modelId);
    }
  }

  /**
   * Cancel download
   */
  async cancelDownload(modelId: string): Promise<void> {
    this.pauseDownload(modelId);

    // Delete partial download
    const model = AVAILABLE_MODELS.find((m) => m.id === modelId);
    if (model) {
      const tempPath = path.join(this.modelsDir, model.filename + '.download');
      try {
        await fs.unlink(tempPath);
      } catch {
        // Ignore if file doesn't exist
      }
    }

    delete this.downloadStatus.models[modelId];
    this.sendProgressToRenderer();

    log.info(`Cancelled download for model: ${modelId}`);
  }

  /**
   * Delete a downloaded model
   */
  async deleteModel(modelId: string): Promise<void> {
    const model = AVAILABLE_MODELS.find((m) => m.id === modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    const modelPath = path.join(this.modelsDir, model.filename);

    try {
      await fs.unlink(modelPath);
      log.info(`Deleted model: ${modelId}`);
    } catch (error) {
      log.error(`Failed to delete model ${modelId}:`, error);
      throw error;
    }
  }

  /**
   * Get download status
   */
  getDownloadStatus(): DownloadStatus {
    return { ...this.downloadStatus };
  }

  /**
   * Update overall progress
   */
  private updateOverallProgress(): void {
    let totalDownloaded = 0;
    let totalSpeed = 0;

    for (const progress of Object.values(this.downloadStatus.models)) {
      totalDownloaded += progress.downloaded;
      totalSpeed += progress.speed;
    }

    this.downloadStatus.overall.downloaded = totalDownloaded;
    this.downloadStatus.overall.percent = this.downloadStatus.overall.total > 0
      ? (totalDownloaded / this.downloadStatus.overall.total) * 100
      : 0;
    this.downloadStatus.overall.speed = totalSpeed;
    this.downloadStatus.overall.eta = totalSpeed > 0
      ? (this.downloadStatus.overall.total - totalDownloaded) / totalSpeed
      : 0;
  }

  /**
   * Send progress to renderer process
   */
  private sendProgressToRenderer(): void {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('download:progress', this.downloadStatus);
    }
  }

  /**
   * Verify model checksum
   */
  private async verifyChecksum(filePath: string, expectedChecksum: string): Promise<boolean> {
    if (!expectedChecksum) {
      // Skip verification if no checksum provided
      return true;
    }

    try {
      const fileBuffer = await fs.readFile(filePath);
      const hash = crypto.createHash('sha256');
      hash.update(fileBuffer);
      const actualChecksum = hash.digest('hex');

      return actualChecksum === expectedChecksum;
    } catch (error) {
      log.error('Failed to verify checksum:', error);
      return false;
    }
  }

  /**
   * Get disk space information
   */
  async getDiskSpace(): Promise<{ available: number; required: number; sufficient: boolean }> {
    // TODO: Implement actual disk space check using platform-specific commands
    // For now, return mock data
    const required = AVAILABLE_MODELS.reduce((sum, model) => sum + model.size, 0);

    return {
      available: 50_000_000_000, // Mock: 50GB
      required,
      sufficient: true,
    };
  }
}

// Singleton instance
let modelDownloaderServiceInstance: ModelDownloaderService | null = null;

export function getModelDownloaderService(): ModelDownloaderService {
  if (!modelDownloaderServiceInstance) {
    modelDownloaderServiceInstance = new ModelDownloaderService();
  }
  return modelDownloaderServiceInstance;
}

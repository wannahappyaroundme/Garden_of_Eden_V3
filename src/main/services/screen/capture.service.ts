/**
 * Screen Capture Service
 * Handles screen capturing for vision AI analysis
 * Supports 3 context levels:
 * - Level 1: Current screen only (fast, low resource)
 * - Level 2: Recent work window (10 minutes of context)
 * - Level 3: Full project analysis (deep understanding)
 */

import * as path from 'path';
import * as fs from 'fs/promises';
// @ts-ignore - No type definitions available
import screenshot from 'screenshot-desktop';
import log from 'electron-log';

export type ContextLevel = 1 | 2 | 3;

export interface ScreenCaptureResult {
  imagePath: string;
  timestamp: number;
  contextLevel: ContextLevel;
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface CaptureHistory {
  captures: ScreenCaptureResult[];
  startTime: number;
  endTime: number;
}

/**
 * Screen Capture Service
 * Manages screen capture for AI vision analysis
 */
export class ScreenCaptureService {
  private captureDir: string;
  private captureHistory: ScreenCaptureResult[] = [];
  private maxHistorySize: number = 50; // Keep last 50 captures for Level 2/3

  constructor() {
    // Setup capture directory
    const homeDir = process.env.HOME || process.env.USERPROFILE || '.';
    this.captureDir = path.join(homeDir, '.garden-of-eden-v3', 'captures');
  }

  /**
   * Initialize capture service
   */
  async initialize(): Promise<void> {
    try {
      // Create capture directory
      await fs.mkdir(this.captureDir, { recursive: true });
      log.info('Screen capture service initialized', { path: this.captureDir });
    } catch (error) {
      log.error('Failed to initialize screen capture service:', error);
      throw error;
    }
  }

  /**
   * Capture screen with specified context level
   */
  async captureScreen(contextLevel: ContextLevel = 1): Promise<ScreenCaptureResult> {
    try {
      log.info('Capturing screen', { contextLevel });

      // Generate unique filename
      const timestamp = Date.now();
      const filename = `capture-${timestamp}-level${contextLevel}.png`;
      const imagePath = path.join(this.captureDir, filename);

      // Capture screenshot
      const imageBuffer = await screenshot({ format: 'png' });

      // Save to file
      await fs.writeFile(imagePath, imageBuffer);

      const result: ScreenCaptureResult = {
        imagePath,
        timestamp,
        contextLevel,
      };

      // Add to history
      this.captureHistory.push(result);

      // Trim history if too long
      if (this.captureHistory.length > this.maxHistorySize) {
        const removed = this.captureHistory.shift();
        // Delete old capture file
        if (removed) {
          try {
            await fs.unlink(removed.imagePath);
          } catch (error) {
            log.warn('Failed to delete old capture:', removed.imagePath);
          }
        }
      }

      log.info('Screen captured successfully', {
        path: imagePath,
        size: imageBuffer.length
      });

      return result;
    } catch (error) {
      log.error('Failed to capture screen:', error);
      throw error;
    }
  }

  /**
   * Get recent captures for Level 2 context (last 10 minutes)
   */
  async getRecentContext(durationMinutes: number = 10): Promise<CaptureHistory> {
    const now = Date.now();
    const cutoff = now - durationMinutes * 60 * 1000;

    const recentCaptures = this.captureHistory.filter(
      capture => capture.timestamp >= cutoff
    );

    return {
      captures: recentCaptures,
      startTime: recentCaptures.length > 0 ? recentCaptures[0].timestamp : now,
      endTime: now,
    };
  }

  /**
   * Get full capture history for Level 3 context
   */
  async getFullContext(): Promise<CaptureHistory> {
    return {
      captures: [...this.captureHistory],
      startTime: this.captureHistory.length > 0 ? this.captureHistory[0].timestamp : Date.now(),
      endTime: Date.now(),
    };
  }

  /**
   * Capture multiple screens (for multi-monitor setups)
   */
  async captureAllScreens(contextLevel: ContextLevel = 1): Promise<ScreenCaptureResult[]> {
    try {
      log.info('Capturing all screens', { contextLevel });

      // screenshot-desktop can capture all screens
      const screens = await screenshot.listDisplays();
      const results: ScreenCaptureResult[] = [];

      for (let i = 0; i < screens.length; i++) {
        const timestamp = Date.now();
        const filename = `capture-${timestamp}-screen${i}-level${contextLevel}.png`;
        const imagePath = path.join(this.captureDir, filename);

        // Capture specific screen
        const imageBuffer = await screenshot({ screen: screens[i].id, format: 'png' });

        // Save to file
        await fs.writeFile(imagePath, imageBuffer);

        const result: ScreenCaptureResult = {
          imagePath,
          timestamp,
          contextLevel,
        };

        results.push(result);
        this.captureHistory.push(result);
      }

      log.info('All screens captured', { count: results.length });

      return results;
    } catch (error) {
      log.error('Failed to capture all screens:', error);
      // Fallback to single screen capture
      const result = await this.captureScreen(contextLevel);
      return [result];
    }
  }

  /**
   * Start automatic screen capture (for Level 2/3 context building)
   * Captures screen every N seconds
   */
  startAutomaticCapture(intervalSeconds: number = 30): NodeJS.Timeout {
    log.info('Starting automatic screen capture', { intervalSeconds });

    const timer = setInterval(async () => {
      try {
        await this.captureScreen(2); // Level 2 for automatic captures
      } catch (error) {
        log.error('Automatic capture failed:', error);
      }
    }, intervalSeconds * 1000);

    return timer;
  }

  /**
   * Stop automatic screen capture
   */
  stopAutomaticCapture(timer: NodeJS.Timeout): void {
    clearInterval(timer);
    log.info('Stopped automatic screen capture');
  }

  /**
   * Clear capture history and delete files
   */
  async clearHistory(): Promise<void> {
    log.info('Clearing capture history', { count: this.captureHistory.length });

    // Delete all capture files
    for (const capture of this.captureHistory) {
      try {
        await fs.unlink(capture.imagePath);
      } catch (error) {
        log.warn('Failed to delete capture file:', capture.imagePath);
      }
    }

    this.captureHistory = [];
    log.info('Capture history cleared');
  }

  /**
   * Clean up old captures (older than N hours)
   */
  async cleanupOldCaptures(hoursOld: number = 24): Promise<void> {
    const cutoff = Date.now() - hoursOld * 60 * 60 * 1000;
    let removed = 0;

    for (let i = this.captureHistory.length - 1; i >= 0; i--) {
      const capture = this.captureHistory[i];
      if (capture.timestamp < cutoff) {
        try {
          await fs.unlink(capture.imagePath);
          this.captureHistory.splice(i, 1);
          removed++;
        } catch (error) {
          log.warn('Failed to delete old capture:', capture.imagePath);
        }
      }
    }

    log.info('Cleaned up old captures', { removed, cutoff: new Date(cutoff).toISOString() });
  }

  /**
   * Get capture history
   */
  getHistory(): ScreenCaptureResult[] {
    return [...this.captureHistory];
  }

  /**
   * Shutdown and cleanup
   */
  async shutdown(): Promise<void> {
    log.info('Shutting down screen capture service');
    // Optionally clear all captures on shutdown
    // await this.clearHistory();
  }
}

// Singleton instance
let screenCaptureServiceInstance: ScreenCaptureService | null = null;

export function getScreenCaptureService(): ScreenCaptureService {
  if (!screenCaptureServiceInstance) {
    screenCaptureServiceInstance = new ScreenCaptureService();
  }
  return screenCaptureServiceInstance;
}

export async function cleanupScreenCaptureService(): Promise<void> {
  if (screenCaptureServiceInstance) {
    await screenCaptureServiceInstance.shutdown();
    screenCaptureServiceInstance = null;
  }
}

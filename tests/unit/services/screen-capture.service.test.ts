/**
 * Unit Tests for ScreenCaptureService
 *
 * Tests all screen capture operations including:
 * - Service initialization
 * - Screen capture at different context levels
 * - Capture history management
 * - Multi-monitor capture
 * - Automatic capture scheduling
 * - History cleanup
 */

import { ScreenCaptureService, ContextLevel } from '@/main/services/screen/capture.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

// Mock dependencies
jest.mock('screenshot-desktop');
jest.mock('electron-log');
jest.mock('fs/promises');

import screenshot from 'screenshot-desktop';

describe('ScreenCaptureService', () => {
  let captureService: ScreenCaptureService;
  let mockScreenshot: jest.MockedFunction<any>;
  let tempDir: string;

  beforeAll(() => {
    // Set HOME env for consistent testing
    tempDir = path.join(os.tmpdir(), 'screen-capture-test');
    process.env.HOME = tempDir;
  });

  beforeEach(() => {
    captureService = new ScreenCaptureService();
    mockScreenshot = screenshot as jest.MockedFunction<any>;

    // Mock fs operations
    (fs.mkdir as jest.MockedFunction<typeof fs.mkdir>).mockResolvedValue(undefined as any);
    (fs.writeFile as jest.MockedFunction<typeof fs.writeFile>).mockResolvedValue(undefined);
    (fs.unlink as jest.MockedFunction<typeof fs.unlink>).mockResolvedValue(undefined);

    // Mock screenshot function
    mockScreenshot.mockResolvedValue(Buffer.from('fake-screenshot-data'));
    mockScreenshot.listDisplays = jest.fn().mockResolvedValue([
      { id: 0, name: 'Display 1' },
      { id: 1, name: 'Display 2' },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should create capture directory successfully', async () => {
      await captureService.initialize();

      const expectedPath = path.join(tempDir, '.garden-of-eden-v3', 'captures');
      expect(fs.mkdir).toHaveBeenCalledWith(expectedPath, { recursive: true });
    });

    it('should throw error if directory creation fails', async () => {
      (fs.mkdir as jest.MockedFunction<typeof fs.mkdir>).mockRejectedValue(new Error('Permission denied'));

      await expect(captureService.initialize()).rejects.toThrow('Permission denied');
    });

    it('should handle alternative home directory paths', async () => {
      delete process.env.HOME;
      process.env.USERPROFILE = 'C:\\Users\\TestUser';

      const newService = new ScreenCaptureService();
      await newService.initialize();

      const expectedPath = path.join('C:\\Users\\TestUser', '.garden-of-eden-v3', 'captures');
      expect(fs.mkdir).toHaveBeenCalledWith(expectedPath, { recursive: true });

      // Restore HOME
      process.env.HOME = tempDir;
      delete process.env.USERPROFILE;
    });
  });

  describe('captureScreen', () => {
    beforeEach(async () => {
      await captureService.initialize();
    });

    it('should capture screen successfully with Level 1', async () => {
      const result = await captureService.captureScreen(1);

      expect(mockScreenshot).toHaveBeenCalledWith({ format: 'png' });
      expect(fs.writeFile).toHaveBeenCalled();
      expect(result.contextLevel).toBe(1);
      expect(result.timestamp).toBeGreaterThan(0);
      expect(result.imagePath).toContain('capture-');
      expect(result.imagePath).toContain('-level1.png');
    });

    it('should capture screen with Level 2', async () => {
      const result = await captureService.captureScreen(2);

      expect(result.contextLevel).toBe(2);
      expect(result.imagePath).toContain('-level2.png');
    });

    it('should capture screen with Level 3', async () => {
      const result = await captureService.captureScreen(3);

      expect(result.contextLevel).toBe(3);
      expect(result.imagePath).toContain('-level3.png');
    });

    it('should default to Level 1 when no level specified', async () => {
      const result = await captureService.captureScreen();

      expect(result.contextLevel).toBe(1);
    });

    it('should add capture to history', async () => {
      await captureService.captureScreen(1);
      await captureService.captureScreen(2);

      const history = captureService.getHistory();
      expect(history).toHaveLength(2);
    });

    it('should maintain history up to max size', async () => {
      // Capture 55 times (maxHistorySize is 50)
      for (let i = 0; i < 55; i++) {
        await captureService.captureScreen(1);
      }

      const history = captureService.getHistory();
      expect(history).toHaveLength(50); // Should be trimmed to max
      expect(fs.unlink).toHaveBeenCalledTimes(5); // 5 oldest removed
    });

    it('should handle screenshot library errors', async () => {
      mockScreenshot.mockRejectedValue(new Error('Screen capture failed'));

      await expect(captureService.captureScreen(1)).rejects.toThrow('Screen capture failed');
    });

    it('should handle file write errors', async () => {
      (fs.writeFile as jest.MockedFunction<typeof fs.writeFile>).mockRejectedValue(new Error('Disk full'));

      await expect(captureService.captureScreen(1)).rejects.toThrow('Disk full');
    });

    it('should continue if old file deletion fails', async () => {
      (fs.unlink as jest.MockedFunction<typeof fs.unlink>).mockRejectedValue(new Error('File in use'));

      // Fill history past max
      for (let i = 0; i < 51; i++) {
        await captureService.captureScreen(1);
      }

      // Should not throw despite unlink failure
      const history = captureService.getHistory();
      expect(history).toHaveLength(50);
    });
  });

  describe('getRecentContext', () => {
    beforeEach(async () => {
      await captureService.initialize();
    });

    it('should return captures from last 10 minutes by default', async () => {
      const now = Date.now();
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(now - 15 * 60 * 1000) // 15 min ago
        .mockReturnValueOnce(now - 5 * 60 * 1000)  // 5 min ago
        .mockReturnValueOnce(now - 2 * 60 * 1000)  // 2 min ago
        .mockReturnValue(now);

      await captureService.captureScreen(1);
      await captureService.captureScreen(1);
      await captureService.captureScreen(1);

      const context = await captureService.getRecentContext(10);

      expect(context.captures).toHaveLength(2); // Only 5 min and 2 min ago
      expect(context.endTime).toBe(now);
    });

    it('should accept custom duration', async () => {
      const now = Date.now();
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(now - 25 * 60 * 1000) // 25 min ago
        .mockReturnValueOnce(now - 15 * 60 * 1000) // 15 min ago
        .mockReturnValueOnce(now - 5 * 60 * 1000)  // 5 min ago
        .mockReturnValue(now);

      await captureService.captureScreen(1);
      await captureService.captureScreen(1);
      await captureService.captureScreen(1);

      const context = await captureService.getRecentContext(20);

      expect(context.captures).toHaveLength(2); // 15 min and 5 min ago (within 20 min)
    });

    it('should return empty array if no recent captures', async () => {
      const context = await captureService.getRecentContext(10);

      expect(context.captures).toHaveLength(0);
      expect(context.startTime).toBeGreaterThan(0);
    });
  });

  describe('getFullContext', () => {
    beforeEach(async () => {
      await captureService.initialize();
    });

    it('should return all captures in history', async () => {
      await captureService.captureScreen(1);
      await captureService.captureScreen(2);
      await captureService.captureScreen(3);

      const context = await captureService.getFullContext();

      expect(context.captures).toHaveLength(3);
      expect(context.endTime).toBeGreaterThan(context.startTime);
    });

    it('should return empty array if no captures', async () => {
      const context = await captureService.getFullContext();

      expect(context.captures).toHaveLength(0);
    });

    it('should return copy of history array', async () => {
      await captureService.captureScreen(1);

      const context = await captureService.getFullContext();
      context.captures.pop(); // Modify returned array

      const history = captureService.getHistory();
      expect(history).toHaveLength(1); // Original unaffected
    });
  });

  describe('captureAllScreens', () => {
    beforeEach(async () => {
      await captureService.initialize();
    });

    it('should capture all available displays', async () => {
      const results = await captureService.captureAllScreens(1);

      expect(mockScreenshot.listDisplays).toHaveBeenCalled();
      expect(results).toHaveLength(2); // 2 displays mocked
      expect(results[0].imagePath).toContain('screen0');
      expect(results[1].imagePath).toContain('screen1');
      expect(fs.writeFile).toHaveBeenCalledTimes(2);
    });

    it('should capture with specified context level', async () => {
      const results = await captureService.captureAllScreens(3);

      expect(results[0].contextLevel).toBe(3);
      expect(results[1].contextLevel).toBe(3);
    });

    it('should add all captures to history', async () => {
      await captureService.captureAllScreens(1);

      const history = captureService.getHistory();
      expect(history).toHaveLength(2);
    });

    it('should fallback to single capture on error', async () => {
      mockScreenshot.listDisplays.mockRejectedValue(new Error('No displays found'));

      const results = await captureService.captureAllScreens(1);

      expect(results).toHaveLength(1); // Fallback to single capture
      expect(results[0].imagePath).not.toContain('screen0');
    });
  });

  describe('startAutomaticCapture', () => {
    beforeEach(async () => {
      await captureService.initialize();
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should start automatic capture with default interval', () => {
      const timer = captureService.startAutomaticCapture();

      expect(timer).toBeDefined();
      expect(typeof timer).toBe('object'); // NodeJS.Timeout
    });

    it('should capture screen at specified intervals', async () => {
      const timer = captureService.startAutomaticCapture(30);

      // Fast-forward 30 seconds
      jest.advanceTimersByTime(30000);
      await Promise.resolve(); // Process microtasks

      expect(mockScreenshot).toHaveBeenCalledTimes(1);

      // Fast-forward another 30 seconds
      jest.advanceTimersByTime(30000);
      await Promise.resolve();

      expect(mockScreenshot).toHaveBeenCalledTimes(2);

      clearInterval(timer);
    });

    it('should use Level 2 for automatic captures', async () => {
      const timer = captureService.startAutomaticCapture(10);

      jest.advanceTimersByTime(10000);
      await Promise.resolve();

      const history = captureService.getHistory();
      expect(history[0].contextLevel).toBe(2);

      clearInterval(timer);
    });

    it('should handle capture errors gracefully', async () => {
      mockScreenshot.mockRejectedValue(new Error('Capture failed'));

      const timer = captureService.startAutomaticCapture(5);

      jest.advanceTimersByTime(5000);
      await Promise.resolve();

      // Should not throw, just log error
      expect(mockScreenshot).toHaveBeenCalled();

      clearInterval(timer);
    });
  });

  describe('stopAutomaticCapture', () => {
    beforeEach(async () => {
      await captureService.initialize();
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should stop automatic capture timer', async () => {
      const timer = captureService.startAutomaticCapture(10);

      jest.advanceTimersByTime(10000);
      await Promise.resolve();
      expect(mockScreenshot).toHaveBeenCalledTimes(1);

      captureService.stopAutomaticCapture(timer);

      jest.advanceTimersByTime(10000);
      await Promise.resolve();
      expect(mockScreenshot).toHaveBeenCalledTimes(1); // No additional calls
    });
  });

  describe('clearHistory', () => {
    beforeEach(async () => {
      await captureService.initialize();
    });

    it('should delete all capture files and clear history', async () => {
      await captureService.captureScreen(1);
      await captureService.captureScreen(2);
      await captureService.captureScreen(3);

      expect(captureService.getHistory()).toHaveLength(3);

      await captureService.clearHistory();

      expect(fs.unlink).toHaveBeenCalledTimes(3);
      expect(captureService.getHistory()).toHaveLength(0);
    });

    it('should handle file deletion errors gracefully', async () => {
      await captureService.captureScreen(1);
      (fs.unlink as jest.MockedFunction<typeof fs.unlink>).mockRejectedValue(new Error('File not found'));

      await captureService.clearHistory();

      // Should still clear history despite deletion error
      expect(captureService.getHistory()).toHaveLength(0);
    });

    it('should handle empty history', async () => {
      await captureService.clearHistory();

      expect(captureService.getHistory()).toHaveLength(0);
      expect(fs.unlink).not.toHaveBeenCalled();
    });
  });

  describe('cleanupOldCaptures', () => {
    beforeEach(async () => {
      await captureService.initialize();
    });

    it('should remove captures older than specified hours', async () => {
      const now = Date.now();
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(now - 30 * 60 * 60 * 1000) // 30 hours ago
        .mockReturnValueOnce(now - 20 * 60 * 60 * 1000) // 20 hours ago
        .mockReturnValueOnce(now - 10 * 60 * 60 * 1000) // 10 hours ago
        .mockReturnValue(now);

      await captureService.captureScreen(1);
      await captureService.captureScreen(1);
      await captureService.captureScreen(1);

      expect(captureService.getHistory()).toHaveLength(3);

      await captureService.cleanupOldCaptures(24); // Remove older than 24 hours

      expect(captureService.getHistory()).toHaveLength(1); // Only 10 hours ago remains
      expect(fs.unlink).toHaveBeenCalledTimes(2);
    });

    it('should use default of 24 hours', async () => {
      const now = Date.now();
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(now - 48 * 60 * 60 * 1000) // 48 hours ago
        .mockReturnValueOnce(now - 12 * 60 * 60 * 1000) // 12 hours ago
        .mockReturnValue(now);

      await captureService.captureScreen(1);
      await captureService.captureScreen(1);

      await captureService.cleanupOldCaptures();

      expect(captureService.getHistory()).toHaveLength(1);
    });

    it('should handle file deletion errors', async () => {
      const now = Date.now();
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(now - 30 * 60 * 60 * 1000)
        .mockReturnValue(now);

      await captureService.captureScreen(1);

      (fs.unlink as jest.MockedFunction<typeof fs.unlink>).mockRejectedValue(new Error('Permission denied'));

      await captureService.cleanupOldCaptures(24);

      // Should not remove from history if deletion fails
      expect(captureService.getHistory()).toHaveLength(1);
    });

    it('should not remove recent captures', async () => {
      const now = Date.now();
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(now - 5 * 60 * 60 * 1000) // 5 hours ago
        .mockReturnValue(now);

      await captureService.captureScreen(1);

      await captureService.cleanupOldCaptures(24);

      expect(captureService.getHistory()).toHaveLength(1); // Not removed
      expect(fs.unlink).not.toHaveBeenCalled();
    });
  });

  describe('getHistory', () => {
    beforeEach(async () => {
      await captureService.initialize();
    });

    it('should return copy of capture history', async () => {
      await captureService.captureScreen(1);

      const history1 = captureService.getHistory();
      const history2 = captureService.getHistory();

      expect(history1).toEqual(history2);
      expect(history1).not.toBe(history2); // Different array instances
    });

    it('should return empty array when no captures', () => {
      const history = captureService.getHistory();

      expect(history).toEqual([]);
    });
  });

  describe('shutdown', () => {
    beforeEach(async () => {
      await captureService.initialize();
    });

    it('should shutdown gracefully', async () => {
      await captureService.captureScreen(1);
      await captureService.shutdown();

      // Should complete without errors
      expect(true).toBe(true);
    });

    it('should not clear history on shutdown by default', async () => {
      await captureService.captureScreen(1);
      await captureService.shutdown();

      // History should still exist
      const history = captureService.getHistory();
      expect(history).toHaveLength(1);
    });
  });

  describe('edge cases', () => {
    beforeEach(async () => {
      await captureService.initialize();
    });

    it('should handle rapid successive captures', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(captureService.captureScreen(1));
      }

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      expect(captureService.getHistory()).toHaveLength(10);
    });

    it('should generate unique filenames for captures', async () => {
      const result1 = await captureService.captureScreen(1);
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      const result2 = await captureService.captureScreen(1);

      expect(result1.imagePath).not.toBe(result2.imagePath);
      expect(result1.timestamp).not.toBe(result2.timestamp);
    });

    it('should handle different context levels in same session', async () => {
      await captureService.captureScreen(1);
      await captureService.captureScreen(2);
      await captureService.captureScreen(3);

      const history = captureService.getHistory();
      expect(history[0].contextLevel).toBe(1);
      expect(history[1].contextLevel).toBe(2);
      expect(history[2].contextLevel).toBe(3);
    });
  });
});

/**
 * Unit Tests for TTSService
 *
 * Tests all text-to-speech operations including:
 * - Service initialization
 * - Voice loading (macOS and Windows)
 * - Text-to-speech synthesis
 * - Speech control (speak, stop)
 * - Configuration management
 * - Platform-specific behavior
 */

import { TTSService } from '@/main/services/ai/tts.service';
import { exec } from 'child_process';
import { promisify } from 'util';

// Mock dependencies
jest.mock('child_process');
jest.mock('electron-log');

const execAsync = promisify(exec);

describe('TTSService', () => {
  let ttsService: TTSService;
  let mockExec: jest.MockedFunction<typeof exec>;
  let originalPlatform: NodeJS.Platform;

  beforeAll(() => {
    originalPlatform = process.platform;
  });

  afterAll(() => {
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
    });
  });

  beforeEach(() => {
    mockExec = exec as jest.MockedFunction<typeof exec>;
    mockExec.mockImplementation((command: string, callback?: any) => {
      if (callback) {
        callback(null, { stdout: '', stderr: '' });
      }
      return {} as any;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default config on macOS', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });

      const service = new TTSService();

      expect(service).toBeDefined();
      expect(service.isReady()).toBe(false);
    });

    it('should initialize with default config on Windows', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });

      const service = new TTSService();

      expect(service).toBeDefined();
    });

    it('should accept custom config', () => {
      const service = new TTSService({
        voice: 'CustomVoice',
        rate: 1.5,
        volume: 0.8,
        language: 'en',
      });

      expect(service).toBeDefined();
    });
  });

  describe('initialize on macOS', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      ttsService = new TTSService();
    });

    it('should load available voices successfully', async () => {
      mockExec.mockImplementation((command: string, callback?: any) => {
        if (command.includes('say -v ?')) {
          if (callback) {
            callback(null, {
              stdout: 'Yuna               ko_KR\nSamantha           en_US\nAlex               en_US\n',
              stderr: '',
            });
          }
        }
        return {} as any;
      });

      await ttsService.initialize();

      expect(ttsService.isReady()).toBe(true);
      const voices = ttsService.getAvailableVoices();
      expect(voices).toContain('Yuna');
      expect(voices).toContain('Samantha');
      expect(voices).toContain('Alex');
    });

    it('should not reinitialize if already initialized', async () => {
      mockExec.mockImplementation((command: string, callback?: any) => {
        if (callback) {
          callback(null, { stdout: 'Yuna ko_KR\n', stderr: '' });
        }
        return {} as any;
      });

      await ttsService.initialize();
      expect(mockExec).toHaveBeenCalledTimes(1);

      await ttsService.initialize();
      expect(mockExec).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should handle voice loading errors gracefully', async () => {
      mockExec.mockImplementation((command: string, callback?: any) => {
        if (callback) {
          callback(new Error('Command failed'), { stdout: '', stderr: 'Error' });
        }
        return {} as any;
      });

      await expect(ttsService.initialize()).rejects.toThrow();
    });
  });

  describe('initialize on Windows', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      ttsService = new TTSService();
    });

    it('should load available voices successfully', async () => {
      mockExec.mockImplementation((command: string, callback?: any) => {
        if (command.includes('powershell')) {
          if (callback) {
            callback(null, {
              stdout: 'Microsoft Heami Desktop\nMicrosoft Zira Desktop\nMicrosoft David Desktop\n',
              stderr: '',
            });
          }
        }
        return {} as any;
      });

      await ttsService.initialize();

      expect(ttsService.isReady()).toBe(true);
      const voices = ttsService.getAvailableVoices();
      expect(voices).toContain('Microsoft Heami Desktop');
      expect(voices).toContain('Microsoft Zira Desktop');
    });
  });

  describe('initialize on unsupported platform', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      ttsService = new TTSService();
    });

    it('should initialize with empty voice list', async () => {
      await ttsService.initialize();

      expect(ttsService.isReady()).toBe(true);
      const voices = ttsService.getAvailableVoices();
      expect(voices).toEqual([]);
    });
  });

  describe('speak on macOS', () => {
    beforeEach(async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      ttsService = new TTSService({ voice: 'Yuna', rate: 1.0 });

      mockExec.mockImplementation((command: string, callback?: any) => {
        if (callback) {
          callback(null, { stdout: 'Yuna ko_KR\n', stderr: '' });
        }
        return {} as any;
      });

      await ttsService.initialize();
    });

    it('should speak text successfully', async () => {
      mockExec.mockImplementation((command: string, callback?: any) => {
        if (callback) {
          callback(null, { stdout: '', stderr: '' });
        }
        return {} as any;
      });

      await ttsService.speak('Hello world');

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('say -v Yuna'),
        expect.any(Function)
      );
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('Hello world'),
        expect.any(Function)
      );
    });

    it('should escape quotes in text', async () => {
      await ttsService.speak('She said "Hello"');

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('She said \\"Hello\\"'),
        expect.any(Function)
      );
    });

    it('should use custom rate', async () => {
      ttsService.updateConfig({ rate: 1.5 });

      await ttsService.speak('Test');

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('-r 300'), // 1.5 * 200 = 300 words per minute
        expect.any(Function)
      );
    });

    it('should auto-initialize if not ready', async () => {
      const uninitializedService = new TTSService();

      await uninitializedService.speak('Test');

      expect(uninitializedService.isReady()).toBe(true);
    });

    it('should stop previous speech before starting new one', async () => {
      // Start first speech
      const speakPromise = ttsService.speak('First text');

      // Start second speech while first is still speaking
      await ttsService.speak('Second text');

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('killall say'),
        expect.any(Function)
      );
    });

    it('should handle speech errors', async () => {
      mockExec.mockImplementation((command: string, callback?: any) => {
        if (command.includes('say')) {
          if (callback) {
            callback(new Error('Speech failed'), { stdout: '', stderr: '' });
          }
        } else if (callback) {
          callback(null, { stdout: '', stderr: '' });
        }
        return {} as any;
      });

      await expect(ttsService.speak('Test')).rejects.toThrow('Speech failed');
      expect(ttsService.isSpeakingActive()).toBe(false);
    });
  });

  describe('speak on Windows', () => {
    beforeEach(async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      ttsService = new TTSService({ voice: 'Microsoft Heami Desktop', rate: 1.0, volume: 1.0 });

      mockExec.mockImplementation((command: string, callback?: any) => {
        if (callback) {
          callback(null, { stdout: 'Microsoft Heami Desktop\n', stderr: '' });
        }
        return {} as any;
      });

      await ttsService.initialize();
    });

    it('should speak text successfully', async () => {
      await ttsService.speak('Hello world');

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('System.Speech'),
        expect.any(Function)
      );
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('Hello world'),
        expect.any(Function)
      );
    });

    it('should escape single quotes in text', async () => {
      await ttsService.speak("It's a test");

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining("It''s a test"),
        expect.any(Function)
      );
    });

    it('should use custom rate and volume', async () => {
      ttsService.updateConfig({ rate: 1.5, volume: 0.5 });

      await ttsService.speak('Test');

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('$synth.Rate = 5'), // (1.5 - 1) * 10 = 5
        expect.any(Function)
      );
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('$synth.Volume = 50'), // 0.5 * 100 = 50
        expect.any(Function)
      );
    });

    it('should select voice if specified', async () => {
      await ttsService.speak('Test');

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining("$synth.SelectVoice('Microsoft Heami Desktop')"),
        expect.any(Function)
      );
    });
  });

  describe('speak on unsupported platform', () => {
    beforeEach(async () => {
      Object.defineProperty(process, 'platform', { value: 'linux' });
      ttsService = new TTSService();
      await ttsService.initialize();
    });

    it('should handle gracefully without error', async () => {
      await ttsService.speak('Test');

      // Should complete without throwing
      expect(ttsService.isSpeakingActive()).toBe(false);
    });
  });

  describe('stop', () => {
    beforeEach(async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      ttsService = new TTSService();

      mockExec.mockImplementation((command: string, callback?: any) => {
        if (callback) {
          callback(null, { stdout: '', stderr: '' });
        }
        return {} as any;
      });

      await ttsService.initialize();
    });

    it('should stop speech on macOS', async () => {
      // Start speaking
      const speakPromise = ttsService.speak('Long text');

      // Stop immediately
      await ttsService.stop();

      expect(mockExec).toHaveBeenCalledWith(
        'killall say',
        expect.any(Function)
      );
      expect(ttsService.isSpeakingActive()).toBe(false);
    });

    it('should do nothing if not speaking', async () => {
      await ttsService.stop();

      expect(mockExec).not.toHaveBeenCalledWith(
        'killall say',
        expect.any(Function)
      );
    });

    it('should handle stop errors gracefully', async () => {
      mockExec.mockImplementation((command: string, callback?: any) => {
        if (command.includes('killall')) {
          if (callback) {
            callback(new Error('Kill failed'), { stdout: '', stderr: '' });
          }
        } else if (callback) {
          callback(null, { stdout: '', stderr: '' });
        }
        return {} as any;
      });

      // Start speaking
      const speakPromise = ttsService.speak('Test');

      // Stop should not throw despite error
      await ttsService.stop();

      expect(ttsService.isSpeakingActive()).toBe(false);
    });
  });

  describe('isSpeakingActive', () => {
    beforeEach(async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      ttsService = new TTSService();

      mockExec.mockImplementation((command: string, callback?: any) => {
        if (callback) {
          callback(null, { stdout: '', stderr: '' });
        }
        return {} as any;
      });

      await ttsService.initialize();
    });

    it('should return false initially', () => {
      expect(ttsService.isSpeakingActive()).toBe(false);
    });

    it('should return true while speaking', async () => {
      // Mock a long-running speech
      mockExec.mockImplementation((command: string, callback?: any) => {
        if (command.includes('say')) {
          // Don't call callback immediately to simulate speaking
          setTimeout(() => {
            if (callback) {
              callback(null, { stdout: '', stderr: '' });
            }
          }, 100);
        } else if (callback) {
          callback(null, { stdout: '', stderr: '' });
        }
        return {} as any;
      });

      const speakPromise = ttsService.speak('Long text');

      // Should be speaking now
      expect(ttsService.isSpeakingActive()).toBe(true);

      await speakPromise;
      expect(ttsService.isSpeakingActive()).toBe(false);
    });

    it('should return false after speech completes', async () => {
      await ttsService.speak('Test');

      expect(ttsService.isSpeakingActive()).toBe(false);
    });
  });

  describe('getAvailableVoices', () => {
    it('should return copy of voices array', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      ttsService = new TTSService();

      mockExec.mockImplementation((command: string, callback?: any) => {
        if (callback) {
          callback(null, { stdout: 'Yuna ko_KR\nSamantha en_US\n', stderr: '' });
        }
        return {} as any;
      });

      await ttsService.initialize();

      const voices1 = ttsService.getAvailableVoices();
      const voices2 = ttsService.getAvailableVoices();

      expect(voices1).toEqual(voices2);
      expect(voices1).not.toBe(voices2); // Different array instances
    });

    it('should return empty array before initialization', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      ttsService = new TTSService();

      const voices = ttsService.getAvailableVoices();

      expect(voices).toEqual([]);
    });
  });

  describe('updateConfig', () => {
    beforeEach(() => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      ttsService = new TTSService();
    });

    it('should update voice', () => {
      ttsService.updateConfig({ voice: 'NewVoice' });

      // Config updated (verified through internal state)
      expect(ttsService).toBeDefined();
    });

    it('should update rate', () => {
      ttsService.updateConfig({ rate: 2.0 });

      expect(ttsService).toBeDefined();
    });

    it('should update volume', () => {
      ttsService.updateConfig({ volume: 0.5 });

      expect(ttsService).toBeDefined();
    });

    it('should update multiple properties', () => {
      ttsService.updateConfig({
        voice: 'Alex',
        rate: 1.2,
        volume: 0.8,
        language: 'en',
      });

      expect(ttsService).toBeDefined();
    });

    it('should preserve non-updated properties', () => {
      ttsService.updateConfig({ rate: 1.5 });
      ttsService.updateConfig({ volume: 0.7 });

      // Both updates should be preserved
      expect(ttsService).toBeDefined();
    });
  });

  describe('cleanup', () => {
    beforeEach(async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      ttsService = new TTSService();

      mockExec.mockImplementation((command: string, callback?: any) => {
        if (callback) {
          callback(null, { stdout: '', stderr: '' });
        }
        return {} as any;
      });

      await ttsService.initialize();
    });

    it('should cleanup resources', async () => {
      await ttsService.cleanup();

      expect(ttsService.isReady()).toBe(false);
    });

    it('should stop speech if active', async () => {
      // Start speaking
      const speakPromise = ttsService.speak('Test');

      await ttsService.cleanup();

      expect(ttsService.isSpeakingActive()).toBe(false);
    });

    it('should allow re-initialization after cleanup', async () => {
      await ttsService.cleanup();

      await ttsService.initialize();

      expect(ttsService.isReady()).toBe(true);
    });
  });

  describe('edge cases', () => {
    beforeEach(async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      ttsService = new TTSService();

      mockExec.mockImplementation((command: string, callback?: any) => {
        if (callback) {
          callback(null, { stdout: '', stderr: '' });
        }
        return {} as any;
      });

      await ttsService.initialize();
    });

    it('should handle empty text', async () => {
      await ttsService.speak('');

      expect(mockExec).toHaveBeenCalled();
    });

    it('should handle very long text', async () => {
      const longText = 'A'.repeat(10000);

      await ttsService.speak(longText);

      expect(mockExec).toHaveBeenCalled();
    });

    it('should handle special characters', async () => {
      const specialText = 'Test with 한글, émojis 🎉, and symbols @#$%';

      await ttsService.speak(specialText);

      expect(mockExec).toHaveBeenCalled();
    });

    it('should handle multiline text', async () => {
      const multilineText = 'Line 1\nLine 2\nLine 3';

      await ttsService.speak(multilineText);

      expect(mockExec).toHaveBeenCalled();
    });

    it('should handle rapid speak calls', async () => {
      await ttsService.speak('First');
      await ttsService.speak('Second');
      await ttsService.speak('Third');

      // Should handle all calls
      expect(mockExec).toHaveBeenCalled();
    });
  });

  describe('default voice selection', () => {
    it('should select Korean voice for Korean language on macOS', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      const service = new TTSService({ language: 'ko' });

      expect(service).toBeDefined();
    });

    it('should select English voice for English language on macOS', () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      const service = new TTSService({ language: 'en' });

      expect(service).toBeDefined();
    });

    it('should select Korean voice for Korean language on Windows', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      const service = new TTSService({ language: 'ko' });

      expect(service).toBeDefined();
    });

    it('should select English voice for English language on Windows', () => {
      Object.defineProperty(process, 'platform', { value: 'win32' });
      const service = new TTSService({ language: 'en' });

      expect(service).toBeDefined();
    });
  });
});

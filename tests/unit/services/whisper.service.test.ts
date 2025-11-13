/**
 * Unit Tests for WhisperService
 *
 * Tests all Whisper speech-to-text operations including:
 * - Model initialization
 * - Audio file transcription
 * - Recording management
 * - Language detection
 * - Configuration management
 * - Resource cleanup
 */

import { WhisperService } from '@/main/services/ai/whisper.service';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('electron-log');
jest.mock('@huggingface/transformers');

describe('WhisperService', () => {
  let whisperService: WhisperService;
  let mockPipeline: jest.Mock;

  beforeEach(() => {
    // Create mock pipeline function
    mockPipeline = jest.fn().mockResolvedValue({
      text: 'This is a test transcription',
      language: 'english',
    });

    // Mock @huggingface/transformers module
    jest.doMock('@huggingface/transformers', () => ({
      pipeline: jest.fn().mockResolvedValue(mockPipeline),
    }));

    // Mock fs operations
    (fs.access as jest.MockedFunction<typeof fs.access>).mockResolvedValue(undefined);

    // Create service instance
    whisperService = new WhisperService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const service = new WhisperService();

      const config = service.getConfig();
      expect(config.language).toBe('auto');
      expect(config.task).toBe('transcribe');
      expect(config.modelPath).toContain('.garden-of-eden-v3');
    });

    it('should accept custom config', () => {
      const service = new WhisperService({
        language: 'ko',
        task: 'translate',
      });

      const config = service.getConfig();
      expect(config.language).toBe('ko');
      expect(config.task).toBe('translate');
    });

    it('should use HOME directory for model path', () => {
      const originalHome = process.env.HOME;
      process.env.HOME = '/test/home';

      const service = new WhisperService();
      const config = service.getConfig();

      expect(config.modelPath).toBe('/test/home/.garden-of-eden-v3/models/whisper-large-v3');

      process.env.HOME = originalHome;
    });

    it('should fallback to USERPROFILE on Windows', () => {
      const originalHome = process.env.HOME;
      const originalUserProfile = process.env.USERPROFILE;

      delete process.env.HOME;
      process.env.USERPROFILE = 'C:\\Users\\TestUser';

      const service = new WhisperService();
      const config = service.getConfig();

      expect(config.modelPath).toContain('TestUser');

      process.env.HOME = originalHome;
      process.env.USERPROFILE = originalUserProfile;
    });
  });

  describe('initialize', () => {
    it('should initialize with local model successfully', async () => {
      const { pipeline } = await import('@huggingface/transformers');

      await whisperService.initialize();

      expect(fs.access).toHaveBeenCalled();
      expect(pipeline).toHaveBeenCalledWith(
        'automatic-speech-recognition',
        expect.any(String),
        { device: 'cpu' }
      );
      expect(whisperService.isReady()).toBe(true);
    });

    it('should fallback to Hugging Face model if local not found', async () => {
      (fs.access as jest.MockedFunction<typeof fs.access>).mockRejectedValue(
        new Error('ENOENT: no such file')
      );

      const { pipeline } = await import('@huggingface/transformers');

      await whisperService.initialize();

      expect(pipeline).toHaveBeenCalledWith(
        'automatic-speech-recognition',
        'Xenova/whisper-small',
        { device: 'cpu' }
      );
      expect(whisperService.isReady()).toBe(true);
    });

    it('should throw error if already loading', async () => {
      const firstInit = whisperService.initialize();

      await expect(whisperService.initialize()).rejects.toThrow('Whisper model is already loading');

      await firstInit;
    });

    it('should not reload if already initialized', async () => {
      const { pipeline } = await import('@huggingface/transformers');

      await whisperService.initialize();
      expect(pipeline).toHaveBeenCalledTimes(1);

      await whisperService.initialize();
      expect(pipeline).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should handle initialization errors', async () => {
      const { pipeline } = await import('@huggingface/transformers');
      (pipeline as jest.MockedFunction<any>).mockRejectedValue(new Error('Model load failed'));

      await expect(whisperService.initialize()).rejects.toThrow('Model load failed');
      expect(whisperService.isReady()).toBe(false);
    });

    it('should reset loading flag after error', async () => {
      const { pipeline } = await import('@huggingface/transformers');
      (pipeline as jest.MockedFunction<any>).mockRejectedValueOnce(new Error('Test error'));

      try {
        await whisperService.initialize();
      } catch {
        // Expected
      }

      // Should be able to retry
      (pipeline as jest.MockedFunction<any>).mockResolvedValue(mockPipeline);
      await whisperService.initialize();

      expect(whisperService.isReady()).toBe(true);
    });
  });

  describe('isReady', () => {
    it('should return false before initialization', () => {
      expect(whisperService.isReady()).toBe(false);
    });

    it('should return true after initialization', async () => {
      await whisperService.initialize();

      expect(whisperService.isReady()).toBe(true);
    });

    it('should return false after cleanup', async () => {
      await whisperService.initialize();
      await whisperService.cleanup();

      expect(whisperService.isReady()).toBe(false);
    });
  });

  describe('transcribeFile', () => {
    const testAudioPath = '/test/audio.wav';

    beforeEach(async () => {
      await whisperService.initialize();
      (fs.access as jest.MockedFunction<typeof fs.access>).mockResolvedValue(undefined);
    });

    it('should transcribe audio file successfully', async () => {
      mockPipeline.mockResolvedValue({
        text: 'Hello world',
        language: 'english',
      });

      const result = await whisperService.transcribeFile(testAudioPath);

      expect(fs.access).toHaveBeenCalledWith(testAudioPath);
      expect(mockPipeline).toHaveBeenCalledWith(testAudioPath, {
        language: undefined, // auto
        task: 'transcribe',
        return_timestamps: false,
      });
      expect(result.transcript).toBe('Hello world');
      expect(result.language).toBe('en');
    });

    it('should auto-initialize if not ready', async () => {
      const uninitializedService = new WhisperService();
      mockPipeline.mockResolvedValue({ text: 'Test', language: 'english' });

      const result = await uninitializedService.transcribeFile(testAudioPath);

      expect(result.transcript).toBe('Test');
    });

    it('should throw error if audio file not found', async () => {
      (fs.access as jest.MockedFunction<typeof fs.access>).mockRejectedValue(
        new Error('ENOENT: no such file')
      );

      await expect(whisperService.transcribeFile(testAudioPath)).rejects.toThrow(
        `Audio file not found: ${testAudioPath}`
      );
    });

    it('should detect Korean language', async () => {
      mockPipeline.mockResolvedValue({
        text: '안녕하세요',
        language: 'korean',
      });

      const result = await whisperService.transcribeFile(testAudioPath);

      expect(result.transcript).toBe('안녕하세요');
      expect(result.language).toBe('ko');
    });

    it('should use configured language if not auto', async () => {
      whisperService.setLanguage('ko');
      mockPipeline.mockResolvedValue({ text: 'Test', language: 'korean' });

      await whisperService.transcribeFile(testAudioPath);

      expect(mockPipeline).toHaveBeenCalledWith(testAudioPath, {
        language: 'ko',
        task: 'transcribe',
        return_timestamps: false,
      });
    });

    it('should use configured task', async () => {
      whisperService.setTask('translate');
      mockPipeline.mockResolvedValue({ text: 'Translated text' });

      await whisperService.transcribeFile(testAudioPath);

      expect(mockPipeline).toHaveBeenCalledWith(testAudioPath, {
        language: undefined,
        task: 'translate',
        return_timestamps: false,
      });
    });

    it('should handle empty transcription result', async () => {
      mockPipeline.mockResolvedValue({ text: '', language: 'english' });

      const result = await whisperService.transcribeFile(testAudioPath);

      expect(result.transcript).toBe('');
    });

    it('should handle transcription errors', async () => {
      mockPipeline.mockRejectedValue(new Error('Transcription failed'));

      await expect(whisperService.transcribeFile(testAudioPath)).rejects.toThrow(
        'Transcription failed'
      );
    });

    it('should throw error if pipeline not initialized', async () => {
      const uninitializedService = new WhisperService();
      (uninitializedService as any).pipeline = null;
      (uninitializedService as any).isInitialized = true;

      await expect(uninitializedService.transcribeFile(testAudioPath)).rejects.toThrow(
        'Whisper pipeline not initialized'
      );
    });

    it('should handle result without language field', async () => {
      mockPipeline.mockResolvedValue({ text: 'Test without language' });

      const result = await whisperService.transcribeFile(testAudioPath);

      expect(result.language).toBe('ko'); // Default to Korean
    });
  });

  describe('startRecording', () => {
    it('should start recording successfully', async () => {
      await whisperService.startRecording();

      expect(whisperService.isRecordingActive()).toBe(true);
    });

    it('should not start if already recording', async () => {
      await whisperService.startRecording();
      expect(whisperService.isRecordingActive()).toBe(true);

      await whisperService.startRecording();
      expect(whisperService.isRecordingActive()).toBe(true);
    });

    it('should handle multiple start calls gracefully', async () => {
      await whisperService.startRecording();
      await whisperService.startRecording();
      await whisperService.startRecording();

      expect(whisperService.isRecordingActive()).toBe(true);
    });
  });

  describe('stopRecording', () => {
    it('should stop recording and return placeholder transcript', async () => {
      await whisperService.startRecording();

      const result = await whisperService.stopRecording();

      expect(whisperService.isRecordingActive()).toBe(false);
      expect(result.transcript).toContain('음성 인식');
      expect(result.language).toBe('ko');
    });

    it('should return empty transcript if not recording', async () => {
      const result = await whisperService.stopRecording();

      expect(result.transcript).toBe('');
      expect(result.language).toBe('ko');
    });

    it('should handle stop without start', async () => {
      expect(whisperService.isRecordingActive()).toBe(false);

      const result = await whisperService.stopRecording();

      expect(result.transcript).toBe('');
    });
  });

  describe('isRecordingActive', () => {
    it('should return false initially', () => {
      expect(whisperService.isRecordingActive()).toBe(false);
    });

    it('should return true when recording', async () => {
      await whisperService.startRecording();

      expect(whisperService.isRecordingActive()).toBe(true);
    });

    it('should return false after stop', async () => {
      await whisperService.startRecording();
      await whisperService.stopRecording();

      expect(whisperService.isRecordingActive()).toBe(false);
    });
  });

  describe('setLanguage', () => {
    it('should update language configuration', () => {
      whisperService.setLanguage('ko');

      const config = whisperService.getConfig();
      expect(config.language).toBe('ko');
    });

    it('should accept auto language', () => {
      whisperService.setLanguage('auto');

      const config = whisperService.getConfig();
      expect(config.language).toBe('auto');
    });

    it('should accept English language', () => {
      whisperService.setLanguage('en');

      const config = whisperService.getConfig();
      expect(config.language).toBe('en');
    });

    it('should affect transcription behavior', async () => {
      await whisperService.initialize();
      whisperService.setLanguage('ko');

      mockPipeline.mockResolvedValue({ text: 'Test' });
      await whisperService.transcribeFile('/test.wav');

      expect(mockPipeline).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ language: 'ko' })
      );
    });
  });

  describe('setTask', () => {
    it('should update task configuration', () => {
      whisperService.setTask('translate');

      const config = whisperService.getConfig();
      expect(config.task).toBe('translate');
    });

    it('should accept transcribe task', () => {
      whisperService.setTask('transcribe');

      const config = whisperService.getConfig();
      expect(config.task).toBe('transcribe');
    });

    it('should affect transcription behavior', async () => {
      await whisperService.initialize();
      whisperService.setTask('translate');

      mockPipeline.mockResolvedValue({ text: 'Translated' });
      await whisperService.transcribeFile('/test.wav');

      expect(mockPipeline).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ task: 'translate' })
      );
    });
  });

  describe('cleanup', () => {
    beforeEach(async () => {
      await whisperService.initialize();
    });

    it('should cleanup resources', async () => {
      await whisperService.cleanup();

      expect(whisperService.isReady()).toBe(false);
    });

    it('should stop recording if active', async () => {
      await whisperService.startRecording();
      expect(whisperService.isRecordingActive()).toBe(true);

      await whisperService.cleanup();

      expect(whisperService.isRecordingActive()).toBe(false);
    });

    it('should clear pipeline reference', async () => {
      await whisperService.cleanup();

      // Should require re-initialization
      const uninitService = whisperService as any;
      expect(uninitService.pipeline).toBeNull();
    });

    it('should handle cleanup when not initialized', async () => {
      const uninitializedService = new WhisperService();

      await uninitializedService.cleanup();

      expect(uninitializedService.isReady()).toBe(false);
    });

    it('should allow re-initialization after cleanup', async () => {
      await whisperService.cleanup();

      await whisperService.initialize();

      expect(whisperService.isReady()).toBe(true);
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const config = whisperService.getConfig();

      expect(config).toHaveProperty('modelPath');
      expect(config).toHaveProperty('language');
      expect(config).toHaveProperty('task');
    });

    it('should reflect configuration changes', () => {
      whisperService.setLanguage('en');
      whisperService.setTask('translate');

      const config = whisperService.getConfig();

      expect(config.language).toBe('en');
      expect(config.task).toBe('translate');
    });
  });

  describe('edge cases', () => {
    it('should handle rapid transcription requests', async () => {
      await whisperService.initialize();
      mockPipeline.mockImplementation((path: string) => {
        return Promise.resolve({
          text: `Transcription of ${path}`,
          language: 'english',
        });
      });

      const results = await Promise.all([
        whisperService.transcribeFile('/test1.wav'),
        whisperService.transcribeFile('/test2.wav'),
        whisperService.transcribeFile('/test3.wav'),
      ]);

      expect(results).toHaveLength(3);
      expect(results[0].transcript).toContain('test1.wav');
      expect(results[1].transcript).toContain('test2.wav');
      expect(results[2].transcript).toContain('test3.wav');
    });

    it('should handle very long transcriptions', async () => {
      await whisperService.initialize();
      const longText = 'A'.repeat(10000);
      mockPipeline.mockResolvedValue({ text: longText, language: 'english' });

      const result = await whisperService.transcribeFile('/test.wav');

      expect(result.transcript).toHaveLength(10000);
    });

    it('should handle special characters in transcriptions', async () => {
      await whisperService.initialize();
      const specialText = 'Test with 한글, émojis 🎉, and symbols @#$%';
      mockPipeline.mockResolvedValue({ text: specialText, language: 'korean' });

      const result = await whisperService.transcribeFile('/test.wav');

      expect(result.transcript).toBe(specialText);
    });

    it('should handle configuration changes during operation', async () => {
      await whisperService.initialize();
      mockPipeline.mockResolvedValue({ text: 'Test' });

      // Start transcription
      const promise1 = whisperService.transcribeFile('/test1.wav');

      // Change config during operation
      whisperService.setLanguage('ko');
      whisperService.setTask('translate');

      // Start another transcription
      const promise2 = whisperService.transcribeFile('/test2.wav');

      await Promise.all([promise1, promise2]);

      // Should complete without errors
      expect(mockPipeline).toHaveBeenCalledTimes(2);
    });

    it('should handle recording state changes', async () => {
      await whisperService.startRecording();
      await whisperService.stopRecording();
      await whisperService.startRecording();
      await whisperService.stopRecording();

      expect(whisperService.isRecordingActive()).toBe(false);
    });
  });

  describe('error recovery', () => {
    it('should recover from transcription errors', async () => {
      await whisperService.initialize();

      mockPipeline.mockRejectedValueOnce(new Error('Temporary error'));
      await expect(whisperService.transcribeFile('/test1.wav')).rejects.toThrow('Temporary error');

      mockPipeline.mockResolvedValueOnce({ text: 'Success', language: 'english' });
      const result = await whisperService.transcribeFile('/test2.wav');

      expect(result.transcript).toBe('Success');
    });

    it('should maintain state after errors', async () => {
      await whisperService.initialize();
      whisperService.setLanguage('ko');

      mockPipeline.mockRejectedValueOnce(new Error('Error'));
      try {
        await whisperService.transcribeFile('/test.wav');
      } catch {
        // Expected
      }

      const config = whisperService.getConfig();
      expect(config.language).toBe('ko'); // Config should be preserved
    });
  });
});

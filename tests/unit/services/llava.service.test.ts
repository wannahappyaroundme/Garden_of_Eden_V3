/**
 * Unit Tests for LLaVAService
 *
 * Tests all vision-language model operations including:
 * - Model initialization
 * - Single screen analysis
 * - Multiple screen analysis
 * - Context summary generation
 * - Object detection
 * - Action suggestion
 * - Resource cleanup
 */

import { LLaVAService, LLaVAConfig, VisionAnalysisResult } from '@/main/services/ai/llava.service';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('electron-log');
jest.mock('@huggingface/transformers');

describe('LLaVAService', () => {
  let llavaService: LLaVAService;
  let mockPipeline: jest.Mock;
  const testModelPath = '/test/path/llava-model';
  const testImagePath = '/test/image.png';

  beforeEach(() => {
    // Create mock pipeline function
    mockPipeline = jest.fn().mockResolvedValue({
      generated_text: 'A person is coding in VSCode editor with TypeScript files open',
      confidence: 0.85,
    });

    // Mock @huggingface/transformers module
    jest.doMock('@huggingface/transformers', () => ({
      pipeline: jest.fn().mockResolvedValue(mockPipeline),
    }));

    // Mock fs operations
    (fs.access as jest.MockedFunction<typeof fs.access>).mockResolvedValue(undefined);

    // Create service instance
    const config: LLaVAConfig = {
      modelPath: testModelPath,
      maxTokens: 512,
      temperature: 0.7,
    };

    llavaService = new LLaVAService(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      const config: LLaVAConfig = {
        modelPath: '/custom/model',
        maxTokens: 256,
        temperature: 0.5,
      };

      const service = new LLaVAService(config);

      expect(service).toBeDefined();
      expect(service.isReady()).toBe(false);
    });

    it('should apply default config values', () => {
      const config: LLaVAConfig = {
        modelPath: '/test/model',
      };

      const service = new LLaVAService(config);

      expect(service).toBeDefined();
    });
  });

  describe('initialize', () => {
    it('should load model successfully with local model', async () => {
      const { pipeline } = await import('@huggingface/transformers');

      await llavaService.initialize();

      expect(fs.access).toHaveBeenCalledWith(testModelPath);
      expect(pipeline).toHaveBeenCalledWith('image-to-text', testModelPath, {
        device: 'cpu',
      });
      expect(llavaService.isReady()).toBe(true);
    });

    it('should fallback to Hugging Face model if local not found', async () => {
      (fs.access as jest.MockedFunction<typeof fs.access>).mockRejectedValue(
        new Error('ENOENT: no such file')
      );

      const { pipeline } = await import('@huggingface/transformers');

      await llavaService.initialize();

      expect(pipeline).toHaveBeenCalledWith(
        'image-to-text',
        'Xenova/vit-gpt2-image-captioning',
        { device: 'cpu' }
      );
      expect(llavaService.isReady()).toBe(true);
    });

    it('should throw error if already loading', async () => {
      const firstInit = llavaService.initialize();

      await expect(llavaService.initialize()).rejects.toThrow('LLaVA model is already loading');

      await firstInit;
    });

    it('should not reload if already initialized', async () => {
      const { pipeline } = await import('@huggingface/transformers');

      await llavaService.initialize();
      expect(pipeline).toHaveBeenCalledTimes(1);

      await llavaService.initialize();
      expect(pipeline).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should handle initialization errors', async () => {
      const { pipeline } = await import('@huggingface/transformers');
      (pipeline as jest.MockedFunction<any>).mockRejectedValue(new Error('Model load failed'));

      await expect(llavaService.initialize()).rejects.toThrow('Model load failed');
      expect(llavaService.isReady()).toBe(false);
    });

    it('should reset loading flag after error', async () => {
      const { pipeline } = await import('@huggingface/transformers');
      (pipeline as jest.MockedFunction<any>).mockRejectedValueOnce(new Error('Test error'));

      try {
        await llavaService.initialize();
      } catch {
        // Expected
      }

      // Should be able to retry
      (pipeline as jest.MockedFunction<any>).mockResolvedValue(mockPipeline);
      await llavaService.initialize();

      expect(llavaService.isReady()).toBe(true);
    });
  });

  describe('isReady', () => {
    it('should return false before initialization', () => {
      expect(llavaService.isReady()).toBe(false);
    });

    it('should return true after initialization', async () => {
      await llavaService.initialize();

      expect(llavaService.isReady()).toBe(true);
    });

    it('should return false after shutdown', async () => {
      await llavaService.initialize();
      await llavaService.shutdown();

      expect(llavaService.isReady()).toBe(false);
    });
  });

  describe('analyzeScreen', () => {
    beforeEach(async () => {
      await llavaService.initialize();
    });

    it('should analyze screen with context level 1', async () => {
      mockPipeline.mockResolvedValue({
        generated_text: 'A code editor showing TypeScript files',
        confidence: 0.9,
      });

      const result = await llavaService.analyzeScreen(testImagePath, undefined, 1);

      expect(fs.access).toHaveBeenCalledWith(testImagePath);
      expect(mockPipeline).toHaveBeenCalledWith(testImagePath, {
        prompt: expect.stringContaining('Describe what you see'),
        max_new_tokens: 512,
        temperature: 0.7,
      });
      expect(result.description).toBe('A code editor showing TypeScript files');
      expect(result.confidence).toBe(0.9);
      expect(result.contextLevel).toBe(1);
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should analyze screen with context level 2', async () => {
      mockPipeline.mockResolvedValue({
        generated_text: 'Working on a React application',
      });

      const result = await llavaService.analyzeScreen(testImagePath, undefined, 2);

      expect(mockPipeline).toHaveBeenCalledWith(
        testImagePath,
        expect.objectContaining({
          prompt: expect.stringContaining('context of recent work'),
        })
      );
      expect(result.contextLevel).toBe(2);
    });

    it('should analyze screen with context level 3', async () => {
      mockPipeline.mockResolvedValue({
        generated_text: 'A full-stack TypeScript project with React frontend',
      });

      const result = await llavaService.analyzeScreen(testImagePath, undefined, 3);

      expect(mockPipeline).toHaveBeenCalledWith(
        testImagePath,
        expect.objectContaining({
          prompt: expect.stringContaining('deep analysis'),
        })
      );
      expect(result.contextLevel).toBe(3);
    });

    it('should use custom prompt if provided', async () => {
      const customPrompt = 'What programming language is being used?';
      mockPipeline.mockResolvedValue({ generated_text: 'TypeScript' });

      await llavaService.analyzeScreen(testImagePath, customPrompt, 1);

      expect(mockPipeline).toHaveBeenCalledWith(
        testImagePath,
        expect.objectContaining({ prompt: customPrompt })
      );
    });

    it('should auto-initialize if not ready', async () => {
      const uninitializedService = new LLaVAService({ modelPath: testModelPath });
      mockPipeline.mockResolvedValue({ generated_text: 'Test analysis' });

      const result = await uninitializedService.analyzeScreen(testImagePath);

      expect(result.description).toBe('Test analysis');
    });

    it('should throw error if image file not found', async () => {
      (fs.access as jest.MockedFunction<typeof fs.access>).mockRejectedValue(
        new Error('ENOENT: no such file')
      );

      await expect(llavaService.analyzeScreen(testImagePath)).rejects.toThrow();
    });

    it('should throw error if pipeline not initialized', async () => {
      const uninitializedService = new LLaVAService({ modelPath: testModelPath });
      (uninitializedService as any).pipeline = null;
      (uninitializedService as any).isInitialized = true;

      await expect(uninitializedService.analyzeScreen(testImagePath)).rejects.toThrow(
        'LLaVA pipeline not initialized'
      );
    });

    it('should handle result with text field instead of generated_text', async () => {
      mockPipeline.mockResolvedValue({
        text: 'Alternative format result',
      });

      const result = await llavaService.analyzeScreen(testImagePath);

      expect(result.description).toBe('Alternative format result');
    });

    it('should extract detected objects from description', async () => {
      mockPipeline.mockResolvedValue({
        generated_text: 'The screen is showing a code editor and there are files visible',
      });

      const result = await llavaService.analyzeScreen(testImagePath);

      expect(result.detectedObjects).toBeDefined();
      expect(Array.isArray(result.detectedObjects)).toBe(true);
    });

    it('should suggest actions based on context', async () => {
      mockPipeline.mockResolvedValue({
        generated_text: 'A code editor with TypeScript files',
      });

      const result = await llavaService.analyzeScreen(testImagePath, undefined, 1);

      expect(result.suggestedActions).toBeDefined();
      expect(result.suggestedActions?.length).toBeGreaterThan(0);
    });

    it('should handle analysis errors', async () => {
      mockPipeline.mockRejectedValue(new Error('Analysis failed'));

      await expect(llavaService.analyzeScreen(testImagePath)).rejects.toThrow('Analysis failed');
    });

    it('should default to confidence 0.8 if not provided', async () => {
      mockPipeline.mockResolvedValue({
        generated_text: 'Test result without confidence',
      });

      const result = await llavaService.analyzeScreen(testImagePath);

      expect(result.confidence).toBe(0.8);
    });
  });

  describe('analyzeMultipleScreens', () => {
    beforeEach(async () => {
      await llavaService.initialize();
    });

    it('should analyze multiple screens successfully', async () => {
      const imagePaths = ['/test/image1.png', '/test/image2.png', '/test/image3.png'];

      mockPipeline.mockResolvedValueOnce({ generated_text: 'Screen 1 analysis' });
      mockPipeline.mockResolvedValueOnce({ generated_text: 'Screen 2 analysis' });
      mockPipeline.mockResolvedValueOnce({ generated_text: 'Screen 3 analysis' });

      const results = await llavaService.analyzeMultipleScreens(imagePaths, 2);

      expect(results).toHaveLength(3);
      expect(results[0].description).toBe('Screen 1 analysis');
      expect(results[1].description).toBe('Screen 2 analysis');
      expect(results[2].description).toBe('Screen 3 analysis');
    });

    it('should continue on individual analysis errors', async () => {
      const imagePaths = ['/test/image1.png', '/test/image2.png', '/test/image3.png'];

      mockPipeline.mockResolvedValueOnce({ generated_text: 'Screen 1 analysis' });
      mockPipeline.mockRejectedValueOnce(new Error('Screen 2 failed'));
      mockPipeline.mockResolvedValueOnce({ generated_text: 'Screen 3 analysis' });

      const results = await llavaService.analyzeMultipleScreens(imagePaths, 2);

      expect(results).toHaveLength(2); // Only successful analyses
      expect(results[0].description).toBe('Screen 1 analysis');
      expect(results[1].description).toBe('Screen 3 analysis');
    });

    it('should return empty array for empty input', async () => {
      const results = await llavaService.analyzeMultipleScreens([], 2);

      expect(results).toEqual([]);
    });

    it('should use specified context level for all screens', async () => {
      const imagePaths = ['/test/image1.png', '/test/image2.png'];

      mockPipeline.mockResolvedValue({ generated_text: 'Test' });

      const results = await llavaService.analyzeMultipleScreens(imagePaths, 3);

      expect(results.every((r) => r.contextLevel === 3)).toBe(true);
    });
  });

  describe('generateContextSummary', () => {
    it('should generate summary for single analysis', async () => {
      const analyses: VisionAnalysisResult[] = [
        {
          description: 'Coding in VSCode',
          confidence: 0.9,
          contextLevel: 1,
          processingTime: 100,
        },
      ];

      const summary = await llavaService.generateContextSummary(analyses);

      expect(summary).toBe('Coding in VSCode');
    });

    it('should generate summary for multiple analyses', async () => {
      const analyses: VisionAnalysisResult[] = [
        {
          description: 'Coding in VSCode',
          confidence: 0.9,
          contextLevel: 1,
          processingTime: 100,
        },
        {
          description: 'Browsing documentation',
          confidence: 0.85,
          contextLevel: 1,
          processingTime: 150,
        },
      ];

      const summary = await llavaService.generateContextSummary(analyses);

      expect(summary).toContain('Summary of 2 screens');
      expect(summary).toContain('Coding in VSCode');
      expect(summary).toContain('Browsing documentation');
    });

    it('should handle empty analyses array', async () => {
      const summary = await llavaService.generateContextSummary([]);

      expect(summary).toBe('No screen context available.');
    });

    it('should format multiple screens with labels', async () => {
      const analyses: VisionAnalysisResult[] = [
        {
          description: 'Screen 1 content',
          confidence: 0.9,
          contextLevel: 1,
          processingTime: 100,
        },
        {
          description: 'Screen 2 content',
          confidence: 0.85,
          contextLevel: 1,
          processingTime: 100,
        },
      ];

      const summary = await llavaService.generateContextSummary(analyses);

      expect(summary).toContain('[Screen 1]');
      expect(summary).toContain('[Screen 2]');
    });
  });

  describe('object extraction', () => {
    it('should extract objects from description with "showing" pattern', async () => {
      await llavaService.initialize();
      mockPipeline.mockResolvedValue({
        generated_text: 'The screen is showing a code editor and displaying files',
      });

      const result = await llavaService.analyzeScreen(testImagePath);

      expect(result.detectedObjects).toBeDefined();
      expect(result.detectedObjects!.length).toBeGreaterThan(0);
    });

    it('should extract objects from description with "there is" pattern', async () => {
      await llavaService.initialize();
      mockPipeline.mockResolvedValue({
        generated_text: 'There is a terminal window and there are multiple tabs',
      });

      const result = await llavaService.analyzeScreen(testImagePath);

      expect(result.detectedObjects).toBeDefined();
    });

    it('should return unique objects only', async () => {
      await llavaService.initialize();
      mockPipeline.mockResolvedValue({
        generated_text: 'Showing editor, showing editor, displaying editor',
      });

      const result = await llavaService.analyzeScreen(testImagePath);

      const uniqueObjects = new Set(result.detectedObjects);
      expect(uniqueObjects.size).toBe(result.detectedObjects!.length);
    });

    it('should limit to 10 objects maximum', async () => {
      await llavaService.initialize();
      const longDescription = Array(20)
        .fill(0)
        .map((_, i) => `showing object${i}`)
        .join(' and ');
      mockPipeline.mockResolvedValue({ generated_text: longDescription });

      const result = await llavaService.analyzeScreen(testImagePath);

      expect(result.detectedObjects!.length).toBeLessThanOrEqual(10);
    });
  });

  describe('action suggestion', () => {
    beforeEach(async () => {
      await llavaService.initialize();
    });

    it('should suggest code-related actions for code editor', async () => {
      mockPipeline.mockResolvedValue({
        generated_text: 'A code editor with TypeScript files',
      });

      const result = await llavaService.analyzeScreen(testImagePath, undefined, 1);

      expect(result.suggestedActions).toContain('Assist with code review or debugging');
    });

    it('should suggest browser-related actions for browser', async () => {
      mockPipeline.mockResolvedValue({
        generated_text: 'A browser showing a website',
      });

      const result = await llavaService.analyzeScreen(testImagePath, undefined, 1);

      expect(result.suggestedActions).toContain('Summarize web content');
    });

    it('should suggest terminal-related actions for terminal', async () => {
      mockPipeline.mockResolvedValue({
        generated_text: 'A terminal window with command line',
      });

      const result = await llavaService.analyzeScreen(testImagePath, undefined, 1);

      expect(result.suggestedActions).toContain('Explain command or suggest next steps');
    });

    it('should suggest contextual actions for level 2', async () => {
      mockPipeline.mockResolvedValue({ generated_text: 'Working on a project' });

      const result = await llavaService.analyzeScreen(testImagePath, undefined, 2);

      expect(result.suggestedActions).toContain('Review recent work progress');
      expect(result.suggestedActions).toContain('Suggest next task based on current work');
    });

    it('should suggest deep insights for level 3', async () => {
      mockPipeline.mockResolvedValue({ generated_text: 'Complex project structure' });

      const result = await llavaService.analyzeScreen(testImagePath, undefined, 3);

      expect(result.suggestedActions).toContain('Provide project-level insights');
      expect(result.suggestedActions).toContain('Suggest architectural improvements');
      expect(result.suggestedActions).toContain('Identify potential issues or blockers');
    });
  });

  describe('shutdown', () => {
    beforeEach(async () => {
      await llavaService.initialize();
    });

    it('should cleanup resources', async () => {
      await llavaService.shutdown();

      expect(llavaService.isReady()).toBe(false);
    });

    it('should clear pipeline reference', async () => {
      await llavaService.shutdown();

      const uninitService = llavaService as any;
      expect(uninitService.pipeline).toBeNull();
    });

    it('should handle shutdown when not initialized', async () => {
      const uninitializedService = new LLaVAService({ modelPath: testModelPath });

      await uninitializedService.shutdown();

      expect(uninitializedService.isReady()).toBe(false);
    });

    it('should allow re-initialization after shutdown', async () => {
      await llavaService.shutdown();

      await llavaService.initialize();

      expect(llavaService.isReady()).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle very long descriptions', async () => {
      await llavaService.initialize();
      const longDescription = 'A'.repeat(10000);
      mockPipeline.mockResolvedValue({ generated_text: longDescription });

      const result = await llavaService.analyzeScreen(testImagePath);

      expect(result.description).toHaveLength(10000);
    });

    it('should handle special characters in descriptions', async () => {
      await llavaService.initialize();
      const specialText = 'Screen with 한글, émojis 🎉, and symbols @#$%';
      mockPipeline.mockResolvedValue({ generated_text: specialText });

      const result = await llavaService.analyzeScreen(testImagePath);

      expect(result.description).toBe(specialText);
    });

    it('should handle empty description', async () => {
      await llavaService.initialize();
      mockPipeline.mockResolvedValue({ generated_text: '' });

      const result = await llavaService.analyzeScreen(testImagePath);

      expect(result.description).toBe('');
    });

    it('should handle rapid analysis requests', async () => {
      await llavaService.initialize();
      mockPipeline.mockImplementation((path: string) => {
        return Promise.resolve({
          generated_text: `Analysis of ${path}`,
        });
      });

      const results = await Promise.all([
        llavaService.analyzeScreen('/test/image1.png'),
        llavaService.analyzeScreen('/test/image2.png'),
        llavaService.analyzeScreen('/test/image3.png'),
      ]);

      expect(results).toHaveLength(3);
    });

    it('should handle missing confidence in result', async () => {
      await llavaService.initialize();
      mockPipeline.mockResolvedValue({
        generated_text: 'Test without confidence',
        // No confidence field
      });

      const result = await llavaService.analyzeScreen(testImagePath);

      expect(result.confidence).toBe(0.8); // Default value
    });

    it('should handle result with neither generated_text nor text', async () => {
      await llavaService.initialize();
      mockPipeline.mockResolvedValue({});

      const result = await llavaService.analyzeScreen(testImagePath);

      expect(result.description).toBe('');
    });
  });

  describe('error recovery', () => {
    it('should recover from analysis errors', async () => {
      await llavaService.initialize();

      mockPipeline.mockRejectedValueOnce(new Error('Temporary error'));
      await expect(llavaService.analyzeScreen('/test/image1.png')).rejects.toThrow(
        'Temporary error'
      );

      mockPipeline.mockResolvedValueOnce({ generated_text: 'Success' });
      const result = await llavaService.analyzeScreen('/test/image2.png');

      expect(result.description).toBe('Success');
    });

    it('should maintain state after errors', async () => {
      await llavaService.initialize();

      mockPipeline.mockRejectedValueOnce(new Error('Error'));
      try {
        await llavaService.analyzeScreen(testImagePath);
      } catch {
        // Expected
      }

      expect(llavaService.isReady()).toBe(true); // Should still be ready
    });
  });

  describe('configuration', () => {
    it('should use custom max tokens', async () => {
      const customService = new LLaVAService({
        modelPath: testModelPath,
        maxTokens: 256,
      });

      await customService.initialize();
      mockPipeline.mockResolvedValue({ generated_text: 'Test' });

      await customService.analyzeScreen(testImagePath);

      expect(mockPipeline).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ max_new_tokens: 256 })
      );
    });

    it('should use custom temperature', async () => {
      const customService = new LLaVAService({
        modelPath: testModelPath,
        temperature: 0.3,
      });

      await customService.initialize();
      mockPipeline.mockResolvedValue({ generated_text: 'Test' });

      await customService.analyzeScreen(testImagePath);

      expect(mockPipeline).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ temperature: 0.3 })
      );
    });
  });
});

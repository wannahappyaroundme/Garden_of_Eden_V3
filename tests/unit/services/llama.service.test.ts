/**
 * Unit Tests for LlamaService
 *
 * Tests all Llama AI model operations including:
 * - Model initialization and loading
 * - Response generation (streaming and non-streaming)
 * - Conversation history management
 * - Resource cleanup
 * - Error handling
 */

import { LlamaService, LlamaConfig, ChatMessage } from '@/main/services/ai/llama.service';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('../../utils/logger', () => ({
  log: {
    ai: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    },
  },
}));
jest.mock('../learning/persona.service', () => ({
  personaService: {
    generateSystemPrompt: jest.fn().mockReturnValue('You are Eden, a helpful AI assistant.'),
  },
}));
jest.mock('node-llama-cpp');

describe('LlamaService', () => {
  let llamaService: LlamaService;
  let mockLlama: any;
  let mockModel: any;
  let mockContext: any;
  let mockSession: any;
  let mockSequence: any;
  const testModelPath = '/test/path/model.gguf';

  beforeEach(() => {
    // Create mock sequence
    mockSequence = {
      id: 'test-sequence',
    };

    // Create mock session
    mockSession = {
      prompt: jest.fn().mockResolvedValue('This is a test response'),
    };

    // Create mock context
    mockContext = {
      getSequence: jest.fn().mockReturnValue(mockSequence),
      dispose: jest.fn(),
    };

    // Create mock model
    mockModel = {
      createContext: jest.fn().mockResolvedValue(mockContext),
      dispose: jest.fn(),
    };

    // Create mock llama instance
    mockLlama = {
      loadModel: jest.fn().mockResolvedValue(mockModel),
    };

    // Mock node-llama-cpp module
    jest.doMock('node-llama-cpp', () => ({
      getLlama: jest.fn().mockResolvedValue(mockLlama),
      LlamaChatSession: jest.fn().mockImplementation((config: any) => mockSession),
    }));

    // Mock fs.access to simulate file exists
    (fs.access as jest.MockedFunction<typeof fs.access>).mockResolvedValue(undefined);

    // Create service instance
    const config: LlamaConfig = {
      modelPath: testModelPath,
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxTokens: 2048,
      contextSize: 4096,
      gpuLayers: 33,
    };

    llamaService = new LlamaService(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with provided config', () => {
      const config: LlamaConfig = {
        modelPath: '/custom/model.gguf',
        temperature: 0.8,
        maxTokens: 1024,
      };

      const service = new LlamaService(config);

      expect(service).toBeDefined();
      expect(service.isInitialized()).toBe(false);
    });

    it('should apply default config values', () => {
      const config: LlamaConfig = {
        modelPath: '/test/model.gguf',
      };

      const service = new LlamaService(config);

      // Should have defaults applied internally
      expect(service).toBeDefined();
    });
  });

  describe('initialize', () => {
    it('should load model successfully', async () => {
      await llamaService.initialize();

      expect(fs.access).toHaveBeenCalledWith(testModelPath);
      expect(mockLlama.loadModel).toHaveBeenCalledWith({
        modelPath: testModelPath,
        gpuLayers: 33,
      });
      expect(mockModel.createContext).toHaveBeenCalledWith({
        contextSize: 4096,
      });
      expect(llamaService.isInitialized()).toBe(true);
    });

    it('should throw error if model file does not exist', async () => {
      (fs.access as jest.MockedFunction<typeof fs.access>).mockRejectedValue(
        new Error('ENOENT: no such file')
      );

      await expect(llamaService.initialize()).rejects.toThrow(
        `Model file not found: ${testModelPath}`
      );
      expect(llamaService.isInitialized()).toBe(false);
    });

    it('should throw error if already loading', async () => {
      // Start first initialization (don't await)
      const firstInit = llamaService.initialize();

      // Try to initialize again while loading
      await expect(llamaService.initialize()).rejects.toThrow('Model is already loading');

      // Complete first initialization
      await firstInit;
    });

    it('should not reload if already initialized', async () => {
      await llamaService.initialize();
      expect(mockLlama.loadModel).toHaveBeenCalledTimes(1);

      await llamaService.initialize();
      expect(mockLlama.loadModel).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    it('should add system prompt to conversation history', async () => {
      await llamaService.initialize();

      const history = llamaService.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].role).toBe('system');
      expect(history[0].content).toBe('You are Eden, a helpful AI assistant.');
    });

    it('should handle model loading errors', async () => {
      mockLlama.loadModel.mockRejectedValue(new Error('GPU memory insufficient'));

      await expect(llamaService.initialize()).rejects.toThrow('GPU memory insufficient');
      expect(llamaService.isInitialized()).toBe(false);
    });

    it('should handle context creation errors', async () => {
      mockModel.createContext.mockRejectedValue(new Error('Context size too large'));

      await expect(llamaService.initialize()).rejects.toThrow('Context size too large');
    });
  });

  describe('generateResponse', () => {
    beforeEach(async () => {
      await llamaService.initialize();
    });

    it('should generate response successfully', async () => {
      mockSession.prompt.mockResolvedValue('This is a test response');

      const response = await llamaService.generateResponse('What is AI?');

      expect(mockSession.prompt).toHaveBeenCalledWith('What is AI?', {
        temperature: 0.7,
        maxTokens: 2048,
      });
      expect(response).toBe('This is a test response');
    });

    it('should auto-initialize if not initialized', async () => {
      const uninitializedService = new LlamaService({ modelPath: testModelPath });

      const response = await uninitializedService.generateResponse('Hello');

      expect(mockLlama.loadModel).toHaveBeenCalled();
      expect(response).toBe('This is a test response');
    });

    it('should handle generation errors', async () => {
      mockSession.prompt.mockRejectedValue(new Error('Token limit exceeded'));

      await expect(llamaService.generateResponse('Long prompt...')).rejects.toThrow(
        'Token limit exceeded'
      );
    });

    it('should throw error if session not initialized', async () => {
      // Manually set session to null to simulate error state
      (llamaService as any).session = null;

      await expect(llamaService.generateResponse('Test')).rejects.toThrow(
        'Chat session not initialized'
      );
    });

    it('should pass custom system prompt if provided', async () => {
      await llamaService.generateResponse('Hello', 'You are a friendly bot');

      expect(mockSession.prompt).toHaveBeenCalledWith('Hello', {
        temperature: 0.7,
        maxTokens: 2048,
      });
    });
  });

  describe('generateStreamingResponse', () => {
    beforeEach(async () => {
      await llamaService.initialize();
    });

    it('should generate streaming response with token callbacks', async () => {
      const tokens: string[] = [];
      const onToken = jest.fn((token: string) => tokens.push(token));

      mockSession.prompt.mockImplementation(async (prompt: string, options: any) => {
        // Simulate streaming
        const chunks = ['Hello', ' ', 'world', '!'];
        for (const chunk of chunks) {
          options.onTextChunk(chunk);
        }
        return 'Hello world!';
      });

      const response = await llamaService.generateStreamingResponse('Say hello', onToken);

      expect(onToken).toHaveBeenCalledTimes(4);
      expect(tokens).toEqual(['Hello', ' ', 'world', '!']);
      expect(response).toBe('Hello world!');
    });

    it('should accumulate full response from chunks', async () => {
      const onToken = jest.fn();

      mockSession.prompt.mockImplementation(async (prompt: string, options: any) => {
        options.onTextChunk('First ');
        options.onTextChunk('second ');
        options.onTextChunk('third');
        return 'First second third';
      });

      const response = await llamaService.generateStreamingResponse('Test', onToken);

      expect(response).toBe('First second third');
    });

    it('should auto-initialize if not initialized', async () => {
      const uninitializedService = new LlamaService({ modelPath: testModelPath });
      const onToken = jest.fn();

      await uninitializedService.generateStreamingResponse('Hello', onToken);

      expect(mockLlama.loadModel).toHaveBeenCalled();
    });

    it('should handle streaming errors', async () => {
      const onToken = jest.fn();
      mockSession.prompt.mockRejectedValue(new Error('Connection lost'));

      await expect(
        llamaService.generateStreamingResponse('Test', onToken)
      ).rejects.toThrow('Connection lost');
    });

    it('should throw error if session not initialized', async () => {
      (llamaService as any).session = null;
      const onToken = jest.fn();

      await expect(
        llamaService.generateStreamingResponse('Test', onToken)
      ).rejects.toThrow('Chat session not initialized');
    });
  });

  describe('addToHistory', () => {
    beforeEach(async () => {
      await llamaService.initialize();
    });

    it('should add user message to history', () => {
      llamaService.addToHistory('user', 'Hello');

      const history = llamaService.getHistory();
      expect(history).toHaveLength(2); // system + user
      expect(history[1]).toEqual({ role: 'user', content: 'Hello' });
    });

    it('should add assistant message to history', () => {
      llamaService.addToHistory('assistant', 'Hi there!');

      const history = llamaService.getHistory();
      expect(history[1]).toEqual({ role: 'assistant', content: 'Hi there!' });
    });

    it('should maintain multiple messages in history', () => {
      llamaService.addToHistory('user', 'Message 1');
      llamaService.addToHistory('assistant', 'Response 1');
      llamaService.addToHistory('user', 'Message 2');
      llamaService.addToHistory('assistant', 'Response 2');

      const history = llamaService.getHistory();
      expect(history).toHaveLength(5); // system + 4 messages
    });

    it('should trim history when exceeding max length', () => {
      // Add 15 messages (will exceed max of 11)
      for (let i = 0; i < 15; i++) {
        llamaService.addToHistory('user', `Message ${i}`);
      }

      const history = llamaService.getHistory();
      expect(history).toHaveLength(11); // system + last 10 messages
      expect(history[0].role).toBe('system'); // System message preserved
      expect(history[1].content).toBe('Message 5'); // Oldest kept message
      expect(history[10].content).toBe('Message 14'); // Newest message
    });

    it('should always keep system prompt when trimming', () => {
      for (let i = 0; i < 20; i++) {
        llamaService.addToHistory('user', `Message ${i}`);
      }

      const history = llamaService.getHistory();
      expect(history[0].role).toBe('system');
      expect(history[0].content).toBe('You are Eden, a helpful AI assistant.');
    });
  });

  describe('getHistory', () => {
    beforeEach(async () => {
      await llamaService.initialize();
    });

    it('should return copy of conversation history', () => {
      llamaService.addToHistory('user', 'Test');

      const history1 = llamaService.getHistory();
      const history2 = llamaService.getHistory();

      expect(history1).toEqual(history2);
      expect(history1).not.toBe(history2); // Different array instances
    });

    it('should return empty array if no history', () => {
      const emptyService = new LlamaService({ modelPath: testModelPath });
      const history = emptyService.getHistory();

      expect(history).toEqual([]);
    });
  });

  describe('clearHistory', () => {
    beforeEach(async () => {
      await llamaService.initialize();
    });

    it('should clear all messages except system prompt', () => {
      llamaService.addToHistory('user', 'Message 1');
      llamaService.addToHistory('assistant', 'Response 1');
      llamaService.addToHistory('user', 'Message 2');

      llamaService.clearHistory();

      const history = llamaService.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].role).toBe('system');
    });

    it('should preserve system prompt content', () => {
      llamaService.addToHistory('user', 'Test');
      llamaService.clearHistory();

      const history = llamaService.getHistory();
      expect(history[0].content).toBe('You are Eden, a helpful AI assistant.');
    });

    it('should handle clearing empty history', () => {
      const emptyService = new LlamaService({ modelPath: testModelPath });
      emptyService.clearHistory();

      const history = emptyService.getHistory();
      expect(history).toEqual([]);
    });
  });

  describe('isInitialized', () => {
    it('should return false before initialization', () => {
      expect(llamaService.isInitialized()).toBe(false);
    });

    it('should return true after successful initialization', async () => {
      await llamaService.initialize();

      expect(llamaService.isInitialized()).toBe(true);
    });

    it('should return false after initialization error', async () => {
      (fs.access as jest.MockedFunction<typeof fs.access>).mockRejectedValue(
        new Error('File not found')
      );

      try {
        await llamaService.initialize();
      } catch {
        // Expected error
      }

      expect(llamaService.isInitialized()).toBe(false);
    });

    it('should return false after shutdown', async () => {
      await llamaService.initialize();
      expect(llamaService.isInitialized()).toBe(true);

      await llamaService.shutdown();
      expect(llamaService.isInitialized()).toBe(false);
    });
  });

  describe('shutdown', () => {
    beforeEach(async () => {
      await llamaService.initialize();
    });

    it('should dispose context and model', async () => {
      await llamaService.shutdown();

      expect(mockContext.dispose).toHaveBeenCalled();
      expect(mockModel.dispose).toHaveBeenCalled();
    });

    it('should clear all references', async () => {
      await llamaService.shutdown();

      expect(llamaService.isInitialized()).toBe(false);
      expect(llamaService.getHistory()).toEqual([]);
    });

    it('should handle shutdown when not initialized', async () => {
      const uninitializedService = new LlamaService({ modelPath: testModelPath });

      await uninitializedService.shutdown();

      // Should complete without errors
      expect(uninitializedService.isInitialized()).toBe(false);
    });

    it('should clear conversation history', async () => {
      llamaService.addToHistory('user', 'Test message');
      expect(llamaService.getHistory()).toHaveLength(2);

      await llamaService.shutdown();

      expect(llamaService.getHistory()).toEqual([]);
    });
  });

  describe('configuration', () => {
    it('should use custom temperature', async () => {
      const customService = new LlamaService({
        modelPath: testModelPath,
        temperature: 0.5,
      });

      await customService.initialize();
      await customService.generateResponse('Test');

      expect(mockSession.prompt).toHaveBeenCalledWith('Test', {
        temperature: 0.5,
        maxTokens: 2048,
      });
    });

    it('should use custom max tokens', async () => {
      const customService = new LlamaService({
        modelPath: testModelPath,
        maxTokens: 512,
      });

      await customService.initialize();
      await customService.generateResponse('Test');

      expect(mockSession.prompt).toHaveBeenCalledWith('Test', {
        temperature: 0.7,
        maxTokens: 512,
      });
    });

    it('should use custom GPU layers', async () => {
      const customService = new LlamaService({
        modelPath: testModelPath,
        gpuLayers: 20,
      });

      await customService.initialize();

      expect(mockLlama.loadModel).toHaveBeenCalledWith({
        modelPath: testModelPath,
        gpuLayers: 20,
      });
    });

    it('should use custom context size', async () => {
      const customService = new LlamaService({
        modelPath: testModelPath,
        contextSize: 8192,
      });

      await customService.initialize();

      expect(mockModel.createContext).toHaveBeenCalledWith({
        contextSize: 8192,
      });
    });
  });

  describe('error handling', () => {
    it('should handle model loading timeout', async () => {
      mockLlama.loadModel.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Loading timeout')), 100);
        });
      });

      await expect(llamaService.initialize()).rejects.toThrow('Loading timeout');
    });

    it('should reset loading flag after error', async () => {
      mockLlama.loadModel.mockRejectedValue(new Error('Test error'));

      try {
        await llamaService.initialize();
      } catch {
        // Expected
      }

      // Should be able to retry
      mockLlama.loadModel.mockResolvedValue(mockModel);
      await llamaService.initialize();

      expect(llamaService.isInitialized()).toBe(true);
    });

    it('should handle concurrent generation requests', async () => {
      await llamaService.initialize();

      mockSession.prompt.mockImplementation((prompt: string) => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(`Response to: ${prompt}`), 10);
        });
      });

      const [response1, response2, response3] = await Promise.all([
        llamaService.generateResponse('Query 1'),
        llamaService.generateResponse('Query 2'),
        llamaService.generateResponse('Query 3'),
      ]);

      expect(response1).toBe('Response to: Query 1');
      expect(response2).toBe('Response to: Query 2');
      expect(response3).toBe('Response to: Query 3');
    });
  });

  describe('edge cases', () => {
    it('should handle empty prompt', async () => {
      await llamaService.initialize();
      mockSession.prompt.mockResolvedValue('');

      const response = await llamaService.generateResponse('');

      expect(response).toBe('');
    });

    it('should handle very long prompts', async () => {
      await llamaService.initialize();
      const longPrompt = 'A'.repeat(10000);
      mockSession.prompt.mockResolvedValue('Response to long prompt');

      const response = await llamaService.generateResponse(longPrompt);

      expect(response).toBe('Response to long prompt');
      expect(mockSession.prompt).toHaveBeenCalledWith(longPrompt, expect.any(Object));
    });

    it('should handle special characters in prompts', async () => {
      await llamaService.initialize();
      const specialPrompt = 'Test with 한글, émojis 🎉, and symbols @#$%';
      mockSession.prompt.mockResolvedValue('Handled special chars');

      const response = await llamaService.generateResponse(specialPrompt);

      expect(response).toBe('Handled special chars');
    });

    it('should handle rapid history operations', () => {
      const service = new LlamaService({ modelPath: testModelPath });

      for (let i = 0; i < 100; i++) {
        service.addToHistory('user', `Message ${i}`);
      }

      const history = service.getHistory();
      expect(history.length).toBeLessThanOrEqual(11); // Should be trimmed
    });
  });
});

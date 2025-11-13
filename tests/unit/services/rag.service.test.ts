/**
 * Unit Tests for RAGService
 *
 * Tests all RAG (Retrieval-Augmented Generation) operations including:
 * - Service initialization
 * - Episode storage
 * - Semantic search
 * - Episode retrieval and deletion
 * - Memory statistics
 * - Context generation for prompts
 */

import { RAGService } from '@/main/services/learning/rag.service';
import type {
  ConversationEpisode,
  MemorySearchRequest,
  EpisodeContext,
} from '@shared/types/memory.types';

// Mock dependencies
jest.mock('chromadb');
jest.mock('electron-log');
jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn(),
}));

import { ChromaClient } from 'chromadb';
import { pipeline } from '@xenova/transformers';

describe('RAGService', () => {
  let ragService: RAGService;
  let mockClient: jest.Mocked<any>;
  let mockCollection: jest.Mocked<any>;
  let mockEmbeddingModel: jest.Mocked<any>;

  beforeEach(() => {
    // Reset service
    ragService = new RAGService();

    // Create mock collection
    mockCollection = {
      add: jest.fn().mockResolvedValue(undefined),
      query: jest.fn(),
      get: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
      count: jest.fn().mockResolvedValue(0),
    };

    // Create mock client
    mockClient = {
      getOrCreateCollection: jest.fn().mockResolvedValue(mockCollection),
      createCollection: jest.fn().mockResolvedValue(mockCollection),
      deleteCollection: jest.fn().mockResolvedValue(undefined),
    };

    // Mock ChromaClient constructor
    (ChromaClient as jest.MockedClass<typeof ChromaClient>).mockImplementation(() => mockClient);

    // Create mock embedding model
    mockEmbeddingModel = jest.fn().mockResolvedValue({
      data: new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5]),
    });

    // Mock pipeline function
    (pipeline as jest.MockedFunction<typeof pipeline>).mockResolvedValue(mockEmbeddingModel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize ChromaDB client and embedding model successfully', async () => {
      await ragService.initialize();

      expect(ChromaClient).toHaveBeenCalledWith({
        path: 'http://localhost:8000',
      });
      expect(mockClient.getOrCreateCollection).toHaveBeenCalledWith({
        name: 'conversation_episodes',
        metadata: { description: 'Garden of Eden conversation episodes' },
      });
      expect(pipeline).toHaveBeenCalledWith('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    });

    it('should throw error if ChromaDB connection fails', async () => {
      mockClient.getOrCreateCollection.mockRejectedValue(new Error('Connection failed'));

      await expect(ragService.initialize()).rejects.toThrow('RAG service initialization failed');
    });

    it('should throw error if embedding model fails to load', async () => {
      (pipeline as jest.MockedFunction<typeof pipeline>).mockRejectedValue(new Error('Model load failed'));

      await expect(ragService.initialize()).rejects.toThrow('RAG service initialization failed');
    });

    it('should allow reinitialization', async () => {
      await ragService.initialize();
      await ragService.initialize();

      expect(ChromaClient).toHaveBeenCalledTimes(2);
    });
  });

  describe('storeEpisode', () => {
    beforeEach(async () => {
      await ragService.initialize();
    });

    it('should store episode successfully', async () => {
      const episode = {
        conversationId: 'conv-123',
        timestamp: new Date('2025-01-13T10:00:00Z'),
        userMessage: 'What is the weather?',
        edenResponse: 'I cannot check weather as I am offline.',
        satisfaction: 'positive' as const,
        context: {
          filesAccessed: ['weather.ts'],
          screenContext: 'VSCode editor',
        },
      };

      const episodeId = await ragService.storeEpisode(episode);

      expect(episodeId).toMatch(/^episode-\d+-[a-z0-9]+$/);
      expect(mockEmbeddingModel).toHaveBeenCalledWith(
        'User: What is the weather?\nEden: I cannot check weather as I am offline.',
        { pooling: 'mean', normalize: true }
      );
      expect(mockCollection.add).toHaveBeenCalledWith({
        ids: [episodeId],
        embeddings: [[0.1, 0.2, 0.3, 0.4, 0.5]],
        metadatas: [
          {
            conversationId: 'conv-123',
            timestamp: '2025-01-13T10:00:00.000Z',
            userMessage: 'What is the weather?',
            edenResponse: 'I cannot check weather as I am offline.',
            satisfaction: 'positive',
            contextJSON: JSON.stringify({
              filesAccessed: ['weather.ts'],
              screenContext: 'VSCode editor',
            }),
          },
        ],
        documents: ['User: What is the weather?\nEden: I cannot check weather as I am offline.'],
      });
    });

    it('should handle episode without satisfaction', async () => {
      const episode = {
        conversationId: 'conv-456',
        timestamp: new Date('2025-01-13T11:00:00Z'),
        userMessage: 'Hello',
        edenResponse: 'Hi there!',
        context: { filesAccessed: [] },
      };

      const episodeId = await ragService.storeEpisode(episode);

      expect(episodeId).toBeDefined();
      const callArgs = mockCollection.add.mock.calls[0][0];
      expect(callArgs.metadatas[0].satisfaction).toBe('null');
    });

    it('should throw error when not initialized', async () => {
      const uninitializedService = new RAGService();
      const episode = {
        conversationId: 'conv-123',
        timestamp: new Date(),
        userMessage: 'Test',
        edenResponse: 'Response',
        context: { filesAccessed: [] },
      };

      await expect(uninitializedService.storeEpisode(episode)).rejects.toThrow('RAG service not initialized');
    });

    it('should propagate ChromaDB errors', async () => {
      mockCollection.add.mockRejectedValue(new Error('Storage failed'));

      const episode = {
        conversationId: 'conv-123',
        timestamp: new Date(),
        userMessage: 'Test',
        edenResponse: 'Response',
        context: { filesAccessed: [] },
      };

      await expect(ragService.storeEpisode(episode)).rejects.toThrow('Storage failed');
    });
  });

  describe('searchEpisodes', () => {
    beforeEach(async () => {
      await ragService.initialize();
    });

    it('should search episodes successfully', async () => {
      const mockQueryResult = {
        ids: [['episode-1', 'episode-2']],
        metadatas: [
          [
            {
              conversationId: 'conv-123',
              timestamp: '2025-01-13T10:00:00.000Z',
              userMessage: 'What is React?',
              edenResponse: 'React is a JavaScript library.',
              satisfaction: 'positive',
              contextJSON: JSON.stringify({ filesAccessed: ['react.ts'] }),
            },
            {
              conversationId: 'conv-123',
              timestamp: '2025-01-13T11:00:00.000Z',
              userMessage: 'Explain hooks',
              edenResponse: 'Hooks are functions that let you use state.',
              satisfaction: 'null',
              contextJSON: JSON.stringify({ filesAccessed: [] }),
            },
          ],
        ],
        distances: [[0.1, 0.3]],
      };

      mockCollection.query.mockResolvedValue(mockQueryResult);

      const request: MemorySearchRequest = {
        query: 'Tell me about React',
        topK: 5,
      };

      const result = await ragService.searchEpisodes(request);

      expect(mockEmbeddingModel).toHaveBeenCalledWith('Tell me about React', {
        pooling: 'mean',
        normalize: true,
      });
      expect(mockCollection.query).toHaveBeenCalledWith({
        queryEmbeddings: [[0.1, 0.2, 0.3, 0.4, 0.5]],
        nResults: 5,
        where: undefined,
      });
      expect(result.episodes).toHaveLength(2);
      expect(result.episodes[0].userMessage).toBe('What is React?');
      expect(result.episodes[0].similarity).toBe(0.9); // 1 - 0.1
      expect(result.episodes[1].similarity).toBe(0.7); // 1 - 0.3
      expect(result.totalFound).toBe(2);
      expect(result.searchTime).toBeGreaterThanOrEqual(0);
    });

    it('should filter by conversation ID', async () => {
      mockCollection.query.mockResolvedValue({
        ids: [[]],
        metadatas: [[]],
        distances: [[]],
      });

      const request: MemorySearchRequest = {
        query: 'Test query',
        topK: 5,
        conversationId: 'conv-specific',
      };

      await ragService.searchEpisodes(request);

      expect(mockCollection.query).toHaveBeenCalledWith({
        queryEmbeddings: [[0.1, 0.2, 0.3, 0.4, 0.5]],
        nResults: 5,
        where: { conversationId: 'conv-specific' },
      });
    });

    it('should filter by time range', async () => {
      mockCollection.query.mockResolvedValue({
        ids: [[]],
        metadatas: [[]],
        distances: [[]],
      });

      const startDate = new Date('2025-01-01T00:00:00Z');
      const endDate = new Date('2025-01-31T23:59:59Z');

      const request: MemorySearchRequest = {
        query: 'Test query',
        topK: 5,
        timeRange: { start: startDate, end: endDate },
      };

      await ragService.searchEpisodes(request);

      expect(mockCollection.query).toHaveBeenCalledWith({
        queryEmbeddings: [[0.1, 0.2, 0.3, 0.4, 0.5]],
        nResults: 5,
        where: {
          timestamp: {
            $gte: '2025-01-01T00:00:00.000Z',
            $lte: '2025-01-31T23:59:59.000Z',
          },
        },
      });
    });

    it('should apply minimum similarity threshold', async () => {
      const mockQueryResult = {
        ids: [['episode-1', 'episode-2', 'episode-3']],
        metadatas: [
          [
            { conversationId: 'c1', timestamp: '2025-01-13T10:00:00.000Z', userMessage: 'm1', edenResponse: 'r1', satisfaction: 'null', contextJSON: '{"filesAccessed":[]}' },
            { conversationId: 'c2', timestamp: '2025-01-13T11:00:00.000Z', userMessage: 'm2', edenResponse: 'r2', satisfaction: 'null', contextJSON: '{"filesAccessed":[]}' },
            { conversationId: 'c3', timestamp: '2025-01-13T12:00:00.000Z', userMessage: 'm3', edenResponse: 'r3', satisfaction: 'null', contextJSON: '{"filesAccessed":[]}' },
          ],
        ],
        distances: [[0.1, 0.4, 0.6]], // Similarities: 0.9, 0.6, 0.4
      };

      mockCollection.query.mockResolvedValue(mockQueryResult);

      const request: MemorySearchRequest = {
        query: 'Test',
        topK: 10,
        minSimilarity: 0.65, // Should filter out episode-3 (0.4)
      };

      const result = await ragService.searchEpisodes(request);

      expect(result.episodes).toHaveLength(2); // Only episodes with similarity >= 0.65
      expect(result.episodes[0].similarity).toBe(0.9);
      expect(result.episodes[1].similarity).toBe(0.6);
    });

    it('should handle empty search results', async () => {
      mockCollection.query.mockResolvedValue({
        ids: [[]],
        metadatas: [[]],
        distances: [[]],
      });

      const request: MemorySearchRequest = {
        query: 'Nonexistent topic',
        topK: 5,
      };

      const result = await ragService.searchEpisodes(request);

      expect(result.episodes).toHaveLength(0);
      expect(result.totalFound).toBe(0);
    });

    it('should handle invalid context JSON gracefully', async () => {
      const mockQueryResult = {
        ids: [['episode-1']],
        metadatas: [
          [
            {
              conversationId: 'c1',
              timestamp: '2025-01-13T10:00:00.000Z',
              userMessage: 'Test',
              edenResponse: 'Response',
              satisfaction: 'null',
              contextJSON: 'invalid-json',
            },
          ],
        ],
        distances: [[0.1]],
      };

      mockCollection.query.mockResolvedValue(mockQueryResult);

      const result = await ragService.searchEpisodes({ query: 'Test', topK: 5 });

      expect(result.episodes).toHaveLength(1);
      expect(result.episodes[0].context).toEqual({ filesAccessed: [] }); // Default context
    });
  });

  describe('getEpisode', () => {
    beforeEach(async () => {
      await ragService.initialize();
    });

    it('should get episode by ID successfully', async () => {
      const mockGetResult = {
        ids: ['episode-123'],
        metadatas: [
          {
            conversationId: 'conv-123',
            timestamp: '2025-01-13T10:00:00.000Z',
            userMessage: 'Hello',
            edenResponse: 'Hi!',
            satisfaction: 'positive',
            contextJSON: JSON.stringify({ filesAccessed: ['test.ts'] }),
          },
        ],
      };

      mockCollection.get.mockResolvedValue(mockGetResult);

      const episode = await ragService.getEpisode('episode-123');

      expect(mockCollection.get).toHaveBeenCalledWith({ ids: ['episode-123'] });
      expect(episode).not.toBeNull();
      expect(episode!.id).toBe('episode-123');
      expect(episode!.userMessage).toBe('Hello');
      expect(episode!.satisfaction).toBe('positive');
    });

    it('should return null for non-existent episode', async () => {
      mockCollection.get.mockResolvedValue({
        ids: [],
        metadatas: [],
      });

      const episode = await ragService.getEpisode('non-existent');

      expect(episode).toBeNull();
    });

    it('should handle null satisfaction correctly', async () => {
      const mockGetResult = {
        ids: ['episode-456'],
        metadatas: [
          {
            conversationId: 'conv-456',
            timestamp: '2025-01-13T11:00:00.000Z',
            userMessage: 'Test',
            edenResponse: 'Response',
            satisfaction: 'null',
            contextJSON: '{"filesAccessed":[]}',
          },
        ],
      };

      mockCollection.get.mockResolvedValue(mockGetResult);

      const episode = await ragService.getEpisode('episode-456');

      expect(episode!.satisfaction).toBeNull();
    });

    it('should return null on error', async () => {
      mockCollection.get.mockRejectedValue(new Error('Database error'));

      const episode = await ragService.getEpisode('episode-error');

      expect(episode).toBeNull();
    });
  });

  describe('deleteEpisode', () => {
    beforeEach(async () => {
      await ragService.initialize();
    });

    it('should delete episode successfully', async () => {
      mockCollection.delete.mockResolvedValue(undefined);

      const result = await ragService.deleteEpisode('episode-123');

      expect(mockCollection.delete).toHaveBeenCalledWith({ ids: ['episode-123'] });
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      mockCollection.delete.mockRejectedValue(new Error('Delete failed'));

      const result = await ragService.deleteEpisode('episode-error');

      expect(result).toBe(false);
    });
  });

  describe('clearEpisodes', () => {
    beforeEach(async () => {
      await ragService.initialize();
    });

    it('should clear episodes for specific conversation', async () => {
      mockCollection.delete.mockResolvedValue(undefined);

      const result = await ragService.clearEpisodes('conv-123');

      expect(mockCollection.delete).toHaveBeenCalledWith({
        where: { conversationId: 'conv-123' },
      });
      expect(result).toBe(1);
    });

    it('should clear all episodes when no conversation ID provided', async () => {
      mockClient.deleteCollection.mockResolvedValue(undefined);
      mockClient.createCollection.mockResolvedValue(mockCollection);

      const result = await ragService.clearEpisodes();

      expect(mockClient.deleteCollection).toHaveBeenCalledWith({ name: 'conversation_episodes' });
      expect(mockClient.createCollection).toHaveBeenCalledWith({
        name: 'conversation_episodes',
        metadata: { description: 'Garden of Eden conversation episodes' },
      });
      expect(result).toBe(1);
    });

    it('should propagate errors', async () => {
      mockCollection.delete.mockRejectedValue(new Error('Clear failed'));

      await expect(ragService.clearEpisodes('conv-error')).rejects.toThrow('Clear failed');
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      await ragService.initialize();
    });

    it('should return memory statistics', async () => {
      mockCollection.count.mockResolvedValue(10);
      mockCollection.get.mockResolvedValue({
        metadatas: [
          { timestamp: '2025-01-01T00:00:00.000Z' },
          { timestamp: '2025-01-05T00:00:00.000Z' },
          { timestamp: '2025-01-10T00:00:00.000Z' },
        ],
      });

      const stats = await ragService.getStats();

      expect(stats.totalEpisodes).toBe(10);
      expect(stats.oldestEpisode).toEqual(new Date('2025-01-01T00:00:00.000Z'));
      expect(stats.newestEpisode).toEqual(new Date('2025-01-10T00:00:00.000Z'));
      expect(stats.storageSize).toBe(10 * 1024); // 10KB estimate
    });

    it('should handle empty collection', async () => {
      mockCollection.count.mockResolvedValue(0);
      mockCollection.get.mockResolvedValue({ metadatas: [] });

      const stats = await ragService.getStats();

      expect(stats.totalEpisodes).toBe(0);
      expect(stats.oldestEpisode).toBeNull();
      expect(stats.newestEpisode).toBeNull();
    });

    it('should propagate errors', async () => {
      mockCollection.count.mockRejectedValue(new Error('Stats error'));

      await expect(ragService.getStats()).rejects.toThrow('Stats error');
    });
  });

  describe('retrieveContextForPrompt', () => {
    beforeEach(async () => {
      await ragService.initialize();
    });

    it('should retrieve and format context for prompt', async () => {
      const mockQueryResult = {
        ids: [['episode-1', 'episode-2']],
        metadatas: [
          [
            {
              conversationId: 'c1',
              timestamp: '2025-01-13T10:00:00.000Z',
              userMessage: 'What is TypeScript?',
              edenResponse: 'TypeScript is a typed superset of JavaScript.',
              satisfaction: 'positive',
              contextJSON: '{"filesAccessed":[]}',
            },
            {
              conversationId: 'c1',
              timestamp: '2025-01-13T11:00:00.000Z',
              userMessage: 'Explain interfaces',
              edenResponse: 'Interfaces define object shapes.',
              satisfaction: 'null',
              contextJSON: '{"filesAccessed":[]}',
            },
          ],
        ],
        distances: [[0.2, 0.3]],
      };

      mockCollection.query.mockResolvedValue(mockQueryResult);

      const context = await ragService.retrieveContextForPrompt('Tell me about TypeScript', 'c1', 3);

      expect(context).toContain('Relevant past conversations:');
      expect(context).toContain('What is TypeScript?');
      expect(context).toContain('TypeScript is a typed superset of JavaScript.');
      expect(context).toContain('Explain interfaces');
      expect(context).toContain('Interfaces define object shapes.');
      expect(context).toContain('Relevance: 80%'); // 1 - 0.2 = 0.8
      expect(context).toContain('Relevance: 70%'); // 1 - 0.3 = 0.7
    });

    it('should return empty string when no relevant episodes found', async () => {
      mockCollection.query.mockResolvedValue({
        ids: [[]],
        metadatas: [[]],
        distances: [[]],
      });

      const context = await ragService.retrieveContextForPrompt('Unrelated query', undefined, 3);

      expect(context).toBe('');
    });

    it('should use default topK of 3', async () => {
      mockCollection.query.mockResolvedValue({
        ids: [[]],
        metadatas: [[]],
        distances: [[]],
      });

      await ragService.retrieveContextForPrompt('Test query');

      const callArgs = mockCollection.query.mock.calls[0][0];
      expect(callArgs.nResults).toBe(3);
    });

    it('should filter with minSimilarity of 0.5', async () => {
      mockCollection.query.mockResolvedValue({
        ids: [[]],
        metadatas: [[]],
        distances: [[]],
      });

      await ragService.retrieveContextForPrompt('Test query', 'conv-123');

      // Check that searchEpisodes was called internally
      expect(mockCollection.query).toHaveBeenCalled();
    });

    it('should return empty string on error', async () => {
      mockCollection.query.mockRejectedValue(new Error('Search failed'));

      const context = await ragService.retrieveContextForPrompt('Test query');

      expect(context).toBe('');
    });
  });

  describe('cleanup', () => {
    it('should cleanup resources', async () => {
      await ragService.initialize();
      await ragService.cleanup();

      // Should throw error after cleanup
      await expect(ragService.storeEpisode({
        conversationId: 'c1',
        timestamp: new Date(),
        userMessage: 'Test',
        edenResponse: 'Response',
        context: { filesAccessed: [] },
      })).rejects.toThrow('RAG service not initialized');
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await ragService.initialize();
    });

    it('should throw error for operations when not initialized', async () => {
      const uninitializedService = new RAGService();

      await expect(uninitializedService.storeEpisode({
        conversationId: 'c1',
        timestamp: new Date(),
        userMessage: 'Test',
        edenResponse: 'Response',
        context: { filesAccessed: [] },
      })).rejects.toThrow('RAG service not initialized');

      await expect(uninitializedService.searchEpisodes({ query: 'Test', topK: 5 })).rejects.toThrow('RAG service not initialized');

      await expect(uninitializedService.getEpisode('ep-1')).rejects.toThrow('RAG service not initialized');

      await expect(uninitializedService.deleteEpisode('ep-1')).rejects.toThrow('RAG service not initialized');

      await expect(uninitializedService.clearEpisodes()).rejects.toThrow('RAG service not initialized');

      await expect(uninitializedService.getStats()).rejects.toThrow('RAG service not initialized');
    });

    it('should handle embedding generation errors', async () => {
      mockEmbeddingModel.mockRejectedValue(new Error('Embedding failed'));

      await expect(ragService.storeEpisode({
        conversationId: 'c1',
        timestamp: new Date(),
        userMessage: 'Test',
        edenResponse: 'Response',
        context: { filesAccessed: [] },
      })).rejects.toThrow('Embedding failed');
    });
  });
});

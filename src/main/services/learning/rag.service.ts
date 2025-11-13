/**
 * RAG (Retrieval-Augmented Generation) Service
 * Manages episodic memory using ChromaDB for semantic search
 */

import { ChromaClient, Collection } from 'chromadb';
import log from 'electron-log';
import type {
  ConversationEpisode,
  RetrievedEpisode,
  MemorySearchRequest,
  MemorySearchResult,
  MemoryStats,
  EpisodeContext,
} from '@shared/types/memory.types';

// Dynamic import for ESM module
type FeatureExtractionPipeline = any;

export class RAGService {
  private client: ChromaClient | null = null;
  private collection: Collection | null = null;
  private embeddingModel: FeatureExtractionPipeline | null = null;
  private readonly collectionName = 'conversation_episodes';
  private readonly embeddingModelName = 'Xenova/all-MiniLM-L6-v2';
  private isInitialized = false;

  /**
   * Initialize ChromaDB and embedding model
   */
  async initialize(): Promise<void> {
    try {
      log.info('Initializing RAG service...');

      // Initialize ChromaDB client
      this.client = new ChromaClient({
        path: 'http://localhost:8000', // ChromaDB default port
      });

      // Check if collection exists, create if not
      try {
        this.collection = await this.client.getOrCreateCollection({
          name: this.collectionName,
          metadata: { description: 'Garden of Eden conversation episodes' },
        });
        log.info('Connected to ChromaDB collection');
      } catch (error) {
        log.error('Failed to get/create collection', error);
        throw error;
      }

      // Initialize embedding model (dynamic import for ESM)
      log.info('Loading embedding model...');
      const { pipeline } = await import('@xenova/transformers');
      this.embeddingModel = await pipeline('feature-extraction', this.embeddingModelName);
      log.info('Embedding model loaded');

      this.isInitialized = true;
      log.info('RAG service initialized successfully');
    } catch (error) {
      log.error('Failed to initialize RAG service', error);
      throw new Error('RAG service initialization failed: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  /**
   * Ensure service is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.collection || !this.embeddingModel) {
      throw new Error('RAG service not initialized. Call initialize() first.');
    }
  }

  /**
   * Generate embedding for text using Transformers.js
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    this.ensureInitialized();

    try {
      // Generate embedding
      const output = await this.embeddingModel!(text, {
        pooling: 'mean',
        normalize: true,
      });

      // Extract embedding array
      const embedding = Array.from(output.data as Float32Array);

      return embedding;
    } catch (error) {
      log.error('Failed to generate embedding', error);
      throw error;
    }
  }

  /**
   * Store conversation episode in vector database
   */
  async storeEpisode(episode: Omit<ConversationEpisode, 'id' | 'embedding'>): Promise<string> {
    this.ensureInitialized();

    try {
      log.info('Storing episode in RAG memory');

      // Generate unique ID
      const episodeId = `episode-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Combine user message and response for embedding
      const textToEmbed = `User: ${episode.userMessage}\nEden: ${episode.edenResponse}`;

      // Generate embedding
      const embedding = await this.generateEmbedding(textToEmbed);

      // Prepare metadata
      const metadata = {
        conversationId: episode.conversationId,
        timestamp: episode.timestamp.toISOString(),
        userMessage: episode.userMessage,
        edenResponse: episode.edenResponse,
        satisfaction: episode.satisfaction || 'null',
        contextJSON: JSON.stringify(episode.context),
      };

      // Store in ChromaDB
      await this.collection!.add({
        ids: [episodeId],
        embeddings: [embedding],
        metadatas: [metadata],
        documents: [textToEmbed],
      });

      log.info('Episode stored successfully', { episodeId });

      return episodeId;
    } catch (error) {
      log.error('Failed to store episode', error);
      throw error;
    }
  }

  /**
   * Search for relevant episodes using semantic similarity
   */
  async searchEpisodes(request: MemorySearchRequest): Promise<MemorySearchResult> {
    this.ensureInitialized();

    const startTime = Date.now();

    try {
      log.info('Searching episodes', { query: request.query, topK: request.topK });

      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(request.query);

      // Build where filter
      const where: Record<string, unknown> = {};
      if (request.conversationId) {
        where.conversationId = request.conversationId;
      }
      if (request.timeRange) {
        where.timestamp = {
          $gte: request.timeRange.start.toISOString(),
          $lte: request.timeRange.end.toISOString(),
        };
      }

      // Query ChromaDB
      const results = await this.collection!.query({
        queryEmbeddings: [queryEmbedding],
        nResults: request.topK || 5,
        where: Object.keys(where).length > 0 ? where : undefined,
      });

      // Parse results
      const episodes: RetrievedEpisode[] = [];

      if (results.ids && results.ids[0] && results.metadatas && results.distances) {
        for (let i = 0; i < results.ids[0].length; i++) {
          const id = results.ids[0][i];
          const metadata = results.metadatas[0][i] as any;
          const distance = results.distances[0][i];

          // Convert distance to similarity (ChromaDB uses cosine distance)
          const similarity = 1 - distance;

          // Skip if below minimum similarity threshold
          if (request.minSimilarity && similarity < request.minSimilarity) {
            continue;
          }

          // Parse context JSON
          let context: EpisodeContext = { filesAccessed: [] };
          try {
            context = JSON.parse(metadata.contextJSON);
          } catch {
            log.warn('Failed to parse episode context');
          }

          episodes.push({
            id,
            conversationId: metadata.conversationId,
            timestamp: new Date(metadata.timestamp),
            userMessage: metadata.userMessage,
            edenResponse: metadata.edenResponse,
            satisfaction: metadata.satisfaction === 'null' ? null : metadata.satisfaction,
            context,
            similarity,
            relevanceScore: similarity * 100,
          });
        }
      }

      const searchTime = Date.now() - startTime;

      log.info('Search completed', {
        found: episodes.length,
        searchTime: `${searchTime}ms`,
      });

      return {
        episodes,
        totalFound: episodes.length,
        searchTime,
      };
    } catch (error) {
      log.error('Failed to search episodes', error);
      throw error;
    }
  }

  /**
   * Get episode by ID
   */
  async getEpisode(episodeId: string): Promise<ConversationEpisode | null> {
    this.ensureInitialized();

    try {
      const result = await this.collection!.get({
        ids: [episodeId],
      });

      if (!result.ids || result.ids.length === 0 || !result.metadatas) {
        return null;
      }

      const metadata = result.metadatas[0] as any;

      // Parse context
      let context: EpisodeContext = { filesAccessed: [] };
      try {
        context = JSON.parse(metadata.contextJSON);
      } catch {
        log.warn('Failed to parse episode context');
      }

      return {
        id: result.ids[0],
        conversationId: metadata.conversationId,
        timestamp: new Date(metadata.timestamp),
        userMessage: metadata.userMessage,
        edenResponse: metadata.edenResponse,
        satisfaction: metadata.satisfaction === 'null' ? null : metadata.satisfaction,
        context,
      };
    } catch (error) {
      log.error('Failed to get episode', error);
      return null;
    }
  }

  /**
   * Delete episode by ID
   */
  async deleteEpisode(episodeId: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      await this.collection!.delete({
        ids: [episodeId],
      });

      log.info('Episode deleted', { episodeId });
      return true;
    } catch (error) {
      log.error('Failed to delete episode', error);
      return false;
    }
  }

  /**
   * Clear all episodes (or for specific conversation)
   */
  async clearEpisodes(conversationId?: string): Promise<number> {
    this.ensureInitialized();

    try {
      if (conversationId) {
        // Delete by conversation ID
        await this.collection!.delete({
          where: { conversationId },
        });

        log.info('Episodes cleared for conversation', { conversationId });
      } else {
        // Delete all by recreating collection
        await this.client!.deleteCollection({ name: this.collectionName });
        this.collection = await this.client!.createCollection({
          name: this.collectionName,
          metadata: { description: 'Garden of Eden conversation episodes' },
        });

        log.info('All episodes cleared');
      }

      return 1; // ChromaDB doesn't return delete count easily
    } catch (error) {
      log.error('Failed to clear episodes', error);
      throw error;
    }
  }

  /**
   * Get memory statistics
   */
  async getStats(): Promise<MemoryStats> {
    this.ensureInitialized();

    try {
      const count = await this.collection!.count();

      // Get all episodes to calculate stats (not efficient for large datasets)
      const allEpisodes = await this.collection!.get({});

      let oldestEpisode: Date | null = null;
      let newestEpisode: Date | null = null;

      if (allEpisodes.metadatas && allEpisodes.metadatas.length > 0) {
        const timestamps = allEpisodes.metadatas
          .map((m: any) => new Date(m.timestamp))
          .sort((a, b) => a.getTime() - b.getTime());

        oldestEpisode = timestamps[0];
        newestEpisode = timestamps[timestamps.length - 1];
      }

      return {
        totalEpisodes: count,
        oldestEpisode,
        newestEpisode,
        averageSimilarity: 0, // Would need to compute this with sample queries
        storageSize: count * 1024, // Rough estimate (1KB per episode)
      };
    } catch (error) {
      log.error('Failed to get stats', error);
      throw error;
    }
  }

  /**
   * Retrieve relevant context for AI prompt
   * This is the key RAG function - inject memory into LLM context
   */
  async retrieveContextForPrompt(
    userMessage: string,
    conversationId?: string,
    topK: number = 3
  ): Promise<string> {
    try {
      const searchResult = await this.searchEpisodes({
        query: userMessage,
        topK,
        minSimilarity: 0.5, // Only include if >50% similar
        conversationId,
      });

      if (searchResult.episodes.length === 0) {
        return '';
      }

      // Format retrieved episodes into prompt context
      let context = '\n\n---\nRelevant past conversations:\n\n';

      searchResult.episodes.forEach((episode, index) => {
        context += `[Episode ${index + 1} - ${episode.timestamp.toLocaleDateString()} - Relevance: ${Math.round(episode.relevanceScore)}%]\n`;
        context += `User: ${episode.userMessage}\n`;
        context += `Eden: ${episode.edenResponse}\n\n`;
      });

      context += '---\n\n';

      return context;
    } catch (error) {
      log.error('Failed to retrieve context for prompt', error);
      return '';
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    log.info('Cleaning up RAG service');

    // ChromaDB client doesn't need explicit cleanup
    this.client = null;
    this.collection = null;
    this.embeddingModel = null;
    this.isInitialized = false;
  }
}

// Singleton instance
let ragServiceInstance: RAGService | null = null;

export function getRAGService(): RAGService {
  if (!ragServiceInstance) {
    ragServiceInstance = new RAGService();
  }
  return ragServiceInstance;
}

export async function initializeRAGService(): Promise<void> {
  const service = getRAGService();
  if (!service) {
    throw new Error('Failed to get RAG service instance');
  }
  await service.initialize();
}

export async function cleanupRAGService(): Promise<void> {
  if (ragServiceInstance) {
    await ragServiceInstance.cleanup();
    ragServiceInstance = null;
  }
}

/**
 * RAG (Retrieval-Augmented Generation) Service
 * Manages episodic memory using BGE-M3 embeddings and LanceDB vector database
 */

import log from 'electron-log';
import { getEmbeddingService, type EmbeddingVector } from '../ai/embedding.service';
import { getLanceDBService, type LanceDBEpisode } from '../storage/lancedb.service';
import type {
  ConversationEpisode,
  RetrievedEpisode,
  MemorySearchRequest,
  MemorySearchResult,
  MemoryStats,
} from '@shared/types/memory.types';

export class RAGService {
  private embeddingService = getEmbeddingService();
  private lanceDBService = getLanceDBService();
  private isInitialized = false;

  /**
   * Initialize RAG service with BGE-M3 and LanceDB
   */
  async initialize(): Promise<void> {
    try {
      log.info('Initializing RAG service with BGE-M3 and LanceDB...');

      // Initialize embedding service
      await this.embeddingService.initialize();

      // Initialize LanceDB
      await this.lanceDBService.initialize();

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
    if (!this.isInitialized) {
      throw new Error('RAG service not initialized. Call initialize() first.');
    }
  }

  /**
   * Store conversation episode in memory
   */
  async storeEpisode(episode: ConversationEpisode): Promise<string> {
    this.ensureInitialized();

    try {
      log.info(`Storing episode: ${episode.id}`);

      // Create searchable text from episode
      const searchableText = this.createSearchableText(episode);

      // Generate embedding using BGE-M3
      const embeddingVector = await this.embeddingService.embed(searchableText);

      // Convert to LanceDB format
      const lanceDBEpisode: LanceDBEpisode = {
        id: episode.id,
        conversationId: episode.conversationId,
        userMessage: episode.userMessage,
        assistantResponse: episode.edenResponse,
        context: JSON.stringify(episode.context),
        vector: embeddingVector.values,
        timestamp: episode.timestamp.getTime(),
        satisfaction: episode.satisfaction || null,
      };

      // Store in LanceDB
      await this.lanceDBService.addEpisode(lanceDBEpisode);

      log.info(`Episode ${episode.id} stored successfully`);
      return episode.id;
    } catch (error) {
      log.error('Failed to store episode:', error);
      throw error;
    }
  }

  /**
   * Search for relevant episodes using cosine similarity
   */
  async searchEpisodes(request: MemorySearchRequest): Promise<MemorySearchResult> {
    this.ensureInitialized();

    try {
      const { query, topK = 5, minSimilarity = 0.7, conversationId, timeRange } = request;

      log.info(`Searching episodes for query: "${query.substring(0, 50)}..."`);

      // Generate query embedding
      const queryEmbedding = await this.embeddingService.embed(query);

      // Search in LanceDB
      const searchResults = await this.lanceDBService.searchSimilar(queryEmbedding, {
        topK,
        minSimilarity,
        conversationId,
        timeRange: timeRange
          ? {
              start: timeRange.start.getTime(),
              end: timeRange.end.getTime(),
            }
          : undefined,
      });

      // Convert to RetrievedEpisode format
      const retrievedEpisodes: RetrievedEpisode[] = searchResults.map((result) => ({
        id: result.episode.id,
        conversationId: result.episode.conversationId,
        userMessage: result.episode.userMessage,
        edenResponse: result.episode.assistantResponse,
        context: JSON.parse(result.episode.context),
        timestamp: new Date(result.episode.timestamp),
        similarity: result.similarity,
        relevanceScore: result.similarity, // Same as similarity for now
        satisfaction: result.episode.satisfaction as 'positive' | 'negative' | null | undefined,
      }));

      log.info(`Found ${retrievedEpisodes.length} relevant episodes`);

      return {
        episodes: retrievedEpisodes,
        totalFound: retrievedEpisodes.length,
        searchTime: 0, // TODO: Add timing
      };
    } catch (error) {
      log.error('Failed to search episodes:', error);
      throw error;
    }
  }

  /**
   * Get episode by ID
   */
  async getEpisode(episodeId: string): Promise<ConversationEpisode | null> {
    this.ensureInitialized();

    try {
      const lanceDBEpisode = await this.lanceDBService.getEpisode(episodeId);

      if (!lanceDBEpisode) {
        return null;
      }

      return {
        id: lanceDBEpisode.id,
        conversationId: lanceDBEpisode.conversationId,
        userMessage: lanceDBEpisode.userMessage,
        edenResponse: lanceDBEpisode.assistantResponse,
        context: JSON.parse(lanceDBEpisode.context),
        timestamp: new Date(lanceDBEpisode.timestamp),
        satisfaction: lanceDBEpisode.satisfaction as 'positive' | 'negative' | null | undefined,
      };
    } catch (error) {
      log.error('Failed to get episode:', error);
      return null;
    }
  }

  /**
   * Delete episode by ID
   */
  async deleteEpisode(episodeId: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      const success = await this.lanceDBService.deleteEpisode(episodeId);
      log.info(`Episode ${episodeId} deleted: ${success}`);
      return success;
    } catch (error) {
      log.error('Failed to delete episode:', error);
      return false;
    }
  }

  /**
   * Clear all episodes (optionally filtered by conversation)
   */
  async clearEpisodes(conversationId?: string): Promise<{ deletedCount: number }> {
    this.ensureInitialized();

    try {
      const result = await this.lanceDBService.clearEpisodes(conversationId);
      log.info(`Cleared ${result.deletedCount} episodes`);
      return result;
    } catch (error) {
      log.error('Failed to clear episodes:', error);
      throw error;
    }
  }

  /**
   * Get memory statistics
   */
  async getStats(): Promise<MemoryStats> {
    this.ensureInitialized();

    try {
      const stats = await this.lanceDBService.getStats();

      return {
        totalEpisodes: stats.totalEpisodes,
        conversationCount: stats.conversationCount,
        avgRelevanceScore: stats.avgSatisfaction,
        storageSize: stats.totalEpisodes * 1024, // Rough estimate
        oldestEpisode: stats.oldestEpisode ? new Date(stats.oldestEpisode) : null,
        newestEpisode: stats.newestEpisode ? new Date(stats.newestEpisode) : null,
        averageSimilarity: stats.avgSatisfaction,
      };
    } catch (error) {
      log.error('Failed to get stats:', error);
      throw error;
    }
  }

  /**
   * Create searchable text from episode
   */
  private createSearchableText(episode: ConversationEpisode): string {
    const parts = [episode.userMessage, episode.edenResponse];

    // Add context information
    if (episode.context) {
      if (episode.context.screenContext) {
        parts.push(episode.context.screenContext.description || '');
      }
      if (episode.context.workspaceInfo) {
        parts.push(JSON.stringify(episode.context.workspaceInfo));
      }
      if (episode.context.filesAccessed) {
        parts.push(episode.context.filesAccessed.join(' '));
      }
    }

    return parts.join(' ');
  }

  /**
   * Find similar episodes to a given episode (for recommendation)
   */
  async findSimilarEpisodes(episodeId: string, topK: number = 5): Promise<RetrievedEpisode[]> {
    this.ensureInitialized();

    try {
      // Get source episode
      const sourceEpisode = await this.lanceDBService.getEpisode(episodeId);
      if (!sourceEpisode) {
        return [];
      }

      // Create embedding vector from stored vector
      const sourceEmbedding: EmbeddingVector = {
        values: sourceEpisode.vector,
        dimensions: sourceEpisode.vector.length,
      };

      // Search for similar episodes
      const searchResults = await this.lanceDBService.searchSimilar(sourceEmbedding, {
        topK: topK + 1, // Get one extra to exclude the source episode
        minSimilarity: 0.5,
      });

      // Filter out the source episode and convert to RetrievedEpisode format
      const retrievedEpisodes: RetrievedEpisode[] = searchResults
        .filter((result) => result.episode.id !== episodeId)
        .slice(0, topK)
        .map((result) => ({
          id: result.episode.id,
          conversationId: result.episode.conversationId,
          userMessage: result.episode.userMessage,
          edenResponse: result.episode.assistantResponse,
          context: JSON.parse(result.episode.context),
          timestamp: new Date(result.episode.timestamp),
          similarity: result.similarity,
          relevanceScore: result.similarity,
          satisfaction: result.episode.satisfaction as 'positive' | 'negative' | null | undefined,
        }));

      return retrievedEpisodes;
    } catch (error) {
      log.error('Failed to find similar episodes:', error);
      return [];
    }
  }

  /**
   * Update episode satisfaction
   */
  async updateSatisfaction(episodeId: string, satisfaction: 'positive' | 'negative'): Promise<boolean> {
    this.ensureInitialized();

    try {
      const success = await this.lanceDBService.updateSatisfaction(episodeId, satisfaction);
      log.info(`Updated satisfaction for episode ${episodeId}: ${satisfaction}`);
      return success;
    } catch (error) {
      log.error('Failed to update satisfaction:', error);
      return false;
    }
  }

  /**
   * Get embedding service status
   */
  getStatus(): { isInitialized: boolean; embeddingModel: string; episodesCount: number } {
    return {
      isInitialized: this.isInitialized,
      embeddingModel: 'BGE-M3',
      episodesCount: 0, // Would require async call
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.lanceDBService.cleanup();
      await this.embeddingService.cleanup();
      this.isInitialized = false;
      log.info('RAG service cleaned up');
    } catch (error) {
      log.error('Error cleaning up RAG service:', error);
    }
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
  await service.initialize();
}

export async function cleanupRAGService(): Promise<void> {
  if (ragServiceInstance) {
    await ragServiceInstance.cleanup();
    ragServiceInstance = null;
  }
}

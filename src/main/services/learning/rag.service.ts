/**
 * RAG (Retrieval-Augmented Generation) Service
 * Manages episodic memory using BGE-M3 embeddings and cosine similarity
 */

import log from 'electron-log';
import { getEmbeddingService, type EmbeddingVector, type SimilarityResult } from '../ai/embedding.service';
import { getDatabase } from '../../database';
import type {
  ConversationEpisode,
  RetrievedEpisode,
  MemorySearchRequest,
  MemorySearchResult,
  MemoryStats,
  EpisodeContext,
} from '@shared/types/memory.types';

interface StoredEpisode {
  id: string;
  conversationId: string;
  userMessage: string;
  edenResponse: string;
  context: EpisodeContext;
  embedding: number[];
  timestamp: Date;
  satisfaction?: 'positive' | 'negative' | null;
}

export class RAGService {
  private embeddingService = getEmbeddingService();
  private episodes: StoredEpisode[] = [];
  private isInitialized = false;

  /**
   * Initialize RAG service with BGE-M3
   */
  async initialize(): Promise<void> {
    try {
      log.info('Initializing RAG service with BGE-M3...');

      // Initialize embedding service
      await this.embeddingService.initialize();

      // Load existing episodes from database
      await this.loadEpisodesFromDatabase();

      this.isInitialized = true;
      log.info('RAG service initialized successfully');
    } catch (error) {
      log.error('Failed to initialize RAG service', error);
      throw new Error('RAG service initialization failed: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  /**
   * Load episodes from database
   */
  private async loadEpisodesFromDatabase(): Promise<void> {
    try {
      const db = getDatabase();
      const rows = db.prepare(`
        SELECT
          id,
          conversation_id as conversationId,
          user_message as userMessage,
          assistant_response as assistantResponse,
          context,
          embedding,
          timestamp,
          satisfaction
        FROM episodes
        ORDER BY timestamp DESC
        LIMIT 1000
      `).all() as any[];

      this.episodes = rows.map(row => ({
        ...row,
        context: JSON.parse(row.context),
        embedding: JSON.parse(row.embedding),
      }));

      log.info(`Loaded ${this.episodes.length} episodes from database`);
    } catch (error) {
      log.error('Failed to load episodes from database:', error);
      // Don't throw - allow service to continue with empty episodes
      this.episodes = [];
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

      // Store in database
      const db = getDatabase();
      db.prepare(`
        INSERT OR REPLACE INTO episodes (
          id,
          conversation_id,
          user_message,
          assistant_response,
          context,
          embedding,
          timestamp,
          satisfaction
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        episode.id,
        episode.conversationId,
        episode.userMessage,
        episode.assistantResponse,
        JSON.stringify(episode.context),
        JSON.stringify(embeddingVector.values),
        episode.timestamp,
        episode.satisfaction || null
      );

      // Add to in-memory cache
      this.episodes.push({
        id: episode.id,
        conversationId: episode.conversationId,
        userMessage: episode.userMessage,
        assistantResponse: episode.assistantResponse,
        context: episode.context,
        embedding: embeddingVector.values,
        timestamp: episode.timestamp,
        satisfaction: episode.satisfaction,
      });

      // Keep only recent 1000 episodes in memory
      if (this.episodes.length > 1000) {
        this.episodes.shift();
      }

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

      // Filter episodes by criteria
      let filteredEpisodes = this.episodes;

      if (conversationId) {
        filteredEpisodes = filteredEpisodes.filter(e => e.conversationId === conversationId);
      }

      if (timeRange) {
        filteredEpisodes = filteredEpisodes.filter(
          e => e.timestamp >= timeRange.start.getTime() && e.timestamp <= timeRange.end.getTime()
        );
      }

      // Calculate cosine similarity for each episode
      const results = filteredEpisodes.map(episode => {
        const episodeEmbedding: EmbeddingVector = {
          values: episode.embedding,
          dimensions: episode.embedding.length,
        };

        const similarity = this.embeddingService.cosineSimilarity(queryEmbedding, episodeEmbedding);

        return {
          episode,
          similarity,
        };
      });

      // Filter by minimum similarity
      const filtered = results.filter(r => r.similarity >= minSimilarity);

      // Sort by similarity (descending)
      filtered.sort((a, b) => b.similarity - a.similarity);

      // Take top K
      const topResults = filtered.slice(0, topK);

      // Convert to RetrievedEpisode format
      const retrievedEpisodes: RetrievedEpisode[] = topResults.map(r => ({
        id: r.episode.id,
        conversationId: r.episode.conversationId,
        userMessage: r.episode.userMessage,
        assistantResponse: r.episode.assistantResponse,
        context: r.episode.context,
        timestamp: r.episode.timestamp,
        similarity: r.similarity,
        satisfaction: r.episode.satisfaction,
      }));

      log.info(`Found ${retrievedEpisodes.length} relevant episodes`);

      return {
        episodes: retrievedEpisodes,
        totalFound: filtered.length,
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

    const episode = this.episodes.find(e => e.id === episodeId);

    if (!episode) {
      return null;
    }

    return {
      id: episode.id,
      conversationId: episode.conversationId,
      userMessage: episode.userMessage,
      assistantResponse: episode.assistantResponse,
      context: episode.context,
      timestamp: episode.timestamp,
      satisfaction: episode.satisfaction,
    };
  }

  /**
   * Delete episode by ID
   */
  async deleteEpisode(episodeId: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      // Delete from database
      const db = getDatabase();
      const result = db.prepare('DELETE FROM episodes WHERE id = ?').run(episodeId);

      // Remove from in-memory cache
      const index = this.episodes.findIndex(e => e.id === episodeId);
      if (index !== -1) {
        this.episodes.splice(index, 1);
      }

      log.info(`Episode ${episodeId} deleted`);
      return result.changes > 0;
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
      const db = getDatabase();

      let result;
      if (conversationId) {
        result = db.prepare('DELETE FROM episodes WHERE conversation_id = ?').run(conversationId);
        this.episodes = this.episodes.filter(e => e.conversationId !== conversationId);
      } else {
        result = db.prepare('DELETE FROM episodes').run();
        this.episodes = [];
      }

      log.info(`Cleared ${result.changes} episodes`);
      return { deletedCount: result.changes };
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
      const db = getDatabase();

      const totalEpisodes = (db.prepare('SELECT COUNT(*) as count FROM episodes').get() as any).count;
      const conversationCount = (db.prepare('SELECT COUNT(DISTINCT conversation_id) as count FROM episodes').get() as any).count;

      const avgSimilarityRow = db.prepare(`
        SELECT AVG(CAST(satisfaction AS INTEGER)) as avg
        FROM episodes
        WHERE satisfaction IS NOT NULL
      `).get() as any;

      return {
        totalEpisodes,
        conversationCount,
        avgRelevanceScore: avgSimilarityRow?.avg || 0,
        storageSize: this.episodes.length * 1024, // Rough estimate
        oldestEpisode: this.episodes.length > 0 ? Math.min(...this.episodes.map(e => e.timestamp)) : null,
        newestEpisode: this.episodes.length > 0 ? Math.max(...this.episodes.map(e => e.timestamp)) : null,
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
    const parts = [
      episode.userMessage,
      episode.assistantResponse,
    ];

    // Add context information
    if (episode.context) {
      if (episode.context.screenContext) {
        parts.push(episode.context.screenContext);
      }
      if (episode.context.workspaceContext) {
        parts.push(JSON.stringify(episode.context.workspaceContext));
      }
    }

    return parts.join(' ');
  }

  /**
   * Find similar episodes to a given episode (for recommendation)
   */
  async findSimilarEpisodes(episodeId: string, topK: number = 5): Promise<RetrievedEpisode[]> {
    this.ensureInitialized();

    const sourceEpisode = this.episodes.find(e => e.id === episodeId);
    if (!sourceEpisode) {
      return [];
    }

    const sourceEmbedding: EmbeddingVector = {
      values: sourceEpisode.embedding,
      dimensions: sourceEpisode.embedding.length,
    };

    // Calculate similarity with all other episodes
    const similarities = this.episodes
      .filter(e => e.id !== episodeId)
      .map(episode => {
        const episodeEmbedding: EmbeddingVector = {
          values: episode.embedding,
          dimensions: episode.embedding.length,
        };

        return {
          episode,
          similarity: this.embeddingService.cosineSimilarity(sourceEmbedding, episodeEmbedding),
        };
      });

    // Sort and take top K
    similarities.sort((a, b) => b.similarity - a.similarity);
    const topResults = similarities.slice(0, topK);

    return topResults.map(r => ({
      id: r.episode.id,
      conversationId: r.episode.conversationId,
      userMessage: r.episode.userMessage,
      assistantResponse: r.episode.assistantResponse,
      context: r.episode.context,
      timestamp: r.episode.timestamp,
      similarity: r.similarity,
      satisfaction: r.episode.satisfaction,
    }));
  }

  /**
   * Update episode satisfaction
   */
  async updateSatisfaction(episodeId: string, satisfaction: 'positive' | 'negative'): Promise<boolean> {
    this.ensureInitialized();

    try {
      const db = getDatabase();
      const result = db.prepare('UPDATE episodes SET satisfaction = ? WHERE id = ?').run(satisfaction, episodeId);

      // Update in-memory cache
      const episode = this.episodes.find(e => e.id === episodeId);
      if (episode) {
        episode.satisfaction = satisfaction;
      }

      return result.changes > 0;
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
      episodesCount: this.episodes.length,
    };
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

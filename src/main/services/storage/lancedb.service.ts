/**
 * LanceDB Service
 * Embedded vector database for episodic memory storage and semantic search
 */

import path from 'path';
import { app } from 'electron';
import log from 'electron-log';
import { connect, Connection, Table } from '@lancedb/lancedb';
import type { EmbeddingVector } from '../ai/embedding.service';

export interface LanceDBEpisode {
  id: string;
  conversationId: string;
  userMessage: string;
  assistantResponse: string;
  context: string; // JSON string
  vector: number[]; // 1024-dimensional BGE-M3 embedding
  timestamp: number;
  satisfaction: string | null; // 'positive' | 'negative' | null
}

export interface SearchResult {
  episode: LanceDBEpisode;
  similarity: number;
}

/**
 * LanceDB Service for vector storage and similarity search
 */
export class LanceDBService {
  private db: Connection | null = null;
  private table: Table | null = null;
  private isInitialized = false;
  private dbPath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.dbPath = path.join(userDataPath, 'lancedb');
  }

  /**
   * Initialize LanceDB connection and create table
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      log.info('LanceDB already initialized');
      return;
    }

    try {
      log.info('Initializing LanceDB...');
      log.info(`Database path: ${this.dbPath}`);

      // Connect to LanceDB (creates database if not exists)
      this.db = await connect(this.dbPath);

      // Create or open episodes table
      const tableNames = await this.db.tableNames();

      if (tableNames.includes('episodes')) {
        // Open existing table
        this.table = await this.db.openTable('episodes');
        log.info('Opened existing episodes table');
      } else {
        // Create new table with initial empty data
        this.table = await this.db.createTable('episodes', [
          {
            id: 'init',
            conversationId: 'init',
            userMessage: 'init',
            assistantResponse: 'init',
            context: '{}',
            vector: new Array(1024).fill(0),
            timestamp: Date.now(),
            satisfaction: null,
          },
        ]);

        // Delete the init row
        await this.table.delete('id = "init"');
        log.info('Created new episodes table');
      }

      this.isInitialized = true;
      log.info('LanceDB initialized successfully');
    } catch (error) {
      log.error('Failed to initialize LanceDB:', error);
      throw new Error(`LanceDB initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Ensure service is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.table) {
      throw new Error('LanceDB service not initialized. Call initialize() first.');
    }
  }

  /**
   * Add episode to vector database
   */
  async addEpisode(episode: LanceDBEpisode): Promise<void> {
    this.ensureInitialized();

    try {
      log.info(`Adding episode to LanceDB: ${episode.id}`);

      // Insert episode (cast to any to avoid index signature requirement)
      await this.table!.add([episode as any]);

      log.debug(`Episode ${episode.id} added to LanceDB`);
    } catch (error) {
      log.error('Failed to add episode to LanceDB:', error);
      throw error;
    }
  }

  /**
   * Search for similar episodes using vector similarity
   */
  async searchSimilar(
    queryVector: EmbeddingVector,
    options: {
      topK?: number;
      minSimilarity?: number;
      conversationId?: string;
      timeRange?: { start: number; end: number };
    } = {}
  ): Promise<SearchResult[]> {
    this.ensureInitialized();

    const { topK = 5, minSimilarity = 0.7, conversationId, timeRange } = options;

    try {
      log.info(`Searching similar episodes (topK: ${topK}, minSimilarity: ${minSimilarity})`);

      // Build filter expression
      let filter: string | undefined;
      const filters: string[] = [];

      if (conversationId) {
        filters.push(`conversationId = '${conversationId}'`);
      }

      if (timeRange) {
        filters.push(`timestamp >= ${timeRange.start} AND timestamp <= ${timeRange.end}`);
      }

      if (filters.length > 0) {
        filter = filters.join(' AND ');
      }

      // Perform vector search
      let query = this.table!
        .search(queryVector.values)
        .limit(topK * 2); // Get more results to filter by similarity

      if (filter) {
        query = query.where(filter);
      }

      const results = await query.toArray();

      // Calculate cosine similarity and filter
      const searchResults: SearchResult[] = results
        .map((row: any) => {
          // LanceDB returns _distance (L2 distance), convert to cosine similarity
          // cosine_similarity = 1 - (L2_distance^2 / 2)
          const l2Distance = row._distance || 0;
          const similarity = 1 - (l2Distance * l2Distance) / 2;

          return {
            episode: {
              id: row.id,
              conversationId: row.conversationId,
              userMessage: row.userMessage,
              assistantResponse: row.assistantResponse,
              context: row.context,
              vector: row.vector,
              timestamp: row.timestamp,
              satisfaction: row.satisfaction,
            },
            similarity,
          };
        })
        .filter((result: SearchResult) => result.similarity >= minSimilarity)
        .sort((a: SearchResult, b: SearchResult) => b.similarity - a.similarity)
        .slice(0, topK);

      log.info(`Found ${searchResults.length} similar episodes`);
      return searchResults;
    } catch (error) {
      log.error('Failed to search similar episodes:', error);
      throw error;
    }
  }

  /**
   * Get episode by ID
   */
  async getEpisode(episodeId: string): Promise<LanceDBEpisode | null> {
    this.ensureInitialized();

    try {
      const results = await this.table!
        .search(new Array(1024).fill(0)) // Dummy vector for filtering
        .where(`id = '${episodeId}'`)
        .limit(1)
        .toArray();

      if (results.length === 0) {
        return null;
      }

      const row = results[0];
      return {
        id: row.id,
        conversationId: row.conversationId,
        userMessage: row.userMessage,
        assistantResponse: row.assistantResponse,
        context: row.context,
        vector: row.vector,
        timestamp: row.timestamp,
        satisfaction: row.satisfaction,
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
      await this.table!.delete(`id = '${episodeId}'`);
      log.info(`Episode ${episodeId} deleted from LanceDB`);
      return true;
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
      let filter = 'id IS NOT NULL'; // Match all

      if (conversationId) {
        filter = `conversationId = '${conversationId}'`;
      }

      // Count before deletion
      const beforeCount = await this.table!.countRows();

      // Delete episodes
      await this.table!.delete(filter);

      // Count after deletion
      const afterCount = await this.table!.countRows();
      const deletedCount = beforeCount - afterCount;

      log.info(`Cleared ${deletedCount} episodes from LanceDB`);
      return { deletedCount };
    } catch (error) {
      log.error('Failed to clear episodes:', error);
      throw error;
    }
  }

  /**
   * Update episode satisfaction
   */
  async updateSatisfaction(episodeId: string, satisfaction: 'positive' | 'negative'): Promise<boolean> {
    this.ensureInitialized();

    try {
      // LanceDB doesn't support direct updates, need to delete and re-insert
      const episode = await this.getEpisode(episodeId);

      if (!episode) {
        return false;
      }

      // Update satisfaction
      episode.satisfaction = satisfaction;

      // Delete old entry
      await this.deleteEpisode(episodeId);

      // Add updated entry
      await this.addEpisode(episode);

      log.info(`Updated satisfaction for episode ${episodeId}: ${satisfaction}`);
      return true;
    } catch (error) {
      log.error('Failed to update satisfaction:', error);
      return false;
    }
  }

  /**
   * Get total episode count
   */
  async countEpisodes(conversationId?: string): Promise<number> {
    this.ensureInitialized();

    try {
      if (conversationId) {
        const results = await this.table!
          .search(new Array(1024).fill(0))
          .where(`conversationId = '${conversationId}'`)
          .limit(999999)
          .toArray();
        return results.length;
      }

      return await this.table!.countRows();
    } catch (error) {
      log.error('Failed to count episodes:', error);
      return 0;
    }
  }

  /**
   * Get all episodes (with optional filtering)
   */
  async getAllEpisodes(options: {
    conversationId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<LanceDBEpisode[]> {
    this.ensureInitialized();

    const { conversationId, limit = 1000, offset = 0 } = options;

    try {
      let query = this.table!
        .search(new Array(1024).fill(0)) // Dummy vector for filtering
        .limit(limit);

      if (conversationId) {
        query = query.where(`conversationId = '${conversationId}'`);
      }

      const results = await query.toArray();

      return results.slice(offset).map((row: any) => ({
        id: row.id,
        conversationId: row.conversationId,
        userMessage: row.userMessage,
        assistantResponse: row.assistantResponse,
        context: row.context,
        vector: row.vector,
        timestamp: row.timestamp,
        satisfaction: row.satisfaction,
      }));
    } catch (error) {
      log.error('Failed to get all episodes:', error);
      return [];
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    totalEpisodes: number;
    conversationCount: number;
    oldestEpisode: number | null;
    newestEpisode: number | null;
    avgSatisfaction: number;
  }> {
    this.ensureInitialized();

    try {
      const allEpisodes = await this.getAllEpisodes({ limit: 999999 });

      const totalEpisodes = allEpisodes.length;
      const conversationIds = new Set(allEpisodes.map((e) => e.conversationId));
      const conversationCount = conversationIds.size;

      const timestamps = allEpisodes.map((e) => e.timestamp);
      const oldestEpisode = timestamps.length > 0 ? Math.min(...timestamps) : null;
      const newestEpisode = timestamps.length > 0 ? Math.max(...timestamps) : null;

      const satisfactionScores = allEpisodes
        .filter((e) => e.satisfaction !== null)
        .map((e) => (e.satisfaction === 'positive' ? 1 : 0));

      const avgSatisfaction =
        satisfactionScores.length > 0
          ? satisfactionScores.reduce((a: number, b: number) => a + b, 0) / satisfactionScores.length
          : 0;

      return {
        totalEpisodes,
        conversationCount,
        oldestEpisode,
        newestEpisode,
        avgSatisfaction,
      };
    } catch (error) {
      log.error('Failed to get stats:', error);
      return {
        totalEpisodes: 0,
        conversationCount: 0,
        oldestEpisode: null,
        newestEpisode: null,
        avgSatisfaction: 0,
      };
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    try {
      if (this.db) {
        // LanceDB connection doesn't need explicit cleanup
        this.db = null;
        this.table = null;
      }

      this.isInitialized = false;
      log.info('LanceDB service cleaned up');
    } catch (error) {
      log.error('Error cleaning up LanceDB service:', error);
    }
  }

  /**
   * Get service status
   */
  getStatus(): { isInitialized: boolean; dbPath: string; episodeCount: number } {
    return {
      isInitialized: this.isInitialized,
      dbPath: this.dbPath,
      episodeCount: 0, // Would require async call to get actual count
    };
  }
}

// Singleton instance
let lanceDBServiceInstance: LanceDBService | null = null;

export function getLanceDBService(): LanceDBService {
  if (!lanceDBServiceInstance) {
    lanceDBServiceInstance = new LanceDBService();
  }
  return lanceDBServiceInstance;
}

export async function initializeLanceDBService(): Promise<void> {
  const service = getLanceDBService();
  await service.initialize();
}

export async function cleanupLanceDBService(): Promise<void> {
  if (lanceDBServiceInstance) {
    await lanceDBServiceInstance.cleanup();
    lanceDBServiceInstance = null;
  }
}

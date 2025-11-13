/**
 * Episode Repository
 * Manages episodic memory metadata in SQLite (actual embeddings in ChromaDB)
 */

import Database from 'better-sqlite3';
import { getDatabase } from '../index';
import log from 'electron-log';
import type { ConversationEpisode, EpisodeContext } from '../../../shared/types/memory.types';

export interface EpisodeRow {
  id: string;
  conversation_id: string;
  timestamp: number;
  user_message: string;
  eden_response: string;
  context_json: string;
  satisfaction: string | null;
  chroma_id: string; // Reference to ChromaDB vector ID
}

export class EpisodeRepository {
  private db: Database.Database;

  constructor() {
    this.db = getDatabase();
    this.ensureTable();
  }

  /**
   * Ensure episodes table exists
   */
  private ensureTable(): void {
    try {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS episodes (
          id TEXT PRIMARY KEY,
          conversation_id TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          user_message TEXT NOT NULL,
          eden_response TEXT NOT NULL,
          context_json TEXT NOT NULL,
          satisfaction TEXT,
          chroma_id TEXT NOT NULL,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
          FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_episodes_conversation_id ON episodes(conversation_id);
        CREATE INDEX IF NOT EXISTS idx_episodes_timestamp ON episodes(timestamp);
        CREATE INDEX IF NOT EXISTS idx_episodes_chroma_id ON episodes(chroma_id);
      `);

      log.info('Episodes table ready');
    } catch (error) {
      log.error('Failed to create episodes table', error);
      throw error;
    }
  }

  /**
   * Create a new episode record
   */
  create(episode: Omit<ConversationEpisode, 'embedding'> & { chromaId: string }): ConversationEpisode {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO episodes (
          id, conversation_id, timestamp, user_message,
          eden_response, context_json, satisfaction, chroma_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        episode.id,
        episode.conversationId,
        episode.timestamp.getTime(),
        episode.userMessage,
        episode.edenResponse,
        JSON.stringify(episode.context),
        episode.satisfaction || null,
        episode.chromaId
      );

      log.info('Episode record created', { id: episode.id });

      return {
        id: episode.id,
        conversationId: episode.conversationId,
        timestamp: episode.timestamp,
        userMessage: episode.userMessage,
        edenResponse: episode.edenResponse,
        context: episode.context,
        satisfaction: episode.satisfaction,
      };
    } catch (error) {
      log.error('Failed to create episode record', error);
      throw error;
    }
  }

  /**
   * Find episode by ID
   */
  findById(id: string): ConversationEpisode | null {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM episodes WHERE id = ?
      `);

      const row = stmt.get(id) as EpisodeRow | undefined;

      if (!row) {
        return null;
      }

      return this.mapRowToEpisode(row);
    } catch (error) {
      log.error('Failed to find episode', error);
      throw error;
    }
  }

  /**
   * Find episodes by conversation ID
   */
  findByConversationId(conversationId: string, limit?: number, offset?: number): ConversationEpisode[] {
    try {
      let query = `
        SELECT * FROM episodes
        WHERE conversation_id = ?
        ORDER BY timestamp DESC
      `;

      if (limit !== undefined) {
        query += ` LIMIT ${limit}`;
        if (offset !== undefined) {
          query += ` OFFSET ${offset}`;
        }
      }

      const stmt = this.db.prepare(query);
      const rows = stmt.all(conversationId) as EpisodeRow[];

      return rows.map((row) => this.mapRowToEpisode(row));
    } catch (error) {
      log.error('Failed to find episodes by conversation', error);
      throw error;
    }
  }

  /**
   * Get recent episodes across all conversations
   */
  findRecent(count: number = 50): ConversationEpisode[] {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM episodes
        ORDER BY timestamp DESC
        LIMIT ?
      `);

      const rows = stmt.all(count) as EpisodeRow[];

      return rows.map((row) => this.mapRowToEpisode(row));
    } catch (error) {
      log.error('Failed to find recent episodes', error);
      throw error;
    }
  }

  /**
   * Update episode satisfaction
   */
  updateSatisfaction(id: string, satisfaction: 'positive' | 'negative'): boolean {
    try {
      const stmt = this.db.prepare(`
        UPDATE episodes
        SET satisfaction = ?
        WHERE id = ?
      `);

      const result = stmt.run(satisfaction, id);

      return result.changes > 0;
    } catch (error) {
      log.error('Failed to update episode satisfaction', error);
      throw error;
    }
  }

  /**
   * Delete episode by ID
   */
  delete(id: string): boolean {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM episodes WHERE id = ?
      `);

      const result = stmt.run(id);

      return result.changes > 0;
    } catch (error) {
      log.error('Failed to delete episode', error);
      throw error;
    }
  }

  /**
   * Delete all episodes for a conversation
   */
  deleteByConversationId(conversationId: string): number {
    try {
      const stmt = this.db.prepare(`
        DELETE FROM episodes WHERE conversation_id = ?
      `);

      const result = stmt.run(conversationId);

      log.info('Episodes deleted for conversation', {
        conversationId,
        count: result.changes,
      });

      return result.changes;
    } catch (error) {
      log.error('Failed to delete episodes by conversation', error);
      throw error;
    }
  }

  /**
   * Delete all episodes
   */
  deleteAll(): number {
    try {
      const stmt = this.db.prepare(`DELETE FROM episodes`);
      const result = stmt.run();

      log.info('All episodes deleted', { count: result.changes });

      return result.changes;
    } catch (error) {
      log.error('Failed to delete all episodes', error);
      throw error;
    }
  }

  /**
   * Get total episode count
   */
  count(): number {
    try {
      const stmt = this.db.prepare(`
        SELECT COUNT(*) as count FROM episodes
      `);

      const row = stmt.get() as { count: number };

      return row.count;
    } catch (error) {
      log.error('Failed to count episodes', error);
      throw error;
    }
  }

  /**
   * Get count by conversation ID
   */
  countByConversation(conversationId: string): number {
    try {
      const stmt = this.db.prepare(`
        SELECT COUNT(*) as count
        FROM episodes
        WHERE conversation_id = ?
      `);

      const row = stmt.get(conversationId) as { count: number };

      return row.count;
    } catch (error) {
      log.error('Failed to count episodes by conversation', error);
      throw error;
    }
  }

  /**
   * Get ChromaDB ID for episode
   */
  getChromaId(episodeId: string): string | null {
    try {
      const stmt = this.db.prepare(`
        SELECT chroma_id FROM episodes WHERE id = ?
      `);

      const row = stmt.get(episodeId) as { chroma_id: string } | undefined;

      return row?.chroma_id || null;
    } catch (error) {
      log.error('Failed to get chroma ID', error);
      return null;
    }
  }

  /**
   * Map database row to ConversationEpisode
   */
  private mapRowToEpisode(row: EpisodeRow): ConversationEpisode {
    let context: EpisodeContext = {
      filesAccessed: [],
    };

    try {
      context = JSON.parse(row.context_json);
    } catch (error) {
      log.warn('Failed to parse episode context JSON', { id: row.id });
    }

    return {
      id: row.id,
      conversationId: row.conversation_id,
      timestamp: new Date(row.timestamp),
      userMessage: row.user_message,
      edenResponse: row.eden_response,
      context,
      satisfaction: row.satisfaction as 'positive' | 'negative' | null,
    };
  }
}

// Singleton instance
let episodeRepositoryInstance: EpisodeRepository | null = null;

export function getEpisodeRepository(): EpisodeRepository {
  if (!episodeRepositoryInstance) {
    episodeRepositoryInstance = new EpisodeRepository();
  }
  return episodeRepositoryInstance;
}

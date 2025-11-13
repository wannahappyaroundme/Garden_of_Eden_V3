/**
 * Message Repository
 * Database operations for messages
 */

import { BaseRepository } from './base.repository';
import type { Message, MessageRole } from '../../../shared/types/chat.types';
import { randomUUID } from 'crypto';

interface MessageRow {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  tokens: number | null;
  response_time: number | null;
  context_level: 1 | 2 | 3 | null;
  satisfaction: 'positive' | 'negative' | null;
}

export class MessageRepository extends BaseRepository<MessageRow> {
  /**
   * Create a new message
   */
  create(
    conversationId: string,
    role: MessageRole,
    content: string,
    metadata?: {
      tokens?: number;
      responseTime?: number;
      contextLevel?: 1 | 2 | 3;
    }
  ): Message {
    const id = randomUUID();
    const timestamp = Date.now();

    this.execute(
      `INSERT INTO messages (id, conversation_id, role, content, timestamp, tokens, response_time, context_level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        conversationId,
        role,
        content,
        timestamp,
        metadata?.tokens ?? null,
        metadata?.responseTime ?? null,
        metadata?.contextLevel ?? null,
      ]
    );

    return {
      id,
      conversationId,
      role,
      content,
      timestamp: new Date(timestamp),
      metadata: {
        tokens: metadata?.tokens,
        responseTime: metadata?.responseTime,
        contextLevel: metadata?.contextLevel,
        satisfaction: null,
      },
    };
  }

  /**
   * Find message by ID
   */
  findById(id: string): Message | null {
    const row = this.queryOne<MessageRow>('SELECT * FROM messages WHERE id = ?', [id]);

    if (!row) return null;

    return this.mapRowToMessage(row);
  }

  /**
   * Find messages by conversation ID
   */
  findByConversationId(conversationId: string, limit = 100, offset = 0): Message[] {
    const rows = this.query<MessageRow>(
      'SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC LIMIT ? OFFSET ?',
      [conversationId, limit, offset]
    );

    return rows.map(this.mapRowToMessage);
  }

  /**
   * Get recent messages (for context window)
   */
  getRecentMessages(conversationId: string, count = 10): Message[] {
    const rows = this.query<MessageRow>(
      `SELECT * FROM messages
       WHERE conversation_id = ?
       ORDER BY timestamp DESC
       LIMIT ?`,
      [conversationId, count]
    );

    // Reverse to get chronological order
    return rows.reverse().map(this.mapRowToMessage);
  }

  /**
   * Update message satisfaction feedback
   */
  updateSatisfaction(id: string, satisfaction: 'positive' | 'negative'): boolean {
    const result = this.execute('UPDATE messages SET satisfaction = ? WHERE id = ?', [
      satisfaction,
      id,
    ]);

    return result.changes > 0;
  }

  /**
   * Delete message
   */
  delete(id: string): boolean {
    const result = this.execute('DELETE FROM messages WHERE id = ?', [id]);
    return result.changes > 0;
  }

  /**
   * Delete all messages in a conversation
   */
  deleteByConversationId(conversationId: string): number {
    const result = this.execute('DELETE FROM messages WHERE conversation_id = ?', [
      conversationId,
    ]);
    return result.changes;
  }

  /**
   * Get message count for a conversation
   */
  getCountByConversationId(conversationId: string): number {
    return this.count('messages', 'conversation_id = ?', [conversationId]);
  }

  /**
   * Search messages by content
   */
  search(query: string, limit = 50): Message[] {
    const rows = this.query<MessageRow>(
      'SELECT * FROM messages WHERE content LIKE ? ORDER BY timestamp DESC LIMIT ?',
      [`%${query}%`, limit]
    );

    return rows.map(this.mapRowToMessage);
  }

  /**
   * Get satisfaction statistics
   */
  getSatisfactionStats(conversationId?: string): {
    total: number;
    positive: number;
    negative: number;
    neutral: number;
  } {
    const where = conversationId ? 'WHERE conversation_id = ?' : '';
    const params = conversationId ? [conversationId] : [];

    const rows = this.query<{ satisfaction: string | null; count: number }>(
      `SELECT satisfaction, COUNT(*) as count
       FROM messages
       ${where}
       GROUP BY satisfaction`,
      params
    );

    const stats = {
      total: 0,
      positive: 0,
      negative: 0,
      neutral: 0,
    };

    for (const row of rows) {
      stats.total += row.count;
      if (row.satisfaction === 'positive') {
        stats.positive = row.count;
      } else if (row.satisfaction === 'negative') {
        stats.negative = row.count;
      } else {
        stats.neutral = row.count;
      }
    }

    return stats;
  }

  /**
   * Map database row to Message object
   */
  private mapRowToMessage(row: MessageRow): Message {
    return {
      id: row.id,
      conversationId: row.conversation_id,
      role: row.role,
      content: row.content,
      timestamp: new Date(row.timestamp),
      metadata: {
        tokens: row.tokens ?? undefined,
        responseTime: row.response_time ?? undefined,
        contextLevel: row.context_level ?? undefined,
        satisfaction: row.satisfaction,
      },
    };
  }
}

// Singleton instance
let messageRepositoryInstance: MessageRepository | null = null;

export function getMessageRepository(): MessageRepository {
  if (!messageRepositoryInstance) {
    messageRepositoryInstance = new MessageRepository();
  }
  return messageRepositoryInstance;
}

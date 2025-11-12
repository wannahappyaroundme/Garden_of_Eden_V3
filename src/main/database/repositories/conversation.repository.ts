/**
 * Conversation Repository
 * Database operations for conversations
 */

import { BaseRepository } from './base.repository';
import type { Conversation } from '../../../shared/types/chat.types';
import { randomUUID } from 'crypto';

interface ConversationRow {
  id: string;
  title: string;
  mode: 'user-led' | 'ai-led';
  created_at: number;
  updated_at: number;
  message_count: number;
}

export class ConversationRepository extends BaseRepository<ConversationRow> {
  /**
   * Create a new conversation
   */
  create(title: string, mode: 'user-led' | 'ai-led' = 'user-led'): Conversation {
    const id = randomUUID();
    const now = Date.now();

    this.execute(
      `INSERT INTO conversations (id, title, mode, created_at, updated_at, message_count)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, title, mode, now, now, 0]
    );

    return {
      id,
      title,
      mode,
      createdAt: new Date(now),
      updatedAt: new Date(now),
      messageCount: 0,
    };
  }

  /**
   * Find conversation by ID
   */
  findById(id: string): Conversation | null {
    const row = this.queryOne<ConversationRow>(
      'SELECT * FROM conversations WHERE id = ?',
      [id]
    );

    if (!row) return null;

    return this.mapRowToConversation(row);
  }

  /**
   * Find all conversations
   */
  findAll(limit = 50, offset = 0): Conversation[] {
    const rows = this.query<ConversationRow>(
      'SELECT * FROM conversations ORDER BY updated_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    return rows.map(this.mapRowToConversation);
  }

  /**
   * Update conversation
   */
  update(id: string, updates: Partial<Pick<Conversation, 'title' | 'mode'>>): boolean {
    const setClauses: string[] = [];
    const params: unknown[] = [];

    if (updates.title !== undefined) {
      setClauses.push('title = ?');
      params.push(updates.title);
    }

    if (updates.mode !== undefined) {
      setClauses.push('mode = ?');
      params.push(updates.mode);
    }

    if (setClauses.length === 0) {
      return false;
    }

    setClauses.push('updated_at = ?');
    params.push(Date.now());
    params.push(id);

    const result = this.execute(
      `UPDATE conversations SET ${setClauses.join(', ')} WHERE id = ?`,
      params
    );

    return result.changes > 0;
  }

  /**
   * Increment message count
   */
  incrementMessageCount(id: string): void {
    this.execute(
      'UPDATE conversations SET message_count = message_count + 1, updated_at = ? WHERE id = ?',
      [Date.now(), id]
    );
  }

  /**
   * Delete conversation
   */
  delete(id: string): boolean {
    const result = this.execute('DELETE FROM conversations WHERE id = ?', [id]);
    return result.changes > 0;
  }

  /**
   * Search conversations by title
   */
  search(query: string, limit = 20): Conversation[] {
    const rows = this.query<ConversationRow>(
      'SELECT * FROM conversations WHERE title LIKE ? ORDER BY updated_at DESC LIMIT ?',
      [`%${query}%`, limit]
    );

    return rows.map(this.mapRowToConversation);
  }

  /**
   * Get total count
   */
  getTotalCount(): number {
    return this.count('conversations');
  }

  /**
   * Map database row to Conversation object
   */
  private mapRowToConversation(row: ConversationRow): Conversation {
    return {
      id: row.id,
      title: row.title,
      mode: row.mode,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      messageCount: row.message_count,
    };
  }
}

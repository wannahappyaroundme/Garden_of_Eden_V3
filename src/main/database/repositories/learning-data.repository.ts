/**
 * Learning Data Repository
 * Manages storage and retrieval of learning feedback and persona adjustments
 */

import Database from 'better-sqlite3';
import { getDatabase } from '../index';
import log from 'electron-log';

export interface LearningDataEntry {
  id?: number;
  messageId: string;
  feedback: 'positive' | 'negative';
  personaSnapshot: string; // JSON string of persona parameters at time of feedback
  timestamp: number;
  parameterChanges?: string; // JSON string of which parameters were adjusted
}

export interface LearningStats {
  totalFeedback: number;
  positiveFeedback: number;
  negativeFeedback: number;
  satisfactionRate: number;
  lastFeedbackTime: number | null;
  mostAdjustedParameters: Array<{ parameter: string; adjustmentCount: number }>;
}

export class LearningDataRepository {
  private db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  /**
   * Create a new learning data entry
   */
  create(entry: Omit<LearningDataEntry, 'id'>): LearningDataEntry {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO learning_data (message_id, feedback, persona_snapshot, timestamp, parameter_changes)
        VALUES (?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        entry.messageId,
        entry.feedback,
        entry.personaSnapshot,
        entry.timestamp,
        entry.parameterChanges || null
      );

      log.info('Learning data entry created', { id: result.lastInsertRowid, feedback: entry.feedback });

      return {
        id: result.lastInsertRowid as number,
        ...entry,
      };
    } catch (error) {
      log.error('Failed to create learning data entry', error);
      throw error;
    }
  }

  /**
   * Find learning data entry by ID
   */
  findById(id: number): LearningDataEntry | null {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM learning_data WHERE id = ?
      `);

      const row = stmt.get(id) as any;

      if (!row) {
        return null;
      }

      return {
        id: row.id,
        messageId: row.message_id,
        feedback: row.feedback,
        personaSnapshot: row.persona_snapshot,
        timestamp: row.timestamp,
        parameterChanges: row.parameter_changes,
      };
    } catch (error) {
      log.error('Failed to find learning data entry', error);
      throw error;
    }
  }

  /**
   * Find learning data entries by message ID
   */
  findByMessageId(messageId: string): LearningDataEntry[] {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM learning_data WHERE message_id = ? ORDER BY timestamp DESC
      `);

      const rows = stmt.all(messageId) as any[];

      return rows.map(row => ({
        id: row.id,
        messageId: row.message_id,
        feedback: row.feedback,
        personaSnapshot: row.persona_snapshot,
        timestamp: row.timestamp,
        parameterChanges: row.parameter_changes,
      }));
    } catch (error) {
      log.error('Failed to find learning data by message ID', error);
      throw error;
    }
  }

  /**
   * Get all learning data entries
   */
  findAll(limit?: number, offset?: number): LearningDataEntry[] {
    try {
      let query = `SELECT * FROM learning_data ORDER BY timestamp DESC`;

      if (limit !== undefined) {
        query += ` LIMIT ${limit}`;
        if (offset !== undefined) {
          query += ` OFFSET ${offset}`;
        }
      }

      const stmt = this.db.prepare(query);
      const rows = stmt.all() as any[];

      return rows.map(row => ({
        id: row.id,
        messageId: row.message_id,
        feedback: row.feedback,
        personaSnapshot: row.persona_snapshot,
        timestamp: row.timestamp,
        parameterChanges: row.parameter_changes,
      }));
    } catch (error) {
      log.error('Failed to find all learning data', error);
      throw error;
    }
  }

  /**
   * Get recent learning data entries
   */
  findRecent(count: number = 50): LearningDataEntry[] {
    return this.findAll(count, 0);
  }

  /**
   * Get learning statistics
   */
  getStats(): LearningStats {
    try {
      // Total feedback count
      const totalStmt = this.db.prepare(`SELECT COUNT(*) as count FROM learning_data`);
      const totalRow = totalStmt.get() as any;
      const totalFeedback = totalRow.count;

      // Positive feedback count
      const positiveStmt = this.db.prepare(`SELECT COUNT(*) as count FROM learning_data WHERE feedback = 'positive'`);
      const positiveRow = positiveStmt.get() as any;
      const positiveFeedback = positiveRow.count;

      // Negative feedback count
      const negativeFeedback = totalFeedback - positiveFeedback;

      // Satisfaction rate
      const satisfactionRate = totalFeedback > 0 ? (positiveFeedback / totalFeedback) * 100 : 0;

      // Last feedback time
      const lastFeedbackStmt = this.db.prepare(`SELECT MAX(timestamp) as last_time FROM learning_data`);
      const lastFeedbackRow = lastFeedbackStmt.get() as any;
      const lastFeedbackTime = lastFeedbackRow.last_time;

      // Most adjusted parameters (parse parameter_changes JSON and aggregate)
      const parameterAdjustments: Record<string, number> = {};
      const allEntries = this.findAll();

      allEntries.forEach(entry => {
        if (entry.parameterChanges) {
          try {
            const changes = JSON.parse(entry.parameterChanges);
            Object.keys(changes).forEach(param => {
              parameterAdjustments[param] = (parameterAdjustments[param] || 0) + 1;
            });
          } catch {
            // Ignore parsing errors
          }
        }
      });

      // Sort by adjustment count
      const mostAdjustedParameters = Object.entries(parameterAdjustments)
        .map(([parameter, adjustmentCount]) => ({ parameter, adjustmentCount }))
        .sort((a, b) => b.adjustmentCount - a.adjustmentCount)
        .slice(0, 10); // Top 10

      return {
        totalFeedback,
        positiveFeedback,
        negativeFeedback,
        satisfactionRate,
        lastFeedbackTime,
        mostAdjustedParameters,
      };
    } catch (error) {
      log.error('Failed to get learning stats', error);
      throw error;
    }
  }

  /**
   * Delete learning data entry by ID
   */
  delete(id: number): boolean {
    try {
      const stmt = this.db.prepare(`DELETE FROM learning_data WHERE id = ?`);
      const result = stmt.run(id);

      return result.changes > 0;
    } catch (error) {
      log.error('Failed to delete learning data entry', error);
      throw error;
    }
  }

  /**
   * Delete all learning data
   */
  deleteAll(): number {
    try {
      const stmt = this.db.prepare(`DELETE FROM learning_data`);
      const result = stmt.run();

      log.info('All learning data deleted', { count: result.changes });

      return result.changes;
    } catch (error) {
      log.error('Failed to delete all learning data', error);
      throw error;
    }
  }

  /**
   * Get feedback trend over time
   */
  getFeedbackTrend(days: number = 30): Array<{ date: string; positive: number; negative: number }> {
    try {
      const startTime = Date.now() - days * 24 * 60 * 60 * 1000;

      const stmt = this.db.prepare(`
        SELECT
          DATE(timestamp / 1000, 'unixepoch') as date,
          SUM(CASE WHEN feedback = 'positive' THEN 1 ELSE 0 END) as positive,
          SUM(CASE WHEN feedback = 'negative' THEN 1 ELSE 0 END) as negative
        FROM learning_data
        WHERE timestamp >= ?
        GROUP BY date
        ORDER BY date ASC
      `);

      const rows = stmt.all(startTime) as any[];

      return rows.map(row => ({
        date: row.date,
        positive: row.positive,
        negative: row.negative,
      }));
    } catch (error) {
      log.error('Failed to get feedback trend', error);
      throw error;
    }
  }

  /**
   * Get total count
   */
  count(): number {
    try {
      const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM learning_data`);
      const row = stmt.get() as any;
      return row.count;
    } catch (error) {
      log.error('Failed to count learning data', error);
      throw error;
    }
  }
}

// Singleton instance
let learningDataRepositoryInstance: LearningDataRepository | null = null;

export function getLearningDataRepository(): LearningDataRepository {
  if (!learningDataRepositoryInstance) {
    learningDataRepositoryInstance = new LearningDataRepository();
  }
  return learningDataRepositoryInstance;
}

/**
 * Migration 005: Add Performance Indexes
 * Adds indexes to frequently queried columns for better query performance
 */

import type Database from 'better-sqlite3';
import log from 'electron-log';

export function up(db: Database.Database): void {
  log.info('Running migration 005: Add Performance Indexes');

  try {
    // Messages table indexes
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
      ON messages(conversation_id);

      CREATE INDEX IF NOT EXISTS idx_messages_created_at
      ON messages(created_at DESC);

      CREATE INDEX IF NOT EXISTS idx_messages_role
      ON messages(role);
    `);

    // Conversations table indexes
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_conversations_updated_at
      ON conversations(updated_at DESC);

      CREATE INDEX IF NOT EXISTS idx_conversations_mode
      ON conversations(mode);
    `);

    // Learning data table indexes
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_learning_data_message_id
      ON learning_data(message_id);

      CREATE INDEX IF NOT EXISTS idx_learning_data_timestamp
      ON learning_data(timestamp DESC);

      CREATE INDEX IF NOT EXISTS idx_learning_data_feedback
      ON learning_data(feedback);
    `);

    // Episodes table indexes (if exists)
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_episodes_conversation_id
      ON episodes(conversation_id);

      CREATE INDEX IF NOT EXISTS idx_episodes_timestamp
      ON episodes(timestamp DESC);

      CREATE INDEX IF NOT EXISTS idx_episodes_chroma_id
      ON episodes(chroma_id);
    `);

    log.info('Migration 005 completed successfully');
  } catch (error) {
    log.error('Migration 005 failed', error);
    throw error;
  }
}

export function down(db: Database.Database): void {
  log.info('Rolling back migration 005');

  try {
    // Drop all indexes
    db.exec(`
      DROP INDEX IF EXISTS idx_messages_conversation_id;
      DROP INDEX IF EXISTS idx_messages_created_at;
      DROP INDEX IF EXISTS idx_messages_role;

      DROP INDEX IF EXISTS idx_conversations_updated_at;
      DROP INDEX IF EXISTS idx_conversations_mode;

      DROP INDEX IF EXISTS idx_learning_data_message_id;
      DROP INDEX IF EXISTS idx_learning_data_timestamp;
      DROP INDEX IF EXISTS idx_learning_data_feedback;

      DROP INDEX IF EXISTS idx_episodes_conversation_id;
      DROP INDEX IF EXISTS idx_episodes_timestamp;
      DROP INDEX IF EXISTS idx_episodes_chroma_id;
    `);

    log.info('Migration 005 rollback completed');
  } catch (error) {
    log.error('Migration 005 rollback failed', error);
    throw error;
  }
}

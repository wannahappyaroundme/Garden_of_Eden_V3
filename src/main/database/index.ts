/**
 * Database Connection and Initialization
 */

import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';
import log from 'electron-log';
import { getInitializationStatements, DATABASE_VERSION } from './schema';

let db: Database.Database | null = null;

/**
 * Get database file path
 */
function getDatabasePath(): string {
  const userDataPath = app.getPath('userData');
  const dbDir = path.join(userDataPath, 'database');

  // Ensure directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  return path.join(dbDir, 'eden.db');
}

/**
 * Initialize database connection
 */
export function initializeDatabase(): Database.Database {
  if (db) {
    return db;
  }

  const dbPath = getDatabasePath();
  log.info(`Initializing database at: ${dbPath}`);

  try {
    // Create database connection
    db = new Database(dbPath);

    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Run initialization statements
    const statements = getInitializationStatements();
    const transaction = db.transaction(() => {
      for (const statement of statements) {
        db!.exec(statement);
      }
    });

    transaction();

    // Check/set database version
    const versionResult = db.pragma('user_version', { simple: true }) as number;
    if (versionResult === 0) {
      db.pragma(`user_version = ${DATABASE_VERSION}`);
      log.info(`Database initialized with version ${DATABASE_VERSION}`);
    } else if (versionResult !== DATABASE_VERSION) {
      log.warn(`Database version mismatch: expected ${DATABASE_VERSION}, got ${versionResult}`);
      // TODO: Run migrations if needed
    }

    log.info('Database initialized successfully');
    return db;
  } catch (error) {
    log.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Get database instance
 */
export function getDatabase(): Database.Database {
  if (!db) {
    return initializeDatabase();
  }
  return db;
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  if (db) {
    log.info('Closing database connection');
    db.close();
    db = null;
  }
}

/**
 * Execute a database backup
 */
export async function backupDatabase(backupPath?: string): Promise<string> {
  const database = getDatabase();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const defaultBackupPath = path.join(
    app.getPath('userData'),
    'backups',
    `eden-backup-${timestamp}.db`
  );

  const targetPath = backupPath || defaultBackupPath;
  const backupDir = path.dirname(targetPath);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    database
      .backup(targetPath)
      .then(() => {
        log.info(`Database backed up to: ${targetPath}`);
        resolve(targetPath);
      })
      .catch((error) => {
        log.error('Database backup failed:', error);
        reject(error);
      });
  });
}

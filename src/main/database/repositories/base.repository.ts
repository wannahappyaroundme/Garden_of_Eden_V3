/**
 * Base Repository
 * Generic repository pattern for database operations
 */

import type Database from 'better-sqlite3';
import { getDatabase } from '../index';

export abstract class BaseRepository<T> {
  protected db: Database.Database;

  constructor() {
    this.db = getDatabase();
  }

  /**
   * Execute a query and return all results
   */
  protected query<R = T>(sql: string, params?: unknown[]): R[] {
    const stmt = this.db.prepare(sql);
    return stmt.all(params) as R[];
  }

  /**
   * Execute a query and return the first result
   */
  protected queryOne<R = T>(sql: string, params?: unknown[]): R | undefined {
    const stmt = this.db.prepare(sql);
    return stmt.get(params) as R | undefined;
  }

  /**
   * Execute a statement (INSERT, UPDATE, DELETE)
   */
  protected execute(sql: string, params?: unknown[]): Database.RunResult {
    const stmt = this.db.prepare(sql);
    return stmt.run(params);
  }

  /**
   * Execute multiple statements in a transaction
   */
  protected transaction<R>(fn: () => R): R {
    const txn = this.db.transaction(fn);
    return txn();
  }

  /**
   * Count rows matching a condition
   */
  protected count(tableName: string, where?: string, params?: unknown[]): number {
    const sql = where
      ? `SELECT COUNT(*) as count FROM ${tableName} WHERE ${where}`
      : `SELECT COUNT(*) as count FROM ${tableName}`;

    const result = this.queryOne<{ count: number }>(sql, params);
    return result?.count ?? 0;
  }
}

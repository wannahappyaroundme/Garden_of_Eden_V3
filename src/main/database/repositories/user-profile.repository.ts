/**
 * User Profile Repository
 * Database operations for user profile
 */

import type { Database } from 'better-sqlite3';
import log from 'electron-log';
import type {
  UserProfile,
  CreateUserProfileInput,
  UpdateUserProfileInput,
} from '@shared/types/user-profile.types';
import { parseDisplayName } from '@shared/utils/name-parser';

export class UserProfileRepository {
  constructor(private db: Database) {}

  /**
   * Create a new user profile
   */
  create(input: CreateUserProfileInput): UserProfile {
    const now = Date.now();
    const displayName = parseDisplayName(input.name);

    const stmt = this.db.prepare(`
      INSERT INTO user_profile (
        name,
        display_name,
        selected_persona,
        age_group,
        occupation,
        interests,
        tone_preference,
        proactive_frequency,
        onboarding_completed_at,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      input.name,
      displayName,
      input.selectedPersona,
      input.ageGroup || null,
      input.occupation || null,
      input.interests || null,
      input.tonePreference,
      input.proactiveFrequency,
      now,
      now,
      now
    );

    log.info('User profile created', {
      id: result.lastInsertRowid,
      name: input.name,
      displayName,
      selectedPersona: input.selectedPersona
    });

    return this.findById(Number(result.lastInsertRowid))!;
  }

  /**
   * Find user profile by ID
   */
  findById(id: number): UserProfile | null {
    const stmt = this.db.prepare(`
      SELECT * FROM user_profile WHERE id = ?
    `);

    const row = stmt.get(id) as any;
    return row ? this.mapToUserProfile(row) : null;
  }

  /**
   * Get the current user profile (should only be one)
   */
  getCurrent(): UserProfile | null {
    const stmt = this.db.prepare(`
      SELECT * FROM user_profile ORDER BY created_at DESC LIMIT 1
    `);

    const row = stmt.get() as any;
    return row ? this.mapToUserProfile(row) : null;
  }

  /**
   * Update user profile
   */
  update(id: number, input: UpdateUserProfileInput): UserProfile | null {
    const fields: string[] = [];
    const values: any[] = [];

    if (input.name !== undefined) {
      fields.push('name = ?');
      values.push(input.name);
    }
    if (input.ageGroup !== undefined) {
      fields.push('age_group = ?');
      values.push(input.ageGroup);
    }
    if (input.occupation !== undefined) {
      fields.push('occupation = ?');
      values.push(input.occupation);
    }
    if (input.interests !== undefined) {
      fields.push('interests = ?');
      values.push(input.interests);
    }
    if (input.tonePreference !== undefined) {
      fields.push('tone_preference = ?');
      values.push(input.tonePreference);
    }
    if (input.proactiveFrequency !== undefined) {
      fields.push('proactive_frequency = ?');
      values.push(input.proactiveFrequency);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push('updated_at = ?');
    values.push(Date.now());
    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE user_profile
      SET ${fields.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);

    log.info('User profile updated', { id });

    return this.findById(id);
  }

  /**
   * Delete user profile
   */
  delete(id: number): void {
    const stmt = this.db.prepare(`
      DELETE FROM user_profile WHERE id = ?
    `);

    stmt.run(id);

    log.info('User profile deleted', { id });
  }

  /**
   * Check if onboarding is completed
   */
  isOnboardingCompleted(): boolean {
    const profile = this.getCurrent();
    return profile !== null && profile.onboardingCompletedAt !== undefined;
  }

  /**
   * Map database row to UserProfile
   */
  private mapToUserProfile(row: any): UserProfile {
    return {
      id: row.id,
      name: row.name,
      displayName: row.display_name,
      selectedPersona: row.selected_persona,
      ageGroup: row.age_group || undefined,
      occupation: row.occupation || undefined,
      interests: row.interests || undefined,
      tonePreference: row.tone_preference,
      proactiveFrequency: row.proactive_frequency,
      onboardingCompletedAt: row.onboarding_completed_at || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

// Singleton instance
let userProfileRepositoryInstance: UserProfileRepository | null = null;

export function getUserProfileRepository(db?: Database): UserProfileRepository {
  if (!userProfileRepositoryInstance && db) {
    userProfileRepositoryInstance = new UserProfileRepository(db);
  }
  if (!userProfileRepositoryInstance) {
    throw new Error('UserProfileRepository not initialized');
  }
  return userProfileRepositoryInstance;
}

export function resetUserProfileRepository(): void {
  userProfileRepositoryInstance = null;
}

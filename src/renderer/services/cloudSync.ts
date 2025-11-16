/**
 * Google Cloud Sync Service
 * Backs up persona settings and conversations to Google Drive
 */

import { useAuthStore } from '../stores/authStore';

export interface CloudBackupData {
  persona?: PersonaParameters;
  conversations?: ConversationBackup[];
  settings?: Record<string, unknown>;
  timestamp: number;
}

export interface PersonaParameters {
  formality: number;
  verbosity: number;
  humor: number;
  emoji_usage: number;
  proactiveness: number;
  technical_depth: number;
  empathy: number;
  code_examples: number;
  questioning: number;
  suggestions: number;
}

export interface ConversationBackup {
  id: string;
  title: string;
  messages: Array<{
    role: string;
    content: string;
    timestamp: number;
  }>;
  created_at: number;
  updated_at: number;
}

export class CloudSyncService {
  private static readonly GOOGLE_DRIVE_API = 'https://www.googleapis.com/drive/v3';
  private static readonly BACKUP_FOLDER_NAME = 'Garden of Eden Backups';
  private static readonly BACKUP_FILE_NAME = 'eden_backup.json';

  /**
   * Upload backup data to Google Drive
   */
  static async uploadBackup(data: CloudBackupData): Promise<void> {
    const authState = useAuthStore.getState();

    if (!authState.isAuthenticated || !authState.idToken) {
      throw new Error('User must be logged in with Google to backup');
    }

    // Find or create backup folder
    const folderId = await this.findOrCreateBackupFolder(authState.idToken);

    // Find existing backup file or create new
    const fileId = await this.findBackupFile(authState.idToken, folderId);

    const backupContent = JSON.stringify(data, null, 2);
    const blob = new Blob([backupContent], { type: 'application/json' });

    if (fileId) {
      // Update existing file
      await this.updateFile(authState.idToken, fileId, blob);
    } else {
      // Create new file
      await this.createFile(authState.idToken, folderId, blob);
    }
  }

  /**
   * Download backup data from Google Drive
   */
  static async downloadBackup(): Promise<CloudBackupData | null> {
    const authState = useAuthStore.getState();

    if (!authState.isAuthenticated || !authState.idToken) {
      throw new Error('User must be logged in with Google to restore backup');
    }

    const folderId = await this.findOrCreateBackupFolder(authState.idToken);
    const fileId = await this.findBackupFile(authState.idToken, folderId);

    if (!fileId) {
      return null; // No backup found
    }

    const response = await fetch(`${this.GOOGLE_DRIVE_API}/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${authState.idToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download backup: ${response.statusText}`);
    }

    const data = await response.json();
    return data as CloudBackupData;
  }

  /**
   * Check if backup exists
   */
  static async hasBackup(): Promise<boolean> {
    const authState = useAuthStore.getState();

    if (!authState.isAuthenticated || !authState.idToken) {
      return false;
    }

    try {
      const folderId = await this.findOrCreateBackupFolder(authState.idToken);
      const fileId = await this.findBackupFile(authState.idToken, folderId);
      return fileId !== null;
    } catch (error) {
      console.error('Error checking backup:', error);
      return false;
    }
  }

  /**
   * Get last backup timestamp
   */
  static async getLastBackupTime(): Promise<number | null> {
    const authState = useAuthStore.getState();

    if (!authState.isAuthenticated || !authState.idToken) {
      return null;
    }

    try {
      const folderId = await this.findOrCreateBackupFolder(authState.idToken);
      const fileId = await this.findBackupFile(authState.idToken, folderId);

      if (!fileId) return null;

      const response = await fetch(`${this.GOOGLE_DRIVE_API}/files/${fileId}?fields=modifiedTime`, {
        headers: {
          Authorization: `Bearer ${authState.idToken}`,
        },
      });

      if (!response.ok) return null;

      const data = await response.json();
      return data.modifiedTime ? new Date(data.modifiedTime).getTime() : null;
    } catch (error) {
      console.error('Error getting last backup time:', error);
      return null;
    }
  }

  // Private helper methods

  private static async findOrCreateBackupFolder(accessToken: string): Promise<string> {
    // Search for existing folder
    const searchResponse = await fetch(
      `${this.GOOGLE_DRIVE_API}/files?q=name='${this.BACKUP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!searchResponse.ok) {
      throw new Error(`Failed to search for backup folder: ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();

    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }

    // Create folder if not found
    const createResponse = await fetch(`${this.GOOGLE_DRIVE_API}/files`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: this.BACKUP_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (!createResponse.ok) {
      throw new Error(`Failed to create backup folder: ${createResponse.statusText}`);
    }

    const createData = await createResponse.json();
    return createData.id;
  }

  private static async findBackupFile(accessToken: string, folderId: string): Promise<string | null> {
    const response = await fetch(
      `${this.GOOGLE_DRIVE_API}/files?q=name='${this.BACKUP_FILE_NAME}' and '${folderId}' in parents and trashed=false`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to search for backup file: ${response.statusText}`);
    }

    const data = await response.json();
    return data.files && data.files.length > 0 ? data.files[0].id : null;
  }

  private static async createFile(accessToken: string, folderId: string, blob: Blob): Promise<string> {
    const metadata = {
      name: this.BACKUP_FILE_NAME,
      parents: [folderId],
      mimeType: 'application/json',
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', blob);

    const response = await fetch(`${this.GOOGLE_DRIVE_API}/files?uploadType=multipart`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    });

    if (!response.ok) {
      throw new Error(`Failed to create backup file: ${response.statusText}`);
    }

    const data = await response.json();
    return data.id;
  }

  private static async updateFile(accessToken: string, fileId: string, blob: Blob): Promise<void> {
    const response = await fetch(`${this.GOOGLE_DRIVE_API}/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: blob,
    });

    if (!response.ok) {
      throw new Error(`Failed to update backup file: ${response.statusText}`);
    }
  }
}

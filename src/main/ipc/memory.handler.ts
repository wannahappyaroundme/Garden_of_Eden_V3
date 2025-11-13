/**
 * Memory IPC Handler
 * Handles episodic memory operations from renderer process
 */

import { ipcMain } from 'electron';
import { getRAGService } from '../services/learning/rag.service';
import { getEpisodeRepository } from '../database/repositories/episode.repository';
import type { MemoryChannels } from '../../shared/types/memory.types';
import log from 'electron-log';

/**
 * Register all memory IPC handlers
 */
export function registerMemoryHandlers(): void {
  const ragService = getRAGService();
  const episodeRepo = getEpisodeRepository();

  // Store episode
  ipcMain.handle(
    'memory:store-episode',
    async (_, request: MemoryChannels['memory:store-episode']['request']) => {
      try {
        log.info('Store episode requested');

        // Store in ChromaDB and get chroma ID
        const chromaId = await ragService.storeEpisode(request.episode);

        // Generate episode ID
        const episodeId = `episode-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        // Store metadata in SQLite
        episodeRepo.create({
          id: episodeId,
          ...request.episode,
          chromaId,
        });

        return {
          success: true,
          episodeId,
        };
      } catch (error) {
        log.error('Failed to store episode', error);
        throw new Error(
          'Failed to store episode: ' + (error instanceof Error ? error.message : String(error))
        );
      }
    }
  );

  // Search episodes
  ipcMain.handle(
    'memory:search',
    async (_, request: MemoryChannels['memory:search']['request']) => {
      try {
        log.info('Memory search requested', { query: request.query });

        const result = await ragService.searchEpisodes(request);

        return result;
      } catch (error) {
        log.error('Failed to search episodes', error);
        throw new Error(
          'Failed to search episodes: ' + (error instanceof Error ? error.message : String(error))
        );
      }
    }
  );

  // Get stats
  ipcMain.handle('memory:get-stats', async () => {
    try {
      const stats = await ragService.getStats();

      return { stats };
    } catch (error) {
      log.error('Failed to get memory stats', error);
      throw new Error(
        'Failed to get memory stats: ' + (error instanceof Error ? error.message : String(error))
      );
    }
  });

  // Get episode by ID
  ipcMain.handle(
    'memory:get-episode',
    async (_, request: MemoryChannels['memory:get-episode']['request']) => {
      try {
        const episode = await ragService.getEpisode(request.episodeId);

        return { episode };
      } catch (error) {
        log.error('Failed to get episode', error);
        throw new Error(
          'Failed to get episode: ' + (error instanceof Error ? error.message : String(error))
        );
      }
    }
  );

  // Delete episode
  ipcMain.handle(
    'memory:delete-episode',
    async (_, request: MemoryChannels['memory:delete-episode']['request']) => {
      try {
        log.info('Delete episode requested', { episodeId: request.episodeId });

        // Delete from ChromaDB
        const success = await ragService.deleteEpisode(request.episodeId);

        // Delete from SQLite
        if (success) {
          episodeRepo.delete(request.episodeId);
        }

        return { success };
      } catch (error) {
        log.error('Failed to delete episode', error);
        throw new Error(
          'Failed to delete episode: ' + (error instanceof Error ? error.message : String(error))
        );
      }
    }
  );

  // Clear all episodes
  ipcMain.handle(
    'memory:clear-all',
    async (_, request: MemoryChannels['memory:clear-all']['request']) => {
      try {
        log.info('Clear episodes requested', { conversationId: request.conversationId });

        // Clear from ChromaDB
        const deletedCount = await ragService.clearEpisodes(request.conversationId);

        // Clear from SQLite
        if (request.conversationId) {
          episodeRepo.deleteByConversationId(request.conversationId);
        } else {
          episodeRepo.deleteAll();
        }

        return {
          success: true,
          deletedCount,
        };
      } catch (error) {
        log.error('Failed to clear episodes', error);
        throw new Error(
          'Failed to clear episodes: ' + (error instanceof Error ? error.message : String(error))
        );
      }
    }
  );

  log.info('[IPC] Memory handlers registered');
}

/**
 * Cleanup memory resources on app quit
 */
export async function cleanupMemoryResources(): Promise<void> {
  try {
    log.info('Cleaning up memory resources...');
    const { cleanupRAGService } = await import('../services/learning/rag.service');
    await cleanupRAGService();

    log.info('Memory resources cleaned up');
  } catch (error) {
    log.error('Error cleaning up memory resources', error);
  }
}

/**
 * Feedback IPC Handler
 * Handles user feedback and triggers persona learning
 */

import { ipcMain } from 'electron';
import { getPersonaLearnerService } from '../services/learning/persona-learner.service';
import { getMessageRepository } from '../database/repositories/message.repository';
import log from 'electron-log';

/**
 * Register all feedback IPC handlers
 */
export function registerFeedbackHandlers(): void {
  const learnerService = getPersonaLearnerService();
  const messageRepo = getMessageRepository();

  // Update satisfaction and trigger learning
  ipcMain.handle(
    'feedback:update-satisfaction',
    async (_, args: { messageId: string; satisfaction: 'positive' | 'negative' }) => {
      try {
        log.info('Feedback received', { messageId: args.messageId, satisfaction: args.satisfaction });

        // 1. Update message satisfaction in database
        const updated = await messageRepo.updateSatisfaction(args.messageId, args.satisfaction);

        if (!updated) {
          throw new Error('Failed to update message satisfaction');
        }

        // 2. Trigger persona learning
        const result = await learnerService.learnFromFeedback(args.messageId, args.satisfaction);

        log.info('Persona learning complete', {
          adjustedParameters: Object.keys(result.adjustments).length,
          parameters: Object.keys(result.adjustments),
        });

        return {
          success: true,
          updated: result.updated,
          adjustments: result.adjustments,
        };
      } catch (error) {
        log.error('Failed to update satisfaction', error);
        throw new Error(
          'Failed to update satisfaction: ' +
            (error instanceof Error ? error.message : String(error))
        );
      }
    }
  );

  // Get learning statistics
  ipcMain.handle('feedback:get-stats', async () => {
    try {
      const stats = await learnerService.getLearningStats();
      return { stats };
    } catch (error) {
      log.error('Failed to get learning stats', error);
      throw new Error(
        'Failed to get learning stats: ' + (error instanceof Error ? error.message : String(error))
      );
    }
  });

  // Get feedback trend
  ipcMain.handle('feedback:get-trend', async (_, args: { days: number }) => {
    try {
      const trend = await learnerService.getFeedbackTrend(args.days);
      return { trend };
    } catch (error) {
      log.error('Failed to get feedback trend', error);
      throw new Error(
        'Failed to get feedback trend: ' + (error instanceof Error ? error.message : String(error))
      );
    }
  });

  // Reset learning data (for testing)
  ipcMain.handle('feedback:reset-learning', async () => {
    try {
      log.warn('Resetting all learning data');
      const deletedCount = await learnerService.resetLearningData();

      return { success: true, deletedCount };
    } catch (error) {
      log.error('Failed to reset learning data', error);
      throw new Error(
        'Failed to reset learning data: ' +
          (error instanceof Error ? error.message : String(error))
      );
    }
  });

  // Get current learning rate
  ipcMain.handle('feedback:get-learning-rate', async () => {
    try {
      const learningRate = learnerService.getLearningRate();
      return { learningRate };
    } catch (error) {
      log.error('Failed to get learning rate', error);
      throw new Error(
        'Failed to get learning rate: ' +
          (error instanceof Error ? error.message : String(error))
      );
    }
  });

  // Set learning rate
  ipcMain.handle('feedback:set-learning-rate', async (_, args: { rate: number }) => {
    try {
      learnerService.setLearningRate(args.rate);
      const newRate = learnerService.getLearningRate();

      log.info('Learning rate updated', { rate: newRate });

      return { success: true, learningRate: newRate };
    } catch (error) {
      log.error('Failed to set learning rate', error);
      throw new Error(
        'Failed to set learning rate: ' + (error instanceof Error ? error.message : String(error))
      );
    }
  });

  log.info('[IPC] Feedback handlers registered');
}

/**
 * Cleanup feedback resources on app quit
 */
export async function cleanupFeedbackResources(): Promise<void> {
  try {
    log.info('Cleaning up feedback resources...');
    const { cleanupPersonaLearnerService } = await import(
      '../services/learning/persona-learner.service'
    );
    await cleanupPersonaLearnerService();

    log.info('Feedback resources cleaned up');
  } catch (error) {
    log.error('Error cleaning up feedback resources', error);
  }
}

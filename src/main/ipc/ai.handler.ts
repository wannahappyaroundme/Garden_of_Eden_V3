/**
 * AI IPC Handler
 * Handles AI-related operations from renderer process
 */

import { ipcMain, BrowserWindow } from 'electron';
import { llamaService } from '../services/ai/llama.service';
import type { AIChannels } from '../../shared/types/ipc.types';
import { log } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

// Track active message generations for cancellation
const activeGenerations = new Map<string, boolean>();

/**
 * Register all AI-related IPC handlers
 */
export function registerAIHandlers(mainWindow: BrowserWindow): void {
  // Initialize AI model on startup (lazy loading)
  let modelInitialized = false;

  const ensureModelInitialized = async () => {
    if (!modelInitialized) {
      try {
        log.ai.info('Initializing Llama model...');
        await llamaService.initialize();
        modelInitialized = true;
        log.ai.info('Llama model initialized successfully');
      } catch (error) {
        log.ai.error('Failed to initialize Llama model', error);
        throw new Error(
          'Failed to initialize AI model: ' + (error instanceof Error ? error.message : String(error))
        );
      }
    }
  };

  // Handle chat messages
  ipcMain.handle('ai:chat', async (_, request: AIChannels['ai:chat']['request']) => {
    try {
      await ensureModelInitialized();

      const messageId = uuidv4();
      const conversationId = request.conversationId || uuidv4();

      log.ai.info('Processing chat request', {
        messageId,
        conversationId,
        messageLength: request.message.length,
      });

      // Mark this generation as active
      activeGenerations.set(messageId, true);

      // Generate response with streaming
      const response = await llamaService.chat(request.message, {
        conversationId,
        stream: {
          onToken: (token: string) => {
            // Check if generation was cancelled
            if (!activeGenerations.get(messageId)) {
              throw new Error('Generation cancelled by user');
            }

            // Send token to renderer
            mainWindow.webContents.send('ai:stream-token', {
              token,
              messageId,
            });
          },
          onComplete: (fullResponse: string) => {
            // Send completion event
            mainWindow.webContents.send('ai:stream-complete', {
              messageId,
              fullResponse,
            });

            // Clean up
            activeGenerations.delete(messageId);
          },
          onError: (error: Error) => {
            log.ai.error('Streaming error', error);
            activeGenerations.delete(messageId);
          },
        },
      });

      return {
        conversationId,
        messageId,
        response,
      };
    } catch (error) {
      log.ai.error('Failed to process chat request', error);
      throw new Error(
        'Failed to generate response: ' + (error instanceof Error ? error.message : String(error))
      );
    }
  });

  // Cancel ongoing generation
  ipcMain.handle('ai:cancel', async (_, request: AIChannels['ai:cancel']['request']) => {
    try {
      const { messageId } = request;

      if (activeGenerations.has(messageId)) {
        activeGenerations.set(messageId, false); // Mark as cancelled
        log.ai.info('Generation cancelled', { messageId });
        return { cancelled: true };
      }

      return { cancelled: false };
    } catch (error) {
      log.ai.error('Failed to cancel generation', error);
      throw new Error(
        'Failed to cancel: ' + (error instanceof Error ? error.message : String(error))
      );
    }
  });

  // Voice input start (placeholder - will implement in later phase)
  ipcMain.handle('ai:voice-input-start', async () => {
    try {
      log.ai.info('Voice input start requested');
      // TODO: Implement Whisper integration
      return { recording: false };
    } catch (error) {
      log.ai.error('Failed to start voice input', error);
      throw new Error(
        'Failed to start voice input: ' + (error instanceof Error ? error.message : String(error))
      );
    }
  });

  // Voice input stop (placeholder - will implement in later phase)
  ipcMain.handle('ai:voice-input-stop', async () => {
    try {
      log.ai.info('Voice input stop requested');
      // TODO: Implement Whisper integration
      return { transcript: '', language: 'ko' as const };
    } catch (error) {
      log.ai.error('Failed to stop voice input', error);
      throw new Error(
        'Failed to stop voice input: ' + (error instanceof Error ? error.message : String(error))
      );
    }
  });

  // Analyze screen (placeholder - will implement in later phase)
  ipcMain.handle(
    'ai:analyze-screen',
    async (_, request: AIChannels['ai:analyze-screen']['request']) => {
      try {
        log.ai.info('Screen analysis requested', { level: request.level });
        // TODO: Implement LLaVA integration + screen capture
        return {
          analysis: 'Screen analysis not yet implemented',
          contextData: {},
        };
      } catch (error) {
        log.ai.error('Failed to analyze screen', error);
        throw new Error(
          'Failed to analyze screen: ' + (error instanceof Error ? error.message : String(error))
        );
      }
    }
  );

  console.log('[IPC] AI handlers registered');
}

/**
 * Cleanup AI resources on app quit
 */
export async function cleanupAIResources(): Promise<void> {
  try {
    log.ai.info('Cleaning up AI resources...');
    await llamaService.cleanup();
    activeGenerations.clear();
    log.ai.info('AI resources cleaned up');
  } catch (error) {
    log.ai.error('Error cleaning up AI resources', error);
  }
}

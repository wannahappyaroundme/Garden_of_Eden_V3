/**
 * AI IPC Handler
 * Handles AI-related operations from renderer process
 */

import { ipcMain, BrowserWindow } from 'electron';
import { llamaService } from '../services/ai/llama.service';
import { getWhisperService } from '../services/ai/whisper.service';
import { getLLaVAService } from '../services/ai/llava.service';
import { getScreenCaptureService } from '../services/screen/capture.service';
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
      const response = await llamaService.generateStreamingResponse(
        request.message,
        (token: string) => {
          // Check if generation was cancelled
          if (!activeGenerations.get(messageId)) {
            throw new Error('Generation cancelled by user');
          }

          // Send token to renderer
          mainWindow.webContents.send('ai:stream-token', {
            token,
            messageId,
          });
        }
      );

      // Send completion event
      mainWindow.webContents.send('ai:stream-complete', {
        messageId,
        fullResponse: response,
      });

      // Clean up
      activeGenerations.delete(messageId);

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

  // Voice input start
  ipcMain.handle('ai:voice-input-start', async () => {
    try {
      log.ai.info('Voice input start requested');
      const whisperService = getWhisperService();

      await whisperService.startRecording();

      return { recording: true };
    } catch (error) {
      log.ai.error('Failed to start voice input', error);
      throw new Error(
        'Failed to start voice input: ' + (error instanceof Error ? error.message : String(error))
      );
    }
  });

  // Voice input stop
  ipcMain.handle('ai:voice-input-stop', async () => {
    try {
      log.ai.info('Voice input stop requested');
      const whisperService = getWhisperService();

      const result = await whisperService.stopRecording();

      return {
        transcript: result.transcript,
        language: result.language,
      };
    } catch (error) {
      log.ai.error('Failed to stop voice input', error);
      throw new Error(
        'Failed to stop voice input: ' + (error instanceof Error ? error.message : String(error))
      );
    }
  });

  // Analyze screen
  ipcMain.handle(
    'ai:analyze-screen',
    async (_, request: AIChannels['ai:analyze-screen']['request']) => {
      try {
        log.ai.info('Screen analysis requested', { level: request.level });

        const screenCaptureService = getScreenCaptureService();
        const llavaService = getLLaVAService();

        // Initialize services if needed
        await screenCaptureService.initialize();

        const level = request.level || 1;

        // Capture screen based on context level
        let analysisResult;

        if (level === 1) {
          // Level 1: Current screen only
          const capture = await screenCaptureService.captureScreen(1);
          analysisResult = await llavaService.analyzeScreen(capture.imagePath, undefined, 1);
        } else if (level === 2) {
          // Level 2: Recent work context (last 10 minutes)
          const recentContext = await screenCaptureService.getRecentContext(10);

          if (recentContext.captures.length === 0) {
            // No history, capture current screen
            const capture = await screenCaptureService.captureScreen(2);
            analysisResult = await llavaService.analyzeScreen(capture.imagePath, undefined, 2);
          } else {
            // Analyze recent captures
            const imagePaths = recentContext.captures.map(c => c.imagePath);
            const analyses = await llavaService.analyzeMultipleScreens(imagePaths, 2);
            const summary = await llavaService.generateContextSummary(analyses);

            analysisResult = {
              description: summary,
              confidence: analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length,
              contextLevel: 2,
              processingTime: analyses.reduce((sum, a) => sum + a.processingTime, 0),
            };
          }
        } else {
          // Level 3: Full project context
          const fullContext = await screenCaptureService.getFullContext();

          if (fullContext.captures.length === 0) {
            // No history, capture current screen
            const capture = await screenCaptureService.captureScreen(3);
            analysisResult = await llavaService.analyzeScreen(capture.imagePath, undefined, 3);
          } else {
            // Analyze all captures
            const imagePaths = fullContext.captures.map(c => c.imagePath);
            const analyses = await llavaService.analyzeMultipleScreens(imagePaths, 3);
            const summary = await llavaService.generateContextSummary(analyses);

            analysisResult = {
              description: summary,
              confidence: analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length,
              contextLevel: 3,
              processingTime: analyses.reduce((sum, a) => sum + a.processingTime, 0),
            };
          }
        }

        return {
          analysis: analysisResult.description,
          contextData: {
            confidence: analysisResult.confidence,
            contextLevel: analysisResult.contextLevel,
            processingTime: analysisResult.processingTime,
            detectedObjects: analysisResult.detectedObjects,
            suggestedActions: analysisResult.suggestedActions,
          },
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
    await llamaService.shutdown();

    // Cleanup Whisper service
    const { cleanupWhisperService } = await import('../services/ai/whisper.service');
    await cleanupWhisperService();

    // Cleanup LLaVA service
    const { cleanupLLaVAService } = await import('../services/ai/llava.service');
    await cleanupLLaVAService();

    // Cleanup screen capture service
    const { cleanupScreenCaptureService } = await import('../services/screen/capture.service');
    await cleanupScreenCaptureService();

    activeGenerations.clear();
    log.ai.info('AI resources cleaned up');
  } catch (error) {
    log.ai.error('Error cleaning up AI resources', error);
  }
}

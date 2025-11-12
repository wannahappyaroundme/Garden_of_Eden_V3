/**
 * AI IPC Handler
 * Handles AI-related operations (chat, voice, screen analysis)
 */

import { ipcMain } from 'electron';
import log from 'electron-log';
import { ConversationRepository } from '../database/repositories/conversation.repository';
import { MessageRepository } from '../database/repositories/message.repository';
import { getAIManager } from '../services/ai/ai-manager.service';
import { DEFAULT_PERSONA } from '../../../shared/types/persona.types';

const conversationRepo = new ConversationRepository();
const messageRepo = new MessageRepository();
const aiManager = getAIManager();

export function registerAIHandlers(): void {
  log.info('Registering AI IPC handlers');

  /**
   * Send a chat message
   * TODO: Integrate with Llama 3.1 8B model
   */
  ipcMain.handle(
    'ai:chat',
    async (
      _event,
      args: { message: string; conversationId?: string; contextLevel?: 1 | 2 | 3 }
    ) => {
      const { message, conversationId, contextLevel } = args;

      try {
        // Get or create conversation
        let conversation = conversationId
          ? conversationRepo.findById(conversationId)
          : null;

        if (!conversation) {
          conversation = conversationRepo.create('New Conversation');
        }

        // Save user message
        messageRepo.create(conversation.id, 'user', message, {
          contextLevel,
        });

        // Get conversation history for context
        const history = messageRepo.getRecentMessages(conversation.id, 10).map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }));

        // Generate AI response using AI Manager
        const { response: aiResponse, metrics } = await aiManager.generateResponse(
          message,
          DEFAULT_PERSONA, // TODO: Load user's custom persona from database
          history
        );

        // Save AI message
        const assistantMessage = messageRepo.create(
          conversation.id,
          'assistant',
          aiResponse,
          {
            responseTime: metrics?.responseTime,
            tokens: metrics?.tokens,
            contextLevel,
          }
        );

        // Update conversation
        conversationRepo.incrementMessageCount(conversation.id);
        conversationRepo.incrementMessageCount(conversation.id);

        log.info(`Chat message processed for conversation ${conversation.id}`);

        return {
          conversationId: conversation.id,
          messageId: assistantMessage.id,
          response: aiResponse,
        };
      } catch (error) {
        log.error('Failed to process chat message:', error);
        throw error;
      }
    }
  );

  /**
   * Start voice input
   */
  ipcMain.handle('ai:voice-input-start', async () => {
    log.info('Starting voice input...');
    const recording = await aiManager.startVoiceInput();
    return { recording };
  });

  /**
   * Stop voice input and get transcript
   */
  ipcMain.handle('ai:voice-input-stop', async () => {
    log.info('Stopping voice input...');
    const result = await aiManager.stopVoiceInput();
    return result;
  });

  /**
   * Cancel AI generation
   */
  ipcMain.handle('ai:cancel', async (_event, args: { messageId: string }) => {
    const { messageId } = args;
    log.info(`Cancelling generation for message ${messageId}`);
    // TODO: Phase 2 - Implement cancellation
    return { cancelled: true };
  });

  /**
   * Analyze screen context
   * TODO: Integrate with LLaVA 7B
   */
  ipcMain.handle('ai:analyze-screen', async (_event, args: { level: 1 | 2 | 3 }) => {
    const { level } = args;
    log.info(`Screen analysis requested (level ${level}, placeholder)`);
    // TODO: Phase 2 - Implement screen capture and LLaVA analysis
    return {
      analysis: '화면 분석 기능은 Phase 2에서 구현됩니다',
      contextData: {
        level,
        timestamp: Date.now(),
      },
    };
  });

  log.info('AI IPC handlers registered');
}

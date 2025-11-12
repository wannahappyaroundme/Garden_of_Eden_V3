/**
 * Message IPC Handler
 * Handles message persistence operations
 */

import { ipcMain } from 'electron';
import log from 'electron-log';
import { getDatabase } from '../database';
import { MessageRepository } from '../database/repositories/message.repository';
import type { Message, MessageRole } from '../../shared/types/chat.types';

let messageRepository: MessageRepository | null = null;

function getMessageRepository(): MessageRepository {
  if (!messageRepository) {
    const db = getDatabase();
    messageRepository = new MessageRepository(db);
  }
  return messageRepository;
}

export function registerMessageHandlers(): void {
  log.info('Registering message IPC handlers');

  /**
   * Save a message to the database
   */
  ipcMain.handle('message:save', async (_, args: {
    conversationId: string;
    role: MessageRole;
    content: string;
    metadata?: {
      tokens?: number;
      responseTime?: number;
      contextLevel?: 1 | 2 | 3;
    };
  }): Promise<Message> => {
    try {
      const repo = getMessageRepository();
      const message = repo.create(
        args.conversationId,
        args.role,
        args.content,
        args.metadata
      );
      
      log.info('Message saved', { messageId: message.id, conversationId: args.conversationId });
      return message;
    } catch (error) {
      log.error('Failed to save message', error);
      throw error;
    }
  });

  /**
   * Get messages by conversation ID
   */
  ipcMain.handle('message:get-by-conversation', async (_, args: {
    conversationId: string;
    limit?: number;
    offset?: number;
  }): Promise<Message[]> => {
    try {
      const repo = getMessageRepository();
      const messages = repo.findByConversationId(
        args.conversationId,
        args.limit,
        args.offset
      );
      
      log.info('Messages loaded', { conversationId: args.conversationId, count: messages.length });
      return messages;
    } catch (error) {
      log.error('Failed to load messages', error);
      throw error;
    }
  });

  /**
   * Get recent messages for context
   */
  ipcMain.handle('message:get-recent', async (_, args: {
    conversationId: string;
    count?: number;
  }): Promise<Message[]> => {
    try {
      const repo = getMessageRepository();
      const messages = repo.getRecentMessages(args.conversationId, args.count);
      
      log.info('Recent messages loaded', { conversationId: args.conversationId, count: messages.length });
      return messages;
    } catch (error) {
      log.error('Failed to load recent messages', error);
      throw error;
    }
  });

  /**
   * Update message satisfaction feedback
   */
  ipcMain.handle('message:update-satisfaction', async (_, args: {
    messageId: string;
    satisfaction: 'positive' | 'negative';
  }): Promise<boolean> => {
    try {
      const repo = getMessageRepository();
      const updated = repo.updateSatisfaction(args.messageId, args.satisfaction);
      
      log.info('Message satisfaction updated', { messageId: args.messageId, satisfaction: args.satisfaction });
      return updated;
    } catch (error) {
      log.error('Failed to update message satisfaction', error);
      throw error;
    }
  });

  /**
   * Search messages
   */
  ipcMain.handle('message:search', async (_, args: {
    query: string;
    limit?: number;
  }): Promise<Message[]> => {
    try {
      const repo = getMessageRepository();
      const messages = repo.search(args.query, args.limit);
      
      log.info('Messages searched', { query: args.query, resultsCount: messages.length });
      return messages;
    } catch (error) {
      log.error('Failed to search messages', error);
      throw error;
    }
  });

  /**
   * Delete message
   */
  ipcMain.handle('message:delete', async (_, args: {
    messageId: string;
  }): Promise<boolean> => {
    try {
      const repo = getMessageRepository();
      const deleted = repo.delete(args.messageId);
      
      log.info('Message deleted', { messageId: args.messageId });
      return deleted;
    } catch (error) {
      log.error('Failed to delete message', error);
      throw error;
    }
  });

  log.info('Message IPC handlers registered');
}

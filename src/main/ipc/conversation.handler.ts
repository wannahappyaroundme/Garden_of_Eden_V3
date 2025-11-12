/**
 * Conversation IPC Handler
 * Handles conversation CRUD operations
 */

import { ipcMain } from 'electron';
import log from 'electron-log';
import { ConversationRepository } from '../database/repositories/conversation.repository';
import { MessageRepository } from '../database/repositories/message.repository';
import type { Conversation } from '../../shared/types/chat.types';

let conversationRepository: ConversationRepository | null = null;
let messageRepository: MessageRepository | null = null;

function getConversationRepository(): ConversationRepository {
  if (!conversationRepository) {
    conversationRepository = new ConversationRepository();
  }
  return conversationRepository;
}

function getMessageRepository(): MessageRepository {
  if (!messageRepository) {
    messageRepository = new MessageRepository();
  }
  return messageRepository;
}

export function registerConversationHandlers(): void {
  log.info('Registering conversation IPC handlers');

  /**
   * Create a new conversation
   */
  ipcMain.handle('conversation:create', async (_, args: {
    title?: string;
    mode?: 'user-led' | 'ai-led';
  }): Promise<Conversation> => {
    try {
      const repo = getConversationRepository();
      const defaultTitle = '새 대화 - ' + new Date().toLocaleString('ko-KR');
      const title = args.title || defaultTitle;
      const mode = args.mode || 'user-led';

      const conversation = repo.create(title, mode);

      log.info('Conversation created', { conversationId: conversation.id, title });
      return conversation;
    } catch (error) {
      log.error('Failed to create conversation', error);
      throw error;
    }
  });

  /**
   * Get all conversations
   */
  ipcMain.handle('conversation:get-all', async (_, args?: {
    limit?: number;
    offset?: number;
  }): Promise<Conversation[]> => {
    try {
      const repo = getConversationRepository();
      const conversations = repo.findAll(args?.limit, args?.offset);

      log.info('Conversations loaded', { count: conversations.length });
      return conversations;
    } catch (error) {
      log.error('Failed to load conversations', error);
      throw error;
    }
  });

  /**
   * Get conversation by ID
   */
  ipcMain.handle('conversation:get-by-id', async (_, args: {
    id: string;
  }): Promise<Conversation | null> => {
    try {
      const repo = getConversationRepository();
      const conversation = repo.findById(args.id);

      log.info('Conversation loaded', { conversationId: args.id, found: !!conversation });
      return conversation;
    } catch (error) {
      log.error('Failed to load conversation', error);
      throw error;
    }
  });

  /**
   * Update conversation
   */
  ipcMain.handle('conversation:update', async (_, args: {
    id: string;
    updates: {
      title?: string;
      mode?: 'user-led' | 'ai-led';
    };
  }): Promise<boolean> => {
    try {
      const repo = getConversationRepository();
      const updated = repo.update(args.id, args.updates);

      log.info('Conversation updated', { conversationId: args.id, updates: args.updates });
      return updated;
    } catch (error) {
      log.error('Failed to update conversation', error);
      throw error;
    }
  });

  /**
   * Delete conversation (cascade delete messages)
   */
  ipcMain.handle('conversation:delete', async (_, args: {
    id: string;
  }): Promise<boolean> => {
    try {
      const convRepo = getConversationRepository();
      const msgRepo = getMessageRepository();

      // Delete all messages in the conversation first
      const deletedMessages = msgRepo.deleteByConversationId(args.id);
      log.info('Deleted messages for conversation', { conversationId: args.id, count: deletedMessages });

      // Delete the conversation
      const deleted = convRepo.delete(args.id);

      log.info('Conversation deleted', { conversationId: args.id, success: deleted });
      return deleted;
    } catch (error) {
      log.error('Failed to delete conversation', error);
      throw error;
    }
  });

  /**
   * Search conversations by title
   */
  ipcMain.handle('conversation:search', async (_, args: {
    query: string;
    limit?: number;
  }): Promise<Conversation[]> => {
    try {
      const repo = getConversationRepository();
      const conversations = repo.search(args.query, args.limit);

      log.info('Conversations searched', { query: args.query, resultsCount: conversations.length });
      return conversations;
    } catch (error) {
      log.error('Failed to search conversations', error);
      throw error;
    }
  });

  /**
   * Get total conversation count
   */
  ipcMain.handle('conversation:get-count', async (): Promise<number> => {
    try {
      const repo = getConversationRepository();
      const count = repo.getTotalCount();

      log.info('Conversation count retrieved', { count });
      return count;
    } catch (error) {
      log.error('Failed to get conversation count', error);
      throw error;
    }
  });

  log.info('Conversation IPC handlers registered');
}

/**
 * Chat and Conversation Type Definitions
 */

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  metadata?: {
    tokens?: number;
    responseTime?: number;
    contextLevel?: 1 | 2 | 3;
    satisfaction?: 'positive' | 'negative' | null;
  };
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  mode: 'user-led' | 'ai-led';
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export interface ChatState {
  currentConversation: Conversation | null;
  messages: Message[];
  isStreaming: boolean;
  isRecording: boolean;
  error: string | null;
}

/**
 * Conversation Types
 * Shared types for conversation context and state management
 */

/**
 * Conversation mode determines response style and depth
 */
export type ConversationMode = 'fast' | 'detailed' | 'proactive';

/**
 * Conversation state
 */
export interface ConversationState {
  mode: ConversationMode;
  isListening: boolean;
  isSpeaking: boolean;
  lastInteraction: Date;
  idleMinutes: number;
  proactiveEnabled: boolean;
}

/**
 * Voice state
 */
export type VoiceState = 'idle' | 'listening' | 'speaking' | 'processing';

/**
 * Conversation message
 */
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'proactive';
  content: string;
  timestamp: Date;
  metadata?: {
    mode?: ConversationMode;
    confidence?: number;
    hallucinationRisk?: 'low' | 'medium' | 'high';
    isGrounded?: boolean;
    proactiveType?: 'greeting' | 'check_in' | 'suggestion' | 'encouragement' | 'curiosity';
    sources?: string[];
  };
}

/**
 * Conversation session
 */
export interface ConversationSession {
  id: string;
  messages: ConversationMessage[];
  startTime: Date;
  endTime?: Date;
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  proactiveMessages: number;
}

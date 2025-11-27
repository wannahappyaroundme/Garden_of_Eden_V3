/**
 * Chat Message List Component (v3.6.0)
 *
 * Extracted from Chat.tsx for better maintainability.
 * Renders the list of messages with date dividers.
 *
 * Performance optimizations (P3):
 * - useMemo for message grouping by date
 * - React.memo for MessageRenderer to prevent unnecessary re-renders
 * - React.memo for ToolCallRenderer for tool call updates
 */

import { forwardRef, useMemo, memo, useCallback } from 'react';
import { ChatBubble, ChatDateDivider } from './ChatBubble';
import { ErrorBubble } from './ErrorBubble';
import { TypingIndicator } from './TypingIndicator';
import { ToolCallIndicator, ToolResultCard } from '../tool';
import type { ToolCall } from '../../../shared/types/tool.types';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'error' | 'system';
  timestamp: Date;
  errorRetryContent?: string;
  toolCalls?: ToolCall[];
}

interface ChatMessageListProps {
  /** Array of messages to display */
  messages: Message[];
  /** Whether AI is currently typing */
  isTyping: boolean;
  /** Active tool calls by message ID */
  activeToolCalls: Map<string, ToolCall[]>;
  /** Handler for retry button on error messages */
  onRetry: (originalMessage: string) => void;
  /** Handler for feedback buttons on assistant messages */
  onFeedback: (messageId: string, satisfaction: 'positive' | 'negative') => void;
}

export const ChatMessageList = forwardRef<HTMLDivElement, ChatMessageListProps>(
  ({ messages, isTyping, activeToolCalls, onRetry, onFeedback }, ref) => {
    // Group messages by date for date dividers
    const groupedMessages = useMemo(() => {
      return messages.reduce(
        (groups, message) => {
          const dateKey = new Date(message.timestamp).toDateString();
          if (!groups[dateKey]) {
            groups[dateKey] = [];
          }
          groups[dateKey].push(message);
          return groups;
        },
        {} as Record<string, Message[]>
      );
    }, [messages]);

    return (
      <>
        {Object.entries(groupedMessages).map(([dateKey, dateMessages]) => (
          <div key={dateKey}>
            <ChatDateDivider date={new Date(dateKey)} />
            {dateMessages.map((message) => (
              <MessageRenderer
                key={message.id}
                message={message}
                activeToolCalls={activeToolCalls}
                onRetry={onRetry}
                onFeedback={onFeedback}
              />
            ))}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && <TypingIndicator />}

        {/* Auto-scroll anchor */}
        <div ref={ref} />
      </>
    );
  }
);

ChatMessageList.displayName = 'ChatMessageList';

// Individual message renderer - memoized for performance (P3 optimization)
interface MessageRendererProps {
  message: Message;
  activeToolCalls: Map<string, ToolCall[]>;
  onRetry: (originalMessage: string) => void;
  onFeedback: (messageId: string, satisfaction: 'positive' | 'negative') => void;
}

const MessageRenderer = memo(function MessageRenderer({
  message,
  activeToolCalls,
  onRetry,
  onFeedback,
}: MessageRendererProps) {
  // Memoize retry handler to prevent unnecessary re-renders
  const handleRetry = useCallback(() => {
    if (message.errorRetryContent) {
      onRetry(message.errorRetryContent);
    }
  }, [message.errorRetryContent, onRetry]);

  if (message.role === 'error') {
    return (
      <ErrorBubble
        message={message.content}
        timestamp={message.timestamp}
        onRetry={message.errorRetryContent ? handleRetry : undefined}
      />
    );
  }

  if (message.role === 'system') {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-muted px-4 py-2 rounded-lg text-sm text-muted-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  // User or Assistant message
  const toolCalls = activeToolCalls.get(message.id);

  return (
    <div>
      <ChatBubble
        messageId={message.id}
        message={message.content}
        role={message.role}
        timestamp={message.timestamp}
        onFeedback={onFeedback}
      />
      {/* Tool call visualizations for assistant messages */}
      {message.role === 'assistant' && toolCalls && toolCalls.length > 0 && (
        <div className="ml-12 mt-2 space-y-2">
          {toolCalls.map((toolCall) => (
            <ToolCallRenderer key={toolCall.id} toolCall={toolCall} />
          ))}
        </div>
      )}
    </div>
  );
});

// Tool call renderer - memoized for performance (P3 optimization)
interface ToolCallRendererProps {
  toolCall: ToolCall;
}

const ToolCallRenderer = memo(function ToolCallRenderer({ toolCall }: ToolCallRendererProps) {
  if (toolCall.status === 'loading') {
    return (
      <ToolCallIndicator
        toolName={toolCall.toolName}
        status={toolCall.status}
      />
    );
  }

  if (toolCall.status === 'success' || toolCall.status === 'error') {
    return <ToolResultCard toolCall={toolCall} />;
  }

  return null;
});

export default ChatMessageList;

/**
 * ChatBubble Component
 * KakaoTalk-inspired message bubble with timestamp
 */

import { cn } from '../../lib/utils';

export interface ChatBubbleProps {
  message: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isStreaming?: boolean;
}

export function ChatBubble({ message, role, timestamp, isStreaming = false }: ChatBubbleProps) {
  const isUser = role === 'user';

  // Format timestamp to HH:MM
  const timeString = new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(timestamp);

  return (
    <div className={cn('flex w-full gap-2 mb-3', isUser ? 'justify-end' : 'justify-start')}>
      {/* Avatar for AI */}
      {!isUser && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
          E
        </div>
      )}

      {/* Message content */}
      <div className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words',
            isUser
              ? 'bg-[hsl(var(--chat-user-bg))] text-gray-900 dark:text-white rounded-tr-sm'
              : 'bg-[hsl(var(--chat-ai-bg))] text-foreground rounded-tl-sm',
            isStreaming && 'animate-pulse'
          )}
        >
          {message || (isStreaming ? '...' : '')}
        </div>

        {/* Timestamp */}
        <span className="text-xs text-[hsl(var(--chat-timestamp))] px-1">{timeString}</span>
      </div>

      {/* Avatar placeholder for user (to maintain alignment) */}
      {isUser && <div className="flex-shrink-0 w-10" />}
    </div>
  );
}

/**
 * Date Divider Component
 * Shows date separator in chat
 */
export function ChatDateDivider({ date }: { date: Date }) {
  const dateString = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(date);

  return (
    <div className="flex items-center justify-center my-4">
      <div className="px-4 py-1.5 bg-muted/50 rounded-full text-xs text-muted-foreground">
        {dateString}
      </div>
    </div>
  );
}

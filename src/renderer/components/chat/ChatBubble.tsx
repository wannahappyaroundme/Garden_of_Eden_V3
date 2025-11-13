/**
 * ChatBubble Component
 * KakaoTalk-inspired message bubble with timestamp
 */

import { useState } from 'react';
import { cn } from '../../lib/utils';
import { MarkdownRenderer } from './MarkdownRenderer';

export interface ChatBubbleProps {
  message: string;
  messageId?: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isStreaming?: boolean;
  satisfaction?: 'positive' | 'negative' | null;
  onFeedback?: (messageId: string, satisfaction: 'positive' | 'negative') => void;
}

export function ChatBubble({
  message,
  messageId,
  role,
  timestamp,
  isStreaming = false,
  satisfaction,
  onFeedback
}: ChatBubbleProps) {
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);
  const [currentSatisfaction, setCurrentSatisfaction] = useState<'positive' | 'negative' | null>(satisfaction || null);

  // Format timestamp to HH:MM
  const timeString = new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(timestamp);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const handleFeedback = (feedbackType: 'positive' | 'negative') => {
    if (!messageId || !onFeedback) return;

    setCurrentSatisfaction(feedbackType);
    onFeedback(messageId, feedbackType);
  };

  return (
    <div
      className={cn(
        'flex w-full gap-2 mb-3',
        isUser ? 'justify-end animate-slide-in-right' : 'justify-start animate-slide-in-left'
      )}
      role="article"
      aria-label={`${isUser ? '사용자' : 'AI'} 메시지`}
    >
      {/* Avatar for AI */}
      {!isUser && (
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold"
          aria-hidden="true"
        >
          E
        </div>
      )}

      {/* Message content */}
      <div className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
        <div className="relative group">
          <div
            className={cn(
              'max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words',
              isUser
                ? 'bg-[hsl(var(--chat-user-bg))] text-gray-900 dark:text-white rounded-tr-sm'
                : 'bg-[hsl(var(--chat-ai-bg))] text-foreground rounded-tl-sm',
              isStreaming && 'animate-pulse'
            )}
          >
            {!isUser && message ? (
              <MarkdownRenderer content={message} />
            ) : (
              <div className="whitespace-pre-wrap">{message || (isStreaming ? '...' : '')}</div>
            )}
          </div>

          {/* Action buttons for AI messages */}
          {!isUser && message && !isStreaming && (
            <div className="absolute -right-24 top-2 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
              {/* Feedback buttons */}
              {messageId && onFeedback && (
                <>
                  <button
                    onClick={() => handleFeedback('positive')}
                    className={cn(
                      'p-1.5 rounded hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all',
                      currentSatisfaction === 'positive' ? 'text-green-600 bg-green-100 dark:bg-green-900/30' : 'text-muted-foreground'
                    )}
                    title="좋아요"
                    aria-label="좋아요"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={currentSatisfaction === 'positive' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleFeedback('negative')}
                    className={cn(
                      'p-1.5 rounded hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all',
                      currentSatisfaction === 'negative' ? 'text-red-600 bg-red-100 dark:bg-red-900/30' : 'text-muted-foreground'
                    )}
                    title="별로에요"
                    aria-label="별로에요"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={currentSatisfaction === 'negative' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                    </svg>
                  </button>
                </>
              )}

              {/* Copy button */}
              <button
                onClick={handleCopy}
                className="p-1.5 rounded hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition-opacity"
                title={copied ? 'Copied!' : 'Copy message'}
                aria-label={copied ? '메시지 복사됨' : '메시지 복사'}
              >
                {copied ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-xs text-[hsl(var(--chat-timestamp))] px-1" aria-label={`전송 시간: ${timeString}`}>
          {timeString}
        </span>
      </div>

      {/* Avatar placeholder for user (to maintain alignment) */}
      {isUser && <div className="flex-shrink-0 w-10" aria-hidden="true" />}
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
    <div className="flex items-center justify-center my-4" role="separator" aria-label={`날짜: ${dateString}`}>
      <div className="px-4 py-1.5 bg-muted/50 rounded-full text-xs text-muted-foreground">
        {dateString}
      </div>
    </div>
  );
}

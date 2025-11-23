/**
 * ChatBubble Component
 * KakaoTalk-inspired message bubble with timestamp
 */

import { useState, useEffect } from 'react';
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
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Format timestamp to HH:MM
  const timeString = new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(timestamp);

  // Track elapsed time when streaming (for AI messages only)
  useEffect(() => {
    if (!isStreaming || isUser) {
      setElapsedSeconds(0);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isStreaming, isUser]);

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
        'flex w-full gap-2.5 mb-4',
        isUser ? 'justify-end animate-slide-in-right' : 'justify-start animate-slide-in-left'
      )}
      role="article"
      aria-label={`${isUser ? '사용자' : 'Adam'} 메시지`}
    >
      {/* Avatar for AI (Adam) */}
      {!isUser && (
        <div
          className="flex-shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-bold shadow-sm border border-primary/10"
          aria-hidden="true"
        >
          A
        </div>
      )}

      {/* Message content */}
      <div className={cn('flex flex-col gap-1.5 w-full', isUser ? 'items-end' : 'items-start')}>
        <div className={cn('w-full max-w-[70%]', !isUser && 'group')}>
          <div
            className={cn(
              'px-4 py-3 rounded-2xl text-[13px] leading-relaxed break-words transition-all duration-200',
              isUser
                ? 'bg-[hsl(var(--chat-user-bg))] text-gray-900 dark:text-white rounded-tr-sm shadow-md hover:shadow-lg'
                : 'bg-[hsl(var(--chat-ai-bg))] text-foreground rounded-tl-sm shadow-sm hover:shadow-md border border-border/50',
              isStreaming && 'animate-pulse'
            )}
          >
            {!isUser && message ? (
              <MarkdownRenderer content={message} />
            ) : (
              <div className="whitespace-pre-wrap">
                {message || (isStreaming ? `Thinking... ${elapsedSeconds}s` : '')}
              </div>
            )}
          </div>

          {/* Action buttons for AI messages - Full width below bubble */}
          {!isUser && message && !isStreaming && (
            <div className="w-full flex justify-between items-center mt-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {/* Left side: Copy */}
              <div className="flex gap-1.5">
                {/* Copy button */}
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-150 hover:scale-110 active:scale-95 text-muted-foreground hover:text-foreground bg-background/80 backdrop-blur-sm shadow-sm"
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

              {/* Right side: Feedback buttons */}
              {messageId && onFeedback && (
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleFeedback('positive')}
                    className={cn(
                      'p-2 rounded-lg hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-150 hover:scale-110 active:scale-95',
                      currentSatisfaction === 'positive' ? 'text-green-600 bg-green-100 dark:bg-green-900/30 shadow-sm' : 'text-muted-foreground hover:text-foreground bg-background/80 backdrop-blur-sm shadow-sm'
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
                      'p-2 rounded-lg hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-150 hover:scale-110 active:scale-95',
                      currentSatisfaction === 'negative' ? 'text-red-600 bg-red-100 dark:bg-red-900/30 shadow-sm' : 'text-muted-foreground hover:text-foreground bg-background/80 backdrop-blur-sm shadow-sm'
                    )}
                    title="별로에요"
                    aria-label="별로에요"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={currentSatisfaction === 'negative' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-xs text-[hsl(var(--chat-timestamp))] px-1.5 font-medium" aria-label={`전송 시간: ${timeString}`}>
          {timeString}
        </span>
      </div>

      {/* Avatar placeholder for user (to maintain alignment) */}
      {isUser && <div className="flex-shrink-0 w-11" aria-hidden="true" />}
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
    <div className="flex items-center justify-center my-6 animate-fade-in" role="separator" aria-label={`날짜: ${dateString}`}>
      <div className="px-5 py-2 bg-muted/60 backdrop-blur-sm rounded-full text-xs text-muted-foreground font-medium shadow-sm border border-border/30">
        {dateString}
      </div>
    </div>
  );
}

/**
 * ErrorBubble Component
 * Displays error messages in chat with retry option
 */

import { Alert } from '../ui/alert';

interface ErrorBubbleProps {
  message: string;
  onRetry?: () => void;
  timestamp: Date;
}

export function ErrorBubble({ message, onRetry, timestamp }: ErrorBubbleProps) {
  // Format timestamp to HH:MM
  const timeString = new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(timestamp);

  return (
    <div className="flex w-full gap-2 mb-3 justify-start">
      {/* Avatar for AI */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 font-semibold">
        E
      </div>

      {/* Error content */}
      <div className="flex flex-col gap-1 items-start max-w-[70%]">
        <Alert variant="error">
          <div className="space-y-2">
            <p>{message}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-sm font-medium underline hover:no-underline"
              >
                다시 시도
              </button>
            )}
          </div>
        </Alert>

        {/* Timestamp */}
        <span className="text-xs text-[hsl(var(--chat-timestamp))] px-1">{timeString}</span>
      </div>
    </div>
  );
}

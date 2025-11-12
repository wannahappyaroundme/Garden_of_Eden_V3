/**
 * TypingIndicator Component
 * Shows animated dots when AI is thinking
 */

import { cn } from '../../lib/utils';

export function TypingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 mb-3', className)}>
      {/* AI Avatar */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
        E
      </div>

      {/* Typing animation */}
      <div className="bg-[hsl(var(--chat-ai-bg))] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
        <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" />
      </div>
    </div>
  );
}

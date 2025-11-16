/**
 * TypingIndicator Component
 * Shows animated dots when AI is thinking
 */

import { cn } from '../../lib/utils';

export function TypingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5 mb-4 animate-slide-in-left', className)}>
      {/* AI Avatar (Adam) */}
      <div className="flex-shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-bold shadow-sm border border-primary/10">
        A
      </div>

      {/* Typing animation */}
      <div className="bg-[hsl(var(--chat-ai-bg))] rounded-2xl rounded-tl-sm px-5 py-3.5 flex items-center gap-1.5 shadow-sm border border-border/50">
        <span className="w-2 h-2 bg-muted-foreground/70 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 bg-muted-foreground/70 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 bg-muted-foreground/70 rounded-full animate-bounce" />
      </div>
    </div>
  );
}

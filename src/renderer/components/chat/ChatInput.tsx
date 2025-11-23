/**
 * ChatInput Component
 * Input field with voice button and send functionality
 */

import { useState, useRef, useEffect, KeyboardEvent, forwardRef, useImperativeHandle } from 'react';
import { Send, Monitor } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { cn } from '../../lib/utils';
import ReasoningModeToggle from './ReasoningModeToggle'; // v3.5.0

export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onScreenContext?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export interface ChatInputHandle {
  focus: () => void;
  setValue: (value: string) => void;
}

export const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(
  (
    {
      onSendMessage,
      onScreenContext,
      isLoading = false,
      disabled = false,
      placeholder = '메시지를 입력하세요...',
    },
    ref
  ) => {
    const [message, setMessage] = useState('');
    const [isCapturingScreen, setIsCapturingScreen] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Expose focus and setValue methods to parent
    useImperativeHandle(ref, () => ({
      focus: () => {
        textareaRef.current?.focus();
      },
      setValue: (value: string) => {
        setMessage(value);
        // Focus the textarea after setting value
        setTimeout(() => textareaRef.current?.focus(), 0);
      },
    }));

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !isLoading && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleScreenContext = async () => {
    if (!onScreenContext) return;
    setIsCapturingScreen(true);
    try {
      await onScreenContext();
    } finally {
      setIsCapturingScreen(false);
    }
  };

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        {/* Screen context button */}
        <div className="flex-shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={handleScreenContext}
            disabled={disabled || isLoading || isCapturingScreen}
            className={cn('flex-shrink-0', isCapturingScreen && 'ring-2 ring-primary ring-offset-2')}
            title="화면 컨텍스트 추가"
          >
            <Monitor className={cn('h-4 w-4', isCapturingScreen && 'animate-pulse')} />
          </Button>
        </div>

        {/* Message input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className="min-h-[44px] max-h-[200px] resize-none pr-12"
            rows={1}
            aria-label="메시지 입력"
            title="Enter: 전송 | Shift+Enter: 줄바꿈"
          />
        </div>

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={!message.trim() || isLoading || disabled}
          size="icon"
          className="flex-shrink-0"
          title="전송 (Enter)"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Reasoning Mode Toggle and Helper text - v3.5.0 */}
      <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground mt-2">
        {/* Reasoning Mode Toggle */}
        <ReasoningModeToggle />

        {/* Helper text - Enhanced visibility */}
        <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border font-mono text-[10px]">
            Enter
          </kbd>
          <span>전송</span>
        </div>
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border font-mono text-[10px]">
            Shift+Enter
          </kbd>
          <span>줄바꿈</span>
        </div>
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border font-mono text-[10px]">
            ⌘K
          </kbd>
          <span>포커스</span>
        </div>
        </div>
      </div>
    </div>
  );
});

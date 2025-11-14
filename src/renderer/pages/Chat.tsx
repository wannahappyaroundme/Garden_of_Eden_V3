/**
 * Chat Page
 * Main chat interface with KakaoTalk-style design and conversation history sidebar
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { ChatBubble, ChatDateDivider } from '../components/chat/ChatBubble';
import { ChatInput, ChatInputHandle } from '../components/chat/ChatInput';
import { TypingIndicator } from '../components/chat/TypingIndicator';
import { ConversationHistory, ConversationHistoryHandle } from '../components/sidebar/ConversationHistory';
import { ErrorBubble } from '../components/chat/ErrorBubble';
import { Button } from '../components/ui/button';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useSmoothScroll } from '../hooks/useSmoothScroll';
import { DynamicIsland, useDynamicIsland } from '../components/DynamicIsland';
import { Eye, EyeOff } from 'lucide-react';
import SuggestedPromptCard from '../components/SuggestedPromptCard';
import ModeIndicator from '../components/ModeIndicator';
import ShortcutHelp from '../components/ShortcutHelp';
import SuggestionsPanel from '../components/SuggestionsPanel';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'error';
  timestamp: Date;
  errorRetryContent?: string; // For error messages, stores the original user message
}

interface ChatProps {
  onOpenSettings: () => void;
}

export function Chat({ onOpenSettings }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(undefined);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);
  const [suggestionsPanelCollapsed, setSuggestionsPanelCollapsed] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState({
    isTracking: false,
    lastCaptureTime: 0,
    captureCount: 0,
    captureInterval: 10,
  });
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<ChatInputHandle>(null);
  const conversationHistoryRef = useRef<ConversationHistoryHandle>(null);

  // Dynamic Island notifications
  const { notification, showNotification, hideNotification } = useDynamicIsland();

  // Toggle screen tracking (not implemented in Tauri yet)
  const handleToggleTracking = useCallback(async () => {
    // Show "Coming Soon" message
    alert('AI-Led Proactive Mode is coming in v1.1!\n\nThis feature will:\n- Monitor your screen\n- Analyze context\n- Make proactive suggestions\n\nFor now, use User-Led mode where the AI waits for your input.');
  }, []);

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    onFocusInput: () => inputRef.current?.focus(),
    onOpenSettings: onOpenSettings,
    onToggleScreenTracking: handleToggleTracking,
    onEscape: () => {
      // Blur the input if it's focused
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    },
  });

  // Handle ? key for shortcuts help
  useEffect(() => {
    const handleQuestionMark = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input
      if (e.key === '?' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setShowShortcutHelp(true);
      }
    };

    document.addEventListener('keydown', handleQuestionMark);
    return () => document.removeEventListener('keydown', handleQuestionMark);
  }, []);

  // Auto-scroll to bottom when new messages arrive using smooth scroll hook
  const messagesEndRef = useSmoothScroll<HTMLDivElement>({
    dependencies: [messages, isTyping],
    behavior: 'smooth',
    delay: 100,
  });

  const loadConversationMessages = useCallback(async (conversationId: string) => {
    try {
      const loadedMessages = await invoke<any[]>('get_conversation_messages', {
        conversationId,
      });
      // Convert timestamps to Date objects
      const formattedMessages: Message[] = loadedMessages.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        timestamp: new Date(msg.timestamp),
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Failed to load conversation messages:', error);
      // If no messages found, start with empty array
      setMessages([]);
    }
  }, []);

  // Load conversation messages when switching conversations
  useEffect(() => {
    if (currentConversationId) {
      loadConversationMessages(currentConversationId);
    }
  }, [currentConversationId, loadConversationMessages]);

  // Setup screen tracking event listeners
  useEffect(() => {
    // Check if screen tracking APIs are available (Electron only, not Tauri yet)
    if (window.api?.screenGetStatus) {
      // Get initial status
      window.api.screenGetStatus().then(status => {
        setTrackingStatus(status);
      }).catch(console.error);

      // Listen for status updates
      const unsubscribeStatus = window.api.onScreenStatusUpdate?.((status) => {
        setTrackingStatus(status);
      });

      // Listen for tracking notifications (Dynamic Island)
      const unsubscribeNotification = window.api.onScreenTrackingNotification?.((data) => {
        showNotification(data.action, { interval: data.interval });
      });

      // Listen for idle notifications
      const unsubscribeIdle = window.api.onScreenIdleNotification?.((data) => {
        showNotification('idle-warning', { idleDuration: data.idleDurationMinutes });
      });

      return () => {
        unsubscribeStatus?.();
        unsubscribeNotification?.();
        unsubscribeIdle?.();
      };
    }
    return undefined;
  }, [showNotification]);

  const handleSelectConversation = useCallback((conversationId: string | null) => {
    if (conversationId === null) {
      // New conversation - clear messages
      setMessages([]);
      setCurrentConversationId(undefined);
    } else {
      // Load existing conversation
      setCurrentConversationId(conversationId);
    }
  }, []);

  const handleSendMessage = async (content: string) => {
    const startTime = Date.now();

    // Create new conversation if this is the first message
    let conversationId = currentConversationId;
    if (!conversationId) {
      // Use fallback conversation ID (will be created by backend)
      conversationId = undefined;
    }

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content,
      role: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Create AI message placeholder with empty content
    const aiMessageId = `ai-${Date.now()}`;
    const aiMessage: Message = {
      id: aiMessageId,
      content: '',
      role: 'assistant',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, aiMessage]);

    // Show typing indicator
    setIsTyping(true);

    try {
      // Setup streaming listener for chat chunks
      const unlisten = await listen<{ chunk: string }>('chat-stream-chunk', (event) => {
        // Update AI message with streaming chunks
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, content: msg.content + event.payload.chunk }
              : msg
          )
        );
      });

      // Call Tauri streaming API
      const response = await invoke<{ conversation_id: string; message_id: string; response: string }>(
        'chat_stream',
        {
          request: {
            message: content,
            conversation_id: conversationId,
            context_level: 1,
          }
        }
      );

      // Cleanup listener
      unlisten();

      // Use the conversation ID from response if available
      if (response.conversation_id) {
        conversationId = response.conversation_id;
        if (!currentConversationId) {
          setCurrentConversationId(conversationId);
        }
      }

      // Update AI message with final response (in case streaming didn't complete)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? { ...msg, content: response.response }
            : msg
        )
      );

      // Refresh conversation list to show the new/updated conversation
      await conversationHistoryRef.current?.refresh();
    } catch (error) {
      console.error('Failed to send message:', error);

      // Display actual error message from backend for better debugging
      let errorContent = '죄송합니다. 메시지 전송에 실패했습니다.';

      if (error instanceof Error) {
        if (error.message.includes('Ollama') || error.message.includes('connect')) {
          errorContent = '🔌 AI 서비스에 연결할 수 없습니다.\n\nOllama가 실행 중인지 확인해주세요:\n1. 터미널에서 "ollama serve" 실행\n2. "ollama pull qwen2.5:14b" 로 모델 다운로드';
        } else if (error.message.includes('timeout')) {
          errorContent = '⏱️ AI 응답 시간이 초과되었습니다.\n다시 시도해주세요.';
        } else if (error.message.includes('database') || error.message.includes('SQL')) {
          errorContent = '💾 데이터베이스 오류가 발생했습니다.\n앱을 재시작해주세요.';
        } else if (error.message.includes('model')) {
          errorContent = '🤖 AI 모델 오류입니다.\n\nqwen2.5:14b 모델이 설치되어 있는지 확인해주세요:\n"ollama list" 명령어로 확인';
        } else {
          // Show the actual error for debugging in production
          errorContent = `❌ 오류 발생:\n\n${error.message}\n\n문제가 계속되면 개발자에게 문의하세요.`;
        }
      } else {
        errorContent = `❌ 알 수 없는 오류:\n\n${String(error)}`;
      }

      // Replace AI message with error message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? {
                ...msg,
                role: 'error',
                content: errorContent,
                errorRetryContent: content // Store original message for retry
              }
            : msg
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  // Handle retry for failed messages
  const handleRetry = useCallback((originalMessage: string) => {
    handleSendMessage(originalMessage);
  }, [handleSendMessage]);

  const handleVoiceStart = async () => {
    try {
      const result = await invoke<boolean>('voice_input_start');
      if (result) {
        setIsRecording(true);
      }
    } catch (error) {
      console.error('Failed to start voice recording:', error);
    }
  };

  const handleVoiceStop = async () => {
    try {
      const transcript = await invoke<string>('voice_input_stop');
      setIsRecording(false);

      // If transcript is available, send it as a message
      if (transcript && transcript.trim() && transcript !== 'Transcript placeholder') {
        await handleSendMessage(transcript);
      }
    } catch (error) {
      console.error('Failed to stop voice recording:', error);
      setIsRecording(false);
    }
  };

  // Group messages by date for date dividers (memoized)
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
    <div className="flex h-screen bg-background">
      {/* Conversation History Sidebar */}
      <ConversationHistory
        ref={conversationHistoryRef}
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
      />

      {/* Main Chat Area */}
      <main className="flex flex-col flex-1">
        {/* Header */}
        <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between titlebar-drag">
          <div>
            <h1 className="text-lg font-semibold">Garden of Eden</h1>
            <p className="text-xs text-muted-foreground" aria-label="애플리케이션 설명">AI Assistant</p>
          </div>
          <div className="flex items-center gap-4 titlebar-no-drag">
            {/* Mode Indicator - Shows user-led vs AI-led mode */}
            <ModeIndicator
              isTracking={trackingStatus.isTracking}
              onToggle={handleToggleTracking}
            />

            {/* Keyboard Shortcuts Help Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowShortcutHelp(true)}
              className="h-8 w-8 p-0"
              aria-label="키보드 단축키 도움말"
              title="키보드 단축키 (?))"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-muted-foreground"
              >
                <path
                  d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3m.08 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>

            {/* Settings Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenSettings}
              className="h-8 w-8 p-0"
              aria-label="설정 열기"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-muted-foreground"
              >
                <path
                  d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15V15Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>
          </div>
        </header>

        {/* Messages area */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-6 py-4 smooth-scroll"
          role="log"
          aria-live="polite"
          aria-label="대화 메시지 목록"
        >
          {messages.length === 0 ? (
            // Empty state with suggested prompts
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold mb-4">
                E
              </div>
              <h2 className="text-xl font-semibold mb-2">안녕하세요! 👋</h2>
              <p className="text-muted-foreground max-w-md mb-8">
                저는 Eden이에요. 무엇을 도와드릴까요?
              </p>

              {/* Suggested prompts grid */}
              <div className="grid grid-cols-2 gap-4 max-w-2xl w-full">
                <SuggestedPromptCard
                  icon="💻"
                  title="코딩 도움"
                  description="버그 해결, 코드 리뷰, 아키텍처 조언"
                  onClick={() => handleSendMessage('코딩 관련 질문이 있어')}
                />
                <SuggestedPromptCard
                  icon="📚"
                  title="학습 지원"
                  description="개념 설명, 예제 제공, 퀴즈"
                  onClick={() => handleSendMessage('새로운 것을 배우고 싶어')}
                />
                <SuggestedPromptCard
                  icon="🎯"
                  title="작업 관리"
                  description="일정 정리, 우선순위 설정"
                  onClick={() => handleSendMessage('오늘 할 일을 정리해줘')}
                />
                <SuggestedPromptCard
                  icon="💬"
                  title="그냥 대화"
                  description="고민 상담, 잡담"
                  onClick={() => handleSendMessage('요즘 어때?')}
                />
              </div>

              {/* Context-aware suggestion */}
              {trackingStatus.isTracking && (
                <div className="mt-6 text-sm text-muted-foreground max-w-md">
                  💡 화면 추적이 켜져있어요. "현재 화면 설명해줘" 또는 "이 코드 리뷰해줘"를 시도해보세요!
                </div>
              )}

              {/* Keyboard shortcuts hint */}
              <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-muted rounded border border-border font-mono">⌘K</kbd>
                  <span>채팅 입력창 포커스</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-muted rounded border border-border font-mono">?</kbd>
                  <span>모든 단축키 보기</span>
                </div>
              </div>
            </div>
          ) : (
            // Message list with date dividers
            <>
              {Object.entries(groupedMessages).map(([dateKey, dateMessages]) => (
                <div key={dateKey}>
                  <ChatDateDivider date={new Date(dateKey)} />
                  {dateMessages.map((message) =>
                    message.role === 'error' ? (
                      <ErrorBubble
                        key={message.id}
                        message={message.content}
                        timestamp={message.timestamp}
                        onRetry={
                          message.errorRetryContent
                            ? () => handleRetry(message.errorRetryContent!)
                            : undefined
                        }
                      />
                    ) : (
                      <ChatBubble
                        key={message.id}
                        message={message.content}
                        role={message.role}
                        timestamp={message.timestamp}
                      />
                    )
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && <TypingIndicator />}

              {/* Auto-scroll anchor */}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input area */}
        <ChatInput
          ref={inputRef}
          onSendMessage={handleSendMessage}
          onVoiceStart={handleVoiceStart}
          onVoiceStop={handleVoiceStop}
          isRecording={isRecording}
          isLoading={isTyping}
          placeholder="메시지를 입력하세요..."
        />
      </main>

      {/* Suggestions Panel */}
      <SuggestionsPanel
        onSendMessage={handleSendMessage}
        isCollapsed={suggestionsPanelCollapsed}
        onToggle={() => setSuggestionsPanelCollapsed(!suggestionsPanelCollapsed)}
      />

      {/* Dynamic Island Notification */}
      {notification && (
        <DynamicIsland
          show={notification.show}
          action={notification.action}
          interval={notification.interval}
          idleDuration={notification.idleDuration}
          onDismiss={hideNotification}
          onAction={handleToggleTracking}
        />
      )}

      {/* Keyboard Shortcuts Help */}
      <ShortcutHelp
        isOpen={showShortcutHelp}
        onClose={() => setShowShortcutHelp(false)}
      />
    </div>
  );
}

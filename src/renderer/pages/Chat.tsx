/**
 * Chat Page
 * Main chat interface with KakaoTalk-style design and conversation history sidebar
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useTranslation } from 'react-i18next';
import { ChatBubble, ChatDateDivider } from '../components/chat/ChatBubble';
import { ChatInput, ChatInputHandle } from '../components/chat/ChatInput';
import { TypingIndicator } from '../components/chat/TypingIndicator';
import {
  ConversationHistory,
  ConversationHistoryHandle,
} from '../components/sidebar/ConversationHistory';
import { ErrorBubble } from '../components/chat/ErrorBubble';
import { Button } from '../components/ui/button';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useSmoothScroll } from '../hooks/useSmoothScroll';
import { DynamicIsland, useDynamicIsland } from '../components/DynamicIsland';
import {
  ProactiveNotification,
  ProactiveSuggestion,
  useProactiveNotifications,
} from '../components/ProactiveNotification';
import SuggestedPromptCard from '../components/SuggestedPromptCard';
import ModeIndicator from '../components/ModeIndicator';
import ShortcutHelp from '../components/ShortcutHelp';
import SuggestionsPanel from '../components/SuggestionsPanel';
import { ToolCall } from '../../shared/types/tool.types';
import { ToolCallIndicator, ToolResultCard, ToolHistory } from '../components/tool';
import type { ToolCallRecord } from '../../shared/types/tool-history.types';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'error' | 'system';
  timestamp: Date;
  errorRetryContent?: string; // For error messages, stores the original user message
  toolCalls?: ToolCall[]; // v3.7.0: Tool calls associated with this message
}

interface ChatProps {
  onOpenSettings: () => void;
  onOpenIntegrations?: () => void;
  onOpenMemory?: () => void;
  onOpenTaskPlanner?: () => void; // v3.9.0 Phase 5 Stage 4
  onOpenGoalTracker?: () => void; // v3.9.0 Phase 5 Stage 4
  onOpenLearningStyle?: () => void; // v3.9.0 Phase 5 Stage 4
}

export function Chat({
  onOpenSettings,
  onOpenIntegrations,
  onOpenMemory,
  onOpenTaskPlanner,
  onOpenGoalTracker,
  onOpenLearningStyle,
}: ChatProps) {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(undefined);
  const [isTyping, setIsTyping] = useState(false);
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);
  const [suggestionsPanelCollapsed, setSuggestionsPanelCollapsed] = useState(false);
  const [showConversationHistory, setShowConversationHistory] = useState(false); // Hidden by default
  const [showToolHistory, setShowToolHistory] = useState(false); // v3.7.0 Phase 3: Tool history sidebar
  const [activeToolCalls, setActiveToolCalls] = useState<Map<string, ToolCall[]>>(new Map()); // v3.7.0: Track tool calls by message ID
  const [toolCallHistory, setToolCallHistory] = useState<ToolCallRecord[]>([]); // v3.7.0 Phase 3: Tool call history
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

  // Proactive notifications
  const { dismissSuggestion } = useProactiveNotifications();

  // Load mock tool history data (v3.7.0 Phase 3 demo)
  useEffect(() => {
    // TODO: Replace with actual backend call
    const mockHistory: ToolCallRecord[] = [
      {
        id: 'tc-001',
        toolName: 'web_search',
        displayName: 'Web Search',
        timestamp: Date.now() - 3600000, // 1 hour ago
        duration: 1240,
        status: 'success',
        input: { query: 'React hooks best practices', maxResults: 5 },
        output: {
          results: [
            { title: 'React Hooks Guide', url: 'https://react.dev/hooks' },
            { title: 'Best Practices', url: 'https://example.com/hooks' },
          ],
        },
      },
      {
        id: 'tc-002',
        toolName: 'read_file',
        displayName: 'Read File',
        timestamp: Date.now() - 7200000, // 2 hours ago
        duration: 45,
        status: 'success',
        input: { path: '/Users/kyungsbook/Desktop/Eden_Project_V3/package.json' },
        output: '{\n  "name": "garden-of-eden-v3",\n  ...\n}',
      },
      {
        id: 'tc-003',
        toolName: 'calculate',
        displayName: 'Calculator',
        timestamp: Date.now() - 86400000, // 1 day ago
        duration: 12,
        status: 'success',
        input: { expression: '(1234 + 5678) * 0.15' },
        output: { result: 1036.8 },
      },
      {
        id: 'tc-004',
        toolName: 'fetch_url',
        displayName: 'URL Fetch',
        timestamp: Date.now() - 172800000, // 2 days ago
        duration: 3420,
        status: 'error',
        input: { url: 'https://api.example.com/data' },
        output: null,
        error: {
          message: 'Connection timeout',
          code: 'ETIMEDOUT',
        },
      },
      {
        id: 'tc-005',
        toolName: 'get_system_info',
        displayName: 'System Info',
        timestamp: Date.now() - 259200000, // 3 days ago
        duration: 105,
        status: 'success',
        input: { privacyLevel: 'standard' },
        output: {
          os: 'Darwin',
          arch: 'arm64',
          cpuCores: 10,
          totalMemory: 16384,
        },
      },
    ];
    setToolCallHistory(mockHistory);
  }, []);

  // Toggle screen tracking
  const handleToggleTracking = useCallback(async () => {
    try {
      const result = await invoke<{ is_tracking: boolean; capture_interval: number }>(
        'screen_toggle_tracking',
        {
          interval: 30, // 30 seconds
        }
      );

      setTrackingStatus((prev) => ({
        ...prev,
        isTracking: result.is_tracking,
        captureInterval: result.capture_interval,
      }));

      if (result.is_tracking) {
        showNotification('started', { interval: result.capture_interval });
      } else {
        showNotification('stopped', { interval: result.capture_interval });
      }
    } catch (error) {
      console.error('Failed to toggle screen tracking:', error);
      alert('화면 추적 토글에 실패했습니다: ' + error);
    }
  }, [showNotification]);

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
      if (
        e.key === '?' &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
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
      console.log('Loading messages for conversation:', conversationId);
      const loadedMessages = await invoke<any[]>('get_conversation_messages', {
        conversationId,
      });
      console.log('Loaded messages:', loadedMessages.length, 'messages');
      // Convert timestamps to Date objects
      const formattedMessages: Message[] = loadedMessages.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        timestamp: new Date(msg.timestamp),
      }));
      console.log('Setting messages:', formattedMessages);
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

  // Setup screen tracking status polling
  useEffect(() => {
    // Get initial status
    invoke<{
      is_tracking: boolean;
      last_capture_time: number;
      capture_count: number;
      capture_interval: number;
    }>('screen_get_status')
      .then((status) => {
        setTrackingStatus({
          isTracking: status.is_tracking,
          lastCaptureTime: status.last_capture_time,
          captureCount: status.capture_count,
          captureInterval: status.capture_interval,
        });
      })
      .catch(console.error);

    // Poll status every 5 seconds to keep UI updated
    const intervalId = setInterval(() => {
      invoke<{
        is_tracking: boolean;
        last_capture_time: number;
        capture_count: number;
        capture_interval: number;
      }>('screen_get_status')
        .then((status) => {
          setTrackingStatus({
            isTracking: status.is_tracking,
            lastCaptureTime: status.last_capture_time,
            captureCount: status.capture_count,
            captureInterval: status.capture_interval,
          });
        })
        .catch(console.error);
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  // v3.7.0: Setup tool execution event listeners
  useEffect(() => {
    const setupToolListeners = async () => {
      // Tool execution start
      const unlistenStart = await listen<{
        messageId: string;
        toolName: string;
        input: Record<string, any>;
      }>('ai:tool-execution-start', (event) => {
        const { messageId, toolName, input } = event.payload;
        console.log('Tool execution started:', toolName, input);

        setActiveToolCalls((prev) => {
          const newMap = new Map(prev);
          const existing = newMap.get(messageId) || [];
          newMap.set(messageId, [
            ...existing,
            {
              id: `${messageId}-${toolName}-${Date.now()}`,
              toolName,
              displayName: toolName,
              status: 'loading',
              startTime: Date.now(),
              input,
            },
          ]);
          return newMap;
        });
      });

      // Tool execution complete
      const unlistenComplete = await listen<{
        messageId: string;
        toolName: string;
        output: any;
        executionTimeMs: number;
      }>('ai:tool-execution-complete', (event) => {
        const { messageId, toolName, output, executionTimeMs } = event.payload;
        console.log('Tool execution completed:', toolName, output);

        setActiveToolCalls((prev) => {
          const newMap = new Map(prev);
          const calls = newMap.get(messageId) || [];
          const updated = calls.map((call) =>
            call.toolName === toolName && call.status === 'loading'
              ? {
                  ...call,
                  status: 'success' as const,
                  endTime: Date.now(),
                  executionTimeMs,
                  output,
                }
              : call
          );
          newMap.set(messageId, updated);
          return newMap;
        });
      });

      // Tool execution error
      const unlistenError = await listen<{
        messageId: string;
        toolName: string;
        error: string;
      }>('ai:tool-execution-error', (event) => {
        const { messageId, toolName, error } = event.payload;
        console.error('Tool execution error:', toolName, error);

        setActiveToolCalls((prev) => {
          const newMap = new Map(prev);
          const calls = newMap.get(messageId) || [];
          const updated = calls.map((call) =>
            call.toolName === toolName && call.status === 'loading'
              ? {
                  ...call,
                  status: 'error' as const,
                  endTime: Date.now(),
                  error,
                }
              : call
          );
          newMap.set(messageId, updated);
          return newMap;
        });
      });

      return () => {
        unlistenStart();
        unlistenComplete();
        unlistenError();
      };
    };

    setupToolListeners();
  }, []);

  const handleSelectConversation = useCallback((conversationId: string | null) => {
    console.log('handleSelectConversation called with:', conversationId);
    if (conversationId === null) {
      // New conversation - clear messages
      console.log('Starting new conversation - clearing messages');
      setMessages([]);
      setCurrentConversationId(undefined);
    } else {
      // Load existing conversation
      console.log('Loading existing conversation:', conversationId);
      setCurrentConversationId(conversationId);
    }
  }, []);

  const handleSendMessage = async (content: string) => {
    // Track start time for potential performance monitoring
    Date.now();

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
            msg.id === aiMessageId ? { ...msg, content: msg.content + event.payload.chunk } : msg
          )
        );
      });

      // Call Tauri streaming API
      const response = await invoke<{
        conversation_id: string;
        message_id: string;
        response: string;
      }>('chat_stream', {
        request: {
          message: content,
          conversation_id: conversationId,
          context_level: 1,
        },
      });

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
        prev.map((msg) => (msg.id === aiMessageId ? { ...msg, content: response.response } : msg))
      );

      // Refresh conversation list to show the new/updated conversation
      await conversationHistoryRef.current?.refresh();
    } catch (error) {
      console.error('Failed to send message:', error);

      // Display actual error message from backend for better debugging
      let errorContent = '죄송합니다. 메시지 전송에 실패했습니다.';

      if (error instanceof Error) {
        if (error.message.includes('Ollama') || error.message.includes('connect')) {
          errorContent =
            '🔌 AI 서비스에 연결할 수 없습니다.\n\nOllama가 실행 중인지 확인해주세요:\n1. 터미널에서 "ollama serve" 실행\n2. "ollama pull qwen2.5:14b" 로 모델 다운로드';
        } else if (error.message.includes('timeout')) {
          errorContent = '⏱️ AI 응답 시간이 초과되었습니다.\n다시 시도해주세요.';
        } else if (error.message.includes('database') || error.message.includes('SQL')) {
          errorContent = '💾 데이터베이스 오류가 발생했습니다.\n앱을 재시작해주세요.';
        } else if (error.message.includes('model')) {
          errorContent =
            '🤖 AI 모델 오류입니다.\n\nqwen2.5:14b 모델이 설치되어 있는지 확인해주세요:\n"ollama list" 명령어로 확인';
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
                errorRetryContent: content, // Store original message for retry
              }
            : msg
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  // Handle retry for failed messages
  const handleRetry = useCallback(
    (originalMessage: string) => {
      handleSendMessage(originalMessage);
    },
    [handleSendMessage]
  );

  // Handle feedback (thumbs up/down) for learning system
  const handleFeedback = useCallback(
    async (messageId: string, satisfaction: 'positive' | 'negative') => {
      try {
        // Convert positive/negative to 0.0-1.0 satisfaction score
        const satisfactionScore = satisfaction === 'positive' ? 1.0 : 0.0;

        // Find the message to get its content
        const message = messages.find((msg) => msg.id === messageId);
        if (!message || message.role !== 'assistant') {
          console.warn('Invalid message for feedback:', messageId);
          return;
        }

        // Record feedback with learning service
        await invoke('learning_record_feedback', {
          feedback: {
            conversation_id: currentConversationId || 'unknown',
            satisfaction: satisfactionScore,
            timestamp: Date.now(),
            // We'll send persona snapshot from settings or use defaults
            persona_snapshot: {
              formality: 0.3,
              verbosity: 0.5,
              humor: 0.2,
              emoji_usage: 0.1,
              proactiveness: 0.4,
              technical_depth: 0.6,
              empathy: 0.5,
              code_examples: 0.7,
              questioning: 0.5,
              suggestions: 0.4,
            },
          },
        });

        console.log(`Feedback recorded: ${satisfaction} for message ${messageId}`);

        // TODO: Show feedback notification with proper type
        // showNotification('feedback', { type: satisfaction });
      } catch (error) {
        console.error('Failed to record feedback:', error);
      }
    },
    [messages, currentConversationId, showNotification]
  );

  const handleScreenContext = async () => {
    try {
      // TODO: Add screen capture notification type
      // showNotification('screen_capturing', {});

      // Capture and analyze screen with level 2 (detailed)
      const analysis = await invoke<{
        description: string;
        detected_application: string | null;
        detected_language: string | null;
        workspace_type: string | null;
        confidence: number;
        context_level: number;
      }>('screen_analyze_current', {
        contextLevel: 2,
      });

      console.log('Screen analysis:', analysis);

      // Format context message
      const contextMessage = `[Screen Context]\nApplication: ${analysis.detected_application || 'Unknown'}\n${analysis.detected_language ? `Language: ${analysis.detected_language}\n` : ''}${analysis.workspace_type ? `Workspace: ${analysis.workspace_type}\n` : ''}${analysis.description}`;

      // Insert context into chat input
      inputRef.current?.setValue(contextMessage);

      // TODO: Add screen captured notification
      // showNotification('screen_captured', { app: analysis.detected_application || 'Unknown' });
      console.log('Screen captured:', analysis.detected_application || 'Unknown');
    } catch (error) {
      console.error('Failed to capture screen context:', error);
      // TODO: Add error notification
      // showNotification('error', { message: 'Failed to capture screen context' });
    }
  };

  // Proactive suggestion handlers
  const handleAcceptSuggestion = (suggestion: ProactiveSuggestion) => {
    // Insert suggestion into chat input for user to review
    inputRef.current?.setValue(suggestion.suggestion);
    dismissSuggestion(suggestion.id);
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    dismissSuggestion(suggestionId);
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
      {/* Conversation History Sidebar - Conditionally rendered with slide animation */}
      {showConversationHistory && (
        <div className="animate-slide-in-left">
          <ConversationHistory
            ref={conversationHistoryRef}
            currentConversationId={currentConversationId}
            onSelectConversation={handleSelectConversation}
          />
        </div>
      )}

      {/* Main Chat Area */}
      <main className="flex flex-col flex-1">
        {/* Header */}
        <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between titlebar-drag">
          <div className="flex items-center gap-3">
            {/* Hamburger Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConversationHistory(!showConversationHistory)}
              className="h-8 w-8 p-0 titlebar-no-drag"
              aria-label={showConversationHistory ? '대화 목록 숨기기' : '대화 목록 보기'}
              title={showConversationHistory ? '대화 목록 숨기기' : '대화 목록 보기'}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-muted-foreground"
              >
                <path
                  d="M3 12H21M3 6H21M3 18H21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Garden of Eden</h1>
              <p className="text-xs text-muted-foreground" aria-label="애플리케이션 설명">
                AI Assistant
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 titlebar-no-drag">
            {/* Mode Indicator - Shows user-led vs AI-led mode */}
            <ModeIndicator isTracking={trackingStatus.isTracking} onToggle={handleToggleTracking} />

            {/* Tool History Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowToolHistory(!showToolHistory)}
              className="h-8 w-8 p-0"
              aria-label={showToolHistory ? '도구 히스토리 숨기기' : '도구 히스토리 보기'}
              title={showToolHistory ? '도구 히스토리 숨기기' : '도구 히스토리 보기'}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={showToolHistory ? 'text-blue-600' : 'text-muted-foreground'}
              >
                <path
                  d="M14.7 6.3C15.1 5.9 15.1 5.3 14.7 4.9 14.3 4.5 13.7 4.5 13.3 4.9L8.7 9.3C8.3 9.7 8.3 10.3 8.7 10.7L13.3 15.1C13.7 15.5 14.3 15.5 14.7 15.1 15.1 14.7 15.1 14.1 14.7 13.7L11.4 10.5 20 10.5C20.6 10.5 21 10.1 21 9.5 21 8.9 20.6 8.5 20 8.5L11.4 8.5 14.7 6.3Z"
                  fill="currentColor"
                />
              </svg>
            </Button>

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

            {/* Integrations Button */}
            {onOpenIntegrations && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenIntegrations}
                className="h-8 w-8 p-0"
                aria-label="연동 관리"
                title="Integrations"
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
                    d="M10 13C10.4295 13.5741 10.9774 14.0491 11.6066 14.3929C12.2357 14.7367 12.9315 14.9411 13.6467 14.9923C14.3618 15.0435 15.0796 14.9403 15.7513 14.6897C16.4231 14.4392 17.0331 14.047 17.54 13.54L20.54 10.54C21.4508 9.59695 21.9548 8.33394 21.9434 7.02296C21.932 5.71198 21.4061 4.45791 20.4791 3.53087C19.5521 2.60383 18.298 2.07799 16.987 2.0666C15.676 2.0552 14.413 2.55918 13.47 3.46997L11.75 5.17997"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14 11C13.5705 10.4259 13.0226 9.9508 12.3934 9.60704C11.7642 9.26328 11.0685 9.05886 10.3533 9.00769C9.63819 8.95652 8.92037 9.0597 8.24861 9.31026C7.57685 9.56082 6.96684 9.95303 6.45996 10.46L3.45996 13.46C2.54917 14.403 2.04519 15.666 2.05659 16.977C2.06798 18.288 2.59382 19.5421 3.52086 20.4691C4.4479 21.3961 5.70197 21.922 7.01295 21.9334C8.32393 21.9448 9.58694 21.4408 10.53 20.53L12.24 18.82"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Button>
            )}

            {/* Memory Visualization Button */}
            {onOpenMemory && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenMemory}
                className="h-8 w-8 p-0"
                aria-label="메모리 시각화"
                title="Memory Visualization"
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
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
                    fill="currentColor"
                  />
                </svg>
              </Button>
            )}

            {/* v3.9.0 Phase 5 Stage 4 - Reasoning Engine 2.0 Navigation */}
            {onOpenTaskPlanner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenTaskPlanner}
                className="h-8 w-8 p-0"
                aria-label="작업 계획"
                title="Task Planner"
              >
                🎯
              </Button>
            )}

            {onOpenGoalTracker && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenGoalTracker}
                className="h-8 w-8 p-0"
                aria-label="목표 추적"
                title="Goal Tracker"
              >
                🏆
              </Button>
            )}

            {onOpenLearningStyle && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenLearningStyle}
                className="h-8 w-8 p-0"
                aria-label="학습 스타일"
                title="Learning Style"
              >
                🎓
              </Button>
            )}

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
                  💡 화면 추적이 켜져있어요. "현재 화면 설명해줘" 또는 "이 코드 리뷰해줘"를
                  시도해보세요!
                </div>
              )}

              {/* Keyboard shortcuts hint */}
              <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <kbd className="px-2 py-1 bg-muted rounded border border-border font-mono">
                    ⌘K
                  </kbd>
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
                    ) : message.role === 'system' ? (
                      <div key={message.id} className="flex justify-center my-2">
                        <div className="bg-muted px-4 py-2 rounded-lg text-sm text-muted-foreground">
                          {message.content}
                        </div>
                      </div>
                    ) : (
                      <div key={message.id}>
                        <ChatBubble
                          messageId={message.id}
                          message={message.content}
                          role={message.role}
                          timestamp={message.timestamp}
                          onFeedback={handleFeedback}
                        />
                        {/* v3.7.0: Tool call visualizations */}
                        {message.role === 'assistant' && activeToolCalls.get(message.id) && (
                          <div className="ml-12 mt-2 space-y-2">
                            {activeToolCalls.get(message.id)!.map((toolCall) => (
                              <div key={toolCall.id}>
                                {toolCall.status === 'loading' && (
                                  <ToolCallIndicator
                                    toolName={toolCall.toolName}
                                    status={toolCall.status}
                                  />
                                )}
                                {(toolCall.status === 'success' || toolCall.status === 'error') && (
                                  <ToolResultCard toolCall={toolCall} />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
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
          onScreenContext={handleScreenContext}
          isLoading={isTyping}
          placeholder="메시지를 입력하세요..."
        />
      </main>

      {/* Tool History Sidebar - Conditionally rendered with slide animation */}
      {showToolHistory && (
        <div className="w-96 border-l border-border bg-card animate-slide-in-right">
          <ToolHistory
            records={toolCallHistory}
            onRefresh={() => {
              // TODO: Refresh tool history from backend
              console.log('Refresh tool history');
            }}
            onClearHistory={() => {
              setToolCallHistory([]);
            }}
          />
        </div>
      )}

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

      {/* Proactive Notification */}
      <ProactiveNotification
        onAccept={handleAcceptSuggestion}
        onDismiss={handleDismissSuggestion}
        onOpenSettings={onOpenSettings}
      />

      {/* Keyboard Shortcuts Help */}
      <ShortcutHelp isOpen={showShortcutHelp} onClose={() => setShowShortcutHelp(false)} />
    </div>
  );
}

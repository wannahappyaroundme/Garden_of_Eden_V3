/**
 * Chat Handlers Hook (v3.5.2)
 *
 * Extracted from Chat.tsx for better maintainability.
 * Contains all event handlers for chat functionality.
 */

import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { Message } from './useChatState';
import type { ChatInputHandle } from '../components/chat/ChatInput';
import type { ConversationHistoryHandle } from '../components/sidebar/ConversationHistory';

interface UseChatHandlersProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  currentConversationId: string | undefined;
  setCurrentConversationId: React.Dispatch<React.SetStateAction<string | undefined>>;
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>;
  setTrackingStatus: React.Dispatch<React.SetStateAction<{
    isTracking: boolean;
    lastCaptureTime: number;
    captureCount: number;
    captureInterval: number;
  }>>;
  inputRef: React.RefObject<ChatInputHandle>;
  conversationHistoryRef: React.RefObject<ConversationHistoryHandle>;
  showNotification: (action: string, data: any) => void;
}

export function useChatHandlers({
  messages,
  setMessages,
  currentConversationId,
  setCurrentConversationId,
  setIsTyping,
  setTrackingStatus,
  inputRef,
  conversationHistoryRef,
  showNotification,
}: UseChatHandlersProps) {
  // Toggle screen tracking
  const handleToggleTracking = useCallback(async () => {
    try {
      const result = await invoke<{ is_tracking: boolean; capture_interval: number }>(
        'screen_toggle_tracking',
        { interval: 30 }
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
  }, [showNotification, setTrackingStatus]);

  // Send message
  const handleSendMessage = useCallback(
    async (content: string) => {
      let conversationId = currentConversationId;
      if (!conversationId) {
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

      // Create AI message placeholder
      const aiMessageId = `ai-${Date.now()}`;
      const aiMessage: Message = {
        id: aiMessageId,
        content: '',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      setIsTyping(true);

      try {
        const unlisten = await listen<{ chunk: string }>('chat-stream-chunk', (event) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMessageId ? { ...msg, content: msg.content + event.payload.chunk } : msg
            )
          );
        });

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

        unlisten();

        if (response.conversation_id) {
          conversationId = response.conversation_id;
          if (!currentConversationId) {
            setCurrentConversationId(conversationId);
          }
        }

        setMessages((prev) =>
          prev.map((msg) => (msg.id === aiMessageId ? { ...msg, content: response.response } : msg))
        );

        await conversationHistoryRef.current?.refresh();
      } catch (error) {
        console.error('Failed to send message:', error);

        let errorContent = '죄송합니다. 메시지 전송에 실패했습니다.';

        if (error instanceof Error) {
          if (error.message.includes('Ollama') || error.message.includes('connect')) {
            errorContent =
              'AI 서비스에 연결할 수 없습니다.\n\nOllama가 실행 중인지 확인해주세요:\n1. 터미널에서 "ollama serve" 실행\n2. "ollama pull qwen2.5:14b" 로 모델 다운로드';
          } else if (error.message.includes('timeout')) {
            errorContent = 'AI 응답 시간이 초과되었습니다.\n다시 시도해주세요.';
          } else if (error.message.includes('database') || error.message.includes('SQL')) {
            errorContent = '데이터베이스 오류가 발생했습니다.\n앱을 재시작해주세요.';
          } else if (error.message.includes('model')) {
            errorContent =
              'AI 모델 오류입니다.\n\nqwen2.5:14b 모델이 설치되어 있는지 확인해주세요:\n"ollama list" 명령어로 확인';
          } else {
            errorContent = `오류 발생:\n\n${error.message}\n\n문제가 계속되면 개발자에게 문의하세요.`;
          }
        } else {
          errorContent = `알 수 없는 오류:\n\n${String(error)}`;
        }

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? {
                  ...msg,
                  role: 'error',
                  content: errorContent,
                  errorRetryContent: content,
                }
              : msg
          )
        );
      } finally {
        setIsTyping(false);
      }
    },
    [currentConversationId, setCurrentConversationId, setMessages, setIsTyping, conversationHistoryRef]
  );

  // Retry failed message
  const handleRetry = useCallback(
    (originalMessage: string) => {
      handleSendMessage(originalMessage);
    },
    [handleSendMessage]
  );

  // Record feedback
  const handleFeedback = useCallback(
    async (messageId: string, satisfaction: 'positive' | 'negative') => {
      try {
        const satisfactionScore = satisfaction === 'positive' ? 1.0 : 0.0;
        const message = messages.find((msg) => msg.id === messageId);

        if (!message || message.role !== 'assistant') {
          console.warn('Invalid message for feedback:', messageId);
          return;
        }

        await invoke('learning_record_feedback', {
          feedback: {
            conversation_id: currentConversationId || 'unknown',
            satisfaction: satisfactionScore,
            timestamp: Date.now(),
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
      } catch (error) {
        console.error('Failed to record feedback:', error);
      }
    },
    [messages, currentConversationId]
  );

  // Capture screen context
  const handleScreenContext = useCallback(async () => {
    try {
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

      const contextMessage = `[Screen Context]\nApplication: ${analysis.detected_application || 'Unknown'}\n${analysis.detected_language ? `Language: ${analysis.detected_language}\n` : ''}${analysis.workspace_type ? `Workspace: ${analysis.workspace_type}\n` : ''}${analysis.description}`;

      inputRef.current?.setValue(contextMessage);
      console.log('Screen captured:', analysis.detected_application || 'Unknown');
    } catch (error) {
      console.error('Failed to capture screen context:', error);
    }
  }, [inputRef]);

  return {
    handleToggleTracking,
    handleSendMessage,
    handleRetry,
    handleFeedback,
    handleScreenContext,
  };
}

export default useChatHandlers;

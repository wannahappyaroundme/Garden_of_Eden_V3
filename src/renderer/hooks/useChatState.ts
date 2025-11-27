/**
 * Chat State Hook (v3.5.2)
 *
 * Extracted from Chat.tsx for better maintainability.
 * Manages all chat-related state including messages, conversations, and tool calls.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { ChatInputHandle } from '../components/chat/ChatInput';
import type { ConversationHistoryHandle } from '../components/sidebar/ConversationHistory';
import type { ToolCall } from '../../shared/types/tool.types';
import type { ToolCallRecord } from '../../shared/types/tool-history.types';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'error' | 'system';
  timestamp: Date;
  errorRetryContent?: string;
  toolCalls?: ToolCall[];
}

export interface TrackingStatus {
  isTracking: boolean;
  lastCaptureTime: number;
  captureCount: number;
  captureInterval: number;
}

export interface ChatState {
  messages: Message[];
  currentConversationId: string | undefined;
  isTyping: boolean;
  showShortcutHelp: boolean;
  suggestionsPanelCollapsed: boolean;
  showConversationHistory: boolean;
  showToolHistory: boolean;
  activeToolCalls: Map<string, ToolCall[]>;
  toolCallHistory: ToolCallRecord[];
  trackingStatus: TrackingStatus;
}

export function useChatState() {
  // Core state
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(undefined);
  const [isTyping, setIsTyping] = useState(false);

  // UI state
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);
  const [suggestionsPanelCollapsed, setSuggestionsPanelCollapsed] = useState(false);
  const [showConversationHistory, setShowConversationHistory] = useState(false);
  const [showToolHistory, setShowToolHistory] = useState(false);

  // Tool state
  const [activeToolCalls, setActiveToolCalls] = useState<Map<string, ToolCall[]>>(new Map());
  const [toolCallHistory, setToolCallHistory] = useState<ToolCallRecord[]>([]);

  // Tracking state
  const [trackingStatus, setTrackingStatus] = useState<TrackingStatus>({
    isTracking: false,
    lastCaptureTime: 0,
    captureCount: 0,
    captureInterval: 10,
  });

  // Refs
  const inputRef = useRef<ChatInputHandle>(null);
  const conversationHistoryRef = useRef<ConversationHistoryHandle>(null);

  // Load conversation messages
  const loadConversationMessages = useCallback(async (conversationId: string) => {
    try {
      console.log('Loading messages for conversation:', conversationId);
      const loadedMessages = await invoke<any[]>('get_conversation_messages', {
        conversationId,
      });
      console.log('Loaded messages:', loadedMessages.length, 'messages');

      const formattedMessages: Message[] = loadedMessages.map((msg: any) => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        timestamp: new Date(msg.timestamp),
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Failed to load conversation messages:', error);
      setMessages([]);
    }
  }, []);

  // Handle conversation selection
  const handleSelectConversation = useCallback((conversationId: string | null) => {
    console.log('handleSelectConversation called with:', conversationId);
    if (conversationId === null) {
      console.log('Starting new conversation - clearing messages');
      setMessages([]);
      setCurrentConversationId(undefined);
    } else {
      console.log('Loading existing conversation:', conversationId);
      setCurrentConversationId(conversationId);
    }
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      loadConversationMessages(currentConversationId);
    }
  }, [currentConversationId, loadConversationMessages]);

  // Setup screen tracking status polling
  useEffect(() => {
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

  // Setup tool execution event listeners
  useEffect(() => {
    const setupToolListeners = async () => {
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

  // Load mock tool history (TODO: Replace with actual backend call)
  useEffect(() => {
    const mockHistory: ToolCallRecord[] = [
      {
        id: 'tc-001',
        toolName: 'web_search',
        displayName: 'Web Search',
        timestamp: Date.now() - 3600000,
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
        timestamp: Date.now() - 7200000,
        duration: 45,
        status: 'success',
        input: { path: '/Users/kyungsbook/Desktop/Eden_Project_V3/package.json' },
        output: '{\n  "name": "garden-of-eden-v3",\n  ...\n}',
      },
    ];
    setToolCallHistory(mockHistory);
  }, []);

  return {
    // State
    messages,
    setMessages,
    currentConversationId,
    setCurrentConversationId,
    isTyping,
    setIsTyping,
    showShortcutHelp,
    setShowShortcutHelp,
    suggestionsPanelCollapsed,
    setSuggestionsPanelCollapsed,
    showConversationHistory,
    setShowConversationHistory,
    showToolHistory,
    setShowToolHistory,
    activeToolCalls,
    setActiveToolCalls,
    toolCallHistory,
    setToolCallHistory,
    trackingStatus,
    setTrackingStatus,

    // Refs
    inputRef,
    conversationHistoryRef,

    // Actions
    loadConversationMessages,
    handleSelectConversation,
  };
}

export default useChatState;

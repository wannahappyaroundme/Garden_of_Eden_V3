/**
 * Chat Page
 * Main chat interface with KakaoTalk-style design and conversation history sidebar
 */

import { useState, useEffect, useRef } from 'react';
import { ChatBubble, ChatDateDivider } from '../components/chat/ChatBubble';
import { ChatInput } from '../components/chat/ChatInput';
import { TypingIndicator } from '../components/chat/TypingIndicator';
import { ConversationHistory } from '../components/sidebar/ConversationHistory';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(undefined);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Load conversation messages when switching conversations
  useEffect(() => {
    if (currentConversationId) {
      loadConversationMessages(currentConversationId);
    }
  }, [currentConversationId]);

  const loadConversationMessages = async (conversationId: string) => {
    try {
      const loadedMessages = await window.api.getConversationMessages(conversationId);
      // Convert timestamps to Date objects
      const formattedMessages: Message[] = loadedMessages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        timestamp: new Date(msg.timestamp),
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Failed to load conversation messages:', error);
    }
  };

  const handleSelectConversation = (conversationId: string | null) => {
    if (conversationId === null) {
      // New conversation - clear messages
      setMessages([]);
      setCurrentConversationId(undefined);
    } else {
      // Load existing conversation
      setCurrentConversationId(conversationId);
    }
  };

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content,
      role: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Show typing indicator
    setIsTyping(true);

    try {
      // Call IPC to send message to AI
      const response = await window.api.chat({
        message: content,
        conversationId: currentConversationId,
        contextLevel: 1, // Default context level
      });

      // Update conversation ID if this was a new conversation
      if (!currentConversationId) {
        setCurrentConversationId(response.conversationId);
      }

      // Add AI response
      const aiMessage: Message = {
        id: response.messageId,
        content: response.response,
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);

      // Determine error message based on error type
      let errorContent = '죄송합니다. 메시지 전송에 실패했습니다.';

      if (error instanceof Error) {
        if (error.message.includes('Ollama')) {
          errorContent = 'AI 서비스에 연결할 수 없습니다. Ollama가 실행 중인지 확인해주세요.';
        } else if (error.message.includes('timeout')) {
          errorContent = 'AI 응답 시간이 초과되었습니다. 다시 시도해주세요.';
        } else if (error.message.includes('database')) {
          errorContent = '데이터베이스 오류가 발생했습니다. 앱을 재시작해주세요.';
        }
      }

      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: errorContent + '\n\n다시 시도하시겠습니까?',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceStart = async () => {
    try {
      const result = await window.api.voiceInputStart();
      if (result) {
        setIsRecording(true);
      }
    } catch (error) {
      console.error('Failed to start voice recording:', error);
    }
  };

  const handleVoiceStop = async () => {
    try {
      const transcript = await window.api.voiceInputStop();
      setIsRecording(false);

      // If transcript is available, send it as a message
      if (transcript && transcript.trim()) {
        await handleSendMessage(transcript);
      }
    } catch (error) {
      console.error('Failed to stop voice recording:', error);
      setIsRecording(false);
    }
  };

  // Group messages by date for date dividers
  const groupedMessages = messages.reduce(
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

  return (
    <div className="flex h-screen bg-background">
      {/* Conversation History Sidebar */}
      <ConversationHistory
        currentConversationId={currentConversationId}
        onSelectConversation={handleSelectConversation}
      />

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between titlebar-drag">
          <div>
            <h1 className="text-lg font-semibold">Garden of Eden</h1>
            <p className="text-xs text-muted-foreground">AI Assistant</p>
          </div>
          <div className="text-xs text-muted-foreground titlebar-no-drag">
            {messages.length > 0 ? `${messages.length} messages` : 'Start chatting'}
          </div>
        </header>

        {/* Messages area */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-6 py-4"
          style={{ scrollBehavior: 'smooth' }}
        >
          {messages.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold mb-4">
                E
              </div>
              <h2 className="text-xl font-semibold mb-2">안녕하세요! 👋</h2>
              <p className="text-muted-foreground max-w-md">
                저는 Eden이에요. 무엇을 도와드릴까요?
                <br />
                편하게 질문해주세요!
              </p>
            </div>
          ) : (
            // Message list with date dividers
            <>
              {Object.entries(groupedMessages).map(([dateKey, dateMessages]) => (
                <div key={dateKey}>
                  <ChatDateDivider date={new Date(dateKey)} />
                  {dateMessages.map((message) => (
                    <ChatBubble
                      key={message.id}
                      message={message.content}
                      role={message.role}
                      timestamp={message.timestamp}
                    />
                  ))}
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
          onSendMessage={handleSendMessage}
          onVoiceStart={handleVoiceStart}
          onVoiceStop={handleVoiceStop}
          isRecording={isRecording}
          isLoading={isTyping}
          placeholder="메시지를 입력하세요..."
        />
      </div>
    </div>
  );
}

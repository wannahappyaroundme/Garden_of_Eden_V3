/**
 * Conversation History Sidebar
 * Lists all conversations with search and management
 */

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { HistoryItem } from './HistoryItem';
import { HistoryListSkeleton } from './HistoryItemSkeleton';
import type { ConversationSummary } from '../../lib/tauri-api';

interface ConversationHistoryProps {
  currentConversationId?: string;
  onSelectConversation: (id: string | null) => void;
}

export function ConversationHistory({
  currentConversationId,
  onSelectConversation,
}: ConversationHistoryProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const data = await window.api.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    onSelectConversation(null);
  };

  const handleSelectConversation = (id: string) => {
    onSelectConversation(id);
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await window.api.deleteConversation(id);
      // Remove from local state
      setConversations((prev) => prev.filter((c) => c.id !== id));
      // If deleted conversation was selected, create new conversation
      if (id === currentConversationId) {
        onSelectConversation(null);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      alert('대화 삭제에 실패했습니다.');
    }
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      await window.api.updateConversationTitle(id, newTitle);
      // Update local state
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
      );
    } catch (error) {
      console.error('Failed to rename conversation:', error);
      alert('대화 이름 변경에 실패했습니다.');
    }
  };

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">대화 목록</h2>
        </div>
        <Button
          onClick={handleNewConversation}
          className="w-full"
          variant="default"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="mr-2"
          >
            <path
              d="M8 3V13M3 8H13"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          새 대화
        </Button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <HistoryListSkeleton count={5} />
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold mb-3">
              E
            </div>
            <p className="text-sm text-muted-foreground">
              아직 대화가 없습니다
              <br />
              새 대화를 시작해보세요!
            </p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <HistoryItem
              key={conversation.id}
              conversation={conversation}
              isSelected={conversation.id === currentConversationId}
              onSelect={handleSelectConversation}
              onDelete={handleDeleteConversation}
              onRename={handleRenameConversation}
            />
          ))
        )}
      </div>

      {/* Footer (optional - could add stats) */}
      {conversations.length > 0 && (
        <div className="p-3 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            총 {conversations.length}개의 대화
          </p>
        </div>
      )}
    </aside>
  );
}

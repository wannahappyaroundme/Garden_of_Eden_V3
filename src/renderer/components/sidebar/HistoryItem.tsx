/**
 * History Item Component
 * Individual conversation row in the sidebar
 */

import { useState } from 'react';
import { cn } from '../../lib/utils';
import type { ConversationSummary } from '../../lib/tauri-api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Input } from '../ui/input';

interface HistoryItemProps {
  conversation: ConversationSummary;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
}

export function HistoryItem({
  conversation,
  isSelected,
  onSelect,
  onDelete,
  onRename,
}: HistoryItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title);

  const handleRename = () => {
    if (editTitle.trim() && editTitle !== conversation.title) {
      onRename(conversation.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setEditTitle(conversation.title);
      setIsEditing(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;

    return new Intl.DateTimeFormat('ko-KR', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const truncatePreview = (text: string, maxLength = 40) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div
      className={cn(
        'group relative px-3 py-2.5 rounded-lg cursor-pointer transition-colors mb-1',
        'hover:bg-accent',
        isSelected && 'bg-primary/10'
      )}
      onClick={() => !isEditing && onSelect(conversation.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyDown}
              className="h-7 text-sm px-2 py-1"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium truncate pr-2">{conversation.title}</h3>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatTime(conversation.updatedAt)}
                </span>
              </div>
              {conversation.lastMessagePreview && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {truncatePreview(conversation.lastMessagePreview)}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">{conversation.messageCount}개 메시지</span>
              </div>
            </>
          )}
        </div>

        {!isEditing && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded"
              onClick={(e) => e.stopPropagation()}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 9C8.55228 9 9 8.55228 9 8C9 7.44772 8.55228 7 8 7C7.44772 7 7 7.44772 7 8C7 8.55228 7.44772 9 8 9Z"
                  fill="currentColor"
                />
                <path
                  d="M8 4C8.55228 4 9 3.55228 9 3C9 2.44772 8.55228 2 8 2C7.44772 2 7 2.44772 7 3C7 3.55228 7.44772 4 8 4Z"
                  fill="currentColor"
                />
                <path
                  d="M8 14C8.55228 14 9 13.5523 9 13C9 12.4477 8.55228 12 8 12C7.44772 12 7 12.4477 7 13C7 13.5523 7.44772 14 8 14Z"
                  fill="currentColor"
                />
              </svg>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
              >
                이름 변경
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('이 대화를 삭제하시겠습니까?')) {
                    onDelete(conversation.id);
                  }
                }}
              >
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

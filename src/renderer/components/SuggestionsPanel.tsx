/**
 * Suggestions Panel Component
 * Persistent sidebar with contextual AI suggestions
 */

import { useState } from 'react';
import SuggestedPromptCard from './SuggestedPromptCard';

interface SuggestionsPanelProps {
  onSendMessage: (message: string) => void;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export default function SuggestionsPanel({
  onSendMessage,
  isCollapsed = false,
  onToggle,
}: SuggestionsPanelProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | 'coding' | 'learning' | 'productivity' | 'chat'>('all');

  const suggestions = {
    coding: [
      { icon: '💻', title: '코드 리뷰', description: '현재 코드 분석 및 개선 제안', prompt: '이 코드를 리뷰해줘' },
      { icon: '🐛', title: '버그 찾기', description: '잠재적 문제 탐지', prompt: '버그가 있는지 확인해줘' },
      { icon: '⚡', title: '성능 최적화', description: '더 빠르게 만들기', prompt: '이 코드를 최적화해줘' },
      { icon: '📝', title: '리팩토링', description: '코드 품질 개선', prompt: '이 코드를 리팩토링해줘' },
    ],
    learning: [
      { icon: '📚', title: '개념 설명', description: '기초부터 차근차근', prompt: '이 개념을 설명해줘' },
      { icon: '🎓', title: '예제 제공', description: '실전 예제 코드', prompt: '예제를 보여줘' },
      { icon: '❓', title: '질문하기', description: '궁금한 점 물어보기', prompt: '질문이 있어' },
      { icon: '🔍', title: '심화 학습', description: '더 깊이 알아보기', prompt: '더 자세히 알려줘' },
    ],
    productivity: [
      { icon: '🎯', title: '작업 정리', description: '오늘 할 일 계획', prompt: '오늘 할 일을 정리해줘' },
      { icon: '⏰', title: '시간 관리', description: '우선순위 설정', prompt: '우선순위를 정해줘' },
      { icon: '📊', title: '진행 상황', description: '프로젝트 현황 체크', prompt: '진행 상황을 확인해줘' },
      { icon: '💡', title: '아이디어', description: '새로운 접근법 제안', prompt: '다른 방법을 제안해줘' },
    ],
    chat: [
      { icon: '💬', title: '잡담', description: '편하게 대화하기', prompt: '요즘 어때?' },
      { icon: '🤔', title: '고민 상담', description: '이야기 들어줘', prompt: '고민이 있어' },
      { icon: '🎉', title: '칭찬', description: '격려받기', prompt: '칭찬해줘' },
      { icon: '😌', title: '휴식', description: '잠깐 쉬어가기', prompt: '쉬어갈까?' },
    ],
  };

  const allSuggestions = [
    ...suggestions.coding.slice(0, 2),
    ...suggestions.learning.slice(0, 2),
    ...suggestions.productivity.slice(0, 2),
    ...suggestions.chat.slice(0, 2),
  ];

  const currentSuggestions = activeCategory === 'all' ? allSuggestions : suggestions[activeCategory];

  if (isCollapsed) {
    return (
      <div className="w-12 border-l border-border bg-muted/30 flex flex-col items-center py-4 gap-2">
        <button
          onClick={onToggle}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          title="제안 패널 열기"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div className="flex-1" />
        <div className="text-xs text-muted-foreground rotate-90 whitespace-nowrap">제안</div>
      </div>
    );
  }

  return (
    <div className="w-80 border-l border-border bg-muted/30 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <span className="text-lg">💡</span>
            AI 제안
          </h3>
          {onToggle && (
            <button
              onClick={onToggle}
              className="p-1 hover:bg-muted rounded transition-colors"
              title="제안 패널 접기"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 text-xs">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-2 py-1 rounded transition-colors ${
              activeCategory === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setActiveCategory('coding')}
            className={`px-2 py-1 rounded transition-colors ${
              activeCategory === 'coding'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            💻
          </button>
          <button
            onClick={() => setActiveCategory('learning')}
            className={`px-2 py-1 rounded transition-colors ${
              activeCategory === 'learning'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            📚
          </button>
          <button
            onClick={() => setActiveCategory('productivity')}
            className={`px-2 py-1 rounded transition-colors ${
              activeCategory === 'productivity'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            🎯
          </button>
          <button
            onClick={() => setActiveCategory('chat')}
            className={`px-2 py-1 rounded transition-colors ${
              activeCategory === 'chat'
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted text-muted-foreground'
            }`}
          >
            💬
          </button>
        </div>
      </div>

      {/* Suggestions list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {currentSuggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSendMessage(suggestion.prompt)}
            className="w-full text-left p-3 rounded-lg border border-border bg-background hover:bg-muted/50 transition-all hover:shadow-sm group"
          >
            <div className="flex items-start gap-2">
              <span className="text-xl flex-shrink-0">{suggestion.icon}</span>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium mb-0.5 group-hover:text-primary transition-colors">
                  {suggestion.title}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {suggestion.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Footer hint */}
      <div className="flex-shrink-0 p-3 border-t border-border bg-background">
        <p className="text-xs text-muted-foreground text-center">
          클릭하여 대화 시작 • 상황에 맞는 제안
        </p>
      </div>
    </div>
  );
}

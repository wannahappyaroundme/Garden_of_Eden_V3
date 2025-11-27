/**
 * Chat Empty State Component (v3.5.2)
 *
 * Extracted from Chat.tsx for better maintainability.
 * Shows when there are no messages in the conversation.
 */

import SuggestedPromptCard from '../SuggestedPromptCard';

interface ChatEmptyStateProps {
  /** Whether screen tracking is active */
  isTracking: boolean;
  /** Handler for sending a message from suggested prompts */
  onSendMessage: (message: string) => void;
}

export function ChatEmptyState({ isTracking, onSendMessage }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      {/* Avatar */}
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold mb-4">
        E
      </div>

      {/* Welcome message */}
      <h2 className="text-xl font-semibold mb-2">안녕하세요! </h2>
      <p className="text-muted-foreground max-w-md mb-8">
        저는 Eden이에요. 무엇을 도와드릴까요?
      </p>

      {/* Suggested prompts grid */}
      <div className="grid grid-cols-2 gap-4 max-w-2xl w-full">
        <SuggestedPromptCard
          icon="code"
          title="코딩 도움"
          description="버그 해결, 코드 리뷰, 아키텍처 조언"
          onClick={() => onSendMessage('코딩 관련 질문이 있어')}
        />
        <SuggestedPromptCard
          icon="book"
          title="학습 지원"
          description="개념 설명, 예제 제공, 퀴즈"
          onClick={() => onSendMessage('새로운 것을 배우고 싶어')}
        />
        <SuggestedPromptCard
          icon="target"
          title="작업 관리"
          description="일정 정리, 우선순위 설정"
          onClick={() => onSendMessage('오늘 할 일을 정리해줘')}
        />
        <SuggestedPromptCard
          icon="chat"
          title="그냥 대화"
          description="고민 상담, 잡담"
          onClick={() => onSendMessage('요즘 어때?')}
        />
      </div>

      {/* Context-aware suggestion */}
      {isTracking && (
        <div className="mt-6 text-sm text-muted-foreground max-w-md">
          화면 추적이 켜져있어요. "현재 화면 설명해줘" 또는 "이 코드 리뷰해줘"를
          시도해보세요!
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      <KeyboardShortcutsHint />
    </div>
  );
}

function KeyboardShortcutsHint() {
  return (
    <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <kbd className="px-2 py-1 bg-muted rounded border border-border font-mono">
          K
        </kbd>
        <span>채팅 입력창 포커스</span>
      </div>
      <div className="flex items-center gap-2">
        <kbd className="px-2 py-1 bg-muted rounded border border-border font-mono">?</kbd>
        <span>모든 단축키 보기</span>
      </div>
    </div>
  );
}

export default ChatEmptyState;

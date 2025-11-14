# Garden of Eden V3 - UX 긴급 개선 사항 (Quick Fixes)

## 🔴 Phase 1: 긴급 (1주일 내 완료)

### 1. 온보딩 라우팅 문제 해결
**파일**: `src/renderer/App.tsx`  
**현재 문제**:
```tsx
// App.tsx는 상태 기반 라우팅
type Page = 'chat' | 'settings';
const [currentPage, setCurrentPage] = useState<Page>('chat');

// Onboarding.tsx는 React Router 사용
const navigate = useNavigate(); // ❌ App.tsx에 라우터 없음
```

**해결 방법**:
```tsx
// Option 1: Onboarding을 상태 기반으로 변경
type Page = 'onboarding' | 'chat' | 'settings';

// Option 2: React Router 통합 (권장)
// App.tsx를 BrowserRouter로 감싸기
```

**참고 파일**: 
- `src/renderer/pages/Onboarding.tsx` (라인 8, 25, 193, 205)
- `src/renderer/App.tsx` (라인 10, 43-47)

---

### 2. 설정 저장 피드백 추가
**파일**: `src/renderer/pages/Settings.tsx`  
**현재 문제**:
```tsx
// 라인 73: 단순히 상태만 변경
setSaveSuccess(true);
setTimeout(() => setSaveSuccess(false), 2000);

// 유저가 저장되었는지 모를 수 있음
```

**해결 방법**:
```tsx
// Toast 컴포넌트 추가 (또는 간단한 notification)
const showToast = (message: string, type: 'success' | 'error') => {
  // 전역 상태 또는 Context 사용
};

handleSave: async () => {
  try {
    setIsSaving(true);
    await window.api.updateSettings(...);
    showToast('설정이 저장되었습니다', 'success');
    setSaveSuccess(true);
  } catch (error) {
    showToast('설정 저장에 실패했습니다', 'error');
  }
};
```

**구현 방법**:
- Toast 라이브러리: sonner, react-hot-toast 등 추가
- 또는 간단한 Notification 컴포넌트 직접 구현

---

### 3. 에러 메시지에 해결 가이드 추가
**파일**: `src/renderer/components/chat/ErrorBubble.tsx`  
**현재 문제**:
```tsx
// 라인 31-42: 단순 에러 메시지만 표시
<Alert variant="error">
  <div className="space-y-2">
    <p>{message}</p> {/* "죄송합니다. 메시지 전송에 실패했습니다." */}
    {onRetry && <button>다시 시도</button>}
  </div>
</Alert>
```

**해결 방법** - ErrorBubble.tsx 개선:
```tsx
interface ErrorBubbleProps {
  message: string;
  errorType?: 'connection' | 'timeout' | 'database' | 'unknown';
  onRetry?: () => void;
  timestamp: Date;
}

const ERROR_GUIDES = {
  connection: {
    title: 'AI 서비스 연결 실패',
    guide: 'Ollama가 실행 중인지 확인하세요. 설정에서 모델을 확인할 수 있습니다.',
    action: '설정 열기'
  },
  timeout: {
    title: 'AI 응답 시간 초과',
    guide: '응답이 오래 걸리고 있습니다. 다시 시도해주세요.',
    action: '다시 시도'
  },
  database: {
    title: '데이터베이스 오류',
    guide: '앱을 재시작하면 해결될 수 있습니다.',
    action: '앱 재시작'
  }
};

export function ErrorBubble({ 
  message, 
  errorType = 'unknown', 
  onRetry, 
  timestamp 
}: ErrorBubbleProps) {
  const guide = ERROR_GUIDES[errorType];
  
  return (
    <div className="flex w-full gap-2 mb-3 justify-start">
      {/* ... avatar ... */}
      <Alert variant="error">
        <div className="space-y-2">
          <p className="font-semibold">{guide?.title || message}</p>
          <p className="text-sm">{guide?.guide || message}</p>
          <div className="flex gap-2 pt-2">
            {onRetry && (
              <button className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">
                {guide?.action || '다시 시도'}
              </button>
            )}
          </div>
        </div>
      </Alert>
    </div>
  );
}
```

**Chat.tsx에서 호출**:
```tsx
// 라인 244-272: 에러 처리 개선
catch (error) {
  let errorType: 'connection' | 'timeout' | 'database' | 'unknown' = 'unknown';
  
  if (error instanceof Error) {
    if (error.message.includes('Ollama')) {
      errorType = 'connection';
    } else if (error.message.includes('timeout')) {
      errorType = 'timeout';
    } else if (error.message.includes('database')) {
      errorType = 'database';
    }
  }
  
  setMessages((prev) => prev.map((msg) =>
    msg.id === aiMessageId ? {
      ...msg,
      role: 'error',
      content: '에러 발생',
      errorType, // 추가
      errorRetryContent: content
    } : msg
  ));
}
```

---

## 🟠 Phase 2: 중요 (2주일)

### 4. 채팅 입력창 가이드 개선
**파일**: `src/renderer/components/chat/ChatInput.tsx`  
**현재 문제**:
```tsx
// 라인 135-137: 맨 아래 작은 텍스트
<div className="text-xs text-muted-foreground text-center mt-2">
  Enter로 전송, Shift + Enter로 줄바꿈 • Cmd/Ctrl+K로 포커스
</div>
```

**해결 방법**:

**Option 1: Placeholder 개선**
```tsx
// 라인 115에서
placeholder={isRecording ? '녹음 중...' : 'Shift+Enter로 줄바꿈'}
```

**Option 2: 인라인 힌트 (권장)**
```tsx
<div className="flex-1 relative">
  <Textarea
    ref={textareaRef}
    value={message}
    onChange={(e) => setMessage(e.target.value)}
    onKeyDown={handleKeyDown}
    placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
    // ...
  />
  
  {/* 키 조합 힌트 - 아이콘 */}
  <div className="absolute right-3 top-2 flex items-center gap-1 text-xs text-muted-foreground pointer-events-none">
    <kbd className="px-2 py-1 bg-muted border border-border rounded text-xs">⏎</kbd>
    <span>전송</span>
  </div>
</div>
```

---

### 5. 빠른 제안 프롬프트 사이드바 추가
**파일**: `src/renderer/pages/Chat.tsx`  
**새 파일**: `src/renderer/components/QuickPromptSidebar.tsx`

**구현**:
```tsx
// QuickPromptSidebar.tsx
interface QuickPrompt {
  id: string;
  icon: string;
  title: string;
  description: string;
  prompt: string;
  category: string;
}

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: 'code',
    icon: '💻',
    title: '코딩 도움',
    description: '버그 해결, 코드 리뷰',
    prompt: '코딩 관련 질문이 있어',
    category: '개발'
  },
  {
    id: 'learn',
    icon: '📚',
    title: '학습 지원',
    description: '개념 설명, 예제 제공',
    prompt: '새로운 것을 배우고 싶어',
    category: '학습'
  },
  // ... 더 추가
];

export function QuickPromptSidebar({ 
  onPromptClick: (prompt: string) => void,
  isVisible: boolean 
}) {
  if (!isVisible) return null;
  
  return (
    <aside className="w-48 bg-card border-l border-border p-4 hidden md:block">
      <h3 className="text-sm font-semibold mb-4">빠른 시작</h3>
      <div className="space-y-2">
        {QUICK_PROMPTS.map(prompt => (
          <button
            key={prompt.id}
            onClick={() => onPromptClick(prompt.prompt)}
            className="w-full text-left p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-2">
              <span>{prompt.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{prompt.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {prompt.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
```

**Chat.tsx에서 사용**:
```tsx
// 레이아웃 변경
<div className="flex h-screen bg-background">
  {/* Conversation History Sidebar - 좌측 */}
  <ConversationHistory {...props} />
  
  {/* Main Chat Area - 중앙 */}
  <main className="flex flex-col flex-1">
    {/* ... 헤더 ... */}
    <div className="flex flex-1">
      {/* 메시지 영역 */}
      <div className="flex-1 flex flex-col">
        {/* ... 메시지 ... */}
      </div>
      
      {/* Quick Prompt Sidebar - 우측 (메시지가 있을 때만) */}
      <QuickPromptSidebar 
        isVisible={messages.length > 0}
        onPromptClick={handleSendMessage}
      />
    </div>
    
    {/* Input */}
    <ChatInput {...props} />
  </main>
</div>
```

---

### 6. 설정 페이지 탭 분리
**파일**: `src/renderer/pages/Settings.tsx`  
**현재 구조**: 모든 설정이 한 페이지에

**개선안**:
```tsx
type SettingsTab = 'app' | 'persona';

export function Settings({ onClose, onThemeChange }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('app');
  
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* 헤더 */}
      <header className="flex-shrink-0 h-14 border-b border-border px-6 flex items-center justify-between">
        {/* ... */}
      </header>

      {/* 탭 네비게이션 */}
      <div className="flex-shrink-0 border-b border-border px-6">
        <button
          onClick={() => setActiveTab('app')}
          className={`px-4 py-3 border-b-2 transition-colors ${
            activeTab === 'app'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          앱 설정
        </button>
        <button
          onClick={() => setActiveTab('persona')}
          className={`px-4 py-3 border-b-2 transition-colors ${
            activeTab === 'persona'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          AI 성격
        </button>
      </div>

      {/* 컨텐츠 */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'app' ? (
          /* 앱 설정 내용 */
          <AppSettings />
        ) : (
          /* AI 성격 설정 */
          <PersonaSettings />
        )}
      </div>
    </div>
  );
}
```

---

### 7. 아코디언 상태 개선
**파일**: `src/renderer/components/PersonaParameterGroup.tsx`  
**현재 문제**:
```tsx
// 라인 169: 첫 번째만 열림
defaultExpanded={index === 0}
```

**해결 방법**:
```tsx
// Option 1: 모두 닫기 (사용자 선택 시 열기)
defaultExpanded={false}

// Option 2: 처음 방문 시만 첫 번째 열기
// localStorage 사용
const [isFirstVisit, setIsFirstVisit] = useState(true);

useEffect(() => {
  const visited = localStorage.getItem('persona-visited');
  setIsFirstVisit(!visited);
  localStorage.setItem('persona-visited', 'true');
}, []);

// defaultExpanded={isFirstVisit && index === 0}
```

---

## 🟡 Phase 3: 개선 (3주일)

### 8. 버튼 스타일 일관성
**파일**: `src/renderer/components/ui/button.tsx`  
**명확한 계층 정의**:
```tsx
const variants = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',      // Primary action
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80', // Alternative action
  outline: 'border border-input hover:bg-accent',                        // Tertiary
  ghost: 'hover:bg-accent hover:text-accent-foreground',                // Minimal/Quiet
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90' // Danger
};
```

**일관된 적용**:
- 주 액션: `default` (저장, 전송, 시작)
- 부 액션: `secondary` (리셋, 취소)
- 내비게이션: `ghost` (헤더 아이콘)
- 위험한 액션: `destructive` (삭제)

---

### 9. 아이콘 라이브러리 통일
**현재**: SVG 직접 정의 + lucide-react 혼재  
**해결**: 모든 아이콘을 lucide-react로 통일

```tsx
// 변경 전
<svg width="18" height="18" viewBox="0 0 24 24" {...} />

// 변경 후
import { Settings } from 'lucide-react';
<Settings className="w-4.5 h-4.5" />
```

**대상 파일**:
- Chat.tsx (라인 357-405)
- ConversationHistory.tsx (라인 118-129, 144-156, 202-213)
- Settings.tsx (라인 118-132)

---

### 10. 색상 대비 검증
**도구**: WebAIM Contrast Checker  
**검증할 요소**:
1. 타임스탬프 색상 (`--chat-timestamp`)
2. Muted 텍스트 (`text-muted-foreground`)
3. 링크 색상 (Primary)

**최소 기준**: WCAG AA (4.5:1 for text)

---

## 📋 체크리스트

### Phase 1 (1주일)
- [ ] 온보딩 라우팅 수정
- [ ] 설정 저장 Toast 추가
- [ ] 에러 메시지 가이드 추가

### Phase 2 (2주일)
- [ ] ChatInput 가이드 개선
- [ ] QuickPromptSidebar 구현
- [ ] 설정 탭 분리
- [ ] 아코디언 상태 개선

### Phase 3 (3주일)
- [ ] 버튼 스타일 일관성
- [ ] 아이콘 라이브러리 통일
- [ ] 색상 대비 검증
- [ ] 포커스 스타일 일관성

### Phase 4 (지속)
- [ ] 사용자 테스트 (5-10명)
- [ ] 피드백 수집
- [ ] 정기 접근성 감사

---

## 참고 자료

### 디자인 시스템 문서
- Tailwind CSS: https://tailwindcss.com
- shadcn/ui: https://ui.shadcn.com
- lucide-react: https://lucide.dev

### 접근성
- WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/
- WebAIM: https://webaim.org

### 성능 측정
- 라이트하우스: https://developers.google.com/web/tools/lighthouse
- Axe DevTools: https://www.deque.com/axe/devtools/


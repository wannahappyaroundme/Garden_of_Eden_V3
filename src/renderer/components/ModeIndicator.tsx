/**
 * Mode Indicator Component
 * Shows whether AI is in User-Led or AI-Led (proactive) mode
 */

interface ModeIndicatorProps {
  isTracking: boolean;
  onToggle: () => void;
}

export default function ModeIndicator({ isTracking, onToggle }: ModeIndicatorProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-muted/50 dark:bg-muted/30 border border-gray-200 dark:border-gray-700">
      {/* Status dot */}
      <div className="flex items-center gap-2">
        <div
          className={`w-2.5 h-2.5 rounded-full transition-colors ${
            isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
          }`}
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-foreground">
          {isTracking ? 'AI 주도 모드' : '사용자 주도 모드'}
        </span>
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          isTracking ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
        }`}
        role="switch"
        aria-checked={isTracking}
        aria-label={isTracking ? 'AI 주도 모드 끄기' : 'AI 주도 모드 켜기'}
        title={
          isTracking
            ? 'AI가 화면을 분석하고 먼저 말을 걸 수 있습니다'
            : 'AI는 당신의 메시지를 기다립니다'
        }
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isTracking ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </button>

      {/* Tooltip hint (mobile-friendly) */}
      <div className="hidden lg:block">
        <div className="group relative">
          <button
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="도움말"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>

          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap pointer-events-none z-50">
            {isTracking
              ? 'AI가 화면을 분석하고 먼저 대화를 시작할 수 있어요'
              : 'AI는 당신이 메시지를 보낼 때까지 기다려요'}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}

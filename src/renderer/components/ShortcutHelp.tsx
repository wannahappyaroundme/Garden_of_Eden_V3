/**
 * Keyboard Shortcuts Help Modal
 * Shows available keyboard shortcuts to users
 */

import { useState, useEffect } from 'react';

interface Shortcut {
  keys: string;
  description: string;
  category: string;
}

const SHORTCUTS: Shortcut[] = [
  {
    keys: '⌘K',
    description: '채팅 입력창으로 포커스',
    category: '채팅',
  },
  {
    keys: '⌘,',
    description: '설정 열기',
    category: '탐색',
  },
  {
    keys: '⌘⇧S',
    description: '화면 추적 토글',
    category: '기능',
  },
  {
    keys: 'Esc',
    description: '포커스 해제 / 설정 닫기',
    category: '탐색',
  },
];

interface ShortcutHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShortcutHelp({ isOpen, onClose }: ShortcutHelpProps) {
  const [isMac, setIsMac] = useState(true);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
    return undefined;
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Convert Mac shortcuts to Windows/Linux
  const displayShortcuts = SHORTCUTS.map(s => ({
    ...s,
    keys: isMac ? s.keys : s.keys.replace('⌘', 'Ctrl+'),
  }));

  // Group by category
  const groupedShortcuts = displayShortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">키보드 단축키</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  생산성을 높이는 단축키 모음
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <svg
                  className="w-5 h-5 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-6">
              {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {shortcuts.map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-sm">{shortcut.description}</span>
                        <kbd className="px-2.5 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded-md shadow-sm font-mono">
                          {shortcut.keys}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border bg-muted/30">
            <p className="text-xs text-center text-muted-foreground">
              <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-background border border-border rounded">
                ?
              </kbd>{' '}
              키를 눌러 언제든지 이 도움말을 볼 수 있습니다
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

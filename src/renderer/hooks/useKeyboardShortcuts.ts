/**
 * useKeyboardShortcuts Hook
 * Global keyboard shortcuts for the application
 */

import { useEffect } from 'react';

interface ShortcutHandlers {
  onFocusInput?: () => void;
  onOpenSettings?: () => void;
  onCloseSettings?: () => void;
  onEscape?: () => void;
  onToggleScreenTracking?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? event.metaKey : event.ctrlKey;

      // Cmd/Ctrl + K - Focus input
      if (cmdOrCtrl && event.key === 'k') {
        event.preventDefault();
        handlers.onFocusInput?.();
        return;
      }

      // Cmd/Ctrl + , - Open settings
      if (cmdOrCtrl && event.key === ',') {
        event.preventDefault();
        handlers.onOpenSettings?.();
        return;
      }

      // Cmd/Ctrl + Shift + S - Toggle screen tracking
      if (cmdOrCtrl && event.shiftKey && event.key.toLowerCase() === 's') {
        event.preventDefault();
        handlers.onToggleScreenTracking?.();
        return;
      }

      // Escape - Close settings or clear focus
      if (event.key === 'Escape') {
        event.preventDefault();
        handlers.onEscape?.();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}

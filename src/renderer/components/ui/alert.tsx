/**
 * Alert Component
 * Display error, warning, info, or success messages
 */

import { cn } from '../../lib/utils';

interface AlertProps {
  variant?: 'error' | 'warning' | 'info' | 'success';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Alert({ variant = 'info', title, children, onClose, className }: AlertProps) {
  const variantStyles = {
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
  };

  const iconStyles = {
    error: '⚠️',
    warning: '⚠️',
    info: 'ℹ️',
    success: '✅',
  };

  return (
    <div className={cn('rounded-lg border p-4 relative', variantStyles[variant], className)}>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
      <div className="flex gap-3">
        <span className="text-xl flex-shrink-0">{iconStyles[variant]}</span>
        <div className="flex-1">
          {title && <div className="font-semibold mb-1">{title}</div>}
          <div className="text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}

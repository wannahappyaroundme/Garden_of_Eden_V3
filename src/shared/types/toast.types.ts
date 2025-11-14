/**
 * Toast Notification Types
 * For user feedback on actions (settings save, errors, etc.)
 */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // milliseconds, default 3000
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastOptions {
  type?: ToastType;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

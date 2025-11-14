/**
 * Toast Store
 * Manages toast notifications state
 */

import { create } from 'zustand';
import { Toast, ToastOptions } from '../../shared/types/toast.types';

interface ToastStore {
  toasts: Toast[];
  addToast: (title: string, options?: ToastOptions) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (title: string, options?: ToastOptions) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast: Toast = {
      id,
      type: options?.type || 'info',
      title,
      message: options?.message,
      duration: options?.duration || 3000,
      action: options?.action,
    };

    set((state) => ({
      toasts: [...state.toasts, toast],
    }));

    // Auto-remove after duration
    if (toast.duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, toast.duration);
    }
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearAll: () => {
    set({ toasts: [] });
  },
}));

// Convenience functions for different toast types
export const toast = {
  success: (title: string, message?: string, duration?: number) => {
    useToastStore.getState().addToast(title, { type: 'success', message, duration });
  },
  error: (title: string, message?: string, duration?: number) => {
    useToastStore.getState().addToast(title, { type: 'error', message, duration });
  },
  info: (title: string, message?: string, duration?: number) => {
    useToastStore.getState().addToast(title, { type: 'info', message, duration });
  },
  warning: (title: string, message?: string, duration?: number) => {
    useToastStore.getState().addToast(title, { type: 'warning', message, duration });
  },
};

/**
 * Toast Container Component
 * Displays toast notifications in top-right corner
 */

import { useToastStore } from '../stores/toast.store';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-card border border-border rounded-lg shadow-lg overflow-hidden animate-spring-slide-up min-w-[300px] max-w-[400px]"
        >
          {/* Toast Header with Icon and Close Button */}
          <div
            className={`flex items-start gap-3 p-4 ${
              toast.type === 'success'
                ? 'bg-green-500/10 border-l-4 border-green-500'
                : toast.type === 'error'
                ? 'bg-red-500/10 border-l-4 border-red-500'
                : toast.type === 'warning'
                ? 'bg-yellow-500/10 border-l-4 border-yellow-500'
                : 'bg-blue-500/10 border-l-4 border-blue-500'
            }`}
          >
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === 'success' && (
                <svg
                  className="w-5 h-5 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
              {toast.type === 'error' && (
                <svg
                  className="w-5 h-5 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
              {toast.type === 'warning' && (
                <svg
                  className="w-5 h-5 text-yellow-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              )}
              {toast.type === 'info' && (
                <svg
                  className="w-5 h-5 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-foreground">{toast.title}</h4>
              {toast.message && (
                <p className="text-xs text-muted-foreground mt-1">{toast.message}</p>
              )}
              {toast.action && (
                <button
                  onClick={toast.action.onClick}
                  className="text-xs text-primary hover:underline mt-2 font-medium"
                >
                  {toast.action.label}
                </button>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="닫기"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      ))}
    </div>
  );
}

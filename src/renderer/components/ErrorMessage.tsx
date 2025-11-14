/**
 * Error Message Component
 * Displays actionable error messages with user guidance
 */

import { ActionableError } from '@shared/types/error.types';
import { useState } from 'react';

interface ErrorMessageProps {
  error: ActionableError;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export default function ErrorMessage({ error, onRetry, onDismiss }: ErrorMessageProps) {
  const [showDetails, setShowDetails] = useState(false);

  const categoryColors = {
    network: 'text-orange-500 bg-orange-500/10 border-orange-500',
    file: 'text-blue-500 bg-blue-500/10 border-blue-500',
    permission: 'text-red-500 bg-red-500/10 border-red-500',
    validation: 'text-yellow-500 bg-yellow-500/10 border-yellow-500',
    'ai-model': 'text-purple-500 bg-purple-500/10 border-purple-500',
    database: 'text-pink-500 bg-pink-500/10 border-pink-500',
    unknown: 'text-gray-500 bg-gray-500/10 border-gray-500',
  };

  const categoryIcons = {
    network: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
        />
      </svg>
    ),
    file: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    permission: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    ),
    validation: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
    'ai-model': (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
    database: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
        />
      </svg>
    ),
    unknown: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  };

  return (
    <div className="bg-card border border-border rounded-lg shadow-lg overflow-hidden animate-spring-slide-up">
      {/* Header with icon */}
      <div
        className={`flex items-start gap-4 p-6 border-l-4 ${
          categoryColors[error.category]
        }`}
      >
        <div className="flex-shrink-0">{categoryIcons[error.category]}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground mb-1">{error.title}</h3>
          <p className="text-sm text-muted-foreground">{error.description}</p>
        </div>
        {onDismiss && error.canDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="닫기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Error details */}
      <div className="px-6 py-4 space-y-4 bg-muted/30">
        {/* What happened */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">🔍 무슨 일이 일어났나요?</h4>
          <p className="text-sm text-muted-foreground">{error.whatHappened}</p>
        </div>

        {/* Why it happened */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">🤔 왜 발생했나요?</h4>
          <p className="text-sm text-muted-foreground">{error.whyItHappened}</p>
        </div>

        {/* How to fix */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">🔧 해결 방법</h4>
          <ul className="space-y-2">
            {error.howToFix.map((step, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="flex-shrink-0 text-primary font-semibold">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Technical details (collapsible) */}
        {error.technicalDetails && (
          <div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-muted-foreground hover:text-foreground font-medium flex items-center gap-2 transition-colors"
            >
              <svg
                className={`w-4 h-4 transition-transform ${
                  showDetails ? 'rotate-90' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              기술 세부 정보
            </button>
            {showDetails && (
              <pre className="mt-2 p-3 bg-muted rounded text-xs text-muted-foreground overflow-x-auto font-mono">
                {error.technicalDetails}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {(onRetry || onDismiss) && (
        <div className="px-6 py-4 bg-background flex justify-end gap-3">
          {onDismiss && error.canDismiss && (
            <button
              onClick={onDismiss}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              닫기
            </button>
          )}
          {onRetry && error.canRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              다시 시도
            </button>
          )}
        </div>
      )}
    </div>
  );
}

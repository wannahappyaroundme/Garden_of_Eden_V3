/**
 * Error Boundary Component
 * Catches React errors and shows fallback UI
 */

import { Component, ReactNode } from 'react';
import ErrorMessage from './ErrorMessage';
import { createActionableError } from '@shared/types/error.types';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const actionableError = createActionableError(
        this.state.error || new Error('Unknown error'),
        'React 컴포넌트 렌더링'
      );

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-2xl w-full">
            <ErrorMessage
              error={actionableError}
              onRetry={() => window.location.reload()}
              onDismiss={() => this.setState({ hasError: false, error: undefined })}
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

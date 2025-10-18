import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 rounded-nature" style={{ backgroundColor: 'rgba(244, 67, 54, 0.06)', color: 'var(--text-dark)' }}>
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--danger-red)' }}>Something went wrong</h2>
            <details className="text-sm text-text-medium">
              <summary className="cursor-pointer">Error details</summary>
              <pre className="mt-2 p-2 rounded" style={{ backgroundColor: 'rgba(244,67,54,0.08)', color: 'var(--text-dark)' }}>
                {this.state.error?.message}
              </pre>
            </details>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
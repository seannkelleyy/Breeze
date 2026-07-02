'use client';
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex items-center justify-center p-8">
            <div className="space-y-2 text-center">
              <h2 className="text-destructive text-lg font-semibold">Something went wrong</h2>
              <p className="text-muted-foreground text-sm">
                {this.state.error?.message ?? 'An unexpected error occurred'}
              </p>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

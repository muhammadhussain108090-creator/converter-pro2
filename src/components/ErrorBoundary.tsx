import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ConvertPro caught runtime error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    window.location.hash = '';
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl text-center">
            <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-amber-500/20">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight mb-2">Something went wrong</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
              ConvertPro encountered an unexpected display issue. Your local files remain safe and private in your browser.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Application
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium text-sm transition-colors border border-zinc-200 dark:border-zinc-700"
              >
                <Home className="w-4 h-4" />
                Return to Home
              </button>
            </div>

            {/* Expandable diagnostic details */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 text-left">
              <button
                type="button"
                onClick={this.toggleDetails}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
              >
                {this.state.showDetails ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    Hide error details
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    Show technical details
                  </>
                )}
              </button>

              {this.state.showDetails && (
                <div className="mt-3 p-3 bg-zinc-900 text-zinc-300 rounded-lg text-xs font-mono overflow-auto max-h-48 border border-zinc-800">
                  <div className="text-red-400 font-semibold mb-1">
                    {this.state.error?.toString()}
                  </div>
                  {this.state.errorInfo?.componentStack && (
                    <pre className="text-[11px] text-zinc-400 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import React from "react";

interface State {
  hasError: boolean;
  isChunkError: boolean;
  error?: Error;
}

/**
 * Catches render errors from lazy-loaded pages.
 * – ChunkLoadError: auto-reloads once (handles stale cache after redeployment)
 * – Other errors: shows a friendly fallback UI with Refresh / Go Home buttons
 */
class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  private reloadAttempted = false;

  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false, isChunkError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const isChunkError =
      error.name === "ChunkLoadError" ||
      /loading chunk|failed to fetch|load failed|dynamically imported module/i.test(
        error.message
      );
    return { hasError: true, isChunkError, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);

    // Auto-reload once for chunk errors (new deployment invalidated old chunks)
    if (this.state.isChunkError && !this.reloadAttempted) {
      this.reloadAttempted = true;
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError && !this.state.isChunkError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4 text-center">
          <div className="mb-6 text-5xl">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-muted-foreground mb-8 max-w-md">
            This page failed to load. This can happen after a recent update —
            refreshing usually fixes it.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Refresh Page
            </button>
            <a
              href="/"
              className="px-5 py-2 border border-border rounded-md text-sm font-medium hover:bg-accent transition-colors"
            >
              Go Home
            </a>
          </div>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <pre className="mt-8 text-xs text-left bg-muted p-4 rounded-md max-w-2xl overflow-auto text-destructive">
              {this.state.error.stack}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

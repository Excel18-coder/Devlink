import React from "react";

interface State {
  hasError: boolean;
  isChunkError: boolean;
  error?: Error;
}

const CHUNK_RELOAD_KEY = "devlink_chunk_reload_at";

function isChunkError(error: Error): boolean {
  return (
    error.name === "ChunkLoadError" ||
    /loading chunk|failed to fetch|load failed|dynamically imported module/i.test(error.message)
  );
}

/**
 * Catches render errors from lazy-loaded pages.
 *
 * Chunk errors (stale cache after redeployment):
 *   1. First occurrence  → hard-navigate to the same URL with cache-busting
 *      query param (?v=<timestamp>) so the browser fetches fresh HTML + assets.
 *   2. Second occurrence within 10s → show manual "Refresh" fallback to avoid
 *      infinite reload loops.
 *
 * Other render errors → friendly fallback UI with Refresh / Go Home buttons.
 */
class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false, isChunkError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, isChunkError: isChunkError(error), error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);

    if (!isChunkError(error)) return;

    const now = Date.now();
    const lastReload = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? 0);
    const tooSoon = now - lastReload < 10_000; // within last 10 s → already tried

    if (!tooSoon) {
      sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now));
      // Hard-navigate with cache-bust param so CDN/service-worker serves
      // fresh assets instead of the stale cached chunk filenames
      const url = new URL(window.location.href);
      url.searchParams.set("v", String(now));
      window.location.replace(url.toString());
    }
    // else: show the manual fallback UI (loop guard)
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

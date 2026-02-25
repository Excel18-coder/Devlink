// Explicit React import — must be first so React is fully initialized
// before any lazy chunk's module-level React.createContext() calls execute.
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ---------------------------------------------------------------------------
// Stale-chunk recovery
// Vite fires "vite:preloadError" when a dynamic import (lazy chunk) fails to
// load — this happens BEFORE React / ErrorBoundary can intercept anything.
// The most common cause: a new Vercel deployment changes content-hashed
// filenames, so a user with an open tab tries to load a chunk that no longer
// exists on the CDN.
// Fix: bust the browser cache for the whole page and reload once.
// A sessionStorage key prevents an infinite reload loop.
// ---------------------------------------------------------------------------
window.addEventListener("vite:preloadError", (event) => {
  // Suppress the uncaught-error console noise; we handle it below.
  (event as Event & { preventDefault?: () => void }).preventDefault?.();

  const RELOAD_KEY = "devlink_preload_reload_at";
  const now = Date.now();
  const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);

  if (now - last > 10_000) {
    // First failure in the last 10 s → cache-bust reload
    sessionStorage.setItem(RELOAD_KEY, String(now));
    const url = new URL(window.location.href);
    url.searchParams.set("v", String(now));
    window.location.replace(url.toString());
  } else {
    // Already reloaded recently → let the ErrorBoundary show the user a
    // "Please refresh" message rather than looping forever.
    console.error(
      "[Devlink] Chunk load failed twice within 10 s. Manual refresh required."
    );
  }
});

createRoot(document.getElementById("root")!).render(<App />);

// Fade out the pre-render loader once React has mounted
requestAnimationFrame(() => {
  const loader = document.getElementById("root-loader");
  if (loader) {
    loader.classList.add("done");
    setTimeout(() => loader.remove(), 250);
  }
});

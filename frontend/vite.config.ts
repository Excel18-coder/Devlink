import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Pre-bundle React in dev so it is always resolved before any lazy chunk runs
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react-dom/client",
      // Pre-bundle the most-used Radix primitives so first-load latency is lower
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tooltip",
      "@tanstack/react-query",
      "react-router-dom",
    ],
  },
  build: {
    target: "esnext",
    minify: "esbuild",
    cssMinify: true,
    // The combined vendor chunk is intentionally large and long-cached; 1200 KB
    // avoids spurious warnings while still catching genuinely oversized chunks.
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // Keep asset hashes consistent across builds for long-lived caching
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          // Keep @tanstack isolated — it has no init-time React.createContext calls
          if (id.includes("@tanstack")) return "query-vendor";
          // Keep charts isolated — heavy (~400 KB) and only used on admin/dashboard
          if (id.includes("recharts") || id.includes("d3-") || id.includes("d3/")) {
            return "charts-vendor";
          }
          // react + react-dom + react-router + @radix-ui + everything else
          // MUST stay in ONE chunk so React is always defined when any of
          // @radix-ui's module-level React.createContext() calls execute.
          return "vendor";
        },
      },
    },
  },
}));

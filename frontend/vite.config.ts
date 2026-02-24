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
    include: ["react", "react-dom", "react/jsx-runtime", "react-dom/client"],
  },
  build: {
    target: "esnext",
    minify: "esbuild",
    cssMinify: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          // Keep @tanstack isolated — it has no init-time React.createContext calls
          if (id.includes("@tanstack")) return "query-vendor";
          // Keep charts isolated for the same reason
          if (id.includes("recharts") || id.includes("d3-") || id.includes("d3/")) return "charts-vendor";
          // react + react-dom + react-router + @radix-ui + everything else
          // MUST stay in ONE chunk so React is always defined when any of
          // @radix-ui's module-level React.createContext() calls execute.
          return "vendor";
        },
      },
    },
  },
}));

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          // Keep React and all React-dependent libs in ONE chunk so React is
          // always defined before any consumer runs. Splitting React from its
          // consumers causes "Cannot read properties of undefined (reading
          // 'createContext')" at load time.
          if (
            /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|@radix-ui|framer-motion|@tanstack|react-hook-form|react-day-picker|react-resizable-panels|cmdk|sonner|vaul|recharts|d3-|react-markdown|remark|rehype|micromark|mdast|hast|use-sync-external-store|react-remove-scroll|react-style-singleton|@floating-ui)/.test(id)
          ) {
            return "vendor-react";
          }
          if (id.includes("@supabase")) return "vendor-supabase";
          if (id.includes("lucide-react")) return "vendor-icons";
          if (id.includes("date-fns")) return "vendor-date";
          return "vendor";
        },
      },
    },
  },
}));

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
          if (id.includes("react-dom") || id.includes("react-router") || id.includes("scheduler") || id.match(/[\\/]react[\\/]/)) {
            return "vendor-react";
          }
          if (id.includes("@radix-ui")) return "vendor-radix";
          if (id.includes("framer-motion")) return "vendor-motion";
          if (id.includes("recharts") || id.includes("d3-")) return "vendor-charts";
          if (id.includes("@supabase")) return "vendor-supabase";
          if (id.includes("@tanstack")) return "vendor-query";
          if (id.includes("react-markdown") || id.includes("remark") || id.includes("micromark") || id.includes("mdast") || id.includes("hast")) {
            return "vendor-markdown";
          }
          if (id.includes("lucide-react")) return "vendor-icons";
          if (id.includes("date-fns")) return "vendor-date";
          return "vendor";
        },
      },
    },
  },
}));

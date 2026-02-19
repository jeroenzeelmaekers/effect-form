import path from "path";

import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react({
      babel: {
        plugins: [
          ["babel-plugin-react-compiler"],
          ...(process.env.NODE_ENV === "production"
            ? [["react-remove-properties", { properties: ["data-testid"] }]]
            : []),
        ],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          effect: ["effect", "@effect/atom-react"],
          form: ["@tanstack/react-form"],
          table: ["@tanstack/react-table"],
          icons: ["lucide-react"],
          ui: ["@base-ui/react"],
          posthog: ["posthog-js/react"],
        },
      },
    },
  },
});

import path from "path";

import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const manualChunks: Record<string, ReadonlyArray<string>> = {
  react: ["react", "react-dom"],
  effect: ["effect", "@effect/atom-react"],
  form: ["@tanstack/react-form"],
  table: ["@tanstack/react-table"],
  icons: ["lucide-react"],
  ui: ["@base-ui/react"],
  posthog: ["posthog-js/react"],
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const anthropicApiKey = env.VITE_ANTHROPIC_API_KEY ?? "";

  return {
    plugins: [
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
      }),
      react(),
      babel({
        presets: [reactCompilerPreset()],
        plugins:
          process.env.NODE_ENV === "production"
            ? [["react-remove-properties", { properties: ["data-testid"] }]]
            : [],
      }),
      tailwindcss(),
    ],
    server: {
      proxy: {
        "/anthropic": {
          target: "https://api.anthropic.com",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/anthropic/, ""),
          configure: (proxy) => {
            proxy.on("proxyReq", (proxyReq) => {
              proxyReq.setHeader("x-api-key", anthropicApiKey);
              proxyReq.removeHeader("origin");
              proxyReq.removeHeader("referer");
            });
          },
        },
        "/api": {
          target: "https://jsonplaceholder.typicode.com",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
        "/otlp": {
          target: "http://localhost:4318",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/otlp/, ""),
        },
        "/ingest/static": {
          target: "https://eu-assets.i.posthog.com",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ingest/, ""),
        },
        "/ingest/array": {
          target: "https://eu-assets.i.posthog.com",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ingest/, ""),
        },
        "/ingest": {
          target: "https://eu.i.posthog.com",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ingest/, ""),
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            for (const [chunk, deps] of Object.entries(manualChunks)) {
              if (deps.some((dep) => id.includes(`node_modules/${dep}`))) {
                return chunk;
              }
            }
          },
        },
      },
    },
  };
});

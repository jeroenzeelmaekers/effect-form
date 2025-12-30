import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { visualizer } from "rollup-plugin-visualizer"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    visualizer({ open: false, filename: "stats.html" }),
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
          effect: ["effect", "@effect/platform", "@effect-atom/atom-react"],
          form: ["@tanstack/react-form"],
          icons: ["lucide-react"],
          ui: ["@base-ui/react"],
        },
      },
    },
  },
})

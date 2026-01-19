import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          effect: ['effect', '@effect/platform', '@effect-atom/atom-react'],
          form: ['@tanstack/react-form'],
          icons: ['lucide-react'],
          ui: ['@base-ui/react'],
          posthog: ['posthog-js/react'],
        },
      },
    },
  },
});

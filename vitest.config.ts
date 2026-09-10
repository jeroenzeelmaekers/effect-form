import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";
import { playwright } from "vite-plus/test/browser-playwright";

const isCoverage = process.argv.includes("--coverage");

// Coverage runs Chromium only to keep CI/runtime fast and stable; cross-browser coverage adds little value here.
function getBrowserInstances() {
  if (isCoverage) {
    return [{ browser: "chromium" as const, name: "blink" }];
  }

  return [
    { browser: "chromium" as const, name: "blink" },
    { browser: "firefox" as const, name: "gecko" },
    { browser: "webkit" as const, name: "webkit" },
  ];
}

const browserInstances = getBrowserInstances();

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  optimizeDeps: {
    include: ["nuqs/adapters/testing"],
  },
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "json-summary"],
      reportsDirectory: "coverage",
    },
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          globals: true,
          environment: "node",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        extends: true,
        plugins: [react()],
        test: {
          name: "browser",
          include: ["src/**/*.test.tsx"],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            screenshotFailures: false,
            instances: browserInstances,
          },
        },
      },
    ],
  },
});

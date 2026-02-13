import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const isCoverage = process.argv.includes("--coverage");

const browserInstances = isCoverage
  ? [{ browser: "chromium" as const, name: "blink" }]
  : [
      { browser: "chromium" as const, name: "blink" },
      { browser: "firefox" as const, name: "gecko" },
      { browser: "webkit" as const, name: "webkit" },
    ];

export default defineConfig({
  plugins: [tsconfigPaths()],
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

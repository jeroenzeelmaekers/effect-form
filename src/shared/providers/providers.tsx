import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import type { ReactNode } from "react";

import { ThemeProvider } from "./theme-provider";

posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  ui_host: "https://eu.posthog.com",
  defaults: "2025-11-30",
  // Do not capture any events until the user explicitly opts in via the cookie banner
  opt_out_capturing_by_default: true,
  opt_in_site_apps: true,
});

/**
 * Root provider wrapper for the application.
 *
 * Composes:
 * - **PostHogProvider** — initializes PostHog analytics (opt-out by default;
 *   the user must accept cookies via {@link CookieBanner} before any events
 *   are captured).
 * - **ThemeProvider** — provides the `"light" | "dark" | "system"` theme
 *   context with `"system"` as the default, persisted under the
 *   `"theme-preference"` `localStorage` key.
 *
 * PostHog is initialized as a module side-effect when this file is first
 * imported, so it is available before the first render.
 */
export default function Providers({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <PostHogProvider client={posthog}>
      <ThemeProvider defaultTheme="system" storageKey="theme-preference">
        {children}
      </ThemeProvider>
    </PostHogProvider>
  );
}

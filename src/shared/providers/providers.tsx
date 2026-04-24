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

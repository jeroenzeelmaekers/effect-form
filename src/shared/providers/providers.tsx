import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import type { ReactNode } from "react";

import { ThemeProvider } from "./theme-provider";

posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  defaults: "2025-11-30",
  cookieless_mode: "on_reject",
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

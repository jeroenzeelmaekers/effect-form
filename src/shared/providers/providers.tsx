import { PostHogProvider } from 'posthog-js/react';
import type { ReactNode } from 'react';
import { ThemeProvider } from './theme-provider';

const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  defaults: '2025-11-30',
} as const;

export default function Providers({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <PostHogProvider
      apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
      options={options}>
      <ThemeProvider defaultTheme="system" storageKey="theme-preference">
        {children}
      </ThemeProvider>
    </PostHogProvider>
  );
}

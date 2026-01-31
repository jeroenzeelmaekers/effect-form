import { ModeToggle } from '@/components/ui/mode-toggle';
import { ThemeProvider } from '@/providers/theme-provider';
import { createRootRoute, Link, Outlet } from '@tanstack/react-router';
import { PostHogProvider } from 'posthog-js/react';
import { lazy } from 'react';

const TanStackRouterDevtools = import.meta.env.PROD
  ? () => null
  : lazy(() =>
      import('@tanstack/react-router-devtools').then((mod) => ({
        default: mod.TanStackRouterDevtools,
      })),
    );

const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  defaults: '2025-11-30',
} as const;

const RootLayout = () => (
  <PostHogProvider
    apiKey={import.meta.env.VITE_PUBLIC_POSTHOG_KEY}
    options={options}>
    <ThemeProvider defaultTheme="system" storageKey="theme-preference">
      <div className="border-border flex items-center justify-between border-b p-2">
        <ul className="flex flex-row space-x-2">
          <li>
            <Link to="/" className="[&.active]:font-bold">
              Home
            </Link>
          </li>
          <li>
            <Link to="/about" className="[&.active]:font-bold">
              About
            </Link>
          </li>
        </ul>
        <ModeToggle />
      </div>
      <Outlet />
      <TanStackRouterDevtools />
    </ThemeProvider>
  </PostHogProvider>
);

export const Route = createRootRoute({ component: RootLayout });

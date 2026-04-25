import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { NuqsAdapter } from "nuqs/adapters/tanstack-router";

import AccountMenu from "@/domains/account/components/account-menu";
import CookieBanner from "@/shared/components/ui/cookie-banner";
import Providers from "@/shared/providers/providers";

const RootLayout = () => (
  <Providers>
    <a
      href="#main"
      className="bg-background text-foreground focus-visible:ring-ring/30 fixed top-0 left-1/2 z-50 -translate-x-1/2 -translate-y-full rounded-b-md px-4 py-2 text-sm font-medium focus-visible:translate-y-0 focus-visible:ring-2 focus-visible:outline-none motion-safe:transition-transform">
      Skip to content
    </a>
    <CookieBanner />
    <header className="border-border flex items-center justify-between border-b p-2">
      <nav aria-label="Main navigation">
        <ul className="flex flex-row space-x-2">
          <li>
            <Link
              to="/"
              className="text-muted-foreground hover:text-foreground [&.active]:text-foreground transition-colors [&.active]:font-bold">
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/about"
              className="text-muted-foreground hover:text-foreground [&.active]:text-foreground transition-colors [&.active]:font-bold">
              About
            </Link>
          </li>
        </ul>
      </nav>
      <AccountMenu />
    </header>
    <main id="main">
      <NuqsAdapter>
        <Outlet />
      </NuqsAdapter>
    </main>
  </Providers>
);

/**
 * Root TanStack Router route.
 *
 * Renders the shared application shell:
 * - A visually-hidden skip-to-content link for keyboard / screen-reader users.
 * - A {@link CookieBanner} for analytics opt-in.
 * - A top `<header>` with main navigation links and the {@link AccountMenu}.
 * - A `<main id="main">` area wrapping a {@link NuqsAdapter} and the child
 *   {@link Outlet} so that URL query parameters are available to all routes.
 *
 * All providers (PostHog, ThemeProvider) are mounted here via {@link Providers}.
 */
export const Route = createRootRoute({ component: RootLayout });

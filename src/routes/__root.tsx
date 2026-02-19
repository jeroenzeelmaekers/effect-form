import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

import DebugPanel from "@/debug-panel";
import CookieBanner from "@/shared/components/ui/cookie-banner";
import { ModeToggle } from "@/shared/components/ui/mode-toggle";
import Providers from "@/shared/providers/providers";

const RootLayout = () => (
  <Providers>
    <a
      href="#main"
      className="bg-background text-foreground focus-visible:ring-ring/30 fixed top-0 left-1/2 z-50 -translate-x-1/2 -translate-y-full rounded-b-md px-4 py-2 text-sm font-medium transition-transform focus-visible:translate-y-0 focus-visible:ring-2 focus-visible:outline-none">
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
      <div className="space-x-2">
        <DebugPanel />
        <ModeToggle />
      </div>
    </header>
    <Outlet />
  </Providers>
);

export const Route = createRootRoute({ component: RootLayout });

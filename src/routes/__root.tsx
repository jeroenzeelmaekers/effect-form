import { ModeToggle } from '@/shared/components/ui/mode-toggle';
import Providers from '@/shared/providers/providers';
import { createRootRoute, Link, Outlet } from '@tanstack/react-router';

const RootLayout = () => (
  <Providers>
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
  </Providers>
);

export const Route = createRootRoute({ component: RootLayout });

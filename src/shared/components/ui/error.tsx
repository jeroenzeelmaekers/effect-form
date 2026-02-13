import { Atom, useAtomRefresh } from "@effect-atom/atom-react";
import type { ReactNode } from "react";

import { Button } from "@/shared/components/ui/button";

// Error container - the root component
function ErrorRoot({ children }: { children: ReactNode }) {
  return <article className="m-auto max-w-2/3 space-y-3">{children}</article>;
}

// Error content section (title + description)
function ErrorContent({ children }: { children: ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

// Error title
function ErrorTitle({ children }: { children: ReactNode }) {
  return <h1 className="text-xl font-bold">{children}</h1>;
}

// Error description
function ErrorDescription({ children }: { children: ReactNode }) {
  return <p className="text-sm">{children}</p>;
}

// Error actions container
function ErrorActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-row justify-end gap-2">{children}</div>;
}

// Refresh button that works with atoms
function ErrorRefresh<T>({
  atom,
  label = "Try Again",
}: {
  atom: Atom.Atom<T>;
  label?: string;
}) {
  const refresh = useAtomRefresh(atom);
  return (
    <Button variant="default" onClick={refresh}>
      {label}
    </Button>
  );
}

// Compose the Error namespace
export const Error = {
  Root: ErrorRoot,
  Content: ErrorContent,
  Title: ErrorTitle,
  Description: ErrorDescription,
  Actions: ErrorActions,
  Refresh: ErrorRefresh,
};

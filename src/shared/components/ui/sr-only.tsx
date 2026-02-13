import * as React from "react";

import { cn } from "@/shared/lib/utils";

type SrOnlyProps<T extends React.ElementType = "span"> = {
  as?: T;
  children: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "children">;

function SrOnly<T extends React.ElementType = "span">({
  as,
  children,
  className,
  ...props
}: SrOnlyProps<T>) {
  const Component = as || "span";

  return (
    <Component className={cn("sr-only", className)} {...props}>
      {children}
    </Component>
  );
}

export { SrOnly, type SrOnlyProps };

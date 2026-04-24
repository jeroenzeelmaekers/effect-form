import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS class names, resolving conflicts intelligently.
 *
 * Combines `clsx` (for conditional class composition) with `tailwind-merge`
 * (for deduplication of conflicting Tailwind utilities, e.g. `p-2` vs `p-4`).
 *
 * @param inputs - Any number of class values: strings, arrays, or objects
 *   supported by `clsx`.
 * @returns A single merged class name string with Tailwind conflicts resolved.
 *
 * @example
 * cn("px-2 py-1", "p-4")          // "p-4"  (p-4 wins over px-2/py-1)
 * cn("text-red-500", isError && "text-red-700") // conditional classes
 * cn("base-class", { "active": isActive })
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

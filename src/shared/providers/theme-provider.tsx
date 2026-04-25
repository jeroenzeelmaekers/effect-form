import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/** The three supported color scheme options. */
type Theme = "dark" | "light" | "system";

/** Props accepted by {@link ThemeProvider}. */
type ThemeProviderProps = {
  children: React.ReactNode;
  /** Theme applied before the user makes an explicit choice. Defaults to `"system"`. */
  defaultTheme?: Theme;
  /** `localStorage` key used to persist the selected theme. Defaults to `"theme-preference"`. */
  storageKey?: string;
};

/** Shape of the value exposed by `ThemeProviderContext`. */
type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

// Initial state for the context
const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

// Helper functions to get and set theme in localStorage
const getStoredTheme = (storageKey: string, defaultTheme: Theme): Theme => {
  try {
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
  } catch {
    return defaultTheme;
  }
};

const setStoredTheme = (storageKey: string, theme: Theme): void => {
  try {
    localStorage.setItem(storageKey, theme);
  } catch {
    // localStorage unavailable (e.g., private browsing mode)
  }
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

/**
 * Provides a `theme` value and `setTheme` setter to all descendant components.
 *
 * - Reads the initial theme from `localStorage` (falling back to `defaultTheme`).
 * - Applies `"light"` or `"dark"` class to `<html>` on every theme change.
 * - When `theme === "system"`, listens for OS-level `prefers-color-scheme`
 *   changes and updates the class automatically.
 * - Persists the selected theme to `localStorage` on every explicit change.
 *
 * @example
 * <ThemeProvider defaultTheme="system" storageKey="app-theme">
 *   <App />
 * </ThemeProvider>
 */
export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme-preference",
  ...props
}: ThemeProviderProps) {
  // State to hold the current theme
  const [theme, setTheme] = useState<Theme>(() =>
    getStoredTheme(storageKey, defaultTheme),
  );

  useEffect(() => {
    const root = window.document.documentElement;

    // Function to apply the theme class to the root element
    const applyTheme = (isDark: boolean) => {
      root.classList.remove("light", "dark");
      root.classList.add(isDark ? "dark" : "light");
    };

    // Handle system theme preference
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mediaQuery.matches);

      // Listen for changes in system theme preference
      const handleChange = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener("change", handleChange);

      // Cleanup listener on unmount or theme changes to non-system
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    // Apply the selected theme
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  const handleSetTheme = useCallback(
    (next: Theme) => {
      setStoredTheme(storageKey, next);
      setTheme(next);
    },
    [storageKey],
  );

  const value = useMemo(
    () => ({ theme, setTheme: handleSetTheme }),
    [theme, handleSetTheme],
  );

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

/**
 * Consumes the nearest {@link ThemeProvider} context.
 *
 * @returns `{ theme, setTheme }` — the active theme value and a setter that
 *   persists the change to `localStorage`.
 * @throws {Error} When called outside of a `ThemeProvider` tree.
 */
export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};

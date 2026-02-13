import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

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

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      setStoredTheme(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};

'use client';
import { createContext, JSX, useContext, useEffect, useState } from 'react';

type Theme = 'Dark' | 'Light' | 'System';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: 'System',
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

/** ThemeProvider component to manage and provide theme state (Light, Dark, System) to the application.
 * Enables access to theme state and updater function via context.
 * @param {React.ReactNode} children - Child components that will have access to the theme context.
 * @param {Theme} defaultTheme - Optional default theme to initialize the provider with.
 * @param {string} storageKey - Optional key for storing the theme preference in localStorage.
 * @returns {JSX.Element} The ThemeProvider component wrapping its children with ThemeProviderContext.
 */
export const ThemeProvider = ({
  children,
  storageKey = 'breeze-ui-theme',
  defaultTheme = 'System',
}: ThemeProviderProps): JSX.Element => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') {
      // SSR: render with the default; the real class is applied after mount.
      return defaultTheme;
    }
    const storedTheme = localStorage.getItem(storageKey) as Theme | null;
    return storedTheme ?? defaultTheme;
  });

  // Theme classes on <html> must be lowercase to match the CSS (.dark/.light).
  useEffect(() => {
    const root = window.document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = () => {
      root.classList.remove('light', 'dark');

      if (theme === 'System') {
        root.classList.add(media.matches ? 'dark' : 'light');
        return;
      }

      root.classList.add(theme.toLowerCase());
    };

    apply();

    // Follow live OS theme changes while on 'System'.
    if (theme !== 'System') {
      return;
    }
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  const value = {
    theme,
    setTheme: (next: Theme) => {
      localStorage.setItem(storageKey, next);
      setTheme(next);
    },
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};

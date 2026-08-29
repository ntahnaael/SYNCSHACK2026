import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

export type ThemeMode = 'dark' | 'light';

type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'dark',
  isDark: true,
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark');

  const toggle = useCallback(() => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, isDark: mode === 'dark', toggle }),
    [mode, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode() {
  return useContext(ThemeContext);
}

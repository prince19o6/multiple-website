/**
 * store/ThemeContext.tsx
 *
 * Provides dark-mode-aware ThemeColors to every component.
 * Reads system color scheme via useColorScheme() and blends it with
 * the site's brand colors from SiteConfigContext.
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { DEFAULT_THEME, type ThemeColors } from '@/lib/themeFromApi';
import { useSite } from './SiteConfigContext';

// ─── Dark-mode overlay ────────────────────────────────────────────────────────

/**
 * When the system is in dark mode we darken surfaces and lighten text.
 * Brand colors (primary, accent) stay the same so the site identity
 * is preserved in both modes.
 */
function applyDarkMode(theme: ThemeColors): ThemeColors {
  return {
    ...theme,
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
    heading: '#f8fafc',
    mutedText: '#94a3b8',
    border: '#334155',
    footerBg: '#020617',
    footerText: '#cbd5e1',
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface ThemeContextValue {
  theme: ThemeColors;
  isDark: boolean;
  /** Raw (light) theme — useful for charts / illustrations that don't invert */
  rawTheme: ThemeColors;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  isDark: false,
  rawTheme: DEFAULT_THEME,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const { theme: siteTheme } = useSite();
  const isDark = colorScheme === 'dark';

  const value = useMemo<ThemeContextValue>(() => {
    const rawTheme = siteTheme ?? DEFAULT_THEME;
    const theme = isDark ? applyDarkMode(rawTheme) : rawTheme;
    return { theme, isDark, rawTheme };
  }, [siteTheme, isDark]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Returns the active (dark-mode-aware) ThemeColors. */
export function useAppTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

/** Shortcut: returns just the ThemeColors. */
export function useColors(): ThemeColors {
  return useContext(ThemeContext).theme;
}

/** True when the system is in dark mode. */
export function useIsDark(): boolean {
  return useContext(ThemeContext).isDark;
}

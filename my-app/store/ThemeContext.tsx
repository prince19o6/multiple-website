/**
 * store/ThemeContext.tsx
 *
 * Provides theme-aware ThemeColors to every component in the native mobile app.
 *
 * Defaults to the white (light) theme with dynamic tenant brand accents.
 * Supports persistent appearance preferences ('light' | 'dark' | 'system')
 * stored tenant-isolated via storeGet / storeSet from '@/src/lib/storage'.
 */

import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { DEFAULT_THEME, type ThemeColors } from '@/lib/themeFromApi';
import { useSite } from './SiteConfigContext';
import { storeGet, storeSet } from '@/src/lib/storage';

export type AppearanceMode = 'light' | 'dark' | 'system';

// ─── Dark-mode overlay ────────────────────────────────────────────────────────

/**
 * When in dark mode we darken surfaces and lighten text.
 * Brand colors (primary, accent) stay the same so the site identity
 * is preserved in both modes.
 */
function applyDarkMode(theme: ThemeColors): ThemeColors {
  return {
    ...theme,
    background: '#0b0f19',
    surface: '#131b2e',
    surface2: '#1e293b',
    text: '#f8fafc',
    heading: '#f8fafc',
    mutedText: '#94a3b8',
    border: '#1e293b',
    cardBg: '#131b2e',
    footerBg: '#020617',
    footerText: '#cbd5e1',
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

export interface ThemeContextValue {
  theme: ThemeColors;
  isDark: boolean;
  /** Raw (light) theme — useful for charts / illustrations that don't invert */
  rawTheme: ThemeColors;
  appearanceMode: AppearanceMode;
  setAppearanceMode: (mode: AppearanceMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  isDark: false,
  rawTheme: DEFAULT_THEME,
  appearanceMode: 'light',
  setAppearanceMode: async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const { theme: siteTheme, siteId } = useSite();
  const [appearanceMode, setAppearanceModeState] = useState<AppearanceMode>('light');
  const [loadedFromStorage, setLoadedFromStorage] = useState(false);

  // Restore stored user preference per site tenant on mount
  useEffect(() => {
    let isMounted = true;
    async function loadStoredMode() {
      try {
        const stored = await storeGet('theme.appearance_mode', siteId);
        if (isMounted && stored && (stored === 'light' || stored === 'dark' || stored === 'system')) {
          setAppearanceModeState(stored as AppearanceMode);
        }
      } catch {
        // Fallback remains 'light'
      } finally {
        if (isMounted) setLoadedFromStorage(true);
      }
    }

    loadStoredMode();
    return () => {
      isMounted = false;
    };
  }, [siteId]);

  const setAppearanceMode = useCallback(
    async (newMode: AppearanceMode) => {
      setAppearanceModeState(newMode);
      try {
        await storeSet('theme.appearance_mode', newMode, siteId);
      } catch (err) {
        console.warn('[ThemeContext] Failed to save appearance mode:', err);
      }
    },
    [siteId]
  );

  // Compute active dark state: default is light
  const isDark = useMemo(() => {
    if (appearanceMode === 'dark') return true;
    if (appearanceMode === 'light') return false;
    return systemColorScheme === 'dark';
  }, [appearanceMode, systemColorScheme]);

  const value = useMemo<ThemeContextValue>(() => {
    const rawTheme = siteTheme ?? DEFAULT_THEME;
    const theme = isDark ? applyDarkMode(rawTheme) : rawTheme;
    return {
      theme,
      isDark,
      rawTheme,
      appearanceMode,
      setAppearanceMode,
    };
  }, [siteTheme, isDark, appearanceMode, setAppearanceMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Returns the active ThemeContextValue including mode and setter. */
export function useAppTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

/** Shortcut: returns just the ThemeColors. */
export function useColors(): ThemeColors {
  return useContext(ThemeContext).theme;
}

/** True when active theme is dark mode. */
export function useIsDark(): boolean {
  return useContext(ThemeContext).isDark;
}

/** Returns the user's selected appearance preference ('light' | 'dark' | 'system'). */
export function useAppearanceMode(): {
  appearanceMode: AppearanceMode;
  setAppearanceMode: (mode: AppearanceMode) => Promise<void>;
} {
  const { appearanceMode, setAppearanceMode } = useContext(ThemeContext);
  return { appearanceMode, setAppearanceMode };
}

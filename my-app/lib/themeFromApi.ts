/**
 * lib/themeFromApi.ts
 *
 * Maps the live Config API color palettes to the flat ThemeColors shape
 * used by every component in the native mobile app.
 *
 * Integrates WCAG AA contrast derivation to guarantee readability on white
 * backgrounds and optimal primary contrast button text.
 */

import { getContrastTextColor, ensureAccessibleTextColor } from './contrast';

export type ColorShadeMap = Partial<Record<string, string>>;

export interface ApiColors {
  primary?: ColorShadeMap | string;
  secondary?: ColorShadeMap | string;
  neutral?: ColorShadeMap | string;
  footerbgcolor?: ColorShadeMap | string;
  footertextcolor?: ColorShadeMap | string;
  [key: string]: ColorShadeMap | string | undefined;
}

/** Flat theme object consumed by all mobile screens and components. */
export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryContrast: string;
  primaryText: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  surface2: string;
  text: string;
  heading: string;
  mutedText: string;
  border: string;
  success: string;
  danger: string;
  footerBg: string;
  footerText: string;
  cardBg: string;
  primaryScale?: ColorShadeMap;
  secondaryScale?: ColorShadeMap;
  neutralScale?: ColorShadeMap;
}

/** Fallback default light theme with white background (#ffffff) and WCAG AA contrast. */
export const DEFAULT_THEME: ThemeColors = {
  primary: '#2882c5',
  primaryDark: '#1f679c',
  primaryLight: '#eaf3f9',
  primaryContrast: '#ffffff',
  primaryText: '#1f679c',
  secondary: '#0f172a',
  accent: '#f59e0b',
  background: '#ffffff',
  surface: '#ffffff',
  surface2: '#f8fafc',
  text: '#0f172a',
  heading: '#0f172a',
  mutedText: '#64748b',
  border: '#e2e8f0',
  success: '#16a34a',
  danger: '#dc2626',
  footerBg: '#0f172a',
  footerText: '#f8fafc',
  cardBg: '#ffffff',
};

function shade(
  value: ColorShadeMap | string | undefined,
  preferred: string[],
  fallback: string
): string {
  if (!value) return fallback;
  if (typeof value === 'string') return value || fallback;
  for (const key of preferred) {
    const v = value[key];
    if (typeof v === 'string' && v) return v;
  }
  for (const v of Object.values(value)) {
    if (typeof v === 'string' && v) return v;
  }
  return fallback;
}

/** Convert API color palettes → flat ThemeColors with WCAG AA compliance. */
export function themeFromApiColors(
  colors: ApiColors | null | undefined,
  siteId?: string,
  explicitOverrides?: {
    light?: Record<string, string>;
    dark?: Record<string, string>;
  }
): ThemeColors {
  if (!colors || typeof colors !== 'object') {
    return { ...DEFAULT_THEME };
  }

  const rawPrimary = shade(colors.primary, ['600', '700', '500', '800'], DEFAULT_THEME.primary);
  const primaryDark = shade(colors.primary, ['800', '900', '700'], DEFAULT_THEME.primaryDark);
  const primaryLight = shade(colors.primary, ['100', '50', '200'], DEFAULT_THEME.primaryLight);
  const accent = shade(colors.secondary, ['500', '600', '400', '700'], DEFAULT_THEME.accent);
  const secondary = shade(colors.neutral, ['900', '800', '700'], DEFAULT_THEME.secondary);

  // Background is strictly pure white (#ffffff) for the default light theme
  const background = '#ffffff';
  const surface = '#ffffff';
  const surface2 = '#f8fafc';
  const text = '#0f172a';
  const heading = '#0f172a';
  const mutedText = '#64748b';
  const border = '#e2e8f0';

  const footerBg = shade(
    colors.footerbgcolor,
    ['800', '900', '700'],
    shade(colors.neutral, ['900', '800'], DEFAULT_THEME.footerBg)
  );
  const footerText = shade(
    colors.footertextcolor,
    ['800', '900', '700'],
    DEFAULT_THEME.footerText
  );

  // Derive WCAG AA accessible variants
  const primaryContrast = getContrastTextColor(rawPrimary);
  const { accessibleHex: primaryText } = ensureAccessibleTextColor(
    rawPrimary,
    background,
    siteId,
    'primary text'
  );

  const base: ThemeColors = {
    primary: rawPrimary,
    primaryDark,
    primaryLight,
    primaryContrast,
    primaryText,
    secondary,
    accent,
    background,
    surface,
    surface2,
    text,
    heading,
    mutedText,
    border,
    success: DEFAULT_THEME.success,
    danger: DEFAULT_THEME.danger,
    footerBg,
    footerText,
    cardBg: surface,
    primaryScale: typeof colors.primary === 'object' ? colors.primary : undefined,
    secondaryScale: typeof colors.secondary === 'object' ? colors.secondary : undefined,
    neutralScale: typeof colors.neutral === 'object' ? colors.neutral : undefined,
  };

  // If backend provided explicit light overrides (theme.light)
  if (explicitOverrides?.light && typeof explicitOverrides.light === 'object') {
    return {
      ...base,
      ...explicitOverrides.light,
    };
  }

  return base;
}

export function themeToTokenMap(theme: ThemeColors): Record<string, string> {
  return {
    primary: theme.primary,
    primaryDark: theme.primaryDark,
    primaryLight: theme.primaryLight,
    primaryContrast: theme.primaryContrast,
    primaryText: theme.primaryText,
    secondary: theme.secondary,
    accent: theme.accent,
    background: theme.background,
    surface: theme.surface,
    surface2: theme.surface2,
    text: theme.text,
    heading: theme.heading,
    mutedText: theme.mutedText,
    border: theme.border,
    success: theme.success,
    danger: theme.danger,
    footerBg: theme.footerBg,
    footerText: theme.footerText,
  };
}

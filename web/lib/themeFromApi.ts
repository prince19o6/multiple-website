/**
 * lib/themeFromApi.ts
 *
 * Maps the live Config API payload into semantic design tokens and the flat
 * theme shape components expect, plus CSS-variables maps for light and dark modes.
 */

import {
  buildThemeTokens,
  tokensToCssVars,
  type SemanticTokens,
  BASE_LIGHT_TOKENS,
  BASE_DARK_TOKENS,
} from "./themeTokens";

export type ColorShadeMap = Partial<Record<string, string>>;

export interface ApiColors {
  primary?: ColorShadeMap | string;
  secondary?: ColorShadeMap | string;
  neutral?: ColorShadeMap | string;
  footerbgcolor?: ColorShadeMap | string;
  footertextcolor?: ColorShadeMap | string;
  [key: string]: ColorShadeMap | string | undefined;
}

/** Flat theme object used by Navigation, Footer, cards, pages, etc. */
export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryContrast: string;
  primaryText: string;
  secondary: string;
  secondaryContrast: string;
  accent: string;
  accentContrast: string;
  background: string;
  surface: string;
  surface2: string;
  surface3: string;
  text: string;
  heading: string;
  mutedText: string;
  border: string;
  borderSubtle: string;
  borderStrong: string;
  success: string;
  warning: string;
  danger: string;
  footerBg: string;
  footerText: string;
  primaryScale?: ColorShadeMap;
  secondaryScale?: ColorShadeMap;
  neutralScale?: ColorShadeMap;
  tokens: {
    light: SemanticTokens;
    dark: SemanticTokens;
  };
}

export const DEFAULT_THEME: ThemeColors = {
  primary: "#2563eb",
  primaryDark: "#1d4ed8",
  primaryLight: "#dbeafe",
  primaryContrast: "#ffffff",
  primaryText: "#1d4ed8",
  secondary: "#0f172a",
  secondaryContrast: "#ffffff",
  accent: "#f59e0b",
  accentContrast: "#0f172a",
  background: "#ffffff",
  surface: "#ffffff",
  surface2: "#f8fafc",
  surface3: "#f1f5f9",
  text: "#0f172a",
  heading: "#0f172a",
  mutedText: "#64748b",
  border: "#e2e8f0",
  borderSubtle: "#f1f5f9",
  borderStrong: "#cbd5e1",
  success: "#16a34a",
  warning: "#f59e0b",
  danger: "#dc2626",
  footerBg: "#ffffff",
  footerText: "#0f172a",
  tokens: {
    light: {
      ...BASE_LIGHT_TOKENS,
      primary: "#2563eb",
      primaryContrast: "#ffffff",
      primaryText: "#1d4ed8",
      primaryLight: "#dbeafe",
      primaryDark: "#1d4ed8",
      secondary: "#0f172a",
      secondaryContrast: "#ffffff",
      accent: "#f59e0b",
      accentContrast: "#0f172a",
    },
    dark: {
      ...BASE_DARK_TOKENS,
      primary: "#2563eb",
      primaryContrast: "#ffffff",
      primaryText: "#93c5fd",
      primaryLight: "rgba(37, 99, 235, 0.15)",
      primaryDark: "#1d4ed8",
      secondary: "#0f172a",
      secondaryContrast: "#ffffff",
      accent: "#f59e0b",
      accentContrast: "#0f172a",
    },
  },
};

function shade(
  value: ColorShadeMap | string | undefined,
  preferred: string[],
  fallback: string
): string {
  if (!value) return fallback;
  if (typeof value === "string") return value || fallback;
  for (const key of preferred) {
    const v = value[key];
    if (typeof v === "string" && v) return v;
  }
  for (const v of Object.values(value)) {
    if (typeof v === "string" && v) return v;
  }
  return fallback;
}

export function themeFromApiColors(
  colors: ApiColors | null | undefined,
  siteId?: string,
  explicitThemeOverrides?: {
    light?: Partial<SemanticTokens>;
    dark?: Partial<SemanticTokens>;
  }
): ThemeColors {
  if (!colors || typeof colors !== "object") {
    return { ...DEFAULT_THEME };
  }

  // Brand colors from API
  const primary = shade(colors.primary, ["600", "500", "700", "800"], DEFAULT_THEME.primary);
  const secondary = shade(colors.secondary, ["600", "500", "700", "800"], DEFAULT_THEME.secondary);
  const accent = shade(colors.secondary, ["500", "400", "600"], DEFAULT_THEME.accent);

  // Build complete light & dark semantic token sets with contrast checks
  const { light, dark } = buildThemeTokens(primary, secondary, accent, siteId, explicitThemeOverrides);

  // Footer colors from API (fall back to clean white base for light mode)
  const footerBg = shade(colors.footerbgcolor, ["800", "900", "700"], light.surface);
  const footerText = shade(colors.footertextcolor, ["800", "900", "700"], light.text);

  return {
    primary: light.primary,
    primaryDark: light.primaryDark,
    primaryLight: light.primaryLight,
    primaryContrast: light.primaryContrast,
    primaryText: light.primaryText,
    secondary: light.secondary,
    secondaryContrast: light.secondaryContrast,
    accent: light.accent,
    accentContrast: light.accentContrast,
    background: light.bg,
    surface: light.surface,
    surface2: light.surface2,
    surface3: light.surface3,
    text: light.text,
    heading: light.text,
    mutedText: light.textMuted,
    border: light.border,
    borderSubtle: light.borderSubtle,
    borderStrong: light.borderStrong,
    success: light.success,
    warning: light.warning,
    danger: light.danger,
    footerBg,
    footerText,
    primaryScale: typeof colors.primary === "object" ? colors.primary : undefined,
    secondaryScale: typeof colors.secondary === "object" ? colors.secondary : undefined,
    neutralScale: typeof colors.neutral === "object" ? colors.neutral : undefined,
    tokens: {
      light,
      dark,
    },
  };
}

export function themeToCssVariables(theme: ThemeColors): Record<string, string> {
  const lightVars = tokensToCssVars(theme.tokens.light);
  const vars: Record<string, string> = { ...lightVars };

  if (theme.primaryScale) {
    for (const [k, v] of Object.entries(theme.primaryScale)) {
      if (v) vars[`--color-primary-${k}`] = v;
    }
  }
  if (theme.secondaryScale) {
    for (const [k, v] of Object.entries(theme.secondaryScale)) {
      if (v) vars[`--color-secondary-${k}`] = v;
    }
  }
  if (theme.neutralScale) {
    for (const [k, v] of Object.entries(theme.neutralScale)) {
      if (v) vars[`--color-neutral-${k}`] = v;
    }
  }

  return vars;
}

export function themeToDarkCssVariables(theme: ThemeColors): Record<string, string> {
  return tokensToCssVars(theme.tokens.dark);
}
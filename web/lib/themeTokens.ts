/**
 * lib/themeTokens.ts
 *
 * Authoritative semantic design tokens for light (default) and dark modes.
 * Maps brand colors from API into accessible semantic CSS variables.
 */

import {
  ensureAccessibleTextColor,
  getContrastTextColor,
  hexToRgb,
  rgbToHex,
} from "./contrast";

export interface SemanticTokens {
  // Surfaces & Backgrounds
  bg: string;
  surface: string;
  surface2: string;
  surface3: string;

  // Text & Content
  text: string;
  textMuted: string;
  textSubtle: string;

  // Borders & Dividers
  border: string;
  borderSubtle: string;
  borderStrong: string;

  // Brand Colors
  primary: string;
  primaryContrast: string;
  primaryText: string;
  primaryLight: string;
  primaryDark: string;

  secondary: string;
  secondaryContrast: string;

  accent: string;
  accentContrast: string;

  // Semantic Status
  success: string;
  warning: string;
  danger: string;

  // Elevation & Overlays
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
  overlay: string;

  // Browser Scheme
  colorScheme: "light" | "dark";
}

/** Default Base Light Theme Tokens (White background as default) */
export const BASE_LIGHT_TOKENS: Omit<
  SemanticTokens,
  | "primary"
  | "primaryContrast"
  | "primaryText"
  | "primaryLight"
  | "primaryDark"
  | "secondary"
  | "secondaryContrast"
  | "accent"
  | "accentContrast"
> = {
  bg: "#ffffff",
  surface: "#ffffff",
  surface2: "#f8fafc",
  surface3: "#f1f5f9",
  text: "#0f172a",
  textMuted: "#64748b",
  textSubtle: "#94a3b8",
  border: "#e2e8f0",
  borderSubtle: "#f1f5f9",
  borderStrong: "#cbd5e1",
  success: "#16a34a",
  warning: "#f59e0b",
  danger: "#dc2626",
  shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  shadowMd: "0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
  shadowLg: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)",
  overlay: "rgba(15, 23, 42, 0.5)",
  colorScheme: "light",
};

/** Default Base Dark Theme Tokens */
export const BASE_DARK_TOKENS: Omit<
  SemanticTokens,
  | "primary"
  | "primaryContrast"
  | "primaryText"
  | "primaryLight"
  | "primaryDark"
  | "secondary"
  | "secondaryContrast"
  | "accent"
  | "accentContrast"
> = {
  bg: "#0b0f19",
  surface: "#131b2e",
  surface2: "#1e293b",
  surface3: "#334155",
  text: "#f8fafc",
  textMuted: "#94a3b8",
  textSubtle: "#64748b",
  border: "#1e293b",
  borderSubtle: "#111827",
  borderStrong: "#334155",
  success: "#22c55e",
  warning: "#fbbf24",
  danger: "#ef4444",
  shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.35)",
  shadowMd: "0 4px 6px -1px rgba(0, 0, 0, 0.45), 0 2px 4px -2px rgba(0, 0, 0, 0.3)",
  shadowLg: "0 10px 15px -3px rgba(0, 0, 0, 0.55), 0 4px 6px -4px rgba(0, 0, 0, 0.35)",
  overlay: "rgba(0, 0, 0, 0.75)",
  colorScheme: "dark",
};

function tintColor(hex: string, factor: number = 0.12): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#eaf3f9";
  const r = Math.round(rgb.r + (255 - rgb.r) * (1 - factor));
  const g = Math.round(rgb.g + (255 - rgb.g) * (1 - factor));
  const b = Math.round(rgb.b + (255 - rgb.b) * (1 - factor));
  return rgbToHex({ r, g, b });
}

function shadeColor(hex: string, factor: number = 0.82): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#1d4ed8";
  const r = Math.round(rgb.r * factor);
  const g = Math.round(rgb.g * factor);
  const b = Math.round(rgb.b * factor);
  return rgbToHex({ r, g, b });
}

/**
 * Builds the complete semantic tokens for both Light and Dark modes
 * given the brand colors resolved from the config API.
 */
export function buildThemeTokens(
  brandPrimary: string = "#2563eb",
  brandSecondary: string = "#0f172a",
  brandAccent: string = "#f59e0b",
  siteId?: string,
  overrides?: {
    light?: Partial<SemanticTokens>;
    dark?: Partial<SemanticTokens>;
  }
): { light: SemanticTokens; dark: SemanticTokens } {
  // Contrast checks on white background
  const primaryCheck = ensureAccessibleTextColor(brandPrimary, "#ffffff", siteId, "primary");
  const primaryText = primaryCheck.accessibleHex;
  const primaryContrast = getContrastTextColor(brandPrimary);
  const primaryLight = tintColor(brandPrimary, 0.1);
  const primaryDark = shadeColor(brandPrimary, 0.85);

  const secondaryContrast = getContrastTextColor(brandSecondary);
  const accentContrast = getContrastTextColor(brandAccent);

  const light: SemanticTokens = {
    ...BASE_LIGHT_TOKENS,
    primary: brandPrimary,
    primaryContrast,
    primaryText,
    primaryLight,
    primaryDark,
    secondary: brandSecondary,
    secondaryContrast,
    accent: brandAccent,
    accentContrast,
    ...(overrides?.light || {}),
  };

  const dark: SemanticTokens = {
    ...BASE_DARK_TOKENS,
    primary: brandPrimary,
    primaryContrast,
    primaryText: tintColor(brandPrimary, 0.8), // lighter in dark mode for contrast
    primaryLight: "rgba(37, 99, 235, 0.15)",
    primaryDark,
    secondary: brandSecondary,
    secondaryContrast,
    accent: brandAccent,
    accentContrast,
    ...(overrides?.dark || {}),
  };

  return { light, dark };
}

/** Convert tokens to CSS Variable key-value pairs */
export function tokensToCssVars(tokens: SemanticTokens): Record<string, string> {
  return {
    "--bg": tokens.bg,
    "--surface": tokens.surface,
    "--surface-2": tokens.surface2,
    "--surface-3": tokens.surface3,
    "--text": tokens.text,
    "--text-muted": tokens.textMuted,
    "--text-subtle": tokens.textSubtle,
    "--border": tokens.border,
    "--border-subtle": tokens.borderSubtle,
    "--border-strong": tokens.borderStrong,

    "--primary": tokens.primary,
    "--primary-contrast": tokens.primaryContrast,
    "--primary-text": tokens.primaryText,
    "--primary-light": tokens.primaryLight,
    "--primary-dark": tokens.primaryDark,

    "--secondary": tokens.secondary,
    "--secondary-contrast": tokens.secondaryContrast,

    "--accent": tokens.accent,
    "--accent-contrast": tokens.accentContrast,

    "--success": tokens.success,
    "--warning": tokens.warning,
    "--danger": tokens.danger,

    "--shadow-sm": tokens.shadowSm,
    "--shadow-md": tokens.shadowMd,
    "--shadow-lg": tokens.shadowLg,
    "--overlay": tokens.overlay,
    "--color-scheme": tokens.colorScheme,

    // Legacy compatibility aliases
    "--color-primary": tokens.primary,
    "--color-primary-dark": tokens.primaryDark,
    "--color-primary-light": tokens.primaryLight,
    "--color-secondary": tokens.secondary,
    "--color-accent": tokens.accent,
    "--color-background": tokens.bg,
    "--color-surface": tokens.surface,
    "--color-text": tokens.text,
    "--color-heading": tokens.text,
    "--color-muted": tokens.textMuted,
    "--color-border": tokens.border,
    "--color-success": tokens.success,
    "--color-danger": tokens.danger,
  };
}

/**
 * Maps the live Config API payload into the flat theme shape components expect,
 * plus a CSS-variables map for globals / Tailwind-friendly usage.
 *
 * API colors are shade palettes, e.g.:
 *   colors.primary = { "50": "#eaf3f9", ..., "600": "#2882c5", "900": "..." }
 * Components historically use flat keys: theme.primary, theme.primaryDark, etc.
 */

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
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    heading: string;
    mutedText: string;
    border: string;
    success: string;
    danger: string;
    footerBg: string;
    footerText: string;
    primaryScale?: ColorShadeMap;
    secondaryScale?: ColorShadeMap;
    neutralScale?: ColorShadeMap;
}

export const DEFAULT_THEME: ThemeColors = {
    primary: "#2563eb",
    primaryDark: "#1d4ed8",
    primaryLight: "#dbeafe",
    secondary: "#0f172a",
    accent: "#f59e0b",
    background: "#f8fafc",
    surface: "#ffffff",
    text: "#111827",
    heading: "#0f172a",
    mutedText: "#64748b",
    border: "#e2e8f0",
    success: "#16a34a",
    danger: "#dc2626",
    footerBg: "#0f172a",
    footerText: "#f8fafc",
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

export function themeFromApiColors(colors: ApiColors | null | undefined): ThemeColors {
    if (!colors || typeof colors !== "object") {
        return { ...DEFAULT_THEME };
    }

    const primary = shade(colors.primary, ["600", "700", "500", "800"], DEFAULT_THEME.primary);
    const primaryDark = shade(colors.primary, ["800", "900", "700"], DEFAULT_THEME.primaryDark);
    const primaryLight = shade(colors.primary, ["100", "50", "200"], DEFAULT_THEME.primaryLight);
    const accent = shade(colors.secondary, ["500", "600", "400", "700"], DEFAULT_THEME.accent);
    const secondary = shade(colors.neutral, ["900", "800", "700"], DEFAULT_THEME.secondary);
    const background = shade(colors.neutral, ["50", "100"], DEFAULT_THEME.background);
    const surface = shade(colors.neutral, ["50"], DEFAULT_THEME.surface) || "#ffffff";
    const text = shade(colors.neutral, ["900", "800"], DEFAULT_THEME.text);
    const heading = shade(colors.neutral, ["900", "800"], DEFAULT_THEME.heading);
    const mutedText = shade(colors.neutral, ["500", "600", "400"], DEFAULT_THEME.mutedText);
    const border = shade(colors.neutral, ["200", "300"], DEFAULT_THEME.border);
    const footerBg = shade(
        colors.footerbgcolor,
        ["800", "900", "700"],
        shade(colors.neutral, ["900", "800"], DEFAULT_THEME.footerBg)
    );
    const footerText = shade(
        colors.footertextcolor,
        ["800", "900", "700"],
        DEFAULT_THEME.footerText
    );

    return {
        primary,
        primaryDark,
        primaryLight,
        secondary,
        accent,
        background,
        surface,
        text,
        heading,
        mutedText,
        border,
        success: DEFAULT_THEME.success,
        danger: DEFAULT_THEME.danger,
        footerBg,
        footerText,
        primaryScale: typeof colors.primary === "object" ? colors.primary : undefined,
        secondaryScale: typeof colors.secondary === "object" ? colors.secondary : undefined,
        neutralScale: typeof colors.neutral === "object" ? colors.neutral : undefined,
    };
}

export function themeToCssVariables(theme: ThemeColors): Record<string, string> {
    const vars: Record<string, string> = {
        "--color-primary": theme.primary,
        "--color-primary-dark": theme.primaryDark,
        "--color-primary-light": theme.primaryLight,
        "--color-secondary": theme.secondary,
        "--color-accent": theme.accent,
        "--color-background": theme.background,
        "--color-surface": theme.surface,
        "--color-text": theme.text,
        "--color-heading": theme.heading,
        "--color-muted": theme.mutedText,
        "--color-border": theme.border,
        "--color-success": theme.success,
        "--color-danger": theme.danger,
        "--color-footer-bg": theme.footerBg,
        "--color-footer-text": theme.footerText,
    };

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
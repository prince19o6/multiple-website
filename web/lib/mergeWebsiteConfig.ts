/**
 * lib/mergeWebsiteConfig.ts
 *
 * Unified configuration merger for multi-tenant travel platform.
 * Supports both the typed SiteConfig contract (Phase 2 & 4) and
 * legacy dynamic payloads, ensuring complete backwards compatibility.
 */

import type { SiteConfig } from "@/lib/config/siteConfigSchema";
import { DEFAULT_SITE_CONFIG } from "@/lib/config/siteConfigSchema";
import type { SiteConfigResult } from "./siteConfig";
import { resolveLogoUrl } from "./siteConfig";
import { resolveLogoFromWebsite } from "./assetResolver";
import {
  themeFromApiColors,
  themeToCssVariables,
  themeToDarkCssVariables,
  DEFAULT_THEME,
  type ThemeColors,
} from "./themeFromApi";
import { servicesFromConfig, type WebsiteServices, type WebsiteModuleItem } from "./websiteModules";
import { headerLinksFromConfig, type NavLink } from "./websiteLinks";
import { isEmptyExternalResult } from "./externalConfig";
import { getContrastRatio, ensureAccessibleTextColor } from "./contrast";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMerge(target: unknown, source: unknown): unknown {
  if (!isPlainObject(target) || !isPlainObject(source)) {
    return source !== undefined ? source : target;
  }
  const result: Record<string, unknown> = { ...target };
  for (const key of Object.keys(source)) {
    const sv = source[key];
    const tv = target[key];
    result[key] =
      isPlainObject(sv) && isPlainObject(tv) ? deepMerge(tv, sv) : sv;
  }
  return result;
}

export type MergedWebsiteConfig = Record<string, unknown> & Partial<SiteConfig> & {
  id?: string;
  name?: string;
  logo?: string | null;
  logoLight?: string | null;
  logoDark?: string | null;
  defaultMode?: "light" | "dark";
  favicon?: string | null;
  footerCopyright?: string;
  theme: ThemeColors & Partial<SiteConfig["theme"]>;
  cssVariables: Record<string, string>;
  darkCssVariables: Record<string, string>;
  typography: Record<string, unknown> & Partial<SiteConfig["typography"]>;
  contact: { email?: string; phone?: string; address?: string };
  dynamic: SiteConfigResult | null;
  uiTheme?: Record<string, unknown>;
  services: WebsiteServices;
  headerLinks: NavLink[] | null;
  currencySymbol?: string;
  configError?: {
    hostname: string;
    url: string;
    status: number | null;
    message: string;
  } | null;
  configSource?: "external" | "static" | "mixed" | "error";
};

/**
 * Checks if input matches the typed SiteConfig contract structure.
 */
export function isSiteConfig(obj: unknown): obj is SiteConfig {
  if (!obj || typeof obj !== "object") return false;
  const c = obj as Record<string, unknown>;
  return Boolean(
    c.site &&
    typeof c.site === "object" &&
    c.theme &&
    typeof c.theme === "object" &&
    c.features &&
    typeof c.features === "object"
  );
}

/**
 * Converts a typed SiteConfig into a unified MergedSiteConfig with
 * backward-compatible aliases for all UI components.
 */
export function toMergedSiteConfig(
  input: SiteConfig | MergedWebsiteConfig | unknown
): MergedWebsiteConfig & SiteConfig {
  if (isSiteConfig(input) && (input as any).cssVariables && (input as any).services) {
    return input as MergedWebsiteConfig & SiteConfig;
  }

  const rawConfig: SiteConfig = isSiteConfig(input)
    ? input
    : (DEFAULT_SITE_CONFIG as SiteConfig);

  const siteId = rawConfig.site?.id || "gujjutours";
  const colors = rawConfig.theme?.colors || DEFAULT_SITE_CONFIG.theme.colors;
  const darkColors = rawConfig.theme?.darkColors || DEFAULT_SITE_CONFIG.theme.darkColors;

  // WCAG AA contrast check against white background (#ffffff)
  let primaryText = colors.primaryText || colors.primaryDark || colors.primary;
  const primaryContrastRatio = getContrastRatio(colors.primary, "#ffffff");
  if (primaryContrastRatio < 4.5) {
    primaryText = ensureAccessibleTextColor(colors.primary, "#ffffff", siteId).accessibleHex;
  }

  // Build ThemeColors structure
  const themeColors: ThemeColors & Partial<SiteConfig["theme"]> = {
    ...rawConfig.theme,
    primary: colors.primary,
    primaryDark: colors.primaryDark,
    primaryLight: colors.primaryLight,
    primaryContrast: colors.primaryContrast || "#ffffff",
    primaryText,
    secondary: colors.secondary,
    secondaryContrast: "#ffffff",
    accent: colors.accent,
    accentContrast: "#0f172a",
    background: colors.background || "#ffffff",
    surface: colors.surface || "#ffffff",
    surface2: colors.surface2 || "#f8fafc",
    surface3: "#f1f5f9",
    text: colors.text || "#0f172a",
    heading: colors.heading || "#0f172a",
    mutedText: colors.mutedText || "#64748b",
    border: colors.border || "#e2e8f0",
    borderSubtle: "#f1f5f9",
    borderStrong: "#cbd5e1",
    success: colors.success || "#16a34a",
    warning: "#f59e0b",
    danger: colors.danger || "#dc2626",
    footerBg: colors.footerBg || "#0f172a",
    footerText: colors.footerText || "#f8fafc",
    tokens: {
      light: {
        bg: colors.background || "#ffffff",
        surface: colors.surface || "#ffffff",
        surface2: colors.surface2 || "#f8fafc",
        surface3: "#f1f5f9",
        text: colors.text || "#0f172a",
        textMuted: colors.mutedText || "#64748b",
        textSubtle: "#94a3b8",
        border: colors.border || "#e2e8f0",
        borderSubtle: "#f1f5f9",
        borderStrong: "#cbd5e1",
        primary: colors.primary,
        primaryContrast: colors.primaryContrast || "#ffffff",
        primaryText,
        primaryLight: colors.primaryLight,
        primaryDark: colors.primaryDark,
        secondary: colors.secondary,
        secondaryContrast: "#ffffff",
        accent: colors.accent,
        accentContrast: "#0f172a",
        success: colors.success || "#16a34a",
        warning: "#f59e0b",
        danger: colors.danger || "#dc2626",
        shadowSm: rawConfig.theme?.shadows?.sm || "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        shadowMd: rawConfig.theme?.shadows?.md || "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        shadowLg: rawConfig.theme?.shadows?.lg || "0 10px 15px -3px rgb(0 0 0 / 0.1)",
        overlay: "rgba(0, 0, 0, 0.5)",
        colorScheme: "light" as const,
      },
      dark: {
        bg: darkColors?.background || "#0b0f19",
        surface: darkColors?.surface || "#131b2e",
        surface2: darkColors?.surface2 || "#1e293b",
        surface3: "#334155",
        text: darkColors?.text || "#f8fafc",
        textMuted: darkColors?.mutedText || "#94a3b8",
        textSubtle: "#64748b",
        border: darkColors?.border || "#1e293b",
        borderSubtle: "#1e293b",
        borderStrong: "#334155",
        primary: colors.primary,
        primaryContrast: colors.primaryContrast || "#ffffff",
        primaryText: colors.primaryLight,
        primaryLight: colors.primaryLight,
        primaryDark: colors.primaryDark,
        secondary: colors.secondary,
        secondaryContrast: "#ffffff",
        accent: colors.accent,
        accentContrast: "#0f172a",
        success: colors.success || "#16a34a",
        warning: "#f59e0b",
        danger: colors.danger || "#dc2626",
        shadowSm: "0 1px 2px 0 rgb(0 0 0 / 0.2)",
        shadowMd: "0 4px 6px -1px rgb(0 0 0 / 0.3)",
        shadowLg: rawConfig.theme?.shadows?.lg || "0 10px 15px -3px rgb(0 0 0 / 0.5)",
        overlay: "rgba(0, 0, 0, 0.75)",
        colorScheme: "dark" as const,
      },
    },
  };

  const cssVariables = themeToCssVariables(themeColors);
  const darkCssVariables = themeToDarkCssVariables(themeColors);

  // Map features to legacy services structure
  const feat = rawConfig.features || DEFAULT_SITE_CONFIG.features;
  const moduleList: WebsiteModuleItem[] = (rawConfig.navigation?.web?.serviceTabs || [])
    .filter((t) => t.enabled !== false)
    .map((t, idx) => ({
      serviceTypeId: idx + 1,
      serviceCode: t.id.toUpperCase(),
      serviceName: t.label,
      route: t.href,
      serviceIcon: t.icon,
      displayOrder: idx + 1,
    }));

  const featureCodes = new Set(
    Object.entries(feat)
      .filter(([_, enabled]) => Boolean(enabled))
      .map(([k]) => k.toUpperCase())
  );

  const services: WebsiteServices = {
    hotels: Boolean(feat.hotels),
    tours: Boolean(feat.tours),
    activities: Boolean(feat.tours),
    packages: Boolean(feat.packages),
    flights: Boolean(feat.flights),
    transfers: Boolean(feat.transfers),
    visa: Boolean(feat.visas),
    restaurants: Boolean(feat.restaurants),
    insurance: Boolean(feat.insurance),
    buildPackage: Boolean(feat.buildPackage),
    carRental: Boolean(feat.rentals),
    moduleList,
    featureCodes,
    fromApi: true,
  };

  const name = rawConfig.site?.name || "Travel Platform";
  const logoLight = rawConfig.assets?.logoLight || rawConfig.assets?.logoUrl || null;
  const logoDark = rawConfig.assets?.logoDark || logoLight;
  const logo = logoLight;
  const favicon = rawConfig.assets?.favicon || null;
  const defaultMode = rawConfig.theme?.defaultMode || "light";
  const footerCopyright =
    `© ${new Date().getFullYear()} ${name}. All Rights Reserved.`;

  const contact = {
    email: rawConfig.content?.contact?.email || "",
    phone: rawConfig.content?.contact?.phone || "",
    address: rawConfig.content?.contact?.address || "",
  };

  const headerLinks: NavLink[] = (rawConfig.navigation?.web?.menuItems || []).map((m, idx) => ({
    label: m.label,
    href: m.href,
    displayOrder: idx + 1,
  }));

  const merged: MergedWebsiteConfig & SiteConfig = {
    ...rawConfig,
    id: siteId,
    name,
    logo,
    logoLight,
    logoDark,
    defaultMode,
    favicon,
    footerCopyright,
    theme: {
      ...rawConfig.theme,
      ...themeColors,
      defaultMode: rawConfig.theme?.defaultMode || "light",
      colors: {
        ...rawConfig.theme.colors,
        ...themeColors,
      },
    },
    cssVariables,
    darkCssVariables,
    typography: {
      ...rawConfig.typography,
      headingFont: rawConfig.typography?.headingFont || "Inter",
      bodyFont: rawConfig.typography?.bodyFont || "Inter",
    },
    contact,
    services,
    headerLinks,
    currencySymbol: rawConfig.site?.currency?.symbol || "₹",
    dynamic: null,
    configSource: "external",
    configError: null,
  };

  return merged;
}

export function mergeWebsiteConfig(
  staticConfig: Record<string, unknown> | null | undefined,
  dynamic: SiteConfigResult | SiteConfig | null
): MergedWebsiteConfig & SiteConfig {
  if (isSiteConfig(dynamic)) {
    return toMergedSiteConfig(dynamic);
  }

  const emptyExternal = !dynamic || isEmptyExternalResult(dynamic as SiteConfigResult);
  const effective = emptyExternal ? null : (dynamic as SiteConfigResult);

  let base: Record<string, unknown> = staticConfig || {};
  if (effective && isPlainObject(effective.websiteConfiguration)) {
    base = deepMerge(base, effective.websiteConfiguration) as Record<string, unknown>;
  }

  const hasWebsite = !!effective?.website && typeof effective.website === "object";
  const siteId = (base.id as string) || "gujjutours";

  const explicitOverrides = {
    light: (effective?.theme as Record<string, unknown>)?.light as Record<string, string> | undefined,
    dark: (effective?.theme as Record<string, unknown>)?.dark as Record<string, string> | undefined,
  };

  const apiTheme = effective
    ? themeFromApiColors(effective.colors, siteId, explicitOverrides)
    : { ...DEFAULT_THEME };

  let theme: ThemeColors;
  if (isPlainObject(base.theme)) {
    theme = {
      ...DEFAULT_THEME,
      ...(base.theme as Partial<ThemeColors>),
      ...apiTheme,
    };
  } else {
    theme = { ...DEFAULT_THEME, ...apiTheme };
  }

  const cssVariables = themeToCssVariables(theme);
  const darkCssVariables = themeToDarkCssVariables(theme);

  const name = hasWebsite
    ? effective!.website?.name ||
      effective!.website?.fullName ||
      (base.name as string) ||
      "Tours"
    : (base.name as string) || "Tours";

  let logoLight: string | null = null;
  if (hasWebsite) {
    const rawLight = (effective!.website as Record<string, unknown>)?.logoLight;
    if (typeof rawLight === "string" && rawLight) {
      logoLight = rawLight;
    } else {
      const resolved =
        resolveLogoFromWebsite(effective!.website, null) ||
        resolveLogoUrl(effective!.website);
      if (resolved && resolved.includes("White-Logo.svg")) {
        logoLight = resolved.replace(
          /darkThemeLogoId\/[a-f0-9-]+_White-Logo\.svg/,
          "headerLogoId/237a7ac1-5310-4d08-8990-5e0e72f048f8_logo.svg"
        );
      } else {
        logoLight = resolved;
      }
    }
  }
  if (!logoLight) {
    logoLight = (base.logoLight as string) || (base.logo as string) || null;
  }

  let logoDark: string | null = null;
  if (hasWebsite) {
    const rawDark = (effective!.website as Record<string, unknown>)?.logoDark;
    if (typeof rawDark === "string" && rawDark) {
      logoDark = rawDark;
    } else {
      const darkPath = (effective!.website as Record<string, unknown>)?.darkThemeLogoPath;
      if (typeof darkPath === "string" && darkPath) {
        const staticBase =
          effective!.website?.staticPath ||
          "https://d3bfv5x1dw8ekm.cloudfront.net/uploads/";
        logoDark = `${staticBase.replace(/\/+$/, "")}/${darkPath.replace(/^\/+/, "")}`;
      }
    }
  }
  if (!logoDark) {
    logoDark = (base.logoDark as string) || logoLight;
  }

  const logo = logoLight;

  const favicon = hasWebsite
    ? resolveLogoFromWebsite(
        {
          ...effective!.website,
          icon:
            effective!.website?.faviconImagePath ||
            effective!.website?.favicon ||
            effective!.website?.icon,
        },
        null
      ) || null
    : null;

  const footerCopyright =
    (typeof effective?.website?.footerCopyright === "string" &&
      effective.website.footerCopyright) ||
    ((base.footer as Record<string, unknown>)?.copyright as string) ||
    `© ${new Date().getFullYear()} ${name}. All rights reserved.`;

  const fontSrc = (dynamic as any)?.font?.family ? (dynamic as any) : effective;
  const typography: Record<string, unknown> = {
    ...((base.typography as Record<string, unknown>) || {}),
    ...(fontSrc?.font?.family
      ? {
          headingFont: fontSrc.font.family,
          bodyFont: fontSrc.font.family,
        }
      : {}),
  };

  let contact: { email?: string; phone?: string; address?: string } =
    (base.contact as { email?: string; phone?: string; address?: string }) || {};

  if (effective?.websiteContact) {
    const emails = Array.isArray(effective.websiteContact.email)
      ? effective.websiteContact.email
      : [];
    const phones = Array.isArray(effective.websiteContact.contact)
      ? effective.websiteContact.contact
      : [];

    const firstEmail = emails.find(
      (e: unknown) =>
        e && typeof e === "object" && typeof (e as { value?: string }).value === "string"
    ) as { value?: string } | undefined;

    const firstPhone = phones.find(
      (c: unknown) =>
        c && typeof c === "object" && typeof (c as { value?: string }).value === "string"
    ) as { value?: string } | undefined;

    contact = {
      ...contact,
      ...(firstEmail?.value ? { email: firstEmail.value } : {}),
      ...(firstPhone?.value ? { phone: firstPhone.value } : {}),
    };
  }

  const defaultMode: "light" | "dark" =
    ((effective?.website as Record<string, unknown>)?.defaultMode as "light" | "dark") ||
    (base.defaultMode as "light" | "dark") ||
    "light";

  const fallbackSiteConfig = DEFAULT_SITE_CONFIG;

  const services = servicesFromConfig(effective);

  return {
    ...fallbackSiteConfig,
    ...base,
    id: siteId,
    name: String(name),
    logo,
    logoLight,
    logoDark,
    defaultMode,
    favicon,
    footerCopyright,
    theme: {
      ...fallbackSiteConfig.theme,
      ...theme,
    },
    cssVariables,
    darkCssVariables,
    typography: {
      ...fallbackSiteConfig.typography,
      ...typography,
    },
    features: {
      ...fallbackSiteConfig.features,
      buildPackage: services.buildPackage,
      hotels: services.hotels,
      tours: services.tours,
      flights: services.flights,
      transfers: services.transfers,
      visas: services.visa,
      restaurants: services.restaurants,
    },
    contact,
    uiTheme: (effective?.theme as Record<string, unknown>) || undefined,
    dynamic: effective || null,
    services,
    headerLinks: headerLinksFromConfig(effective),
    currencySymbol:
      effective?.websiteConfiguration?.currency?.symbol ||
      (base.currencySymbol as string) ||
      "₹",
    configSource: hasWebsite ? "external" : staticConfig ? "static" : "mixed",
    configError: null,
  };
}

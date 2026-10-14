/**
 * lib/mergeWebsiteConfig.ts
 *
 * Merges API configuration with theme defaults into a typed MergedWebsiteConfig.
 * Dynamic data from the API takes 100% precedence for branding, theme colors,
 * fonts, navigation links, services, contact, and copyright.
 */

import type { SiteConfigResult } from "./siteConfig";
import { resolveLogoUrl } from "./siteConfig";
import { resolveLogoFromWebsite } from "./assetResolver";
import {
  themeFromApiColors,
  themeToCssVariables,
  DEFAULT_THEME,
  type ThemeColors,
} from "./themeFromApi";
import { servicesFromConfig, type WebsiteServices } from "./websiteModules";
import { headerLinksFromConfig, type NavLink } from "./websiteLinks";
import { isEmptyExternalResult } from "./externalConfig";

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

export type MergedWebsiteConfig = Record<string, unknown> & {
  id?: string;
  name?: string;
  logo?: string | null;
  favicon?: string | null;
  footerCopyright?: string;
  theme: ThemeColors;
  cssVariables: Record<string, string>;
  typography: Record<string, unknown>;
  contact: { email?: string; phone?: string; address?: string };
  dynamic: SiteConfigResult | null;
  uiTheme?: Record<string, unknown>;
  services: WebsiteServices;
  headerLinks: NavLink[] | null;
  configError?: {
    hostname: string;
    url: string;
    status: number | null;
    message: string;
  } | null;
  configSource?: "external" | "static" | "mixed" | "error";
};

export function mergeWebsiteConfig(
  staticConfig: Record<string, unknown> | null | undefined,
  dynamic: SiteConfigResult | null
): MergedWebsiteConfig {
  const emptyExternal = !dynamic || isEmptyExternalResult(dynamic);
  const effective = emptyExternal ? null : dynamic;

  let base: Record<string, unknown> = staticConfig || {};
  if (effective && isPlainObject(effective.websiteConfiguration)) {
    base = deepMerge(base, effective.websiteConfiguration) as Record<string, unknown>;
  }

  const hasWebsite =
    !!effective?.website && typeof effective.website === "object";

  // Real colors from API
  const apiTheme = effective
    ? themeFromApiColors(effective.colors)
    : { ...DEFAULT_THEME };

  // API theme takes top priority over static theme defaults
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

  // Brand Name strictly from API website object if present
  const name = hasWebsite
    ? effective!.website?.name ||
      effective!.website?.fullName ||
      (base.name as string) ||
      "Tours"
    : (base.name as string) || "Tours";

  // Logo strictly resolved from API website object
  const logo = hasWebsite
    ? resolveLogoFromWebsite(effective!.website, null) ||
      resolveLogoUrl(effective!.website) ||
      (base.logo as string) ||
      null
    : (base.logo as string) || null;

  // Favicon from API
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

  // Footer copyright from API
  const footerCopyright =
    (typeof effective?.website?.footerCopyright === "string" &&
      effective.website.footerCopyright) ||
    ((base.footer as Record<string, unknown>)?.copyright as string) ||
    `© ${new Date().getFullYear()} ${name}. All rights reserved.`;

  // Dynamic font
  const fontSrc = dynamic?.font?.family ? dynamic : effective;
  const typography: Record<string, unknown> = {
    ...((base.typography as Record<string, unknown>) || {}),
    ...(fontSrc?.font?.family
      ? {
          headingFont: fontSrc.font.family,
          bodyFont: fontSrc.font.family,
        }
      : {}),
  };

  // Contact info from API
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

  return {
    ...base,
    id: (base.id as string) || "gujjutours",
    name: String(name),
    logo,
    favicon,
    footerCopyright,
    theme,
    cssVariables,
    typography,
    contact,
    uiTheme: (effective?.theme as Record<string, unknown>) || undefined,
    dynamic: dynamic || null,
    services: servicesFromConfig(effective),
    headerLinks: headerLinksFromConfig(effective),
    configSource: hasWebsite ? "external" : staticConfig ? "static" : "mixed",
    configError: null,
  };
}
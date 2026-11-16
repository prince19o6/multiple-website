/**
 * lib/mergeWebsiteConfig.ts
 *
 * Unified configuration merger for multi-tenant React Native mobile application.
 * Deep-merges SiteConfig schema with legacy adapters to produce a single
 * typed MergedWebsiteConfig & SiteConfig object for all components and screens.
 *
 * Pure TypeScript — zero DOM dependencies.
 */

import type { SiteConfig } from './config/siteConfigSchema';
import { DEFAULT_SITE_CONFIG } from './config/siteConfigSchema';
import type { SiteConfigResult } from './siteConfig';
import { resolveLogoUrl } from './siteConfig';
import { resolveLogoFromWebsite } from './assetResolver';
import {
  themeFromApiColors,
  DEFAULT_THEME,
  type ThemeColors,
} from './themeFromApi';
import { servicesFromConfig, type WebsiteServices, type WebsiteModuleItem } from './websiteModules';
import { headerLinksFromConfig, type NavLink } from './websiteLinks';
import { getContrastRatio, ensureAccessibleTextColor } from './contrast';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
  tagline?: string;
  logo?: string | null;
  logoLight?: string | null;
  logoDark?: string | null;
  defaultMode?: 'light' | 'dark';
  favicon?: string | null;
  footerCopyright?: string;
  theme: ThemeColors & Partial<SiteConfig['theme']>;
  cssVariables: Record<string, string>;
  typography: Record<string, unknown> & Partial<SiteConfig['typography']>;
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
    workingHours?: string;
    [key: string]: any;
  };
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
  configSource?: 'external' | 'static' | 'mixed' | 'error';
};

/** True when the external config result is empty / useless. */
function isEmptyExternalResult(r: SiteConfigResult): boolean {
  return !r.website && !r.colors && !r.font && !r.websiteConfiguration;
}

/**
 * Checks if input matches the typed SiteConfig contract structure.
 */
export function isSiteConfig(obj: unknown): obj is SiteConfig {
  if (!obj || typeof obj !== 'object') return false;
  const c = obj as Record<string, unknown>;
  return Boolean(
    c.site &&
    typeof c.site === 'object' &&
    c.theme &&
    typeof c.theme === 'object' &&
    c.features &&
    typeof c.features === 'object'
  );
}

/**
 * Converts a typed SiteConfig into a unified MergedSiteConfig with
 * backward-compatible aliases for all React Native UI components.
 */
export function toMergedSiteConfig(
  input: SiteConfig | MergedWebsiteConfig | unknown
): MergedWebsiteConfig & SiteConfig {
  if (isSiteConfig(input) && (input as any).services && (input as any).theme?.primary) {
    return input as MergedWebsiteConfig & SiteConfig;
  }

  const rawConfig: SiteConfig = isSiteConfig(input)
    ? input
    : (DEFAULT_SITE_CONFIG as SiteConfig);

  const siteId = rawConfig.site?.id || 'gujjutours';
  const colors = rawConfig.theme?.colors || DEFAULT_SITE_CONFIG.theme.colors;
  const darkColors = rawConfig.theme?.darkColors || DEFAULT_SITE_CONFIG.theme.darkColors;

  // WCAG AA contrast check against white background (#ffffff)
  let primaryText = colors.primaryText || colors.primaryDark || colors.primary;
  const primaryContrastRatio = getContrastRatio(colors.primary, '#ffffff');
  if (primaryContrastRatio < 4.5) {
    primaryText = ensureAccessibleTextColor(colors.primary, '#ffffff', siteId).accessibleHex;
  }

  const themeColors: ThemeColors = {
    primary: colors.primary,
    primaryDark: colors.primaryDark,
    primaryLight: colors.primaryLight,
    primaryContrast: colors.primaryContrast || '#ffffff',
    primaryText,
    secondary: colors.secondary,
    accent: colors.accent,
    background: colors.background || '#ffffff',
    surface: colors.surface || '#ffffff',
    surface2: colors.surface2 || '#f8fafc',
    text: colors.text || '#0f172a',
    heading: colors.heading || '#0f172a',
    mutedText: colors.mutedText || '#64748b',
    border: colors.border || '#e2e8f0',
    cardBg: colors.surface || '#ffffff',
    footerBg: colors.footerBg || '#0f172a',
    footerText: colors.footerText || '#f8fafc',
    success: colors.success || '#10b981',
    danger: colors.danger || '#ef4444',
  };

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

  const name = rawConfig.site?.name || 'Travel Platform';
  const logoLight = rawConfig.assets?.logoLight || rawConfig.assets?.logoUrl || null;
  const logoDark = rawConfig.assets?.logoDark || logoLight;
  const logo = logoLight;
  const favicon = rawConfig.assets?.favicon || null;
  const defaultMode = rawConfig.theme?.defaultMode || 'light';
  const footerCopyright = `© ${new Date().getFullYear()} ${name}. All Rights Reserved.`;

  const contact = {
    email: rawConfig.content?.contact?.email || '',
    phone: rawConfig.content?.contact?.phone || '',
    address: rawConfig.content?.contact?.address || '',
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
    tagline: rawConfig.site?.tagline || '',
    logo,
    logoLight,
    logoDark,
    defaultMode,
    favicon,
    footerCopyright,
    theme: {
      ...rawConfig.theme,
      ...themeColors,
      defaultMode: rawConfig.theme?.defaultMode || 'light',
      colors: {
        ...rawConfig.theme.colors,
        ...themeColors,
      },
    },
    cssVariables: {},
    typography: {
      ...rawConfig.typography,
      headingFont: rawConfig.typography?.headingFont || 'Poppins',
      bodyFont: rawConfig.typography?.bodyFont || 'Poppins',
    },
    contact,
    services,
    headerLinks,
    dynamic: null,
    configSource: 'external',
    configError: null,
  };

  return merged;
}

/**
 * Merge static + dynamic config into a single object every component reads.
 */
export function mergeWebsiteConfig(
  staticConfig: any,
  dynamic: SiteConfigResult | SiteConfig | null
): MergedWebsiteConfig & SiteConfig {
  if (isSiteConfig(dynamic)) {
    return toMergedSiteConfig(dynamic);
  }

  const emptyExternal = !dynamic || isEmptyExternalResult(dynamic as SiteConfigResult);
  const effective = emptyExternal ? null : (dynamic as SiteConfigResult);

  let base: any = staticConfig || {};
  if (effective && isPlainObject(effective.websiteConfiguration)) {
    base = deepMerge(base, effective.websiteConfiguration);
  }

  const hasWebsite = !!effective?.website && typeof effective.website === 'object';
  const siteId = (base.id as string) || 'gujjutours';

  const apiTheme = effective
    ? themeFromApiColors(effective.colors, siteId)
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

  const name = hasWebsite
    ? effective!.website?.name ||
      effective!.website?.fullName ||
      (base.name as string) ||
      'Tours'
    : (base.name as string) || 'Tours';

  let logoLight: string | null = null;
  if (hasWebsite) {
    const rawLight = (effective!.website as Record<string, unknown>)?.logoLight;
    if (typeof rawLight === 'string' && rawLight) {
      logoLight = rawLight;
    } else {
      logoLight =
        resolveLogoFromWebsite(effective!.website, null) ||
        resolveLogoUrl(effective!.website);
    }
  }
  if (!logoLight) {
    logoLight = (base.logoLight as string) || (base.logo as string) || null;
  }

  let logoDark: string | null = null;
  if (hasWebsite) {
    const rawDark = (effective!.website as Record<string, unknown>)?.logoDark;
    if (typeof rawDark === 'string' && rawDark) {
      logoDark = rawDark;
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

  const defaultMode: 'light' | 'dark' =
    ((effective?.website as Record<string, unknown>)?.defaultMode as 'light' | 'dark') ||
    (base.defaultMode as 'light' | 'dark') ||
    'light';

  const fallbackSiteConfig = DEFAULT_SITE_CONFIG;

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
    footerCopyright: `© ${new Date().getFullYear()} ${name}. All Rights Reserved.`,
    theme: {
      ...fallbackSiteConfig.theme,
      ...theme,
    },
    cssVariables: {},
    typography: {
      ...fallbackSiteConfig.typography,
      headingFont: (effective as any)?.font?.family || 'Poppins',
      bodyFont: (effective as any)?.font?.family || 'Poppins',
    },
    contact: {
      email: '',
      phone: '',
      address: '',
    },
    uiTheme: (effective?.theme as Record<string, unknown>) || undefined,
    dynamic: effective || null,
    services: servicesFromConfig(effective),
    headerLinks: headerLinksFromConfig(effective),
    configSource: hasWebsite ? 'external' : staticConfig ? 'static' : 'mixed',
    configError: null,
  };
}

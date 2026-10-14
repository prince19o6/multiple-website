/**
 * lib/mergeWebsiteConfig.ts
 *
 * Ported verbatim from web/lib/mergeWebsiteConfig.ts.
 * Deep-merges static site config with dynamic API data to produce
 * the single MergedWebsiteConfig object every component consumes.
 *
 * Zero web dependencies — pure TypeScript. Works identically in RN.
 */

import type { SiteConfigResult } from './siteConfig';
import { resolveLogoUrl } from './siteConfig';
import { resolveLogoFromWebsite } from './assetResolver';
import {
  themeFromApiColors,
  DEFAULT_THEME,
  type ThemeColors,
} from './themeFromApi';
import { servicesFromConfig, type WebsiteServices } from './websiteModules';
import { headerLinksFromConfig, type NavLink } from './websiteLinks';

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

export type MergedWebsiteConfig = Record<string, unknown> & {
  id?: string;
  name?: string;
  tagline?: string;
  logo?: string | null;
  footer?: {
    showLogo?: boolean;
    showDescription?: boolean;
    description?: string;
    showQuickLinks?: boolean;
    showContact?: boolean;
    showSocialLinks?: boolean;
    showNewsletter?: boolean;
    newsletterTitle?: string;
    copyright?: string;
    [key: string]: any;
  };
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
    workingHours?: string;
    [key: string]: any;
  };
  theme: ThemeColors;
  /** RN: not CSS variables — kept for API surface compatibility only */
  cssVariables: Record<string, string>;
  typography: Record<string, unknown>;
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
 * Merge static + dynamic config into a single object every component reads.
 * Order of precedence: staticConfig.theme > apiTheme > DEFAULT_THEME.
 */
export function mergeWebsiteConfig(
  staticConfig: any,
  dynamic: SiteConfigResult | null
): MergedWebsiteConfig {
  const emptyExternal = !dynamic || isEmptyExternalResult(dynamic);
  const effective = emptyExternal ? null : dynamic;

  let base: any = staticConfig || {};
  if (effective && isPlainObject(effective.websiteConfiguration)) {
    base = deepMerge(base, effective.websiteConfiguration);
  }

  const hasWebsite = !!effective?.website && typeof effective.website === 'object';

  const apiTheme = effective
    ? themeFromApiColors(effective.colors)
    : { ...DEFAULT_THEME };

  // Dynamic API theme takes top precedence over static defaults
  let theme: ThemeColors;
  if (isPlainObject(base.theme)) {
    theme = { ...DEFAULT_THEME, ...(base.theme as Partial<ThemeColors>), ...apiTheme };
  } else {
    theme = { ...DEFAULT_THEME, ...apiTheme };
  }

  // In the app cssVariables is unused (no CSS), but we keep the field so
  // any shared lib code that references it doesn't crash.
  const cssVariables: Record<string, string> = {};

  const name = hasWebsite
    ? effective!.website?.name ||
      effective!.website?.fullName ||
      base.name ||
      'Tours'
    : base.name || 'Tours';

  const logo = hasWebsite
    ? resolveLogoFromWebsite(effective!.website, null) ||
      resolveLogoUrl(effective!.website) ||
      base.logo ||
      null
    : base.logo || null;

  const fontSrc = dynamic?.font?.family ? dynamic : effective;
  const typography: Record<string, unknown> = {
    ...(base.typography || {}),
    ...(fontSrc?.font?.family
      ? {
          headingFont: fontSrc.font.family,
          bodyFont: fontSrc.font.family,
        }
      : {}),
  };

  let contact = base.contact || {};
  if (effective?.websiteContact) {
    const emails = effective.websiteContact.email || [];
    const phones = effective.websiteContact.contact || [];
    const firstEmail = (emails as any[]).find(
      (e: any) => e && typeof e.value === 'string'
    ) as { value?: string } | undefined;
    const firstPhone = (phones as any[]).find(
      (c: any) => c && typeof c.value === 'string'
    ) as { value?: string } | undefined;
    contact = {
      ...contact,
      ...(firstEmail?.value ? { email: firstEmail.value } : {}),
      ...(firstPhone?.value ? { phone: firstPhone.value } : {}),
    };
  }

  return {
    ...base,
    id: base.id,
    name: String(name),
    logo,
    theme,
    cssVariables,
    typography,
    contact,
    uiTheme: effective?.theme || undefined,
    dynamic: dynamic || null,
    services: servicesFromConfig(effective),
    headerLinks: headerLinksFromConfig(effective),
    configSource: hasWebsite ? 'external' : staticConfig ? 'static' : 'mixed',
    configError: null,
  };
}

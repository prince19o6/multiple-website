/**
 * types/siteConfig.ts
 *
 * TypeScript types for the multi-tenant site configuration and dynamic branding.
 * Based on the live JSON schema returned by:
 * {API_BASE}/api/core/v1/config/{HOSTNAME}?lang=en
 */

import type { SiteDefinition, SiteId } from '@/src/config/sites';

// ─── Real Config API Response Shape ──────────────────────────────────────────

export interface RawApiColorShades {
  [shade: string]: string | undefined;
}

export interface RawApiColors {
  primary?: RawApiColorShades | string;
  secondary?: RawApiColorShades | string;
  neutral?: RawApiColorShades | string;
  footerbgcolor?: RawApiColorShades | string;
  footertextcolor?: RawApiColorShades | string;
  [key: string]: RawApiColorShades | string | undefined;
}

export interface RawApiFontFile {
  url: string;
  weight?: number;
}

export interface RawApiFont {
  family?: string;
  files?: RawApiFontFile[];
}

export interface RawApiContactItem {
  type?: number;
  name?: string;
  value?: string;
}

export interface RawApiEmailItem {
  type?: number;
  name?: string;
  value?: string;
}

export interface RawApiWebsiteContact {
  contact?: RawApiContactItem[];
  email?: RawApiEmailItem[];
}

export interface RawApiLinkItem {
  type?: number;
  name: string;
  reference: string;
  displayOrder?: number;
  websiteContent?: {
    id?: number;
    name?: string;
  };
}

export interface RawApiWebsiteLinks {
  headerType?: RawApiLinkItem[];
  footerTypes?: RawApiLinkItem[];
}

export interface RawApiWebsiteInfo {
  id?: number | string;
  name?: string;
  fullName?: string;
  address?: string | null;
  fullAddress?: string | null;
  subUrb?: string | null;
  postCode?: string | null;
  iconName?: string | null;
  icon?: string | null;
  faviconName?: string | null;
  favicon?: string | null;
  faviconImagePath?: string | null;
  darkThemeLogoPath?: string | null;
  footerCopyright?: string | null;
  tenantId?: string;
  staticPath?: string;
  serviceImageCdnPath?: string;
  siteType?: string;
  timeZone?: string;
}

export interface RawApiCurrency {
  id?: number;
  name?: string;
  code?: string;
  symbol?: string | null;
}

export interface RawApiWebsiteConfiguration {
  decimalPlaces?: number;
  updateROE?: number;
  bookingReferencePrefix?: string | null;
  bookingReferenceSufix?: string | null;
  isRecentSearchAllowed?: boolean;
  currency?: RawApiCurrency;
  language?: {
    id?: number;
    name?: string;
    code?: string;
  };
}

export interface RawApiSocialMediaItem {
  title?: string;
  url?: string;
  icon?: string;
}

export interface RawApiRecommendation {
  isEnabled?: number | boolean;
  favService?: string;
}

export interface RawConfigResponse {
  result?: {
    website?: RawApiWebsiteInfo;
    colors?: RawApiColors;
    font?: RawApiFont;
    theme?: Record<string, string>;
    websiteContact?: RawApiWebsiteContact;
    websiteLinks?: RawApiWebsiteLinks;
    websiteConfiguration?: RawApiWebsiteConfiguration;
    recommendations?: RawApiRecommendation[];
    socialMediaConfig?: RawApiSocialMediaItem[];
    websiteRights?: Array<{ feature: string; featureCode: string }>;
  };
  isSuccess?: boolean;
  error?: string | null;
}

// ─── Normalized Application Theme Tokens ──────────────────────────────────────

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
  cardBg: string;
  primaryScale?: RawApiColorShades;
  secondaryScale?: RawApiColorShades;
  neutralScale?: RawApiColorShades;
}

export interface Theme {
  colors: ThemeColors;
  isDark: boolean;
  typography: {
    headingFont: string;
    bodyFont: string;
  };
  radius: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  shadows: {
    none: object;
    sm: object;
    md: object;
    lg: object;
  };
}

// ─── Normalized SiteConfig ───────────────────────────────────────────────────

export interface SiteConfig {
  siteId: SiteId;
  name: string;
  fullName: string;
  tagline: string;
  hostname: string;
  apiBaseUrl: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  theme: ThemeColors;
  typography: {
    headingFont: string;
    bodyFont: string;
  };
  contact: {
    phones: string[];
    emails: string[];
    phone: string;
    email: string;
    address?: string;
  };
  socialLinks: Array<{ platform: string; url: string }>;
  headerLinks: Array<{ name: string; reference: string; displayOrder: number }>;
  footerLinks: Array<{ name: string; reference: string; displayOrder: number }>;
  enabledSections: string[];
  copyright: string;
  currency: {
    code: string;
    symbol: string;
    name: string;
    decimalPlaces: number;
  };
  raw: any;
}

// ─── Normalization Helper ─────────────────────────────────────────────────────

const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;
const RGB_COLOR_REGEX = /^rgb(a)?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(\s*,\s*[\d.]+\s*)?\)$/;

export function isValidColor(val: unknown): val is string {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  return HEX_COLOR_REGEX.test(trimmed) || RGB_COLOR_REGEX.test(trimmed);
}

function resolveColor(val: unknown, fallback: string): string {
  return isValidColor(val) ? val.trim() : fallback;
}

function pickShade(
  source: RawApiColorShades | string | undefined,
  preferredShades: string[],
  fallback: string
): string {
  if (!source) return fallback;
  if (typeof source === 'string') return resolveColor(source, fallback);
  for (const shade of preferredShades) {
    const candidate = source[shade];
    if (isValidColor(candidate)) return candidate.trim();
  }
  for (const candidate of Object.values(source)) {
    if (isValidColor(candidate)) return candidate.trim();
  }
  return fallback;
}

/**
 * Normalizes live Config API payload into a reliable, typed SiteConfig model.
 */
export function normalizeSiteConfig(raw: any, site: SiteDefinition): SiteConfig {
  const result = raw?.result ?? raw ?? {};
  const website = result?.website ?? {};
  const colors = result?.colors ?? {};
  const font = result?.font ?? {};
  const contact = result?.websiteContact ?? {};
  const links = result?.websiteLinks ?? {};
  const configuration = result?.websiteConfiguration ?? {};

  // 1. Resolve Brand Colors
  const fallbackPrimary = site.fallbackAccentColor || '#2563eb';
  const primary = pickShade(colors.primary, ['600', '700', '500', '800'], fallbackPrimary);
  const primaryDark = pickShade(colors.primary, ['800', '900', '700'], '#1d4ed8');
  const primaryLight = pickShade(colors.primary, ['100', '50', '200'], '#dbeafe');
  const accent = pickShade(colors.secondary, ['500', '600', '400', '700'], '#f59e0b');
  const secondary = pickShade(colors.neutral, ['900', '800', '700'], '#0f172a');
  const background = pickShade(colors.neutral, ['50', '100'], '#f8fafc');
  const surface = pickShade(colors.neutral, ['50'], '#ffffff');
  const text = pickShade(colors.neutral, ['900', '800'], '#111827');
  const heading = pickShade(colors.neutral, ['900', '800'], '#0f172a');
  const mutedText = pickShade(colors.neutral, ['500', '600', '400'], '#64748b');
  const border = pickShade(colors.neutral, ['200', '300'], '#e2e8f0');
  const footerBg = pickShade(colors.footerbgcolor, ['800', '900'], '#0f172a');
  const footerText = pickShade(colors.footertextcolor, ['800', '900'], '#f8fafc');

  const themeColors: ThemeColors = {
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
    success: '#16a34a',
    danger: '#dc2626',
    footerBg,
    footerText,
    cardBg: surface,
    primaryScale: typeof colors.primary === 'object' ? colors.primary : undefined,
    secondaryScale: typeof colors.secondary === 'object' ? colors.secondary : undefined,
    neutralScale: typeof colors.neutral === 'object' ? colors.neutral : undefined,
  };

  // 2. Resolve Logos against CDN static path or API base
  const staticPath = (website.staticPath || '').trim();
  let logoUrl: string | null = null;
  const rawLogo = website.icon || website.faviconImagePath;
  if (rawLogo) {
    if (rawLogo.startsWith('http://') || rawLogo.startsWith('https://')) {
      logoUrl = rawLogo;
    } else if (staticPath) {
      logoUrl = `${staticPath.replace(/\/+$/, '')}/${rawLogo.replace(/^\/+/, '')}`;
    } else {
      logoUrl = `${site.apiBaseUrl.replace(/\/+$/, '')}/${rawLogo.replace(/^\/+/, '')}`;
    }
  }

  let faviconUrl: string | null = null;
  const rawFav = website.favicon;
  if (rawFav) {
    if (rawFav.startsWith('http')) {
      faviconUrl = rawFav;
    } else if (staticPath) {
      faviconUrl = `${staticPath.replace(/\/+$/, '')}/${rawFav.replace(/^\/+/, '')}`;
    }
  }

  // 3. Resolve Contact Details
  const contactList = Array.isArray(contact.contact) ? contact.contact : [];
  const emailList = Array.isArray(contact.email) ? contact.email : [];
  const phones = contactList.map((c: any) => String(c.value || '')).filter(Boolean);
  const emails = emailList.map((e: any) => String(e.value || '')).filter(Boolean);

  // 4. Resolve Navigation Links
  const headerLinks = (links.headerType || []).map((l: any, idx: number) => ({
    name: l.name || 'Link',
    reference: l.reference || '#',
    displayOrder: Number(l.displayOrder) || idx + 1,
  }));

  const footerLinks = (links.footerTypes || []).map((l: any, idx: number) => ({
    name: l.name || 'Link',
    reference: l.reference || '#',
    displayOrder: Number(l.displayOrder) || idx + 1,
  }));

  // 5. Currency
  const cur = configuration.currency || {};
  const currency = {
    code: cur.code || site.currencyDefault.code,
    symbol: cur.symbol || site.currencyDefault.symbol,
    name: cur.name || site.currencyDefault.code,
    decimalPlaces: Number(configuration.decimalPlaces) || 2,
  };

  const name = website.name || site.name;
  const fullName = website.fullName || name;

  return {
    siteId: site.id,
    name,
    fullName,
    tagline: 'Your Gateway to Extraordinary Adventures',
    hostname: site.hostname,
    apiBaseUrl: site.apiBaseUrl,
    logoUrl,
    faviconUrl,
    theme: themeColors,
    typography: {
      headingFont: font.family || 'Poppins',
      bodyFont: font.family || 'Poppins',
    },
    contact: {
      phones,
      emails,
      phone: phones[0] || '+91 9875095616',
      email: emails[0] || 'support@travelplatform.com',
      address: website.fullAddress || website.subUrb || undefined,
    },
    socialLinks: (result.socialMediaConfig || []).map((s: any) => ({
      platform: s.title || 'social',
      url: s.url || '',
    })),
    headerLinks,
    footerLinks,
    enabledSections: ['hero', 'categories', 'featuredTours', 'destinations', 'offers'],
    copyright: website.footerCopyright || `© 2026 ${name}. All Rights Reserved`,
    currency,
    raw,
  };
}

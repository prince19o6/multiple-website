/**
 * lib/siteConfig.ts
 *
 * Site configuration types, helpers, and fetcher.
 * Delegates all network calls to the unified API client (lib/api.ts).
 */

import { fetchConfig } from './api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiFont {
  family: string;
  files: Array<{ url: string; weight: number }>;
}

export interface ApiWebsite {
  id?: string | number;
  name?: string;
  fullName?: string;
  logoUrl?: string;
  icon?: string;
  favicon?: string;
  faviconImagePath?: string;
  staticPath?: string;
  serviceImageCdnPath?: string;
  footerCopyright?: string;
  [key: string]: unknown;
}

export interface SiteConfigResult {
  recommendations: Array<{ isEnabled: number; favService: string }>;
  theme: Record<string, unknown>;
  websiteConfiguration: unknown | null;
  websiteContact: { contact: unknown[]; email: unknown[] };
  websiteLaunguage: unknown[];
  websiteLinks: { headerType: unknown[]; footerTypes: unknown[] };
  font: ApiFont | null;
  colors: import('./themeFromApi').ApiColors;
  websiteRights: unknown[];
  website: ApiWebsite | null;
  websiteModules: unknown[];
  websiteExtra: { social: unknown[]; cardInfo: unknown[] };
  socialMediaScript: unknown[];
  websiteCurrency: unknown[];
  socialMediaConfig: unknown[];
  geo: { country: string | null; city: string | null; ip: string | null };
}

export interface SiteConfigResponse {
  result: SiteConfigResult | null;
  error: string | null;
  isSuccess: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip protocol, path, port, trailing dots; lowercase. */
export function normalizeHostname(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  let h = raw.trim().toLowerCase();
  if (h.startsWith('https://')) h = h.slice(8);
  if (h.startsWith('http://')) h = h.slice(7);
  const slash = h.indexOf('/');
  if (slash >= 0) h = h.slice(0, slash);
  const colon = h.indexOf(':');
  if (colon >= 0) h = h.slice(0, colon);
  return h.replace(/\.+$/, '').trim();
}

/** Resolve the logo URL from the website object. */
export function resolveLogoUrl(website: ApiWebsite | null | undefined): string | null {
  if (!website) return null;
  if (website.logoUrl && typeof website.logoUrl === 'string' && website.logoUrl.trim()) {
    return website.logoUrl.trim();
  }
  const path =
    (typeof website.faviconImagePath === 'string' && website.faviconImagePath) ||
    (typeof website.icon === 'string' && website.icon) ||
    null;
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const base =
    (typeof website.staticPath === 'string' && website.staticPath) ||
    (typeof website.serviceImageCdnPath === 'string' &&
      `${website.serviceImageCdnPath}/uploads/`) ||
    '';
  if (!base) return path;
  return `${base.replace(/\/?$/, '/')}${path.replace(/^\//, '')}`;
}

// ─── Fetcher ──────────────────────────────────────────────────────────────────

export interface FetchSiteConfigOptions {
  lang?: string;
  timeoutMs?: number;
}

/**
 * Fetch the site config from the API for the given hostname.
 * Routes directly through the single unified API client.
 */
export async function fetchSiteConfig(
  hostname: string,
  _siteId?: string,
  options: FetchSiteConfigOptions = {}
): Promise<SiteConfigResult> {
  const { lang = 'en' } = options;
  const normalized = normalizeHostname(hostname);
  if (!normalized) {
    throw new Error(`[siteConfig] Empty hostname after normalization: "${hostname}"`);
  }

  return fetchConfig(normalized, lang);
}

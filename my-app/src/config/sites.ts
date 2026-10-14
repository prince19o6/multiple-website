/**
 * src/config/sites.ts
 *
 * Single source of truth for all multi-tenant websites in the travel platform.
 * Adding a new website = adding one entry to SITES.
 * Active site is determined by the central ENV configuration.
 */

import { ENV } from './env';

export type BrandSiteId = 'gujjutours' | 'tripgoasia' | 'technoheaven';
export type LegacySiteId = 'website1' | 'website2' | 'website3';
export type SiteId = BrandSiteId | LegacySiteId;

export const LEGACY_TO_BRAND: Record<LegacySiteId, BrandSiteId> = {
  website1: 'gujjutours',
  website2: 'tripgoasia',
  website3: 'technoheaven',
};

export const BRAND_TO_LEGACY: Record<BrandSiteId, LegacySiteId> = {
  gujjutours: 'website1',
  tripgoasia: 'website2',
  technoheaven: 'website3',
};

export interface SiteDefinition {
  readonly id: BrandSiteId;
  readonly legacyId: LegacySiteId;
  readonly name: string;
  readonly hostname: string;
  readonly apiBaseUrl: string;
  readonly aliases: readonly string[];
  readonly fallbackAccentColor: string;
  readonly currencyDefault: {
    readonly code: string;
    readonly symbol: string;
  };
}

export const SITES: readonly SiteDefinition[] = [
  {
    id: 'gujjutours',
    legacyId: 'website1',
    name: 'Gujju Tours',
    hostname: 'www.gujjutours.com',
    apiBaseUrl: 'https://stagingapi.gujjutours.com',
    aliases: [
      'www.gujjutours.com',
      'gujjutours.com',
      'b2b.gujjutours.com',
      'travelexplorer.com',
      'www.travelexplorer.com',
      'website1',
    ],
    fallbackAccentColor: '#2563eb',
    currencyDefault: {
      code: 'USD',
      symbol: '$',
    },
  },
  {
    id: 'tripgoasia',
    legacyId: 'website2',
    name: 'TripGo Asia',
    hostname: 'www.tripgoasia.com',
    apiBaseUrl: 'https://stagingapi.tripgoasia.com',
    aliases: [
      'www.tripgoasia.com',
      'tripgoasia.com',
      'adventureworld.com',
      'www.adventureworld.com',
      'website2',
    ],
    fallbackAccentColor: '#16a34a',
    currencyDefault: {
      code: 'USD',
      symbol: '$',
    },
  },
  {
    id: 'technoheaven',
    legacyId: 'website3',
    name: 'Technoheaven',
    hostname: 'stagingb2b.technoheaven.com',
    apiBaseUrl: 'https://stagingapi.technoheaven.com',
    aliases: [
      'stagingb2b.technoheaven.com',
      'technoheaven.com',
      'www.technoheaven.com',
      'holidayparadise.com',
      'www.holidayparadise.com',
      'website3',
    ],
    fallbackAccentColor: '#dc2626',
    currencyDefault: {
      code: 'USD',
      symbol: '$',
    },
  },
] as const;

export const DEFAULT_SITE_ID: BrandSiteId = 'gujjutours';

/**
 * Normalizes a raw hostname string by trimming protocol, port, and trailing slashes.
 */
export function normalizeHostname(raw: string): string {
  if (!raw) return '';
  let h = raw.trim().toLowerCase();
  h = h.replace(/^https?:\/\//, '');
  h = h.split('/')[0];
  h = h.replace(/:\d+$/, '');
  return h.replace(/\.$/, '');
}

/**
 * Strict allowlist check: returns the site if found, otherwise throws.
 */
export function getSiteById(id: string): SiteDefinition {
  const brandId = (LEGACY_TO_BRAND as Record<string, BrandSiteId>)[id] || id;
  const found = SITES.find((s) => s.id === brandId || s.legacyId === id);
  if (!found) {
    throw new Error(
      `[sites.ts] Unknown site id "${id}". Allowed ids: ${SITES.map((s) => s.id).join(', ')}`
    );
  }
  return found;
}

/**
 * Resolves a hostname or alias against the strict allowlist.
 * Returns null for unknown hostnames.
 */
export function getSiteByHostname(hostname: string): SiteDefinition | null {
  const normalized = normalizeHostname(hostname);
  if (!normalized) return null;

  for (const site of SITES) {
    if (site.hostname.toLowerCase() === normalized) return site;
    if (site.aliases.some((a) => a.toLowerCase() === normalized)) return site;
  }
  return null;
}

export function isAllowedSiteId(id: string): id is SiteId {
  return SITES.some((s) => s.id === id || s.legacyId === id);
}

export function isAllowedHostname(hostname: string): boolean {
  return getSiteByHostname(hostname) !== null;
}

/**
 * Universal site resolver: accepts site id (brand or legacy) or hostname alias.
 */
export function resolveSite(siteOrIdOrHost?: string | null): SiteDefinition {
  if (!siteOrIdOrHost) return getActiveSite();
  const byHost = getSiteByHostname(siteOrIdOrHost);
  if (byHost) return byHost;
  try {
    return getSiteById(siteOrIdOrHost);
  } catch {
    return getActiveSite();
  }
}

// ─── Active Site Holder (Initialized from ENV) ───────────────────────────────

let currentActiveSite: SiteDefinition = resolveInitialActiveSite();

function resolveInitialActiveSite(): SiteDefinition {
  const target = ENV.siteId || ENV.siteHostname;
  if (target) {
    const byHost = getSiteByHostname(target);
    if (byHost) return byHost;
    try {
      return getSiteById(target);
    } catch {
      // Fall through to default
    }
  }
  return SITES[0];
}

export function getActiveSite(): SiteDefinition {
  return currentActiveSite;
}

export function setActiveSite(siteOrId: SiteDefinition | SiteId): void {
  if (typeof siteOrId === 'string') {
    currentActiveSite = getSiteById(siteOrId);
  } else {
    currentActiveSite = siteOrId;
  }
}

/**
 * constants/siteRegistry.ts
 *
 * THE single source of truth for all supported websites.
 * Adding a new site = adding one row here. Nothing else changes.
 *
 * Maps to web/lib/hostnameRegistry.ts (allowlist) +
 *         web/lib/siteConfig.ts (SITE_ID_TO_HOSTNAME)
 *
 * All environment variable access is strictly centralized in src/config/env.ts.
 */

import { ENV } from '@/src/config/env';

export type WebsiteId = 'website1' | 'website2' | 'website3';
export type AllowedBrand = 'gujjutours' | 'tripgoasia' | 'technoheaven';
export type DataSourceId = 'gujjutourdata' | 'tripgoasia' | 'technoheaven' | (string & {});

/** One entry per supported website. */
export interface SiteEntry {
  /** Stable internal ID — used as cache key, AsyncStorage key, route param. */
  id: WebsiteId;
  /** Human-readable display name. */
  name: string;
  /** Alias for display name used across UI components. */
  label: string;
  /** Short tagline. */
  tagline: string;
  /** Brand identifier — matches web allowlist. */
  brand: AllowedBrand;
  /** Canonical hostname to send to the config API. */
  hostname: string;
  /** Logical data-source name (used for logging / debugging). */
  dataSource: DataSourceId;
  /** Base URL for this site's external config API. */
  apiUrl: string;
  /** Accent color. */
  accentColor: string;
  /** Primary brand color. */
  primaryColor: string;
  /** Hero preview image. */
  heroImage: string;
  /** Visual theme label. */
  themeName: string;
  /** Emoji or icon label used in UI. */
  icon: string;
}

const GUJJUTOURS_API =
  ENV.siteId === 'gujjutours' ? ENV.configApiUrl : 'https://stagingapi.gujjutours.com';
const TRIPGOASIA_API =
  ENV.siteId === 'tripgoasia' ? ENV.configApiUrl : 'https://stagingapi.tripgoasia.com';
const TECHNOHEAVEN_API =
  ENV.siteId === 'technoheaven' ? ENV.configApiUrl : 'https://stagingapi.technoheaven.com';

export const ALLOWED_SITE_IDS: WebsiteId[] = ['website1', 'website2', 'website3'];

export const SITE_REGISTRY: SiteEntry[] = [
  {
    id: 'website1',
    name: 'Gujju Tours',
    label: 'Gujju Tours',
    tagline: 'Travel Beyond Boundaries',
    brand: 'gujjutours',
    hostname: 'www.gujjutours.com',
    dataSource: 'gujjutourdata',
    apiUrl: GUJJUTOURS_API,
    accentColor: '#2563eb',
    primaryColor: '#2563eb',
    heroImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=500&fit=crop',
    themeName: 'Modern Travel',
    icon: '✈️',
  },
  {
    id: 'website2',
    name: 'TripGo Asia',
    label: 'TripGo Asia',
    tagline: 'Adventure Starts Here',
    brand: 'tripgoasia',
    hostname: 'www.tripgoasia.com',
    dataSource: 'tripgoasia',
    apiUrl: TRIPGOASIA_API,
    accentColor: '#16a34a',
    primaryColor: '#16a34a',
    heroImage: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=500&fit=crop',
    themeName: 'Adventure Green',
    icon: '🏔️',
  },
  {
    id: 'website3',
    name: 'Technoheaven',
    label: 'Technoheaven',
    tagline: 'Next-Gen Travel Technology',
    brand: 'technoheaven',
    hostname: 'stagingb2b.technoheaven.com',
    dataSource: 'technoheaven',
    apiUrl: TECHNOHEAVEN_API,
    accentColor: '#dc2626',
    primaryColor: '#dc2626',
    heroImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=500&fit=crop',
    themeName: 'Luxury Escapes',
    icon: '🌴',
  },
];

const REGISTRY_MAP = new Map<string, SiteEntry>(
  SITE_REGISTRY.map((s) => [s.id, s])
);

export const SITE_REGISTRY_MAP: Record<string, SiteEntry> = {
  website1: SITE_REGISTRY[0],
  website2: SITE_REGISTRY[1],
  website3: SITE_REGISTRY[2],
};

/** Returns the SiteEntry for a given id, or fallback default if unknown/undefined. */
export function getSiteEntry(id: string | undefined | null): SiteEntry {
  if (!id) return SITE_REGISTRY[0];
  if (id === 'gujjutours') return SITE_REGISTRY[0];
  if (id === 'tripgoasia') return SITE_REGISTRY[1];
  if (id === 'technoheaven') return SITE_REGISTRY[2];
  return REGISTRY_MAP.get(id) ?? SITE_REGISTRY[0];
}

/** Returns the canonical hostname for an id (for config API calls). */
export function getHostnameForSite(id: string): string | null {
  return getSiteEntry(id)?.hostname ?? null;
}

/** True only if id is one of the three registered brands. */
export function isAllowedSite(id: string): boolean {
  return REGISTRY_MAP.has(id) || id === 'gujjutours' || id === 'tripgoasia' || id === 'technoheaven';
}

/** The default site resolved from ENV. */
function resolveDefaultSiteId(): WebsiteId {
  if (ENV.siteId === 'tripgoasia' || ENV.siteId === 'website2') return 'website2';
  if (ENV.siteId === 'technoheaven' || ENV.siteId === 'website3') return 'website3';
  return 'website1';
}

export const DEFAULT_SITE_ID: WebsiteId = resolveDefaultSiteId();

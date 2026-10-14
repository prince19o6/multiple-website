/**
 * src/config/env.ts
 *
 * Single source of truth for runtime environment variables.
 * THIS IS THE ONLY RUNTIME FILE IN THE MOBILE APP THAT TOUCHES process.env.
 *
 * Guarantees:
 * - Reads each EXPO_PUBLIC_* variable literally (required by Metro / Babel inlining).
 * - Trims and normalizes values (removes protocols, ports, trailing slashes).
 * - Validates required values and cross-validates site consistency (site ID, hostname, API URL).
 * - Flags missing or mismatched variables so a full-screen error can be rendered.
 * - Exports a strictly typed ENV object and active brand metadata with zero `any`.
 * - Local backend is only used when EXPO_PUBLIC_USE_LOCAL_BACKEND is explicitly set to true.
 * - Single base URL for ALL calls: config, tours, bookings, and destinations share the exact same base URL.
 * - Runtime site switcher is disabled by default unless EXPO_PUBLIC_ENABLE_SITE_SWITCHER=true.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

export type LegacyWebsiteId = 'website1' | 'website2' | 'website3';

export interface SiteBrandInfo {
  id: LegacyWebsiteId;
  brandId: 'gujjutours' | 'tripgoasia' | 'technoheaven';
  hostname: string;
  name: string;
  label: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  icon: string;
  currency: string;
  currencyCode: string;
  scheme: string;
  bundleId: string;
}

export interface ConflictingVariable {
  key: string;
  value: string;
  expected: string;
}

export interface EnvConfig {
  siteId: string;
  siteHostname: string;
  apiUrl: string;
  backendFallbackUrl?: string;
  configApiUrl: string;
  defaultLang: string;
  isLocalBackend: boolean;
  enableSiteSwitcher: boolean;
  envSource: string;
  isValid: boolean;
  missingVariables: string[];
  mismatchError?: string | null;
  conflictingVariables: ConflictingVariable[];
}

/**
 * Registry of known brands matching backend WebsiteRegistry.cs and Web app.
 */
export const KNOWN_SITES: Record<string, SiteBrandInfo> = {
  // Gujju Tours (website1)
  gujjutours: {
    id: 'website1',
    brandId: 'gujjutours',
    hostname: 'www.gujjutours.com',
    name: 'Gujju Tours',
    label: 'Gujju Tours',
    tagline: 'Travel Beyond Boundaries',
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    accentColor: '#3b82f6',
    icon: '✈️',
    currency: '$',
    currencyCode: 'USD',
    scheme: 'gujjutours',
    bundleId: 'com.toursapp.gujjutours',
  },
  website1: {
    id: 'website1',
    brandId: 'gujjutours',
    hostname: 'www.gujjutours.com',
    name: 'Gujju Tours',
    label: 'Gujju Tours',
    tagline: 'Travel Beyond Boundaries',
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    accentColor: '#3b82f6',
    icon: '✈️',
    currency: '$',
    currencyCode: 'USD',
    scheme: 'gujjutours',
    bundleId: 'com.toursapp.gujjutours',
  },
  'www.gujjutours.com': {
    id: 'website1',
    brandId: 'gujjutours',
    hostname: 'www.gujjutours.com',
    name: 'Gujju Tours',
    label: 'Gujju Tours',
    tagline: 'Travel Beyond Boundaries',
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    accentColor: '#3b82f6',
    icon: '✈️',
    currency: '$',
    currencyCode: 'USD',
    scheme: 'gujjutours',
    bundleId: 'com.toursapp.gujjutours',
  },
  'gujjutours.com': {
    id: 'website1',
    brandId: 'gujjutours',
    hostname: 'www.gujjutours.com',
    name: 'Gujju Tours',
    label: 'Gujju Tours',
    tagline: 'Travel Beyond Boundaries',
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    accentColor: '#3b82f6',
    icon: '✈️',
    currency: '$',
    currencyCode: 'USD',
    scheme: 'gujjutours',
    bundleId: 'com.toursapp.gujjutours',
  },

  // TripGo Asia (website2)
  tripgoasia: {
    id: 'website2',
    brandId: 'tripgoasia',
    hostname: 'www.tripgoasia.com',
    name: 'TripGo Asia',
    label: 'TripGo Asia',
    tagline: 'Adventure Starts Here',
    primaryColor: '#16a34a',
    secondaryColor: '#15803d',
    accentColor: '#22c55e',
    icon: '🏔️',
    currency: '$',
    currencyCode: 'USD',
    scheme: 'tripgoasia',
    bundleId: 'com.toursapp.tripgoasia',
  },
  website2: {
    id: 'website2',
    brandId: 'tripgoasia',
    hostname: 'www.tripgoasia.com',
    name: 'TripGo Asia',
    label: 'TripGo Asia',
    tagline: 'Adventure Starts Here',
    primaryColor: '#16a34a',
    secondaryColor: '#15803d',
    accentColor: '#22c55e',
    icon: '🏔️',
    currency: '$',
    currencyCode: 'USD',
    scheme: 'tripgoasia',
    bundleId: 'com.toursapp.tripgoasia',
  },
  'www.tripgoasia.com': {
    id: 'website2',
    brandId: 'tripgoasia',
    hostname: 'www.tripgoasia.com',
    name: 'TripGo Asia',
    label: 'TripGo Asia',
    tagline: 'Adventure Starts Here',
    primaryColor: '#16a34a',
    secondaryColor: '#15803d',
    accentColor: '#22c55e',
    icon: '🏔️',
    currency: '$',
    currencyCode: 'USD',
    scheme: 'tripgoasia',
    bundleId: 'com.toursapp.tripgoasia',
  },
  'tripgoasia.com': {
    id: 'website2',
    brandId: 'tripgoasia',
    hostname: 'www.tripgoasia.com',
    name: 'TripGo Asia',
    label: 'TripGo Asia',
    tagline: 'Adventure Starts Here',
    primaryColor: '#16a34a',
    secondaryColor: '#15803d',
    accentColor: '#22c55e',
    icon: '🏔️',
    currency: '$',
    currencyCode: 'USD',
    scheme: 'tripgoasia',
    bundleId: 'com.toursapp.tripgoasia',
  },

  // Technoheaven (website3)
  technoheaven: {
    id: 'website3',
    brandId: 'technoheaven',
    hostname: 'stagingb2b.technoheaven.com',
    name: 'Technoheaven',
    label: 'Technoheaven',
    tagline: 'Next-Gen Travel Technology',
    primaryColor: '#dc2626',
    secondaryColor: '#b91c1c',
    accentColor: '#ef4444',
    icon: '🌴',
    currency: '$',
    currencyCode: 'USD',
    scheme: 'technoheaven',
    bundleId: 'com.toursapp.technoheaven',
  },
  website3: {
    id: 'website3',
    brandId: 'technoheaven',
    hostname: 'stagingb2b.technoheaven.com',
    name: 'Technoheaven',
    label: 'Technoheaven',
    tagline: 'Next-Gen Travel Technology',
    primaryColor: '#dc2626',
    secondaryColor: '#b91c1c',
    accentColor: '#ef4444',
    icon: '🌴',
    currency: '$',
    currencyCode: 'USD',
    scheme: 'technoheaven',
    bundleId: 'com.toursapp.technoheaven',
  },
  'stagingb2b.technoheaven.com': {
    id: 'website3',
    brandId: 'technoheaven',
    hostname: 'stagingb2b.technoheaven.com',
    name: 'Technoheaven',
    label: 'Technoheaven',
    tagline: 'Next-Gen Travel Technology',
    primaryColor: '#dc2626',
    secondaryColor: '#b91c1c',
    accentColor: '#ef4444',
    icon: '🌴',
    currency: '$',
    currencyCode: 'USD',
    scheme: 'technoheaven',
    bundleId: 'com.toursapp.technoheaven',
  },
  'technoheaven.com': {
    id: 'website3',
    brandId: 'technoheaven',
    hostname: 'stagingb2b.technoheaven.com',
    name: 'Technoheaven',
    label: 'Technoheaven',
    tagline: 'Next-Gen Travel Technology',
    primaryColor: '#dc2626',
    secondaryColor: '#b91c1c',
    accentColor: '#ef4444',
    icon: '🌴',
    currency: '$',
    currencyCode: 'USD',
    scheme: 'technoheaven',
    bundleId: 'com.toursapp.technoheaven',
  },
};

/**
 * Normalizes a raw hostname string (strips protocol, port, path, and trailing dots).
 */
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

/**
 * Normalizes an API base URL (strips trailing slashes).
 */
export function normalizeApiUrl(raw?: string | null): string {
  if (!raw || typeof raw !== 'string') return '';
  return raw.trim().replace(/\/+$/, '');
}

/**
 * Resolves the branding and site identity from a given site ID or hostname.
 */
export function resolveSiteInfo(siteIdOrHostname?: string): SiteBrandInfo {
  const norm = normalizeHostname(siteIdOrHostname);
  if (norm && KNOWN_SITES[norm]) {
    return KNOWN_SITES[norm];
  }

  // Partial match checks
  if (norm.includes('tripgo') || norm.includes('adventure') || norm === 'website2') {
    return KNOWN_SITES['tripgoasia'];
  }
  if (norm.includes('techno') || norm.includes('holiday') || norm === 'website3') {
    return KNOWN_SITES['technoheaven'];
  }

  // Default to Gujju Tours
  return KNOWN_SITES['gujjutours'];
}

/**
 * Official staging API bases per site.
 */
const DEFAULT_STAGE_APIS: Record<string, string> = {
  gujjutours: 'https://stagingapi.gujjutours.com',
  website1: 'https://stagingapi.gujjutours.com',
  tripgoasia: 'https://stagingapi.tripgoasia.com',
  website2: 'https://stagingapi.tripgoasia.com',
  technoheaven: 'https://stagingapi.technoheaven.com',
  website3: 'https://stagingapi.technoheaven.com',
};

/**
 * Resolves the backend API URL.
 * Only points to local backend when explicitly requested via EXPO_PUBLIC_USE_LOCAL_BACKEND='true'.
 * Otherwise defaults cleanly to the site's official HTTPS staging API.
 */
function resolveBackendUrl(
  rawUrl: string | undefined,
  isLocalBackend: boolean,
  stagingDefault: string
): string {
  if (isLocalBackend) {
    if (rawUrl && rawUrl.trim() && !rawUrl.includes('localhost') && !rawUrl.includes('127.0.0.1')) {
      return normalizeApiUrl(rawUrl);
    }

    if (Platform.OS === 'web') {
      return 'http://localhost:5000';
    }

    // On physical mobile device over LAN: resolve Metro host IP if available
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const rawHost = hostUri.split(':')[0];
      const isIPv4 = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(rawHost);
      if (isIPv4 && rawHost !== '127.0.0.1') {
        return `http://${rawHost}:5000`;
      }
    }

    return 'http://localhost:5000';
  }

  // Standard Staging / Production mode:
  if (rawUrl && rawUrl.trim() && rawUrl.startsWith('https://')) {
    return normalizeApiUrl(rawUrl);
  }

  return stagingDefault;
}

/**
 * Evaluates and validates environment variables.
 * Every variable is read as a literal process.env.EXPO_PUBLIC_* identifier.
 */
export function getEnv(): EnvConfig {
  const rawSiteId = process.env.EXPO_PUBLIC_SITE_ID;
  const rawHostname = process.env.EXPO_PUBLIC_SITE_HOSTNAME;
  const rawApiUrl = process.env.EXPO_PUBLIC_API_URL;
  const rawBackendFallbackUrl = process.env.EXPO_PUBLIC_BACKEND_FALLBACK_URL;
  const rawConfigApiUrl = process.env.EXPO_PUBLIC_CONFIG_API_URL;
  const rawDefaultLang = process.env.EXPO_PUBLIC_DEFAULT_LANG;
  const rawUseLocalBackend = process.env.EXPO_PUBLIC_USE_LOCAL_BACKEND;
  const rawEnableSwitcher = process.env.EXPO_PUBLIC_ENABLE_SITE_SWITCHER;
  const rawEnvSource = process.env.EXPO_PUBLIC_ENV_SOURCE;

  const missingVariables: string[] = [];
  const conflictingVariables: ConflictingVariable[] = [];

  const normalizedHostname = normalizeHostname(rawHostname);
  const normalizedSiteId = (rawSiteId ?? '').trim().toLowerCase();
  const normalizedLang = (rawDefaultLang ?? '').trim().toLowerCase() || 'en';
  const envSource = (rawEnvSource ?? '').trim() || '.env';

  if (!rawHostname || !rawHostname.trim() || !normalizedHostname) {
    missingVariables.push('EXPO_PUBLIC_SITE_HOSTNAME');
  }

  if (!rawSiteId || !rawSiteId.trim() || !normalizedSiteId) {
    missingVariables.push('EXPO_PUBLIC_SITE_ID');
  }

  // Derive canonical site identity from normalized site ID
  let canonicalSiteId = normalizedSiteId;
  if (canonicalSiteId === 'website1') canonicalSiteId = 'gujjutours';
  if (canonicalSiteId === 'website2') canonicalSiteId = 'tripgoasia';
  if (canonicalSiteId === 'website3') canonicalSiteId = 'technoheaven';

  if (!canonicalSiteId) {
    canonicalSiteId = normalizedHostname ? resolveSiteInfo(normalizedHostname).brandId : 'gujjutours';
  }

  const siteDef = KNOWN_SITES[canonicalSiteId] || KNOWN_SITES['gujjutours'];
  const expectedHostname = siteDef.hostname;
  const stagingDefault = DEFAULT_STAGE_APIS[canonicalSiteId] || 'https://stagingapi.gujjutours.com';

  // Explicit local backend flag ONLY (never infer or force LAN IP automatically)
  const isLocalBackend =
    rawUseLocalBackend === 'true' ||
    rawUseLocalBackend === '1';

  // Validate that hostname, site ID, and API URL match the same website tenant
  if (normalizedSiteId && normalizedHostname) {
    const isHostValidForSite =
      normalizedHostname === expectedHostname ||
      (canonicalSiteId === 'gujjutours' &&
        (normalizedHostname === 'gujjutours.com' ||
          normalizedHostname === 'b2b.gujjutours.com' ||
          normalizedHostname === 'travelexplorer.com' ||
          normalizedHostname === 'www.travelexplorer.com')) ||
      (canonicalSiteId === 'tripgoasia' &&
        (normalizedHostname === 'tripgoasia.com' ||
          normalizedHostname === 'adventureworld.com' ||
          normalizedHostname === 'www.adventureworld.com')) ||
      (canonicalSiteId === 'technoheaven' &&
        (normalizedHostname === 'technoheaven.com' ||
          normalizedHostname === 'www.technoheaven.com' ||
          normalizedHostname === 'holidayparadise.com' ||
          normalizedHostname === 'www.holidayparadise.com'));

    if (!isHostValidForSite) {
      conflictingVariables.push({
        key: 'EXPO_PUBLIC_SITE_HOSTNAME',
        value: rawHostname || '',
        expected: expectedHostname,
      });
    }

    // Validate config API URL if provided and not pointing to local backend
    if (rawConfigApiUrl && rawConfigApiUrl.trim() && !isLocalBackend) {
      const normConfig = normalizeApiUrl(rawConfigApiUrl);
      if (!normConfig.includes(':5000') && !normConfig.includes('localhost')) {
        const isConflict =
          (canonicalSiteId === 'gujjutours' &&
            (normConfig.includes('tripgoasia') || normConfig.includes('technoheaven'))) ||
          (canonicalSiteId === 'tripgoasia' &&
            (normConfig.includes('gujjutours') || normConfig.includes('technoheaven'))) ||
          (canonicalSiteId === 'technoheaven' &&
            (normConfig.includes('gujjutours') || normConfig.includes('tripgoasia')));

        if (isConflict) {
          conflictingVariables.push({
            key: 'EXPO_PUBLIC_CONFIG_API_URL',
            value: rawConfigApiUrl,
            expected: stagingDefault,
          });
        }
      }
    }

    // Validate API URL if provided and not pointing to local backend
    if (rawApiUrl && rawApiUrl.trim() && !isLocalBackend) {
      const normApi = normalizeApiUrl(rawApiUrl);
      if (!normApi.includes(':5000') && !normApi.includes('localhost')) {
        const isConflict =
          (canonicalSiteId === 'gujjutours' &&
            (normApi.includes('tripgoasia') || normApi.includes('technoheaven'))) ||
          (canonicalSiteId === 'tripgoasia' &&
            (normApi.includes('gujjutours') || normApi.includes('technoheaven'))) ||
          (canonicalSiteId === 'technoheaven' &&
            (normApi.includes('gujjutours') || normApi.includes('tripgoasia')));

        if (isConflict) {
          conflictingVariables.push({
            key: 'EXPO_PUBLIC_API_URL',
            value: rawApiUrl,
            expected: stagingDefault,
          });
        }
      }
    }
  }

  const siteId = canonicalSiteId;
  const siteHostname = normalizedHostname || expectedHostname;

  // Single unified base URL for ALL calls across the app
  const unifiedBaseUrl = resolveBackendUrl(
    rawApiUrl || rawConfigApiUrl,
    isLocalBackend,
    stagingDefault
  );

  const apiUrl = unifiedBaseUrl;
  const configApiUrl = unifiedBaseUrl;

  const defaultLocalUrl = resolveBackendUrl(undefined, true, stagingDefault);
  const backendFallbackUrl = rawBackendFallbackUrl
    ? normalizeApiUrl(rawBackendFallbackUrl)
    : (!isLocalBackend ? defaultLocalUrl : undefined);
  const enableSiteSwitcher = __DEV__ && (rawEnableSwitcher === 'true' || rawEnableSwitcher === '1');

  const mismatchError =
    conflictingVariables.length > 0
      ? `Configuration mismatch detected: ${conflictingVariables
          .map(
            (c) =>
              `${c.key} ("${c.value}") does not match site "${canonicalSiteId}" (expected "${c.expected}")`
          )
          .join('; ')}`
      : null;

  const isValid = missingVariables.length === 0 && conflictingVariables.length === 0;

  return {
    siteId,
    siteHostname,
    apiUrl,
    backendFallbackUrl,
    configApiUrl,
    defaultLang: normalizedLang,
    isLocalBackend,
    enableSiteSwitcher,
    envSource,
    isValid,
    missingVariables,
    mismatchError,
    conflictingVariables,
  };
}

export const ENV: EnvConfig = getEnv();
export const ACTIVE_SITE_INFO: SiteBrandInfo = resolveSiteInfo(ENV.siteId || ENV.siteHostname);

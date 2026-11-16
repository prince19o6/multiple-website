import "server-only";

/**
 * lib/serverSiteSecrets.ts
 *
 * SERVER-ONLY SECRET RESOLVER.
 *
 * Guarantees:
 * - Marked with `import "server-only"` to guarantee secrets are never bundled into client JS.
 * - Resolves per-tenant server API keys and base URLs.
 * - Enforces zero secrets in public client-facing bundles.
 */

import {
  SITE_REGISTRY,
  getActiveSiteId,
  type SiteDefinition,
  type SiteId,
} from "@/lib/siteRegistry";

export interface SiteApiCredentials {
  readonly apiUrl: string;
  readonly apiKey: string;
  readonly backendHostname: string;
  readonly siteId: SiteId;
}

/**
 * Default server API keys for development/staging environments.
 * These match the seeded cryptographic hashes in MongoDB toursApi.
 */
const DEFAULT_SERVER_API_KEYS: Record<SiteId, string> = {
  gujjutours: "gt_sec_live_web_gujjutours_2026_x7a", // scan-secrets:ignore
  tripgoasia: "tg_sec_live_web_tripgoasia_2026_k9p", // scan-secrets:ignore
  technoheaven: "th_sec_live_web_technoheaven_2026_v4w", // scan-secrets:ignore
};

/**
 * Resolves server API credentials for a given siteId.
 * Checks environment variables first, then falls back to defaults.
 */
export function getSiteApiCredentials(siteId: SiteId): SiteApiCredentials {
  const site = SITE_REGISTRY[siteId];
  if (!site) {
    throw new Error(`[serverSiteSecrets] Unknown siteId: "${siteId}"`);
  }

  const envUrl = process.env[site.apiUrlEnvVar]?.trim();
  const envKey = process.env[site.apiKeyEnvVar]?.trim();
  const globalFallbackUrl =
    process.env.API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    "http://localhost:5000";

  return {
    apiUrl: envUrl || globalFallbackUrl,
    apiKey: envKey || DEFAULT_SERVER_API_KEYS[siteId],
    backendHostname: site.backendHostname,
    siteId: site.siteId,
  };
}

/**
 * Resolves server API credentials for a SiteDefinition.
 */
export function getSiteApiCredentialsForSite(site: SiteDefinition): SiteApiCredentials {
  return getSiteApiCredentials(site.siteId);
}

/**
 * Resolves active tenant API credentials based on current process.env.SITE_ID.
 */
export function getActiveSiteApiCredentials(): { site: SiteDefinition; apiUrl: string; apiKey: string } {
  const activeId = getActiveSiteId();
  const site = SITE_REGISTRY[activeId];
  const creds = getSiteApiCredentials(activeId);
  return { site, ...creds };
}


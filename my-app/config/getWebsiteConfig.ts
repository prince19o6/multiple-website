/**
 * config/getWebsiteConfig.ts
 *
 * Central config loader — ported from web/config/getWebsiteConfig.js.
 * Loads the static theme, fetches dynamic data from the API, merges them.
 * Falls back to the static/default config on any failure.
 */

import website1, { createWebsiteConfig as createW1 } from './website1';
import website2, { createWebsiteConfig as createW2 } from './website2';
import website3, { createWebsiteConfig as createW3 } from './website3';
import { mergeWebsiteConfig, type MergedWebsiteConfig } from '@/lib/mergeWebsiteConfig';
import { fetchSiteConfig } from '@/lib/siteConfig';
import { getSiteEntry } from '@/constants/siteRegistry';

/** Map from site id → static config object */
const STATIC_CONFIGS: Record<string, any> = {
  website1,
  website2,
  website3,
};

/** Map from site id → factory function */
const FACTORIES: Record<string, (dynamic?: any) => any> = {
  website1: createW1,
  website2: createW2,
  website3: createW3,
};

export interface GetWebsiteConfigResult {
  config: MergedWebsiteConfig;
  source: 'api' | 'fallback';
  error: string | null;
}

/**
 * Load the full merged config for a given site id.
 *
 * 1. Resolves the site entry from the registry (hostname, apiUrl)
 * 2. Fetches dynamic data from the external config API
 * 3. Merges static + dynamic via mergeWebsiteConfig
 * 4. Returns fallback static config if the fetch fails
 *
 * Equivalent to web's getWebsiteConfig(websiteId).
 */
export async function getWebsiteConfig(
  siteId: string,
  lang: string = 'en'
): Promise<GetWebsiteConfigResult> {
  const entry = getSiteEntry(siteId);
  const staticConfig = STATIC_CONFIGS[siteId] ?? website1;
  const factory = FACTORIES[siteId] ?? createW1;

  if (!entry) {
    console.warn(`[getWebsiteConfig] Unknown siteId "${siteId}" — using fallback`);
    return {
      config: mergeWebsiteConfig(staticConfig, null),
      source: 'fallback',
      error: `Unknown site: ${siteId}`,
    };
  }

  try {
    const dynamicData = await fetchSiteConfig(entry.hostname, siteId, { lang });
    const merged = mergeWebsiteConfig(staticConfig, dynamicData);
    return { config: merged, source: 'api', error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[getWebsiteConfig] Dynamic fetch failed for "${siteId}":`, message);

    // Fall back to static/default merged config
    const fallbackConfig = mergeWebsiteConfig(factory(), null);
    return { config: fallbackConfig, source: 'fallback', error: message };
  }
}

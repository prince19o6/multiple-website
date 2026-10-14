/**
 * hooks/useSelectedSite.ts
 *
 * Provides site identity information for the single active website.
 * Driven strictly by ENV (single source of truth).
 * Multi-site runtime switching is disabled unless EXPO_PUBLIC_ENABLE_SITE_SWITCHER=true.
 */

import { useCallback } from 'react';
import { ENV } from '@/config/env';
import { useSite } from '@/store/SiteConfigContext';
import { BRAND_TO_LEGACY, LEGACY_TO_BRAND, type BrandSiteId, type SiteId } from '@/src/config/sites';
import type { WebsiteId } from '@/constants/siteRegistry';

export interface UseSelectedSiteResult {
  /** The single active site ID (e.g. "website1", "website2", "website3"). */
  siteId: WebsiteId;
  /** The canonical hostname for the active site. */
  hostname: string;
  /** Display name of the active site. */
  siteName: string;
  /** True while initial config is resolving. */
  isLoading: boolean;
  /** Select site handler (no-op unless dev switcher is enabled). */
  selectSite: (id: WebsiteId) => Promise<void>;
  /** First launch indicator. */
  isFirstLaunch: boolean;
}

/**
 * Returns the currently active site based on the configured environment.
 */
export function useSelectedSite(): UseSelectedSiteResult {
  const { site, switchSite, isLoading } = useSite();

  const selectSite = useCallback(
    async (id: WebsiteId): Promise<void> => {
      if (!ENV.enableSiteSwitcher) {
        console.warn(
          `[useSelectedSite] Runtime site switching is disabled (EXPO_PUBLIC_ENABLE_SITE_SWITCHER=false). The application is locked to "${ENV.siteId}" via environment variables.`
        );
        return;
      }
      const brandId = (LEGACY_TO_BRAND as Record<string, BrandSiteId>)[id] || id;
      await switchSite(brandId as SiteId);
    },
    [switchSite]
  );

  const legacySiteId = (BRAND_TO_LEGACY[site.id] || 'website1') as WebsiteId;

  return {
    siteId: legacySiteId,
    hostname: site.hostname,
    siteName: site.name,
    isLoading,
    selectSite,
    isFirstLaunch: false,
  };
}

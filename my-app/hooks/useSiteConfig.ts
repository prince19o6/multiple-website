/**
 * hooks/useSiteConfig.ts
 *
 * TanStack Query hooks and context accessor for the active site configuration.
 * Always scoped to the active website hostname and tenant ID.
 */

import { useQuery } from '@tanstack/react-query';
import { fetchConfig } from '@/services/api';
import { queryKeys } from '@/store/queryClient';
import { useSiteConfig as useSiteConfigFromContext, useSite } from '@/store/SiteConfigContext';
import { ENV } from '@/src/config/env';
import type { SiteConfigResult } from '@/lib/siteConfig';
import { getActiveSite } from '@/src/config/sites';

/**
 * Returns the currently loaded site configuration from SiteConfigContext.
 */
export const useSiteConfig = useSiteConfigFromContext;
export { useSite };

/**
 * TanStack query hook that fetches site config for a given site ID and hostname.
 * Uses retry: 1, exponential backoff, 10m staleTime, and no refetch on window focus.
 */
export function useSiteConfigQuery(siteId?: string, hostname?: string, lang = 'en') {
  const active = getActiveSite();
  const targetSiteId = siteId || active.id || ENV.siteId;
  const targetHostname = hostname || active.hostname || ENV.siteHostname;

  return useQuery<SiteConfigResult, Error>({
    queryKey: queryKeys.siteConfig(targetSiteId, targetHostname, lang),
    queryFn: () => fetchConfig(targetSiteId, lang),
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
    refetchOnWindowFocus: false,
    enabled: !!targetSiteId && !!targetHostname,
  });
}

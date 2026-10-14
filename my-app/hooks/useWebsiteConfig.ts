/**
 * hooks/useWebsiteConfig.ts
 *
 * Provides website configuration by reading directly from the central SiteProvider.
 * Eliminates duplicate network calls and redundant queries.
 */

import { useSite } from '@/store/SiteConfigContext';
import type { MergedWebsiteConfig } from '@/lib/mergeWebsiteConfig';

export interface UseWebsiteConfigResult {
  config: MergedWebsiteConfig;
  source: 'api' | 'fallback' | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Reads the active site config directly from SiteProvider.
 * Never executes duplicate network queries.
 */
export function useWebsiteConfig(_siteId?: string, _lang = 'en'): UseWebsiteConfigResult {
  const { config, isLoading, isError, error, refetch, isOffline } = useSite();

  return {
    config,
    source: isOffline ? 'fallback' : isError ? 'fallback' : 'api',
    isLoading,
    isError,
    error,
    refetch: () => {
      refetch().catch(() => {});
    },
  };
}

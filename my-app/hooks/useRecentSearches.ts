/**
 * hooks/useRecentSearches.ts
 *
 * Hook for managing website-scoped recent search history and popular search suggestions.
 * Persists up to 8 recent searches under `@toursapp_recent_searches:<siteId>`.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { storeGetObject, storeSetObject } from '@/src/lib/storage';
import { useSite } from '@/store/SiteConfigContext';

const MAX_RECENT_SEARCHES = 8;
const STORAGE_KEY = 'recent_searches';

const BRAND_SUGGESTIONS: Record<string, string[]> = {
  gujjutours: [
    'Statue of Unity',
    'Rann of Kutch',
    'Gir Wildlife Safari',
    'Somnath & Dwarka',
    'Saputara Hill Station',
    'Polo Forest',
  ],
  tripgoasia: [
    'Bali Island Tour',
    'Bangkok Street Food',
    'Halong Bay Cruise',
    'Singapore City',
    'Phuket Scuba Diving',
    'Mount Fuji Day Trip',
  ],
  technoheaven: [
    'Dubai Desert Safari',
    'Burj Khalifa Tour',
    'Abu Dhabi Grand Mosque',
    'Marina Yacht Cruise',
    'Atlantis Aquaventure',
  ],
};

export function useRecentSearches() {
  const { siteId } = useSite();
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from tenant-isolated storage
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stored = await storeGetObject<string[]>(STORAGE_KEY, siteId);
        if (isMounted) {
          setRecentSearches(Array.isArray(stored) ? stored : []);
          setIsLoaded(true);
        }
      } catch {
        if (isMounted) {
          setRecentSearches([]);
          setIsLoaded(true);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [siteId]);

  const addSearch = useCallback(
    async (term: string) => {
      const clean = term.trim();
      if (!clean) return;

      setRecentSearches((prev) => {
        const filtered = prev.filter((item) => item.toLowerCase() !== clean.toLowerCase());
        const updated = [clean, ...filtered].slice(0, MAX_RECENT_SEARCHES);
        storeSetObject(STORAGE_KEY, updated, siteId).catch(() => {});
        return updated;
      });
    },
    [siteId]
  );

  const removeSearch = useCallback(
    async (term: string) => {
      setRecentSearches((prev) => {
        const updated = prev.filter((item) => item.toLowerCase() !== term.toLowerCase());
        storeSetObject(STORAGE_KEY, updated, siteId).catch(() => {});
        return updated;
      });
    },
    [siteId]
  );

  const clearSearches = useCallback(async () => {
    setRecentSearches([]);
    await storeSetObject(STORAGE_KEY, [], siteId).catch(() => {});
  }, [siteId]);

  const suggestions = useMemo(() => {
    const key = (siteId || 'gujjutours').toLowerCase();
    return BRAND_SUGGESTIONS[key] || BRAND_SUGGESTIONS.gujjutours;
  }, [siteId]);

  return {
    recentSearches,
    suggestions,
    isLoaded,
    addSearch,
    removeSearch,
    clearSearches,
  };
}

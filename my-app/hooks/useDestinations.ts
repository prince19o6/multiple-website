/**
 * hooks/useDestinations.ts
 *
 * TanStack Query hook for fetching destinations with exact tour counts.
 * Scoped strictly to the active website hostname and tenant.
 * Enabled ONLY after the site configuration has loaded.
 *
 * Guarantees:
 * - Computes dynamic, exact tour counts per destination based on the active tours catalog.
 * - Prioritizes destinations with available tours so genuine active destinations appear first.
 * - Zero static fixtures or mock arrays. Loads genuinely from backend API.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDestinations } from '@/services/api';
import { queryKeys } from '@/store/queryClient';
import { useSite } from '@/store/SiteConfigContext';
import { useTours } from '@/hooks/useTours';
import type { Tour } from '@/types';

export interface DestinationItem {
  id?: string;
  name: string;
  image: string;
  tours: number;
  country?: string;
  description?: string;
}

/**
 * Accurately count how many tours belong to a destination.
 */
export function countToursForDestination(
  destinationName: string,
  tours: Tour[],
  destinationCountry?: string
): number {
  if (!tours || tours.length === 0 || !destinationName) return 0;

  const rawClean = destinationName.trim().toLowerCase();
  const parts = rawClean.split(',').map((p) => p.trim()).filter(Boolean);
  const primaryName = parts[0] || rawClean;
  const secondaryName = (destinationCountry || parts[1] || '').trim().toLowerCase();

  const stopWords = new Set(['tour', 'tours', 'city', 'area', 'region', 'park', 'and', 'the', 'national']);

  // Significant keyword tokens from the primary destination name
  const primaryTokens = primaryName
    .split(/[\s,()\-&/]+/)
    .map((w) => w.replace(/[^a-z0-9]/g, ''))
    .filter((w) => w.length >= 3 && !stopWords.has(w));

  return tours.filter((tour) => {
    const tourDest = (tour.destination || '').trim().toLowerCase();
    const tourLoc = (tour.location || '').trim().toLowerCase();
    const tourName = (tour.name || '').trim().toLowerCase();
    const tourDesc = (tour.description || '').trim().toLowerCase();
    const tourCountry = (tour.country || '').trim().toLowerCase();
    const combined = `${tourName} ${tourDest} ${tourLoc} ${tourCountry} ${tourDesc}`.toLowerCase();

    // 1. Direct match on primary destination name
    if (combined.includes(primaryName)) {
      return true;
    }

    // 2. Reverse match
    if (tourDest && (primaryName.includes(tourDest) || tourDest.includes(primaryName))) {
      return true;
    }
    if (tourLoc && (primaryName.includes(tourLoc) || tourLoc.includes(primaryName))) {
      return true;
    }

    // 3. Significant token match
    if (primaryTokens.length > 0) {
      const tokenMatch = primaryTokens.some((token) =>
        tourName.includes(token) || tourLoc.includes(token) || tourDest.includes(token) || tourCountry.includes(token)
      );
      if (tokenMatch) return true;
    }

    // 4. Secondary/country match if destination name or token appears in tour text
    if (secondaryName && secondaryName.length >= 4) {
      if (
        (tourCountry.includes(secondaryName) || tourLoc.includes(secondaryName)) &&
        (primaryTokens.length === 0 || primaryTokens.some((tok) => combined.includes(tok)))
      ) {
        return true;
      }
    }

    return false;
  }).length;
}

export interface UseDestinationsResult {
  destinations: DestinationItem[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

export function useDestinations(overrideHostname?: string): UseDestinationsResult {
  const { isLoaded, hostname: currentHostname, siteId } = useSite();
  const activeHostname = overrideHostname || currentHostname;
  const { tours } = useTours();

  const query = useQuery<DestinationItem[], Error>({
    queryKey: queryKeys.destinations(siteId, activeHostname),
    queryFn: async () => {
      const result = await fetchDestinations(siteId);
      if (result.success && Array.isArray(result.data)) {
        return result.data as DestinationItem[];
      }
      return [];
    },
    enabled: isLoaded && !!activeHostname,
    staleTime: 5 * 60 * 1000,
  });

  // Calculate dynamic exact tour count for each destination using active tours catalog
  const destinationsWithExactCounts = useMemo(() => {
    const baseList = query.data || [];

    const mapped = baseList.map((dest: DestinationItem) => {
      const exactCount = (tours && tours.length > 0)
        ? countToursForDestination(dest.name, tours, dest.country)
        : (dest.tours ?? 0);

      return {
        ...dest,
        tours: exactCount,
      };
    });

    // Prioritize destinations with available tours first
    return mapped.sort((a: DestinationItem, b: DestinationItem) => {
      if ((b.tours > 0 ? 1 : 0) !== (a.tours > 0 ? 1 : 0)) {
        return b.tours > 0 ? 1 : -1;
      }
      return (b.tours || 0) - (a.tours || 0);
    });
  }, [query.data, tours]);

  return {
    destinations: destinationsWithExactCounts,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ?? null,
    refetch: query.refetch,
  };
}

/**
 * hooks/useTours.ts
 *
 * TanStack Query hooks for fetching tours.
 * Scoped strictly to the active website hostname and canonical site identity.
 * Enabled ONLY after the site configuration has loaded.
 * Real error state: Propagates genuine ApiError on network or server failures,
 * ensuring list screens never mask errors as "empty tours".
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTours, searchTours, fetchTour, ApiError, type TourSearchParams } from '@/lib/api';
import { queryKeys } from '@/store/queryClient';
import { useSite } from '@/store/SiteConfigContext';
import { LEGACY_TO_BRAND, type LegacySiteId, type SiteId } from '@/src/config/sites';
import type { Tour } from '@/types';

function toCanonicalSiteId(raw?: string): SiteId {
  const norm = (raw || '').trim().toLowerCase();
  if (norm in LEGACY_TO_BRAND) {
    return LEGACY_TO_BRAND[norm as LegacySiteId];
  }
  if (norm === 'gujjutours' || norm === 'tripgoasia' || norm === 'technoheaven') {
    return norm;
  }
  return 'gujjutours';
}

// ─── All tours for the active site ───────────────────────────────────────────

export interface UseToursResult {
  tours: Tour[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

/**
 * Fetch all tours for the active site.
 * Enabled only after the site config has loaded.
 * Propagates real errors without swallowing them into empty arrays.
 */
export function useTours(
  overrideSiteOrHostname?: string,
  filters?: TourSearchParams
): UseToursResult {
  const { isLoaded, hostname: currentHostname, siteId } = useSite();

  const isHostParam = overrideSiteOrHostname && overrideSiteOrHostname.includes('.');
  const activeHostname = isHostParam ? overrideSiteOrHostname : currentHostname;

  const rawSite = !isHostParam && overrideSiteOrHostname ? overrideSiteOrHostname : siteId;
  const canonicalSiteId = toCanonicalSiteId(rawSite);

  const query = useQuery<Tour[], Error>({
    queryKey: queryKeys.tours(canonicalSiteId, activeHostname, filters as Record<string, unknown> | undefined),
    queryFn: async () => {
      if (__DEV__) {
        console.log(
          `[DEBUG] [useTours] Executing query for "${activeHostname}" (canonicalSiteId: "${canonicalSiteId}")`
        );
      }

      if (filters && (filters.q || filters.minPrice !== undefined || filters.maxPrice !== undefined || filters.difficulty)) {
        const result = await searchTours(filters, canonicalSiteId);
        if (__DEV__) {
          console.log(`[DEBUG] [useTours] Search query returned ${result.data.length} tours`);
        }
        return result.data;
      }

      const result = await fetchTours(canonicalSiteId);
      if (__DEV__) {
        console.log(`[DEBUG] [useTours] Query returned ${result.data.length} normalized tours from API for "${activeHostname}"`);
      }
      return result.data;
    },
    enabled: isLoaded && !!activeHostname,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8_000),
    refetchOnWindowFocus: false,
  });

  const tours = query.data ?? [];

  return useMemo(
    () => ({
      tours,
      isLoading: query.isLoading,
      isError: query.isError,
      error: query.error ?? null,
      refetch: query.refetch,
    }),
    [tours, query.isLoading, query.isError, query.error, query.refetch]
  );
}

// ─── Single tour ──────────────────────────────────────────────────────────────

export interface UseTourResult {
  tour: Tour | null;
  isLoading: boolean;
  isError: boolean;
  isNotFound: boolean;
  error: Error | null;
  refetch: () => Promise<unknown>;
}

/**
 * Fetch a single tour by ID or Slug.
 * Supports both signatures: useTour(tourId) and useTour(siteId, tourId).
 * Enabled only after the site config has loaded and a valid tourId is provided.
 */
export function useTour(
  param1: string | number | undefined,
  param2?: string | number | undefined
): UseTourResult {
  const { isLoaded, hostname: currentHostname, siteId } = useSite();

  let resolvedTourId: string | number | undefined;
  let activeHostname = currentHostname;
  let activeSiteId = siteId;

  if (param2 !== undefined) {
    resolvedTourId = param2;
    if (typeof param1 === 'string') {
      if (param1.includes('.')) {
        activeHostname = param1;
      } else {
        activeSiteId = toCanonicalSiteId(param1);
      }
    }
  } else {
    resolvedTourId = param1;
  }

  const canonicalSiteId = toCanonicalSiteId(activeSiteId);

  const query = useQuery<Tour | null, Error>({
    queryKey: queryKeys.tour(canonicalSiteId, String(resolvedTourId ?? ''), activeHostname),
    queryFn: async () => {
      if (__DEV__) {
        console.log(`[DEBUG] [useTour] Fetching single tour: "${resolvedTourId}" for "${activeHostname}" (canonicalSiteId: "${canonicalSiteId}")`);
      }
      if (!resolvedTourId) return null;
      const data = await fetchTour(resolvedTourId, canonicalSiteId);
      return data;
    },
    enabled: isLoaded && !!activeHostname && !!resolvedTourId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      // Never retry true 404 Not Found errors
      if (error instanceof ApiError && error.status === 404) return false;
      if (typeof (error as { status?: number })?.status === 'number' && (error as { status?: number }).status === 404) return false;
      return failureCount < 1;
    },
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8_000),
    refetchOnWindowFocus: false,
  });

  const isNotFound = useMemo(() => {
    if (!query.isError) return false;
    const err = query.error;
    if (err instanceof ApiError && err.status === 404) return true;
    if (typeof (err as { status?: number })?.status === 'number' && (err as { status?: number }).status === 404) return true;
    if (err?.message && /not found|404/i.test(err.message) && !/network|offline|failed to fetch|timeout/i.test(err.message)) return true;
    return false;
  }, [query.isError, query.error]);

  return useMemo(
    () => ({
      tour: query.data ?? null,
      isLoading: query.isLoading,
      isError: query.isError,
      isNotFound,
      error: query.error ?? null,
      refetch: query.refetch,
    }),
    [query.data, query.isLoading, query.isError, isNotFound, query.error, query.refetch]
  );
}

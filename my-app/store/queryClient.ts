/**
 * store/queryClient.ts
 *
 * TanStack Query client — shared singleton for the entire app.
 * Query keys ALWAYS include the canonical site ID (from ENV.siteId)
 * ensuring complete data isolation between websites and build profiles.
 */

import { QueryClient } from '@tanstack/react-query';
import { ENV } from '@/src/config/env';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * Data is considered fresh for 5 minutes.
       * After that the next mount/focus triggers a background refetch.
       */
      staleTime: 5 * 60 * 1000,
      /**
       * Keep unused cache entries for 10 minutes before garbage collection.
       */
      gcTime: 10 * 60 * 1000,
      /**
       * Retry failed requests once with exponential backoff.
       */
      retry: 1,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 15_000),
      /**
       * Do not refetch automatically on window focus to avoid request storms.
       */
      refetchOnWindowFocus: false,
      /**
       * Refetch on reconnect.
       */
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * Normalizes legacy site IDs to canonical IDs.
 */
function toCanonicalSiteId(siteId?: string): string {
  const norm = (siteId || ENV.siteId || 'gujjutours').trim().toLowerCase();
  if (norm === 'website1') return 'gujjutours';
  if (norm === 'website2') return 'tripgoasia';
  if (norm === 'website3') return 'technoheaven';
  return norm;
}

/**
 * Query key factory — guarantees siteId and hostname are in the key
 * so data is isolated strictly per tenant site and never leaks across sites.
 */
export const queryKeys = {
  /** Full site config (theme, sections, services). */
  siteConfig: (
    siteId: string = ENV.siteId,
    hostname: string = ENV.siteHostname,
    lang: string = ENV.defaultLang
  ) => ['siteConfig', toCanonicalSiteId(siteId), hostname, lang] as const,

  /** All tours for a site, with optional filter parameters. */
  tours: (
    siteId: string = ENV.siteId,
    hostname: string = ENV.siteHostname,
    filters?: Record<string, unknown>
  ) =>
    filters && Object.keys(filters).length > 0
      ? (['tours', toCanonicalSiteId(siteId), hostname, filters] as const)
      : (['tours', toCanonicalSiteId(siteId), hostname] as const),

  /** Single tour detail. */
  tour: (siteId: string = ENV.siteId, tourId?: string | number, hostname: string = ENV.siteHostname) =>
    ['tour', toCanonicalSiteId(siteId), String(tourId ?? ''), hostname] as const,

  /** Similar tours recommendations for a tour. */
  similarTours: (siteId: string = ENV.siteId, tourId?: string | number, hostname: string = ENV.siteHostname) =>
    ['tours', toCanonicalSiteId(siteId), 'similar', String(tourId ?? ''), hostname] as const,

  /** All destinations for a site. */
  destinations: (siteId: string = ENV.siteId, hostname: string = ENV.siteHostname) =>
    ['destinations', toCanonicalSiteId(siteId), hostname] as const,

  /** Bookings (scoped to site and user/email). */
  bookings: (siteId: string = ENV.siteId, userOrEmail?: string) =>
    userOrEmail
      ? (['bookings', toCanonicalSiteId(siteId), userOrEmail] as const)
      : (['bookings', toCanonicalSiteId(siteId)] as const),

  /** Single booking. */
  booking: (siteId: string = ENV.siteId, bookingId?: string) =>
    ['booking', toCanonicalSiteId(siteId), String(bookingId ?? '')] as const,

  /** Admin analytics. */
  analytics: (siteId: string = ENV.siteId) => ['analytics', toCanonicalSiteId(siteId)] as const,

  /** Admin users list. */
  users: (siteId: string = ENV.siteId) => ['users', toCanonicalSiteId(siteId)] as const,
} as const;

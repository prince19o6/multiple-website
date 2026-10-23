/**
 * hooks/useDestinations.ts
 *
 * TanStack Query hook for fetching destinations.
 * Scoped strictly to the active website hostname.
 * Enabled ONLY after the site configuration has loaded.
 */

import { useQuery } from '@tanstack/react-query';
import { fetchDestinations } from '@/lib/api';
import { queryKeys } from '@/store/queryClient';
import { useSite } from '@/store/SiteConfigContext';

export interface DestinationItem {
  id?: string;
  name: string;
  image: string;
  tours: number;
  country?: string;
  description?: string;
}

/** Static fallback destinations — used when the API returns nothing. */
const FALLBACK_DESTINATIONS: DestinationItem[] = [
  { id: '1', name: 'Paris', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop', tours: 12, country: 'France' },
  { id: '2', name: 'Tokyo', image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&h=400&fit=crop', tours: 8, country: 'Japan' },
  { id: '3', name: 'New York', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&h=400&fit=crop', tours: 9, country: 'USA' },
  { id: '4', name: 'Dubai', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&h=400&fit=crop', tours: 14, country: 'UAE' },
  { id: '5', name: 'London', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&h=400&fit=crop', tours: 11, country: 'UK' },
  { id: '6', name: 'Rome', image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&h=400&fit=crop', tours: 7, country: 'Italy' },
  { id: '7', name: 'Singapore', image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&h=400&fit=crop', tours: 10, country: 'Singapore' },
  { id: '8', name: 'Bangkok', image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&h=400&fit=crop', tours: 16, country: 'Thailand' },
  { id: '9', name: 'Barcelona', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&h=400&fit=crop', tours: 6, country: 'Spain' },
  { id: '10', name: 'Sydney', image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=600&h=400&fit=crop', tours: 8, country: 'Australia' },
];

export interface UseDestinationsResult {
  destinations: DestinationItem[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetch destinations for the active site.
 * Enabled only after the site config has loaded.
 */
export function useDestinations(overrideHostname?: string): UseDestinationsResult {
  const { isLoaded, hostname: currentHostname, siteId } = useSite();
  const activeHostname = overrideHostname || currentHostname;

  const query = useQuery<DestinationItem[], Error>({
    queryKey: queryKeys.destinations(siteId, activeHostname),
    queryFn: async () => {
      const result = await fetchDestinations(siteId);
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        return result.data as DestinationItem[];
      }
      return FALLBACK_DESTINATIONS;
    },
    // Requirement: Queries enabled ONLY after the site config has loaded
    enabled: isLoaded && !!activeHostname,
    staleTime: 5 * 60 * 1000,
    placeholderData: FALLBACK_DESTINATIONS,
  });

  return {
    destinations: query.data ?? FALLBACK_DESTINATIONS,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ?? null,
    refetch: query.refetch,
  };
}

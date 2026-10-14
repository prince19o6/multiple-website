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
  { id: '2', name: 'Tokyo', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=400&fit=crop', tours: 8, country: 'Japan' },
  { id: '3', name: 'Bali', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&h=400&fit=crop', tours: 15, country: 'Indonesia' },
  { id: '4', name: 'Santorini', image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&h=400&fit=crop', tours: 6, country: 'Greece' },
  { id: '5', name: 'Maldives', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop', tours: 10, country: 'Maldives' },
  { id: '6', name: 'Everest Region', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&h=400&fit=crop', tours: 7, country: 'Nepal' },
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

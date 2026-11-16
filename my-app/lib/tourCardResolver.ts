/**
 * lib/tourCardResolver.ts
 *
 * Resolves which card design variant to use ('standard' | 'adventure' | 'luxury')
 * purely from the typed SiteConfig or API response, eliminating hardcoded siteId checks.
 */

import type { SiteConfig } from '@/lib/config/siteConfigSchema';

export type TourCardVariant = 'standard' | 'adventure' | 'luxury';

export function resolveTourCardVariant(config?: SiteConfig | any): TourCardVariant {
  if (!config) return 'standard';

  // 1. Direct layout card variant from typed SiteConfig
  const layoutVariant = config?.layout?.cardVariant;
  if (layoutVariant === 'adventure') return 'adventure';
  if (layoutVariant === 'luxury') return 'luxury';
  if (layoutVariant === 'standard') return 'standard';

  // 2. Legacy API tourCard layout property
  const cardLayout = (config as any)?.tourCard?.layout;
  if (cardLayout === 'image-overlay') return 'adventure';
  if (cardLayout === 'luxury') return 'luxury';

  // 3. Components tree variant (home or listing)
  const homeTour = config?.components?.home?.find(
    (c: any) => c.type === 'tourCarousel' || c.type === 'tours'
  );
  if (homeTour?.variant === 'overlay') return 'adventure';
  if (homeTour?.variant === 'minimal') return 'luxury';

  const listingTour = config?.components?.listing?.find(
    (c: any) => c.type === 'tours' || c.type === 'listing'
  );
  if (listingTour?.variant === 'overlay' || listingTour?.variant === 'adventure') return 'adventure';
  if (listingTour?.variant === 'luxury') return 'luxury';

  // 4. Default standard variant
  return 'standard';
}


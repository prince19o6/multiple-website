/**
 * constants/homeSections.ts
 *
 * Section registry for the dynamic multi-tenant Home screen.
 * Config-driven: Allows GujjuTours, TripGoAsia, and Technoheaven to define
 * which sections are enabled, their visual order, and item limits.
 */

import type { MergedWebsiteConfig } from '@/lib/mergeWebsiteConfig';

export type HomeSectionId =
  | 'categories'
  | 'featuredTours'
  | 'destinations'
  | 'offers'
  | 'personalized'
  | 'moreForYou';

export interface HomeSection {
  id: HomeSectionId;
  title: string;
  subtitle?: string;
  maxItems: number;
  viewMoreTarget?: string;
  collapsedByDefault: boolean;
  visibleWhenEmpty: boolean;
  category: 'core' | 'discovery' | 'personalized' | 'more';
}

/**
 * Built-in default section registry.
 * Guarantees optimal scanability and high-conversion discovery:
 *   1. Categories (horizontal chips)
 *   2. Featured Expeditions (max 5 cards, "See all" -> /featured-tours)
 *   3. Popular Destinations (max 6 cards, "See all" -> /destinations)
 *   4. Special Offers (1 promo card, "View more" -> /special-offers)
 *   5. Personalized Block (Countdown + Recently Viewed, hidden when empty)
 *   6. More for You (Collapsible accordion: Culinary, Culture, Reviews, Support)
 */
export const DEFAULT_HOME_SECTIONS: HomeSection[] = [
  {
    id: 'categories',
    title: 'Travel Styles',
    subtitle: 'Filter experiences by your preferred pace',
    maxItems: 8,
    viewMoreTarget: '/(tabs)/explore',
    collapsedByDefault: false,
    visibleWhenEmpty: true,
    category: 'core',
  },
  {
    id: 'featuredTours',
    title: 'Featured Expeditions',
    subtitle: 'Hand-picked itineraries with highest traveler ratings',
    maxItems: 5,
    viewMoreTarget: '/featured-tours',
    collapsedByDefault: false,
    visibleWhenEmpty: false,
    category: 'discovery',
  },
  {
    id: 'destinations',
    title: 'Trending Destinations',
    subtitle: 'Explore authentic locations curated for you',
    maxItems: 10,
    viewMoreTarget: '/destinations',
    collapsedByDefault: false,
    visibleWhenEmpty: false,
    category: 'discovery',
  },
  {
    id: 'offers',
    title: 'Exclusive Travel Deals',
    subtitle: 'Limited-time seasonal packages and member discounts',
    maxItems: 1,
    viewMoreTarget: '/special-offers',
    collapsedByDefault: false,
    visibleWhenEmpty: false,
    category: 'discovery',
  },
  {
    id: 'personalized',
    title: 'Your Expeditions',
    subtitle: 'Active bookings and recently viewed itineraries',
    maxItems: 4,
    viewMoreTarget: '/(tabs)/bookings',
    collapsedByDefault: false,
    visibleWhenEmpty: false, // Hidden completely when user has no bookings or history
    category: 'personalized',
  },
  {
    id: 'moreForYou',
    title: 'Travel Guides & Local Lore',
    subtitle: 'Culinary trails, temple decorum, transit maps and audio stories',
    maxItems: 4,
    viewMoreTarget: undefined,
    collapsedByDefault: false,
    visibleWhenEmpty: true,
    category: 'more',
  },
];

/**
 * Resolves the active home sections list taking into account
 * website-specific baseline configs and dynamic backend website modules.
 */
export function resolveHomeSections(
  config?: MergedWebsiteConfig | null,
  websiteModules?: Array<{ serviceCode?: string; displayOrder?: number }> | null
): HomeSection[] {
  // If baseline config provides custom homeSections order, adapt defaults
  const customOrder = config?.homeSections;
  if (!Array.isArray(customOrder) || customOrder.length === 0) {
    return DEFAULT_HOME_SECTIONS;
  }

  // Map known baseline tokens to registry IDs
  const tokenMap: Record<string, HomeSectionId | null> = {
    categories: 'categories',
    activities: 'categories',
    packages: 'categories',
    featuredTours: 'featuredTours',
    destinations: 'destinations',
    offers: 'offers',
    whyChooseUs: 'moreForYou',
    testimonials: 'moreForYou',
    stats: null,
    cta: null,
    hero: null,
  };

  const resolvedIds: HomeSectionId[] = [];
  for (const token of customOrder) {
    const mapped = tokenMap[token];
    if (mapped && !resolvedIds.includes(mapped)) {
      resolvedIds.push(mapped);
    }
  }

  // Ensure core personalized and moreForYou blocks are always included
  if (!resolvedIds.includes('personalized')) {
    resolvedIds.push('personalized');
  }
  if (!resolvedIds.includes('moreForYou')) {
    resolvedIds.push('moreForYou');
  }

  // Return re-ordered sections
  return resolvedIds
    .map((id) => DEFAULT_HOME_SECTIONS.find((s) => s.id === id))
    .filter((s): s is HomeSection => Boolean(s));
}

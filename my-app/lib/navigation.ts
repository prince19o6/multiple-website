/**
 * lib/navigation.ts
 *
 * Canonical routing and deep-link helpers for the multi-website tours platform.
 * Ensures consistent URL formation across all screens (Home, Explore, Wishlist, Categories).
 */

import type { Tour } from '@/types';

/**
 * Builds the canonical href for a tour detail screen.
 * Prioritizes the SEO slug, falls back to MongoDB _id, and lastly numeric id.
 */
export function tourHref(
  tour: Tour | { id?: number | string; slug?: string; _id?: string } | null | undefined
): string {
  if (!tour) return '/tour/1';
  const slug = typeof tour.slug === 'string' ? tour.slug.trim() : '';
  if (slug) {
    return `/tour/${slug}`;
  }
  if (tour._id && typeof tour._id === 'string' && tour._id.trim()) {
    return `/tour/${tour._id.trim()}`;
  }
  const fallbackId = tour.id !== undefined && tour.id !== null ? String(tour.id).trim() : '1';
  return `/tour/${fallbackId || '1'}`;
}

// lib/imageUtils.ts
// Standard fallbacks and utilities for robust image handling across the website.

export const FALLBACK_TOUR_IMAGE =
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&h=800&fit=crop";

export const FALLBACK_IMAGES_BY_CATEGORY: Record<string, string> = {
  mountains: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&h=800&fit=crop",
  beach: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=800&fit=crop",
  city: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&h=800&fit=crop",
  wildlife: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1200&h=800&fit=crop",
};

/**
 * Event handler for <img> onError to smoothly replace broken URLs with a verified photo.
 */
export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallback: string = FALLBACK_TOUR_IMAGE
) {
  const img = e.currentTarget;
  // Prevent infinite loop if fallback fails
  img.onerror = null;
  img.src = fallback;
}

/**
 * Returns all unique images for a tour (combining cover image and gallery).
 */
export function getAllTourImages(tour?: {
  image?: string;
  gallery?: string[];
}): string[] {
  if (!tour) return [FALLBACK_TOUR_IMAGE];

  const images: string[] = [];
  if (tour.image && tour.image.trim()) {
    images.push(tour.image.trim());
  }

  if (Array.isArray(tour.gallery)) {
    for (const g of tour.gallery) {
      if (g && g.trim() && !images.includes(g.trim())) {
        images.push(g.trim());
      }
    }
  }

  return images.length > 0 ? images : [FALLBACK_TOUR_IMAGE];
}

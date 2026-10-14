/**
 * lib/imageUtils.ts
 *
 * Image URL helpers and placeholders for Expo mobile client.
 * Provides safe URL normalization, blurhashes, and relative-to-absolute resolution.
 */

import { ENV } from '@/src/config/env';

/**
 * Neutral blurhash for placeholder background rendering in light & dark mode.
 */
export const DEFAULT_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';
export const DARK_BLURHASH = 'L12?wf9F00~q_3of9Fay00fQ00ay';

/**
 * Fallback placeholder image URL (reliable Unsplash travel hero image).
 */
export const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=500&fit=crop';

export const PLACEHOLDER_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop';

/**
 * Resolves a raw image URL.
 * If the URL is relative (e.g. "/uploads/tours/tokyo.jpg"), prepends the backend API base.
 * Returns null if the URL is empty or null.
 */
export function resolveImageUrl(
  url: string | null | undefined,
  customBaseUrl?: string
): string | null {
  if (!url || typeof url !== 'string') return null;
  let trimmed = url.trim();
  if (!trimmed) return null;

  // Gracefully remap known unavailable Unsplash IDs to active working travel images
  if (trimmed.includes('photo-1540959375944')) {
    trimmed = trimmed.replace(/photo-1540959375944[a-zA-Z0-9-]*/g, 'photo-1503899036084-c55cdd92da26');
  }

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  const base = (customBaseUrl || ENV.apiUrl || '').replace(/\/+$/, '');
  if (!base) return trimmed;

  return `${base}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}

/**
 * Ensures a URL is absolute.
 */
export function ensureAbsoluteUrl(url: string | null | undefined): string | null {
  return resolveImageUrl(url);
}

/**
 * Picks the best available image from a list of candidates.
 * Returns null when none are usable.
 */
export function pickBestImage(...candidates: (string | null | undefined)[]): string | null {
  for (const c of candidates) {
    const url = resolveImageUrl(c);
    if (url) return url;
  }
  return null;
}

/**
 * Appends width/height query params to an Unsplash URL for optimal loading.
 * Safe to call with non-Unsplash URLs (returns unchanged).
 */
export function unsplashSized(url: string, width: number, height: number): string {
  if (!url || typeof url !== 'string' || !url.includes('unsplash.com')) return url;
  try {
    const u = new URL(url);
    u.searchParams.set('w', String(width));
    u.searchParams.set('h', String(height));
    u.searchParams.set('fit', 'crop');
    return u.toString();
  } catch {
    return url;
  }
}

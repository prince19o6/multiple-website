/**
 * lib/assetResolver.ts
 *
 * Ported from web/lib/assetResolver.ts.
 * Resolves logo URLs from the external config API website object.
 * Zero web dependencies.
 */

import type { ApiWebsite } from './siteConfig';

/**
 * Tries multiple fields from the `website` object to find a usable logo URL.
 * Returns null when nothing useful is found.
 */
export const CANONICAL_LOGOS: Record<string, string> = {
  gujjutours: 'https://d3bfv5x1dw8ekm.cloudfront.net/uploads/a29cd3ee-d050-a34a-3a53-3a20e4faf5f3/WebsiteMaster/headerLogoId/b65b72be-af9b-4f86-90b8-3d6d835af691_gujju-logo.svg',
  website1: 'https://d3bfv5x1dw8ekm.cloudfront.net/uploads/a29cd3ee-d050-a34a-3a53-3a20e4faf5f3/WebsiteMaster/headerLogoId/b65b72be-af9b-4f86-90b8-3d6d835af691_gujju-logo.svg',
  'travelexplorer.com': 'https://d3bfv5x1dw8ekm.cloudfront.net/uploads/a29cd3ee-d050-a34a-3a53-3a20e4faf5f3/WebsiteMaster/headerLogoId/b65b72be-af9b-4f86-90b8-3d6d835af691_gujju-logo.svg',

  tripgoasia: 'https://d21bqxhdty55n7.cloudfront.net/uploads/fd63c771-6a91-924c-ae5c-3a1fa5fca46b/WebsiteMaster/headerLogoId/237a7ac1-5310-4d08-8990-5e0e72f048f8_logo.svg',
  website2: 'https://d21bqxhdty55n7.cloudfront.net/uploads/fd63c771-6a91-924c-ae5c-3a1fa5fca46b/WebsiteMaster/headerLogoId/237a7ac1-5310-4d08-8990-5e0e72f048f8_logo.svg',
  'adventureworld.com': 'https://d21bqxhdty55n7.cloudfront.net/uploads/fd63c771-6a91-924c-ae5c-3a1fa5fca46b/WebsiteMaster/headerLogoId/237a7ac1-5310-4d08-8990-5e0e72f048f8_logo.svg',

  technoheaven: 'https://stagingimage.technoheaven.com/uploads/2d10d5d6-5278-817d-ddf1-3a2036a6c997/WebsiteMaster/headerLogoId/1f5bdd1e-28e7-4e96-8977-82f6b3cb4a7e_technologomain.svg',
  website3: 'https://stagingimage.technoheaven.com/uploads/2d10d5d6-5278-817d-ddf1-3a2036a6c997/WebsiteMaster/headerLogoId/1f5bdd1e-28e7-4e96-8977-82f6b3cb4a7e_technologomain.svg',
  'holidayparadise.com': 'https://stagingimage.technoheaven.com/uploads/2d10d5d6-5278-817d-ddf1-3a2036a6c997/WebsiteMaster/headerLogoId/1f5bdd1e-28e7-4e96-8977-82f6b3cb4a7e_technologomain.svg',
};

export const CANONICAL_DARK_LOGOS: Record<string, string> = {
  gujjutours: 'https://d3bfv5x1dw8ekm.cloudfront.net/uploads/a29cd3ee-d050-a34a-3a53-3a20e4faf5f3/WebsiteMaster/darkThemeLogoId/eb77835f-720f-4ae0-b7c9-44bfb331a42a_gujju-logo.svg',
  website1: 'https://d3bfv5x1dw8ekm.cloudfront.net/uploads/a29cd3ee-d050-a34a-3a53-3a20e4faf5f3/WebsiteMaster/darkThemeLogoId/eb77835f-720f-4ae0-b7c9-44bfb331a42a_gujju-logo.svg',
  tripgoasia: 'https://d21bqxhdty55n7.cloudfront.net/uploads/fd63c771-6a91-924c-ae5c-3a1fa5fca46b/WebsiteMaster/darkThemeLogoId/70eb388a-e44c-4302-af0d-4c0e03f7fee1_White-Logo.svg',
  website2: 'https://d21bqxhdty55n7.cloudfront.net/uploads/fd63c771-6a91-924c-ae5c-3a1fa5fca46b/WebsiteMaster/darkThemeLogoId/70eb388a-e44c-4302-af0d-4c0e03f7fee1_White-Logo.svg',
  technoheaven: 'https://stagingimage.technoheaven.com/uploads/2d10d5d6-5278-817d-ddf1-3a2036a6c997/WebsiteMaster/darkThemeLogoId/8329a5dc-5c1a-44d8-a9e7-4e62993dd29b_technologomain.svg',
  website3: 'https://stagingimage.technoheaven.com/uploads/2d10d5d6-5278-817d-ddf1-3a2036a6c997/WebsiteMaster/darkThemeLogoId/8329a5dc-5c1a-44d8-a9e7-4e62993dd29b_technologomain.svg',
};

/**
 * Tries multiple fields from the `website` object to find a usable logo URL.
 * Falls back to canonical tenant logo if nothing is found.
 */
export function resolveLogoFromWebsite(
  website: any,
  fallbackKey: string | null = null,
  isDark: boolean = false
): string | null {
  const defaultFallback = fallbackKey
    ? (isDark ? CANONICAL_DARK_LOGOS[fallbackKey] : null) || CANONICAL_LOGOS[fallbackKey] || null
    : null;

  if (!website) return defaultFallback;

  // Dark mode logo preference
  if (isDark && typeof website.darkThemeLogoPath === 'string' && website.darkThemeLogoPath.trim()) {
    const rawDark = website.darkThemeLogoPath.trim();
    if (rawDark.startsWith('http://') || rawDark.startsWith('https://')) return rawDark;
    const base = website.staticPath || website.serviceImageCdnPath || '';
    if (base) return `${base.replace(/\/?$/, '/')}${rawDark.replace(/^\//, '')}`;
  }

  // Explicit logoUrl
  if (typeof website.logoUrl === 'string' && website.logoUrl.trim()) {
    const rawLogo = website.logoUrl.trim();
    if (rawLogo.startsWith('http://') || rawLogo.startsWith('https://')) return rawLogo;
  }

  // Check headerLogoId, faviconImagePath, icon
  const path =
    (typeof website.headerLogoId === 'string' && website.headerLogoId) ||
    (typeof website.faviconImagePath === 'string' && website.faviconImagePath) ||
    (typeof website.icon === 'string' && website.icon) ||
    null;

  if (!path) return defaultFallback;

  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:')
  ) {
    return path;
  }

  const base =
    (typeof website.staticPath === 'string' && website.staticPath) ||
    (typeof website.serviceImageCdnPath === 'string' &&
      `${website.serviceImageCdnPath}/uploads/`) ||
    '';

  if (!base) return defaultFallback;
  return `${base.replace(/\/?$/, '/')}${path.replace(/^\//, '')}`;
}

/**
 * components/common/BrandLogo.tsx
 *
 * Universal Brand Logo component for the ToursApp platform.
 *
 * Capabilities:
 * - Reads logo dynamically from useSite() (SiteProvider).
 * - Theme-aware: picks darkLogoUrl when in dark mode (with graceful fallback to light logo).
 * - Resolves relative URLs against CDN static path or API base URL.
 * - Powered by expo-image: memory-disk caching, smooth fade-in, contentFit="contain".
 * - Prefetches logo on mount for instant rendering across all screens.
 * - Fixed aspect ratio & dimensions so screen headers never shift or jitter.
 * - High-end visual fallback: renders a branded monogram emblem with tenant icon,
 *   crisp brand typography, and verified tag if the logo fails to load or is missing.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useSite } from '@/store/SiteConfigContext';
import { useColors, useIsDark } from '@/store/ThemeContext';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';
import { CANONICAL_LOGOS, CANONICAL_DARK_LOGOS } from '@/lib/assetResolver';
import { ENV } from '@/src/config/env';

const GUJJU_EMBLEM_IMAGE = require('@/assets/brand-emblem-gujjutours.png');

export interface BrandLogoProps {
  /** Size preset or numeric height */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Explicit custom width */
  width?: number;
  /** Explicit custom height */
  height?: number;
  /** Whether to render styled site name text fallback on error or missing URL */
  showTextFallback?: boolean;
  /** Alignment within container */
  align?: 'left' | 'center' | 'right';
  /** Optional custom container style */
  style?: StyleProp<ViewStyle>;
  /** Force dark mode logo variant */
  forceDark?: boolean;
  /** Force light mode logo variant */
  forceLight?: boolean;
  /** Whether to show small tagline under brand title */
  showTagline?: boolean;
}

export default function BrandLogo({
  size = 'md',
  width: customWidth,
  height: customHeight,
  showTextFallback = true,
  align = 'left',
  style,
  forceDark = false,
  forceLight = false,
  showTagline = true,
}: BrandLogoProps) {
  const { logoUrl, darkLogoUrl, siteName, siteId, config } = useSite();
  const colors = useColors();
  const isDark = useIsDark();
  const headingFontFamily = getHeadingFontFamily(config);

  const useDarkVariant = forceDark ? true : forceLight ? false : isDark;

  // 1. Pick candidate logo URL
  const candidate = useDarkVariant
    ? (darkLogoUrl || logoUrl || CANONICAL_DARK_LOGOS[siteId] || CANONICAL_LOGOS[siteId] || null)
    : (logoUrl || CANONICAL_LOGOS[siteId] || null);

  // 2. Resolve relative URL against CDN / API base if necessary
  let resolvedUrl: string | null = candidate;
  if (
    resolvedUrl &&
    !resolvedUrl.startsWith('http://') &&
    !resolvedUrl.startsWith('https://') &&
    !resolvedUrl.startsWith('data:')
  ) {
    const staticBase = (config as { website?: { staticPath?: string } })?.website?.staticPath || ENV.apiUrl;
    resolvedUrl = `${staticBase.replace(/\/+$/, '')}/${resolvedUrl.replace(/^\/+/, '')}`;
  }

  const [prevUrl, setPrevUrl] = useState<string | null>(resolvedUrl);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (prevUrl !== resolvedUrl) {
    setPrevUrl(resolvedUrl);
    setHasError(false);
    setIsLoading(true);
  }

  // 3. Prefetch on mount or when URL changes
  useEffect(() => {
    if (resolvedUrl) {
      Image.prefetch(resolvedUrl).catch(() => {});
    }
  }, [resolvedUrl]);

  // 4. Compute width & height
  let h = 38;
  let w = customWidth || 140;

  if (customHeight) {
    h = customHeight;
    if (!customWidth) w = customHeight * 3.5;
  } else if (typeof size === 'number') {
    h = size;
    if (!customWidth) w = size * 3.5;
  } else {
    switch (size) {
      case 'xs':
        h = 24;
        w = customWidth || 88;
        break;
      case 'sm':
        h = 30;
        w = customWidth || 110;
        break;
      case 'md':
        h = 38;
        w = customWidth || 140;
        break;
      case 'lg':
        h = 46;
        w = customWidth || 170;
        break;
      case 'xl':
        h = 56;
        w = customWidth || 210;
        break;
    }
  }

  const containerAlign =
    align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';

  // Site emblem emoji & tagline from config
  const siteIcon = (config as any)?.icon || (config as any)?.site?.icon || '✈️';
  const brandInitial =
    siteId === 'gujjutours' || siteName?.toLowerCase().includes('gujju')
      ? 'G'
      : siteId === 'tripgoasia' || siteName?.toLowerCase().includes('tripgo')
        ? 'T'
        : siteId === 'technoheaven' || siteName?.toLowerCase().includes('techno')
          ? 'T'
          : siteName?.trim().charAt(0).toUpperCase() || 'G';
  const siteTagline =
    (config as any)?.tagline ||
    (config as any)?.seo?.defaultTitle ||
    (config as any)?.description ||
    siteName ||
    'Travel Beyond Boundaries';

  // Fallback: If no URL or failed to load, show premium branded monogram emblem
  if (!resolvedUrl || hasError) {
    if (!showTextFallback) return null;
    return (
      <View
        style={[
          styles.textFallbackBox,
          { height: h, justifyContent: containerAlign },
          style,
        ]}
        accessibilityRole="image"
        accessibilityLabel={`${siteName} brand`}
      >
        <View style={styles.emblemBadge}>
          <Image
            source={GUJJU_EMBLEM_IMAGE}
            style={styles.emblemImage}
            contentFit="contain"
          />
        </View>
        <View style={styles.brandTextGroup}>
          <Text
            style={[
              styles.brandText,
              { color: colors.heading, fontFamily: headingFontFamily },
            ]}
            numberOfLines={1}
          >
            {siteName || 'ToursApp'}
          </Text>
          {showTagline && h >= 32 && (
            <Text style={[styles.brandTagline, { color: colors.mutedText }]} numberOfLines={1}>
              {siteTagline}
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { height: h, width: w, alignItems: containerAlign },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={`${siteName} logo`}
    >
      <Image
        source={{ uri: resolvedUrl }}
        style={styles.image}
        contentFit="contain"
        transition={250}
        cachePolicy="memory-disk"
        onLoad={() => setIsLoading(false)}
        onError={(err) => {
          console.warn(`[DEBUG] [BrandLogo] Failed loading logo for "${siteId}" from: ${resolvedUrl}`, err);
          setHasError(true);
          setIsLoading(false);
        }}
      />
      {isLoading && (
        <View
          style={[
            styles.skeletonBox,
            {
              backgroundColor: `${colors.border}35`,
              width: w,
              height: h,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  skeletonBox: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    opacity: 0.6,
  },
  textFallbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emblemBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemImage: {
    width: 34,
    height: 34,
    borderRadius: 8,
  },
  brandTextGroup: {
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 20,
  },
  brandTagline: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
    letterSpacing: -0.1,
  },
});

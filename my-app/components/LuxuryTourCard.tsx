/**
 * components/LuxuryTourCard.tsx
 *
 * Holiday Paradise (website3) tour card — elegant editorial layout driven
 * by website3's tourCard config. Refined border, serif headings, gold accents,
 * and luxury typography.
 *
 * Enhancements:
 * - Powered by expo-image with blurhash placeholder and transition.
 * - Resolves relative image URLs against API base.
 * - Dark-mode safe: container background uses surface, no hardcoded peach-gray.
 * - Theme-aware error state with [DEBUG] warning on load failure.
 */

import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { useCurrency } from '@/context/CurrencyContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { resolveImageUrl, getActualImageUrl, PLACEHOLDER_IMAGE, DEFAULT_BLURHASH } from '@/lib/imageUtils';
import * as Haptics from 'expo-haptics';
import { useWishlist } from '@/context/WishlistContext';

export interface LuxuryTourCardProps {
  id?: number | string;
  name: string;
  description: string;
  price: number;
  rating: number;
  image: string;
  duration: string;
  location?: string;
  onBook: () => void;
  onPress?: () => void;
  isWishlisted?: boolean;
  onToggleWishlist?: () => void;
  tourCardConfig?: {
    bookButtonText?: string;
    pricePrefix?: string;
    currency?: string;
    badge?: { enabled?: boolean; text?: string };
  };
  theme?: {
    primary?: string;
    accent?: string;
    heading?: string;
    mutedText?: string;
    border?: string;
    surface?: string;
  };
  headingFontFamily?: string;
}

export default function LuxuryTourCard({
  id,
  name,
  description,
  price,
  rating,
  image,
  duration,
  location,
  onBook,
  onPress,
  isWishlisted,
  onToggleWishlist,
  tourCardConfig = {},
  theme = {},
  headingFontFamily = 'Playfair Display',
}: LuxuryTourCardProps) {
  const globalColors = useColors();
  const { formatPrice } = useCurrency();
  const { isWishlisted: checkWishlist, toggleWishlist: defaultToggle } = useWishlist();
  const [imgError, setImgError] = useState(false);

  const itemIdentifier = id !== undefined && id !== null && String(id).trim() !== '' ? id : name;
  const isSaved = isWishlisted !== undefined
    ? isWishlisted
    : Boolean(
        checkWishlist(itemIdentifier) ||
        (name && checkWishlist(name)) ||
        (id !== undefined && checkWishlist(id))
      );

  const lastWishlistPressRef = useRef<number>(0);

  const handleToggleWishlist = () => {
    lastWishlistPressRef.current = Date.now();
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    if (onToggleWishlist) {
      onToggleWishlist();
    } else if (itemIdentifier) {
      defaultToggle(
        itemIdentifier,
        {
          id: itemIdentifier,
          name,
          title: name,
          description,
          price,
          rating,
          image,
          imageUrl: image,
          duration,
          location,
          module: 'tours',
        },
        'tours'
      );
    }
  };

  const badgeEnabled = tourCardConfig.badge?.enabled !== false;
  const badgeText = tourCardConfig.badge?.text || 'Luxury Escape';
  const bookText = tourCardConfig.bookButtonText || 'Reserve Package';
  const pricePrefix = tourCardConfig.pricePrefix || 'Package from';
  const currency = tourCardConfig.currency || '$';

  const primary = theme.primary || globalColors.primary || '#dc2626';
  const accent = theme.accent || globalColors.accent || '#d4af37';
  const heading = theme.heading || globalColors.heading || '#27120f';
  const muted = theme.mutedText || globalColors.mutedText || '#71717a';
  const border = theme.border || globalColors.border || '#e4d4cf';
  const surface = theme.surface || globalColors.surface || '#ffffff';

  const fallbackUrl = getActualImageUrl(null, { module: 'tours', title: name, city: location });
  const resolvedUrl = resolveImageUrl(image, undefined, { module: 'tours', title: name, city: location }) || fallbackUrl;

  const handleImageError = () => {
    if (__DEV__) {
      console.log(
        `[DEBUG] [LuxuryTourCard] Image failed to load for tour #${id ?? name}: "${image}"`
      );
    }
    setImgError(true);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: surface,
          borderColor: border,
        },
      ]}
    >
      <TouchableOpacity testID="btn-press"
        activeOpacity={0.92}
        onPress={() => {
          if (Date.now() - lastWishlistPressRef.current < 600) return;
          if (onPress) onPress();
          else if (onBook) onBook();
        }}
        accessibilityLabel={`Luxury tour ${name}, package from ${formatPrice(price)}`}
        accessibilityHint="Tap to view package details"
        role={Platform.OS === 'web' ? 'article' : undefined}
        accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
      >
        {/* ─── Top Image Container ─── */}
        <View style={[styles.imageContainer, { backgroundColor: surface }]}>
          {imgError ? (
            <View style={[styles.fallbackContainer, { backgroundColor: `${accent}15` }]}>
              <Ionicons name="sparkles-outline" size={36} color={accent} />
              <Text style={[styles.fallbackText, { color: muted }]}>Curated Imagery Unavailable</Text>
            </View>
          ) : (
            <Image
              source={{ uri: resolvedUrl }}
              style={styles.image}
              contentFit="cover"
              transition={300}
              cachePolicy="memory-disk"
              recyclingKey={resolvedUrl}
              placeholder={{ blurhash: DEFAULT_BLURHASH }}
              onError={handleImageError}
            />
          )}
          {badgeEnabled && (
            <View style={[styles.goldBadge, { backgroundColor: accent }]}>
              <Text style={styles.goldBadgeText}>{badgeText}</Text>
            </View>
          )}

          {/* Wishlist Button on top-right */}
          <TouchableOpacity testID="btn-luxurytourcard-159"
            style={styles.wishlistBtn}
            onPress={(e) => {
              lastWishlistPressRef.current = Date.now();
              if (e && e.stopPropagation) e.stopPropagation();
              handleToggleWishlist();
            }}
            {...(Platform.OS === 'web' ? {
              onClick: (e: any) => { if (e && e.stopPropagation) e.stopPropagation(); },
              onPointerDown: (e: any) => { if (e && e.stopPropagation) e.stopPropagation(); },
            } : {})}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
          >
            <Ionicons
              name={isSaved ? 'heart' : 'heart-outline'}
              size={19}
              color={isSaved ? '#ef4444' : '#ffffff'}
            />
          </TouchableOpacity>
        </View>

        {/* ─── Editorial Content Top ─── */}
        <View style={styles.topContent}>
          {/* Meta Header */}
          <View style={styles.metaRow}>
            {location ? (
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={13} color={muted} />
                <Text style={[styles.locationText, { color: muted }]}>{location}</Text>
              </View>
            ) : (
              <View />
            )}
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={13} color={accent} />
              <Text style={[styles.ratingText, { color: accent }]}>{rating.toFixed(1)}</Text>
            </View>
          </View>

          {/* Title in Serif Font */}
          <Text
            numberOfLines={2}
            style={[
              styles.title,
              {
                color: heading,
                fontFamily: headingFontFamily,
              },
            ]}
          >
            {name}
          </Text>

          <Text
            numberOfLines={2}
            style={[styles.description, { color: muted }]}
          >
            {description}
          </Text>

          <View style={[styles.divider, { borderBottomColor: border }]}>
            <Text style={[styles.durationText, { color: muted }]}>⏱ {duration}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* ─── Footer with Sibling Touchables ─── */}
      <View style={styles.footer}>
        <TouchableOpacity testID="btn-press"
          onPress={onPress ?? onBook}
          activeOpacity={0.92}
          style={styles.priceContainer}
          accessibilityRole="button"
          accessibilityLabel={`Price ${formatPrice(price)}`}
        >
          <Text style={[styles.pricePrefix, { color: muted }]}>{pricePrefix}</Text>
          <Text style={[styles.price, { color: heading }]}>
            {formatPrice(price)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity testID="btn-book"
          style={[styles.reserveButton, { backgroundColor: primary }]}
          onPress={onBook}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`Reserve ${name}`}
        >
          <Text style={styles.reserveButtonText}>{bookText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export const MemoizedLuxuryTourCard = React.memo(LuxuryTourCard);

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    ...SHADOW.sm,
  },
  imageContainer: {
    height: 220,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  fallbackText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  goldBadge: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderRadius: RADIUS.none,
  },
  goldBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  wishlistBtn: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  topContent: {
    paddingHorizontal: SPACING.md + 2,
    paddingTop: SPACING.md + 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationText: {
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: FONT_SIZE.xl,
    lineHeight: 26,
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: FONT_SIZE.sm - 1,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md + 2,
    paddingBottom: SPACING.md + 2,
  },
  priceContainer: {
    flex: 1,
  },
  pricePrefix: {
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  price: {
    fontSize: FONT_SIZE.lg + 2,
    fontWeight: '700',
  },
  reserveButton: {
    paddingHorizontal: SPACING.md + 2,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.none,
    minHeight: 44,
    justifyContent: 'center',
  },
  reserveButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});

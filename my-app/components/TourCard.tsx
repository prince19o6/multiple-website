/**
 * components/TourCard.tsx
 *
 * Travel Explorer (website1) default tour card.
 * Modern, clean travel card with expo-image, rating badge, quick info, and booking button.
 *
 * Enhancements:
 * - Powered by expo-image with blurhash placeholder and 300ms fade transition.
 * - Resolves relative image URLs against API base.
 * - Dark-mode safe: container background matches colors.surface, no hardcoded light gray.
 * - Theme-aware fallback icon view with [DEBUG] warning when image fails to load.
 */

import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useIsDark } from '@/store/ThemeContext';
import { useCurrency } from '@/context/CurrencyContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { resolveImageUrl, getActualImageUrl, PLACEHOLDER_IMAGE, DEFAULT_BLURHASH, DARK_BLURHASH } from '@/lib/imageUtils';
import * as Haptics from 'expo-haptics';
import { useWishlist } from '@/context/WishlistContext';

export interface TourCardProps {
  id?: number | string;
  name: string;
  description: string;
  price: number;
  rating: number;
  image: string;
  duration: string;
  difficulty: string;
  location?: string;
  onBook: () => void;
  onPress?: () => void;
  isWishlisted?: boolean;
  onToggleWishlist?: () => void;
}

export default function TourCard({
  id,
  name,
  description,
  price,
  rating,
  image,
  duration,
  difficulty,
  location,
  onBook,
  onPress,
  isWishlisted,
  onToggleWishlist,
}: TourCardProps) {
  const colors = useColors();
  const isDark = useIsDark();
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
          difficulty,
          location,
          module: 'tours',
        },
        'tours'
      );
    }
  };

  const fallbackUrl = getActualImageUrl(null, { module: 'tours', title: name, city: location });
  const resolvedUrl = resolveImageUrl(image, undefined, { module: 'tours', title: name, city: location }) || fallbackUrl;

  const handleImageError = () => {
    if (__DEV__) {
      console.log(
        `[DEBUG] [TourCard] Image failed to load for tour #${id ?? name}: "${image}" (resolved: "${resolvedUrl}")`
      );
    }
    setImgError(true);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <TouchableOpacity testID="btn-press"
        activeOpacity={0.88}
        onPress={() => {
          if (Date.now() - lastWishlistPressRef.current < 600) return;
          if (onPress) onPress();
          else if (onBook) onBook();
        }}
        accessibilityLabel={`Tour ${name}, price ${formatPrice(price)}, rating ${rating.toFixed(1)} stars`}
        accessibilityHint="Navigates to tour booking and details"
        role={Platform.OS === 'web' ? 'article' : undefined}
        accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
      >
        {/* ─── Image Container with Theme-Aware Placeholder ─── */}
        <View style={[styles.imageContainer, { backgroundColor: isDark ? '#1e293b' : colors.surface }]}>
          {imgError ? (
            <View style={[styles.fallbackContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : `${colors.primary}12` }]}>
              <Ionicons name="image-outline" size={36} color={colors.mutedText} />
              <Text style={[styles.fallbackText, { color: colors.mutedText }]}>Image Unavailable</Text>
            </View>
          ) : (
            <Image
              source={{ uri: resolvedUrl }}
              style={styles.image}
              contentFit="cover"
              transition={300}
              cachePolicy="memory-disk"
              recyclingKey={resolvedUrl}
              placeholder={{ blurhash: isDark ? DARK_BLURHASH : DEFAULT_BLURHASH }}
              onError={handleImageError}
            />
          )}

          {/* Rating Badge on top-left */}
          <View style={[styles.ratingBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="star" size={13} color={colors.primaryContrast} />
            <Text style={[styles.ratingText, { color: colors.primaryContrast }]}>{rating.toFixed(1)}</Text>
          </View>

          {/* Wishlist Button on top-right */}
          <TouchableOpacity testID="btn-tourcard-129"
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

        {/* ─── Upper Content ─── */}
        <View style={styles.topContent}>
          <Text
            numberOfLines={2}
            style={[styles.title, { color: colors.heading }]}
          >
            {name}
          </Text>

          {/* Quick info pills */}
          <View style={styles.metaRow}>
            <View style={[styles.pill, { backgroundColor: `${colors.mutedText}16` }]}>
              <Ionicons name="calendar-outline" size={13} color={colors.mutedText} />
              <Text style={[styles.pillText, { color: colors.mutedText }]}>{duration}</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: `${colors.mutedText}16` }]}>
              <Ionicons name="flash-outline" size={13} color={colors.mutedText} />
              <Text style={[styles.pillText, { color: colors.mutedText }]}>{difficulty}</Text>
            </View>
          </View>

          <Text
            numberOfLines={2}
            style={[styles.description, { color: colors.mutedText }]}
          >
            {description}
          </Text>
        </View>
      </TouchableOpacity>

      {/* ─── Footer with Sibling Touchables ─── */}
      <View style={styles.footer}>
        <TouchableOpacity testID="btn-starting-from"
          onPress={onPress ?? onBook}
          activeOpacity={0.88}
          style={styles.priceContainer}
          accessibilityRole="button"
          accessibilityLabel={`Price ${formatPrice(price)}`}
        >
          <Text style={[styles.pricePrefix, { color: colors.mutedText }]}>Starting from</Text>
          <Text style={[styles.price, { color: colors.primary }]}>
            {formatPrice(price)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity testID="btn-book-now"
          style={[styles.bookButton, { backgroundColor: colors.primary }]}
          onPress={onBook}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`Book ${name}`}
        >
          <Text style={[styles.bookButtonText, { color: colors.primaryContrast }]}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export const MemoizedTourCard = React.memo(TourCard);

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    ...SHADOW.md,
  },
  imageContainer: {
    height: 190,
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
  ratingBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 4,
    zIndex: 5,
  },
  wishlistBtn: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  ratingText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  topContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  metaRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  pillText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  description: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 19,
    marginBottom: SPACING.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    paddingTop: SPACING.xs,
  },
  priceContainer: {
    flex: 1,
  },
  pricePrefix: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  price: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  bookButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm - 2,
    borderRadius: RADIUS.md,
    minHeight: 40,
    justifyContent: 'center',
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
});

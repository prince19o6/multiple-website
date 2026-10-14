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

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useIsDark } from '@/store/ThemeContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { resolveImageUrl, PLACEHOLDER_IMAGE, DEFAULT_BLURHASH, DARK_BLURHASH } from '@/lib/imageUtils';

export interface TourCardProps {
  id?: number | string;
  name: string;
  description: string;
  price: number;
  rating: number;
  image: string;
  duration: string;
  difficulty: string;
  onBook: () => void;
  onPress?: () => void;
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
  onBook,
  onPress,
}: TourCardProps) {
  const colors = useColors();
  const isDark = useIsDark();
  const [imgError, setImgError] = useState(false);

  const resolvedUrl = resolveImageUrl(image) || PLACEHOLDER_IMAGE;

  const handleImageError = () => {
    if (__DEV__) {
      console.log(
        `[DEBUG] [TourCard] Image failed to load for tour #${id ?? name}: "${image}" (resolved: "${resolvedUrl}")`
      );
    }
    setImgError(true);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress ?? onBook}
      accessibilityLabel={`Tour ${name}, price $${price}, rating ${rating.toFixed(1)} stars`}
      accessibilityHint="Navigates to tour booking and details"
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
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

        <View style={[styles.ratingBadge, { backgroundColor: colors.primary }]}>
          <Ionicons name="star" size={13} color="#ffffff" />
          <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
        </View>
      </View>

      {/* ─── Content ─── */}
      <View style={styles.content}>
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

        {/* Footer */}
        <View style={styles.footer}>
          <View>
            <Text style={[styles.pricePrefix, { color: colors.mutedText }]}>Starting from</Text>
            <Text style={[styles.price, { color: colors.primary }]}>
              ${price}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.bookButton, { backgroundColor: colors.primary }]}
            onPress={onBook}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`Book ${name}`}
          >
            <Text style={styles.bookButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
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
    right: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  ratingText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  content: {
    padding: SPACING.md,
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
    marginBottom: SPACING.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.xs,
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

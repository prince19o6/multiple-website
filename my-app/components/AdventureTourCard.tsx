/**
 * components/AdventureTourCard.tsx
 *
 * Adventure World (website2) tour card — image-overlay layout driven by
 * website2's tourCard config. Bold pill buttons, difficulty-colored badges,
 * full-bleed imagery with high-contrast text.
 *
 * Enhancements:
 * - Powered by expo-image with blurhash placeholder and fade transition.
 * - Resolves relative image URLs against API base.
 * - Theme-aware error state with [DEBUG] warning on load failure.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { resolveImageUrl, PLACEHOLDER_IMAGE, DEFAULT_BLURHASH } from '@/lib/imageUtils';

export interface AdventureTourCardProps {
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
  tourCardConfig?: {
    bookButtonText?: string;
    pricePrefix?: string;
    currency?: string;
    badge?: { enabled?: boolean; text?: string };
    difficultyColors?: Record<string, string>;
  };
  theme?: {
    primary?: string;
    accent?: string;
  };
}

export default function AdventureTourCard({
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
  tourCardConfig = {},
  theme = {},
}: AdventureTourCardProps) {
  const globalColors = useColors();
  const [imgError, setImgError] = useState(false);

  const badgeEnabled = tourCardConfig.badge?.enabled !== false;
  const badgeText = tourCardConfig.badge?.text || 'Adventure';
  const bookText = tourCardConfig.bookButtonText || 'JOIN ADVENTURE';
  const pricePrefix = tourCardConfig.pricePrefix || 'Starting';
  const currency = tourCardConfig.currency || '$';
  const accent = theme.accent || globalColors.accent || '#f97316';
  const primary = theme.primary || globalColors.primary || '#16a34a';

  const difficultyColor = tourCardConfig.difficultyColors?.[difficulty] || primary;
  const resolvedUrl = resolveImageUrl(image) || PLACEHOLDER_IMAGE;

  const handleImageError = () => {
    if (__DEV__) {
      console.log(
        `[DEBUG] [AdventureTourCard] Image failed to load for tour #${id ?? name}: "${image}"`
      );
    }
    setImgError(true);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress ?? onBook}
      accessibilityLabel={`Adventure tour ${name}, price ${currency}${price}, rating ${rating.toFixed(1)} stars`}
      accessibilityHint="Tap to join or view adventure"
      style={[styles.card, { backgroundColor: globalColors.surface }]}
    >
      {/* Background Image or Fallback */}
      {imgError ? (
        <View style={[styles.bgImage, styles.fallbackContainer, { backgroundColor: `${primary}20` }]}>
          <Ionicons name="compass-outline" size={48} color={accent} />
          <Text style={[styles.fallbackText, { color: '#ffffff' }]}>Image Unavailable</Text>
        </View>
      ) : (
        <Image
          source={{ uri: resolvedUrl }}
          style={styles.bgImage}
          contentFit="cover"
          transition={300}
          cachePolicy="memory-disk"
          recyclingKey={resolvedUrl}
          placeholder={{ blurhash: DEFAULT_BLURHASH }}
          onError={handleImageError}
        />
      )}

      {/* Dark overlay for contrast */}
      <View style={styles.darkOverlay} />

      {/* Top row: badge + rating */}
      <View style={styles.topRow}>
        {badgeEnabled ? (
          <View style={[styles.badge, { backgroundColor: accent }]}>
            <Text style={styles.badgeText}>🔥 {badgeText}</Text>
          </View>
        ) : (
          <View />
        )}
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={13} color="#f59e0b" />
          <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
        </View>
      </View>

      {/* Bottom info */}
      <View style={styles.bottomContent}>
        <View style={styles.tagsRow}>
          <View style={[styles.difficultyPill, { backgroundColor: difficultyColor }]}>
            <Text style={styles.difficultyText}>{difficulty}</Text>
          </View>
          <View style={styles.durationPill}>
            <Ionicons name="calendar" size={12} color="#ffffffcc" />
            <Text style={styles.durationText}>{duration}</Text>
          </View>
        </View>

        <Text numberOfLines={2} style={styles.title}>
          {name}
        </Text>

        <Text numberOfLines={2} style={styles.description}>
          {description}
        </Text>

        <View style={styles.footerRow}>
          <View>
            <Text style={styles.pricePrefixText}>{pricePrefix}</Text>
            <Text style={styles.priceValueText}>
              {currency}{price}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onBook}
            style={[styles.actionButton, { backgroundColor: accent }]}
          >
            <Text style={styles.actionButtonText}>{bookText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export const MemoizedAdventureTourCard = React.memo(AdventureTourCard);

const styles = StyleSheet.create({
  card: {
    height: 380,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: SPACING.lg,
    ...SHADOW.lg,
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fallbackText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  topRow: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  badge: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.xs - 1,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  ratingText: {
    color: '#111827',
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  difficultyPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  difficultyText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    color: '#ffffffcc',
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    color: '#ffffff',
    fontSize: FONT_SIZE.lg + 2,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  description: {
    color: '#ffffffcc',
    fontSize: FONT_SIZE.xs + 1,
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pricePrefixText: {
    color: '#ffffff99',
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  priceValueText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.xl + 2,
    fontWeight: '900',
  },
  actionButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    minHeight: 44,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.xs,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

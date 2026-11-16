/**
 * components/TourCardHorizontal.tsx
 *
 * Compact horizontal tour card used in featured carousels and discovery lists.
 * Modern native travel card with aspect-ratio expo-image, rating badge, location,
 * duration chip, price tag, and tactile press feedback.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useIsDark } from '@/store/ThemeContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { resolveImageUrl, PLACEHOLDER_IMAGE, DEFAULT_BLURHASH, DARK_BLURHASH } from '@/lib/imageUtils';
import type { Tour } from '@/types';

export interface TourCardHorizontalProps {
  tour: Tour;
  onPress: () => void;
  currency?: string;
}

export default function TourCardHorizontal({
  tour,
  onPress,
  currency = '$',
}: TourCardHorizontalProps) {
  const colors = useColors();
  const isDark = useIsDark();
  const [imgError, setImgError] = useState(false);

  const resolvedUrl = resolveImageUrl(tour.image) || PLACEHOLDER_IMAGE;

  const handleImageError = () => {
    if (__DEV__) {
      console.log(
        `[DEBUG] [TourCardHorizontal] Image failed to load for tour #${tour.id ?? tour.name}: "${tour.image}"`
      );
    }
    setImgError(true);
  };

  return (
    <TouchableOpacity testID="btn-press"
      activeOpacity={0.88}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Featured Tour ${tour.name}, from ${currency}${tour.price}`}
      accessibilityHint="Tap to view tour details"
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      {/* ─── Top Image & Badge ─── */}
      <View style={[styles.imageBox, { backgroundColor: isDark ? '#1e293b' : colors.surface }]}>
        {imgError ? (
          <View style={[styles.fallbackContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : `${colors.primary}12` }]}>
            <Ionicons name="image-outline" size={28} color={colors.mutedText} />
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
          <Ionicons name="star" size={11} color="#ffffff" style={{ marginRight: 2 }} />
          <Text style={styles.ratingText}>{tour.rating ? tour.rating.toFixed(1) : '4.8'}</Text>
        </View>

        {Boolean(tour.duration) ? (
          <View style={styles.durationBadge}>
            <Ionicons name="time-outline" size={11} color="#ffffff" style={{ marginRight: 3 }} />
            <Text style={styles.durationText} numberOfLines={1}>{tour.duration}</Text>
          </View>
        ) : null}
      </View>

      {/* ─── Card Content ─── */}
      <View style={styles.info}>
        {Boolean(tour.location) ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={colors.primary} style={{ marginRight: 3 }} />
            <Text style={[styles.locationText, { color: colors.mutedText }]}>
              {tour.location}
            </Text>
          </View>
        ) : null}

        <Text style={[styles.title, { color: colors.heading }]} numberOfLines={1}>
          {tour.name}
        </Text>

        <Text style={[styles.description, { color: colors.mutedText }]} numberOfLines={2}>
          {tour.description}
        </Text>

        {/* Price & Action */}
        <View style={styles.priceRow}>
          <View>
            <Text style={[styles.fromText, { color: colors.mutedText }]}>From</Text>
            <View style={styles.priceTag}>
              <Text style={[styles.currency, { color: colors.primary }]}>{currency}</Text>
              <Text style={[styles.priceNumber, { color: colors.heading }]}>{tour.price}</Text>
              <Text style={[styles.perPerson, { color: colors.mutedText }]}> /person</Text>
            </View>
          </View>

          <View style={[styles.arrowButton, { backgroundColor: `${colors.primary}18` }]}>
            <Ionicons name="arrow-forward" size={15} color={colors.primary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export const MemoizedTourCardHorizontal = React.memo(TourCardHorizontal);

const styles = StyleSheet.create({
  card: {
    width: 250,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
    marginRight: SPACING.md,
    ...SHADOW.sm,
  },
  imageBox: {
    width: '100%',
    height: 140,
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
  },
  ratingBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  ratingText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  durationText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  info: {
    padding: SPACING.md,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 18,
  },
  description: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: SPACING.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  fromText: {
    fontSize: 9,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  priceTag: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currency: {
    fontSize: 12,
    fontWeight: '800',
    marginRight: 1,
  },
  priceNumber: {
    fontSize: FONT_SIZE.base,
    fontWeight: '800',
  },
  perPerson: {
    fontSize: 10,
  },
  arrowButton: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

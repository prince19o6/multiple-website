/**
 * components/sections/DestinationsSection.tsx
 *
 * Config-driven Destinations section with visual photo cards.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import type { SectionProps } from '@/types';
import { useColors } from '@/store/ThemeContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { PLACEHOLDER_IMAGE } from '@/lib/imageUtils';

const fallbackDestinations = [
  { name: 'Paris, France', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=500&fit=crop', tours: 12 },
  { name: 'Tokyo, Japan', image: 'https://images.unsplash.com/photo-1540959375944-7049f642e9a5?w=600&h=500&fit=crop', tours: 9 },
  { name: 'Bali, Indonesia', image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&h=500&fit=crop', tours: 15 },
  { name: 'Swiss Alps', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=500&fit=crop', tours: 7 },
];

export default function DestinationsSection({ config, data, onNavigate }: SectionProps) {
  const colors = useColors();
  const destinationsConfig = (config as any)?.destinations || {};

  if (destinationsConfig.enabled === false) return null;

  const items = data?.destinations && data.destinations.length > 0
    ? data.destinations
    : fallbackDestinations;

  const title = destinationsConfig.title || 'Explore Top Destinations';
  const subtitle = destinationsConfig.subtitle;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.heading }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>{subtitle}</Text>
        ) : null}
      </View>

      <View style={styles.grid}>
        {items.map((dest, idx) => (
          <TouchableOpacity
            key={(dest as any).id || dest.name || idx}
            activeOpacity={0.88}
            onPress={() => onNavigate?.('/explore')}
            style={styles.card}
          >
            <Image
              source={{ uri: dest.image || PLACEHOLDER_IMAGE }}
              style={styles.image}
              resizeMode="cover"
            />
            <View style={styles.darkOverlay} />
            <View style={styles.info}>
              <Text style={styles.destName}>{dest.name}</Text>
              <Text style={styles.toursCount}>{dest.tours} tours available</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
  grid: {
    gap: SPACING.md,
  },
  card: {
    height: 180,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
    ...SHADOW.md,
  },
  image: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  info: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
  },
  destName: {
    color: '#ffffff',
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    marginBottom: 2,
  },
  toursCount: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
});

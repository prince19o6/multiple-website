/**
 * components/sections/DestinationsSection.tsx
 *
 * Config-driven Destinations section with visual photo cards.
 * Loads live data from API with zero static fallback.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import type { SectionProps } from '@/types';
import { useColors } from '@/store/ThemeContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { PLACEHOLDER_IMAGE } from '@/lib/imageUtils';

export default function DestinationsSection({ config, data, onNavigate }: SectionProps) {
  const colors = useColors();
  const destinationsConfig = (config as any)?.destinations || {};

  if (destinationsConfig.enabled === false) return null;

  const items = data?.destinations || [];

  if (items.length === 0) {
    return null;
  }

  const title = destinationsConfig.title || 'Trending Destinations';
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
            testID="btn-destinationssection-45"
            accessibilityLabel="destinationssection action"
            key={(dest as any).id || dest.name || idx}
            activeOpacity={0.88}
            onPress={() => {
              const primaryDest = dest.name.split(',')[0].trim();
              onNavigate?.(`/(tabs)/explore?q=${encodeURIComponent(primaryDest)}`);
            }}
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
              <Text style={styles.toursCount}>
                {dest.tours} {dest.tours === 1 ? 'tour' : 'tours'} available
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  header: {
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    marginTop: SPACING.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  card: {
    flex: 1,
    minWidth: '45%',
    height: 180,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
    ...SHADOW.md,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  info: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
    right: SPACING.sm,
  },
  destName: {
    color: '#ffffff',
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  toursCount: {
    color: '#f0f0f0',
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
});

/**
 * components/home/SectionSkeleton.tsx
 *
 * Dedicated skeleton placeholder for individual home sections.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useColors } from '@/store/ThemeContext';
import { RADIUS, SPACING } from '@/constants/theme';

export function SectionSkeleton() {
  const colors = useColors();

  return (
    <View style={styles.container}>
      {/* Title placeholder */}
      <View style={[styles.titlePlaceholder, { backgroundColor: colors.border }]} />
      <View style={[styles.subtitlePlaceholder, { backgroundColor: colors.border }]} />

      {/* Cards row */}
      <View style={styles.cardsRow}>
        <View style={[styles.cardPlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]} />
        <View style={[styles.cardPlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    marginVertical: SPACING.md,
  },
  titlePlaceholder: {
    width: 160,
    height: 18,
    borderRadius: RADIUS.sm,
    marginBottom: 6,
  },
  subtitlePlaceholder: {
    width: 240,
    height: 12,
    borderRadius: RADIUS.xs,
    marginBottom: SPACING.md,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  cardPlaceholder: {
    width: 200,
    height: 140,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
});

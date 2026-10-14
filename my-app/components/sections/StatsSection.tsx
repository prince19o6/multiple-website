/**
 * components/sections/StatsSection.tsx
 *
 * Config-driven statistics counter section.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { SectionProps } from '@/types';
import { useColors } from '@/store/ThemeContext';
import { RADIUS, SPACING, FONT_SIZE } from '@/constants/theme';

export default function StatsSection({ config }: SectionProps) {
  const colors = useColors();
  const stats = (config as any)?.stats || {};

  if (stats.enabled === false || !stats.items?.length) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <View style={styles.grid}>
        {stats.items.map((item: any, idx: number) => (
          <View key={idx} style={styles.statItem}>
            <Text style={styles.statNumber}>{item.number}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: SPACING.lg,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 120,
  },
  statNumber: {
    color: '#ffffff',
    fontSize: FONT_SIZE.xxl + 4,
    fontWeight: '900',
    marginBottom: 2,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
});

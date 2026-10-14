/**
 * components/SkeletonLoader.tsx
 *
 * Polished placeholder skeletons shown while content is loading.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { RADIUS, SPACING } from '@/constants/theme';
import { useColors } from '@/store/ThemeContext';

export function SkeletonItem({
  width = '100%',
  height = 20,
  borderRadius = RADIUS.sm,
  style,
}: {
  width?: any;
  height?: number;
  borderRadius?: number;
  style?: any;
}) {
  const colors = useColors();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.border || '#e5e7eb',
          opacity,
        },
        style,
      ]}
    />
  );
}

export function TourCardSkeleton() {
  const colors = useColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <SkeletonItem height={180} borderRadius={RADIUS.none} />
      <View style={styles.cardContent}>
        <SkeletonItem width="70%" height={22} style={{ marginBottom: SPACING.sm }} />
        <SkeletonItem width="40%" height={16} style={{ marginBottom: SPACING.md }} />
        <SkeletonItem width="100%" height={14} style={{ marginBottom: SPACING.xs }} />
        <SkeletonItem width="85%" height={14} style={{ marginBottom: SPACING.md }} />
        <View style={styles.cardFooter}>
          <SkeletonItem width={70} height={24} />
          <SkeletonItem width={100} height={36} borderRadius={RADIUS.md} />
        </View>
      </View>
    </View>
  );
}

export default function SkeletonLoader({
  variant = 'tourCard',
  count = 1,
}: {
  variant?: 'tourCard' | 'item';
  count?: number;
}) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === 'tourCard') {
    return (
      <View>
        {items.map((i) => (
          <TourCardSkeleton key={i} />
        ))}
      </View>
    );
  }

  return (
    <View style={{ gap: SPACING.sm }}>
      {items.map((i) => (
        <SkeletonItem key={i} height={24} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  cardContent: {
    padding: SPACING.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.xs,
  },
});

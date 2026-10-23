/**
 * components/home/QuickActionsGrid.tsx
 *
 * Compact quick-actions row with 4 primary shortcuts + a "More" tile
 * that triggers the full Travel Hub bottom sheet.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';

export interface QuickActionsGridProps {
  onOpenTravelHub: () => void;
}

interface QuickAction {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  badge?: string | number;
}

export function QuickActionsGrid({ onOpenTravelHub }: QuickActionsGridProps) {
  const router = useRouter();
  const colors = useColors();

  const handleAction = (cb: () => void) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignored
    }
    cb();
  };

  const actions: QuickAction[] = [
    {
      id: 'offers',
      label: 'Deals',
      icon: 'pricetag-outline',
      onPress: () => router.push('/special-offers' as any),
    },
    {
      id: 'transfers',
      label: 'Transfers',
      icon: 'car-sport-outline',
      onPress: () => router.push('/airport-transfer' as any),
    },
    {
      id: 'esim',
      label: 'eSIM',
      icon: 'cellular-outline',
      onPress: () => router.push('/esim-roaming' as any),
      badge: '5G',
    },
    {
      id: 'forex',
      label: 'Forex',
      icon: 'trending-up-outline',
      onPress: () => router.push('/forex-radar' as any),
    },
    {
      id: 'more',
      label: 'All Tools',
      icon: 'grid-outline',
      onPress: onOpenTravelHub,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {actions.map((act) => {
          const isMore = act.id === 'more';
          return (
            <TouchableOpacity
              key={act.id}
              style={[
                styles.actionItem,
                {
                  backgroundColor: isMore ? `${colors.primary}12` : colors.surface,
                  borderColor: isMore ? colors.primary : colors.border,
                },
              ]}
              onPress={() => handleAction(act.onPress)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${act.label} quick action`}
            >
              <View style={styles.iconWrap}>
                <Ionicons
                  name={act.icon}
                  size={20}
                  color={isMore ? colors.primary : colors.heading}
                />
                {act.badge ? (
                  <View style={[styles.badge, { backgroundColor: colors.accent || '#f59e0b' }]}>
                    <Text style={styles.badgeText}>{act.badge}</Text>
                  </View>
                ) : null}
              </View>

              <Text
                style={[
                  styles.label,
                  {
                    color: isMore ? colors.primary : colors.heading,
                    fontWeight: isMore ? '700' : '600',
                  },
                ]}
                numberOfLines={1}
              >
                {act.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  actionItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    minHeight: 64,
    ...SHADOW.sm,
  },
  iconWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 15,
    height: 15,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
  },
  label: {
    fontSize: 11,
    textAlign: 'center',
  },
});

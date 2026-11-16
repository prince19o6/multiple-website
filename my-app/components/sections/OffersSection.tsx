/**
 * components/sections/OffersSection.tsx
 *
 * Config-driven special offers banner.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { SectionProps } from '@/types';
import { useColors } from '@/store/ThemeContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';

export default function OffersSection({ config, onNavigate }: SectionProps) {
  const colors = useColors();
  const theme = config?.theme || {};
  const offersConfig = (config as any)?.offers || {};
  const headingFontFamily = getHeadingFontFamily(config);

  if (offersConfig.enabled === false) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      {offersConfig.showLimitedTime && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {offersConfig.badgeText || 'SPECIAL OFFER'}
          </Text>
        </View>
      )}

      <Text style={[styles.title, { fontFamily: headingFontFamily }]}>
        {offersConfig.title || 'Special Holiday Offers'}
      </Text>

      {offersConfig.subtitle && (
        <Text style={styles.subtitle}>{offersConfig.subtitle}</Text>
      )}

      <TouchableOpacity testID="btn-offerssection-40" accessibilityLabel="offerssection action"
        style={styles.button}
        onPress={() => onNavigate?.('/explore')}
        activeOpacity={0.88}
      >
        <Text style={[styles.buttonText, { color: colors.primary }]}>
          {offersConfig.buttonText || 'View Offer'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    textAlign: 'center',
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.md,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    color: '#ffffff',
    fontSize: FONT_SIZE.xxl,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
    maxWidth: 300,
  },
  button: {
    backgroundColor: '#ffffff',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    ...SHADOW.sm,
  },
  buttonText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

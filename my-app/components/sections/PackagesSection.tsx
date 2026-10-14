/**
 * components/sections/PackagesSection.tsx
 *
 * Holiday Paradise (website3) packages section with editorial package cards.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { SectionProps } from '@/types';
import { useColors } from '@/store/ThemeContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';

export default function PackagesSection({ config, onNavigate }: SectionProps) {
  const colors = useColors();
  const theme = config?.theme || {};
  const packagesConfig = (config as any)?.packages || {};
  const headingFontFamily = getHeadingFontFamily(config);

  if (packagesConfig.enabled === false || !packagesConfig.items?.length) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            { color: colors.heading, fontFamily: headingFontFamily },
          ]}
        >
          {packagesConfig.title || 'Choose Your Perfect Escape'}
        </Text>
        {packagesConfig.subtitle ? (
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>
            {packagesConfig.subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.grid}>
        {packagesConfig.items.map((item: any) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.88}
            onPress={() => onNavigate?.('/explore')}
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={styles.cardIcon}>{item.icon}</Text>
            <Text
              style={[
                styles.cardTitle,
                { color: colors.heading, fontFamily: headingFontFamily },
              ]}
            >
              {item.title}
            </Text>
            <Text style={[styles.cardDesc, { color: colors.mutedText }]}>
              {item.description}
            </Text>
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
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  grid: {
    gap: SPACING.md,
  },
  card: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    padding: SPACING.lg,
    ...SHADOW.sm,
  },
  cardIcon: {
    fontSize: 30,
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    fontSize: FONT_SIZE.lg,
    marginBottom: SPACING.xs,
  },
  cardDesc: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
});

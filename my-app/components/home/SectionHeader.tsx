/**
 * components/home/SectionHeader.tsx
 *
 * Clean, accessible section title bar with optional subtitle and "See all" action.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useColors } from '@/store/ThemeContext';
import { FONT_SIZE, SPACING } from '@/constants/theme';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
  seeAllText?: string;
  headingFontFamily?: string;
}

export function SectionHeader({
  title,
  subtitle,
  onSeeAll,
  seeAllText = 'See all',
  headingFontFamily,
}: SectionHeaderProps) {
  const colors = useColors();

  return (
    <View style={styles.headerRow}>
      <View style={styles.titleColumn}>
        <Text
          style={[
            styles.title,
            {
              color: colors.heading,
              fontFamily: headingFontFamily,
            },
          ]}
          accessibilityRole="header"
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.mutedText }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {onSeeAll ? (
        <TouchableOpacity testID="btn-seeall"
          onPress={onSeeAll}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={`${seeAllText} for ${title}`}
          style={styles.seeAllButton}
        >
          <Text style={[styles.seeAllText, { color: colors.primary }]}>{seeAllText}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: SPACING.sm + 2,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  titleColumn: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  seeAllButton: {
    minHeight: 32,
    justifyContent: 'center',
  },
  seeAllText: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '700',
  },
});

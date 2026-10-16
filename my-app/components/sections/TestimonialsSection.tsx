/**
 * components/sections/TestimonialsSection.tsx
 *
 * Config-driven guest reviews & testimonials section.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { SectionProps } from '@/types';
import { useColors } from '@/store/ThemeContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';

export default function TestimonialsSection({ config }: SectionProps) {
  const colors = useColors();
  const theme = config?.theme || {};
  const testimonialsConfig = (config as any)?.testimonials || {};
  const headingFontFamily = getHeadingFontFamily(config);

  if (testimonialsConfig.enabled === false || !testimonialsConfig.items?.length) return null;

  const accent = theme.accent || colors.accent || '#d4af37';

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text
        style={[
          styles.title,
          { color: colors.heading, fontFamily: headingFontFamily },
        ]}
      >
        {testimonialsConfig.title || 'What Our Guests Say'}
      </Text>

      <View style={styles.grid}>
        {testimonialsConfig.items.map((t: any, idx: number) => (
          <View
            key={idx}
            style={[
              styles.card,
              {
                borderTopColor: accent,
                backgroundColor: colors.cardBg || colors.surface,
              },
            ]}
          >
            <Text style={[styles.quote, { color: colors.text }]}>{`"${t.text}"`}</Text>
            <View style={styles.authorRow}>
              <Text style={[styles.authorName, { color: colors.heading }]}>
                {t.name}
              </Text>
              <Text style={[styles.ratingStars, { color: accent }]}>
                {'★'.repeat(t.rating || 5)}
              </Text>
            </View>
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
  title: {
    fontSize: FONT_SIZE.xxl,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  grid: {
    gap: SPACING.md,
  },
  card: {
    borderTopWidth: 3,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    ...SHADOW.sm,
  },
  quote: {
    fontSize: FONT_SIZE.sm,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  authorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  ratingStars: {
    fontSize: 14,
  },
});

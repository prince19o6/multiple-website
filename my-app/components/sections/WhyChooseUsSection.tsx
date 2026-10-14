/**
 * components/sections/WhyChooseUsSection.tsx
 *
 * Config-driven WhyChooseUs section. Supports:
 *   - 'minimal' style (website3): Quiet hairlines, serif typography, refined spacing
 *   - 'card' style (website1 & website2): Elevated rounded feature cards with icon badges
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { SectionProps } from '@/types';
import { useColors } from '@/store/ThemeContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';

export default function WhyChooseUsSection({ config }: SectionProps) {
  const colors = useColors();
  const theme = config?.theme || {};
  const whyChooseUs = (config as any)?.whyChooseUs || {};
  const headingFontFamily = getHeadingFontFamily(config);

  if (whyChooseUs.enabled === false || !whyChooseUs.items?.length) return null;

  const isMinimal = whyChooseUs.style === 'minimal';
  const title = whyChooseUs.title || `Why Choose ${config?.name || 'Us'}?`;
  const description = whyChooseUs.description;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isMinimal ? colors.surface : colors.cardBg || colors.surface },
      ]}
    >
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            {
              color: colors.heading,
              fontFamily: headingFontFamily,
            },
          ]}
        >
          {title}
        </Text>
        {description ? (
          <Text style={[styles.description, { color: colors.mutedText }]}>
            {description}
          </Text>
        ) : null}
      </View>

      <View style={styles.grid}>
        {whyChooseUs.items.map((item: any, idx: number) => {
          if (isMinimal) {
            return (
              <View
                key={idx}
                style={[
                  styles.minimalItem,
                  { borderColor: colors.border },
                  idx > 0 && styles.minimalDivider,
                ]}
              >
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: `${colors.primary}15` },
                  ]}
                >
                  <Text style={styles.iconText}>{item.icon || '✦'}</Text>
                </View>
                <View style={styles.itemTextContainer}>
                  <Text
                    style={[
                      styles.itemTitle,
                      { color: colors.heading, fontFamily: headingFontFamily },
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text style={[styles.itemDesc, { color: colors.mutedText }]}>
                    {item.description}
                  </Text>
                </View>
              </View>
            );
          }

          // Card style
          return (
            <View
              key={idx}
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.cardIconBox,
                  { backgroundColor: `${colors.primary}18` },
                ]}
              >
                <Text style={styles.iconText}>{item.icon || '★'}</Text>
              </View>
              <Text style={[styles.cardTitle, { color: colors.heading }]}>
                {item.title}
              </Text>
              <Text style={[styles.cardDesc, { color: colors.mutedText }]}>
                {item.description}
              </Text>
            </View>
          );
        })}
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
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  grid: {
    gap: SPACING.md,
  },
  card: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    ...SHADOW.sm,
  },
  cardIconBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  iconText: {
    fontSize: 22,
  },
  cardTitle: {
    fontSize: FONT_SIZE.md + 1,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  cardDesc: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
  minimalItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.md,
  },
  minimalDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginBottom: 4,
  },
  itemDesc: {
    fontSize: FONT_SIZE.sm - 1,
    lineHeight: 20,
  },
});

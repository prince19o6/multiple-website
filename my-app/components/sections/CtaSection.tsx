/**
 * components/sections/CtaSection.tsx
 *
 * Config-driven Call-to-Action section. Supports:
 *   - 'luxury' style (website3): Elegant accent divider, serif typography, outline button
 *   - 'standard' style (website1 & website2): High-impact callout with primary action button
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { SectionProps } from '@/types';
import { useColors } from '@/store/ThemeContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { getHeadingFontFamily, actionToScreen } from '@/lib/sectionHelpers';

export default function CtaSection({ config, onNavigate }: SectionProps) {
  const colors = useColors();
  const theme = config?.theme || {};
  const cta = (config as any)?.cta || {};
  const headingFontFamily = getHeadingFontFamily(config);

  if (cta.enabled === false) return null;

  const siteName = config?.name || 'Us';
  const defaultTitle = `Ready to Explore with ${siteName}?`;
  const defaultButtonText = `Start Exploring ${siteName}`;

  const title = cta.title || defaultTitle;
  const description = cta.description;
  const buttonText = cta.buttonText || defaultButtonText;

  const handlePress = () => {
    const route = actionToScreen(cta.buttonAction || 'explore');
    onNavigate?.(route);
  };

  // Luxury style
  if (cta.style === 'luxury') {
    const accent = theme.accent || colors.accent || '#d4af37';
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.luxuryContent}>
          <View style={[styles.goldDivider, { backgroundColor: accent }]} />
          <Text
            style={[
              styles.luxuryTitle,
              { color: colors.heading, fontFamily: headingFontFamily },
            ]}
          >
            {title}
          </Text>
          {description ? (
            <Text style={[styles.luxuryDesc, { color: colors.mutedText }]}>
              {description}
            </Text>
          ) : null}
          <TouchableOpacity testID="btn-press" accessibilityLabel="Press"
            activeOpacity={0.85}
            onPress={handlePress}
            style={[styles.luxuryBtn, { borderColor: colors.primary }]}
          >
            <Text style={[styles.luxuryBtnText, { color: colors.primary }]}>
              {buttonText}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Standard style
  return (
    <View style={[styles.container, { backgroundColor: colors.cardBg || colors.surface }]}>
      <View style={styles.standardContent}>
        <Text style={[styles.title, { color: colors.heading }]}>{title}</Text>
        {description ? (
          <Text style={[styles.description, { color: colors.mutedText }]}>
            {description}
          </Text>
        ) : null}
        <TouchableOpacity testID="btn-press" accessibilityLabel="Press"
          activeOpacity={0.88}
          onPress={handlePress}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.buttonText}>{buttonText} →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  standardContent: {
    alignItems: 'center',
    textAlign: 'center',
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: FONT_SIZE.sm + 1,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: SPACING.lg,
  },
  button: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    ...SHADOW.md,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: '700',
  },

  // Luxury
  luxuryContent: {
    alignItems: 'center',
  },
  goldDivider: {
    width: 60,
    height: 1,
    marginBottom: SPACING.md,
  },
  luxuryTitle: {
    fontSize: FONT_SIZE.xxl,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  luxuryDesc: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: SPACING.lg,
  },
  luxuryBtn: {
    borderWidth: 1,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.none,
  },
  luxuryBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});

/**
 * components/sections/HeroSection.tsx
 *
 * Config-driven Hero section. Supports:
 *   - 'luxury-image' style (website3): Full bleed image, elegant overlay, serif font, search input
 *   - 'split' / standard gradient style (website1 & website2): Vibrant brand gradient, badge, CTA buttons, hero image
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SectionProps } from '@/types';
import { useColors } from '@/store/ThemeContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { getButtonRadius, actionToScreen } from '@/lib/sectionHelpers';
import { PLACEHOLDER_IMAGE } from '@/lib/imageUtils';

export default function HeroSection({ config, onNavigate }: SectionProps) {
  const colors = useColors();
  const hero = (config as any)?.hero || {};
  const buttons = (config as any)?.buttons || {};
  const theme = config?.theme || {};

  const siteName = config?.name || 'Us';
  const defaultTitle = `Discover Your Next Adventure with ${siteName}`;
  const defaultDescription = `Explore amazing destinations and unforgettable experiences with ${siteName}.`;

  const title = hero.title || defaultTitle;
  const description = hero.description || defaultDescription;
  const badgeText = hero.badgeText || (hero.showBadge ? 'EXPLORE THE WORLD' : '');
  const btnRadius = getButtonRadius(buttons);

  const handleAction = (action?: string) => {
    const route = actionToScreen(action);
    onNavigate?.(route);
  };

  // ─── Style: Luxury Image (Website 3) ────────────────────────────────────────
  if (hero.style === 'luxury-image') {
    const accent = theme.accent || colors.accent || '#d4af37';
    return (
      <View style={styles.luxuryHero}>
        <Image
          source={{ uri: hero.image || PLACEHOLDER_IMAGE }}
          style={styles.luxuryBgImage}
          resizeMode="cover"
        />
        <View style={styles.luxuryDarkOverlay} />

        <View style={styles.luxuryContent}>
          {hero.showBadge && (
            <View style={[styles.luxuryBadge, { borderColor: 'rgba(255,255,255,0.6)' }]}>
              <Text style={styles.luxuryBadgeText}>{badgeText}</Text>
            </View>
          )}

          <Text style={styles.luxuryTitle}>{title}</Text>
          <Text style={styles.luxuryDesc}>{description}</Text>

          {/* Quick Search bar */}
          {hero.showSearch && (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleAction('explore')}
              style={styles.searchBar}
            >
              <Ionicons name="search" size={18} color="#6b7280" style={{ marginRight: 8 }} />
              <Text style={styles.searchPlaceholder}>
                {hero.searchPlaceholder || 'Where would you like to escape?'}
              </Text>
              <View style={[styles.searchAction, { backgroundColor: colors.primary }]}>
                <Ionicons name="arrow-forward" size={16} color="#ffffff" />
              </View>
            </TouchableOpacity>
          )}

          {/* Buttons */}
          <View style={styles.buttonRow}>
            {hero.primaryButton && (
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.luxuryPrimaryBtn, { backgroundColor: colors.primary }]}
                onPress={() => handleAction(hero.primaryButton?.action)}
              >
                <Text style={styles.luxuryPrimaryBtnText}>
                  {hero.primaryButton.text || 'Explore'}
                </Text>
              </TouchableOpacity>
            )}
            {hero.secondaryButton && (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.luxurySecondaryBtn}
                onPress={() => handleAction(hero.secondaryButton?.action)}
              >
                <Text style={styles.luxurySecondaryBtnText}>
                  {hero.secondaryButton.text || 'Learn More'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  // ─── Style: Vibrant Gradient / Standard (Website 1 & Website 2) ─────────────
  return (
    <View style={[styles.standardHero, { backgroundColor: colors.primary }]}>
      <View style={styles.standardContent}>
        {hero.showBadge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeText}</Text>
          </View>
        )}

        <Text style={styles.standardTitle}>{title}</Text>
        <Text style={styles.standardDesc}>{description}</Text>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.primaryBtn,
              { borderRadius: btnRadius, backgroundColor: '#ffffff' },
            ]}
            onPress={() => handleAction(hero.primaryButton?.action || 'explore')}
          >
            <Text
              style={[
                styles.primaryBtnText,
                { color: colors.primary },
                buttons.uppercase && { textTransform: 'uppercase' },
              ]}
            >
              {hero.primaryButton?.text || 'Explore Tours'}
            </Text>
          </TouchableOpacity>

          {hero.secondaryButton && (
            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.secondaryBtn, { borderRadius: btnRadius }]}
              onPress={() => handleAction(hero.secondaryButton?.action || 'explore')}
            >
              <Text
                style={[
                  styles.secondaryBtnText,
                  buttons.uppercase && { textTransform: 'uppercase' },
                ]}
              >
                {hero.secondaryButton.text || 'Learn More'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Hero image preview */}
        {hero.image ? (
          <View style={styles.heroImageWrapper}>
            <Image
              source={{ uri: hero.image }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Luxury hero styles
  luxuryHero: {
    minHeight: 460,
    position: 'relative',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  luxuryBgImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  luxuryDarkOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
  },
  luxuryContent: {
    alignItems: 'center',
    textAlign: 'center',
  },
  luxuryBadge: {
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    marginBottom: SPACING.md,
  },
  luxuryBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  luxuryTitle: {
    color: '#ffffff',
    fontSize: FONT_SIZE.xxl + 2,
    fontFamily: 'Playfair Display',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: SPACING.sm,
  },
  luxuryDesc: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: FONT_SIZE.sm + 1,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
    marginBottom: SPACING.lg,
  },
  searchBar: {
    backgroundColor: '#ffffff',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: SPACING.md,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: RADIUS.none,
    marginBottom: SPACING.lg,
    ...SHADOW.md,
  },
  searchPlaceholder: {
    flex: 1,
    color: '#6b7280',
    fontSize: FONT_SIZE.xs + 1,
  },
  searchAction: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  luxuryPrimaryBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.none,
  },
  luxuryPrimaryBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  luxurySecondaryBtn: {
    borderWidth: 1,
    borderColor: '#ffffff',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.none,
  },
  luxurySecondaryBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // Standard hero styles
  standardHero: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  standardContent: {
    alignItems: 'center',
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.md,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  standardTitle: {
    color: '#ffffff',
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: SPACING.sm,
  },
  standardDesc: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: FONT_SIZE.sm + 1,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 340,
    marginBottom: SPACING.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
    marginBottom: SPACING.lg,
  },
  primaryBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    ...SHADOW.sm,
  },
  primaryBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  secondaryBtn: {
    borderWidth: 2,
    borderColor: '#ffffff',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: 'transparent',
  },
  secondaryBtnText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  heroImageWrapper: {
    width: '100%',
    height: 200,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginTop: SPACING.sm,
    ...SHADOW.lg,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
});

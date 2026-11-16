/**
 * components/home/SpecialOffersSection.tsx
 *
 * Single curated seasonal offer / promotional campaign card.
 * High-conversion and compact: prevents multiple stacked banners.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { DEFAULT_BLURHASH } from '@/lib/imageUtils';

export interface SpecialOffersSectionProps {
  headingFontFamily?: string;
  onViewMore?: () => void;
}

export function SpecialOffersSection({
  headingFontFamily,
  onViewMore,
}: SpecialOffersSectionProps) {
  const router = useRouter();
  const colors = useColors();

  const handlePress = () => {
    if (onViewMore) {
      onViewMore();
    } else {
      router.push('/special-offers' as any);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity testID="btn-press"
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={handlePress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Special seasonal offer: Early bird 25% off"
      >
        <ExpoImage
          source={{
            uri: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=450&fit=crop',
          }}
          style={styles.bannerImage}
          contentFit="cover"
          placeholder={{ blurhash: DEFAULT_BLURHASH }}
          cachePolicy="memory-disk"
        />
        <View style={styles.overlay} />

        <View style={styles.content}>
          <View style={[styles.badge, { backgroundColor: colors.accent || '#f59e0b' }]}>
            <Ionicons name="flash" size={12} color="#ffffff" style={{ marginRight: 4 }} />
            <Text style={styles.badgeText}>SEASONAL SPECIAL</Text>
          </View>

          <Text style={[styles.title, { fontFamily: headingFontFamily }]}>
            Early Bird Summer Packages
          </Text>

          <Text style={styles.subtitle}>
            Save up to 25% on boutique stays & guided island hopping expeditions.
          </Text>

          <View style={styles.footerRow}>
            <View style={styles.codePill}>
              <Text style={styles.codeLabel}>PROMO: </Text>
              <Text style={styles.codeText}>EXPLORE25</Text>
            </View>

            <View style={[styles.ctaButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.ctaText}>View Deals</Text>
              <Ionicons name="arrow-forward" size={14} color="#ffffff" style={{ marginLeft: 4 }} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  card: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    height: 190,
    position: 'relative',
    justifyContent: 'flex-end',
    ...SHADOW.md,
  },
  bannerImage: {
    ...StyleSheet.absoluteFill,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  content: {
    padding: SPACING.md,
    zIndex: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    marginBottom: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    color: '#ffffff',
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 10,
    maxWidth: 290,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  codeLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    fontWeight: '600',
  },
  codeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});

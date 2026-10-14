/**
 * components/sections/FeaturedToursSection.tsx
 *
 * Config-driven FeaturedTours section.
 * Renders the brand-tailored card for each site:
 *   - AdventureTourCard for website2
 *   - LuxuryTourCard for website3
 *   - TourCard for website1
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { SectionProps, Tour } from '@/types';
import { useColors } from '@/store/ThemeContext';
import { RADIUS, SPACING, FONT_SIZE } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';
import TourCard from '@/components/TourCard';
import AdventureTourCard from '@/components/AdventureTourCard';
import LuxuryTourCard from '@/components/LuxuryTourCard';
import { tourHref } from '@/lib/navigation';

export default function FeaturedToursSection({ config, data, onNavigate }: SectionProps) {
  const colors = useColors();
  const theme = config?.theme || {};
  const featuredToursConfig = (config as any)?.featuredTours || {};
  const tourCard = (config as any)?.tourCard;
  const headingFontFamily = getHeadingFontFamily(config);

  if (featuredToursConfig.enabled === false) return null;

  const limit = featuredToursConfig.limit || 6;
  const visibleTours = (data?.tours || []).slice(0, limit);

  const useAdventureCard = tourCard?.layout === 'image-overlay';
  const useLuxuryCard = tourCard?.layout === 'luxury';

  const title = featuredToursConfig.title || 'Featured Tours';
  const subtitle = featuredToursConfig.subtitle || 'Handpicked experiences from around the world';

  const handleTourPress = (tour: Tour) => {
    onNavigate?.(tourHref(tour));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            {
              color: colors.heading,
              fontFamily: useLuxuryCard ? headingFontFamily : undefined,
            },
          ]}
        >
          {title}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>{subtitle}</Text>
      </View>

      <View style={styles.list}>
        {visibleTours.map((tour) => {
          if (useAdventureCard) {
            return (
              <AdventureTourCard
                key={tour.id}
                {...tour}
                tourCardConfig={tourCard}
                theme={theme}
                onBook={() => handleTourPress(tour)}
                onPress={() => handleTourPress(tour)}
              />
            );
          }

          if (useLuxuryCard) {
            return (
              <LuxuryTourCard
                key={tour.id}
                {...tour}
                tourCardConfig={tourCard}
                theme={theme}
                headingFontFamily={headingFontFamily}
                onBook={() => handleTourPress(tour)}
                onPress={() => handleTourPress(tour)}
              />
            );
          }

          return (
            <TourCard
              key={tour.id}
              {...tour}
              onBook={() => handleTourPress(tour)}
              onPress={() => handleTourPress(tour)}
            />
          );
        })}
      </View>

      {featuredToursConfig.showViewAll !== false && (
        <TouchableOpacity
          style={[styles.viewAllBtn, { backgroundColor: colors.primary }]}
          onPress={() => onNavigate?.('/explore')}
          activeOpacity={0.85}
        >
          <Text style={styles.viewAllBtnText}>
            {featuredToursConfig.viewAllText || 'View All Tours'} →
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
  list: {
    gap: SPACING.xs,
  },
  viewAllBtn: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllBtnText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
});

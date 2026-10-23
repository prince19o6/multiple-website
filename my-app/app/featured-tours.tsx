/**
 * app/featured-tours.tsx
 *
 * Dedicated "See all" screen for Featured Expeditions.
 * Features:
 *   - Native header with back button
 *   - Category quick filter
 *   - Full list of featured tours with brand-specific TourCard variants
 *   - Empty and loading states
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSite, useSiteConfig } from '@/store/SiteConfigContext';
import { useColors } from '@/store/ThemeContext';
import { useTours } from '@/hooks/useTours';
import { RADIUS, SPACING, FONT_SIZE } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';
import AppHeader from '@/components/common/AppHeader';
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import TourCard from '@/components/TourCard';
import AdventureTourCard from '@/components/AdventureTourCard';
import LuxuryTourCard from '@/components/LuxuryTourCard';
import { tourHref } from '@/lib/navigation';
import type { Tour } from '@/types';

export default function FeaturedToursScreen() {
  const router = useRouter();
  const config = useSiteConfig();
  const colors = useColors();
  const { siteId } = useSite();
  const headingFontFamily = getHeadingFontFamily(config);
  const { tours, isLoading, isError, error, refetch } = useTours();

  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'Adventure', 'Beach', 'Cultural', 'Wildlife', 'Luxury'];

  const filteredTours = useMemo(() => {
    return tours.filter((t) => {
      if (activeCategory === 'All') return true;
      const cat = (t.category || '').toLowerCase();
      const target = activeCategory.toLowerCase();
      return cat === target || t.description?.toLowerCase().includes(target);
    });
  }, [tours, activeCategory]);

  const renderCard = ({ item }: { item: Tour }) => {
    const href = tourHref(item);
    if (siteId === 'tripgoasia' || siteId === 'website2') {
      return (
        <AdventureTourCard
          name={item.name}
          description={item.description}
          price={item.price}
          rating={item.rating}
          image={item.image}
          duration={item.duration}
          difficulty={item.difficulty}
          onBook={() => router.push(href as any)}
          onPress={() => router.push(href as any)}
        />
      );
    }
    if (siteId === 'technoheaven' || siteId === 'website3') {
      return (
        <LuxuryTourCard
          name={item.name}
          description={item.description}
          price={item.price}
          rating={item.rating}
          image={item.image}
          duration={item.duration}
          location={item.location}
          onBook={() => router.push(href as any)}
          onPress={() => router.push(href as any)}
          headingFontFamily={headingFontFamily}
        />
      );
    }
    return (
      <TourCard
        id={item.id}
        name={item.name}
        description={item.description}
        price={item.price}
        rating={item.rating}
        image={item.image}
        duration={item.duration}
        difficulty={item.difficulty}
        onBook={() => router.push(href as any)}
        onPress={() => router.push(href as any)}
      />
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Featured Expeditions"
        showBackButton
        onBackPress={() => router.back()}
      />

      {/* Filter Chips */}
      <View style={[styles.filtersContainer, { borderBottomColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {categories.map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setActiveCategory(cat)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: isSelected ? '#ffffff' : colors.heading,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loaderWrap}>
          <SkeletonLoader variant="tourCard" count={3} />
        </View>
      ) : isError ? (
        <View style={styles.centerWrap}>
          <Text style={[styles.errorTitle, { color: colors.heading }]}>Unable to load expeditions</Text>
          <Text style={[styles.errorDesc, { color: colors.mutedText }]}>{error?.message}</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredTours.length === 0 ? (
        <EmptyState
          icon="compass-outline"
          title={`No tours in "${activeCategory}"`}
          description="Try switching categories to view more curated experiences."
          actionLabel="Clear Filter"
          onAction={() => setActiveCategory('All')}
        />
      ) : (
        <FlatList
          data={filteredTours}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  filtersContainer: {
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  filterScroll: {
    paddingHorizontal: SPACING.md,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: FONT_SIZE.xs,
  },
  listContent: {
    padding: SPACING.md,
    gap: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  loaderWrap: {
    padding: SPACING.md,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  errorTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginBottom: 4,
  },
  errorDesc: {
    fontSize: FONT_SIZE.xs,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: FONT_SIZE.xs,
  },
});

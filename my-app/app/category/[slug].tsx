/**
 * app/category/[slug].tsx
 *
 * Screen listing all tours matching a specific travel theme / category.
 * Features:
 *   - Fetches tours using unified useTours hook
 *   - Filters by normalized category slug
 *   - Separated states:
 *       • Loading: SkeletonLoader
 *       • Error: Real error card with retry button
 *       • Truly empty: Specific EmptyState with "Browse All Tours" button
 *   - Renders brand-tailored tour cards matching the active website
 */

import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColors } from '@/store/ThemeContext';
import { useSite, useSiteConfig } from '@/store/SiteConfigContext';
import { useTours } from '@/hooks/useTours';
import { RADIUS, SPACING, FONT_SIZE } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';
import AppHeader from '@/components/common/AppHeader';
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import TourCard from '@/components/TourCard';
import AdventureTourCard from '@/components/AdventureTourCard';
import LuxuryTourCard from '@/components/LuxuryTourCard';
import { resolveTourCardVariant } from '@/lib/tourCardResolver';
import type { Tour } from '@/types';
import { tourHref } from '@/lib/navigation';

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const colors = useColors();
  const config = useSiteConfig();
  const { siteId } = useSite();
  const headingFontFamily = getHeadingFontFamily(config);

  const { tours, isLoading, isError, error, refetch } = useTours(siteId);

  const categoryTitle =
    typeof slug === 'string'
      ? slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ')
      : 'Category';

  const categoryTours = useMemo(() => {
    if (!slug) return [];
    const targetSlug = slug.toLowerCase();
    return tours.filter((t) => {
      const cat = (t.category || '').toLowerCase();
      return (
        cat === targetSlug ||
        (targetSlug === 'cultural' && (cat === 'culture' || cat === 'cultural')) ||
        (targetSlug === 'culture' && (cat === 'cultural' || cat === 'culture')) ||
        t.difficulty?.toLowerCase().includes(targetSlug) ||
        t.description?.toLowerCase().includes(targetSlug)
      );
    });
  }, [tours, slug]);

  const renderTourItem = ({ item }: { item: Tour }) => {
    const href = tourHref(item);
    const cardVariant = resolveTourCardVariant(config);

    if (cardVariant === 'adventure') {
      return (
        <View style={styles.cardWrapper}>
          <AdventureTourCard
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
        </View>
      );
    }

    if (cardVariant === 'luxury') {
      return (
        <View style={styles.cardWrapper}>
          <LuxuryTourCard
            id={item.id}
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
        </View>
      );
    }

    return (
      <View style={styles.cardWrapper}>
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
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader showBackButton={true} title={categoryTitle} showLogo={true} logoSize="sm" />

      {/* ─── Loading Skeleton ─── */}
      {isLoading && (
        <View style={{ padding: SPACING.md }}>
          <SkeletonLoader variant="tourCard" count={3} />
        </View>
      )}

      {/* ─── Error State (Isolated) ─── */}
      {isError && !isLoading && (
        <View style={styles.centerContainer}>
          <View style={[styles.errorCard, { backgroundColor: `${colors.accent}12`, borderColor: colors.accent }]}>
            <Text style={[styles.errorTitle, { color: colors.heading }]}>Failed to load tours</Text>
            <Text style={[styles.errorDesc, { color: colors.mutedText }]}>
              {error?.message || 'Could not retrieve tours for this category.'}
            </Text>
          </View>
        </View>
      )}

      {/* ─── Tours List ─── */}
      {!isLoading && !isError && (
        <FlatList
          data={categoryTours}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderTourItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                refetch();
              }}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.headerBox}>
              <Text style={[styles.headerTitle, { color: colors.heading, fontFamily: headingFontFamily }]}>
                {categoryTitle} Collection
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
                {categoryTours.length} {categoryTours.length === 1 ? 'experience' : 'experiences'} available
              </Text>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="compass-outline"
              title="No tours in this category"
              description={`There are currently no active tours listed under "${categoryTitle}".`}
              actionLabel="Browse All Tours"
              onAction={() => router.push('/(tabs)/explore')}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl + 20,
  },
  headerBox: {
    marginBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  cardWrapper: {
    marginBottom: SPACING.md,
  },
  centerContainer: {
    flex: 1,
    padding: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorCard: {
    padding: SPACING.xl,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    alignItems: 'center',
    width: '100%',
  },
  errorTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  errorDesc: {
    fontSize: FONT_SIZE.xs,
    textAlign: 'center',
    marginVertical: SPACING.sm,
  },
});

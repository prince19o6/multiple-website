/**
 * app/(tabs)/explore.tsx
 *
 * Explore tab screen for catalog discovery and search.
 * Features:
 *   - Clean, safe-area-aware header with no overlapping overlays
 *   - Native search bar with instant query filtering
 *   - Horizontal Category / Quick-filter chips
 *   - TanStack Query connected via useTours using canonical siteId
 *   - Separated states:
 *       • Loading: SkeletonLoader
 *       • Error: Real error card with actual error message and Retry button
 *       • Truly empty: Specific EmptyState when no tours match or website has no tours
 *   - FlatList rendering brand-tailored tour cards with expo-image and themed fallbacks
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSiteConfig, useSite } from '@/store/SiteConfigContext';
import { useColors } from '@/store/ThemeContext';
import { useTours } from '@/hooks/useTours';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import TourCard from '@/components/TourCard';
import AdventureTourCard from '@/components/AdventureTourCard';
import LuxuryTourCard from '@/components/LuxuryTourCard';
import type { Tour } from '@/types';
import { tourHref } from '@/lib/navigation';

export default function ExploreTabScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const config = useSiteConfig();
  const colors = useColors();
  const { siteId, refetch: refetchSite } = useSite();
  const headingFontFamily = getHeadingFontFamily(config);

  const { tours, isLoading, isError, error, refetch } = useTours(siteId);

  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const quickFilters = ['All', 'Popular', 'Adventure', 'Beach', 'Cultural', 'Wildlife'];
  const [selectedFilter, setSelectedFilter] = useState('All');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetch(), refetchSite()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, refetchSite]);

  const filteredTours = useMemo(() => {
    return tours.filter((t) => {
      // 1. Category / Quick-filter chip
      if (selectedFilter !== 'All') {
        if (selectedFilter === 'Popular') {
          if (!t.popular) return false;
        } else {
          const cat = (t.category || '').toLowerCase();
          const target = selectedFilter.toLowerCase();
          const matchesCat =
            cat === target ||
            (target === 'cultural' && (cat === 'culture' || cat === 'cultural')) ||
            (target === 'culture' && (cat === 'cultural' || cat === 'culture')) ||
            t.difficulty?.toLowerCase().includes(target) ||
            t.description?.toLowerCase().includes(target);

          if (!matchesCat) return false;
        }
      }

      // 2. Search query filter
      if (!query.trim()) return true;
      const q = query.toLowerCase().trim();
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.location && t.location.toLowerCase().includes(q)) ||
        (t.destination && t.destination.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        t.difficulty.toLowerCase().includes(q)
      );
    });
  }, [tours, selectedFilter, query]);

  const hasActiveFilters = selectedFilter !== 'All' || query.trim().length > 0;

  const clearFilters = () => {
    setQuery('');
    setSelectedFilter('All');
  };

  const renderTourItem = ({ item }: { item: Tour }) => {
    const href = tourHref(item);
    if (siteId === 'tripgoasia' || siteId === 'website2') {
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

    if (siteId === 'technoheaven' || siteId === 'website3') {
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
      {/* ─── Search & Filters Bar (Integrated under AppHeader) ─── */}
      <View
        style={[
          styles.searchToolbar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        {/* Native Search Input */}
        <View style={[styles.searchBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.primary} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Search tours, cities, or activities..."
            placeholderTextColor={colors.mutedText}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.mutedText} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {quickFilters.map((item) => {
            const isSelected = selectedFilter === item;
            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setSelectedFilter(item)}
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
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ─── Loading Skeletons ─── */}
      {isLoading && (
        <View style={{ padding: SPACING.md }}>
          <SkeletonLoader variant="tourCard" count={3} />
        </View>
      )}

      {/* ─── Error State (Isolated: never masked as empty list) ─── */}
      {isError && !isLoading && (
        <View style={styles.centerContainer}>
          <View style={[styles.errorCard, { backgroundColor: `${colors.accent}12`, borderColor: colors.accent }]}>
            <Ionicons name="cloud-offline-outline" size={40} color={colors.accent || '#ef4444'} />
            <Text style={[styles.errorTitle, { color: colors.heading }]}>Failed to load tours</Text>
            <Text style={[styles.errorDesc, { color: colors.mutedText }]}>
              {error?.message || 'Check your connection to the tours server.'}
            </Text>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: colors.primary }]}
              onPress={() => refetch()}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.retryBtnText}>Retry Connection</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ─── Tours FlatList (Only rendered when NOT loading and NOT in error) ─── */}
      {!isLoading && !isError && (
        <FlatList
          data={filteredTours}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderTourItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            <Text style={[styles.countHeader, { color: colors.mutedText }]}>
              Showing {filteredTours.length} {filteredTours.length === 1 ? 'experience' : 'experiences'}
            </Text>
          }
          ListEmptyComponent={
            tours.length === 0 ? (
              <EmptyState
                icon="compass-outline"
                title="No tours available"
                description="There are currently no active tours listed for this website."
                actionLabel="Refresh Tours"
                onAction={() => refetch()}
              />
            ) : query.trim().length > 0 ? (
              <EmptyState
                icon="search-outline"
                title="No results for your search"
                description={`We couldn't find any tours matching "${query}".`}
                actionLabel="Clear Search"
                onAction={() => setQuery('')}
              />
            ) : (
              <EmptyState
                icon="compass-outline"
                title={`No tours in "${selectedFilter}"`}
                description={`We couldn't find any experiences under the ${selectedFilter} category.`}
                actionLabel="Clear Filters"
                onAction={clearFilters}
              />
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  searchToolbar: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 3,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: 8,
    marginBottom: SPACING.xs,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    paddingVertical: 0,
  },
  chipsScroll: {
    gap: 8,
    paddingVertical: 6,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: FONT_SIZE.xs,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl + 20,
  },
  countHeader: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: SPACING.sm,
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
    marginTop: SPACING.xs,
  },
  errorDesc: {
    fontSize: FONT_SIZE.xs,
    textAlign: 'center',
    marginVertical: SPACING.sm,
    lineHeight: 18,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    marginTop: 4,
    minHeight: 44,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
});

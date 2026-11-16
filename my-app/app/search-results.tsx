/**
 * app/search-results.tsx
 *
 * Full-featured Search Results screen for targeted query discovery.
 * Features:
 *   - Safe-area-aware header with back button, real-time query input, and quick clear
 *   - Filter modal integration with active filter badge
 *   - Quick sort & filter chips under header
 *   - Automatic saving of queries to website-scoped recent searches
 *   - TanStack Query connected via useTours using canonical siteId and backend sorting
 *   - Result count status banner with quick reset
 *   - Loading state: SkeletonLoader
 *   - Error state with descriptive message and Retry button
 *   - Truly empty state with options to clear search or browse all tours
 *   - FlatList rendering brand-tailored tour cards with instant navigation
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
  StatusBar,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSite, useSiteConfig } from '@/store/SiteConfigContext';
import { useColors } from '@/store/ThemeContext';
import { useTours } from '@/hooks/useTours';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';
import SkeletonLoader from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import TourCard from '@/components/TourCard';
import AdventureTourCard from '@/components/AdventureTourCard';
import LuxuryTourCard from '@/components/LuxuryTourCard';
import { resolveTourCardVariant } from '@/lib/tourCardResolver';
import BrandLogo from '@/components/common/BrandLogo';
import FilterModal from '@/components/FilterModal';
import type { Tour, TourFilterState, TourSearchParams, TourSortOption } from '@/types';
import { tourHref } from '@/lib/navigation';

const SORT_LABELS: Record<TourSortOption, string> = {
  featured: 'Recommended',
  'price-low': 'Price: Low-High',
  'price-high': 'Price: High-Low',
  rating: 'Top Rated',
  newest: 'Newest',
};

export default function SearchResultsScreen() {
  const { q } = useLocalSearchParams<{ q?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const config = useSiteConfig();
  const { siteId } = useSite();
  const headingFontFamily = getHeadingFontFamily(config);

  const [searchTerm, setSearchTerm] = useState(q || '');
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const [filterState, setFilterState] = useState<TourFilterState>({
    sort: 'featured',
    category: 'All',
    minPrice: undefined,
    maxPrice: undefined,
    duration: undefined,
    difficulty: undefined,
  });

  const { addSearch } = useRecentSearches();

  // Save search term on mount if present
  useEffect(() => {
    if (q && q.trim()) {
      addSearch(q.trim());
    }
  }, [q, addSearch]);

  const queryFilters = useMemo<TourSearchParams>(() => {
    return {
      q: searchTerm.trim() || undefined,
      sort: filterState.sort !== 'featured' ? filterState.sort : undefined,
      category: filterState.category !== 'All' ? filterState.category : undefined,
      minPrice: filterState.minPrice,
      maxPrice: filterState.maxPrice,
      difficulty: filterState.difficulty,
    };
  }, [searchTerm, filterState]);

  const { tours, isLoading, isError, error, refetch } = useTours(siteId, queryFilters);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filterState.sort !== 'featured') count += 1;
    if (filterState.category !== 'All') count += 1;
    if (filterState.minPrice !== undefined || filterState.maxPrice !== undefined) count += 1;
    if (filterState.duration) count += 1;
    if (filterState.difficulty) count += 1;
    return count;
  }, [filterState]);

  const handleApplyFilters = (newFilters: TourFilterState) => {
    setFilterState(newFilters);
  };

  const handleSearchSubmit = () => {
    if (searchTerm.trim()) {
      addSearch(searchTerm.trim());
    }
  };

  const clearFilters = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics fallback
    }
    setSearchTerm('');
    setFilterState({
      sort: 'featured',
      category: 'All',
      minPrice: undefined,
      maxPrice: undefined,
      duration: undefined,
      difficulty: undefined,
    });
  };

  const filteredTours = useMemo(() => {
    let list = [...tours];

    const term = searchTerm.trim().toLowerCase();
    if (term) {
      list = list.filter((t) => {
        const name = (t.name || '').toLowerCase();
        const desc = (t.description || '').toLowerCase();
        const loc = (t.location || '').toLowerCase();
        const dest = (t.destination || '').toLowerCase();
        const cat = (t.category || '').toLowerCase();
        const diff = (t.difficulty || '').toLowerCase();

        return (
          name.includes(term) ||
          desc.includes(term) ||
          loc.includes(term) ||
          dest.includes(term) ||
          cat.includes(term) ||
          diff.includes(term)
        );
      });
    }

    if (filterState.category !== 'All') {
      const target = filterState.category.toLowerCase();
      list = list.filter((t) => (t.category || '').toLowerCase() === target);
    }

    if (filterState.minPrice !== undefined) {
      list = list.filter((t) => t.price >= (filterState.minPrice ?? 0));
    }
    if (filterState.maxPrice !== undefined) {
      list = list.filter((t) => t.price <= (filterState.maxPrice ?? Infinity));
    }

    if (filterState.duration) {
      const dur = filterState.duration;
      list = list.filter((t) => {
        const dStr = (t.duration || '').toLowerCase();
        const numDays = parseInt(dStr, 10) || 1;
        if (dur === '1-3') return numDays >= 1 && numDays <= 3;
        if (dur === '4-7') return numDays >= 4 && numDays <= 7;
        if (dur === '8+') return numDays >= 8;
        return true;
      });
    }

    if (filterState.difficulty) {
      const targetDiff = filterState.difficulty.toLowerCase();
      list = list.filter((t) => (t.difficulty || '').toLowerCase() === targetDiff);
    }

    if (filterState.sort === 'price-low') {
      list.sort((a, b) => a.price - b.price);
    } else if (filterState.sort === 'price-high') {
      list.sort((a, b) => b.price - a.price);
    } else if (filterState.sort === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return list;
  }, [tours, searchTerm, filterState]);

  const renderTourCard = ({ item }: { item: Tour }) => {
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
      {/* ─── Top Search Header ─── */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(
              insets.top,
              Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 6 : 14
            ),
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity testID="btn-navigate"
          style={styles.backBtn}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)');
            }
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={colors.heading} />
        </TouchableOpacity>

        <View
          style={[
            styles.inputBox,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <Ionicons name="search" size={18} color={colors.primary} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Search destination, tour, adventure..."
            placeholderTextColor={colors.mutedText}
            value={searchTerm}
            onChangeText={setSearchTerm}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="Search query"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity testID="btn-close"
              onPress={() => setSearchTerm('')}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Clear search input"
            >
              <Ionicons name="close-circle" size={18} color={colors.mutedText} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Trigger Button in Header */}
        <TouchableOpacity testID="btn-filters"
          style={[
            styles.filterTrigger,
            {
              backgroundColor: activeFiltersCount > 0 ? colors.primary : colors.background,
              borderColor: activeFiltersCount > 0 ? colors.primary : colors.border,
            },
          ]}
          onPress={() => {
            try {
              Haptics.selectionAsync();
            } catch {
              // Haptics fallback
            }
            setFilterModalVisible(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={`Open filters modal, ${activeFiltersCount} active`}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={activeFiltersCount > 0 ? '#ffffff' : colors.heading}
          />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <BrandLogo size="sm" width={56} />
      </View>

      {/* ─── Quick Filter / Sort Pills ─── */}
      <View
        style={[
          styles.quickBar,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
          {/* Active Sort Selector Chip */}
          <TouchableOpacity testID="btn-swap-vertical"
            style={[
              styles.pillChip,
              {
                backgroundColor:
                  filterState.sort !== 'featured' ? `${colors.primary}18` : colors.background,
                borderColor: filterState.sort !== 'featured' ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setFilterModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={`Sort by ${SORT_LABELS[filterState.sort]}`}
          >
            <Ionicons
              name="swap-vertical"
              size={12}
              color={filterState.sort !== 'featured' ? colors.primary : colors.mutedText}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.pillText,
                {
                  color: filterState.sort !== 'featured' ? colors.primary : colors.heading,
                  fontWeight: filterState.sort !== 'featured' ? '700' : '500',
                },
              ]}
            >
              {SORT_LABELS[filterState.sort]}
            </Text>
          </TouchableOpacity>

          {/* Category Chip if set */}
          {filterState.category !== 'All' && (
            <TouchableOpacity testID="btn-close"
              style={[
                styles.pillChip,
                { backgroundColor: `${colors.primary}18`, borderColor: colors.primary },
              ]}
              onPress={() => setFilterState((prev) => ({ ...prev, category: 'All' }))}
              accessibilityRole="button"
              accessibilityLabel={`Category ${filterState.category}, tap to remove`}
            >
              <Text style={[styles.pillText, { color: colors.primary, fontWeight: '700' }]}>
                {filterState.category}
              </Text>
              <Ionicons name="close" size={14} color={colors.primary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          )}

          {/* Price Range Chip if set */}
          {(filterState.minPrice !== undefined || filterState.maxPrice !== undefined) && (
            <TouchableOpacity testID="btn-search-results-433"
              style={[
                styles.pillChip,
                { backgroundColor: `${colors.primary}18`, borderColor: colors.primary },
              ]}
              onPress={() =>
                setFilterState((prev) => ({ ...prev, minPrice: undefined, maxPrice: undefined }))
              }
              accessibilityRole="button"
              accessibilityLabel="Price filter active, tap to remove"
            >
              <Text style={[styles.pillText, { color: colors.primary, fontWeight: '700' }]}>
                {filterState.minPrice !== undefined ? `> ₹${filterState.minPrice}` : ''}
                {filterState.maxPrice !== undefined ? ` < ₹${filterState.maxPrice}` : ''}
              </Text>
              <Ionicons name="close" size={14} color={colors.primary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* ─── Results Status Bar ─── */}
      <View
        style={[
          styles.statusBar,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.statusText, { color: colors.mutedText }]}>
          {isLoading
            ? 'Searching catalog…'
            : searchTerm.trim()
            ? `Found ${filteredTours.length} ${filteredTours.length === 1 ? 'tour' : 'tours'} for "${searchTerm.trim()}"`
            : `Showing all ${filteredTours.length} tours`}
        </Text>
        {(searchTerm.trim().length > 0 || activeFiltersCount > 0) && (
          <TouchableOpacity testID="btn-reset-all" onPress={clearFilters} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Clear all search and filters">
            <Text style={[styles.clearBtnText, { color: colors.primary }]}>Reset All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ─── Main Content ─── */}
      {isLoading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <SkeletonLoader count={4} />
        </View>
      ) : isError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color="#ef4444" />
          <Text
            style={[
              styles.errorTitle,
              { color: colors.heading, fontFamily: headingFontFamily },
            ]}
          >
            Unable to Load Tours
          </Text>
          <Text style={[styles.errorDesc, { color: colors.mutedText }]}>
            {error instanceof Error
              ? error.message
              : String(error || 'Could not connect to the catalog server. Please check your network.')}
          </Text>
          <TouchableOpacity testID="btn-retry"
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Retry search"
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredTours.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            title="No tours match your search"
            description={
              searchTerm.trim()
                ? `We couldn't find any expeditions matching "${searchTerm}". Try different keywords or browse our full collection.`
                : 'No tours match the selected filters.'
            }
            actionLabel={searchTerm.trim() || activeFiltersCount > 0 ? 'Reset Search & Filters' : 'Browse All Tours'}
            onAction={() => {
              if (searchTerm.trim() || activeFiltersCount > 0) {
                clearFilters();
              } else {
                router.replace('/(tabs)/explore');
              }
            }}
          />
        </View>
      ) : (
        <FlatList
          data={filteredTours}
          keyExtractor={(item, idx) => `sr_${item.id || item.slug || idx}_${idx}`}
          renderItem={renderTourCard}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 24) + SPACING.lg },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}

      {/* ─── Interactive Filter & Sort Modal ─── */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        initialFilters={filterState}
        totalResults={filteredTours.length}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm + 2,
    borderBottomWidth: 1,
    gap: 8,
    zIndex: 100,
    elevation: 8,
    ...SHADOW.sm,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 7 : 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    paddingVertical: 0,
  },
  filterTrigger: {
    minWidth: 38,
    height: 38,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  filterBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  quickBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
  },
  pillsScroll: {
    gap: 8,
    alignItems: 'center',
  },
  pillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    minHeight: 32,
  },
  pillText: {
    fontSize: FONT_SIZE.xs,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs + 3,
    borderBottomWidth: 1,
  },
  statusText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  clearBtnText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  loaderContainer: {
    padding: SPACING.md,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: 12,
  },
  errorTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorDesc: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  retryBtn: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    marginTop: 8,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  listContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  cardWrapper: {
    width: '100%',
  },
});

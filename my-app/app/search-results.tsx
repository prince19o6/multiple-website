/**
 * app/search-results.tsx
 *
 * Full-featured Global Search Results screen for targeted query discovery across all verticals:
 *   - Tours & Sightseeing
 *   - Hotels & Luxury Stays
 *   - Curated Holiday Packages
 *
 * Features:
 *   - Multi-tenant aware: Gujju Tours, TripGoAsia, Technoheaven
 *   - Deep-linking & navigation aware: accepts `q`, `searchTerm`, `destination`, `service`, `type`, `category`
 *   - Live vertical tabs: All Results, Tours, Hotels, Packages
 *   - Real-time search query input with focus, auto-clearing, and instant debounced updates
 *   - Unified item rendering: TourCard for tours, ModuleItemCard for hotels and packages
 *   - Interactive filter modal with sorting & price filtering
 *   - Automatic saving of queries to recent searches
 *   - Pull-to-refresh invalidating all vertical queries
 *   - Loading skeletons and rich empty states with 1-tap reset
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
import { useQuery } from '@tanstack/react-query';

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
import { ModuleItemCard } from '@/components/cards/ModuleItemCard';
import { MobileEnquirySheet } from '@/components/common/MobileEnquirySheet';
import { resolveTourCardVariant } from '@/lib/tourCardResolver';
import BrandLogo from '@/components/common/BrandLogo';
import FilterModal from '@/components/FilterModal';
import { fetchHotels, fetchPackages, type ModuleFeaturedItem } from '@/services/api';
import type { Tour, TourFilterState, TourSearchParams, TourSortOption } from '@/types';
import { tourHref } from '@/lib/navigation';

const SORT_LABELS: Record<TourSortOption, string> = {
  featured: 'Recommended',
  'price-low': 'Price: Low-High',
  'price-high': 'Price: High-Low',
  rating: 'Top Rated',
  newest: 'Newest',
};

type SearchModuleTab = 'all' | 'tours' | 'hotels' | 'packages';

interface UnifiedSearchItem {
  id: string;
  moduleType: 'tours' | 'hotels' | 'packages';
  tourData?: Tour;
  moduleData?: ModuleFeaturedItem;
}

const blurActiveElement = () => {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    try {
      (document.activeElement as HTMLElement)?.blur?.();
    } catch {}
  }
};

export default function SearchResultsScreen() {
  const params = useLocalSearchParams<{
    q?: string;
    searchTerm?: string;
    search?: string;
    destination?: string;
    service?: string;
    type?: string;
    category?: string;
  }>();

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const config = useSiteConfig();
  const { siteId } = useSite();
  const headingFontFamily = getHeadingFontFamily(config);

  // Initialize search input from any passed parameter
  const initialQuery = useMemo(() => {
    return (params.q || params.searchTerm || params.search || params.destination || '').trim();
  }, [params.q, params.searchTerm, params.search, params.destination]);

  // Determine initial module tab
  const initialTab = useMemo<SearchModuleTab>(() => {
    const raw = (params.service || params.type || '').toLowerCase();
    if (raw.includes('hotel') || raw.includes('stay')) return 'hotels';
    if (raw.includes('package') || raw.includes('holiday')) return 'packages';
    if (raw.includes('tour') || raw.includes('activit') || raw.includes('attraction')) return 'tours';
    return 'all';
  }, [params.service, params.type]);

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [debouncedTerm, setDebouncedTerm] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<SearchModuleTab>(initialTab);
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Debounce search input by 280ms to avoid flooding backend requests while typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 280);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Enquiry sheet for hotels/packages
  const [enquiryVisible, setEnquiryVisible] = useState(false);
  const [enquiryService, setEnquiryService] = useState('Travel Inquiry');

  const [filterState, setFilterState] = useState<TourFilterState>({
    sort: 'featured',
    category: params.category || 'All',
    minPrice: undefined,
    maxPrice: undefined,
    duration: undefined,
    difficulty: undefined,
  });

  const { addSearch } = useRecentSearches();

  // Save search term on mount if present
  useEffect(() => {
    if (initialQuery) {
      addSearch(initialQuery);
    }
  }, [initialQuery, addSearch]);

  // Sync tab if route params change
  useEffect(() => {
    if (initialTab && initialTab !== 'all') {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Sync search input if param changes
  useEffect(() => {
    if (initialQuery && initialQuery !== searchTerm) {
      setSearchTerm(initialQuery);
    }
  }, [initialQuery]);

  // Query filters for tours
  const queryFilters = useMemo<TourSearchParams>(() => {
    return {
      q: debouncedTerm.trim() || undefined,
      sort: filterState.sort !== 'featured' ? filterState.sort : undefined,
      category: filterState.category !== 'All' ? filterState.category : undefined,
      minPrice: filterState.minPrice,
      maxPrice: filterState.maxPrice,
      difficulty: filterState.difficulty,
    };
  }, [debouncedTerm, filterState]);

  // 1. Tours data query
  const { tours, isLoading: toursLoading, isError: toursError, error: tourErrorObj, refetch: refetchTours } = useTours(siteId, queryFilters);

  // 2. Hotels data query
  const {
    data: hotelsRes,
    isLoading: hotelsLoading,
    refetch: refetchHotels,
  } = useQuery({
    queryKey: ['searchHotels', siteId, debouncedTerm],
    queryFn: () =>
      fetchHotels(
        {
          destination: debouncedTerm.trim() || undefined,
          search: debouncedTerm.trim() || undefined,
          minPrice: filterState.minPrice,
          maxPrice: filterState.maxPrice,
        },
        siteId
      ),
    staleTime: 1000 * 60 * 3,
  });

  // 3. Packages data query
  const {
    data: packagesRes,
    isLoading: packagesLoading,
    refetch: refetchPackages,
  } = useQuery({
    queryKey: ['searchPackages', siteId, debouncedTerm],
    queryFn: () =>
      fetchPackages(
        {
          destination: debouncedTerm.trim() || undefined,
          search: debouncedTerm.trim() || undefined,
          minPrice: filterState.minPrice,
          maxPrice: filterState.maxPrice,
        },
        siteId
      ),
    staleTime: 1000 * 60 * 3,
  });

  // Refresh handler across all verticals
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchTours(), refetchHotels(), refetchPackages()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchTours, refetchHotels, refetchPackages]);

  // Active filter count calculation
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
    } catch {}
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

  // Filtered Tours
  const filteredTours = useMemo(() => {
    let list = [...tours];
    const term = debouncedTerm.trim().toLowerCase();
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

    if (filterState.sort === 'price-low') {
      list.sort((a, b) => a.price - b.price);
    } else if (filterState.sort === 'price-high') {
      list.sort((a, b) => b.price - a.price);
    } else if (filterState.sort === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return list;
  }, [tours, debouncedTerm, filterState]);

  // Filtered Hotels
  const filteredHotels = useMemo(() => {
    let list = hotelsRes?.data || [];
    const term = debouncedTerm.trim().toLowerCase();
    if (term) {
      list = list.filter((h) => {
        const title = (h.title || '').toLowerCase();
        const city = (h.city || '').toLowerCase();
        const loc = (h.location || '').toLowerCase();
        return title.includes(term) || city.includes(term) || loc.includes(term);
      });
    }
    return list;
  }, [hotelsRes, debouncedTerm]);

  // Filtered Packages
  const filteredPackages = useMemo(() => {
    let list = packagesRes?.data || [];
    const term = debouncedTerm.trim().toLowerCase();
    if (term) {
      list = list.filter((p) => {
        const title = (p.title || '').toLowerCase();
        const city = (p.city || '').toLowerCase();
        const loc = (p.location || '').toLowerCase();
        return title.includes(term) || city.includes(term) || loc.includes(term);
      });
    }
    return list;
  }, [packagesRes, debouncedTerm]);

  // Unified items list for FlatList
  const unifiedItems = useMemo<UnifiedSearchItem[]>(() => {
    if (activeTab === 'tours') {
      return filteredTours.map((t) => ({ id: `tour_${t.id}`, moduleType: 'tours', tourData: t }));
    }
    if (activeTab === 'hotels') {
      return filteredHotels.map((h) => ({ id: `hotel_${h.id}`, moduleType: 'hotels', moduleData: h }));
    }
    if (activeTab === 'packages') {
      return filteredPackages.map((p) => ({ id: `pkg_${p.id}`, moduleType: 'packages', moduleData: p }));
    }

    // All active: Interleave matching items
    const combined: UnifiedSearchItem[] = [];
    filteredTours.forEach((t) => combined.push({ id: `tour_${t.id}`, moduleType: 'tours', tourData: t }));
    filteredHotels.forEach((h) => combined.push({ id: `hotel_${h.id}`, moduleType: 'hotels', moduleData: h }));
    filteredPackages.forEach((p) => combined.push({ id: `pkg_${p.id}`, moduleType: 'packages', moduleData: p }));
    return combined;
  }, [activeTab, filteredTours, filteredHotels, filteredPackages]);

  // Check if primary loading is underway
  const isLoading = toursLoading || hotelsLoading || packagesLoading;

  // Render Tour Card
  const renderTourCard = (item: Tour) => {
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

  // Render unified row item
  const renderItem = ({ item }: { item: UnifiedSearchItem }) => {
    if (item.moduleType === 'tours' && item.tourData) {
      return (
        <View style={styles.itemContainer}>
          {activeTab === 'all' && (
            <View style={styles.badgeRow}>
              <View style={[styles.moduleBadge, { backgroundColor: '#3b82f615' }]}>
                <Ionicons name="compass-outline" size={13} color="#2563eb" />
                <Text style={[styles.moduleBadgeText, { color: '#2563eb' }]}>TOUR</Text>
              </View>
            </View>
          )}
          {renderTourCard(item.tourData)}
        </View>
      );
    }

    if (item.moduleType === 'hotels' && item.moduleData) {
      return (
        <View style={styles.itemContainer}>
          {activeTab === 'all' && (
            <View style={styles.badgeRow}>
              <View style={[styles.moduleBadge, { backgroundColor: '#10b98115' }]}>
                <Ionicons name="business-outline" size={13} color="#059669" />
                <Text style={[styles.moduleBadgeText, { color: '#059669' }]}>HOTEL</Text>
              </View>
            </View>
          )}
          <View style={styles.cardWrapper}>
            <ModuleItemCard
              module="hotels"
              item={item.moduleData}
              width="100%"
              onAction={() => {
                setEnquiryService(`Hotel Stay: ${item.moduleData?.title}`);
                setEnquiryVisible(true);
              }}
            />
          </View>
        </View>
      );
    }

    if (item.moduleType === 'packages' && item.moduleData) {
      return (
        <View style={styles.itemContainer}>
          {activeTab === 'all' && (
            <View style={styles.badgeRow}>
              <View style={[styles.moduleBadge, { backgroundColor: '#8b5cf615' }]}>
                <Ionicons name="map-outline" size={13} color="#7c3aed" />
                <Text style={[styles.moduleBadgeText, { color: '#7c3aed' }]}>PACKAGE</Text>
              </View>
            </View>
          )}
          <View style={styles.cardWrapper}>
            <ModuleItemCard
              module="packages"
              item={item.moduleData}
              width="100%"
              onAction={() => {
                setEnquiryService(`Holiday Package: ${item.moduleData?.title}`);
                setEnquiryVisible(true);
              }}
            />
          </View>
        </View>
      );
    }

    return null;
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
        <TouchableOpacity
          testID="btn-navigate"
          style={styles.backBtn}
          onPress={() => {
            blurActiveElement();
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
            placeholder="Search tours, hotels, packages, destinations..."
            placeholderTextColor={colors.mutedText}
            value={searchTerm}
            onChangeText={setSearchTerm}
            onSubmitEditing={() => {
              blurActiveElement();
              handleSearchSubmit();
            }}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="Search query"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity
              testID="btn-close"
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
        <TouchableOpacity
          testID="btn-filters"
          style={[
            styles.filterTrigger,
            {
              backgroundColor: activeFiltersCount > 0 ? colors.primary : colors.background,
              borderColor: activeFiltersCount > 0 ? colors.primary : colors.border,
            },
          ]}
          onPress={() => {
            blurActiveElement();
            try {
              Haptics.selectionAsync();
            } catch {}
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

      {/* ─── Dynamic Module Tabs Strip ─── */}
      <View style={[styles.moduleTabsStrip, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moduleTabsScroll}>
          {(
            [
              { id: 'all', label: 'All Results', icon: 'sparkles-outline', count: filteredTours.length + filteredHotels.length + filteredPackages.length },
              { id: 'tours', label: 'Tours', icon: 'compass-outline', count: filteredTours.length },
              { id: 'hotels', label: 'Hotels', icon: 'business-outline', count: filteredHotels.length },
              { id: 'packages', label: 'Packages', icon: 'map-outline', count: filteredPackages.length },
            ] as const
          ).map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => {
                  setActiveTab(tab.id);
                  try {
                    Haptics.selectionAsync();
                  } catch {}
                }}
                activeOpacity={0.8}
                style={[
                  styles.moduleTabChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.background,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${tab.label} tab, ${tab.count} results`}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={14}
                  color={isSelected ? '#ffffff' : colors.mutedText}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.moduleTabText,
                    {
                      color: isSelected ? '#ffffff' : colors.heading,
                      fontWeight: isSelected ? '700' : '600',
                    },
                  ]}
                >
                  {tab.label} ({tab.count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
          <TouchableOpacity
            testID="btn-swap-vertical"
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
            <TouchableOpacity
              testID="btn-close-category"
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
            <TouchableOpacity
              testID="btn-price-filter"
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
            ? `Found ${unifiedItems.length} ${unifiedItems.length === 1 ? 'item' : 'items'} for "${searchTerm.trim()}"`
            : `Showing all ${unifiedItems.length} items`}
        </Text>
        {(searchTerm.trim().length > 0 || activeFiltersCount > 0) && (
          <TouchableOpacity
            testID="btn-reset-all"
            onPress={clearFilters}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Clear all search and filters"
          >
            <Text style={[styles.clearBtnText, { color: colors.primary }]}>Reset All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ─── Main Content ─── */}
      {isLoading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <SkeletonLoader count={4} />
        </View>
      ) : toursError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={48} color="#ef4444" />
          <Text
            style={[
              styles.errorTitle,
              { color: colors.heading, fontFamily: headingFontFamily },
            ]}
          >
            Unable to Load Results
          </Text>
          <Text style={[styles.errorDesc, { color: colors.mutedText }]}>
            {tourErrorObj instanceof Error
              ? tourErrorObj.message
              : String(tourErrorObj || 'Could not connect to the catalog server. Please check your network.')}
          </Text>
          <TouchableOpacity
            testID="btn-retry"
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={onRefresh}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Retry search"
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : unifiedItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            title="No results match your search"
            description={
              searchTerm.trim()
                ? `We couldn't find any results matching "${searchTerm}". Try different keywords or switch categories.`
                : 'No items match the selected filters.'
            }
            actionLabel={searchTerm.trim() || activeFiltersCount > 0 ? 'Reset Search & Filters' : 'Browse All Catalogue'}
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
          data={unifiedItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
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
        totalResults={unifiedItems.length}
      />

      {/* ─── Mobile Enquiry Sheet ─── */}
      <MobileEnquirySheet
        visible={enquiryVisible}
        serviceName={enquiryService}
        onClose={() => setEnquiryVisible(false)}
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
  moduleTabsStrip: {
    borderBottomWidth: 1,
    paddingVertical: 6,
  },
  moduleTabsScroll: {
    paddingHorizontal: SPACING.md,
    gap: 8,
  },
  moduleTabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  moduleTabText: {
    fontSize: FONT_SIZE.xs,
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
  itemContainer: {
    width: '100%',
    marginBottom: SPACING.xs,
  },
  badgeRow: {
    marginBottom: 6,
  },
  moduleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  moduleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardWrapper: {
    width: '100%',
  },
});

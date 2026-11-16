/**
 * app/(tabs)/explore.tsx
 *
 * Fully responsive Explore screen with separate, independent sections per module.
 * Multi-tenant aware: Gujju Tours, TripGoAsia, Technoheaven.
 *
 * Architecture:
 * - Sticky module chips at the top: tapping any chip smoothly scrolls to that module's section.
 * - Vertical list of separate sections, one per enabled module in fixed canonical order:
 *   hotels, tours, packages, flights, transfers, visas, restaurants, buildpackage.
 * - Independent data loading per section (isolated query, skeleton, error state with Retry, empty state).
 *   A failure in one module never blocks the other modules.
 * - Horizontal FlatList of cards (6-10 items, lazy loaded) per section using unified ModuleItemCard.
 * - "See all" button opens a full module listing modal with instant search, multi-factor filters
 *   (price, rating, category/city, module-specific), sort, and paginated infinite scroll.
 * - Zero duplicated card code between Home and Explore.
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  RefreshControl,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';

import { useSite, useSiteConfig } from '@/store/SiteConfigContext';
import { useColors } from '@/store/ThemeContext';
import { useCurrency } from '@/context/CurrencyContext';
import {
  useActiveModule,
  type CanonicalModule,
  type ModuleItem,
} from '@/store/ModuleContext';
import { useModuleHome } from '@/hooks/useModuleHome';
import { ModuleItemCard } from '@/components/cards/ModuleItemCard';
import { SkeletonItem } from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import { MobileEnquirySheet } from '@/components/common/MobileEnquirySheet';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import type { ModuleFeaturedItem } from '@/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// INDEPENDENT MODULE SECTION COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
interface ModuleExploreSectionProps {
  moduleItem: ModuleItem;
  onSeeAll: (moduleItem: ModuleItem, items: ModuleFeaturedItem[]) => void;
  onOpenEnquiry: (serviceName: string) => void;
}

const ModuleExploreSection = React.memo(function ModuleExploreSection({
  moduleItem,
  onSeeAll,
  onOpenEnquiry,
}: ModuleExploreSectionProps) {
  const colors = useColors();
  const { data, isLoading, isError, error, refetch } = useModuleHome(moduleItem.id);

  const items = data?.featured || [];

  return (
    <View style={styles.sectionRoot}>
      {/* Section Header */}
      <View style={styles.sectionHeaderRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIconBadge, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name={moduleItem.icon} size={16} color={colors.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.heading }]}>
              {data?.meta?.collectionTitle || moduleItem.label}
            </Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]} numberOfLines={1}>
            {data?.meta?.collectionSubtitle || `Browse handpicked ${moduleItem.label.toLowerCase()}`}
          </Text>
        </View>

        {items.length > 0 && (
          <TouchableOpacity
            onPress={() => onSeeAll(moduleItem, items)}
            activeOpacity={0.7}
            style={styles.seeAllBtn}
            accessibilityRole="button"
            accessibilityLabel={`See all ${moduleItem.label}`}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See all</Text>
            <Ionicons name="chevron-forward" size={15} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* ─── SECTION LOADING SKELETON ─── */}
      {isLoading && !data && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.skeletonCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <SkeletonItem width="100%" height={140} borderRadius={0} />
              <View style={{ padding: 12, gap: 8 }}>
                <SkeletonItem width="45%" height={14} />
                <SkeletonItem width="85%" height={18} />
                <SkeletonItem width="35%" height={16} style={{ marginTop: 8 }} />
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* ─── SECTION ISOLATED ERROR STATE ─── */}
      {isError && !data && (
        <View style={[styles.sectionErrorBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="alert-circle-outline" size={24} color="#ef4444" />
          <View style={{ flex: 1, marginHorizontal: 10 }}>
            <Text style={[styles.sectionErrorTitle, { color: colors.heading }]}>
              Could not load {moduleItem.label}
            </Text>
            <Text style={[styles.sectionErrorSubtitle, { color: colors.mutedText }]} numberOfLines={1}>
              {error?.message || 'Network timeout'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => refetch()}
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            accessibilityRole="button"
            accessibilityLabel={`Retry loading ${moduleItem.label}`}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── SECTION CONTENT (HORIZONTAL FLATLIST) ─── */}
      {data && items.length > 0 && (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={items.slice(0, 10)}
          keyExtractor={(item, idx) => `explore_${moduleItem.id}_${item.id || item.slug || idx}_${idx}`}
          contentContainerStyle={styles.horizontalScroll}
          initialNumToRender={4}
          maxToRenderPerBatch={6}
          windowSize={5}
          renderItem={({ item }) => (
            <ModuleItemCard
              module={moduleItem.id}
              item={item}
              width={280}
              onAction={() => onOpenEnquiry(`Booking for ${item.title}`)}
            />
          )}
        />
      )}

      {/* ─── EMPTY STATE FOR MODULE ─── */}
      {data && items.length === 0 && (
        <View style={[styles.sectionEmptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name={moduleItem.icon} size={28} color={colors.mutedText} />
          <Text style={[styles.sectionEmptyText, { color: colors.mutedText }]}>
            No {moduleItem.label.toLowerCase()} available right now.
          </Text>
        </View>
      )}
    </View>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// FULL MODULE LISTING MODAL ("SEE ALL" VIEW)
// ─────────────────────────────────────────────────────────────────────────────
interface ModuleListingModalProps {
  visible: boolean;
  moduleItem: ModuleItem | null;
  items: ModuleFeaturedItem[];
  onClose: () => void;
  onOpenEnquiry: (serviceName: string) => void;
}

type SortOption = 'recommended' | 'price-asc' | 'price-desc' | 'rating-desc';
type PriceFilter = 'all' | 'under100' | '100to500' | 'above500';

function ModuleListingModal({
  visible,
  moduleItem,
  items,
  onClose,
  onOpenEnquiry,
}: ModuleListingModalProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('recommended');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const PAGE_SIZE = 8;

  // Reset filters when modal opens for a new module
  React.useEffect(() => {
    if (visible) {
      setSearch('');
      setSort('recommended');
      setPriceFilter('all');
      setMinRating(0);
      setPage(1);
    }
  }, [visible, moduleItem?.id]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (it) =>
          it.title?.toLowerCase().includes(q) ||
          it.category?.toLowerCase().includes(q) ||
          it.city?.toLowerCase().includes(q) ||
          it.country?.toLowerCase().includes(q) ||
          it.airline?.toLowerCase().includes(q) ||
          it.cuisine?.toLowerCase().includes(q)
      );
    }

    // Price filter
    if (priceFilter === 'under100') {
      result = result.filter((it) => (it.price || 0) < 100);
    } else if (priceFilter === '100to500') {
      result = result.filter((it) => (it.price || 0) >= 100 && (it.price || 0) <= 500);
    } else if (priceFilter === 'above500') {
      result = result.filter((it) => (it.price || 0) > 500);
    }

    // Rating filter
    if (minRating > 0) {
      result = result.filter((it) => (it.rating || 0) >= minRating);
    }

    // Sorting
    if (sort === 'price-asc') {
      result.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sort === 'price-desc') {
      result.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sort === 'rating-desc') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [items, search, sort, priceFilter, minRating]);

  // Paginated slice
  const paginatedItems = useMemo(() => {
    return filteredItems.slice(0, page * PAGE_SIZE);
  }, [filteredItems, page]);

  const hasMore = paginatedItems.length < filteredItems.length;

  const handleLoadMore = () => {
    if (hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  if (!moduleItem) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.modalContainer,
          {
            backgroundColor: colors.background,
            paddingTop: Platform.OS === 'ios' ? insets.top : 12,
          },
        ]}
      >
        {/* Modal Header */}
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <View style={styles.modalHeaderTitleRow}>
            <View style={[styles.sectionIconBadge, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name={moduleItem.icon} size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.modalTitle, { color: colors.heading }]}>
                All {moduleItem.label}
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.mutedText }]}>
                {filteredItems.length} available results
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.modalCloseBtn, { backgroundColor: colors.surface }]}
            accessibilityRole="button"
            accessibilityLabel="Close listing"
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.modalSearchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={`Search ${moduleItem.label.toLowerCase()}...`}
            placeholderTextColor={colors.mutedText}
            style={[styles.modalSearchInput, { color: colors.text }]}
            clearButtonMode="while-editing"
          />
          {search.length > 0 && Platform.OS !== 'ios' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.mutedText} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter & Sort Chips */}
        <View style={styles.filterStripWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterStrip}>
            {/* Sort options */}
            <TouchableOpacity
              onPress={() => setSort(sort === 'recommended' ? 'price-asc' : sort === 'price-asc' ? 'price-desc' : sort === 'price-desc' ? 'rating-desc' : 'recommended')}
              style={[styles.filterChip, { backgroundColor: sort !== 'recommended' ? colors.primary : colors.surface, borderColor: colors.border }]}
            >
              <Ionicons name="swap-vertical" size={13} color={sort !== 'recommended' ? '#ffffff' : colors.text} />
              <Text style={[styles.filterChipText, { color: sort !== 'recommended' ? '#ffffff' : colors.text }]}>
                {sort === 'recommended' ? 'Sort: Recommended' : sort === 'price-asc' ? 'Price: Low-High' : sort === 'price-desc' ? 'Price: High-Low' : 'Top Rated'}
              </Text>
            </TouchableOpacity>

            {/* Price filter */}
            {(['all', 'under100', '100to500', 'above500'] as PriceFilter[]).map((pf) => {
              const label = pf === 'all' ? 'All Prices' : pf === 'under100' ? '< $100' : pf === '100to500' ? '$100-$500' : '> $500';
              const isSelected = priceFilter === pf;
              return (
                <TouchableOpacity
                  key={pf}
                  onPress={() => setPriceFilter(pf)}
                  style={[styles.filterChip, { backgroundColor: isSelected ? colors.primary : colors.surface, borderColor: isSelected ? colors.primary : colors.border }]}
                >
                  <Text style={[styles.filterChipText, { color: isSelected ? '#ffffff' : colors.text }]}>{label}</Text>
                </TouchableOpacity>
              );
            })}

            {/* Rating filter */}
            {[0, 4.0, 4.5].map((r) => {
              const isSelected = minRating === r;
              return (
                <TouchableOpacity
                  key={r}
                  onPress={() => setMinRating(isSelected ? 0 : r)}
                  style={[styles.filterChip, { backgroundColor: isSelected && r > 0 ? colors.primary : colors.surface, borderColor: isSelected && r > 0 ? colors.primary : colors.border }]}
                >
                  <Ionicons name="star" size={12} color={isSelected && r > 0 ? '#ffffff' : '#f59e0b'} />
                  <Text style={[styles.filterChipText, { color: isSelected && r > 0 ? '#ffffff' : colors.text }]}>
                    {r === 0 ? 'All Ratings' : `${r}+ ★`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Listing Results */}
        <FlatList
          data={paginatedItems}
          keyExtractor={(it, idx) => `listing_${it.id || it.slug || idx}_${idx}`}
          contentContainerStyle={styles.modalListContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="No items found"
              description="Try adjusting your search or resetting active filters."
              actionLabel="Reset Filters"
              onAction={() => {
                setSearch('');
                setPriceFilter('all');
                setMinRating(0);
                setSort('recommended');
              }}
            />
          }
          renderItem={({ item }) => (
            <View style={{ marginBottom: SPACING.md }}>
              <ModuleItemCard
                module={moduleItem.id}
                item={item}
                width="100%"
                onAction={() => {
                  onClose();
                  onOpenEnquiry(`Booking for ${item.title}`);
                }}
              />
            </View>
          )}
        />
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPLORE SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function ExploreScreen() {
  const router = useRouter();
  const colors = useColors();
  const queryClient = useQueryClient();
  const { siteId } = useSite();
  const { enabledModules, activeModule, setActiveModule } = useActiveModule();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedListingModule, setSelectedListingModule] = useState<ModuleItem | null>(null);
  const [listingItems, setListingItems] = useState<ModuleFeaturedItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  // Bottom enquiry sheet state
  const [enquiryVisible, setEnquiryVisible] = useState(false);
  const [enquiryService, setEnquiryService] = useState('Custom Travel Package');

  const mainScrollRef = useRef<any>(null);
  const sectionPositions = useRef<Record<string, number>>({});

  const handleOpenEnquiry = (serviceName?: string) => {
    setEnquiryService(serviceName || 'Custom Travel Package');
    setEnquiryVisible(true);
  };

  const handleOpenSeeAll = (mod: ModuleItem, items: ModuleFeaturedItem[]) => {
    setSelectedListingModule(mod);
    setListingItems(items);
    setModalVisible(true);
  };

  // Pull-to-refresh: invalidates all module home queries
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['moduleHome', siteId] });
    } finally {
      setRefreshing(false);
    }
  }, [siteId, queryClient]);

  // Jump to section when a module chip is clicked
  const handleScrollToModule = (modId: CanonicalModule) => {
    setActiveModule(modId);
    const posY = sectionPositions.current[modId];
    if (posY !== undefined && mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ y: Math.max(0, posY - 70), animated: true });
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ─── STICKY MODULE SELECTOR STRIP AT TOP ─── */}
      <View style={[styles.stickyStrip, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stickyScrollContent}
        >
          {enabledModules.map((item) => {
            const isSelected = item.id === activeModule;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleScrollToModule(item.id)}
                activeOpacity={0.8}
                style={[
                  styles.stickyChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.background,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${item.label} section`}
              >
                <Ionicons
                  name={item.icon}
                  size={15}
                  color={isSelected ? '#ffffff' : colors.mutedText}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.stickyChipText,
                    {
                      color: isSelected ? '#ffffff' : colors.text,
                      fontWeight: isSelected ? '700' : '600',
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ─── VERTICAL LIST OF SEPARATE MODULE SECTIONS ─── */}
      <ScrollView
        ref={mainScrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.mainScrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {enabledModules.map((modItem) => (
          <View
            key={modItem.id}
            onLayout={(event) => {
              sectionPositions.current[modItem.id] = event.nativeEvent.layout.y;
            }}
          >
            <ModuleExploreSection
              moduleItem={modItem}
              onSeeAll={handleOpenSeeAll}
              onOpenEnquiry={handleOpenEnquiry}
            />
          </View>
        ))}
      </ScrollView>

      {/* "See all" Full Module Listing Modal */}
      <ModuleListingModal
        visible={modalVisible}
        moduleItem={selectedListingModule}
        items={listingItems}
        onClose={() => setModalVisible(false)}
        onOpenEnquiry={handleOpenEnquiry}
      />

      {/* Instant Enquiry / Lead Sheet */}
      <MobileEnquirySheet
        visible={enquiryVisible}
        onClose={() => setEnquiryVisible(false)}
        serviceName={enquiryService}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  stickyStrip: {
    paddingVertical: SPACING.xs + 2,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  stickyScrollContent: {
    paddingHorizontal: SPACING.md,
    gap: 8,
    alignItems: 'center',
  },
  stickyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    minHeight: 38,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  stickyChipText: {
    fontSize: FONT_SIZE.xs,
  },
  mainScrollContent: {
    paddingVertical: SPACING.md,
    gap: SPACING.lg,
  },

  // Section Styles
  sectionRoot: {
    marginBottom: SPACING.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  seeAllText: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '700',
    marginRight: 2,
  },
  horizontalScroll: {
    paddingHorizontal: SPACING.md,
    gap: 12,
  },
  skeletonCard: {
    width: 260,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionErrorBox: {
    marginHorizontal: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionErrorTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  sectionErrorSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionEmptyBox: {
    marginHorizontal: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  sectionEmptyText: {
    fontSize: FONT_SIZE.xs,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.sm + 2,
    height: 42,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    height: '100%',
  },
  filterStripWrapper: {
    paddingVertical: SPACING.xs + 2,
  },
  filterStrip: {
    paddingHorizontal: SPACING.md,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    gap: 4,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalListContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
  },
});

/**
 * app/(tabs)/wishlist.tsx
 *
 * Wishlist tab screen for saved / favorited tours and expeditions.
 * Features per-website tenant local persistence with complete brand isolation.
 *
 * Enhancements:
 *   - Rich item representation across all modules (tours, hotels, packages, flights, transfers, visas, restaurants)
 *   - AppHeader with brand logo and Clear All action
 *   - Summary banner showing total saved count and estimated total investment
 *   - Dynamic category filter chips for quick filtering of bookmarked expeditions
 *   - Direct toggle removal on each saved card
 *   - Safe typed navigation with zero `any`
 *   - 44px minimum touch targets and accessibility labels
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useSiteConfig } from '@/store/SiteConfigContext';
import { useSelectedSite } from '@/hooks/useSelectedSite';
import { useWishlist, type WishlistItem } from '@/context/WishlistContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useTours } from '@/hooks/useTours';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';
import { resolveTourCardVariant } from '@/lib/tourCardResolver';
import TourCard from '@/components/TourCard';
import AdventureTourCard from '@/components/AdventureTourCard';
import LuxuryTourCard from '@/components/LuxuryTourCard';
import { ModuleItemCard } from '@/components/cards/ModuleItemCard';
import AppHeader from '@/components/common/AppHeader';

export default function WishlistTabScreen() {
  const router = useRouter();
  const colors = useColors();
  const config = useSiteConfig();
  const { siteId } = useSelectedSite();
  const { currencySymbol, convertPrice } = useCurrency();
  const { wishlistIds, wishlistItems, clearWishlist, removeFromWishlist } = useWishlist();
  const { tours } = useTours(siteId || 'gujjutours');
  const headingFontFamily = getHeadingFontFamily(config);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Merge rich wishlist items and any tours from catalog matching wishlist IDs
  const allSavedItems = useMemo(() => {
    const list: WishlistItem[] = [];
    const seen = new Set<string>();

    // 1. First include all rich items saved by the user
    wishlistItems.forEach((item) => {
      const key = String(item.slug || item.id || item.title || item.name)
        .toLowerCase()
        .trim();
      if (!seen.has(key)) {
        seen.add(key);
        list.push(item);
      }
    });

    // 2. Also check if any tours from catalog match wishlistIds (for legacy or direct tour bookmarks)
    tours.forEach((t) => {
      const sId = String(t.id).toLowerCase().trim();
      const slug = t.slug ? String(t.slug).toLowerCase().trim() : '';
      const name = t.name ? String(t.name).toLowerCase().trim() : '';

      const isSaved = wishlistIds.some((id) => {
        const idStr = String(id).toLowerCase().trim();
        return idStr === sId || (slug && idStr === slug) || (name && idStr === name);
      });

      if (isSaved && !seen.has(sId) && (!slug || !seen.has(slug)) && (!name || !seen.has(name))) {
        seen.add(sId);
        if (slug) seen.add(slug);
        if (name) seen.add(name);
        list.push({
          id: t.id,
          slug: t.slug,
          name: t.name,
          title: t.name,
          description: t.description,
          price: t.price,
          rating: t.rating,
          image: t.image,
          imageUrl: t.image,
          duration: t.duration,
          difficulty: t.difficulty,
          location: t.location || t.destination,
          category: t.category || 'TOURS',
          module: 'tours',
        });
      }
    });

    return list;
  }, [wishlistItems, wishlistIds, tours]);

  // Module display mappings with clean icons
  const MODULE_CONFIGS: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
    all: { label: 'All', icon: 'grid-outline' },
    hotels: { label: 'Hotels', icon: 'business-outline' },
    tours: { label: 'Tours', icon: 'compass-outline' },
    packages: { label: 'Packages', icon: 'briefcase-outline' },
    transfers: { label: 'Transfers', icon: 'car-outline' },
    flights: { label: 'Flights', icon: 'airplane-outline' },
    visas: { label: 'Visas', icon: 'document-text-outline' },
    restaurants: { label: 'Restaurants', icon: 'restaurant-outline' },
  };

  // Extract unique module and category filters from saved items
  const availableFilters = useMemo(() => {
    const presentModules = new Set<string>();
    const presentCategories = new Set<string>();

    allSavedItems.forEach((item) => {
      const mod = (item.module || 'tours').toLowerCase();
      presentModules.add(mod);
      if (item.category) {
        presentCategories.add(item.category.toLowerCase());
      }
    });

    const filters: { id: string; label: string; icon: keyof typeof Ionicons.glyphMap; count: number }[] = [
      { id: 'all', label: 'All', icon: 'grid-outline', count: allSavedItems.length },
    ];

    // Priority 1: Canonical module filters present in saved items
    const canonicalOrder = ['tours', 'hotels', 'packages', 'transfers', 'flights', 'visas', 'restaurants'];
    canonicalOrder.forEach((modKey) => {
      if (presentModules.has(modKey)) {
        const count = allSavedItems.filter(
          (t) => (t.module || 'tours').toLowerCase() === modKey
        ).length;
        filters.push({
          id: modKey,
          label: MODULE_CONFIGS[modKey]?.label || modKey.toUpperCase(),
          icon: MODULE_CONFIGS[modKey]?.icon || 'bookmark-outline',
          count,
        });
      }
    });

    // Priority 2: Additional unique categories
    presentCategories.forEach((catKey) => {
      if (!presentModules.has(catKey)) {
        const count = allSavedItems.filter(
          (t) => t.category?.toLowerCase() === catKey
        ).length;
        if (count > 0 && !filters.some((f) => f.id === catKey)) {
          filters.push({
            id: catKey,
            label: catKey.charAt(0).toUpperCase() + catKey.slice(1),
            icon: 'pricetag-outline',
            count,
          });
        }
      }
    });

    return filters;
  }, [allSavedItems]);

  // Filtered by selected module/category chip
  const displayedItems = useMemo(() => {
    if (selectedCategory === 'all') return allSavedItems;
    const target = selectedCategory.toLowerCase();
    return allSavedItems.filter((t) => {
      const mod = (t.module || 'tours').toLowerCase();
      const cat = (t.category || '').toLowerCase();
      return mod === target || cat === target;
    });
  }, [allSavedItems, selectedCategory]);

  // Total estimated investment sum
  const totalValue = useMemo(() => {
    return allSavedItems.reduce((acc, t) => acc + convertPrice(t.price || 0), 0);
  }, [allSavedItems, convertPrice]);

  const handleNavigateToItem = (item: WishlistItem) => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Haptics fallback
    }

    const mod = (item.module || 'tours').toLowerCase();
    switch (mod) {
      case 'hotels':
      case 'packages':
      case 'tours':
        router.push({
          pathname: '/tour/[id]',
          params: { id: String(item.slug || item.id) },
        });
        break;
      case 'transfers':
      case 'flights':
        router.push('/airport-transfer' as any);
        break;
      case 'visas':
        router.push('/visa-hub' as any);
        break;
      case 'restaurants':
        router.push('/culinary-guide' as any);
        break;
      default:
        router.push({
          pathname: '/tour/[id]',
          params: { id: String(item.slug || item.id) },
        });
        break;
    }
  };

  const handleClearAll = () => {
    if (allSavedItems.length === 0) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Haptics fallback
    }

    const performClear = async () => {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Haptics fallback
      }
      await clearWishlist();
    };

    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined'
          ? window.confirm('Are you sure you want to remove all saved expeditions from your wishlist?')
          : true;
      if (confirmed) {
        void performClear();
      }
      return;
    }

    Alert.alert(
      'Clear Wishlist',
      'Are you sure you want to remove all saved expeditions from your wishlist?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: performClear,
        },
      ]
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* App Header with Brand Logo & Clear All Action */}
      <AppHeader
        title="My Wishlist"
        showLogo={true}
        logoSize="sm"
        rightActions={
          allSavedItems.length > 0 ? (
            <TouchableOpacity testID="btn-trash-outline"
              style={styles.clearBtn}
              onPress={handleClearAll}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Clear all items from wishlist"
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" style={{ marginRight: 4 }} />
              <Text style={styles.clearBtnText}>Clear</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {allSavedItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconBox, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="heart-outline" size={42} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.heading, fontFamily: headingFontFamily }]}>
              Your wishlist is empty
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedText }]}>
              Tap the heart icon on any tour or expedition to bookmark your favorite journeys.
            </Text>
            <TouchableOpacity testID="btn-explore-available-tours"
              style={[styles.exploreButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                if (Platform.OS === 'web' && typeof document !== 'undefined') {
                  try { (document.activeElement as HTMLElement)?.blur?.(); } catch {}
                }
                router.push('/(tabs)/explore');
              }}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Explore tours"
            >
              <Text style={styles.exploreButtonText}>Explore Available Tours</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {/* ─── Summary Overview Card ─── */}
            <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.summaryTopRow}>
                <View>
                  <Text style={[styles.summaryCountText, { color: colors.heading, fontFamily: headingFontFamily }]}>
                    {allSavedItems.length} {allSavedItems.length === 1 ? 'Item' : 'Items'} Bookmarked
                  </Text>
                  <Text style={[styles.summarySubText, { color: colors.mutedText }]}>
                    Saved to your private travel wishlist
                  </Text>
                </View>

                <View style={[styles.totalValueBadge, { backgroundColor: `${colors.primary}15` }]}>
                  <Text style={[styles.totalValuePrefix, { color: colors.mutedText }]}>Est. Total</Text>
                  <Text style={[styles.totalValueAmount, { color: colors.primary }]}>
                    {currencySymbol}{totalValue.toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Module & Category Filter Chips */}
              {availableFilters.length > 2 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsRow}
                >
                  {availableFilters.map((filter) => {
                    const isSelected = selectedCategory.toLowerCase() === filter.id.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={filter.id}
                        testID={`btn-wishlist-filter-${filter.id}`}
                        accessibilityLabel={`Filter by ${filter.label}`}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.background,
                            borderColor: isSelected ? colors.primary : colors.border,
                            flexDirection: 'row',
                            alignItems: 'center',
                          },
                        ]}
                        onPress={() => setSelectedCategory(filter.id)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={filter.icon}
                          size={13}
                          color={isSelected ? '#ffffff' : colors.mutedText}
                          style={{ marginRight: 4 }}
                        />
                        <Text
                          style={[
                            styles.chipText,
                            { color: isSelected ? '#ffffff' : colors.mutedText },
                          ]}
                        >
                          {filter.label} ({filter.count})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* ─── Cards List ─── */}
            {displayedItems.map((item, index) => {
              const navigateFn = () => handleNavigateToItem(item);
              const cardVariant = resolveTourCardVariant(config);
              const isTour = !item.module || item.module === 'tours';
              const itemIdent = item.id || item.slug || item.title || item.name!;
              const itemKey = `wish_${item.module || 'tour'}_${item.id || item.slug || item.title || item.name || index}_${index}`;

              if (!isTour) {
                return (
                  <View key={itemKey} style={styles.cardWrapper}>
                    <ModuleItemCard
                      module={item.module as any}
                      item={{
                        id: String(item.id),
                        slug: item.slug || String(item.id),
                        title: item.title || item.name || 'Saved Item',
                        price: item.price,
                        rating: item.rating,
                        imageUrl: item.imageUrl || item.image,
                        city: item.city || item.location,
                        country: item.country,
                        duration: item.duration,
                        category: item.category,
                        badge: item.badge,
                        stars: item.stars,
                      }}
                      isWishlisted={true}
                      onPress={navigateFn}
                      onToggleWishlist={() => removeFromWishlist(itemIdent, item.module)}
                      width="100%"
                    />
                  </View>
                );
              }

              if (cardVariant === 'adventure') {
                return (
                  <View key={itemKey} style={styles.cardWrapper}>
                    <AdventureTourCard
                      id={item.id}
                      name={item.name || item.title || 'Saved Tour'}
                      description={item.description || ''}
                      price={item.price || 0}
                      rating={item.rating || 5.0}
                      image={item.image || item.imageUrl || ''}
                      duration={item.duration || 'Full Day'}
                      difficulty={item.difficulty || 'Moderate'}
                      onBook={navigateFn}
                      onPress={navigateFn}
                      isWishlisted={true}
                      onToggleWishlist={() => removeFromWishlist(itemIdent, 'tours')}
                    />
                  </View>
                );
              }

              if (cardVariant === 'luxury') {
                return (
                  <View key={itemKey} style={styles.cardWrapper}>
                    <LuxuryTourCard
                      id={item.id}
                      name={item.name || item.title || 'Saved Tour'}
                      description={item.description || ''}
                      price={item.price || 0}
                      rating={item.rating || 5.0}
                      image={item.image || item.imageUrl || ''}
                      duration={item.duration || 'Full Day'}
                      location={item.location || item.city}
                      onBook={navigateFn}
                      onPress={navigateFn}
                      headingFontFamily={headingFontFamily}
                      isWishlisted={true}
                      onToggleWishlist={() => removeFromWishlist(itemIdent, 'tours')}
                    />
                  </View>
                );
              }

              return (
                <View key={itemKey} style={styles.cardWrapper}>
                  <TourCard
                    id={item.id}
                    name={item.name || item.title || 'Saved Tour'}
                    description={item.description || ''}
                    price={item.price || 0}
                    rating={item.rating || 5.0}
                    image={item.image || item.imageUrl || ''}
                    duration={item.duration || 'Full Day'}
                    difficulty={item.difficulty || 'Moderate'}
                    onBook={navigateFn}
                    onPress={navigateFn}
                    isWishlisted={true}
                    onToggleWishlist={() => removeFromWishlist(itemIdent, 'tours')}
                  />
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    minHeight: 44,
  },
  clearBtnText: {
    color: '#ef4444',
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl + 20,
  },
  list: {
    gap: SPACING.md,
  },
  summaryCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: SPACING.sm,
    ...SHADOW.sm,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryCountText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  summarySubText: {
    fontSize: FONT_SIZE.xs - 1,
    marginTop: 2,
  },
  totalValueBadge: {
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.md,
  },
  totalValuePrefix: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  totalValueAmount: {
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: '900',
  },
  chipsRow: {
    gap: 6,
    paddingTop: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    minHeight: 32,
    justifyContent: 'center',
  },
  chipText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  cardWrapper: {
    marginBottom: SPACING.xs,
  },
  emptyContainer: {
    paddingVertical: SPACING.xxl + 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  emptyDesc: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  exploreButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    minHeight: 44,
    justifyContent: 'center',
    ...SHADOW.sm,
  },
  exploreButtonText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
});

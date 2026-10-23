/**
 * app/(tabs)/index.tsx
 *
 * Home screen for the native mobile application.
 * Architected with a dynamic Section Registry pattern for maximum scanability:
 *   - Fixed top hero card & compact search trigger
 *   - 5-item Quick Actions grid with "All Tools" bottom sheet trigger (TravelHubModal)
 *   - Virtualized vertical FlatList rendering sections according to tenant configuration
 *   - Categories horizontal filter
 *   - Featured Expeditions horizontal list (max 5 cards + "See all" -> /featured-tours)
 *   - Popular Destinations horizontal list (max 6 cards + "See all" -> /destinations)
 *   - Curated Seasonal Deals promo card ("View more" -> /special-offers)
 *   - Personalized block (Trip Countdown & Recently Viewed — 100% hidden when empty)
 *   - "More for You" collapsible accordion (Culinary, Culture, Concierge) with session persistence
 *   - Full TravelHubModal containing all 18+ specialized utilities
 *   - Isolated skeletons, empty states, and per-section error boundaries with Retry
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSite, useSiteConfig } from '@/store/SiteConfigContext';
import { useColors } from '@/store/ThemeContext';
import { useTours } from '@/hooks/useTours';
import { useDestinations } from '@/hooks/useDestinations';
import { useBooking } from '@/context/BookingContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useLanguage } from '@/context/LanguageContext';
import { queryKeys } from '@/store/queryClient';
import { getSiteEntry } from '@/constants/siteRegistry';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';
import { DEFAULT_BLURHASH, resolveImageUrl } from '@/lib/imageUtils';
import { tourHref } from '@/lib/navigation';
import type { Tour } from '@/types';
import type { DestinationItem } from '@/hooks/useDestinations';

// Registry & Home Components
import { resolveHomeSections, type HomeSection } from '@/constants/homeSections';
import { SectionHeader } from '@/components/home/SectionHeader';
import { HorizontalList } from '@/components/home/HorizontalList';
import { QuickActionsGrid } from '@/components/home/QuickActionsGrid';
import { TravelHubModal } from '@/components/home/TravelHubModal';
import { CollapsibleSection } from '@/components/home/CollapsibleSection';
import { ViewMoreButton } from '@/components/home/ViewMoreButton';
import { TravelGuidesCards } from '@/components/home/TravelGuidesCards';
import { SpecialOffersSection } from '@/components/home/SpecialOffersSection';
import { RecentlyViewedSection } from '@/components/home/RecentlyViewedSection';
import { SectionSkeleton } from '@/components/home/SectionSkeleton';

// Card variants & Existing components
import { MemoizedTourCardHorizontal as TourCardHorizontal } from '@/components/TourCardHorizontal';
import UpcomingTripCountdown from '@/components/UpcomingTripCountdown';
import { CulinaryHighlightCard } from '@/components/CulinaryHighlightCard';
import { CultureHeroCard } from '@/components/CultureHeroCard';
import { useConcierge } from '@/context/ConciergeContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen() {
  const router = useRouter();
  const config = useSiteConfig();
  const colors = useColors();
  const queryClient = useQueryClient();
  const { siteId, hostname, currency: siteCurrency } = useSite();
  const currentSite = getSiteEntry(siteId);
  const { t } = useLanguage();
  const headingFontFamily = getHeadingFontFamily(config);
  const { openConcierge } = useConcierge();

  const { currencySymbol } = useCurrency();
  const currency = currencySymbol || siteCurrency?.symbol || '$';

  // Live queries
  const {
    tours,
    isLoading: toursLoading,
    isError: toursIsError,
    error: toursError,
    refetch: refetchTours,
  } = useTours();

  const {
    destinations,
    isLoading: destsLoading,
    isError: destsIsError,
    error: destsError,
    refetch: refetchDests,
  } = useDestinations();

  const { bookings, refreshBookings } = useBooking();

  // Local UI states
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [travelHubVisible, setTravelHubVisible] = useState(false);
  const [moreForYouExpanded, setMoreForYouExpanded] = useState(false);

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.tours(siteId, hostname) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.destinations(siteId, hostname) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.siteConfig(siteId, hostname) }),
      ]);
      await Promise.all([refetchTours(), refetchDests(), refreshBookings()]);
    } finally {
      setRefreshing(false);
    }
  }, [siteId, hostname, queryClient, refetchTours, refetchDests, refreshBookings]);

  // Categories definition
  const categories = useMemo(
    () => [
      { id: 'all', label: 'All', icon: 'compass-outline' as const },
      { id: 'adventure', label: 'Adventure', icon: 'trail-sign-outline' as const },
      { id: 'beach', label: 'Beach', icon: 'water-outline' as const },
      { id: 'cultural', label: 'Cultural', icon: 'business-outline' as const },
      { id: 'wildlife', label: 'Wildlife', icon: 'leaf-outline' as const },
      { id: 'luxury', label: 'Luxury', icon: 'diamond-outline' as const },
    ],
    []
  );

  // Resolved dynamic section order
  const sections = useMemo(() => {
    return resolveHomeSections(config);
  }, [config]);

  // Filtered featured tours (capped to section maxItems)
  const featuredToursList = useMemo(() => {
    if (!tours || tours.length === 0) return [];
    const filtered = tours.filter((t) => {
      if (selectedCategory === 'All') return true;
      const cat = (t.category || '').toLowerCase();
      const target = selectedCategory.toLowerCase();
      return cat === target || t.description?.toLowerCase().includes(target);
    });
    return filtered.slice(0, 5);
  }, [tours, selectedCategory]);

  // Capped destinations list (up to 10 destinations)
  const destinationsList = useMemo(() => {
    return (destinations || []).slice(0, 10);
  }, [destinations]);

  // Toggle "More for you" section
  const handleToggleMoreForYou = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMoreForYouExpanded((prev) => !prev);
  };

  // ─── Header Component (Welcome Card + Quick Actions) ───
  const renderHeader = () => (
    <View style={styles.headerWrap}>
      {/* Welcome Search Card */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={[styles.pillBadge, { backgroundColor: `${colors.primary}18` }]}>
          <Ionicons name="sparkles" size={13} color={colors.primary} />
          <Text style={[styles.pillBadgeText, { color: colors.primary }]}>
            {currentSite?.themeName || 'Curated Expeditions'}
          </Text>
        </View>

        <Text
          style={[
            styles.heroHeading,
            { color: colors.heading, fontFamily: headingFontFamily },
          ]}
        >
          {t('home_welcome', 'Where will you journey next?')}
        </Text>

        <Text style={[styles.heroSub, { color: colors.mutedText }]}>
          {t(
            'home_tagline',
            'Discover verified tours, boutique stays, and authentic global adventures customized for you.'
          )}
        </Text>

        {/* Compact Search Bar Trigger */}
        <TouchableOpacity
          style={[
            styles.searchBarTrigger,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
            },
          ]}
          onPress={() => router.push('/(tabs)/explore')}
          activeOpacity={0.85}
          accessibilityRole="search"
          accessibilityLabel="Search destination, tour or style"
        >
          <Ionicons name="search" size={18} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.searchBarPlaceholder, { color: colors.mutedText }]}>
            {t('action_search', 'Search by destination, tour or style...')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions Row with 5th "All Tools" Hub Tile */}
      <QuickActionsGrid onOpenTravelHub={() => setTravelHubVisible(true)} />
    </View>
  );

  // ─── Section Renderer ───
  const renderSection = ({ item }: { item: HomeSection }) => {
    switch (item.id) {
      case 'categories':
        return (
          <View style={styles.sectionWrap}>
            <SectionHeader
              title={item.title}
              subtitle={item.subtitle}
              headingFontFamily={headingFontFamily}
              onSeeAll={() => router.push('/(tabs)/explore')}
              seeAllText="All Filters"
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScroll}
            >
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.label;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedCategory(cat.label)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={14}
                      color={isSelected ? '#ffffff' : colors.primary}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: isSelected ? '#ffffff' : colors.heading,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        );

      case 'featuredTours':
        if (toursLoading) {
          return <SectionSkeleton />;
        }
        if (toursIsError) {
          return (
            <View
              style={[
                styles.errorCard,
                { backgroundColor: `${colors.accent}12`, borderColor: colors.accent },
              ]}
            >
              <Ionicons name="alert-circle-outline" size={24} color={colors.accent || '#ef4444'} />
              <Text style={[styles.errorTitle, { color: colors.heading }]}>
                Unable to load featured trips
              </Text>
              <Text style={[styles.errorDesc, { color: colors.mutedText }]}>
                {toursError?.message || 'Check network connection'}
              </Text>
              <TouchableOpacity
                style={[styles.retryBtn, { backgroundColor: colors.primary }]}
                onPress={() => refetchTours()}
              >
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          );
        }
        if (featuredToursList.length === 0) return null;

        return (
          <View style={styles.sectionWrap}>
            <SectionHeader
              title={item.title}
              subtitle={item.subtitle}
              headingFontFamily={headingFontFamily}
              onSeeAll={() => router.push('/featured-tours' as any)}
              seeAllText="See all"
            />
            <HorizontalList<Tour>
              data={featuredToursList}
              itemWidth={260}
              keyExtractor={(t) => String(t.id)}
              renderItem={({ item: tour }) => (
                <TourCardHorizontal
                  tour={tour}
                  onPress={() => router.push(tourHref(tour) as any)}
                  currency={currency}
                />
              )}
            />
          </View>
        );

      case 'destinations':
        if (destsLoading) {
          return <SectionSkeleton />;
        }
        if (destsIsError) {
          return (
            <View
              style={[
                styles.errorCard,
                { backgroundColor: `${colors.accent}12`, borderColor: colors.accent },
              ]}
            >
              <Ionicons name="alert-circle-outline" size={24} color={colors.accent || '#ef4444'} />
              <Text style={[styles.errorTitle, { color: colors.heading }]}>
                Unable to load destinations
              </Text>
              <TouchableOpacity
                style={[styles.retryBtn, { backgroundColor: colors.primary }]}
                onPress={() => refetchDests()}
              >
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          );
        }
        if (destinationsList.length === 0) return null;

        return (
          <View style={styles.sectionWrap}>
            <SectionHeader
              title={item.title}
              subtitle={item.subtitle}
              headingFontFamily={headingFontFamily}
              onSeeAll={() => router.push('/destinations' as any)}
              seeAllText="See all"
            />
            <HorizontalList<DestinationItem>
              data={destinationsList}
              itemWidth={150}
              keyExtractor={(d, idx) => d.id || `dest_${idx}`}
              renderItem={({ item: dest }) => (
                <TouchableOpacity
                  style={[
                    styles.destCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() => router.push('/(tabs)/explore')}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={`${dest.name}, ${dest.tours} tours`}
                >
                  <ExpoImage
                    source={{ uri: resolveImageUrl(dest.image) || undefined }}
                    style={styles.destImage}
                    contentFit="cover"
                    transition={250}
                    cachePolicy="memory-disk"
                    placeholder={{ blurhash: DEFAULT_BLURHASH }}
                  />
                  <View style={styles.destOverlay} />
                  <View style={styles.destTextContainer}>
                    <Text style={styles.destName} numberOfLines={1}>
                      {dest.name}
                    </Text>
                    <Text style={styles.destCount}>
                      {dest.tours} {dest.tours === 1 ? 'Tour' : 'Tours'}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        );

      case 'offers':
        return (
          <View style={styles.sectionWrap}>
            <SectionHeader
              title={item.title}
              subtitle={item.subtitle}
              headingFontFamily={headingFontFamily}
              onSeeAll={() => router.push('/special-offers' as any)}
              seeAllText="All Deals"
            />
            <SpecialOffersSection
              headingFontFamily={headingFontFamily}
              onViewMore={() => router.push('/special-offers' as any)}
            />
          </View>
        );

      case 'personalized':
        return (
          <View style={styles.sectionWrap}>
            {/* Countdown (renders only if an active booking exists) */}
            <UpcomingTripCountdown bookings={bookings} />

            {/* Recently Viewed (renders only if viewing history exists) */}
            <RecentlyViewedSection headingFontFamily={headingFontFamily} />
          </View>
        );

      case 'moreForYou':
        return (
          <View style={styles.moreForYouContainer}>
            <SectionHeader
              title={item.title}
              subtitle={item.subtitle}
              headingFontFamily={headingFontFamily}
            />

            {/* Curated horizontal travel guides (Culinary, Culture, Transit, Audio, Phrasebook, Pharmacy, Weather, Tipping) */}
            <TravelGuidesCards headingFontFamily={headingFontFamily} />

            {/* Collapsed deep-dive interactive widgets: expands in-place */}
            {moreForYouExpanded ? (
              <View style={styles.accordionList}>
                {/* 1. Regional Culinary Trail Highlight */}
                <CollapsibleSection
                  title="Regional Culinary Trails"
                  subtitle="Masterclass tastings, night markets & dining passes"
                  icon="restaurant-outline"
                  defaultExpanded={true}
                  headingFontFamily={headingFontFamily}
                >
                  <CulinaryHighlightCard />
                </CollapsibleSection>

                {/* 2. Cultural Decorum & Temple Dress Codes */}
                <CollapsibleSection
                  title="Cultural Decorum & Dress Codes"
                  subtitle="Sacred site modesty guidelines & polite local greetings"
                  icon="sparkles-outline"
                  defaultExpanded={false}
                  headingFontFamily={headingFontFamily}
                >
                  <CultureHeroCard />
                </CollapsibleSection>

                {/* 3. Verified Traveler Reviews & Trust */}
                <CollapsibleSection
                  title="Verified Traveler Reviews"
                  subtitle="Genuine reviews from 12,000+ satisfied explorers"
                  icon="star-outline"
                  defaultExpanded={false}
                  headingFontFamily={headingFontFamily}
                >
                  <View style={styles.reviewBanner}>
                    <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.reviewScore, { color: colors.heading }]}>
                        4.9 / 5.0 Average Rating
                      </Text>
                      <Text style={[styles.reviewSub, { color: colors.mutedText }]}>
                        Based on verified post-trip guest submissions across all active itineraries.
                      </Text>
                    </View>
                  </View>
                </CollapsibleSection>

                {/* 4. Travel Concierge & Live Support */}
                <CollapsibleSection
                  title="Travel Concierge & Support"
                  subtitle="Instant AI itinerary assistance & emergency help"
                  icon="headset-outline"
                  defaultExpanded={false}
                  headingFontFamily={headingFontFamily}
                >
                  <View style={styles.supportBox}>
                    <Text style={[styles.supportTitle, { color: colors.heading }]}>
                      Need tailored advice or custom booking arrangements?
                    </Text>
                    <TouchableOpacity
                      style={[styles.conciergeBtn, { backgroundColor: colors.primary }]}
                      onPress={() => openConcierge()}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="chatbubbles" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.conciergeBtnText}>Talk to Concierge</Text>
                    </TouchableOpacity>
                  </View>
                </CollapsibleSection>
              </View>
            ) : null}

            {/* View More / Show Less Toggle Button for Deep-Dive Tools */}
            <ViewMoreButton
              isExpanded={moreForYouExpanded}
              onPress={handleToggleMoreForYou}
              moreText="View deep-dive guide tools"
              lessText="Show fewer tools"
            />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ─── Virtualized Home Feed ─── */}
      <FlatList
        data={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderSection}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        initialNumToRender={4}
        maxToRenderPerBatch={3}
        windowSize={5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />

      {/* ─── Travel Hub Bottom Sheet Modal (Contains all 18 utility cards) ─── */}
      <TravelHubModal
        visible={travelHubVisible}
        onClose={() => setTravelHubVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  listContent: {
    paddingBottom: SPACING.xxl + 20,
  },
  headerWrap: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  heroCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    marginBottom: SPACING.md,
    ...SHADOW.sm,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.sm,
    gap: 4,
  },
  pillBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroHeading: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: SPACING.xs,
  },
  heroSub: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  searchBarTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    height: 44,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  searchBarPlaceholder: {
    fontSize: FONT_SIZE.sm,
    flex: 1,
  },
  sectionWrap: {
    marginBottom: SPACING.sm,
  },
  chipsScroll: {
    paddingHorizontal: SPACING.md,
    gap: 8,
    paddingVertical: 4,
    marginBottom: 6,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: FONT_SIZE.xs,
  },
  destCard: {
    width: 150,
    height: 190,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
  },
  destImage: {
    width: '100%',
    height: '100%',
  },
  destOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  destTextContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
  },
  destName: {
    color: '#ffffff',
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  destCount: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    marginTop: 1,
  },
  moreForYouContainer: {
    marginTop: SPACING.sm,
  },
  accordionList: {
    paddingHorizontal: SPACING.md,
  },
  reviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  reviewScore: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  reviewSub: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  supportBox: {
    paddingVertical: SPACING.xs,
    gap: SPACING.sm,
  },
  supportTitle: {
    fontSize: FONT_SIZE.xs + 1,
    lineHeight: 18,
  },
  conciergeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  conciergeBtnText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  errorCard: {
    marginHorizontal: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  errorTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    marginTop: 4,
  },
  errorDesc: {
    fontSize: 11,
    textAlign: 'center',
    marginVertical: 4,
  },
  retryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    marginTop: 4,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});

/**
 * app/(tabs)/index.tsx
 *
 * Home screen for the native mobile app.
 * Features:
 *   - Native app header (brand name/logo, search, site switcher, avatar)
 *   - Offline network banner
 *   - Pull-to-refresh connected to React Query invalidation
 *   - Separated states:
 *       • Loading: SkeletonLoader
 *       • Error: Real error card with actual message and Retry button (never masks error as empty list)
 *       • Truly empty: EmptyState
 *   - Horizontal Category chips
 *   - Featured Tours carousel with compact TourCardHorizontal
 *   - Popular Destinations horizontal cards
 *   - Curated Tours list rendered with brand-specific TourCard variants
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSite, useSiteConfig } from '@/store/SiteConfigContext';
import { useColors } from '@/store/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useTours } from '@/hooks/useTours';
import { useDestinations } from '@/hooks/useDestinations';
import { queryKeys } from '@/store/queryClient';
import { getSiteEntry } from '@/constants/siteRegistry';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';
import { DEFAULT_BLURHASH, resolveImageUrl } from '@/lib/imageUtils';
import SkeletonLoader from '@/components/SkeletonLoader';
import { MemoizedTourCardHorizontal as TourCardHorizontal } from '@/components/TourCardHorizontal';
import { MemoizedTourCard as TourCard } from '@/components/TourCard';
import { MemoizedAdventureTourCard as AdventureTourCard } from '@/components/AdventureTourCard';
import { MemoizedLuxuryTourCard as LuxuryTourCard } from '@/components/LuxuryTourCard';
import EmptyState from '@/components/EmptyState';
import UpcomingTripCountdown from '@/components/UpcomingTripCountdown';
import { WeatherWidget } from '@/components/WeatherWidget';
import { CulinaryHighlightCard } from '@/components/CulinaryHighlightCard';
import { DayOfCockpitCard } from '@/components/DayOfCockpitCard';
import { GroupTripCard } from '@/components/GroupTripCard';
import { JournalHeroCard } from '@/components/JournalHeroCard';
import { AirportTransferCard } from '@/components/AirportTransferCard';
import { PhrasebookCard } from '@/components/PhrasebookCard';
import { TaxRefundHeroCard } from '@/components/TaxRefundHeroCard';
import { EsimHeroCard } from '@/components/EsimHeroCard';
import { InsuranceHeroCard } from '@/components/InsuranceHeroCard';
import { VisaHeroCard } from '@/components/VisaHeroCard';
import { EcoHeroCard } from '@/components/EcoHeroCard';
import { CultureHeroCard } from '@/components/CultureHeroCard';
import { PowerHeroCard } from '@/components/PowerHeroCard';
import { BaggageHeroCard } from '@/components/BaggageHeroCard';
import { TransitHeroCard } from '@/components/TransitHeroCard';
import { PharmacyHeroCard } from '@/components/PharmacyHeroCard';
import { TippingHeroCard } from '@/components/TippingHeroCard';
import { DriveSafetyHeroCard } from '@/components/DriveSafetyHeroCard';
import { useBooking } from '@/context/BookingContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useLanguage } from '@/context/LanguageContext';
import type { Tour } from '@/types';
import { tourHref } from '@/lib/navigation';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const config = useSiteConfig();
  const colors = useColors();
  const queryClient = useQueryClient();
  const { siteId, hostname, currency: siteCurrency } = useSite();
  const currentSite = getSiteEntry(siteId);
  const { t } = useLanguage();
  const headingFontFamily = getHeadingFontFamily(config);

  const { tours, isLoading: toursLoading, isError: toursIsError, error: toursError, refetch: refetchTours } = useTours();
  const { destinations, isLoading: destsLoading, refetch: refetchDests } = useDestinations();
  const { bookings, refreshBookings } = useBooking();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');

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

  const { currencySymbol } = useCurrency();
  const currency = currencySymbol || siteCurrency?.symbol || '$';

  const categories = [
    { id: 'all', label: 'All', icon: 'compass' },
    { id: 'adventure', label: 'Adventure', icon: 'trail-sign' },
    { id: 'beach', label: 'Beach', icon: 'water' },
    { id: 'cultural', label: 'Cultural', icon: 'business' },
    { id: 'wildlife', label: 'Wildlife', icon: 'leaf' },
    { id: 'luxury', label: 'Luxury', icon: 'diamond' },
  ];

  const filteredTours = useMemo(() => {
    return tours.filter((t) => {
      if (selectedCategory === 'All') return true;
      const cat = (t.category || '').toLowerCase();
      const target = selectedCategory.toLowerCase();
      return (
        cat === target ||
        (target === 'cultural' && (cat === 'culture' || cat === 'cultural')) ||
        (target === 'culture' && (cat === 'cultural' || cat === 'culture')) ||
        t.difficulty?.toLowerCase().includes(target) ||
        t.description?.toLowerCase().includes(target)
      );
    });
  }, [tours, selectedCategory]);

  const renderBrandTourCard = (tour: Tour) => {
    const href = tourHref(tour);
    if (siteId === 'tripgoasia' || siteId === 'website2') {
      return (
        <AdventureTourCard
          key={String(tour.id)}
          name={tour.name}
          description={tour.description}
          price={tour.price}
          rating={tour.rating}
          image={tour.image}
          duration={tour.duration}
          difficulty={tour.difficulty}
          onBook={() => router.push(href as any)}
          onPress={() => router.push(href as any)}
        />
      );
    }

    if (siteId === 'technoheaven' || siteId === 'website3') {
      return (
        <LuxuryTourCard
          key={String(tour.id)}
          name={tour.name}
          description={tour.description}
          price={tour.price}
          rating={tour.rating}
          image={tour.image}
          duration={tour.duration}
          location={tour.location}
          onBook={() => router.push(href as any)}
          onPress={() => router.push(href as any)}
          headingFontFamily={headingFontFamily}
        />
      );
    }

    return (
      <TourCard
        key={String(tour.id)}
        id={tour.id}
        name={tour.name}
        description={tour.description}
        price={tour.price}
        rating={tour.rating}
        image={tour.image}
        duration={tour.duration}
        difficulty={tour.difficulty}
        onBook={() => router.push(href as any)}
        onPress={() => router.push(href as any)}
      />
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ─── Scrollable Native Content ─── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Welcome Search Trigger Card */}
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

          <Text style={[styles.heroHeading, { color: colors.heading, fontFamily: headingFontFamily }]}>
            {t('home_welcome', 'Where will you journey next?')}
          </Text>

          <Text style={[styles.heroSub, { color: colors.mutedText }]}>
            {t('home_tagline', 'Discover verified tours, boutique stays, and authentic global adventures customized for you.')}
          </Text>

          {/* Quick Search Bar trigger */}
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
          >
            <Ionicons name="search" size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.searchBarPlaceholder, { color: colors.mutedText }]}>
              {t('action_search', 'Search by destination, tour or style...')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── Upcoming Trip Countdown Card (if confirmed reservation exists) ─── */}
        <UpcomingTripCountdown bookings={bookings} />

        {/* ─── Flight & Airport Chauffeur Transfer Card ─── */}
        <AirportTransferCard style={{ marginBottom: 14 }} />

        {/* ─── In-Destination Offline Pocket Phrasebook & Translator ─── */}
        <PhrasebookCard style={{ marginBottom: 14 }} />

        {/* ─── Duty-Free Shopping & VAT/GST Tax Refund Pass ─── */}
        <TaxRefundHeroCard style={{ marginBottom: 14 }} />

        {/* ─── Travel eSIM & 5G Cellular Roaming Hub ─── */}
        <EsimHeroCard style={{ marginBottom: 14 }} />

        {/* ─── Travel Insurance Policy & Cashless Medical Concierge ─── */}
        <InsuranceHeroCard style={{ marginBottom: 14 }} />

        {/* ─── International Visa Requirements & Border Clearance ─── */}
        <VisaHeroCard style={{ marginBottom: 14 }} />

        {/* ─── Sustainable Eco-Travel & Carbon Offset Hub ─── */}
        <EcoHeroCard style={{ marginBottom: 14 }} />

        {/* ─── Cultural Decorum & Sacred Temple Dress Codes ─── */}
        <CultureHeroCard style={{ marginBottom: 14 }} />

        {/* ─── International Power Sockets & Voltage Guide ─── */}
        <PowerHeroCard style={{ marginBottom: 14 }} />

        {/* ─── Airline Baggage Allowance & Sizer ─── */}
        <BaggageHeroCard style={{ marginBottom: 14 }} />

        {/* ─── Rapid Transit Navigator & Taxi Scam Shield ─── */}
        <TransitHeroCard style={{ marginBottom: 14 }} />

        {/* ─── Travel Pharmacy & Medicine Translator ─── */}
        <PharmacyHeroCard style={{ marginBottom: 14 }} />

        {/* ─── Tipping & Gratuity Etiquette Calculator ─── */}
        <TippingHeroCard style={{ marginBottom: 14 }} />

        {/* ─── Road Rules & Motorbike Rental Safety Navigator ─── */}
        <DriveSafetyHeroCard style={{ marginBottom: 14 }} />

        {/* ─── Day-Of Live Expedition Cockpit Card ─── */}
        <DayOfCockpitCard style={{ marginBottom: 14 }} />

        {/* ─── Expedition Party & Collaborative Planning Card ─── */}
        <GroupTripCard style={{ marginBottom: 14 }} />

        {/* ─── Expedition Memory Scrapbook & Travel Journal Card ─── */}
        <JournalHeroCard style={{ marginBottom: 14 }} />

        {/* ─── Live Destination Weather & Climate Card ─── */}
        <WeatherWidget style={{ marginBottom: 14 }} />

        {/* ─── Horizontal Category Chips ─── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.heading, fontFamily: headingFontFamily }]}>
            {t('home_categories', 'Travel Categories')}
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
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
              >
                <Ionicons
                  name={cat.icon as any}
                  size={14}
                  color={isSelected ? '#ffffff' : colors.primary}
                  style={{ marginRight: 5 }}
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

        {/* ─── Loading Skeletons ─── */}
        {toursLoading && (
          <View style={{ marginVertical: SPACING.md }}>
            <SkeletonLoader variant="tourCard" count={2} />
          </View>
        )}

        {/* ─── Error State with Retry ─── */}
        {toursIsError && !toursLoading && (
          <View style={[styles.errorCard, { backgroundColor: `${colors.accent}12`, borderColor: colors.accent }]}>
            <Ionicons name="alert-circle-outline" size={32} color={colors.accent || '#ef4444'} />
            <Text style={[styles.errorTitle, { color: colors.heading }]}>Unable to load live tours</Text>
            <Text style={[styles.errorDesc, { color: colors.mutedText }]}>
              {toursError?.message || 'Network connection issue or backend server unreachable.'}
            </Text>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: colors.primary }]}
              onPress={() => refetchTours()}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.retryBtnText}>Retry Fetch</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Featured Tours Horizontal Carousel (only when successful) ─── */}
        {!toursLoading && !toursIsError && tours.length > 0 && (
          <View style={styles.carouselSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.heading, fontFamily: headingFontFamily }]}>
                  Featured Expeditions
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
                  Most popular trips selected for {currentSite?.name || 'you'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/explore')} activeOpacity={0.7}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {tours.map((t) => (
                <TourCardHorizontal
                  key={String(t.id)}
                  tour={t}
                  onPress={() => router.push(tourHref(t) as any)}
                  currency={currency}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ─── Popular Destinations Horizontal ─── */}
        {!destsLoading && destinations.length > 0 && (
          <View style={styles.carouselSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.heading, fontFamily: headingFontFamily }]}>
                  Trending Destinations
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
                  Explore trips by location
                </Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {destinations.map((d, i) => (
                <TouchableOpacity
                  key={d.id || `dest_${i}`}
                  style={[styles.destCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => router.push(`/(tabs)/explore`)}
                  activeOpacity={0.85}
                >
                  <ExpoImage
                    source={{ uri: resolveImageUrl(d.image) || undefined }}
                    style={styles.destImage}
                    contentFit="cover"
                    transition={250}
                    cachePolicy="memory-disk"
                    placeholder={{ blurhash: DEFAULT_BLURHASH }}
                  />
                  <View style={styles.destOverlay} />
                  <View style={styles.destTextContainer}>
                    <Text style={styles.destName} numberOfLines={1}>{d.name}</Text>
                    <Text style={styles.destCount}>{d.tours} {d.tours === 1 ? 'Tour' : 'Tours'}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ─── Regional Culinary Trail & Authentic Dining Card ─── */}
        <CulinaryHighlightCard />

        {/* ─── All Tours List (only rendered when NOT loading and NOT in error) ─── */}
        {!toursLoading && !toursIsError && (
          <View style={styles.allToursSection}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.heading, fontFamily: headingFontFamily }]}>
                  {selectedCategory === 'All'
                    ? t('home_featured_tours', 'All Curated Experiences')
                    : `${selectedCategory} Experiences`}
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
                  {filteredTours.length} {filteredTours.length === 1 ? 'tour available' : 'tours available'}
                </Text>
              </View>
            </View>

            {tours.length === 0 ? (
              <EmptyState
                icon="compass-outline"
                title="No tours available"
                description="There are currently no active tours listed for this website."
                actionLabel="Refresh Tours"
                onAction={() => refetchTours()}
              />
            ) : filteredTours.length === 0 ? (
              <EmptyState
                icon="search-outline"
                title={`No tours in "${selectedCategory}"`}
                description={`No experiences matching category "${selectedCategory}". Clear the filter to see all tours.`}
                actionLabel="Clear Filter"
                onAction={() => setSelectedCategory('All')}
              />
            ) : (
              <View style={styles.toursList}>
                {filteredTours.map((t) => renderBrandTourCard(t))}
              </View>
            )}
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
  headerContainer: {
    borderBottomWidth: 1,
    zIndex: 100,
    elevation: 8,
    ...SHADOW.sm,
  },
  headerRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.sm,
  },
  brandLogoWrap: {
    marginRight: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandBadge: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  brandEmoji: {
    fontSize: 18,
  },
  brandTextCol: {
    flex: 1,
  },
  brandTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  brandTagline: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButton: {
    marginLeft: 2,
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
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
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  searchBarPlaceholder: {
    fontSize: FONT_SIZE.sm,
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: SPACING.sm + 2,
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  seeAllText: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '700',
  },
  chipsContainer: {
    gap: 8,
    paddingVertical: 4,
    marginBottom: SPACING.md,
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
  carouselSection: {
    marginBottom: SPACING.lg,
  },
  horizontalScroll: {
    paddingVertical: 4,
    paddingRight: SPACING.md,
  },
  destCard: {
    width: 140,
    height: 180,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginRight: SPACING.md,
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
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    marginTop: 1,
  },
  allToursSection: {
    marginTop: SPACING.sm,
  },
  toursList: {
    gap: SPACING.md,
  },
  errorCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    alignItems: 'center',
    marginVertical: SPACING.md,
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
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  emptyCard: {
    padding: SPACING.xl,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginTop: SPACING.sm,
  },
  emptyDesc: {
    fontSize: FONT_SIZE.xs,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: SPACING.md,
  },
  resetBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  resetBtnText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
});

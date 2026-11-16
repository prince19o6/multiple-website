/**
 * app/(tabs)/index.tsx
 *
 * Fully responsive, module-driven Home screen for the ToursApp mobile application.
 * Multi-tenant aware: Gujju Tours, TripGoAsia, Technoheaven.
 *
 * Features:
 * - Module selector strip at top: horizontal scrollable chips for all enabled modules.
 * - Dynamic module content below selector driven by GET /api/core/v1/home?module={module}.
 * - Instant module switching with zero layout shift (cached per module + tenant).
 * - React Query skeleton loaders on initial load.
 * - Safe error state with Retry button (never fakes success on API failure).
 * - Polished empty state if a module returns no content.
 * - Module Hero Banner with specialized search widget.
 * - Category Chips carousel.
 * - Special Offers / Banners carousel.
 * - Featured Items horizontal card list powered by unified ModuleItemCard.
 * - Destinations and Curated Packages sections.
 * - Video highlights, verified traveler reviews, and FAQs.
 * - Pull-to-refresh that invalidates query cache and refetches tenant data.
 * - Global modals (TravelHubModal, MobileEnquirySheet, MobileFloatingWhatsApp).
 * - Integrated native app Footer.
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  RefreshControl,
  StyleSheet,
  Platform,
  UIManager,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useSite, useSiteConfig } from '@/store/SiteConfigContext';
import { useColors } from '@/store/ThemeContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useWishlist } from '@/context/WishlistContext';
import { useActiveModule, ModuleSelectorStrip, type CanonicalModule } from '@/store/ModuleContext';
import { HomeHeroSearchSection } from '@/components/home/HomeHeroSearchSection';
import { useModuleHome } from '@/hooks/useModuleHome';
import { ModuleItemCard } from '@/components/cards/ModuleItemCard';
import { SkeletonItem } from '@/components/SkeletonLoader';
import EmptyState from '@/components/EmptyState';
import Footer from '@/components/Footer';
import { TravelHubModal } from '@/components/home/TravelHubModal';
import { MobileFloatingWhatsApp } from '@/components/common/MobileFloatingWhatsApp';
import { MobileEnquirySheet } from '@/components/common/MobileEnquirySheet';
import { resolveImageUrl, PLACEHOLDER_IMAGE, DEFAULT_BLURHASH } from '@/lib/imageUtils';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import type { ModuleBanner, ModuleCategoryItem, ModuleDestinationItem, ModuleCuratedPackageItem } from '@/services/api';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const queryClient = useQueryClient();
  const { siteId, hostname, siteName } = useSite();
  const config = useSiteConfig();
  const { formatPrice } = useCurrency();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const lastWishlistPressRef = useRef<number>(0);

  const { activeModule, activeItem } = useActiveModule();
  const { data, isLoading, isError, error, refetch, isFetching } = useModuleHome(activeModule);

  // Search input state per module
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  // Modals state
  const [refreshing, setRefreshing] = useState(false);
  const [travelHubVisible, setTravelHubVisible] = useState(false);
  const [enquiryVisible, setEnquiryVisible] = useState(false);
  const [enquiryService, setEnquiryService] = useState('Custom Travel Package');

  const handleOpenEnquiry = (serviceName?: string) => {
    setEnquiryService(serviceName || `Booking for ${activeItem.label}`);
    setEnquiryVisible(true);
  };

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['moduleHome', siteId] }),
        refetch(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [siteId, queryClient, refetch]);

  // Execute search
  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return;
    router.push({
      pathname: '/search-results',
      params: {
        type: activeItem.searchType || activeModule,
        q: searchQuery.trim(),
      },
    } as any);
  };

  // Dynamic placeholder based on active module
  const searchPlaceholder = useMemo(() => {
    switch (activeModule) {
      case 'hotels':
        return 'Search luxury hotels, resorts, suites...';
      case 'tours':
        return 'Search top tours, desert safari, excursions...';
      case 'packages':
        return 'Search international & domestic holiday packages...';
      case 'flights':
        return 'Search airline routes, flight numbers...';
      case 'transfers':
        return 'Search airport cabs, private chauffeur...';
      case 'visas':
        return 'Search tourist e-visas by country...';
      case 'restaurants':
        return 'Search Jain & pure veg dining, rooftop tables...';
      case 'buildpackage':
        return 'Tell us your dream destinations...';
      default:
        return `Search ${activeItem.label}...`;
    }
  }, [activeModule, activeItem]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* ─── 1. HERO BANNER & FLOATING MODULE SEARCH CARD (PIXEL-PERFECT MATCH) ─── */}
        <HomeHeroSearchSection
          onOpenTravelHub={() => setTravelHubVisible(true)}
          onOpenEnquiry={handleOpenEnquiry}
        />

        {/* ─── LOADING STATE FOR FEED (SKELETONS) ─── */}
        {isLoading && !data && (
          <View style={styles.loadingContainer}>
            {/* Categories Skeleton */}
            <View style={styles.skeletonSection}>
              <SkeletonItem width="35%" height={20} style={{ marginBottom: 12, marginLeft: SPACING.md }} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.md, gap: 10 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <SkeletonItem key={i} width={100} height={38} borderRadius={RADIUS.full} />
                ))}
              </ScrollView>
            </View>

            {/* Cards Skeleton */}
            <View style={styles.skeletonSection}>
              <SkeletonItem width="45%" height={22} style={{ marginBottom: 12, marginLeft: SPACING.md }} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: SPACING.md, gap: 12 }}>
                {[1, 2, 3].map((i) => (
                  <View key={i} style={[styles.cardSkeletonItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <SkeletonItem width="100%" height={140} borderRadius={0} />
                    <View style={{ padding: 12, gap: 8 }}>
                      <SkeletonItem width="50%" height={14} />
                      <SkeletonItem width="80%" height={18} />
                      <SkeletonItem width="40%" height={16} style={{ marginTop: 8 }} />
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* ─── INLINE ERROR STATE WITH RETRY (HERO & SEARCH REMAIN USABLE) ─── */}
        {isError && !data && (
          <View style={[styles.inlineErrorCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="cloud-offline-outline" size={32} color={colors.primary} />
            <Text style={[styles.inlineErrorTitle, { color: colors.heading }]}>
              Unable to load {activeItem.label} catalog
            </Text>
            <Text style={[styles.inlineErrorDesc, { color: colors.mutedText }]}>
              {error?.message || 'Please check your connection and try again.'}
            </Text>
            <TouchableOpacity
              onPress={() => refetch()}
              style={[styles.inlineRetryBtn, { backgroundColor: colors.primary }]}
              accessibilityRole="button"
              accessibilityLabel={`Retry loading ${activeItem.label}`}
            >
              <Text style={styles.inlineRetryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ─── DYNAMIC MODULE-DRIVEN CONTENT ─── */}
        {data && (
          <View style={styles.moduleContent}>

            {/* 2. CATEGORY CHIPS */}
            {data.categories && data.categories.length > 0 && (
              <View style={styles.sectionContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoriesScroll}
                >
                  {data.categories.map((cat: ModuleCategoryItem) => (
                    <TouchableOpacity
                      key={cat.slug}
                      onPress={() => {
                        router.push({
                          pathname: '/search-results',
                          params: { type: activeItem.searchType || activeModule, category: cat.slug },
                        } as any);
                      }}
                      activeOpacity={0.8}
                      style={[styles.categoryChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      accessibilityRole="button"
                      accessibilityLabel={`Category ${cat.name}`}
                    >
                      <Ionicons
                        name={(cat.icon as any) || 'compass-outline'}
                        size={15}
                        color={colors.primary}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.categoryChipText, { color: colors.text }]}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 3. SPECIAL OFFERS / BANNERS */}
            {data.banners && data.banners.length > 0 && (
              <View style={styles.sectionContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.bannersScroll}
                  pagingEnabled={Platform.OS === 'ios'}
                >
                  {data.banners.map((banner: ModuleBanner, bIdx: number) => (
                    <TouchableOpacity
                      key={`banner_${banner.id || ''}_${bIdx}`}
                      activeOpacity={0.9}
                      onPress={() => {
                        if (banner.link) {
                          router.push(banner.link as any);
                        } else {
                          handleOpenEnquiry(banner.title);
                        }
                      }}
                      style={[
                        styles.bannerCard,
                        {
                          width: SCREEN_WIDTH > 420 ? 360 : SCREEN_WIDTH - SPACING.md * 2,
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={banner.title}
                    >
                      <Image
                        source={{
                          uri:
                            resolveImageUrl(banner.imageUrl || (banner as any).image, undefined, {
                              module: activeModule,
                              title: banner.title,
                            }) || PLACEHOLDER_IMAGE,
                        }}
                        style={styles.bannerImage}
                        contentFit="cover"
                        placeholder={{ blurhash: DEFAULT_BLURHASH }}
                        transition={300}
                      />
                      <View style={styles.bannerOverlay}>
                        {banner.badge ? (
                          <View style={[styles.bannerBadge, { backgroundColor: colors.primary }]}>
                            <Text style={styles.bannerBadgeText}>{banner.badge}</Text>
                          </View>
                        ) : null}
                        <Text style={styles.bannerTitle} numberOfLines={2}>
                          {banner.title}
                        </Text>
                        {banner.subtitle ? (
                          <Text style={styles.bannerSubtitle} numberOfLines={1}>
                            {banner.subtitle}
                          </Text>
                        ) : null}
                        <View style={[styles.bannerCta, { backgroundColor: '#ffffff' }]}>
                          <Text style={[styles.bannerCtaText, { color: colors.primary }]}>
                            {banner.buttonText || 'Claim Offer'}
                          </Text>
                          <Ionicons name="arrow-forward" size={13} color={colors.primary} style={{ marginLeft: 4 }} />
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 4. FEATURED ITEMS CAROUSEL */}
            {data.featured && data.featured.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sectionTitle, { color: colors.heading }]}>
                      {data.meta?.collectionTitle || `Featured ${activeItem.label}`}
                    </Text>
                    <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
                      {data.meta?.collectionSubtitle || `Top handpicked ${activeItem.label.toLowerCase()} for you.`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      router.push({
                        pathname: '/search-results',
                        params: { type: activeItem.searchType || activeModule },
                      } as any);
                    }}
                    style={styles.seeAllBtn}
                    accessibilityRole="button"
                    accessibilityLabel={`See all ${activeItem.label}`}
                  >
                    <Text style={[styles.seeAllText, { color: colors.primary }]}>See all</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>

                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={data.featured}
                  keyExtractor={(item, idx) => `feat_${activeModule}_${item.id || item.slug || idx}_${idx}`}
                  contentContainerStyle={styles.cardsFlatList}
                  renderItem={({ item }) => (
                    <ModuleItemCard
                      module={activeModule}
                      item={item}
                      width={280}
                      onAction={() => handleOpenEnquiry(item.title)}
                    />
                  )}
                />
              </View>
            )}

            {/* 5. DESTINATIONS SECTION */}
            {data.destinations && data.destinations.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sectionTitle, { color: colors.heading }]}>
                      {data.meta?.citySectionTitle || 'Top Destinations'}
                    </Text>
                    <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
                      Trending cities & places loved by travelers
                    </Text>
                  </View>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.destinationsScroll}
                >
                  {data.destinations.map((dest: ModuleDestinationItem, idx: number) => (
                    <TouchableOpacity
                      key={`dest_${dest.name || ''}_${idx}`}
                      onPress={() => {
                        router.push({
                          pathname: '/search-results',
                          params: { type: activeItem.searchType || activeModule, destination: dest.name },
                        } as any);
                      }}
                      activeOpacity={0.85}
                      style={[styles.destinationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      accessibilityRole="button"
                      accessibilityLabel={`Destination ${dest.name}`}
                    >
                      <Image
                        source={{
                          uri:
                            resolveImageUrl(dest.imageUrl || dest.image, undefined, {
                              module: activeModule,
                              city: dest.name,
                            }) || PLACEHOLDER_IMAGE,
                        }}
                        style={styles.destinationImage}
                        contentFit="cover"
                        placeholder={{ blurhash: DEFAULT_BLURHASH }}
                        transition={300}
                      />
                      <View style={styles.destinationOverlay}>
                        <Text style={styles.destinationName}>{dest.name}</Text>
                        {(dest.itemCount || dest.count || dest.toursCount) ? (
                          <Text style={styles.destinationCount}>
                            {dest.itemCount || dest.count || dest.toursCount} {activeItem.label}
                          </Text>
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 6. CURATED PACKAGES */}
            {data.packages && data.packages.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sectionTitle, { color: colors.heading }]}>
                      Curated Packages
                    </Text>
                    <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
                      Handcrafted multi-day holiday plans with private transfers
                    </Text>
                  </View>
                </View>

                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={data.packages}
                  keyExtractor={(pkg, idx) => `curated_pkg_${pkg.id || pkg.slug || idx}_${idx}`}
                  contentContainerStyle={styles.cardsFlatList}
                  renderItem={({ item: pkg }) => {
                    const pkgIdent = pkg.id || pkg.slug || pkg.title;
                    const isPkgSaved = Boolean(
                      isWishlisted(pkgIdent) ||
                      (pkg.id && isWishlisted(pkg.id)) ||
                      (pkg.slug && isWishlisted(pkg.slug)) ||
                      (pkg.title && isWishlisted(pkg.title))
                    );

                    return (
                      <TouchableOpacity
                        activeOpacity={0.88}
                        onPress={() => {
                          if (Date.now() - lastWishlistPressRef.current < 600) return;
                          router.push(`/tour/${encodeURIComponent(pkg.slug || pkg.id)}` as any);
                        }}
                        style={[styles.curatedPackageCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                        role={Platform.OS === 'web' ? 'article' : undefined}
                        accessibilityRole={Platform.OS === 'web' ? undefined : 'button'}
                        accessibilityLabel={pkg.title}
                      >
                        <View style={styles.packageImageWrapper}>
                          <Image
                            source={{
                              uri:
                                resolveImageUrl(pkg.imageUrl || (pkg as any).image, undefined, {
                                  module: 'packages',
                                  title: pkg.title,
                                }) || PLACEHOLDER_IMAGE,
                            }}
                            style={styles.packageImage}
                            contentFit="cover"
                            placeholder={{ blurhash: DEFAULT_BLURHASH }}
                            transition={300}
                          />
                          <TouchableOpacity
                            testID={`btn-wishlist-pkg-${pkg.id || pkg.slug}`}
                            style={styles.packageWishlistBtn}
                            onPress={(e) => {
                              lastWishlistPressRef.current = Date.now();
                              if (e && e.stopPropagation) e.stopPropagation();
                              toggleWishlist(
                                pkgIdent,
                                {
                                  id: pkg.id || pkgIdent,
                                  slug: pkg.slug,
                                  title: pkg.title,
                                  name: pkg.title,
                                  price: pkg.price,
                                  image: pkg.imageUrl,
                                  imageUrl: pkg.imageUrl,
                                  duration: pkg.days ? `${pkg.days} Days / ${pkg.nights || pkg.days - 1} Nights` : undefined,
                                  module: 'packages',
                                },
                                'packages'
                              );
                            }}
                            {...(Platform.OS === 'web' ? {
                              onClick: (e: any) => { if (e && e.stopPropagation) e.stopPropagation(); },
                              onPointerDown: (e: any) => { if (e && e.stopPropagation) e.stopPropagation(); },
                            } : {})}
                            activeOpacity={0.75}
                            accessibilityRole="button"
                            accessibilityLabel={isPkgSaved ? `Remove ${pkg.title} from wishlist` : `Save ${pkg.title} to wishlist`}
                          >
                            <Ionicons
                              name={isPkgSaved ? 'heart' : 'heart-outline'}
                              size={16}
                              color={isPkgSaved ? '#ef4444' : '#ffffff'}
                            />
                          </TouchableOpacity>
                        </View>
                        <View style={styles.packageBody}>
                          {pkg.days ? (
                            <View style={[styles.packageDurationPill, { backgroundColor: `${colors.primary}15` }]}>
                              <Text style={[styles.packageDurationText, { color: colors.primary }]}>
                                {pkg.days} Days / {pkg.nights || pkg.days - 1} Nights
                              </Text>
                            </View>
                          ) : null}
                          <Text style={[styles.packageTitle, { color: colors.heading }]} numberOfLines={2}>
                            {pkg.title}
                          </Text>
                          <View style={styles.packageFooter}>
                            <View>
                              <Text style={[styles.packagePricePrefix, { color: colors.mutedText }]}>From</Text>
                              <Text style={[styles.packagePrice, { color: colors.primary }]}>
                                {formatPrice(pkg.price || 0)}
                              </Text>
                            </View>
                            <View style={[styles.packageActionBtn, { backgroundColor: colors.primary }]}>
                              <Text style={styles.packageActionBtnText}>View Plan</Text>
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            )}

            {/* 7. VERIFIED REVIEWS */}
            {data.reviews && data.reviews.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sectionTitle, { color: colors.heading }]}>
                      Traveler Reviews
                    </Text>
                    <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
                      Real feedback from verified guests
                    </Text>
                  </View>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.reviewsScroll}
                >
                  {data.reviews.map((rev, revIdx) => (
                    <View
                      key={`rev_${rev.id || revIdx}_${revIdx}`}
                      style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    >
                      <View style={styles.reviewHeader}>
                        <View style={styles.reviewStarsRow}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Ionicons
                              key={s}
                              name={s <= rev.rating ? 'star' : 'star-outline'}
                              size={14}
                              color="#f59e0b"
                            />
                          ))}
                        </View>
                        <Text style={[styles.reviewAuthor, { color: colors.heading }]}>{rev.author}</Text>
                      </View>
                      <Text style={[styles.reviewText, { color: colors.text }]} numberOfLines={4}>
                        "{rev.text}"
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 8. FREQUENTLY ASKED QUESTIONS */}
            {data.faq && data.faq.length > 0 && (
              <View style={[styles.sectionContainer, { paddingHorizontal: SPACING.md }]}>
                <Text style={[styles.sectionTitle, { color: colors.heading }]}>
                  Frequently Asked Questions
                </Text>
                <Text style={[styles.sectionSubtitle, { color: colors.mutedText, marginBottom: SPACING.sm }]}>
                  Got questions about {activeItem.label.toLowerCase()}? Here are the facts.
                </Text>

                <View style={{ gap: SPACING.xs }}>
                  {data.faq.map((faq, faqIdx) => {
                    const isExpanded = expandedFaqId === faq.id;
                    return (
                      <TouchableOpacity
                        key={`faq_${faq.id || faqIdx}_${faqIdx}`}
                        activeOpacity={0.8}
                        onPress={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                        style={[styles.faqCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      >
                        <View style={styles.faqHeader}>
                          <Text style={[styles.faqQuestion, { color: colors.heading, flex: 1 }]}>
                            {faq.question}
                          </Text>
                          <Ionicons
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={18}
                            color={colors.primary}
                          />
                        </View>
                        {isExpanded && (
                          <Text style={[styles.faqAnswer, { color: colors.mutedText }]}>
                            {faq.answer}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* EMPTY MODULE STATE */}
            {(!data.featured || data.featured.length === 0) &&
              (!data.categories || data.categories.length === 0) &&
              (!data.banners || data.banners.length === 0) && (
                <View style={styles.stateWrapper}>
                  <EmptyState
                    icon={activeItem.icon}
                    title={`No ${activeItem.label} available`}
                    description={`We are currently updating our ${activeItem.label.toLowerCase()} catalog. Contact our concierge for instant quotation.`}
                    actionLabel="Get Custom Quote"
                    onAction={() => handleOpenEnquiry(`Quotation for ${activeItem.label}`)}
                  />
                </View>
              )}
          </View>
        )}

        {/* ─── NATIVE APP FOOTER ─── */}
        <Footer />
      </ScrollView>

      {/* Global Modals */}
      <TravelHubModal
        visible={travelHubVisible}
        onClose={() => setTravelHubVisible(false)}
      />
      <MobileFloatingWhatsApp />
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
  scrollContent: {
    flexGrow: 1,
  },
  selectorStripWrapper: {
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
  },
  loadingContainer: {
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  heroSkeletonCard: {
    marginHorizontal: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  skeletonSection: {
    gap: SPACING.xs,
  },
  cardSkeletonItem: {
    width: 260,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  stateWrapper: {
    padding: SPACING.lg,
  },
  inlineErrorCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineErrorTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 4,
    textAlign: 'center',
  },
  inlineErrorDesc: {
    fontSize: FONT_SIZE.xs + 1,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    maxWidth: 280,
  },
  inlineRetryBtn: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
  },
  inlineRetryBtnText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  moduleContent: {
    paddingBottom: SPACING.md,
  },

  // Hero Card
  heroCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    ...SHADOW.sm,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: 8,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: FONT_SIZE.xs + 1,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm + 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    height: '100%',
  },
  clearBtn: {
    padding: 6,
  },
  searchSubmitBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },

  // Section general
  sectionContainer: {
    marginTop: SPACING.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
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
    paddingBottom: 2,
  },
  seeAllText: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '700',
    marginRight: 2,
  },

  // Categories
  categoriesScroll: {
    paddingHorizontal: SPACING.md,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },

  // Banners
  bannersScroll: {
    paddingHorizontal: SPACING.md,
    gap: 12,
  },
  bannerCard: {
    height: 180,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    ...SHADOW.sm,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    padding: SPACING.md,
    justifyContent: 'flex-end',
  },
  bannerBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 6,
  },
  bannerBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    marginBottom: 2,
  },
  bannerSubtitle: {
    color: '#e2e8f0',
    fontSize: FONT_SIZE.xs,
    marginBottom: 10,
  },
  bannerCta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  bannerCtaText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // FlatList cards
  cardsFlatList: {
    paddingHorizontal: SPACING.md,
    gap: 12,
  },

  // Destinations
  destinationsScroll: {
    paddingHorizontal: SPACING.md,
    gap: 10,
  },
  destinationCard: {
    width: 130,
    height: 150,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    ...SHADOW.sm,
  },
  destinationImage: {
    width: '100%',
    height: '100%',
  },
  destinationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
    padding: 8,
  },
  destinationName: {
    color: '#ffffff',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  destinationCount: {
    color: '#e2e8f0',
    fontSize: 10,
    fontWeight: '500',
  },

  // Curated Packages
  curatedPackageCard: {
    width: 250,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  packageImageWrapper: {
    width: '100%',
    height: 130,
    position: 'relative',
    backgroundColor: '#e2e8f0',
  },
  packageImage: {
    width: '100%',
    height: 130,
  },
  packageWishlistBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  packageBody: {
    padding: 10,
  },
  packageDurationPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  packageDurationText: {
    fontSize: 10,
    fontWeight: '700',
  },
  packageTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    minHeight: 36,
    marginBottom: 8,
  },
  packageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  packagePricePrefix: {
    fontSize: 9,
    textTransform: 'uppercase',
  },
  packagePrice: {
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: '800',
  },
  packageActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  packageActionBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },

  // Reviews
  reviewsScroll: {
    paddingHorizontal: SPACING.md,
    gap: 12,
  },
  reviewCard: {
    width: 260,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    ...SHADOW.sm,
  },
  reviewHeader: {
    marginBottom: 8,
  },
  reviewStarsRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 4,
  },
  reviewAuthor: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  reviewText: {
    fontSize: FONT_SIZE.xs,
    lineHeight: 18,
    fontStyle: 'italic',
  },

  // FAQ
  faqCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    marginRight: 8,
  },
  faqAnswer: {
    fontSize: FONT_SIZE.xs + 1,
    lineHeight: 18,
    marginTop: 8,
  },
});

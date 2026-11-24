/**
 * app/tour/[id].tsx
 *
 * Full Tour Details screen.
 * Displays photo gallery, quick metrics, highlights, itinerary, included amenities,
 * guest reviews, floating sticky price bar, and interactive booking modal with live total.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSiteConfig, useSite } from '@/store/SiteConfigContext';
import { useColors } from '@/store/ThemeContext';
import { useSelectedSite } from '@/hooks/useSelectedSite';
import { useTour } from '@/hooks/useTours';
import { useWishlist } from '@/context/WishlistContext';
import { useBooking } from '@/context/BookingContext';
import { useAuth } from '@/context/AuthContext';
import { useCurrency } from '@/context/CurrencyContext';
import type { Booking, Tour, BookingTraveler } from '@/types';
import type { ThemeColors } from '@/lib/themeFromApi';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';
import { PLACEHOLDER_IMAGE } from '@/lib/imageUtils';
import ErrorScreen from '@/components/ErrorScreen';
import AppHeader from '@/components/common/AppHeader';
import GalleryLightbox from '@/components/GalleryLightbox';
import SimilarToursSection from '@/components/SimilarToursSection';
import ReviewModal from '@/components/ReviewModal';
import TourItinerarySection from '@/components/TourItinerarySection';
import CouponSelectionModal from '@/components/CouponSelectionModal';
import { getAddOnsForSite } from '@/constants/bookingAddOns';
import ConciergeFloatingPill from '@/components/ConciergeFloatingPill';
import { WeatherWidget } from '@/components/WeatherWidget';
import { CulinaryHighlightCard } from '@/components/CulinaryHighlightCard';
import type { TourAddOn, CouponValidationResult } from '@/types';

export default function TourDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const config = useSiteConfig();
  const colors = useColors();
  const { siteId: selectedSiteId } = useSelectedSite();
  const { siteId: currentSiteId, currency: siteCurrency, hostname } = useSite();
  const activeSiteId = selectedSiteId || currentSiteId || 'gujjutours';
  const { isWishlisted, toggleWishlist } = useWishlist();

  const tourIdParam = id || '1';
  const { tour, isLoading, isError, isNotFound, error, refetch } = useTour(activeSiteId, tourIdParam);

  // [DEBUG] (marked for removal)
  React.useEffect(() => {
    if (__DEV__) {
      console.log(`[DEBUG] [TourDetailScreen] Route param id: "${id}"`);
      console.log(`[DEBUG] [TourDetailScreen] Active site: "${activeSiteId}", Site Name: "${config?.name}"`);
      if (tour) {
        console.log(`[DEBUG] [TourDetailScreen] Tour loaded successfully: ID=${tour.id}, Slug="${tour.slug}", Name="${tour.name}"`);
      }
      if (isNotFound) {
        console.log(`[DEBUG] [TourDetailScreen] Tour not found (HTTP 404) for identifier: "${tourIdParam}"`);
      } else if (isError && error) {
        console.log(`[DEBUG] [TourDetailScreen] Network/Server Error for identifier "${tourIdParam}":`, error.message);
      }
    }
  }, [id, activeSiteId, config?.name, tour, isNotFound, isError, error, tourIdParam]);


  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'itinerary' | 'reviews'>('overview');
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);

  const headingFontFamily = getHeadingFontFamily(config);
  const { currencySymbol, convertPrice } = useCurrency();
  const tourCardConfig = (config as { tourCard?: { currency?: string } } | null)?.tourCard || {};
  const currency = currencySymbol || tourCardConfig.currency || '$';

  const handleShareTour = async () => {
    if (!tour) return;
    try {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // Haptics fallback
      }
      const tourSlugOrId = tour.slug || tour.id;
      const effectiveHost = hostname || 'www.gujjutours.com';
      const webUrl = `https://${effectiveHost}/tour/${tourSlugOrId}`;
      const message = `Check out this expedition: "${tour.name}" on ${config?.name || 'ToursApp'}!\n\n` +
        `Price: ${currency}${convertPrice(tour.price)} • Duration: ${tour.duration}\n` +
        (tour.location ? `Location: ${tour.location}\n\n` : '\n') +
        `Explore & Book: ${webUrl}`;

      await Share.share({
        title: tour.name,
        message,
        url: Platform.OS === 'ios' ? webUrl : undefined,
      });
    } catch (err) {
      if (__DEV__) {
        console.log('[TourDetailScreen] Share cancelled or failed:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <AppHeader showBackButton={true} title="Loading Experience..." />
        <View style={[styles.centerBox, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedText }]}>Loading tour details...</Text>
        </View>
      </View>
    );
  }

  // Real HTTP 404 Not Found State
  if (isNotFound || (!tour && !isLoading && !isError)) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <AppHeader showBackButton={true} title="Tour Not Found" />
        <View style={styles.errorContentWrapper}>
          <ErrorScreen
            title="Tour Not Found"
            message="We could not find the requested tour. It may have been removed or is temporarily unavailable on this website."
            fullScreen={false}
          />
          <TouchableOpacity testID="btn-compass-outline" accessibilityLabel="compass outline"
            style={[styles.backToExploreBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/explore');
              }
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="compass-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.backToExploreText}>Explore Available Tours</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Network / 5xx Server / Timeout Failure State
  if (isError || !tour) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <AppHeader showBackButton={true} title="Couldn't Load Tour" />
        <View style={styles.errorContentWrapper}>
          <ErrorScreen
            title="Couldn't load this tour"
            message={
              error?.message
                ? error.message
                : "We couldn't connect to the tour service. Please check your network connection and try again."
            }
            onRetry={() => refetch()}
            fullScreen={false}
          />
        </View>
      </View>
    );
  }

  const currentHeroImage = activeImage || tour.image || PLACEHOLDER_IMAGE;
  const gallery = tour.gallery?.length ? tour.gallery : [tour.image];
  const tourIdentifier = tour.slug || tour.id || tourIdParam || tour.name;
  const wishlisted = Boolean(
    isWishlisted(tourIdentifier) ||
    (tour.id !== undefined && isWishlisted(tour.id)) ||
    (tour.slug && isWishlisted(tour.slug)) ||
    (tour.name && isWishlisted(tour.name))
  );

  const handleToggleTourWishlist = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    toggleWishlist(
      tourIdentifier,
      {
        id: tour.id ?? tourIdentifier,
        slug: tour.slug,
        name: tour.name,
        title: tour.name,
        description: tour.description,
        price: tour.price,
        rating: tour.rating,
        image: tour.image,
        imageUrl: tour.image,
        duration: tour.duration,
        difficulty: tour.difficulty,
        category: tour.category,
        location: tour.location,
        module: 'tours',
      },
      'tours'
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ─── Sticky AppHeader with Back button, Tour Title, BrandLogo, and Wishlist ─── */}
      <AppHeader
        showBackButton={true}
        title={tour.name}
        showLogo={true}
        logoSize="sm"
        rightActions={
          <View style={styles.headerRightActions}>
            <TouchableOpacity testID="btn-share"
              style={styles.circleButton}
              onPress={handleShareTour}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Share tour"
            >
              <Ionicons name="share-social-outline" size={20} color={colors.heading} />
            </TouchableOpacity>

            <TouchableOpacity testID="btn-id-222"
              style={styles.circleButton}
              onPress={handleToggleTourWishlist}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Wishlist tour"
            >
              <Ionicons
                name={wishlisted ? 'heart' : 'heart-outline'}
                size={22}
                color={wishlisted ? '#ef4444' : colors.heading}
              />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Main Photo Hero */}
        <TouchableOpacity testID="btn-star"
          style={styles.imageContainer}
          activeOpacity={0.9}
          onPress={() => {
            const idx = gallery.indexOf(currentHeroImage);
            setLightboxIndex(idx >= 0 ? idx : 0);
            setLightboxVisible(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Open full-screen photo gallery"
        >
          <Image source={{ uri: currentHeroImage }} style={styles.heroImage} resizeMode="cover" />

          <View style={[styles.ratingTag, { backgroundColor: colors.primary }]}>
            <Ionicons name="star" size={14} color="#ffffff" />
            <Text style={styles.ratingTagText}>{tour.rating ? tour.rating.toFixed(1) : '4.9'}</Text>
          </View>

          {gallery.length > 1 && (
            <View style={styles.photoCountBadge}>
              <Ionicons name="images-outline" size={13} color="#ffffff" style={{ marginRight: 4 }} />
              <Text style={styles.photoCountBadgeText}>{gallery.length} Photos</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Thumbnail Gallery */}
        {gallery.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.galleryRow}
          >
            {gallery.map((img, idx) => (
              <TouchableOpacity testID="btn-id-275"
                key={idx}
                onPress={() => {
                  setActiveImage(img);
                  setLightboxIndex(idx);
                }}
                onLongPress={() => {
                  setLightboxIndex(idx);
                  setLightboxVisible(true);
                }}
                style={[
                  styles.thumbWrapper,
                  currentHeroImage === img && { borderColor: colors.primary, borderWidth: 2 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`View photo ${idx + 1}`}
              >
                <Image source={{ uri: img }} style={styles.thumbImage} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Main Information */}
        <View style={styles.infoContainer}>
          <Text
            style={[
              styles.tourTitle,
              {
                color: colors.heading,
                fontFamily: headingFontFamily,
              },
            ]}
          >
            {tour.name}
          </Text>

          {Boolean(tour.location) ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={16} color={colors.primary} />
              <Text style={[styles.locationText, { color: colors.mutedText }]}>{tour.location}</Text>
            </View>
          ) : null}

          {/* Quick Metrics Bar */}
          <View style={[styles.metricsBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.metricItem}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
              <Text style={[styles.metricLabel, { color: colors.mutedText }]}>Duration</Text>
              <Text style={[styles.metricVal, { color: colors.heading }]}>{tour.duration}</Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />

            <View style={styles.metricItem}>
              <Ionicons name="fitness-outline" size={20} color={colors.primary} />
              <Text style={[styles.metricLabel, { color: colors.mutedText }]}>Difficulty</Text>
              <Text style={[styles.metricVal, { color: colors.heading }]}>{tour.difficulty}</Text>
            </View>

            <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />

            <View style={styles.metricItem}>
              <Ionicons name="people-outline" size={20} color={colors.primary} />
              <Text style={[styles.metricLabel, { color: colors.mutedText }]}>Group Size</Text>
              <Text style={[styles.metricVal, { color: colors.heading }]}>{tour.groupSize || 'Max 12'}</Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
            <TouchableOpacity testID="btn-overview" accessibilityLabel="Overview"
              style={[styles.tabBtn, activeTab === 'overview' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab('overview')}
            >
              <Text style={[styles.tabBtnText, { color: activeTab === 'overview' ? colors.primary : colors.mutedText }]}>
                Overview
              </Text>
            </TouchableOpacity>

            <TouchableOpacity testID="btn-id-355" accessibilityLabel="id action"
              style={[styles.tabBtn, activeTab === 'itinerary' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab('itinerary')}
            >
              <Text style={[styles.tabBtnText, { color: activeTab === 'itinerary' ? colors.primary : colors.mutedText }]}>
                Itinerary ({tour.itinerary?.length || 0})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity testID="btn-id-364" accessibilityLabel="id action"
              style={[styles.tabBtn, activeTab === 'reviews' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab('reviews')}
            >
              <Text style={[styles.tabBtnText, { color: activeTab === 'reviews' ? colors.primary : colors.mutedText }]}>
                Reviews ({tour.guestReviews?.length || 0})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <View style={styles.tabContent}>
              <Text style={[styles.sectionHeading, { color: colors.heading }]}>About This Experience</Text>
              <Text style={[styles.bodyText, { color: colors.text }]}>
                {tour.fullDescription || tour.description}
              </Text>

              {/* Highlights */}
              {tour.highlights?.length ? (
                <>
                  <Text style={[styles.sectionHeading, { color: colors.heading, marginTop: SPACING.lg }]}>
                    Tour Highlights
                  </Text>
                  {tour.highlights.map((h, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <Ionicons name="checkmark-circle" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                      <Text style={[styles.bulletText, { color: colors.text }]}>{h}</Text>
                    </View>
                  ))}
                </>
              ) : null}

              {/* What's Included */}
              {tour.included?.length ? (
                <>
                  <Text style={[styles.sectionHeading, { color: colors.heading, marginTop: SPACING.lg }]}>
                    {"What's Included"}
                  </Text>
                  <View style={styles.includedGrid}>
                    {tour.included.map((inc, i) => (
                      <View key={i} style={[styles.includedChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Ionicons name="gift-outline" size={16} color={colors.primary} />
                        <Text style={[styles.includedChipText, { color: colors.text }]}>{inc}</Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : null}
            </View>
          )}

          {activeTab === 'itinerary' && (
            <View style={styles.tabContent}>
              <TouchableOpacity testID="btn-map"
                style={[
                  styles.mapExploreBanner,
                  { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}35` },
                ]}
                onPress={() => {
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch {
                    // Haptics fallback
                  }
                  router.push(
                    `/map-explorer?tourId=${tour.id}&tourName=${encodeURIComponent(tour.name)}` as never
                  );
                }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="View Tour Waypoints on Expedition Map"
              >
                <View style={[styles.mapExploreIconBox, { backgroundColor: colors.primary }]}>
                  <Ionicons name="map" size={18} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.mapExploreTitle, { color: colors.heading }]}>
                    View Expedition Map
                  </Text>
                  <Text style={[styles.mapExploreSubtitle, { color: colors.mutedText }]}>
                    Interactive waypoints, coordinates & directions
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.primary} />
              </TouchableOpacity>

              <TourItinerarySection tour={tour} showPackingList={true} />
            </View>
          )}

          {activeTab === 'reviews' && (
            <View style={styles.tabContent}>
              {/* Rating Summary Card & Write Review Action */}
              <View style={[styles.reviewSummaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.reviewScoreBox}>
                  <Text style={[styles.reviewScoreBig, { color: colors.heading, fontFamily: headingFontFamily }]}>
                    {tour.rating ? tour.rating.toFixed(1) : '5.0'}
                  </Text>
                  <View style={styles.starRow}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons
                        key={s}
                        name={s <= Math.round(tour.rating || 5) ? 'star' : 'star-outline'}
                        size={14}
                        color="#f59e0b"
                      />
                    ))}
                  </View>
                  <Text style={[styles.reviewCountSub, { color: colors.mutedText }]}>
                    {tour.guestReviews?.length || tour.reviews || 0} verified guest reviews
                  </Text>
                </View>

                <TouchableOpacity testID="btn-create-outline"
                  style={[styles.writeReviewBtn, { backgroundColor: `${colors.primary}18`, borderColor: colors.primary }]}
                  onPress={() => setReviewModalVisible(true)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Write a traveler review"
                >
                  <Ionicons name="create-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                  <Text style={[styles.writeReviewBtnText, { color: colors.primary }]}>Write Review</Text>
                </TouchableOpacity>
              </View>

              {tour.guestReviews?.length ? (
                tour.guestReviews.map((rev, idx) => (
                  <View key={idx} style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewAuthorRow}>
                        <View style={[styles.avatarCircle, { backgroundColor: `${colors.primary}25` }]}>
                          <Text style={[styles.avatarText, { color: colors.primary }]}>
                            {(rev.author || 'T').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View>
                          <Text style={[styles.reviewAuthor, { color: colors.heading }]}>{rev.author}</Text>
                          {Boolean(rev.date) && (
                            <Text style={[styles.reviewDate, { color: colors.mutedText }]}>{rev.date}</Text>
                          )}
                        </View>
                      </View>
                      <View style={styles.starRow}>
                        <Ionicons name="star" size={13} color="#f59e0b" />
                        <Text style={[styles.starText, { color: colors.heading }]}>{rev.rating}</Text>
                      </View>
                    </View>
                    <Text style={[styles.reviewComment, { color: colors.text }]}>{rev.text}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyReviewsCard}>
                  <Ionicons name="chatbubbles-outline" size={32} color={colors.mutedText} />
                  <Text style={[styles.emptyTabText, { color: colors.mutedText }]}>
                    No guest reviews yet. Be the first to share your experience on this journey!
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* ─── Expedition Audio Stories Experience ─── */}
        <View style={styles.audioGuideBannerWrap}>
          <TouchableOpacity testID="btn-headset" accessibilityLabel="headset"
            style={[styles.audioGuideBanner, { backgroundColor: `${colors.primary}12`, borderColor: colors.primary }]}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              router.push('/audio-guide' as never);
            }}
            activeOpacity={0.85}
          >
            <View style={[styles.audioIconBox, { backgroundColor: colors.primary }]}>
              <Ionicons name="headset" size={22} color="#FFFFFF" />
            </View>
            <View style={styles.audioBannerInfo}>
              <View style={styles.audioBannerBadgeRow}>
                <Text style={[styles.audioBadgeText, { color: colors.primary }]}>IMMERSIVE STORYTELLER</Text>
                <Text style={[styles.audioDurationText, { color: colors.mutedText }]}>3-5 min each</Text>
              </View>
              <Text style={[styles.audioBannerTitle, { color: colors.heading }]}>
                Expedition Audio Guide & Legends
              </Text>
              <Text style={[styles.audioBannerDesc, { color: colors.text }]}>
                Listen to expert historians and narrators reveal hidden folklore and secrets for this journey.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* ─── Destination Climate & Tide Status ─── */}
        <WeatherWidget style={{ marginHorizontal: 16, marginTop: 4, marginBottom: 16 }} />

        {/* ─── Local Gastronomy & Culinary Trail ─── */}
        <CulinaryHighlightCard />

        {/* ─── Similar Expeditions Carousel ─── */}
        <SimilarToursSection tour={tour} />
      </ScrollView>

      {/* Floating 24/7 Specialist Concierge Pill */}
      <ConciergeFloatingPill
        tourId={Number(tour.id) || 1}
        tourName={tour.name}
        style={[
          styles.floatingConciergePill,
          { bottom: Math.max(insets.bottom, 12) + 84 },
        ]}
      />

      {/* Floating Bottom Booking Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <View>
          <Text style={[styles.bottomBarPrefix, { color: colors.mutedText }]}>Price per guest</Text>
          <Text style={[styles.bottomBarPrice, { color: colors.primary }]}>
            {currency}{convertPrice(tour.price)}
          </Text>
        </View>

        <TouchableOpacity testID="btn-book-experience" accessibilityLabel="Book Experience"
          style={[styles.reserveBtn, { backgroundColor: colors.primary }]}
          onPress={() => setBookingModalVisible(true)}
          activeOpacity={0.88}
        >
          <Text style={styles.reserveBtnText}>Book Experience</Text>
        </TouchableOpacity>
      </View>

      {/* Native Booking Modal (isolated to prevent parent re-renders while typing) */}
      <TourBookingModal
        visible={bookingModalVisible}
        onClose={() => setBookingModalVisible(false)}
        tour={tour}
        siteId={activeSiteId}
        colors={colors}
        currency={currency}
      />

      {/* ─── Full-screen Image Lightbox ─── */}
      <GalleryLightbox
        visible={lightboxVisible}
        images={gallery}
        initialIndex={lightboxIndex}
        tourTitle={tour.name}
        onClose={() => setLightboxVisible(false)}
        onShare={handleShareTour}
      />

      {/* ─── Guest Review Submission Modal ─── */}
      <ReviewModal
        visible={reviewModalVisible}
        onClose={() => setReviewModalVisible(false)}
        tourIdOrSlug={tour.slug || tour.id}
        tourName={tour.name}
        onReviewSubmitted={() => {
          refetch();
        }}
      />
    </View>
  );
}

interface TourBookingModalProps {
  visible: boolean;
  onClose: () => void;
  tour: Tour;
  siteId?: string;
  colors: ThemeColors;
  currency: string;
}

const TourBookingModal = React.memo(function TourBookingModal({
  visible,
  onClose,
  tour,
  siteId,
  colors,
  currency,
}: TourBookingModalProps) {
  const router = useRouter();
  const { addBooking } = useBooking();
  const { user } = useAuth();

  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [travelDate, setTravelDate] = useState(() => {
    const d = new Date(Date.now() + 7 * 86400000);
    return d.toISOString().split('T')[0];
  });
  const [specialRequest, setSpecialRequest] = useState('');
  const [idempotencyKey] = useState(
    () => `app_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  );

  // Individual traveler list state
  const [travelers, setTravelers] = useState<BookingTraveler[]>([
    { id: 'trv-adult-1', name: user?.name || '', type: 'Adult', gender: '' },
  ]);

  // Synchronize individual travelers with adults and children counts
  React.useEffect(() => {
    setTravelers((prev) => {
      const next: BookingTraveler[] = [];
      const currentAdults = Math.max(1, adults);
      const currentChildren = Math.max(0, children);

      const prevAdults = prev.filter((t) => t.type === 'Adult');
      for (let i = 0; i < currentAdults; i++) {
        if (i === 0) {
          next.push({
            id: prevAdults[0]?.id || 'trv-adult-1',
            name: prevAdults[0]?.name || name,
            type: 'Adult',
            gender: prevAdults[0]?.gender || '',
            age: prevAdults[0]?.age,
          });
        } else if (prevAdults[i]) {
          next.push(prevAdults[i]);
        } else {
          next.push({
            id: `trv-adult-${i + 1}`,
            name: '',
            type: 'Adult',
            gender: '',
          });
        }
      }

      const prevChildren = prev.filter((t) => t.type === 'Child');
      for (let i = 0; i < currentChildren; i++) {
        if (prevChildren[i]) {
          next.push(prevChildren[i]);
        } else {
          next.push({
            id: `trv-child-${i + 1}`,
            name: '',
            type: 'Child',
            gender: '',
          });
        }
      }
      return next;
    });
  }, [adults, children]);

  const handleTravelerFieldChange = (index: number, field: keyof BookingTraveler, val: any) => {
    setTravelers((prev) => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = { ...copy[index], [field]: val };
        if (index === 0 && field === 'name') {
          setName(val);
        }
      }
      return copy;
    });
  };

  // Sync user details if session changes
  React.useEffect(() => {
    if (user) {
      if (user.name && !name) {
        setName(user.name);
        handleTravelerFieldChange(0, 'name', user.name);
      }
      if (user.email && !email) setEmail(user.email);
      if (user.phone && !phone) setPhone(user.phone);
    }
  }, [user]);

  const { convertPrice } = useCurrency();
  const config = useSiteConfig();
  const numericTourId = !isNaN(Number(tour.id)) && Number(tour.id) > 0 ? Number(tour.id) : 1;

  const availableAddOns: TourAddOn[] = React.useMemo(() => {
    if (config?.content?.bookingAddOns && config.content.bookingAddOns.length > 0) {
      return config.content.bookingAddOns.map((item: any) => ({
        id: String(item.id),
        name: String(item.name),
        description: String(item.description || ''),
        priceUSD: Number(item.priceUSD ?? item.price ?? 0),
        perPerson: Boolean(item.perPerson ?? true),
        icon: String(item.icon || 'sparkles'),
        badge: item.badge ? String(item.badge) : undefined,
        brandRecommendation: item.brandRecommendation ? String(item.brandRecommendation) : undefined,
      }));
    }
    return getAddOnsForSite(siteId || 'gujjutours');
  }, [config, siteId]);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResult | null>(null);
  const [isCouponModalVisible, setIsCouponModalVisible] = useState(false);

  const totalTravelers = adults + children;
  const adultPrice = convertPrice(tour.price || 0);
  const childPrice = Math.round(adultPrice * 0.7);
  const baseSubtotal = adults * adultPrice + children * childPrice;

  // Calculate Add-Ons Total with live currency conversion
  const addOnsTotal = React.useMemo(() => {
    let sum = 0;
    selectedAddOns.forEach((addonId) => {
      const addon = availableAddOns.find((a) => a.id === addonId);
      if (addon) {
        const itemConverted = convertPrice(addon.priceUSD);
        const count = addon.perPerson ? totalTravelers : 1;
        sum += itemConverted * count;
      }
    });
    return sum;
  }, [selectedAddOns, availableAddOns, totalTravelers, convertPrice]);

  const grossSubtotal = baseSubtotal + addOnsTotal;

  // Calculate Promo Voucher Discount
  const discountAmount = React.useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountPercent > 0) {
      return Math.round((grossSubtotal * appliedCoupon.discountPercent) / 100);
    }
    return Math.min(grossSubtotal, convertPrice(appliedCoupon.discountAmount));
  }, [appliedCoupon, grossSubtotal, convertPrice]);

  const taxableBase = Math.max(0, grossSubtotal - discountAmount);
  const taxes = Math.round(taxableBase * 0.05);
  const totalPrice = taxableBase + taxes;

  const handleToggleAddOn = (addonId: string) => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Haptics fallback
    }
    setSelectedAddOns((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  const handleRemoveCoupon = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics fallback
    }
    setAppliedCoupon(null);
  };

  const handleBookingSubmit = async () => {
    if (!user) {
      Alert.alert(
        'Login Required',
        'Please log in to your account to complete your booking. Guest checkout is not permitted.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Log In',
            onPress: () => {
              onClose();
              router.push('/(tabs)/profile');
            },
          },
        ]
      );
      return;
    }

    if (!name.trim() || !email.trim() || !phone.trim()) {
      Alert.alert('Missing Details', 'Please enter your name, email, and phone number.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Invalid Email', 'Please provide a valid email address.');
      return;
    }

    // Validate that every individual traveler has a name entered
    const missingTraveler = travelers.find((t) => !t.name.trim());
    if (missingTraveler) {
      Alert.alert(
        'Incomplete Traveler Details',
        `Please enter the full name for each individual passenger (${travelers.length} guests).`
      );
      return;
    }

    const start = travelDate && !isNaN(new Date(travelDate).getTime())
      ? new Date(travelDate)
      : new Date(Date.now() + 7 * 86400000);

    let durationDays = 5;
    if (tour.duration) {
      const match = tour.duration.match(/(\d+)\s*day/i);
      if (match && match[1]) {
        durationDays = parseInt(match[1], 10);
      }
    }
    const end = new Date(start.getTime() + durationDays * 86400000);

    const numericTourId = !isNaN(Number(tour.id)) && Number(tour.id) > 0
      ? Number(tour.id)
      : 1;

    const targetSite = siteId || 'gujjutours';

    try {
      setSubmitting(true);
      const booking = await addBooking({
        website: targetSite,
        websiteId: targetSite,
        tourId: numericTourId,
        tourSlug: tour.slug,
        tourName: tour.name,
        tourImage: tour.image,
        currency: currency || '$',
        location: tour.location || tour.destination,
        destination: tour.destination || tour.location,
        unitPrice: adultPrice,
        originalPrice: tour.originalPrice,
        duration: tour.duration,
        totalPrice,
        guestName: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        adults,
        children,
        travelers: totalTravelers,
        travelersList: travelers.map((t, idx) => ({
          id: t.id || `trv-${idx + 1}`,
          name: t.name.trim(),
          type: t.type,
          age: t.age ? Number(t.age) : undefined,
          gender: t.gender || '',
        })),
        travelDate: start.toISOString(),
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        date: start.toISOString().split('T')[0],
        specialRequest: specialRequest.trim(),
        idempotencyKey,
        source: 'app',
        promoCode: appliedCoupon?.code,
        discountAmount,
        addOns: selectedAddOns,
        addOnsTotal,
      });

      setConfirmedBooking(booking);
      setBookingSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not complete booking on backend. Please check network.';
      Alert.alert('Booking Notice', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setBookingSuccess(false);
    setConfirmedBooking(null);
    onClose();
  };

  const handleViewBookings = () => {
    const targetRef = confirmedBooking?.reference || confirmedBooking?.id;
    handleClose();
    if (targetRef) {
      router.push(`/booking/${targetRef}`);
    } else {
      router.push('/(tabs)/bookings');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.heading }]}>Reserve Experience</Text>
          <TouchableOpacity testID="btn-close" accessibilityLabel="Close" onPress={handleClose} style={styles.modalCloseBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {bookingSuccess ? (
          <View style={styles.successBox}>
            <View style={[styles.successIconCircle, { backgroundColor: `${colors.primary}18` }]}>
              <Ionicons name="checkmark-circle" size={60} color={colors.primary} />
            </View>
            <Text style={[styles.successTitle, { color: colors.heading }]}>Booking Confirmed!</Text>
            <Text style={[styles.successDesc, { color: colors.mutedText }]}>
              Thank you, {name}! Your reservation has been registered on the server.
            </Text>

            {confirmedBooking && (
              <View
                style={[
                  styles.voucherCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={styles.voucherRow}>
                  <Text style={[styles.voucherLabel, { color: colors.mutedText }]}>Booking Ref:</Text>
                  <Text style={[styles.voucherValue, { color: colors.primary, fontWeight: '800' }]}>
                    #{confirmedBooking.reference || confirmedBooking.id}
                  </Text>
                </View>
                <View style={styles.voucherRow}>
                  <Text style={[styles.voucherLabel, { color: colors.mutedText }]}>Tour:</Text>
                  <Text style={[styles.voucherValue, { color: colors.heading }]} numberOfLines={1}>
                    {confirmedBooking.tourName}
                  </Text>
                </View>
                <View style={styles.voucherRow}>
                  <Text style={[styles.voucherLabel, { color: colors.mutedText }]}>Travel Date:</Text>
                  <Text style={[styles.voucherValue, { color: colors.heading }]}>
                    {confirmedBooking.travelDate || confirmedBooking.date}
                  </Text>
                </View>
                <View style={styles.voucherRow}>
                  <Text style={[styles.voucherLabel, { color: colors.mutedText }]}>Travelers / Total:</Text>
                  <Text style={[styles.voucherValue, { color: colors.heading }]}>
                    {confirmedBooking.adults || confirmedBooking.travelers} Adults
                    {confirmedBooking.children ? `, ${confirmedBooking.children} Children` : ''} · {currency}{confirmedBooking.totalPrice}
                  </Text>
                </View>
                {confirmedBooking.travelersList && confirmedBooking.travelersList.length > 0 && (
                  <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: colors.mutedText, marginBottom: 6 }}>
                      Travelers Manifest ({confirmedBooking.travelersList.length})
                    </Text>
                    {confirmedBooking.travelersList.map((t, idx) => (
                      <View key={t.id || idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.heading }}>
                          {idx + 1}. {t.name}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.mutedText }}>
                          {t.type}{t.age ? ` · Age ${t.age}` : ''}{t.gender ? ` · ${t.gender}` : ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            <View style={styles.successActions}>
              <TouchableOpacity testID="btn-receipt-outline" accessibilityLabel="receipt outline"
                style={[styles.doneBtn, { backgroundColor: colors.primary }]}
                onPress={handleViewBookings}
                activeOpacity={0.8}
              >
                <Ionicons name="receipt-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.doneBtnText}>View E-Ticket Voucher</Text>
              </TouchableOpacity>

              <TouchableOpacity testID="btn-return-to-tour" accessibilityLabel="Return to Tour"
                style={[styles.secondaryDoneBtn, { borderColor: colors.border }]}
                onPress={handleClose}
                activeOpacity={0.8}
              >
                <Text style={[styles.secondaryDoneText, { color: colors.text }]}>Return to Tour</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <ScrollView style={styles.modalForm} contentContainerStyle={styles.formContent}>
            <Text style={[styles.formTourName, { color: colors.primary }]}>{tour.name}</Text>

            {/* Adults Counter */}
            <View style={[styles.counterRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View>
                <Text style={[styles.counterLabel, { color: colors.heading }]}>Adult Guests</Text>
                <Text style={[styles.counterSub, { color: colors.mutedText }]}>
                  Age 12+ · {currency}{adultPrice}/person
                </Text>
              </View>
              <View style={styles.stepper}>
                <TouchableOpacity testID="btn-remove" accessibilityLabel="remove"
                  style={[styles.stepBtn, { borderColor: colors.border }]}
                  onPress={() => setAdults((prev) => Math.max(1, prev - 1))}
                >
                  <Ionicons name="remove" size={18} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.stepVal, { color: colors.heading }]}>{adults}</Text>
                <TouchableOpacity testID="btn-add" accessibilityLabel="add"
                  style={[styles.stepBtn, { borderColor: colors.border }]}
                  onPress={() => setAdults((prev) => prev + 1)}
                >
                  <Ionicons name="add" size={18} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Children Counter */}
            <View style={[styles.counterRow, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 8 }]}>
              <View>
                <Text style={[styles.counterLabel, { color: colors.heading }]}>Children</Text>
                <Text style={[styles.counterSub, { color: colors.mutedText }]}>
                  Age 2-11 · 30% off ({currency}{childPrice}/person)
                </Text>
              </View>
              <View style={styles.stepper}>
                <TouchableOpacity testID="btn-remove" accessibilityLabel="remove"
                  style={[styles.stepBtn, { borderColor: colors.border }]}
                  onPress={() => setChildren((prev) => Math.max(0, prev - 1))}
                >
                  <Ionicons name="remove" size={18} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.stepVal, { color: colors.heading }]}>{children}</Text>
                <TouchableOpacity testID="btn-add" accessibilityLabel="add"
                  style={[styles.stepBtn, { borderColor: colors.border }]}
                  onPress={() => setChildren((prev) => prev + 1)}
                >
                  <Ionicons name="add" size={18} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Inputs */}
            <Text style={[styles.inputLabel, { color: colors.heading }]}>Full Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g. Eleanor Vance"
              placeholderTextColor={colors.mutedText}
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.inputLabel, { color: colors.heading }]}>Email Address</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g. eleanor@example.com"
              placeholderTextColor={colors.mutedText}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={[styles.inputLabel, { color: colors.heading }]}>Phone Number</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="e.g. +1 555 123 4567"
              placeholderTextColor={colors.mutedText}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <Text style={[styles.inputLabel, { color: colors.heading }]}>Travel Date</Text>
            <View style={styles.quickDateRow}>
              {[7, 14, 21, 30].map((days) => {
                const targetDate = new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
                const isSelected = travelDate === targetDate;
                return (
                  <TouchableOpacity testID="btn-id-1126" accessibilityLabel="id action"
                    key={days}
                    style={[
                      styles.quickDateChip,
                      {
                        backgroundColor: isSelected ? `${colors.primary}18` : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setTravelDate(targetDate)}
                  >
                    <Text
                      style={[
                        styles.quickDateChipText,
                        { color: isSelected ? colors.primary : colors.mutedText, fontWeight: isSelected ? '700' : '500' },
                      ]}
                    >
                      +{days}d
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.mutedText}
              value={travelDate}
              onChangeText={setTravelDate}
            />

            {/* Individual Traveler Passenger Details Section */}
            <View style={{ marginTop: 14, marginBottom: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={[styles.inputLabel, { color: colors.heading, marginBottom: 0 }]}>
                  Individual Passenger Details ({travelers.length})
                </Text>
                <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}>
                  {adults} Adult(s){children > 0 ? `, ${children} Child(ren)` : ''}
                </Text>
              </View>

              {travelers.map((trv, idx) => (
                <View
                  key={trv.id || idx}
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1,
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 10,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: colors.primary,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '800' }}>{idx + 1}</Text>
                      </View>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.heading }}>
                        {idx === 0 ? 'Lead Traveler' : `Traveler ${idx + 1}`}
                      </Text>
                    </View>
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 6,
                        backgroundColor: `${colors.primary}14`,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', color: colors.primary }}>
                        {trv.type}
                      </Text>
                    </View>
                  </View>

                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text, marginBottom: 8 }]}
                    placeholder={idx === 0 ? 'Full Name (Primary Contact)' : `Traveler ${idx + 1} Full Name`}
                    placeholderTextColor={colors.mutedText}
                    value={trv.name}
                    onChangeText={(val) => handleTravelerFieldChange(idx, 'name', val)}
                  />

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <TextInput
                        style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text, marginBottom: 0 }]}
                        placeholder="Age (years)"
                        placeholderTextColor={colors.mutedText}
                        keyboardType="number-pad"
                        value={trv.age ? String(trv.age) : ''}
                        onChangeText={(val) =>
                          handleTravelerFieldChange(idx, 'age', val ? parseInt(val, 10) : undefined)
                        }
                      />
                    </View>
                    <View style={{ flex: 1, flexDirection: 'row', gap: 4 }}>
                      {(['Male', 'Female'] as const).map((g) => {
                        const isSel = trv.gender === g;
                        return (
                          <TouchableOpacity testID="btn-id-1237" accessibilityLabel="id action"
                            key={g}
                            style={{
                              flex: 1,
                              borderWidth: 1,
                              borderColor: isSel ? colors.primary : colors.border,
                              backgroundColor: isSel ? `${colors.primary}18` : colors.background,
                              borderRadius: 8,
                              alignItems: 'center',
                              justifyContent: 'center',
                              paddingVertical: 8,
                            }}
                            onPress={() => handleTravelerFieldChange(idx, 'gender', isSel ? '' : g)}
                          >
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: isSel ? '700' : '500',
                                color: isSel ? colors.primary : colors.mutedText,
                              }}
                            >
                              {g}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <Text style={[styles.inputLabel, { color: colors.heading }]}>Special Requests (Optional)</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              placeholder="Dietary requirements, pickup requests, etc."
              placeholderTextColor={colors.mutedText}
              multiline
              numberOfLines={3}
              value={specialRequest}
              onChangeText={setSpecialRequest}
            />

            {/* ─── Experience Add-Ons Section ─── */}
            <View style={styles.addonsSection}>
              <View style={styles.addonsHeader}>
                <Ionicons name="sparkles" size={16} color={colors.primary} />
                <Text style={[styles.addonsTitle, { color: colors.heading }]}>Customize Your Journey (Add-Ons)</Text>
              </View>
              <Text style={[styles.addonsSubtitle, { color: colors.mutedText }]}>
                Tailored amenities & upgrades for this expedition
              </Text>

              {availableAddOns.slice(0, 5).map((addon: TourAddOn) => {
                const isSelected = selectedAddOns.includes(addon.id);
                const addonPriceConverted = convertPrice(addon.priceUSD);

                return (
                  <TouchableOpacity testID="btn-id-1295" accessibilityLabel="id action"
                    key={addon.id}
                    style={[
                      styles.addonCard,
                      {
                        backgroundColor: isSelected ? `${colors.primary}12` : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => handleToggleAddOn(addon.id)}
                    activeOpacity={0.7}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                  >
                    <View style={styles.addonLeft}>
                      <View
                        style={[
                          styles.checkbox,
                          {
                            backgroundColor: isSelected ? colors.primary : 'transparent',
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        {isSelected && <Ionicons name="checkmark" size={14} color="#ffffff" />}
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={styles.addonTitleRow}>
                          <Text style={[styles.addonName, { color: colors.heading }]}>{addon.name}</Text>
                          {addon.badge && (
                            <View style={[styles.addonBadge, { backgroundColor: `${colors.primary}20` }]}>
                              <Text style={[styles.addonBadgeText, { color: colors.primary }]}>{addon.badge}</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.addonDesc, { color: colors.mutedText }]} numberOfLines={2}>
                          {addon.description}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.addonPriceBox}>
                      <Text style={[styles.addonPriceVal, { color: isSelected ? colors.primary : colors.heading }]}>
                        +{currency}{addonPriceConverted}
                      </Text>
                      <Text style={[styles.addonPriceUnit, { color: colors.mutedText }]}>
                        {addon.perPerson ? '/person' : 'flat'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ─── Promotional Coupon Section ─── */}
            <View style={styles.promoSection}>
              {appliedCoupon ? (
                <View style={[styles.appliedCouponCard, { borderColor: '#10b981', backgroundColor: '#10b98115' }]}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="pricetag" size={15} color="#10b981" />
                      <Text style={styles.appliedCodeText}>{appliedCoupon.code}</Text>
                      <Text style={styles.appliedSavingsBadge}>
                        Saved {currency}{discountAmount}
                      </Text>
                    </View>
                    <Text style={[styles.appliedCouponDesc, { color: colors.text }]} numberOfLines={1}>
                      {appliedCoupon.title}
                    </Text>
                  </View>

                  <TouchableOpacity testID="btn-close"
                    style={styles.removeCouponBtn}
                    onPress={handleRemoveCoupon}
                    accessibilityRole="button"
                    accessibilityLabel="Remove coupon"
                  >
                    <Ionicons name="close-circle" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity testID="btn-gift-outline"
                  style={[styles.promoTriggerBtn, { borderColor: colors.primary, backgroundColor: `${colors.primary}08` }]}
                  onPress={() => setIsCouponModalVisible(true)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Apply promotional voucher"
                >
                  <Ionicons name="gift-outline" size={18} color={colors.primary} />
                  <Text style={[styles.promoTriggerText, { color: colors.primary }]}>
                    Have a Promo Voucher? Tap to Apply
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                </TouchableOpacity>
              )}
            </View>

            {/* ─── Total Price Summary Breakdown ─── */}
            <View style={[styles.summaryBox, { backgroundColor: `${colors.primary}12`, borderRadius: RADIUS.lg, padding: SPACING.md }]}>
              <Text style={[styles.summaryLabel, { color: colors.heading, fontWeight: '800', marginBottom: 4 }]}>
                Investment Summary
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 }}>
                <Text style={{ fontSize: 12, color: colors.mutedText }}>
                  {adults} × Adults ({currency}{adultPrice})
                </Text>
                <Text style={{ fontSize: 12, color: colors.heading, fontWeight: '600' }}>
                  {currency}{adults * adultPrice}
                </Text>
              </View>
              {children > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 }}>
                  <Text style={{ fontSize: 12, color: colors.mutedText }}>
                    {children} × Children ({currency}{childPrice})
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.heading, fontWeight: '600' }}>
                    {currency}{children * childPrice}
                  </Text>
                </View>
              )}

              {addOnsTotal > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 }}>
                  <Text style={{ fontSize: 12, color: colors.mutedText }}>
                    Selected Add-Ons ({selectedAddOns.length})
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>
                    +{currency}{addOnsTotal}
                  </Text>
                </View>
              )}

              {discountAmount > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 }}>
                  <Text style={{ fontSize: 12, color: '#10b981', fontWeight: '600' }}>
                    Voucher Discount ({appliedCoupon?.code})
                  </Text>
                  <Text style={{ fontSize: 12, color: '#10b981', fontWeight: '700' }}>
                    -{currency}{discountAmount}
                  </Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 }}>
                <Text style={{ fontSize: 12, color: colors.mutedText }}>
                  Taxes & Regulatory Fees (5%)
                </Text>
                <Text style={{ fontSize: 12, color: colors.heading, fontWeight: '600' }}>
                  {currency}{taxes}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 6,
                  paddingTop: 6,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderColor: `${colors.primary}40`,
                }}
              >
                <Text style={{ fontSize: 13, color: colors.heading, fontWeight: '800' }}>
                  Total Estimated
                </Text>
                <Text style={[styles.summaryValue, { color: colors.primary, fontSize: 16, fontWeight: '900' }]}>
                  {currency}{totalPrice}
                </Text>
              </View>
            </View>

            <TouchableOpacity testID="btn-confirm-reservation" accessibilityLabel="Confirm Reservation"
              style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
              onPress={handleBookingSubmit}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.confirmBtnText}>Confirm Reservation</Text>
              )}
            </TouchableOpacity>

            <CouponSelectionModal
              visible={isCouponModalVisible}
              onClose={() => setIsCouponModalVisible(false)}
              subtotal={grossSubtotal}
              tourId={numericTourId}
              travelers={totalTravelers}
              onCouponApplied={(result) => setAppliedCoupon(result)}
            />
          </ScrollView>
        )}
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingBottom: 110 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: SPACING.md, fontSize: FONT_SIZE.sm },
  imageContainer: { height: 280, width: '100%', position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  stickyTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingTag: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  ratingTagText: { color: '#ffffff', fontSize: FONT_SIZE.xs, fontWeight: '700' },
  galleryRow: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: SPACING.xs },
  thumbWrapper: { width: 68, height: 50, borderRadius: RADIUS.sm, overflow: 'hidden' },
  thumbImage: { width: '100%', height: '100%' },
  infoContainer: { padding: SPACING.md },
  tourTitle: { fontSize: FONT_SIZE.xxl, fontWeight: '800', lineHeight: 32, marginBottom: SPACING.xs },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SPACING.md },
  locationText: { fontSize: FONT_SIZE.sm, fontWeight: '500' },
  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  metricItem: { alignItems: 'center', flex: 1 },
  metricLabel: { fontSize: 10, textTransform: 'uppercase', marginTop: 4, fontWeight: '600' },
  metricVal: { fontSize: FONT_SIZE.xs + 1, fontWeight: '700', marginTop: 2 },
  metricDivider: { width: 1, height: 32 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, marginBottom: SPACING.md },
  tabBtn: { paddingVertical: SPACING.sm + 2, paddingHorizontal: SPACING.md, marginRight: SPACING.sm },
  tabBtnText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  tabContent: { paddingTop: SPACING.xs },
  sectionHeading: { fontSize: FONT_SIZE.lg, fontWeight: '800', marginBottom: SPACING.sm },
  bodyText: { fontSize: FONT_SIZE.sm, lineHeight: 22 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.xs },
  bulletText: { flex: 1, fontSize: FONT_SIZE.sm, lineHeight: 20 },
  includedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginTop: SPACING.xs },
  includedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 6,
  },
  includedChipText: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  itineraryCard: { flexDirection: 'row', padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, marginBottom: SPACING.sm },
  dayBadge: { width: 54, height: 32, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  dayBadgeText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  itineraryBody: { flex: 1 },
  itineraryTitle: { fontSize: FONT_SIZE.sm + 1, fontWeight: '700', marginBottom: 2 },
  itineraryDesc: { fontSize: FONT_SIZE.xs, lineHeight: 18 },
  reviewSummaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  reviewScoreBox: {
    gap: 3,
  },
  reviewScoreBig: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '900',
    lineHeight: 32,
  },
  reviewCountSub: {
    fontSize: FONT_SIZE.xs - 1,
    fontWeight: '500',
    marginTop: 2,
  },
  writeReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    minHeight: 44,
  },
  writeReviewBtnText: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '700',
  },
  reviewCard: { padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, marginBottom: SPACING.sm },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  reviewAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
  },
  reviewAuthor: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  reviewDate: { fontSize: 10, marginTop: 1 },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  starText: { fontSize: 12, fontWeight: '700' },
  reviewComment: { fontSize: FONT_SIZE.xs + 1, lineHeight: 19 },
  emptyTabText: { fontSize: FONT_SIZE.sm, textAlign: 'center', paddingVertical: SPACING.lg },
  emptyReviewsCard: { padding: SPACING.xl, alignItems: 'center', justifyContent: 'center', gap: 8 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm + 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOW.lg,
  },
  bottomBarPrefix: { fontSize: 10, textTransform: 'uppercase', fontWeight: '600' },
  bottomBarPrice: { fontSize: FONT_SIZE.xxl, fontWeight: '900' },
  reserveBtn: { paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm + 4, borderRadius: RADIUS.md },
  reserveBtnText: { color: '#ffffff', fontSize: FONT_SIZE.sm, fontWeight: '700' },
  modalRoot: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md, borderBottomWidth: 1 },
  modalTitle: { fontSize: FONT_SIZE.lg, fontWeight: '800' },
  modalCloseBtn: { padding: 4 },
  modalForm: { flex: 1 },
  formContent: { padding: SPACING.lg },
  formTourName: { fontSize: FONT_SIZE.md, fontWeight: '800', marginBottom: SPACING.md },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  counterLabel: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  counterSub: { fontSize: 11 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  stepBtn: { width: 32, height: 32, borderRadius: RADIUS.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepVal: { fontSize: FONT_SIZE.md, fontWeight: '800', minWidth: 20, textAlign: 'center' },
  inputLabel: { fontSize: FONT_SIZE.xs + 1, fontWeight: '700', marginBottom: 4 },
  quickDateRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xs + 2 },
  quickDateChip: { paddingHorizontal: SPACING.sm + 4, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1 },
  quickDateChipText: { fontSize: 11 },
  input: { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginBottom: SPACING.md, fontSize: FONT_SIZE.sm },
  textArea: { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginBottom: SPACING.md, fontSize: FONT_SIZE.sm, minHeight: 70 },
  summaryBox: { padding: SPACING.md, borderRadius: RADIUS.md, marginVertical: SPACING.md, alignItems: 'center' },
  summaryLabel: { fontSize: 11, textTransform: 'uppercase', fontWeight: '600', marginBottom: 2 },
  summaryValue: { fontSize: FONT_SIZE.xl, fontWeight: '800' },
  confirmBtn: { paddingVertical: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center', marginTop: SPACING.xs },
  confirmBtnText: { color: '#ffffff', fontSize: FONT_SIZE.md, fontWeight: '700' },
  successBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  successIconCircle: { width: 90, height: 90, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  successTitle: { fontSize: FONT_SIZE.xxl, fontWeight: '800', marginBottom: SPACING.xs },
  successDesc: { fontSize: FONT_SIZE.sm, textAlign: 'center', lineHeight: 20, marginBottom: SPACING.md },
  voucherCard: { width: '100%', borderWidth: 1, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.lg },
  voucherRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  voucherLabel: { fontSize: FONT_SIZE.xs, fontWeight: '600' },
  voucherValue: { fontSize: FONT_SIZE.xs + 1, fontWeight: '700', maxWidth: '65%' },
  successActions: { width: '100%', gap: SPACING.sm },
  doneBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md, borderRadius: RADIUS.md },
  doneBtnText: { color: '#ffffff', fontSize: FONT_SIZE.sm, fontWeight: '700' },
  secondaryDoneBtn: { borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md, borderRadius: RADIUS.md },
  secondaryDoneText: { fontSize: FONT_SIZE.sm, fontWeight: '600' },
  errorContentWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  backToExploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
  },
  backToExploreText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  photoCountBadgeText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  addonsSection: {
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  addonsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  addonsTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  addonsSubtitle: {
    fontSize: FONT_SIZE.xs,
    marginBottom: SPACING.sm,
  },
  addonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.sm,
  },
  addonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addonTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  addonName: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '700',
  },
  addonBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  addonBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  addonDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  addonPriceBox: {
    alignItems: 'flex-end',
    marginLeft: SPACING.sm,
  },
  addonPriceVal: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '800',
  },
  addonPriceUnit: {
    fontSize: 10,
  },
  promoSection: {
    marginVertical: SPACING.sm,
  },
  promoTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  promoTriggerText: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '700',
    flex: 1,
    marginLeft: 8,
  },
  appliedCouponCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  appliedCodeText: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 1,
  },
  appliedSavingsBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    backgroundColor: '#10b981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  appliedCouponDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  removeCouponBtn: {
    padding: 4,
  },
  floatingConciergePill: {
    position: 'absolute',
    right: SPACING.md,
    zIndex: 99,
  },
  mapExploreBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  mapExploreIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapExploreTitle: {
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: '700',
  },
  mapExploreSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  audioGuideBannerWrap: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  audioGuideBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
  },
  audioIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  audioBannerInfo: {
    flex: 1,
    marginRight: 8,
  },
  audioBannerBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  audioBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  audioDurationText: {
    fontSize: 11,
  },
  audioBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  audioBannerDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
});

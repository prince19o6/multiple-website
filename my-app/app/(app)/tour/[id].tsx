/**
 * app/(app)/tour/[id].tsx
 *
 * Full Tour Details screen.
 * Displays gallery, quick metrics, highlights, itinerary, included amenities,
 * guest reviews, and an interactive native booking modal with live total calculation.
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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSiteConfig } from '@/store/SiteConfigContext';
import { useColors } from '@/store/ThemeContext';
import { useSelectedSite } from '@/hooks/useSelectedSite';
import { useTour } from '@/hooks/useTours';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';
import { createBooking } from '@/lib/api';
import { useBooking } from '@/context/BookingContext';
import { PLACEHOLDER_IMAGE } from '@/lib/imageUtils';
import ErrorScreen from '@/components/ErrorScreen';

export default function TourDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const config = useSiteConfig();
  const colors = useColors();
  const { siteId } = useSelectedSite();
  const { addBooking } = useBooking();
  const tourIdParam = id || '1';
  const { tour, isLoading, isError, isNotFound, error, refetch } = useTour(siteId, tourIdParam);

  // [DEBUG] (marked for removal)
  React.useEffect(() => {
    if (__DEV__) {
      console.log(`[DEBUG] [(app)/TourDetailScreen] Route param id: "${id}"`);
      console.log(`[DEBUG] [(app)/TourDetailScreen] SiteId: "${siteId}", Name: "${config?.name}"`);
      if (tour) {
        console.log(`[DEBUG] [(app)/TourDetailScreen] Tour loaded: ID=${tour.id}, Slug="${tour.slug}", Name="${tour.name}"`);
      }
      if (isNotFound) {
        console.log(`[DEBUG] [(app)/TourDetailScreen] Tour not found (404) for param "${tourIdParam}"`);
      } else if (isError && error) {
        console.log(`[DEBUG] [(app)/TourDetailScreen] Error fetching tour "${tourIdParam}":`, error.message);
      }
    }
  }, [id, siteId, config?.name, tour, isNotFound, isError, error, tourIdParam]);

  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'itinerary' | 'reviews'>('overview');
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Booking Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [travelers, setTravelers] = useState(1);
  const [travelDate, setTravelDate] = useState('2026-11-15');
  const [specialRequest, setSpecialRequest] = useState('');

  const headingFontFamily = getHeadingFontFamily(config);
  const tourCardConfig = (config as any)?.tourCard || {};
  const currency = tourCardConfig.currency || '$';

  if (isLoading) {
    return (
      <View style={[styles.centerBox, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedText }]}>Loading tour details...</Text>
      </View>
    );
  }

  // Real HTTP 404 Not Found State
  if (isNotFound || (!tour && !isLoading && !isError)) {
    return (
      <View style={[styles.errorWrapper, { backgroundColor: colors.background }]}>
        <ErrorScreen
          title="Tour Not Found"
          message="We could not find the requested tour. It may have been removed or is temporarily unavailable on this website."
          fullScreen={false}
        />
        <TouchableOpacity
          style={[styles.backToExploreBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(app)/explore');
            }
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="compass-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.backToExploreText}>Explore Available Tours</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Network / 5xx Server / Timeout Failure State
  if (isError || !tour) {
    return (
      <View style={[styles.errorWrapper, { backgroundColor: colors.background }]}>
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
    );
  }

  const currentHeroImage = activeImage || tour.image || PLACEHOLDER_IMAGE;
  const gallery = tour.gallery?.length ? tour.gallery : [tour.image];
  const totalPrice = (tour.price || 0) * travelers;

  const handleBookingSubmit = async () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      Alert.alert('Missing Details', 'Please enter your name, email, and phone number.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Invalid Email', 'Please provide a valid email address.');
      return;
    }

    try {
      setSubmitting(true);
      await addBooking({
        website: siteId || 'tripgoasia',
        websiteId: siteId || 'tripgoasia',
        tourId: tour.id,
        tourName: tour.name,
        tourImage: tour.image,
        currency: currency || '$',
        location: tour.location || 'Global',
        totalPrice,
        guestName: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        travelers: Math.max(1, Number(travelers) || 1),
        date: travelDate,
        startDate: travelDate,
        specialRequest: specialRequest.trim(),
      });

      setBookingSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not complete booking on backend. Please check network.';
      Alert.alert('Booking Notice', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const closeBookingModal = () => {
    setBookingModalVisible(false);
    setBookingSuccess(false);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Main Photo Hero */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: currentHeroImage }} style={styles.heroImage} resizeMode="cover" />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={22} color="#ffffff" />
          </TouchableOpacity>

          <View style={[styles.ratingTag, { backgroundColor: colors.primary }]}>
            <Ionicons name="star" size={14} color="#ffffff" />
            <Text style={styles.ratingTagText}>{tour.rating?.toFixed(1) || '4.9'}</Text>
          </View>
        </View>

        {/* Thumbnail Gallery */}
        {gallery.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.galleryRow}
          >
            {gallery.map((img, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setActiveImage(img)}
                style={[
                  styles.thumbWrapper,
                  currentHeroImage === img && { borderColor: colors.primary, borderWidth: 2 },
                ]}
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
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'overview' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab('overview')}
            >
              <Text style={[styles.tabBtnText, { color: activeTab === 'overview' ? colors.primary : colors.mutedText }]}>
                Overview
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'itinerary' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab('itinerary')}
            >
              <Text style={[styles.tabBtnText, { color: activeTab === 'itinerary' ? colors.primary : colors.mutedText }]}>
                Itinerary ({tour.itinerary?.length || 0})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
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
              {tour.itinerary?.length ? (
                tour.itinerary.map((item, idx) => (
                  <View key={idx} style={[styles.itineraryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={[styles.dayBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.dayBadgeText}>Day {item.day}</Text>
                    </View>
                    <View style={styles.itineraryBody}>
                      <Text style={[styles.itineraryTitle, { color: colors.heading }]}>{item.title}</Text>
                      <Text style={[styles.itineraryDesc, { color: colors.mutedText }]}>{item.description}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={[styles.emptyTabText, { color: colors.mutedText }]}>
                  Day-by-day itinerary details provided upon booking confirmation.
                </Text>
              )}
            </View>
          )}

          {activeTab === 'reviews' && (
            <View style={styles.tabContent}>
              {tour.guestReviews?.length ? (
                tour.guestReviews.map((rev, idx) => (
                  <View key={idx} style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.reviewHeader}>
                      <Text style={[styles.reviewAuthor, { color: colors.heading }]}>{rev.author}</Text>
                      <View style={styles.starRow}>
                        <Ionicons name="star" size={14} color="#f59e0b" />
                        <Text style={styles.starText}>{rev.rating}</Text>
                      </View>
                    </View>
                    <Text style={[styles.reviewComment, { color: colors.text }]}>{`"${rev.text}"`}</Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.emptyTabText, { color: colors.mutedText }]}>
                  No guest reviews yet. Be the first to embark on this journey!
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Bottom Booking Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View>
          <Text style={[styles.bottomBarPrefix, { color: colors.mutedText }]}>Price per guest</Text>
          <Text style={[styles.bottomBarPrice, { color: colors.primary }]}>
            {currency}{tour.price}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.reserveBtn, { backgroundColor: colors.primary }]}
          onPress={() => setBookingModalVisible(true)}
          activeOpacity={0.88}
        >
          <Text style={styles.reserveBtnText}>Book Experience</Text>
        </TouchableOpacity>
      </View>

      {/* Native Booking Modal */}
      <Modal
        visible={bookingModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeBookingModal}
      >
        <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.heading }]}>Reserve Experience</Text>
            <TouchableOpacity onPress={closeBookingModal} style={styles.modalCloseBtn}>
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
                Thank you, {name}! A confirmation voucher has been sent to {email}.
              </Text>
              <TouchableOpacity
                style={[styles.doneBtn, { backgroundColor: colors.primary }]}
                onPress={closeBookingModal}
              >
                <Text style={styles.doneBtnText}>Return to Tour</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={styles.modalForm} contentContainerStyle={styles.formContent}>
              <Text style={[styles.formTourName, { color: colors.primary }]}>{tour.name}</Text>

              {/* Travelers Counter */}
              <View style={[styles.counterRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View>
                  <Text style={[styles.counterLabel, { color: colors.heading }]}>Guests / Travelers</Text>
                  <Text style={[styles.counterSub, { color: colors.mutedText }]}>How many people joining?</Text>
                </View>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={[styles.stepBtn, { borderColor: colors.border }]}
                    onPress={() => setTravelers((prev) => Math.max(1, prev - 1))}
                  >
                    <Ionicons name="remove" size={18} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={[styles.stepVal, { color: colors.heading }]}>{travelers}</Text>
                  <TouchableOpacity
                    style={[styles.stepBtn, { borderColor: colors.border }]}
                    onPress={() => setTravelers((prev) => prev + 1)}
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
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.mutedText}
                value={travelDate}
                onChangeText={setTravelDate}
              />

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

              {/* Total Price Summary */}
              <View style={[styles.summaryBox, { backgroundColor: `${colors.primary}12` }]}>
                <Text style={[styles.summaryLabel, { color: colors.heading }]}>Total Estimated Investment</Text>
                <Text style={[styles.summaryValue, { color: colors.primary }]}>
                  {currency}{totalPrice} ({travelers} × {currency}{tour.price})
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                onPress={handleBookingSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.confirmBtnText}>Confirm Reservation</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: SPACING.md, fontSize: FONT_SIZE.sm },
  imageContainer: { height: 280, width: '100%', position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  backButton: {
    position: 'absolute',
    top: 48,
    left: SPACING.md,
    width: 38,
    height: 38,
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
  reviewCard: { padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, marginBottom: SPACING.sm },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  reviewAuthor: { fontSize: FONT_SIZE.sm, fontWeight: '700' },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  starText: { fontSize: 12, fontWeight: '700' },
  reviewComment: { fontSize: FONT_SIZE.xs + 1, fontStyle: 'italic', lineHeight: 19 },
  emptyTabText: { fontSize: FONT_SIZE.sm, textAlign: 'center', paddingVertical: SPACING.lg },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
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
  input: { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginBottom: SPACING.md, fontSize: FONT_SIZE.sm },
  textArea: { borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, marginBottom: SPACING.md, fontSize: FONT_SIZE.sm, minHeight: 70 },
  summaryBox: { padding: SPACING.md, borderRadius: RADIUS.md, marginVertical: SPACING.md, alignItems: 'center' },
  summaryLabel: { fontSize: 11, textTransform: 'uppercase', fontWeight: '600', marginBottom: 2 },
  summaryValue: { fontSize: FONT_SIZE.xl, fontWeight: '800' },
  confirmBtn: { paddingVertical: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center', marginTop: SPACING.xs },
  confirmBtnText: { color: '#ffffff', fontSize: FONT_SIZE.md, fontWeight: '700' },
  successBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  successIconCircle: { width: 100, height: 100, borderRadius: RADIUS.full, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg },
  successTitle: { fontSize: FONT_SIZE.xxl, fontWeight: '800', marginBottom: SPACING.sm },
  successDesc: { fontSize: FONT_SIZE.sm, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.xl },
  doneBtn: { paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderRadius: RADIUS.md },
  doneBtnText: { color: '#ffffff', fontSize: FONT_SIZE.sm, fontWeight: '700' },
  errorWrapper: {
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
});

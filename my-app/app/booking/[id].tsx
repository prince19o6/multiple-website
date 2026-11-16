/**
 * app/booking/[id].tsx
 *
 * Full Booking Details and E-Ticket Voucher display screen.
 * Displays luxury perforated boarding pass voucher, live QR verification code,
 * passenger and tour snapshot details, cancellation flow with confirmation dialog,
 * and concierge support links.
 * Works seamlessly by MongoDB ID or booking reference.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Share,
  Platform,
  Linking,
  Modal,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useSiteConfig, useSite } from '@/store/SiteConfigContext';
import { useBooking } from '@/context/BookingContext';
import { useConcierge } from '@/context/ConciergeContext';
import { useWeather } from '@/context/WeatherContext';
import { useTours } from '@/hooks/useTours';
import { fetchBooking } from '@/services/api';
import type { Booking, Tour } from '@/types';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';
import { PLACEHOLDER_IMAGE } from '@/lib/imageUtils';
import AppHeader from '@/components/common/AppHeader';
import TourItinerarySection from '@/components/TourItinerarySection';
import { TOUR_ADDONS } from '@/constants/bookingAddOns';
import { storeGetObject, storeSetObject } from '@/src/lib/storage';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const config = useSiteConfig();
  const { hostname, siteName } = useSite();
  const { getBooking, cancelBooking, requestCancellation } = useBooking();
  const { openConcierge, specialist } = useConcierge();
  const { tours } = useTours();
  const headingFontFamily = getHeadingFontFamily(config);

  const [booking, setBooking] = useState<Booking | null>(() => (id ? getBooking(id) || null : null));
  const [loading, setLoading] = useState(!booking);
  const [cancelling, setCancelling] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Cancellation Request Modal State
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState('Change in travel schedule / dates');
  const [customReason, setCustomReason] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  // Collapsible Secondary Features ("See More")
  const [showMoreFeatures, setShowMoreFeatures] = useState(false);

  // Fallback to fetch from backend if direct navigation or refreshed
  useEffect(() => {
    let cancelled = false;
    if (id && !booking) {
      setLoading(true);
      fetchBooking(id)
        .then((data) => {
          if (!cancelled) setBooking(data);
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setFetchError(err instanceof Error ? err.message : 'Booking voucher not found');
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [id, booking]);

  const handleReturnToBookings = useCallback(() => {
    try {
      Haptics.selectionAsync();
    } catch {}
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/bookings');
    }
  }, [router]);

  const performCancellation = useCallback(async () => {
    if (!booking) return;
    try {
      setCancelling(true);
      const targetId = booking.id || booking.reference || id;
      const targetEmail = booking.email || (booking.snapshot as { guestEmail?: string } | undefined)?.guestEmail;
      const updated = await cancelBooking(targetId, targetEmail);
      setBooking(updated);
      if (Platform.OS === 'web') {
        window.alert('Your reservation has been cancelled.');
      } else {
        Alert.alert('Booking Cancelled', 'Your reservation has been cancelled.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not cancel booking.';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Cancellation Error', msg);
      }
    } finally {
      setCancelling(false);
    }
  }, [booking, cancelBooking, id]);

  const handleSubmitCancellationRequest = useCallback(async () => {
    if (!booking) return;
    const finalReason = customReason.trim()
      ? `${selectedReason}: ${customReason.trim()}`
      : selectedReason;

    try {
      setSubmittingCancel(true);
      const targetId = booking.id || booking.reference || id;
      const targetEmail = booking.email || (booking.snapshot as { guestEmail?: string } | undefined)?.guestEmail;
      const updated = await requestCancellation(targetId, finalReason, targetEmail);
      setBooking(updated);
      setCancelModalVisible(false);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      if (Platform.OS === 'web') {
        window.alert('Your cancellation request has been submitted to the concierge desk for review.');
      } else {
        Alert.alert(
          'Cancellation Requested',
          'Your cancellation request has been submitted to the concierge desk for review.'
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not submit cancellation request.';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Submission Error', msg);
      }
    } finally {
      setSubmittingCancel(false);
    }
  }, [booking, customReason, id, requestCancellation, selectedReason]);

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <AppHeader showBackButton={true} title="Booking Pass" showLogo={true} logoSize="sm" />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedText }]}>
            Loading E-Ticket Voucher...
          </Text>
        </View>
      </View>
    );
  }

  if (fetchError || !booking) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <AppHeader showBackButton={true} title="Booking Pass" showLogo={true} logoSize="sm" />
        <View style={styles.centerBox}>
          <Ionicons name="alert-circle-outline" size={54} color="#ef4444" />
          <Text style={[styles.errorTitle, { color: colors.heading, fontFamily: headingFontFamily }]}>
            Reservation Not Found
          </Text>
          <Text style={[styles.errorDesc, { color: colors.mutedText }]}>
            {fetchError || `Could not retrieve reservation details for reference #${id}.`}
          </Text>
          <TouchableOpacity testID="btn-view-my-bookings" accessibilityLabel="View My Bookings"
            style={[styles.backBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.replace('/(tabs)/bookings')}
          >
            <Text style={styles.backBtnText}>View My Bookings</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const normalizedStatus = (booking.status || 'pending').toLowerCase();
  const isConfirmed = normalizedStatus === 'confirmed' || normalizedStatus === 'upcoming';
  const isPending = normalizedStatus === 'pending';
  const isRejected = normalizedStatus === 'rejected';
  const isCancelled = normalizedStatus === 'cancelled';
  const isExpired = normalizedStatus === 'expired';
  const isCompleted = normalizedStatus === 'completed';
  const hasCancelRequest = booking.cancellationRequest && booking.cancellationRequest.status === 'pending';
  const bookingRef = booking.reference || (booking.id.length > 10 ? booking.id.slice(-8) : booking.id);
  const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    `PASS:${bookingRef}|ID:${booking.id}|TOUR:${booking.tourId}|TRAVELERS:${booking.travelers}`
  )}`;

  const matchedTour = tours.find((t) => String(t.id) === String(booking.tourId));

  const tourObj: Tour = matchedTour || {
    id: booking.tourId,
    name: booking.tourName,
    slug: booking.tourSlug || String(booking.tourId),
    description: `Confirmed reservation with ${siteName}.`,
    fullDescription: `Confirmed reservation with ${siteName}. Day-by-day expedition details and mobile voucher are verified.`,
    price: booking.totalPrice,
    image: booking.tourImage || booking.snapshot?.coverImage || PLACEHOLDER_IMAGE,
    gallery: [],
    duration: booking.duration || '4 Days / 3 Nights',
    durationDays: 4,
    location: booking.location || booking.destination || siteName,
    destination: booking.destination || booking.location || siteName,
    difficulty: 'Easy',
    groupSize: `${booking.travelers} travelers`,
    bestTime: 'All Year',
    language: 'English',
    category: booking.snapshot?.category || 'Cultural',
    rating: 5,
    reviews: 5,
    highlights: [],
    itinerary: (booking.snapshot?.itinerarySummary || []).map((item) => ({
      day: item.day,
      title: item.title,
      description: item.description,
    })),
    included: booking.snapshot?.includedSummary || [],
    guestReviews: [],
  };

  // Snapshot fallback
  const displayTitle =
    booking.tourName &&
    booking.tourName !== 'Curated Expedition' &&
    booking.tourName !== 'Unknown Tour'
      ? booking.tourName
      : matchedTour?.name || 'Guided Tour Expedition';

  const displayPrice =
    booking.totalPrice > 0
      ? booking.totalPrice
      : booking.unitPrice
      ? booking.unitPrice * Math.max(1, booking.travelers)
      : matchedTour?.price
      ? matchedTour.price * Math.max(1, booking.travelers)
      : booking.totalPrice;

  const tourCardConfig = (config as { tourCard?: { currency?: string } } | null)?.tourCard || {};
  const displayCurrency =
    booking.currency && booking.currency !== '$'
      ? booking.currency
      : tourCardConfig.currency || booking.currency || '$';

  const isTourCatalogMissing = !matchedTour;

  const handleShareVoucher = async () => {
    if (!booking) return;
    try {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // Haptics fallback
      }
      const effectiveHost = hostname || 'www.gujjutours.com';
      const verificationUrl = `https://${effectiveHost}/booking/${bookingRef}`;
      const passenger = booking.guestName || 'Valued Guest';
      const travelDate = booking.travelDate || booking.date || 'Scheduled Departure';
      const travelerCount = booking.travelers || booking.adults || 1;

      const travelerDetails = booking.travelersList && booking.travelersList.length > 0
        ? booking.travelersList.map((t, idx) => `  ${idx + 1}. ${t.name} (${t.type}${t.age ? `, age ${t.age}` : ''})`).join('\n')
        : `  1. ${passenger}`;

      const message = `🎟️ OFFICIAL E-TICKET VOUCHER\n` +
        `----------------------------------------\n` +
        `Expedition: ${displayTitle}\n` +
        `Booking Ref: #${bookingRef}\n` +
        `Lead Passenger: ${passenger}\n` +
        `Travelers (${travelerCount}):\n${travelerDetails}\n` +
        `Departure Date: ${travelDate}\n` +
        `Total Paid: ${displayCurrency}${displayPrice}\n` +
        `Status: ${booking.status.toUpperCase()}\n\n` +
        `Digital Pass & QR Verification:\n${verificationUrl}\n` +
        `Provider: ${siteName || config?.name || 'ToursApp'}`;

      await Share.share({
        title: `E-Ticket Pass: ${displayTitle} (#${bookingRef})`,
        message,
        url: Platform.OS === 'ios' ? verificationUrl : undefined,
      });
    } catch (err) {
      if (__DEV__) {
        console.log('[BookingDetailScreen] Share cancelled or failed:', err);
      }
    }
  };

  // Weather context for destination weather
  const { allDestinations, currentWeather } = useWeather();
  const destWeather = useMemo(() => {
    const destName = booking?.destination || booking?.location || tourObj.destination || '';
    if (!destName) return currentWeather;
    const match = allDestinations?.find(
      (d) =>
        d.destinationName.toLowerCase().includes(destName.toLowerCase()) ||
        destName.toLowerCase().includes(d.destinationName.toLowerCase())
    );
    return match || currentWeather;
  }, [booking?.destination, booking?.location, tourObj.destination, allDestinations, currentWeather]);

  // Meeting Point & Pickup Dispatch
  const meetingPointLocation =
    booking?.specialRequest && /pickup|hotel|lobby|station|terminal|gate/i.test(booking.specialRequest)
      ? booking.specialRequest
      : `${tourObj.destination || siteName} - Central Departure Gate / Hotel Lobby`;

  const scheduledPickupTime = '08:30 AM (Check-in 15m prior to departure)';

  const handleOpenMaps = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    const query = encodeURIComponent(`${tourObj.destination || booking?.location || siteName} tourist meeting point`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  // Inclusions & Highlights
  const ticketInclusions = useMemo(() => {
    if (tourObj.included && tourObj.included.length > 0) {
      return tourObj.included;
    }
    if (booking?.snapshot?.includedSummary && booking.snapshot.includedSummary.length > 0) {
      return booking.snapshot.includedSummary;
    }
    return [
      'Chauffeur-Driven Air-Conditioned Vehicle',
      'Certified Multilingual Expedition Guide',
      'All Sightseeing Entry Tickets & Monument Permits',
      'Gourmet Refreshments & Bottled Water',
      'Hotel / Terminal Pickup & Return Transfers',
      'Comprehensive Traveler Emergency Insurance',
    ];
  }, [tourObj.included, booking?.snapshot?.includedSummary]);

  // Interactive Packing Checklist items
  const ticketPackingList = useMemo(
    () => [
      {
        id: 'tp_1',
        title: 'Government ID / Passport & E-Ticket Voucher',
        desc: 'Required for gate check-in & hotel security verification',
        icon: 'card-outline' as const,
        mandatory: true,
      },
      {
        id: 'tp_2',
        title: 'Comfortable Footwear & Expedition Attire',
        desc: 'Light breathable clothes for day trips, non-slip walking shoes',
        icon: 'footsteps-outline' as const,
        mandatory: false,
      },
      {
        id: 'tp_3',
        title: 'Sun Protection & Sunglasses',
        desc: 'Wide-brim hat, polarized eyewear and SPF 50+ sunscreen',
        icon: 'sunny-outline' as const,
        mandatory: false,
      },
      {
        id: 'tp_4',
        title: 'Power Bank & Electronics Charger',
        desc: 'Keep phone charged for photos, live navigation and mobile vouchers',
        icon: 'battery-charging-outline' as const,
        mandatory: false,
      },
      {
        id: 'tp_5',
        title: 'Reusable Water Bottle & Compact Umbrella',
        desc: 'Stay hydrated throughout the excursion and prepared for weather',
        icon: 'water-outline' as const,
        mandatory: false,
      },
      {
        id: 'tp_6',
        title: 'Personal Prescriptions & Travel First-Aid',
        desc: 'Personal daily medication, motion sickness pills & sanitizers',
        icon: 'medkit-outline' as const,
        mandatory: false,
      },
    ],
    []
  );

  const [checkedPacking, setCheckedPacking] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    const bookingRefId = booking?.id || booking?.reference || id;
    if (!bookingRefId) return;

    storeGetObject<string[]>(`packing_ticket_${bookingRefId}`).then((saved) => {
      if (!cancelled && saved && Array.isArray(saved)) {
        setCheckedPacking(saved);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [booking?.id, booking?.reference, id]);

  const handleTogglePacking = useCallback(
    async (itemId: string) => {
      try {
        Haptics.selectionAsync();
      } catch {}
      const bookingRefId = booking?.id || booking?.reference || id;
      setCheckedPacking((prev) => {
        const next = prev.includes(itemId) ? prev.filter((i) => i !== itemId) : [...prev, itemId];
        if (bookingRefId) {
          storeSetObject(`packing_ticket_${bookingRefId}`, next).catch(() => {});
        }
        return next;
      });
    },
    [booking?.id, booking?.reference, id]
  );

  const handlePackAll = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    const allIds = ticketPackingList.map((i) => i.id);
    setCheckedPacking(allIds);
    const bookingRefId = booking?.id || booking?.reference || id;
    if (bookingRefId) {
      await storeSetObject(`packing_ticket_${bookingRefId}`, allIds).catch(() => {});
    }
  }, [ticketPackingList, booking?.id, booking?.reference, id]);

  const handleResetPacking = useCallback(async () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    setCheckedPacking([]);
    const bookingRefId = booking?.id || booking?.reference || id;
    if (bookingRefId) {
      await storeSetObject(`packing_ticket_${bookingRefId}`, []).catch(() => {});
    }
  }, [booking?.id, booking?.reference, id]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader
        showBackButton={true}
        onBackPress={handleReturnToBookings}
        title="E-Ticket Voucher"
        showLogo={true}
        logoSize="sm"
        rightActions={
          <TouchableOpacity testID="btn-share"
            style={styles.headerShareBtn}
            onPress={handleShareVoucher}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Share E-Ticket pass"
          >
            <Ionicons name="share-social-outline" size={20} color={colors.heading} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 3-Step Progress Stepper (Visible for Pending & Confirmed) ─── */}
        <View style={[styles.stepperCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.stepperHeaderTag, { color: colors.mutedText }]}>RESERVATION LIFECYCLE</Text>
          <View style={styles.stepperRow}>
            {/* Step 1: Placed */}
            <View style={styles.stepperStep}>
              <View style={[styles.stepCircle, { backgroundColor: '#10b981' }]}>
                <Ionicons name="checkmark" size={13} color="#ffffff" />
              </View>
              <Text style={[styles.stepTitle, { color: colors.heading }]}>Booking Placed</Text>
              <Text style={[styles.stepSub, { color: colors.mutedText }]}>Logged</Text>
            </View>

            <View style={[styles.stepLine, { backgroundColor: isConfirmed || isCompleted ? '#10b981' : isPending ? '#f59e0b' : colors.border }]} />

            {/* Step 2: Concierge Review */}
            <View style={styles.stepperStep}>
              <View
                style={[
                  styles.stepCircle,
                  {
                    backgroundColor: isConfirmed || isCompleted ? '#10b981' : isPending ? '#f59e0b' : isRejected ? '#ef4444' : '#94a3b8',
                  },
                ]}
              >
                <Ionicons
                  name={isConfirmed || isCompleted ? 'checkmark' : isPending ? 'time' : isRejected ? 'close' : 'time-outline'}
                  size={13}
                  color="#ffffff"
                />
              </View>
              <Text style={[styles.stepTitle, { color: isPending ? '#d97706' : colors.heading, fontWeight: isPending ? '800' : '600' }]}>
                {isRejected ? 'Declined' : 'Concierge Review'}
              </Text>
              <Text style={[styles.stepSub, { color: colors.mutedText }]}>
                {isRejected ? 'Unavailable' : isPending ? 'In Progress' : 'Verified'}
              </Text>
            </View>

            <View style={[styles.stepLine, { backgroundColor: isConfirmed || isCompleted ? '#10b981' : colors.border }]} />

            {/* Step 3: E-Ticket Issued */}
            <View style={styles.stepperStep}>
              <View
                style={[
                  styles.stepCircle,
                  {
                    backgroundColor: isConfirmed || isCompleted ? '#10b981' : '#cbd5e1',
                  },
                ]}
              >
                <Ionicons
                  name={isConfirmed || isCompleted ? 'qr-code' : 'lock-closed'}
                  size={13}
                  color={isConfirmed || isCompleted ? '#ffffff' : '#64748b'}
                />
              </View>
              <Text style={[styles.stepTitle, { color: isConfirmed ? '#059669' : colors.mutedText, fontWeight: isConfirmed ? '800' : '600' }]}>
                Pass & QR Active
              </Text>
              <Text style={[styles.stepSub, { color: colors.mutedText }]}>
                {isConfirmed ? 'Ready to Board' : 'Locked'}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Informative Lifecycle Banners ─── */}
        {isPending && (
          <View style={[styles.lifecycleBanner, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}>
            <Ionicons name="time" size={24} color="#d97706" style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#b45309' }}>
                Awaiting Concierge Confirmation
              </Text>
              <Text style={{ fontSize: 12, color: '#92400e', marginTop: 3, lineHeight: 17 }}>
                Your reservation is logged in our booking desk inbox. Our team will verify guide schedules and vehicle dispatch (usually within 2-4 hours). Once confirmed, your live QR boarding pass will activate here automatically.
              </Text>
            </View>
          </View>
        )}

        {isRejected && (
          <View style={[styles.lifecycleBanner, { backgroundColor: '#ffe4e6', borderColor: '#fecdd3' }]}>
            <Ionicons name="close-circle" size={24} color="#e11d48" style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#be123c' }}>
                Reservation Declined by Concierge
              </Text>
              <Text style={{ fontSize: 12, color: '#9f1239', marginTop: 3, lineHeight: 17 }}>
                {booking.rejectionReason
                  ? `Reason: ${booking.rejectionReason}`
                  : 'Unfortunately this excursion could not be confirmed for your requested dates.'}
              </Text>
              <Text style={{ fontSize: 11, color: '#be123c', marginTop: 4, fontWeight: '600' }}>
                No charge was made, or your payment has been automatically queued for a 100% refund.
              </Text>
            </View>
          </View>
        )}

        {isCancelled && (
          <View style={[styles.lifecycleBanner, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}>
            <Ionicons name="ban" size={24} color="#dc2626" style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#b91c1c' }}>
                Reservation Cancelled
              </Text>
              <Text style={{ fontSize: 12, color: '#991b1b', marginTop: 3, lineHeight: 17 }}>
                {booking.cancellationReason
                  ? `Reason: ${booking.cancellationReason}`
                  : 'This reservation has been cancelled.'}
              </Text>
            </View>
          </View>
        )}

        {hasCancelRequest && (
          <View style={[styles.lifecycleBanner, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}>
            <Ionicons name="warning" size={24} color="#d97706" style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#b45309' }}>
                Cancellation Request Under Concierge Review
              </Text>
              <Text style={{ fontSize: 12, color: '#92400e', marginTop: 2 }}>
                Reason: {booking.cancellationRequest?.reason}
              </Text>
              <Text style={{ fontSize: 10, color: '#b45309', marginTop: 3 }}>
                Submitted on {new Date(booking.cancellationRequest?.requestedAt || '').toLocaleDateString()} · Our booking desk is processing your request.
              </Text>
            </View>
          </View>
        )}

        {/* ─── Luxury Boarding Pass Ticket ─── */}
        <View
          style={[
            styles.ticketContainer,
            {
              backgroundColor: colors.surface,
              borderColor: isPending ? '#f59e0b40' : colors.border,
            },
          ]}
        >
          {/* Ticket Header */}
          <View style={styles.ticketHeader}>
            <View style={styles.ticketHeaderLeft}>
              <Text style={[styles.passTag, { color: isPending ? '#d97706' : colors.primary }]}>
                {isConfirmed ? 'OFFICIAL E-TICKET PASS' : isPending ? 'PENDING CONCIERGE REVIEW' : 'RESERVATION VOUCHER'}
              </Text>
              <Text style={[styles.ticketTourTitle, { color: colors.heading, fontFamily: headingFontFamily }]}>
                {displayTitle}
              </Text>
              <Text style={[styles.bookingRef, { color: colors.mutedText }]}>
                REFERENCE: #{bookingRef}
              </Text>
              {isTourCatalogMissing && (
                <Text style={[styles.snapshotBadge, { color: colors.mutedText }]}>
                  Preserved Tour Snapshot
                </Text>
              )}
            </View>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isPending
                    ? '#fef3c7'
                    : isConfirmed
                    ? '#d1fae5'
                    : isRejected
                    ? '#ffe4e6'
                    : isCancelled
                    ? '#fee2e2'
                    : '#dbeafe',
                  borderWidth: 1,
                  borderColor: isPending
                    ? '#fde68a'
                    : isConfirmed
                    ? '#a7f3d0'
                    : isRejected
                    ? '#fecdd3'
                    : isCancelled
                    ? '#fca5a5'
                    : '#bfdbfe',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  {
                    color: isPending
                      ? '#b45309'
                      : isConfirmed
                      ? '#065f46'
                      : isRejected
                      ? '#be123c'
                      : isCancelled
                      ? '#b91c1c'
                      : '#1d4ed8',
                  },
                ]}
              >
                {isPending
                  ? 'PENDING'
                  : isConfirmed
                  ? 'CONFIRMED'
                  : isRejected
                  ? 'DECLINED'
                  : isCancelled
                  ? 'CANCELLED'
                  : booking.status.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Perforated Divider Line with Cutout Notches */}
          <View style={styles.perforationRow}>
            <View style={[styles.notchLeft, { backgroundColor: colors.background, borderColor: colors.border }]} />
            <View style={[styles.dashedLine, { borderColor: colors.border }]} />
            <View style={[styles.notchRight, { backgroundColor: colors.background, borderColor: colors.border }]} />
          </View>

          {/* Ticket Body: QR Verification (Gated strictly to Confirmed) */}
          <View style={styles.qrSection}>
            {isConfirmed ? (
              <>
                <View style={styles.qrBox}>
                  <Image
                    source={{ uri: qrDataUrl }}
                    style={styles.qrImage}
                    contentFit="contain"
                    transition={300}
                  />
                </View>
                <Text style={[styles.qrPrompt, { color: colors.mutedText }]}>
                  Scan at tour check-in or present to tour concierge
                </Text>
              </>
            ) : isPending ? (
              <View style={[styles.lockedQrBox, { backgroundColor: '#fef3c750', borderColor: '#fde68a' }]}>
                <View style={[styles.lockIconCircle, { backgroundColor: '#f59e0b15' }]}>
                  <Ionicons name="lock-closed" size={32} color="#d97706" />
                </View>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#b45309', marginTop: 10 }}>
                  QR Boarding Pass Locked
                </Text>
                <Text style={{ fontSize: 11, color: '#92400e', textAlign: 'center', marginTop: 4, lineHeight: 16 }}>
                  Awaiting concierge review. Your live QR check-in voucher will activate immediately upon booking approval.
                </Text>
              </View>
            ) : (
              <View style={[styles.lockedQrBox, { backgroundColor: '#fee2e240', borderColor: '#fca5a5' }]}>
                <Ionicons name="close-circle-outline" size={36} color="#dc2626" />
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#b91c1c', marginTop: 8 }}>
                  E-Ticket Voucher Inactive
                </Text>
                <Text style={{ fontSize: 11, color: '#991b1b', textAlign: 'center', marginTop: 2 }}>
                  {isRejected ? 'Reservation declined' : 'This voucher was cancelled or expired.'}
                </Text>
              </View>
            )}
          </View>

          {/* Perforated Divider 2 */}
          <View style={styles.perforationRow}>
            <View style={[styles.notchLeft, { backgroundColor: colors.background, borderColor: colors.border }]} />
            <View style={[styles.dashedLine, { borderColor: colors.border }]} />
            <View style={[styles.notchRight, { backgroundColor: colors.background, borderColor: colors.border }]} />
          </View>

          {/* Ticket Details Grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.mutedText }]}>PRIMARY PASSENGER</Text>
              <Text style={[styles.detailValue, { color: colors.heading }]}>{booking.guestName}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.mutedText }]}>TRAVEL DATE</Text>
              <Text style={[styles.detailValue, { color: colors.heading }]}>
                {booking.travelDate || booking.date}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.mutedText }]}>GUESTS</Text>
              <Text style={[styles.detailValue, { color: colors.heading }]}>
                {booking.adults || booking.travelers} Adults
                {booking.children ? `, ${booking.children} Children` : ''}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.mutedText }]}>BOOKING SOURCE</Text>
              <Text style={[styles.detailValue, { color: colors.heading }]}>
                {booking.source === 'web' ? '🌐 Web Portal' : '📱 Mobile App'}
              </Text>
            </View>

            {booking.snapshot && (
              <>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.mutedText }]}>DESTINATION</Text>
                  <Text style={[styles.detailValue, { color: colors.heading }]}>
                    {booking.snapshot.destination}
                  </Text>
                </View>

                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.mutedText }]}>DURATION</Text>
                  <Text style={[styles.detailValue, { color: colors.heading }]}>
                    {booking.snapshot.duration}
                  </Text>
                </View>
              </>
            )}

            <View style={styles.detailItemFull}>
              <Text style={[styles.detailLabel, { color: colors.mutedText }]}>CONTACT INFO</Text>
              <Text style={[styles.detailValue, { color: colors.heading }]}>
                {booking.email} {booking.phone ? `· ${booking.phone}` : ''}
              </Text>
            </View>

            {/* Individual Travelers Manifest */}
            {((booking.travelersList && booking.travelersList.length > 0) || booking.guestName) && (
              <View style={[styles.detailItemFull, { marginTop: 8, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={[styles.detailLabel, { color: colors.primary, fontWeight: '800' }]}>
                    INDIVIDUAL TRAVELERS MANIFEST ({(booking.travelersList && booking.travelersList.length > 0) ? booking.travelersList.length : 1})
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="checkmark-done-circle" size={14} color="#10b981" />
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#10b981' }}>VERIFIED PASSENGERS</Text>
                  </View>
                </View>

                {booking.travelersList && booking.travelersList.length > 0 ? (
                  booking.travelersList.map((trv, idx) => (
                    <View
                      key={trv.id || idx}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        marginBottom: 6,
                      }}
                    >
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.heading }}>
                          {idx + 1}. {trv.name}
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 2 }}>
                          {trv.type === 'child' ? 'Child (2-11 yrs)' : 'Adult (12+ yrs)'}
                          {trv.age ? ` · Age ${trv.age}` : ''}
                          {trv.gender ? ` · ${trv.gender}` : ''}
                          {trv.passportOrId ? ` · ID: ${trv.passportOrId}` : ''}
                        </Text>
                      </View>
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 6,
                          backgroundColor: trv.type === 'child' ? '#f59e0b15' : `${colors.primary}15`,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            color: trv.type === 'child' ? '#f59e0b' : colors.primary,
                          }}
                        >
                          {trv.type || 'Traveler'}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                    }}
                  >
                    <View>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.heading }}>
                        1. {booking.guestName}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.mutedText, marginTop: 2 }}>
                        Lead Passenger · Adult
                      </Text>
                    </View>
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                        backgroundColor: `${colors.primary}15`,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', color: colors.primary }}>
                        Primary
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Experience Add-Ons if included */}
            {booking.addOns && booking.addOns.length > 0 && (
              <View style={styles.detailItemFull}>
                <Text style={[styles.detailLabel, { color: colors.mutedText }]}>SELECTED ADD-ONS</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {booking.addOns.map((addonId: string) => {
                    const matchedAddon = TOUR_ADDONS.find((a) => a.id === addonId);
                    return (
                      <View
                        key={addonId}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 6,
                          backgroundColor: `${colors.primary}12`,
                        }}
                      >
                        <Ionicons name="sparkles" size={12} color={colors.primary} />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                          {matchedAddon?.name || addonId.replace(/_/g, ' ')}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {booking.priceBreakdown && (
              <View style={[styles.detailItemFull, { backgroundColor: `${colors.primary}08`, padding: 10, borderRadius: 8 }]}>
                <Text style={[styles.detailLabel, { color: colors.primary, marginBottom: 4 }]}>
                  PRICE BREAKDOWN
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 1 }}>
                  <Text style={{ fontSize: 11, color: colors.mutedText }}>Base Fare</Text>
                  <Text style={{ fontSize: 11, color: colors.heading, fontWeight: '600' }}>
                    {displayCurrency}{booking.priceBreakdown.subtotal}
                  </Text>
                </View>
                {(booking.priceBreakdown.addOnsTotal ?? 0) > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 1 }}>
                    <Text style={{ fontSize: 11, color: colors.mutedText }}>Add-Ons Upgrades</Text>
                    <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '600' }}>
                      +{displayCurrency}{booking.priceBreakdown.addOnsTotal}
                    </Text>
                  </View>
                )}
                {(booking.priceBreakdown.discount > 0 || !!booking.promoCode) && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 1 }}>
                    <Text style={{ fontSize: 11, color: '#10b981', fontWeight: '600' }}>
                      Promo Voucher ({booking.promoCode || 'SAVINGS'})
                    </Text>
                    <Text style={{ fontSize: 11, color: '#10b981', fontWeight: '700' }}>
                      -{displayCurrency}{booking.priceBreakdown.discount || booking.discountAmount || 0}
                    </Text>
                  </View>
                )}
                {booking.priceBreakdown.taxes > 0 && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 1 }}>
                    <Text style={{ fontSize: 11, color: colors.mutedText }}>Taxes & Fees (5%)</Text>
                    <Text style={{ fontSize: 11, color: colors.heading, fontWeight: '600' }}>
                      {displayCurrency}{booking.priceBreakdown.taxes}
                    </Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingTop: 4, borderTopWidth: StyleSheet.hairlineWidth, borderColor: colors.border }}>
                  <Text style={{ fontSize: 12, color: colors.heading, fontWeight: '800' }}>Total Paid</Text>
                  <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '900' }}>
                    {displayCurrency}{booking.priceBreakdown.total}
                  </Text>
                </View>
              </View>
            )}

            {!booking.priceBreakdown && (
              <View style={styles.detailItemFull}>
                <Text style={[styles.detailLabel, { color: colors.mutedText }]}>TOTAL AMOUNT</Text>
                <Text style={[styles.detailValue, { color: colors.primary, fontWeight: '800' }]}>
                  {displayCurrency}{displayPrice} ({booking.paymentStatus === 'paid' ? 'Paid' : 'Confirmed'})
                </Text>
              </View>
            )}

            {booking.specialRequest ? (
              <View style={styles.detailItemFull}>
                <Text style={[styles.detailLabel, { color: colors.mutedText }]}>SPECIAL REQUESTS</Text>
                <Text style={[styles.detailValue, { color: colors.heading }]}>
                  {booking.specialRequest}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ─── 1. Departure & Meeting Dispatch Voucher ─── */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.infoCardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, flex: 1 }}>
              <View style={[styles.infoIconBox, { backgroundColor: `${colors.primary}18` }]}>
                <Ionicons name="location" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoCardTitle, { color: colors.heading, fontFamily: headingFontFamily }]}>
                  Departure & Meeting Dispatch
                </Text>
                <Text style={[styles.infoCardSub, { color: colors.mutedText }]}>
                  Gate arrival and chauffeur meet-and-greet
                </Text>
              </View>
            </View>

            <View style={[styles.liveGatePill, { backgroundColor: '#10b98118' }]}>
              <View style={[styles.liveGateDot, { backgroundColor: '#10b981' }]} />
              <Text style={[styles.liveGateText, { color: '#10b981' }]}>ON SCHEDULE</Text>
            </View>
          </View>

          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />

          <View style={styles.dispatchGrid}>
            <View style={styles.dispatchCell}>
              <Text style={[styles.dispatchLabel, { color: colors.mutedText }]}>MEETING POINT / GATE</Text>
              <Text style={[styles.dispatchValue, { color: colors.heading }]}>{meetingPointLocation}</Text>
              <Text style={[styles.dispatchHint, { color: colors.mutedText }]}>
                Hotel lobby concierge desk or specified terminal gate
              </Text>
            </View>

            <View style={styles.dispatchCell}>
              <Text style={[styles.dispatchLabel, { color: colors.mutedText }]}>SCHEDULED PICKUP</Text>
              <Text style={[styles.dispatchValue, { color: colors.primary }]}>{scheduledPickupTime}</Text>
              <Text style={[styles.dispatchHint, { color: colors.mutedText }]}>
                Please be present 15 minutes before departure
              </Text>
            </View>
          </View>

          <View style={[styles.dispatchNoticeBox, { backgroundColor: `${colors.primary}08`, borderColor: `${colors.primary}20` }]}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primary} style={{ marginTop: 1 }} />
            <Text style={[styles.dispatchNoticeText, { color: colors.heading }]}>
              Show this E-Ticket QR voucher to the chauffeur or lead guide on boarding. Vehicle plate and driver contact are sent via SMS 2 hours prior to departure.
            </Text>
          </View>

          {/* Quick Action: Open in Maps & Call Concierge */}
          <View style={styles.dispatchActionsRow}>
            <TouchableOpacity testID="btn-map-outline" accessibilityLabel="map outline"
              style={[styles.dispatchActionBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
              onPress={handleOpenMaps}
              activeOpacity={0.8}
            >
              <Ionicons name="map-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.dispatchActionBtnText, { color: colors.heading }]}>Open in Maps</Text>
            </TouchableOpacity>

            <TouchableOpacity testID="btn-call-outline" accessibilityLabel="call outline"
              style={[styles.dispatchActionBtn, { borderColor: `${colors.primary}30`, backgroundColor: `${colors.primary}10` }]}
              onPress={() => openConcierge({ tourName: displayTitle })}
              activeOpacity={0.8}
            >
              <Ionicons name="call-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.dispatchActionBtnText, { color: colors.primary, fontWeight: '700' }]}>Contact Dispatch</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── 2. Expedition Inclusions & Highlights ─── */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.infoCardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, flex: 1 }}>
              <View style={[styles.infoIconBox, { backgroundColor: '#f59e0b18' }]}>
                <Ionicons name="checkmark-done-circle" size={18} color="#f59e0b" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoCardTitle, { color: colors.heading, fontFamily: headingFontFamily }]}>
                  Expedition Inclusions & Highlights
                </Text>
                <Text style={[styles.infoCardSub, { color: colors.mutedText }]}>
                  All services covered by your reservation pass
                </Text>
              </View>
            </View>

            <View style={[styles.durationBadge, { backgroundColor: `${colors.primary}14` }]}>
              <Ionicons name="time-outline" size={12} color={colors.primary} />
              <Text style={[styles.durationBadgeText, { color: colors.primary }]}>{tourObj.duration}</Text>
            </View>
          </View>

          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />

          {/* Inclusions List */}
          <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>WHAT IS INCLUDED</Text>
          <View style={styles.inclusionsList}>
            {ticketInclusions.map((item, idx) => (
              <View key={`inc_${idx}`} style={styles.inclusionItemRow}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" style={{ marginRight: 8, marginTop: 1 }} />
                <Text style={[styles.inclusionItemText, { color: colors.heading }]}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Highlights */}
          {tourObj.highlights && tourObj.highlights.length > 0 && (
            <>
              <Text style={[styles.sectionSubtitle, { color: colors.mutedText, marginTop: SPACING.md }]}>
                FEATURED HIGHLIGHTS
              </Text>
              <View style={styles.highlightsContainer}>
                {tourObj.highlights.map((hl, idx) => (
                  <View key={`hl_${idx}`} style={[styles.highlightPill, { backgroundColor: `${colors.primary}0a`, borderColor: colors.border }]}>
                    <Ionicons name="star" size={12} color="#f59e0b" style={{ marginRight: 5 }} />
                    <Text style={[styles.highlightPillText, { color: colors.heading }]}>{hl}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {/* ─── 3. Destination Weather & Interactive Packing Checklist ─── */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.infoCardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, flex: 1 }}>
              <View style={[styles.infoIconBox, { backgroundColor: '#0284c718' }]}>
                <Ionicons name="partly-sunny" size={18} color="#0284c7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoCardTitle, { color: colors.heading, fontFamily: headingFontFamily }]}>
                  Destination Weather & Packing
                </Text>
                <Text style={[styles.infoCardSub, { color: colors.mutedText }]}>
                  {destWeather?.destinationName || tourObj.destination || 'Expedition Destination'} Forecast
                </Text>
              </View>
            </View>

            <View style={[styles.weatherPillLarge, { backgroundColor: '#0284c714' }]}>
              <Text style={[styles.weatherPillLargeText, { color: '#0284c7' }]}>
                {destWeather ? `${destWeather.tempC}°C` : '28°C'}
              </Text>
            </View>
          </View>

          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />

          {/* Weather Details Grid */}
          <View style={[styles.weatherBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.weatherMetricsRow}>
              <View style={styles.weatherMetric}>
                <Text style={[styles.weatherMetricLabel, { color: colors.mutedText }]}>CONDITION</Text>
                <Text style={[styles.weatherMetricValue, { color: colors.heading }]}>
                  {destWeather?.condition || 'Sunny & Clear'}
                </Text>
              </View>
              <View style={styles.weatherMetric}>
                <Text style={[styles.weatherMetricLabel, { color: colors.mutedText }]}>HUMIDITY</Text>
                <Text style={[styles.weatherMetricValue, { color: colors.heading }]}>
                  {destWeather?.humidityPercent ? `${destWeather.humidityPercent}%` : '58%'}
                </Text>
              </View>
              <View style={styles.weatherMetric}>
                <Text style={[styles.weatherMetricLabel, { color: colors.mutedText }]}>UV INDEX</Text>
                <Text style={[styles.weatherMetricValue, { color: colors.heading }]}>
                  {destWeather?.uvIndex ? `${destWeather.uvIndex} (${destWeather.uvLevel || 'Moderate'})` : '5 (Moderate)'}
                </Text>
              </View>
            </View>
            {destWeather?.advisoryMessage ? (
              <Text style={[styles.weatherAdvisory, { color: colors.mutedText }]}>
                💡 Advisory: {destWeather.advisoryMessage}
              </Text>
            ) : null}
          </View>

          {/* Interactive Packing Checklist Header & Controls */}
          <View style={styles.packingHeaderRow}>
            <View>
              <Text style={[styles.sectionSubtitle, { color: colors.mutedText, marginBottom: 2 }]}>
                INTERACTIVE PACKING CHECKLIST
              </Text>
              <Text style={[styles.packingProgressText, { color: colors.heading }]}>
                {checkedPacking.length} of {ticketPackingList.length} packed ({Math.round((checkedPacking.length / ticketPackingList.length) * 100)}%)
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity testID="btn-pack-all" accessibilityLabel="Pack All"
                onPress={handlePackAll}
                style={[styles.packingControlBtn, { borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.packingControlBtnText, { color: colors.primary }]}>Pack All</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="btn-reset" accessibilityLabel="Reset"
                onPress={handleResetPacking}
                style={[styles.packingControlBtn, { borderColor: colors.border }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.packingControlBtnText, { color: colors.mutedText }]}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressBarTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: checkedPacking.length === ticketPackingList.length ? '#10b981' : colors.primary,
                  width: `${Math.round((checkedPacking.length / ticketPackingList.length) * 100)}%`,
                },
              ]}
            />
          </View>

          {/* Checklist Items */}
          <View style={styles.packingItemsList}>
            {ticketPackingList.map((item) => {
              const isChecked = checkedPacking.includes(item.id);
              return (
                <TouchableOpacity testID="btn-id-1248" accessibilityLabel="id action"
                  key={item.id}
                  style={[
                    styles.packingItemRow,
                    {
                      backgroundColor: isChecked ? `${colors.primary}0a` : colors.background,
                      borderColor: isChecked ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleTogglePacking(item.id)}
                  activeOpacity={0.75}
                >
                  <View style={styles.packingItemLeft}>
                    <Ionicons
                      name={isChecked ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={isChecked ? colors.primary : colors.mutedText}
                    />
                    <View style={{ flex: 1, marginLeft: SPACING.xs }}>
                      <Text
                        style={[
                          styles.packingItemTitle,
                          {
                            color: colors.heading,
                            textDecorationLine: isChecked ? 'line-through' : 'none',
                            opacity: isChecked ? 0.75 : 1,
                          },
                        ]}
                      >
                        {item.title} {item.mandatory && <Text style={{ color: '#ef4444' }}>*</Text>}
                      </Text>
                      <Text style={[styles.packingItemDesc, { color: colors.mutedText }]} numberOfLines={1}>
                        {item.desc}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ─── Actions Section ─── */}
        <View style={styles.actionsBox}>
          {/* Share E-Ticket Pass Action */}
          <TouchableOpacity testID="btn-share"
            style={[styles.shareTicketBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleShareVoucher}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Share E-Ticket voucher pass"
          >
            <Ionicons name="share-social-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.shareTicketBtnText, { color: colors.primary }]}>Share E-Ticket Pass</Text>
          </TouchableOpacity>

          {/* 24/7 Specialist Concierge Assistance */}
          <TouchableOpacity testID="btn-headset-outline"
            style={[styles.shareTicketBtn, { backgroundColor: `${colors.primary}12`, borderColor: colors.primary }]}
            onPress={() => {
              try {
                Haptics.selectionAsync();
              } catch {}
              openConcierge({ tourName: displayTitle });
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Chat with Concierge ${specialist.specialistName}`}
          >
            <Ionicons name="headset-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.shareTicketBtnText, { color: colors.primary, fontWeight: '700' }]}>
              Chat with Concierge ({specialist.specialistName})
            </Text>
          </TouchableOpacity>

          {/* ─── Expandable Expedition Features ("See More") ─── */}
          <TouchableOpacity testID="btn-sparkles"
            style={[
              styles.seeMoreToggleBtn,
              {
                backgroundColor: showMoreFeatures ? `${colors.primary}0a` : colors.surface,
                borderColor: showMoreFeatures ? colors.primary : colors.border,
              },
            ]}
            onPress={() => {
              try {
                Haptics.selectionAsync();
              } catch {}
              setShowMoreFeatures((prev) => !prev);
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={showMoreFeatures ? 'Hide additional features' : 'See more companion features'}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
              <View style={[styles.seeMoreIconBadge, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="sparkles" size={17} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.seeMoreTitle, { color: colors.heading }]}>
                    {showMoreFeatures ? 'Expedition Tools & Services' : 'See More Features'}
                  </Text>
                  <View style={[styles.seeMoreCountPill, { backgroundColor: `${colors.primary}18` }]}>
                    <Text style={[styles.seeMoreCountText, { color: colors.primary }]}>7 Tools</Text>
                  </View>
                </View>
                <Text style={[styles.seeMoreSub, { color: colors.mutedText }]} numberOfLines={1}>
                  {showMoreFeatures ? 'Tap to collapse tools' : 'Flight, Cockpit, Scrapbook, Vault, Budget & more'}
                </Text>
              </View>
            </View>
            <View style={[styles.seeMoreChevronBox, { backgroundColor: `${colors.primary}10` }]}>
              <Ionicons
                name={showMoreFeatures ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.primary}
              />
            </View>
          </TouchableOpacity>

          {/* Expanded Features List */}
          {showMoreFeatures && (
            <View style={styles.moreFeaturesList}>
              {/* Day-Of Expedition Cockpit */}
              <TouchableOpacity testID="btn-compass"
                style={[styles.shareTicketBtn, { backgroundColor: '#EA580C14', borderColor: '#EA580C' }]}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch {}
                  router.push('/day-cockpit');
                }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Open Day-Of Expedition Cockpit"
              >
                <Ionicons name="compass" size={18} color="#EA580C" style={{ marginRight: 8 }} />
                <Text style={[styles.shareTicketBtnText, { color: '#EA580C', fontWeight: '800' }]}>
                  Day-Of Live Expedition Cockpit
                </Text>
              </TouchableOpacity>

              {/* Flight & Airport Chauffeur Meet & Greet */}
              <TouchableOpacity testID="btn-airplane"
                style={[styles.shareTicketBtn, { backgroundColor: '#0284C714', borderColor: '#0284C7' }]}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch {}
                  router.push('/airport-transfer');
                }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Open Flight and Airport Chauffeur Hub"
              >
                <Ionicons name="airplane" size={18} color="#0284C7" style={{ marginRight: 8 }} />
                <Text style={[styles.shareTicketBtnText, { color: '#0284C7', fontWeight: '800' }]}>
                  Flight Tracker & Airport Chauffeur
                </Text>
              </TouchableOpacity>

              {/* Group Expedition Planning & Polls */}
              <TouchableOpacity testID="btn-people"
                style={[styles.shareTicketBtn, { backgroundColor: '#8B5CF614', borderColor: '#8B5CF6' }]}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch {}
                  router.push('/group-planning');
                }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Open Group Planning and Party Hub"
              >
                <Ionicons name="people" size={18} color="#8B5CF6" style={{ marginRight: 8 }} />
                <Text style={[styles.shareTicketBtnText, { color: '#8B5CF6', fontWeight: '800' }]}>
                  Expedition Party & Group Planning
                </Text>
              </TouchableOpacity>

              {/* Travel Scrapbook & Memory Journal */}
              <TouchableOpacity testID="btn-book"
                style={[styles.shareTicketBtn, { backgroundColor: '#EC489914', borderColor: '#EC4899' }]}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch {}
                  router.push('/travel-journal');
                }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Open Travel Scrapbook and Memory Journal"
              >
                <Ionicons name="book" size={18} color="#EC4899" style={{ marginRight: 8 }} />
                <Text style={[styles.shareTicketBtnText, { color: '#EC4899', fontWeight: '800' }]}>
                  Travel Scrapbook & Memory Reel
                </Text>
              </TouchableOpacity>

              {/* Travel Vault & Emergency Safety SOS */}
              <TouchableOpacity testID="btn-shield-checkmark"
                style={[styles.shareTicketBtn, { backgroundColor: '#DC262612', borderColor: '#DC2626' }]}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch {}
                  router.push('/travel-vault');
                }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Open Travel Vault and Safety SOS"
              >
                <Ionicons name="shield-checkmark" size={18} color="#DC2626" style={{ marginRight: 8 }} />
                <Text style={[styles.shareTicketBtnText, { color: '#DC2626', fontWeight: '700' }]}>
                  Travel Vault & Safety SOS
                </Text>
              </TouchableOpacity>

              {/* Trip Budget & Group Expense Tracker */}
              <TouchableOpacity testID="btn-wallet-outline"
                style={[styles.shareTicketBtn, { backgroundColor: '#10B98112', borderColor: '#10B981' }]}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch {}
                  router.push('/trip-budget');
                }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Open Trip Budget and Expense Splitter"
              >
                <Ionicons name="wallet-outline" size={18} color="#10B981" style={{ marginRight: 8 }} />
                <Text style={[styles.shareTicketBtnText, { color: '#10B981', fontWeight: '700' }]}>
                  Trip Budget & Expense Splitter
                </Text>
              </TouchableOpacity>

              {/* Expedition Passport & Collectible Stamps */}
              <TouchableOpacity testID="btn-ribbon-outline"
                style={[styles.shareTicketBtn, { backgroundColor: '#F59E0B12', borderColor: '#F59E0B' }]}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch {}
                  router.push('/passport');
                }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Open Expedition Passport and Stamps"
              >
                <Ionicons name="ribbon-outline" size={18} color="#F59E0B" style={{ marginRight: 8 }} />
                <Text style={[styles.shareTicketBtnText, { color: '#F59E0B', fontWeight: '700' }]}>
                  Expedition Passport & Stamps
                </Text>
              </TouchableOpacity>

              {/* Show Less Toggle */}
              <TouchableOpacity testID="btn-navigate" accessibilityLabel="Navigate"
                style={[styles.showLessBtn, { borderColor: colors.border }]}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch {}
                  setShowMoreFeatures(false);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-up" size={15} color={colors.mutedText} style={{ marginRight: 4 }} />
                <Text style={[styles.showLessText, { color: colors.mutedText }]}>Show Less</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Cancellation Action or Status */}
          {hasCancelRequest ? (
            <View style={[styles.cancelBtn, { borderColor: '#fde68a', backgroundColor: '#fef3c7' }]}>
              <Ionicons name="time" size={16} color="#b45309" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#b45309' }}>
                Cancellation Request Pending
              </Text>
            </View>
          ) : !isCancelled && !isRejected ? (
            <TouchableOpacity testID="btn-close" accessibilityLabel="Close"
              style={[styles.cancelBtn, { borderColor: '#ef4444' }]}
              onPress={() => setCancelModalVisible(true)}
              disabled={submittingCancel}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle-outline" size={18} color="#ef4444" style={{ marginRight: 6 }} />
              <Text style={styles.cancelBtnText}>Request Cancellation</Text>
            </TouchableOpacity>
          ) : null}

          {/* Return to Bookings Button */}
          <TouchableOpacity testID="btn-return-to-my-bookings" accessibilityLabel="Return to My Bookings"
            style={[styles.returnBtn, { backgroundColor: colors.primary }]}
            onPress={handleReturnToBookings}
            activeOpacity={0.8}
          >
            <Text style={styles.returnBtnText}>Return to My Bookings</Text>
          </TouchableOpacity>
        </View>

        {/* ─── State Transition Audit Trail (Status History) ─── */}
        {booking.statusHistory && booking.statusHistory.length > 0 && (
          <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.infoCardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, flex: 1 }}>
                <View style={[styles.infoIconBox, { backgroundColor: `${colors.primary}18` }]}>
                  <Ionicons name="git-commit-outline" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.infoCardTitle, { color: colors.heading, fontFamily: headingFontFamily }]}>
                    Status Transition Audit Trail
                  </Text>
                  <Text style={[styles.infoCardSub, { color: colors.mutedText }]}>
                    Chronological lifecycle event log
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />

            <View style={{ padding: SPACING.md }}>
              {booking.statusHistory.map((item, index) => {
                const st = (item.status || '').toLowerCase();
                const pillColor =
                  st === 'confirmed'
                    ? '#059669'
                    : st === 'pending'
                    ? '#d97706'
                    : st === 'rejected'
                    ? '#be123c'
                    : st === 'cancelled'
                    ? '#b91c1c'
                    : '#2563eb';
                const pillBg =
                  st === 'confirmed'
                    ? '#d1fae5'
                    : st === 'pending'
                    ? '#fef3c7'
                    : st === 'rejected'
                    ? '#ffe4e6'
                    : st === 'cancelled'
                    ? '#fee2e2'
                    : '#dbeafe';

                return (
                  <View
                    key={index}
                    style={{
                      flexDirection: 'row',
                      gap: 12,
                      marginBottom: index < (booking.statusHistory?.length ?? 0) - 1 ? 16 : 0,
                    }}
                  >
                    <View style={{ alignItems: 'center', width: 20 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: pillColor }} />
                      {index < (booking.statusHistory?.length ?? 0) - 1 && (
                        <View style={{ width: 2, flex: 1, backgroundColor: `${pillColor}30`, marginVertical: 3 }} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, backgroundColor: pillBg }}>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: pillColor, textTransform: 'uppercase' }}>
                            {item.status}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 10, color: colors.mutedText }}>
                          {item.changedAt ? new Date(item.changedAt).toLocaleString() : ''}
                        </Text>
                      </View>
                      {item.note && (
                        <Text style={{ fontSize: 12, color: colors.heading, marginTop: 4 }}>
                          {item.note}
                        </Text>
                      )}
                      {item.changedBy && (
                        <Text style={{ fontSize: 10, color: colors.mutedText, marginTop: 1 }}>
                          by {item.changedBy}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ─── Day-by-Day Expedition Itinerary & Packing Checklist ─── */}
        <View style={styles.itinerarySectionBox}>
          <Text style={[styles.itinerarySectionTitle, { color: colors.heading, fontFamily: headingFontFamily }]}>
            Trip Itinerary & Packing Checklist
          </Text>
          <TourItinerarySection tour={tourObj} showPackingList={true} />
        </View>
      </ScrollView>

      {/* ─── Request Cancellation Modal ─── */}
      <Modal
        visible={cancelModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="close-circle" size={22} color="#ef4444" />
                <Text style={[styles.modalTitle, { color: colors.heading, fontFamily: headingFontFamily }]}>
                  Request Cancellation
                </Text>
              </View>
              <TouchableOpacity testID="btn-close" accessibilityLabel="Close" onPress={() => setCancelModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.mutedText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Policy Disclaimer */}
              <View style={[styles.policyBox, { backgroundColor: `${colors.primary}08`, borderColor: `${colors.primary}20` }]}>
                <Text style={[styles.policyTitle, { color: colors.primary }]}>CANCELLATION POLICY</Text>
                <Text style={[styles.policyLine, { color: colors.heading }]}>
                  ✓ Free cancellation within 24 hours of booking
                </Text>
                <Text style={[styles.policyLine, { color: colors.heading }]}>
                  ✓ 100% refund up to 48 hours before departure
                </Text>
                <Text style={[styles.policyLine, { color: colors.heading }]}>
                  ✓ 20% provider fee for cancellations within 24h of departure
                </Text>
              </View>

              <Text style={[styles.inputLabel, { color: colors.heading }]}>
                Select Reason for Cancellation
              </Text>
              {[
                'Change in travel schedule / dates',
                'Found alternative tour arrangements',
                'Medical or personal emergency',
                'Flight delayed or airline cancelled',
                'Other reason',
              ].map((reason) => {
                const isChosen = selectedReason === reason;
                return (
                  <TouchableOpacity testID="btn-id-1698" accessibilityLabel="id action"
                    key={reason}
                    style={[
                      styles.reasonOption,
                      {
                        backgroundColor: isChosen ? `${colors.primary}12` : colors.background,
                        borderColor: isChosen ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedReason(reason)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isChosen ? 'radio-button-on' : 'radio-button-off'}
                      size={16}
                      color={isChosen ? colors.primary : colors.mutedText}
                    />
                    <Text
                      style={[
                        styles.reasonText,
                        {
                          color: isChosen ? colors.primary : colors.text,
                          fontWeight: isChosen ? '700' : '400',
                        },
                      ]}
                    >
                      {reason}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <Text style={[styles.inputLabel, { color: colors.heading, marginTop: 12 }]}>
                Additional Details (Optional)
              </Text>
              <TextInput
                style={[
                  styles.reasonInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Explain any details for concierge review..."
                placeholderTextColor={colors.mutedText}
                value={customReason}
                onChangeText={setCustomReason}
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalActionRow}>
                <TouchableOpacity testID="btn-keep-booking" accessibilityLabel="Keep Booking"
                  style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                  onPress={() => setCancelModalVisible(false)}
                  disabled={submittingCancel}
                >
                  <Text style={[styles.modalCancelBtnText, { color: colors.text }]}>Keep Booking</Text>
                </TouchableOpacity>

                <TouchableOpacity testID="btn-submit-request" accessibilityLabel="Submit Request"
                  style={[styles.modalSubmitBtn, { backgroundColor: '#ef4444' }]}
                  onPress={handleSubmitCancellationRequest}
                  disabled={submittingCancel}
                  activeOpacity={0.8}
                >
                  {submittingCancel ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.modalSubmitBtnText}>Submit Request</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: 120,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZE.sm,
  },
  errorTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  errorDesc: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  backBtn: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.full,
  },
  backBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: FONT_SIZE.sm,
  },
  ticketContainer: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOW.md,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: SPACING.lg,
  },
  ticketHeaderLeft: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  passTag: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  ticketTourTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
    lineHeight: 24,
    marginBottom: 4,
  },
  bookingRef: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  snapshotBadge: {
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  perforationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    position: 'relative',
  },
  notchLeft: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: -13,
  },
  dashedLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    marginHorizontal: SPACING.xs,
  },
  notchRight: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: -13,
  },
  qrSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
  },
  qrBox: {
    width: 180,
    height: 180,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    ...SHADOW.sm,
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  qrPrompt: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  detailItem: {
    width: '46%',
  },
  detailItemFull: {
    width: '100%',
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '600',
    lineHeight: 18,
  },
  actionsBox: {
    marginTop: SPACING.lg,
    gap: SPACING.sm + 2,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  cancelBtnText: {
    color: '#ef4444',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  headerShareBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareTicketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    minHeight: 46,
  },
  shareTicketBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  seeMoreToggleBtn: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  seeMoreIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeMoreTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  seeMoreCountPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  seeMoreCountText: {
    fontSize: 10,
    fontWeight: '800',
  },
  seeMoreSub: {
    fontSize: 11,
    marginTop: 1,
  },
  seeMoreChevronBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreFeaturesList: {
    gap: SPACING.sm + 2,
    marginTop: 2,
  },
  showLessBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginTop: 2,
  },
  showLessText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  returnBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  returnBtnText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  itinerarySectionBox: {
    marginTop: SPACING.lg,
  },
  itinerarySectionTitle: {
    fontSize: FONT_SIZE.md + 2,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  infoCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    ...SHADOW.sm,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.xs,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCardTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  infoCardSub: {
    fontSize: FONT_SIZE.xs,
    marginTop: 1,
  },
  liveGatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  liveGateDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveGateText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  dividerLine: {
    height: StyleSheet.hairlineWidth,
    marginVertical: SPACING.md,
  },
  dispatchGrid: {
    gap: SPACING.sm + 2,
  },
  dispatchCell: {
    gap: 2,
  },
  dispatchLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  dispatchValue: {
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: '700',
    lineHeight: 20,
  },
  dispatchHint: {
    fontSize: 11,
    lineHeight: 15,
  },
  dispatchNoticeBox: {
    flexDirection: 'row',
    gap: 8,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginTop: SPACING.md,
  },
  dispatchNoticeText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    fontWeight: '500',
  },
  dispatchActionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  dispatchActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  dispatchActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  durationBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: SPACING.xs,
  },
  inclusionsList: {
    gap: 8,
  },
  inclusionItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  inclusionItemText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '500',
  },
  highlightsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  highlightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  highlightPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  weatherPillLarge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  weatherPillLargeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  weatherBox: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
  },
  weatherMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weatherMetric: {
    alignItems: 'center',
    flex: 1,
  },
  weatherMetricLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  weatherMetricValue: {
    fontSize: 12.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  weatherAdvisory: {
    fontSize: 11,
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.06)',
    fontStyle: 'italic',
  },
  packingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  packingProgressText: {
    fontSize: 12,
    fontWeight: '700',
  },
  packingControlBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  packingControlBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
    marginVertical: SPACING.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  packingItemsList: {
    gap: 6,
  },
  packingItemRow: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.sm + 2,
  },
  packingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  packingItemTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  packingItemDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  stepperCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOW.sm,
  },
  stepperHeaderTag: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperStep: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepTitle: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  stepSub: {
    fontSize: 9.5,
    marginTop: 1,
    textAlign: 'center',
  },
  stepLine: {
    height: 2,
    flex: 0.6,
    marginTop: -16,
    borderRadius: 1,
  },
  lifecycleBanner: {
    flexDirection: 'row',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  lockedQrBox: {
    width: '90%',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: FONT_SIZE.md + 1,
    fontWeight: '800',
  },
  policyBox: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.sm + 2,
    marginBottom: SPACING.md,
  },
  policyTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  policyLine: {
    fontSize: 11,
    lineHeight: 16,
    marginVertical: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  reasonText: {
    fontSize: 12,
  },
  reasonInput: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 10,
    fontSize: 12,
    textAlignVertical: 'top',
    minHeight: 70,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalSubmitBtn: {
    flex: 1,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSubmitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});

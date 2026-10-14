/**
 * app/booking/[id].tsx
 *
 * Full Booking Details and E-Ticket Voucher display screen.
 * Displays luxury perforated boarding pass voucher, live QR verification code,
 * passenger and tour details, cancellation flow with confirmation dialog,
 * and concierge support links.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { useSiteConfig } from '@/store/SiteConfigContext';
import { useBooking } from '@/context/BookingContext';
import { useTours } from '@/hooks/useTours';
import { fetchBooking } from '@/services/api';
import type { Booking } from '@/types';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';
import { PLACEHOLDER_IMAGE } from '@/lib/imageUtils';
import AppHeader from '@/components/common/AppHeader';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const config = useSiteConfig();
  const { getBooking, cancelBooking } = useBooking();
  const { tours } = useTours();
  const headingFontFamily = getHeadingFontFamily(config);

  const [booking, setBooking] = useState<Booking | null>(() => (id ? getBooking(id) || null : null));
  const [loading, setLoading] = useState(!booking);
  const [cancelling, setCancelling] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

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

  const handleCancelPress = () => {
    if (!booking) return;

    Alert.alert(
      'Cancel Reservation',
      `Are you sure you want to cancel your reservation for "${booking.tourName}"? This action cannot be undone.`,
      [
        { text: 'Keep Reservation', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              const updated = await cancelBooking(booking.id);
              setBooking(updated);
              Alert.alert('Booking Cancelled', 'Your reservation has been cancelled.');
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Could not cancel booking.';
              Alert.alert('Cancellation Error', msg);
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

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
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.replace('/(tabs)/bookings')}
          >
            <Text style={styles.backBtnText}>View My Bookings</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isCancelled = booking.status === 'cancelled';
  const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    `PASS:${booking.id}|TOUR:${booking.tourId}|TRAVELERS:${booking.travelers}`
  )}`;

  const matchedTour = tours.find((t) => String(t.id) === String(booking.tourId));

  const displayTitle =
    booking.tourName &&
    booking.tourName !== 'Curated Expedition' &&
    booking.tourName !== 'Unknown Tour'
      ? booking.tourName
      : matchedTour?.name || 'Guided Tour Expedition';

  const tourRate = matchedTour?.price || 0;
  const displayPrice =
    booking.totalPrice > 0
      ? booking.totalPrice
      : tourRate > 0
      ? tourRate * Math.max(1, booking.travelers)
      : booking.totalPrice;

  const displayCurrency =
    booking.currency && booking.currency !== '$'
      ? booking.currency
      : (config as any)?.tourCard?.currency || booking.currency || '$';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader showBackButton={true} title="E-Ticket Voucher" showLogo={true} logoSize="sm" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Luxury Boarding Pass Ticket ─── */}
        <View
          style={[
            styles.ticketContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Ticket Header */}
          <View style={styles.ticketHeader}>
            <View style={styles.ticketHeaderLeft}>
              <Text style={[styles.passTag, { color: colors.primary }]}>OFFICIAL E-TICKET PASS</Text>
              <Text style={[styles.ticketTourTitle, { color: colors.heading, fontFamily: headingFontFamily }]}>
                {displayTitle}
              </Text>
              <Text style={[styles.bookingRef, { color: colors.mutedText }]}>
                REFERENCE: #{booking.id}
              </Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isCancelled
                    ? '#ef444418'
                    : booking.status === 'completed'
                    ? '#3b82f618'
                    : `${colors.primary}18`,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  {
                    color: isCancelled
                      ? '#ef4444'
                      : booking.status === 'completed'
                      ? '#3b82f6'
                      : colors.primary,
                  },
                ]}
              >
                {booking.status.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Perforated Divider Line with Cutout Notches */}
          <View style={styles.perforationRow}>
            <View style={[styles.notchLeft, { backgroundColor: colors.background, borderColor: colors.border }]} />
            <View style={[styles.dashedLine, { borderColor: colors.border }]} />
            <View style={[styles.notchRight, { backgroundColor: colors.background, borderColor: colors.border }]} />
          </View>

          {/* Ticket Body: QR Verification */}
          <View style={styles.qrSection}>
            <View style={styles.qrBox}>
              <Image
                source={{ uri: qrDataUrl }}
                style={styles.qrImage}
                contentFit="contain"
                transition={300}
              />
            </View>
            <Text style={[styles.qrPrompt, { color: colors.mutedText }]}>
              {isCancelled
                ? 'This reservation voucher has been cancelled.'
                : 'Scan at tour check-in or present to tour concierge'}
            </Text>
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
              <Text style={[styles.detailValue, { color: colors.heading }]}>{booking.date}</Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.mutedText }]}>TRAVELERS</Text>
              <Text style={[styles.detailValue, { color: colors.heading }]}>
                {booking.travelers} {booking.travelers === 1 ? 'Guest' : 'Guests'}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.mutedText }]}>TOTAL AMOUNT</Text>
              <Text style={[styles.detailValue, { color: colors.primary, fontWeight: '800' }]}>
                {displayCurrency}{displayPrice} (Paid)
              </Text>
            </View>

            <View style={styles.detailItemFull}>
              <Text style={[styles.detailLabel, { color: colors.mutedText }]}>CONTACT INFO</Text>
              <Text style={[styles.detailValue, { color: colors.heading }]}>
                {booking.email} {booking.phone ? `· ${booking.phone}` : ''}
              </Text>
            </View>

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

        {/* ─── Actions Section ─── */}
        <View style={styles.actionsBox}>
          {/* Cancel Reservation Action */}
          {!isCancelled && (
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: '#ef4444' }]}
              onPress={handleCancelPress}
              disabled={cancelling}
              activeOpacity={0.8}
            >
              {cancelling ? (
                <ActivityIndicator color="#ef4444" size="small" />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={18} color="#ef4444" style={{ marginRight: 6 }} />
                  <Text style={styles.cancelBtnText}>Cancel Reservation</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Return to Bookings Button */}
          <TouchableOpacity
            style={[styles.returnBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(tabs)/bookings')}
            activeOpacity={0.8}
          >
            <Text style={styles.returnBtnText}>Return to My Bookings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingBottom: SPACING.xxl,
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
});

/**
 * app/(tabs)/bookings.tsx
 *
 * User bookings and reservations tab screen.
 * Displays segmented filter tabs (All, Upcoming, Completed, Cancelled)
 * and trips with reservation cards, pull-to-refresh, skeleton loading,
 * and error retry states.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { useSiteConfig } from '@/store/SiteConfigContext';
import { useBooking } from '@/context/BookingContext';
import { useTours } from '@/hooks/useTours';
import type { Booking } from '@/types';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';
import { PLACEHOLDER_IMAGE } from '@/lib/imageUtils';

type BookingSegment = 'all' | 'upcoming' | 'completed' | 'cancelled';

export default function BookingsTabScreen() {
  const router = useRouter();
  const colors = useColors();
  const config = useSiteConfig();
  const { bookings, isLoading, isError, error, refreshBookings } = useBooking();
  const { tours } = useTours();
  const headingFontFamily = getHeadingFontFamily(config);

  const [activeSegment, setActiveSegment] = useState<BookingSegment>('upcoming');
  const [refreshing, setRefreshing] = useState(false);
  const [hasAutoSwitched, setHasAutoSwitched] = useState(false);

  // Automatically refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshBookings();
    }, [refreshBookings])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshBookings();
    } finally {
      setRefreshing(false);
    }
  }, [refreshBookings]);

  // Counts by segment
  const upcomingCount = useMemo(() => {
    return bookings.filter((b) => {
      const st = (b.status || '').toLowerCase();
      return st === 'upcoming' || st === 'pending' || st === 'confirmed';
    }).length;
  }, [bookings]);

  const nonUpcomingCount = bookings.length - upcomingCount;

  // Auto-default segment to 'all' if upcoming is empty but other bookings exist
  useEffect(() => {
    if (!isLoading && bookings.length > 0 && upcomingCount === 0 && !hasAutoSwitched && activeSegment === 'upcoming') {
      setActiveSegment('all');
      setHasAutoSwitched(true);
    }
  }, [isLoading, bookings.length, upcomingCount, hasAutoSwitched, activeSegment]);

  // Segment filtering with tolerant status mapping
  const filteredBookings = useMemo(() => {
    const list = bookings.filter((b) => {
      const st = (b.status || '').toLowerCase();
      if (activeSegment === 'all') return true;
      if (activeSegment === 'upcoming') {
        return st === 'upcoming' || st === 'pending' || st === 'confirmed';
      }
      if (activeSegment === 'completed') return st === 'completed';
      if (activeSegment === 'cancelled') return st === 'cancelled';
      return false;
    });

    // Sort upcoming by travel date ascending; others by creation/travel date descending
    return list.sort((a, b) => {
      const dateA = new Date(a.date || a.startDate || a.createdAt).getTime();
      const dateB = new Date(b.date || b.startDate || b.createdAt).getTime();
      if (activeSegment === 'upcoming') {
        return dateA - dateB;
      }
      return dateB - dateA;
    });
  }, [bookings, activeSegment]);

  const getStatusColor = (status: string) => {
    const st = (status || '').toLowerCase();
    if (st === 'completed') return '#3b82f6';
    if (st === 'cancelled') return '#ef4444';
    return colors.primary; // upcoming / pending / confirmed
  };

  const getStatusLabel = (status: string) => {
    const st = (status || '').toLowerCase();
    if (st === 'pending') return 'Pending';
    if (st === 'confirmed') return 'Confirmed';
    if (st === 'completed') return 'Completed';
    if (st === 'cancelled') return 'Cancelled';
    return 'Upcoming';
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ─── Segmented Controller Bar ─── */}
      <View
        style={[
          styles.segmentBar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={[styles.segmentContainer, { backgroundColor: colors.background }]}>
          {(['all', 'upcoming', 'completed', 'cancelled'] as BookingSegment[]).map((seg) => {
            const isSelected = activeSegment === seg;
            return (
              <TouchableOpacity
                key={seg}
                style={[
                  styles.segmentButton,
                  isSelected && {
                    backgroundColor: colors.surface,
                    ...SHADOW.sm,
                  },
                ]}
                onPress={() => setActiveSegment(seg)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.segmentText,
                    {
                      color: isSelected ? colors.primary : colors.mutedText,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {seg === 'all' ? 'All' : seg.charAt(0).toUpperCase() + seg.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ─── Scrollable Content ─── */}
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
        {/* Loading Skeleton State */}
        {isLoading && !refreshing && bookings.length === 0 ? (
          <View style={styles.loadingContainer}>
            {[1, 2].map((k) => (
              <View
                key={k}
                style={[
                  styles.skeletonCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={[styles.skeletonImage, { backgroundColor: `${colors.border}40` }]} />
                <View style={styles.skeletonBody}>
                  <View style={[styles.skeletonLineShort, { backgroundColor: `${colors.border}40` }]} />
                  <View style={[styles.skeletonLineLong, { backgroundColor: `${colors.border}40` }]} />
                  <View style={[styles.skeletonLineMedium, { backgroundColor: `${colors.border}40` }]} />
                </View>
              </View>
            ))}
          </View>
        ) : isError && bookings.length === 0 ? (
          /* Error State */
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconBox, { backgroundColor: '#ef444415' }]}>
              <Ionicons name="alert-circle-outline" size={40} color="#ef4444" />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.heading, fontFamily: headingFontFamily }]}>
              Unable to Load Bookings
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedText }]}>
              {error || 'An error occurred while communicating with the reservations server.'}
            </Text>
            <TouchableOpacity
              style={[styles.exploreButton, { backgroundColor: colors.primary }]}
              onPress={() => refreshBookings()}
              activeOpacity={0.8}
            >
              <Text style={styles.exploreButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredBookings.length === 0 ? (
          /* Empty State (Displayed ONLY when activeSegment has 0 bookings) */
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconBox, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="calendar-outline" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.heading, fontFamily: headingFontFamily }]}>
              No {activeSegment === 'all' ? '' : activeSegment} trips found
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedText }]}>
              {bookings.length > 0
                ? `No ${activeSegment} trips, but you have ${bookings.length} ${bookings.length === 1 ? 'booking' : 'bookings'} under other categories.`
                : 'When you book a holiday package or expedition, your e-tickets and reservation confirmation will appear here.'}
            </Text>
            <TouchableOpacity
              style={[styles.exploreButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                if (bookings.length > 0 && activeSegment !== 'all') {
                  setActiveSegment('all');
                } else {
                  router.push('/(tabs)/explore');
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.exploreButtonText}>
                {bookings.length > 0 && activeSegment !== 'all' ? 'View All Bookings' : 'Browse Tours'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Informative notice banner if upcoming is empty but other bookings exist */}
            {bookings.length > 0 && upcomingCount === 0 && (
              <View style={[styles.infoBanner, { backgroundColor: `${colors.primary}12`, borderColor: `${colors.primary}35` }]}>
                <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
                <Text style={[styles.infoBannerText, { color: colors.text }]}>
                  {activeSegment === 'upcoming'
                    ? `No upcoming trips, but you have ${nonUpcomingCount} ${nonUpcomingCount === 1 ? 'booking' : 'bookings'} under All.`
                    : `Showing all trips: you have 0 upcoming trips and ${nonUpcomingCount} completed/cancelled.`}
                </Text>
                {activeSegment === 'upcoming' && (
                  <TouchableOpacity
                    style={[styles.infoBannerAction, { backgroundColor: colors.primary }]}
                    onPress={() => setActiveSegment('all')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.infoBannerActionText}>View All</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Populated Bookings List */}
            {filteredBookings.map((b) => {
              const statusColor = getStatusColor(b.status);
              const statusLabel = getStatusLabel(b.status);

              const matchedTour = tours.find(
                (t) => String(t.id) === String(b.tourId)
              );

              const displayTitle =
                b.tourName &&
                b.tourName !== 'Curated Expedition' &&
                b.tourName !== 'Unknown Tour'
                  ? b.tourName
                  : matchedTour?.name || 'Guided Tour Expedition';

              const tourRate = matchedTour?.price || 0;
              const displayPrice =
                b.totalPrice > 0
                  ? b.totalPrice
                  : tourRate > 0
                  ? tourRate * Math.max(1, b.travelers)
                  : b.totalPrice;

              const displayImage =
                b.tourImage && b.tourImage !== PLACEHOLDER_IMAGE
                  ? b.tourImage
                  : matchedTour?.image || PLACEHOLDER_IMAGE;

              const displayCurrency =
                b.currency && b.currency !== '$'
                  ? b.currency
                  : (config as any)?.tourCard?.currency || b.currency || '$';

              return (
                <TouchableOpacity
                  key={b.id}
                  style={[
                    styles.bookingCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() => router.push(`/booking/${b.id}`)}
                  activeOpacity={0.85}
                >
                  {/* Thumbnail Image */}
                  <Image
                    source={{ uri: displayImage }}
                    style={styles.cardImage}
                    contentFit="cover"
                    transition={200}
                  />

                  {/* Card Details */}
                  <View style={styles.cardBody}>
                    {/* Top Row: Ref & Status Badge */}
                    <View style={styles.refRow}>
                      <Text style={[styles.refText, { color: colors.mutedText }]}>
                        REF: #{b.id.length > 10 ? b.id.slice(-8) : b.id}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
                        <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                          {statusLabel}
                        </Text>
                      </View>
                    </View>

                    {/* Tour Title */}
                    <Text
                      style={[styles.cardTitle, { color: colors.heading, fontFamily: headingFontFamily }]}
                      numberOfLines={2}
                    >
                      {displayTitle}
                    </Text>

                    {/* Info Row: Date & Guests */}
                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={13} color={colors.mutedText} />
                        <Text style={[styles.metaText, { color: colors.mutedText }]}>
                          {b.date}
                        </Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="people-outline" size={13} color={colors.mutedText} />
                        <Text style={[styles.metaText, { color: colors.mutedText }]}>
                          {b.travelers} {b.travelers === 1 ? 'Guest' : 'Guests'}
                        </Text>
                      </View>
                    </View>

                    {/* Price & Chevron */}
                    <View style={styles.footerRow}>
                      <Text style={[styles.priceText, { color: colors.primary }]}>
                        {displayCurrency}{displayPrice}
                      </Text>
                      <View style={styles.actionPrompt}>
                        <Text style={[styles.viewTicketText, { color: colors.primary }]}>
                          View Pass
                        </Text>
                        <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  segmentBar: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: RADIUS.lg,
    padding: 3,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  segmentText: {
    fontSize: FONT_SIZE.xs + 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    flexGrow: 1,
  },
  loadingContainer: {
    gap: SPACING.md,
  },
  skeletonCard: {
    flexDirection: 'row',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.sm,
    gap: SPACING.md,
    overflow: 'hidden',
  },
  skeletonImage: {
    width: 90,
    height: 90,
    borderRadius: RADIUS.md,
  },
  skeletonBody: {
    flex: 1,
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  skeletonLineShort: {
    width: '40%',
    height: 12,
    borderRadius: 4,
  },
  skeletonLineLong: {
    width: '85%',
    height: 14,
    borderRadius: 4,
  },
  skeletonLineMedium: {
    width: '60%',
    height: 12,
    borderRadius: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
    flex: 1,
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
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  exploreButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.full,
  },
  exploreButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: FONT_SIZE.sm,
  },
  bookingCard: {
    flexDirection: 'row',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
    ...SHADOW.sm,
  },
  cardImage: {
    width: 100,
    height: 105,
    borderRadius: RADIUS.md,
  },
  cardBody: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'space-between',
  },
  refRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cardTitle: {
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: '800',
    lineHeight: 18,
    marginVertical: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginVertical: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  priceText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '900',
  },
  actionPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewTicketText: {
    fontSize: 11,
    fontWeight: '700',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  infoBannerAction: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  infoBannerActionText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});

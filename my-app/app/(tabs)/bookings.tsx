/**
 * app/(tabs)/bookings.tsx
 *
 * User bookings and reservations tab screen.
 * Displays segmented filter tabs (All, Upcoming, Completed, Cancelled)
 * and trips with reservation cards, pull-to-refresh, skeleton loading,
 * error retry states, and snapshot tour fallbacks.
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { useSiteConfig } from '@/store/SiteConfigContext';
import { useBooking } from '@/context/BookingContext';
import { useTours } from '@/hooks/useTours';
import type { Booking } from '@/types';
import { useCurrency } from '@/context/CurrencyContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';
import { PLACEHOLDER_IMAGE } from '@/lib/imageUtils';

type BookingSegment = 'all' | 'pending' | 'upcoming' | 'completed' | 'cancelled';

export default function BookingsTabScreen() {
  const router = useRouter();
  const colors = useColors();
  const config = useSiteConfig();
  const { bookings, isLoading, isError, error, refreshBookings, lookupGuestBooking } = useBooking();
  const { tours } = useTours();
  const { currencySymbol } = useCurrency();
  const headingFontFamily = getHeadingFontFamily(config);

  const [activeSegment, setActiveSegment] = useState<BookingSegment>('upcoming');
  const [refreshing, setRefreshing] = useState(false);
  const [hasAutoSwitched, setHasAutoSwitched] = useState(false);

  // Guest Lookup Modal State
  const [lookupModalVisible, setLookupModalVisible] = useState(false);
  const [lookupRef, setLookupRef] = useState('');
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const handleLookupSubmit = async () => {
    if (!lookupRef.trim() || !lookupEmail.trim()) {
      setLookupError('Please enter both booking reference and email.');
      return;
    }
    setLookupLoading(true);
    setLookupError(null);
    try {
      const found = await lookupGuestBooking(lookupRef.trim(), lookupEmail.trim());
      setLookupModalVisible(false);
      setLookupRef('');
      setLookupEmail('');
      router.push(`/booking/${found.reference || found.id}`);
    } catch (err: unknown) {
      setLookupError(
        err instanceof Error ? err.message : 'Reservation not found. Please check your reference and email.'
      );
    } finally {
      setLookupLoading(false);
    }
  };

  const refreshBookingsRef = useRef(refreshBookings);
  useEffect(() => {
    refreshBookingsRef.current = refreshBookings;
  }, [refreshBookings]);

  // Automatically refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshBookingsRef.current();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshBookings();
    } finally {
      setRefreshing(false);
    }
  }, [refreshBookings]);

  // Counts by segment with reliable date and status parsing
  const pendingCount = useMemo(() => {
    return bookings.filter((b) => (b.status || '').toLowerCase() === 'pending').length;
  }, [bookings]);

  const upcomingCount = useMemo(() => {
    return bookings.filter((b) => {
      const st = (b.status || '').toLowerCase();
      return st === 'upcoming' || st === 'confirmed';
    }).length;
  }, [bookings]);

  const completedCount = useMemo(() => {
    return bookings.filter((b) => (b.status || '').toLowerCase() === 'completed').length;
  }, [bookings]);

  const cancelledCount = useMemo(() => {
    return bookings.filter((b) => {
      const st = (b.status || '').toLowerCase();
      return st === 'cancelled' || st === 'rejected' || st === 'expired';
    }).length;
  }, [bookings]);

  const nonUpcomingCount = bookings.length - upcomingCount - pendingCount;

  // Auto-default segment to 'pending' or 'all' if upcoming is empty but other bookings exist
  useEffect(() => {
    if (!isLoading && bookings.length > 0 && upcomingCount === 0 && !hasAutoSwitched && activeSegment === 'upcoming') {
      if (pendingCount > 0) {
        setActiveSegment('pending');
      } else {
        setActiveSegment('all');
      }
      setHasAutoSwitched(true);
    }
  }, [isLoading, bookings.length, upcomingCount, pendingCount, hasAutoSwitched, activeSegment]);

  // Segment filtering with tolerant status mapping and ISO date ordering
  const filteredBookings = useMemo(() => {
    // Deduplicate bookings by unique ID / reference
    const dedupedMap = new Map<string, (typeof bookings)[0]>();
    for (const b of bookings) {
      const key = b.id || b.reference;
      if (key && !dedupedMap.has(key)) {
        dedupedMap.set(key, b);
      }
    }
    const uniqueBookings = Array.from(dedupedMap.values());

    const list = uniqueBookings.filter((b) => {
      const st = (b.status || '').toLowerCase();
      if (activeSegment === 'all') return true;
      if (activeSegment === 'pending') {
        return st === 'pending';
      }
      if (activeSegment === 'upcoming') {
        return st === 'upcoming' || st === 'confirmed';
      }
      if (activeSegment === 'completed') return st === 'completed';
      if (activeSegment === 'cancelled') {
        return st === 'cancelled' || st === 'rejected' || st === 'expired';
      }
      return false;
    });

    if (__DEV__) {
      console.log(`[DEBUG] [BOOKING-RENDER] Raw items: ${bookings.length}, Unique: ${uniqueBookings.length}, Segment: '${activeSegment}', Filtered: ${list.length}`);
    }

    // Sort upcoming and pending by travel date ascending; others by creation/travel date descending
    return list.sort((a, b) => {
      const dateA = new Date(a.date || a.startDate || a.createdAt).getTime();
      const dateB = new Date(b.date || b.startDate || b.createdAt).getTime();
      if (activeSegment === 'upcoming' || activeSegment === 'pending') {
        return dateA - dateB;
      }
      return dateB - dateA;
    });
  }, [bookings, activeSegment]);

  const getStatusBadgeConfig = (status: string) => {
    const st = (status || '').toLowerCase();
    if (st === 'pending') {
      return {
        color: '#b45309',
        bg: '#fef3c7',
        border: '#fde68a',
        label: 'Awaiting Concierge',
        icon: 'time-outline' as const,
      };
    }
    if (st === 'confirmed' || st === 'upcoming') {
      return {
        color: '#065f46',
        bg: '#d1fae5',
        border: '#a7f3d0',
        label: 'Confirmed Pass',
        icon: 'checkmark-circle-outline' as const,
      };
    }
    if (st === 'completed') {
      return {
        color: '#1d4ed8',
        bg: '#dbeafe',
        border: '#bfdbfe',
        label: 'Completed',
        icon: 'flag-outline' as const,
      };
    }
    if (st === 'rejected') {
      return {
        color: '#be123c',
        bg: '#ffe4e6',
        border: '#fecdd3',
        label: 'Declined',
        icon: 'close-circle-outline' as const,
      };
    }
    if (st === 'expired') {
      return {
        color: '#475569',
        bg: '#f1f5f9',
        border: '#cbd5e1',
        label: 'Expired',
        icon: 'timer-outline' as const,
      };
    }
    return {
      color: '#b91c1c',
      bg: '#fee2e2',
      border: '#fca5a5',
      label: 'Cancelled',
      icon: 'ban-outline' as const,
    };
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
          {(
            [
              { id: 'all', label: 'All', count: bookings.length },
              { id: 'pending', label: 'Pending', count: pendingCount, highlight: true },
              { id: 'upcoming', label: 'Confirmed', count: upcomingCount },
              { id: 'completed', label: 'Done', count: completedCount },
              { id: 'cancelled', label: 'Cancelled', count: cancelledCount },
            ] as const
          ).map((seg) => {
            const isSelected = activeSegment === seg.id;
            return (
              <TouchableOpacity testID="btn-bookings-246" accessibilityLabel="bookings action"
                key={seg.id}
                style={[
                  styles.segmentButton,
                  isSelected && {
                    backgroundColor: colors.surface,
                    ...SHADOW.sm,
                  },
                ]}
                onPress={() => setActiveSegment(seg.id as BookingSegment)}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color: isSelected ? colors.primary : colors.mutedText,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {seg.label}
                  </Text>
                  {seg.count > 0 && (
                    <View
                      style={{
                        paddingHorizontal: 5,
                        paddingVertical: 1,
                        borderRadius: 10,
                        backgroundColor:
                          seg.id === 'pending'
                            ? isSelected
                              ? '#f59e0b'
                              : '#fef3c7'
                            : isSelected
                            ? `${colors.primary}25`
                            : `${colors.border}60`,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 9,
                          fontWeight: '800',
                          color:
                            seg.id === 'pending'
                              ? isSelected
                                ? '#ffffff'
                                : '#b45309'
                              : isSelected
                              ? colors.primary
                              : colors.mutedText,
                        }}
                      >
                        {seg.count}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ─── Guest Lookup Trigger Bar ─── */}
      <View
        style={[
          styles.lookupBar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.lookupBarContent}>
          <Text style={[styles.lookupBarText, { color: colors.mutedText }]}>
            {bookings.length} {bookings.length === 1 ? 'trip' : 'trips'} on device
          </Text>
          <TouchableOpacity testID="btn-search" accessibilityLabel="Search"
            style={[
              styles.lookupTriggerBtn,
              {
                borderColor: `${colors.primary}50`,
                backgroundColor: `${colors.primary}10`,
              },
            ]}
            onPress={() => {
              setLookupError(null);
              setLookupModalVisible(true);
            }}
            activeOpacity={0.75}
          >
            <Ionicons name="search" size={12} color={colors.primary} />
            <Text style={[styles.lookupTriggerText, { color: colors.primary }]}>
              Find by Reference
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Dev Diagnostic Banner (Development only) ─── */}
      {__DEV__ && (
        <View style={[styles.devBanner, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}25` }]}>
          <Text style={[styles.devBannerText, { color: colors.mutedText }]}>
            [DEBUG] Total: {bookings.length} | Shown: {filteredBookings.length} | Status: {isError ? 'ERR' : '200 OK'}
          </Text>
        </View>
      )}

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
          /* Error State with explicit message and Retry */
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
            <TouchableOpacity testID="btn-retry" accessibilityLabel="Retry"
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
            <TouchableOpacity testID="btn-bookings-424" accessibilityLabel="bookings action"
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
                  <TouchableOpacity testID="btn-view-all" accessibilityLabel="View All"
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
            {filteredBookings.map((b, index) => {
              const statusBadge = getStatusBadgeConfig(b.status);
              const isPending = (b.status || '').toLowerCase() === 'pending';
              const isConfirmed = (b.status || '').toLowerCase() === 'confirmed' || (b.status || '').toLowerCase() === 'upcoming';
              const isRejected = (b.status || '').toLowerCase() === 'rejected';
              const hasCancelRequest = b.cancellationRequest && b.cancellationRequest.status === 'pending';

              const matchedTour = tours.find(
                (t) => String(t.id) === String(b.tourId)
              );

              // Resilient snapshot fallback: card is NEVER dropped silently
              const displayTitle =
                b.tourName &&
                b.tourName !== 'Curated Expedition' &&
                b.tourName !== 'Unknown Tour'
                  ? b.tourName
                  : matchedTour?.name || 'Guided Tour Expedition';

              const displayImage =
                b.tourImage && b.tourImage !== PLACEHOLDER_IMAGE
                  ? b.tourImage
                  : matchedTour?.image || PLACEHOLDER_IMAGE;

              const displayPrice =
                b.totalPrice > 0
                  ? b.totalPrice
                  : b.unitPrice
                  ? b.unitPrice * Math.max(1, b.travelers)
                  : matchedTour?.price
                  ? matchedTour.price * Math.max(1, b.travelers)
                  : 499;

              const tourCardConfig = (config as { tourCard?: { currency?: string } } | null)?.tourCard || {};
              const displayCurrency =
                b.currency && b.currency !== '$'
                  ? b.currency
                  : currencySymbol || tourCardConfig.currency || b.currency || '$';

              const bookingRefCode = b.reference || (b.id.length > 10 ? b.id.slice(-8) : b.id);
              const isTourCatalogMissing = !matchedTour;

              return (
                <TouchableOpacity testID="btn-bookings-507" accessibilityLabel="bookings action"
                  key={b.id ? `${b.id}-${index}` : b.reference ? `${b.reference}-${index}` : `booking-${index}`}
                  style={[
                    styles.bookingCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isPending ? '#f59e0b50' : colors.border,
                      borderLeftWidth: isPending ? 4 : 1,
                      borderLeftColor: isPending ? '#f59e0b' : colors.border,
                    },
                  ]}
                  onPress={() => router.push(`/booking/${b.reference || b.id}`)}
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
                        REF: #{bookingRefCode}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: statusBadge.bg,
                            borderWidth: 1,
                            borderColor: statusBadge.border,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 3,
                          },
                        ]}
                      >
                        <Ionicons name={statusBadge.icon} size={11} color={statusBadge.color} />
                        <Text style={[styles.statusBadgeText, { color: statusBadge.color }]}>
                          {statusBadge.label}
                        </Text>
                      </View>
                    </View>

                    {/* Cancellation Request Flag if active */}
                    {hasCancelRequest && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Ionicons name="warning" size={11} color="#d97706" />
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#d97706' }}>
                          Cancellation Requested · Under Review
                        </Text>
                      </View>
                    )}

                    {/* Tour Title */}
                    <Text
                      style={[styles.cardTitle, { color: colors.heading, fontFamily: headingFontFamily }]}
                      numberOfLines={2}
                    >
                      {displayTitle}
                    </Text>

                    {/* Pending Review Helper or Rejection Note */}
                    {isPending && (
                      <View
                        style={{
                          backgroundColor: '#fef3c760',
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 4,
                          marginVertical: 2,
                        }}
                      >
                        <Text style={{ fontSize: 10, color: '#b45309', fontWeight: '600' }}>
                          ⏳ Awaiting Concierge Review (2-4 hrs)
                        </Text>
                      </View>
                    )}
                    {isRejected && b.rejectionReason && (
                      <View
                        style={{
                          backgroundColor: '#ffe4e660',
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 4,
                          marginVertical: 2,
                        }}
                      >
                        <Text style={{ fontSize: 10, color: '#be123c', fontWeight: '600' }} numberOfLines={1}>
                          Declined: {b.rejectionReason}
                        </Text>
                      </View>
                    )}

                    {/* Note if tour was re-seeded or is absent from current catalog */}
                    {isTourCatalogMissing && (
                      <View style={styles.catalogNoteRow}>
                        <Text style={[styles.catalogNoteText, { color: colors.mutedText }]}>
                          Confirmed Reservation · Snapshot Details
                        </Text>
                      </View>
                    )}

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
                        <Text style={[styles.metaText, { color: colors.mutedText }]} numberOfLines={1}>
                          {b.travelers} {b.travelers === 1 ? 'Guest' : 'Guests'}
                          {b.travelersList && b.travelersList.length > 0
                            ? ` (${b.travelersList[0].name}${b.travelersList.length > 1 ? ` +${b.travelersList.length - 1}` : ''})`
                            : b.guestName
                            ? ` (${b.guestName})`
                            : ''}
                        </Text>
                      </View>
                    </View>

                    {/* Price & Gated Action Prompt */}
                    <View style={styles.footerRow}>
                      <Text style={[styles.priceText, { color: colors.primary }]}>
                        {displayCurrency}{displayPrice}
                      </Text>
                      <View style={styles.actionPrompt}>
                        <Ionicons
                          name={
                            isConfirmed
                              ? 'qr-code-outline'
                              : isPending
                              ? 'time-outline'
                              : 'chevron-forward'
                          }
                          size={13}
                          color={isPending ? '#b45309' : colors.primary}
                        />
                        <Text
                          style={[
                            styles.viewTicketText,
                            { color: isPending ? '#b45309' : colors.primary },
                          ]}
                        >
                          {isConfirmed
                            ? 'View Pass'
                            : isPending
                            ? 'Check Status'
                            : 'View Details'}
                        </Text>
                        <Ionicons
                          name="chevron-forward"
                          size={13}
                          color={isPending ? '#b45309' : colors.primary}
                        />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* ─── Guest Lookup Modal ─── */}
      <Modal
        visible={lookupModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLookupModalVisible(false)}
      >
        <View style={styles.lookupModalOverlay}>
          <View
            style={[
              styles.lookupModalBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.lookupModalHeader}>
              <View style={[styles.lookupIconCircle, { backgroundColor: `${colors.primary}18` }]}>
                <Ionicons name="receipt-outline" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.lookupModalTitle, { color: colors.heading, fontFamily: headingFontFamily }]}>
                  Find Guest Reservation
                </Text>
                <Text style={[styles.lookupModalSubtitle, { color: colors.mutedText }]}>
                  Enter reference and email to retrieve your ticket
                </Text>
              </View>
              <TouchableOpacity testID="btn-close" accessibilityLabel="Close"
                onPress={() => setLookupModalVisible(false)}
                style={styles.lookupCloseBtn}
              >
                <Ionicons name="close" size={20} color={colors.mutedText} />
              </TouchableOpacity>
            </View>

            {lookupError && (
              <View style={styles.lookupErrorBanner}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.lookupErrorText}>{lookupError}</Text>
              </View>
            )}

            <View style={styles.lookupForm}>
              <Text style={[styles.lookupFieldLabel, { color: colors.heading }]}>
                Booking Reference
              </Text>
              <TextInput
                style={[
                  styles.lookupInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g. GT-2026-8F3K9Q"
                placeholderTextColor={colors.mutedText}
                value={lookupRef}
                onChangeText={setLookupRef}
                autoCapitalize="characters"
                autoCorrect={false}
              />

              <Text style={[styles.lookupFieldLabel, { color: colors.heading }]}>
                Guest Email Address
              </Text>
              <TextInput
                style={[
                  styles.lookupInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g. traveler@example.com"
                placeholderTextColor={colors.mutedText}
                value={lookupEmail}
                onChangeText={setLookupEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.lookupModalActions}>
                <TouchableOpacity testID="btn-cancel" accessibilityLabel="Cancel"
                  style={[styles.lookupCancelBtn, { borderColor: colors.border }]}
                  onPress={() => setLookupModalVisible(false)}
                  disabled={lookupLoading}
                >
                  <Text style={[styles.lookupCancelText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity testID="btn-search-reservation" accessibilityLabel="Search Reservation"
                  style={[styles.lookupSubmitBtn, { backgroundColor: colors.primary }]}
                  onPress={handleLookupSubmit}
                  disabled={lookupLoading}
                  activeOpacity={0.8}
                >
                  {lookupLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.lookupSubmitText}>Search Reservation</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
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
  devBanner: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    alignItems: 'center',
  },
  devBannerText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'monospace',
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
    height: 110,
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
  catalogNoteRow: {
    marginBottom: 2,
  },
  catalogNoteText: {
    fontSize: 10,
    fontWeight: '500',
    fontStyle: 'italic',
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
  lookupBar: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lookupBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lookupBarText: {
    fontSize: 11,
    fontWeight: '500',
  },
  lookupTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  lookupTriggerText: {
    fontSize: 10,
    fontWeight: '700',
  },
  lookupModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  lookupModalBox: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.lg,
    ...SHADOW.lg,
  },
  lookupModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  lookupIconCircle: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lookupModalTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  lookupModalSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  lookupCloseBtn: {
    padding: 4,
  },
  lookupErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ef444415',
    borderWidth: 1,
    borderColor: '#ef444435',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
  },
  lookupErrorText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  lookupForm: {
    gap: SPACING.sm,
  },
  lookupFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  lookupInput: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: 13,
  },
  lookupModalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  lookupCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    alignItems: 'center',
  },
  lookupCancelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  lookupSubmitBtn: {
    flex: 2,
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lookupSubmitText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});

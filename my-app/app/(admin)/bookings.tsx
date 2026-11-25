/**
 * app/(admin)/bookings.tsx
 *
 * Executive Booking Confirmation Inbox & Reservation Management for mobile administrators.
 * Supports multi-tenant isolation, real-time inbox count badges, quick 1-tap Approve/Confirm,
 * mandatory reason-based Rejection, customer Cancellation Request review (Approve/Decline),
 * complete state transition audit trail inspection, and email outbox logs with resend capability.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSelectedSite } from '@/hooks/useSelectedSite';
import {
  fetchBookings,
  fetchAdminInboxCounts,
  confirmBookingApi,
  rejectBookingApi,
  cancelBookingApi,
  reviewCancellationApi,
  fetchBookingOutbox,
  resendBookingEmailApi,
  deleteBooking,
} from '@/services/api';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import type { Booking, InboxCountsDto, BookingEmailOutboxItem } from '@/types';

type AdminTab = 'all' | 'pending' | 'cancellation_requests' | 'confirmed' | 'cancelled' | 'completed';

export default function AdminBookingsScreen() {
  const router = useRouter();
  const { siteId } = useSelectedSite();
  const effectiveSiteId = siteId || 'website1';

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [inboxCounts, setInboxCounts] = useState<InboxCountsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Modals state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('Excursion fully booked for requested date');
  const [customRejectionText, setCustomRejectionText] = useState('');

  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('Customer requested cancellation');

  const [reviewCancelModalVisible, setReviewCancelModalVisible] = useState(false);
  const [reviewNote, setReviewNote] = useState('');

  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [detailsTab, setDetailsTab] = useState<'overview' | 'audit' | 'emails'>('overview');
  const [outboxItems, setOutboxItems] = useState<BookingEmailOutboxItem[]>([]);
  const [outboxLoading, setOutboxLoading] = useState(false);
  const [resendingTemplate, setResendingTemplate] = useState<string | null>(null);

  // Load bookings and inbox counts
  const loadData = useCallback(async () => {
    try {
      const [bookingsRes, countsRes] = await Promise.all([
        fetchBookings(effectiveSiteId),
        fetchAdminInboxCounts(effectiveSiteId).catch(() => null),
      ]);
      const list = Array.isArray(bookingsRes?.data) ? bookingsRes.data : [];
      setBookings(list);
      if (countsRes) {
        setInboxCounts(countsRes);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load reservations';
      if (__DEV__) {
        console.warn('[AdminBookings] Error loading data:', msg);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [effectiveSiteId]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // Filter list by tab and search
  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const st = (b.status || 'pending').toLowerCase();
      const hasPendingCancel = b.cancellationRequest && b.cancellationRequest.status === 'pending';

      let matchesTab = false;
      if (activeTab === 'all') matchesTab = true;
      else if (activeTab === 'pending') matchesTab = st === 'pending';
      else if (activeTab === 'cancellation_requests') matchesTab = !!hasPendingCancel;
      else if (activeTab === 'confirmed') matchesTab = st === 'confirmed' || st === 'upcoming';
      else if (activeTab === 'cancelled') matchesTab = st === 'cancelled' || st === 'rejected' || st === 'expired';
      else if (activeTab === 'completed') matchesTab = st === 'completed';

      const s = search.trim().toLowerCase();
      const matchesSearch =
        !s ||
        (b.guestName || '').toLowerCase().includes(s) ||
        (b.email || '').toLowerCase().includes(s) ||
        (b.tourName || '').toLowerCase().includes(s) ||
        (b.reference || '').toLowerCase().includes(s) ||
        (b.id || '').toLowerCase().includes(s);

      return matchesTab && matchesSearch;
    });
  }, [activeTab, bookings, search]);

  // 1-Tap Quick Approve / Confirm
  const handleQuickConfirm = useCallback(
    (b: Booking) => {
      const ref = b.reference || b.id;
      const doConfirm = async () => {
        setProcessingId(b.id);
        try {
          const updated = await confirmBookingApi(b.id, effectiveSiteId);
          setBookings((prev) => prev.map((item) => (item.id === b.id ? updated : item)));
          fetchAdminInboxCounts(effectiveSiteId).then((c) => setInboxCounts(c)).catch(() => {});
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.alert(`Reservation #${ref} has been confirmed successfully.`);
          } else {
            Alert.alert('Confirmed', `Reservation #${ref} has been confirmed successfully.`);
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Failed to confirm reservation';
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.alert(`Error: ${msg}`);
          } else {
            Alert.alert('Error', msg);
          }
        } finally {
          setProcessingId(null);
        }
      };

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const confirmed = window.confirm(
          `Confirm reservation #${ref} for ${b.guestName}?\n\nAn official confirmation email with digital boarding pass & QR voucher will be dispatched immediately.`
        );
        if (confirmed) {
          doConfirm();
        }
        return;
      }

      Alert.alert(
        'Approve Reservation',
        `Confirm reservation #${ref} for ${b.guestName}?\n\nAn official confirmation email with digital boarding pass & QR voucher will be dispatched immediately.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Yes, Confirm',
            style: 'default',
            onPress: doConfirm,
          },
        ]
      );
    },
    [effectiveSiteId]
  );

  // Open Rejection Modal
  const handleOpenReject = (b: Booking) => {
    setSelectedBooking(b);
    setRejectionReason('Excursion fully booked for requested date');
    setCustomRejectionText('');
    setRejectModalVisible(true);
  };

  // Submit Rejection
  const handleSubmitReject = async () => {
    if (!selectedBooking) return;
    const finalReason = customRejectionText.trim()
      ? `${rejectionReason}: ${customRejectionText.trim()}`
      : rejectionReason;

    setProcessingId(selectedBooking.id);
    try {
      const updated = await rejectBookingApi(selectedBooking.id, finalReason, effectiveSiteId);
      setBookings((prev) => prev.map((item) => (item.id === selectedBooking.id ? updated : item)));
      fetchAdminInboxCounts(effectiveSiteId).then((c) => setInboxCounts(c)).catch(() => {});
      setRejectModalVisible(false);
      Alert.alert('Rejected', `Reservation #${selectedBooking.reference || selectedBooking.id} has been rejected.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reject reservation';
      Alert.alert('Error', msg);
    } finally {
      setProcessingId(null);
    }
  };

  // Open Cancellation Modal
  const handleOpenCancel = (b: Booking) => {
    setSelectedBooking(b);
    setCancellationReason('Customer requested cancellation via call');
    setCancelModalVisible(true);
  };

  // Submit Cancellation
  const handleSubmitCancel = async () => {
    if (!selectedBooking) return;
    setProcessingId(selectedBooking.id);
    try {
      const updated = await cancelBookingApi(selectedBooking.id, selectedBooking.email, effectiveSiteId);
      setBookings((prev) => prev.map((item) => (item.id === selectedBooking.id ? updated : item)));
      fetchAdminInboxCounts(effectiveSiteId).then((c) => setInboxCounts(c)).catch(() => {});
      setCancelModalVisible(false);
      Alert.alert('Cancelled', `Reservation #${selectedBooking.reference || selectedBooking.id} has been cancelled.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel reservation';
      Alert.alert('Error', msg);
    } finally {
      setProcessingId(null);
    }
  };

  // Open Review Cancellation Modal
  const handleOpenReviewCancel = (b: Booking) => {
    setSelectedBooking(b);
    setReviewNote('');
    setReviewCancelModalVisible(true);
  };

  // Submit Review Cancellation (Approve / Reject)
  const handleSubmitReviewCancel = async (action: 'approve' | 'reject') => {
    if (!selectedBooking) return;
    setProcessingId(selectedBooking.id);
    try {
      const updated = await reviewCancellationApi(
        selectedBooking.id,
        action,
        reviewNote.trim() || undefined,
        effectiveSiteId
      );
      setBookings((prev) => prev.map((item) => (item.id === selectedBooking.id ? updated : item)));
      fetchAdminInboxCounts(effectiveSiteId).then((c) => setInboxCounts(c)).catch(() => {});
      setReviewCancelModalVisible(false);
      const msg =
        action === 'approve'
          ? 'Cancellation request approved. Booking has been cancelled.'
          : 'Cancellation request declined. Booking remains active.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(msg);
      } else {
        Alert.alert('Processed', msg);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to review cancellation request';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(`Error: ${msg}`);
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setProcessingId(null);
    }
  };

  // Open Details Modal and fetch Outbox
  const handleOpenDetails = async (b: Booking) => {
    setSelectedBooking(b);
    setDetailsTab('overview');
    setDetailsModalVisible(true);
    setOutboxLoading(true);
    try {
      const logs = await fetchBookingOutbox(b.id, effectiveSiteId);
      setOutboxItems(logs);
    } catch {
      setOutboxItems([]);
    } finally {
      setOutboxLoading(false);
    }
  };

  // Resend Email from details modal
  const handleResendEmail = async (template: string) => {
    if (!selectedBooking) return;
    setResendingTemplate(template);
    try {
      const res = await resendBookingEmailApi(selectedBooking.id, template, effectiveSiteId);
      Alert.alert('Email Dispatched', res.message || `Dispatched ${template} email successfully.`);
      const logs = await fetchBookingOutbox(selectedBooking.id, effectiveSiteId);
      setOutboxItems(logs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resend email';
      Alert.alert('Error', msg);
    } finally {
      setResendingTemplate(null);
    }
  };

  // Delete booking permanent
  const handleDelete = (id: string, guest: string) => {
    Alert.alert('Permanent Deletion', `Permanently delete reservation record for "${guest}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBooking(id, effectiveSiteId);
            setBookings((prev) => prev.filter((b) => b.id !== id));
            fetchAdminInboxCounts(effectiveSiteId).then((c) => setInboxCounts(c)).catch(() => {});
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to delete booking';
            Alert.alert('Delete Error', msg);
          }
        },
      },
    ]);
  };

  const getStatusBadge = (status: string) => {
    const st = (status || '').toLowerCase();
    if (st === 'pending') {
      return { bg: '#fef3c7', text: '#b45309', label: 'Pending Review', border: '#fde68a' };
    }
    if (st === 'confirmed' || st === 'upcoming') {
      return { bg: '#d1fae5', text: '#065f46', label: 'Confirmed', border: '#a7f3d0' };
    }
    if (st === 'completed') {
      return { bg: '#dbeafe', text: '#1e40af', label: 'Completed', border: '#bfdbfe' };
    }
    if (st === 'rejected') {
      return { bg: '#ffe4e6', text: '#be123c', label: 'Declined', border: '#fecdd3' };
    }
    if (st === 'expired') {
      return { bg: '#f1f5f9', text: '#475569', label: 'Expired', border: '#cbd5e1' };
    }
    return { bg: '#fee2e2', text: '#991b1b', label: 'Cancelled', border: '#fca5a5' };
  };

  return (
    <View style={styles.root}>
      {/* ─── Search Bar ─── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          testID="btn-bookings-back-overview"
          accessibilityLabel="Back to Admin Overview"
          style={styles.backBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(admin)'))}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={16} color="#0284c7" />
          <Text style={styles.backBtnText}>Overview</Text>
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by guest, reference, email, tour..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity testID="btn-close" accessibilityLabel="Close" onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ─── Tabs with Live Counts ─── */}
      <View style={styles.tabsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {[
            { id: 'pending', label: 'Pending', count: inboxCounts?.pending, highlight: true },
            { id: 'cancellation_requests', label: 'Cancel Reqs', count: inboxCounts?.cancellationRequests, alert: true },
            { id: 'confirmed', label: 'Confirmed', count: inboxCounts?.confirmed },
            { id: 'all', label: 'All', count: bookings.length },
            { id: 'cancelled', label: 'Cancelled', count: inboxCounts?.cancelled },
            { id: 'completed', label: 'Done', count: inboxCounts?.completed },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity testID="btn-bookings-392" accessibilityLabel="bookings action"
                key={tab.id}
                style={[
                  styles.tabBtn,
                  isActive && styles.tabBtnActive,
                  tab.highlight && !isActive && (tab.count ?? 0) > 0 && { borderColor: '#f59e0b', borderWidth: 1 },
                  tab.alert && !isActive && (tab.count ?? 0) > 0 && { borderColor: '#ef4444', borderWidth: 1 },
                ]}
                onPress={() => setActiveTab(tab.id as AdminTab)}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
                  {typeof tab.count === 'number' && (
                    <View
                      style={[
                        styles.tabBadge,
                        isActive
                          ? { backgroundColor: '#ffffff30' }
                          : tab.highlight && tab.count > 0
                          ? { backgroundColor: '#f59e0b25' }
                          : tab.alert && tab.count > 0
                          ? { backgroundColor: '#ef444425' }
                          : { backgroundColor: '#f1f5f9' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tabBadgeText,
                          isActive
                            ? { color: '#ffffff' }
                            : tab.highlight && tab.count > 0
                            ? { color: '#d97706' }
                            : tab.alert && tab.count > 0
                            ? { color: '#dc2626' }
                            : { color: '#64748b' },
                        ]}
                      >
                        {tab.count}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ─── Bookings List ─── */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Fetching reservations inbox...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id || item.reference)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
          renderItem={({ item }) => {
            const badge = getStatusBadge(item.status);
            const isPending = (item.status || '').toLowerCase() === 'pending';
            const isConfirmed = (item.status || '').toLowerCase() === 'confirmed';
            const hasCancelRequest = item.cancellationRequest && item.cancellationRequest.status === 'pending';
            const isProcessing = processingId === item.id;
            const refCode = item.reference || (item.id.length > 10 ? item.id.slice(-8) : item.id);

            return (
              <View
                style={[
                  styles.card,
                  isPending && { borderColor: '#f59e0b', borderLeftWidth: 4 },
                  hasCancelRequest && { borderColor: '#ef4444', borderLeftWidth: 4 },
                ]}
              >
                {/* Header: Ref, Passenger & Status */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.refText}>REF: #{refCode}</Text>
                      <View style={{ paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, backgroundColor: '#f1f5f9' }}>
                        <Text style={{ fontSize: 9.5, fontWeight: '700', color: '#64748b' }}>
                          {item.source === 'web' ? '🌐 Web' : '📱 App'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.guestName}>{item.guestName || 'Guest'}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                      <TouchableOpacity testID="btn-mail-outline" accessibilityLabel="mail outline"
                        onPress={() => item.email && Linking.openURL(`mailto:${item.email}`)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}
                      >
                        <Ionicons name="mail-outline" size={11} color="#64748b" />
                        <Text style={styles.contactText}>{item.email}</Text>
                      </TouchableOpacity>
                      {item.phone && (
                        <TouchableOpacity testID="btn-call-outline" accessibilityLabel="call outline"
                          onPress={() => Linking.openURL(`tel:${item.phone}`)}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}
                        >
                          <Ionicons name="call-outline" size={11} color="#64748b" />
                          <Text style={styles.contactText}>{item.phone}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  <View style={styles.priceCol}>
                    <Text style={styles.priceText}>
                      {item.currency || '$'}{(item.totalPrice || 0).toLocaleString()}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: badge.bg, borderColor: badge.border, borderWidth: 1 },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: badge.text }]}>{badge.label}</Text>
                    </View>
                  </View>
                </View>

                {/* Customer Cancellation Request Alert Banner */}
                {hasCancelRequest && (
                  <View style={styles.cancelAlertBanner}>
                    <Ionicons name="warning" size={15} color="#d97706" style={{ marginTop: 1 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#b45309' }}>
                        Customer Requested Cancellation
                      </Text>
                      <Text style={{ fontSize: 11, color: '#92400e', marginTop: 1 }}>
                        Reason: {item.cancellationRequest?.reason}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                        <TouchableOpacity testID="btn-bookings-528" accessibilityLabel="bookings action"
                          style={[styles.smallActionBtn, { backgroundColor: '#dc2626' }]}
                          onPress={() => handleOpenReviewCancel(item)}
                          disabled={isProcessing}
                        >
                          <Text style={styles.smallActionBtnText}>Review & Decide</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}

                {/* Tour Info */}
                <View style={styles.tourRow}>
                  <Ionicons name="compass" size={15} color="#2563eb" />
                  <Text style={styles.tourTitle} numberOfLines={1}>
                    {item.tourName || 'Guided Tour Expedition'}
                  </Text>
                  <Text style={styles.travelersText}>
                    {item.travelers || 1} {item.travelers === 1 ? 'Guest' : 'Guests'}
                  </Text>
                </View>

                {/* Date & Quick Action Row */}
                <View style={styles.footerRow}>
                  <Text style={styles.dateText}>
                    Date: {item.travelDate || item.date || (item.startDate ? new Date(item.startDate).toLocaleDateString() : 'Upcoming')}
                  </Text>

                  {/* Actions according to status */}
                  <View style={styles.actions}>
                    {isPending && (
                      <>
                        <TouchableOpacity testID="btn-checkmark" accessibilityLabel="checkmark"
                          style={[styles.btnAction, { backgroundColor: '#10b981' }]}
                          onPress={() => handleQuickConfirm(item)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <>
                              <Ionicons name="checkmark" size={14} color="#ffffff" />
                              <Text style={styles.btnActionText}>Approve</Text>
                            </>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity testID="btn-close" accessibilityLabel="Close"
                          style={[styles.btnAction, { backgroundColor: '#fee2e2', borderColor: '#fca5a5', borderWidth: 1 }]}
                          onPress={() => handleOpenReject(item)}
                          disabled={isProcessing}
                        >
                          <Ionicons name="close" size={14} color="#dc2626" />
                          <Text style={[styles.btnActionText, { color: '#dc2626' }]}>Reject</Text>
                        </TouchableOpacity>
                      </>
                    )}

                    {isConfirmed && (
                      <TouchableOpacity testID="btn-cancel" accessibilityLabel="Cancel"
                        style={[styles.btnAction, { backgroundColor: '#fee2e2', borderColor: '#fca5a5', borderWidth: 1 }]}
                        onPress={() => handleOpenCancel(item)}
                        disabled={isProcessing}
                      >
                        <Text style={[styles.btnActionText, { color: '#dc2626' }]}>Cancel</Text>
                      </TouchableOpacity>
                    )}

                    {/* Full details & audit drawer trigger */}
                    <TouchableOpacity testID="btn-ellipsis-horizontal" accessibilityLabel="ellipsis horizontal"
                      style={styles.detailBtn}
                      onPress={() => handleOpenDetails(item)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="ellipsis-horizontal" size={16} color="#64748b" />
                    </TouchableOpacity>

                    {/* Delete Icon */}
                    <TouchableOpacity testID="btn-trash-outline" accessibilityLabel="trash outline"
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(item.id, item.guestName || 'Guest')}
                    >
                      <Ionicons name="trash-outline" size={15} color="#94a3b8" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Ionicons name="file-tray-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No reservations in this view</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'pending'
                  ? 'Great job! The pending booking inbox is all caught up.'
                  : 'No bookings matched your filter criteria.'}
              </Text>
            </View>
          }
        />
      )}

      {/* ─── Reject Modal ─── */}
      <Modal visible={rejectModalVisible} transparent animationType="slide" onRequestClose={() => setRejectModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="close-circle" size={22} color="#dc2626" />
                <Text style={styles.modalTitle}>Reject Reservation</Text>
              </View>
              <TouchableOpacity testID="btn-close" accessibilityLabel="Close" onPress={() => setRejectModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSub}>
                Rejecting #{selectedBooking?.reference || selectedBooking?.id} for {selectedBooking?.guestName}. A mandatory explanation email will be sent.
              </Text>

              <Text style={styles.inputHeading}>Preset Reasons</Text>
              {[
                'Excursion fully booked for requested date',
                'Adverse weather warning / trail closed',
                'Payment verification failed / card declined',
                'Operator operational constraint',
                'Other reason',
              ].map((reason) => {
                const isChosen = rejectionReason === reason;
                return (
                  <TouchableOpacity testID="btn-bookings-661" accessibilityLabel="bookings action"
                    key={reason}
                    style={[styles.reasonChip, isChosen && styles.reasonChipActive]}
                    onPress={() => setRejectionReason(reason)}
                  >
                    <Ionicons
                      name={isChosen ? 'radio-button-on' : 'radio-button-off'}
                      size={16}
                      color={isChosen ? '#dc2626' : '#94a3b8'}
                    />
                    <Text style={[styles.reasonChipText, isChosen && { color: '#dc2626', fontWeight: '700' }]}>
                      {reason}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <Text style={[styles.inputHeading, { marginTop: 10 }]}>Additional Note to Customer</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Add any specific details..."
                value={customRejectionText}
                onChangeText={setCustomRejectionText}
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalActionsRow}>
                <TouchableOpacity testID="btn-dismiss" accessibilityLabel="Dismiss" style={styles.modalCancelBtn} onPress={() => setRejectModalVisible(false)}>
                  <Text style={styles.modalCancelBtnText}>Dismiss</Text>
                </TouchableOpacity>

                <TouchableOpacity testID="btn-confirm-rejection" accessibilityLabel="Confirm Rejection"
                  style={[styles.modalSubmitBtn, { backgroundColor: '#dc2626' }]}
                  onPress={handleSubmitReject}
                  disabled={processingId !== null}
                >
                  <Text style={styles.modalSubmitBtnText}>Confirm Rejection</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── Cancel Modal ─── */}
      <Modal visible={cancelModalVisible} transparent animationType="slide" onRequestClose={() => setCancelModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="ban" size={22} color="#dc2626" />
                <Text style={styles.modalTitle}>Cancel Confirmed Booking</Text>
              </View>
              <TouchableOpacity testID="btn-close" accessibilityLabel="Close" onPress={() => setCancelModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSub}>
                Cancelling #{selectedBooking?.reference || selectedBooking?.id} for {selectedBooking?.guestName}. Customer will receive a cancellation notice.
              </Text>

              <Text style={styles.inputHeading}>Reason for Cancellation</Text>
              {[
                'Customer requested cancellation via call',
                'Supplier / guide unavailable',
                'Unforeseen operational change',
                'Customer no-show',
              ].map((r) => {
                const isChosen = cancellationReason === r;
                return (
                  <TouchableOpacity testID="btn-bookings-734" accessibilityLabel="bookings action"
                    key={r}
                    style={[styles.reasonChip, isChosen && styles.reasonChipActive]}
                    onPress={() => setCancellationReason(r)}
                  >
                    <Ionicons
                      name={isChosen ? 'radio-button-on' : 'radio-button-off'}
                      size={16}
                      color={isChosen ? '#dc2626' : '#94a3b8'}
                    />
                    <Text style={[styles.reasonChipText, isChosen && { color: '#dc2626', fontWeight: '700' }]}>{r}</Text>
                  </TouchableOpacity>
                );
              })}

              <View style={styles.modalActionsRow}>
                <TouchableOpacity testID="btn-keep-active" accessibilityLabel="Keep Active" style={styles.modalCancelBtn} onPress={() => setCancelModalVisible(false)}>
                  <Text style={styles.modalCancelBtnText}>Keep Active</Text>
                </TouchableOpacity>

                <TouchableOpacity testID="btn-cancel-reservation" accessibilityLabel="Cancel Reservation"
                  style={[styles.modalSubmitBtn, { backgroundColor: '#dc2626' }]}
                  onPress={handleSubmitCancel}
                  disabled={processingId !== null}
                >
                  <Text style={styles.modalSubmitBtnText}>Cancel Reservation</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── Review Cancellation Request Modal ─── */}
      <Modal visible={reviewCancelModalVisible} transparent animationType="slide" onRequestClose={() => setReviewCancelModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="warning" size={22} color="#d97706" />
                <Text style={styles.modalTitle}>Review Cancellation Request</Text>
              </View>
              <TouchableOpacity testID="btn-close" accessibilityLabel="Close" onPress={() => setReviewCancelModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={[styles.cancelAlertBanner, { marginHorizontal: 0 }]}>
                <Ionicons name="chatbubble-ellipses" size={16} color="#d97706" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#b45309' }}>
                    Customer Reason:
                  </Text>
                  <Text style={{ fontSize: 12, color: '#92400e', marginTop: 2 }}>
                    "{selectedBooking?.cancellationRequest?.reason || 'No specific reason provided'}"
                  </Text>
                  <Text style={{ fontSize: 10, color: '#b45309', marginTop: 3 }}>
                    Submitted on: {selectedBooking?.cancellationRequest?.requestedAt ? new Date(selectedBooking.cancellationRequest.requestedAt).toLocaleString() : ''}
                  </Text>
                </View>
              </View>

              <Text style={[styles.inputHeading, { marginTop: 12 }]}>Admin Review Note (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Add internal or customer note..."
                value={reviewNote}
                onChangeText={setReviewNote}
                multiline
                numberOfLines={2}
              />

              <View style={[styles.modalActionsRow, { gap: 10, marginTop: 16 }]}>
                <TouchableOpacity testID="btn-decline-request" accessibilityLabel="Decline Request"
                  style={[styles.modalSubmitBtn, { backgroundColor: '#fee2e2', borderColor: '#fca5a5', borderWidth: 1 }]}
                  onPress={() => handleSubmitReviewCancel('reject')}
                  disabled={processingId !== null}
                >
                  <Text style={[styles.modalSubmitBtnText, { color: '#dc2626' }]}>Decline Request</Text>
                </TouchableOpacity>

                <TouchableOpacity testID="btn-bookings-816" accessibilityLabel="bookings action"
                  style={[styles.modalSubmitBtn, { backgroundColor: '#10b981' }]}
                  onPress={() => handleSubmitReviewCancel('approve')}
                  disabled={processingId !== null}
                >
                  <Text style={styles.modalSubmitBtnText}>Approve & Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── Detail & Audit Drawer Modal ─── */}
      <Modal visible={detailsModalVisible} transparent animationType="slide" onRequestClose={() => setDetailsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  Reservation #{selectedBooking?.reference || selectedBooking?.id}
                </Text>
                <Text style={{ fontSize: 11, color: '#64748b' }}>
                  {selectedBooking?.guestName} · {selectedBooking?.email}
                </Text>
              </View>
              <TouchableOpacity testID="btn-close" accessibilityLabel="Close" onPress={() => setDetailsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Segmented Detail Tabs */}
            <View style={styles.detailTabsRow}>
              {(['overview', 'audit', 'emails'] as const).map((t) => (
                <TouchableOpacity testID="btn-bookings-850" accessibilityLabel="bookings action"
                  key={t}
                  style={[styles.detailTabBtn, detailsTab === t && styles.detailTabBtnActive]}
                  onPress={() => setDetailsTab(t)}
                >
                  <Text style={[styles.detailTabText, detailsTab === t && styles.detailTabTextActive]}>
                    {t === 'overview' ? 'Overview' : t === 'audit' ? 'Audit Trail' : 'Email Logs'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 12 }}>
              {/* Tab 1: Overview */}
              {detailsTab === 'overview' && selectedBooking && (
                <View style={{ gap: 12 }}>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionHeading}>EXPEDITION DETAILS</Text>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }}>
                      {selectedBooking.tourName}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                      Departure: {selectedBooking.travelDate || selectedBooking.date} · {selectedBooking.travelers} Guests
                    </Text>
                    <Text style={{ fontSize: 12, color: '#10b981', fontWeight: '700', marginTop: 4 }}>
                      Total Amount: {selectedBooking.currency || '$'}{selectedBooking.totalPrice} ({selectedBooking.paymentStatus || 'Confirmed'})
                    </Text>
                  </View>

                  {/* Individual Travelers Manifest */}
                  {selectedBooking.travelersList && selectedBooking.travelersList.length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionHeading}>
                        TRAVELERS MANIFEST ({selectedBooking.travelersList.length})
                      </Text>
                      {selectedBooking.travelersList.map((trv, idx) => (
                        <View key={trv.id || idx} style={styles.travelerRow}>
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#0f172a' }}>
                            {idx + 1}. {trv.name}
                          </Text>
                          <Text style={{ fontSize: 11, color: '#64748b' }}>
                            {trv.type}{trv.age ? ` · Age ${trv.age}` : ''}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {selectedBooking.specialRequest ? (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionHeading}>SPECIAL REQUESTS</Text>
                      <Text style={{ fontSize: 12, color: '#334155' }}>
                        {selectedBooking.specialRequest}
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}

              {/* Tab 2: Audit Trail */}
              {detailsTab === 'audit' && selectedBooking && (
                <View style={{ paddingVertical: 4 }}>
                  <Text style={styles.detailSectionHeading}>STATE TRANSITION HISTORY</Text>
                  {selectedBooking.statusHistory && selectedBooking.statusHistory.length > 0 ? (
                    selectedBooking.statusHistory.map((item, idx) => {
                      const st = (item.status || '').toLowerCase();
                      const color =
                        st === 'confirmed' ? '#10b981' : st === 'pending' ? '#f59e0b' : st === 'rejected' ? '#be123c' : '#ef4444';
                      return (
                        <View key={idx} style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginTop: 4 }} />
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                              <Text style={{ fontSize: 12, fontWeight: '800', color, textTransform: 'capitalize' }}>
                                {item.status}
                              </Text>
                              <Text style={{ fontSize: 10, color: '#94a3b8' }}>
                                {item.changedAt ? new Date(item.changedAt).toLocaleString() : ''}
                              </Text>
                            </View>
                            {item.note && <Text style={{ fontSize: 12, color: '#334155', marginTop: 2 }}>{item.note}</Text>}
                            {item.changedBy && (
                              <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>by {item.changedBy}</Text>
                            )}
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <Text style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', marginTop: 6 }}>
                      No prior state transitions recorded.
                    </Text>
                  )}
                </View>
              )}

              {/* Tab 3: Email Logs */}
              {detailsTab === 'emails' && (
                <View style={{ paddingVertical: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={styles.detailSectionHeading}>DISPATCHED EMAILS</Text>
                    {outboxLoading && <ActivityIndicator size="small" color="#2563eb" />}
                  </View>

                  {outboxItems.length > 0 ? (
                    outboxItems.map((email, idx) => (
                      <View key={email.id || idx} style={styles.emailLogCard}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: '#0f172a' }}>{email.subject}</Text>
                          <View style={{ paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, backgroundColor: '#d1fae5' }}>
                            <Text style={{ fontSize: 9.5, fontWeight: '700', color: '#065f46' }}>
                              {email.status || 'Sent'}
                            </Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>To: {email.to}</Text>
                        <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>
                          Template: {email.template} · {email.sentAt ? new Date(email.sentAt).toLocaleString() : ''}
                        </Text>
                        <TouchableOpacity testID="btn-bookings-969" accessibilityLabel="bookings action"
                          style={styles.resendBtn}
                          onPress={() => handleResendEmail(email.template)}
                          disabled={resendingTemplate === email.template}
                        >
                          {resendingTemplate === email.template ? (
                            <ActivityIndicator size="small" color="#2563eb" />
                          ) : (
                            <>
                              <Ionicons name="refresh-outline" size={13} color="#2563eb" />
                              <Text style={styles.resendBtnText}>Resend Email</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    ))
                  ) : !outboxLoading ? (
                    <Text style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
                      No emails sent yet for this reservation.
                    </Text>
                  ) : null}
                </View>
              )}
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
    backgroundColor: '#f8fafc',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 7,
    fontSize: 13,
    color: '#0f172a',
  },
  tabsRow: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: '#f8fafc',
  },
  tabBtnActive: {
    backgroundColor: '#2563eb',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  tabBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
  },
  tabBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm + 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...SHADOW.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  refText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  guestName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  contactText: {
    fontSize: 11,
    color: '#64748b',
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#10b981',
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    marginTop: 4,
  },
  statusText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  cancelAlertBanner: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: RADIUS.md,
    padding: 8,
    marginVertical: 6,
  },
  smallActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  smallActionBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  tourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    padding: 7,
    borderRadius: RADIUS.sm,
    marginVertical: 4,
  },
  tourTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  travelersText: {
    fontSize: 11,
    color: '#64748b',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  dateText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  btnActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  detailBtn: {
    padding: 5,
    borderRadius: RADIUS.sm,
    backgroundColor: '#f1f5f9',
  },
  deleteBtn: {
    padding: 5,
  },
  centerContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: 13,
    color: '#64748b',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
    marginBottom: SPACING.sm,
  },
  inputHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
    marginVertical: 6,
  },
  reasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 6,
    backgroundColor: '#f8fafc',
  },
  reasonChipActive: {
    borderColor: '#dc2626',
    backgroundColor: '#fee2e240',
  },
  reasonChipText: {
    fontSize: 12,
    color: '#334155',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    padding: 10,
    fontSize: 12,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    textAlignVertical: 'top',
    minHeight: 60,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: SPACING.md,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalCancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: RADIUS.md,
  },
  modalSubmitBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  detailTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 6,
  },
  detailTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  detailTabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
  },
  detailTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  detailTabTextActive: {
    color: '#2563eb',
    fontWeight: '800',
  },
  detailSection: {
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.md,
    padding: 10,
  },
  detailSectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  travelerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  emailLogCard: {
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#eff6ff',
  },
  resendBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
});

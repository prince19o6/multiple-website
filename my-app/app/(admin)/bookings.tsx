/**
 * app/(admin)/bookings.tsx
 *
 * Bookings Management screen for administrators.
 * Displays real guest reservations, guest contact info, travel dates, and status updates via API.
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelectedSite } from '@/hooks/useSelectedSite';
import { fetchBookings, updateBookingStatus, deleteBooking } from '@/services/api';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import type { Booking } from '@/types';

export default function AdminBookingsScreen() {
  const { siteId } = useSelectedSite();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const effectiveSiteId = siteId || 'website1';

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchBookings(effectiveSiteId);
      const list = Array.isArray(res?.data) ? res.data : [];
      setBookings(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load bookings';
      Alert.alert('Load Error', msg);
    } finally {
      setLoading(false);
    }
  }, [effectiveSiteId]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const bStatus = (b.status || 'pending').toLowerCase();
      const matchesStatus = statusFilter === 'all' || bStatus === statusFilter.toLowerCase();
      const matchesSearch =
        (b.guestName || '').toLowerCase().includes(search.toLowerCase()) ||
        (b.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (b.tourName || '').toLowerCase().includes(search.toLowerCase()) ||
        (b.id || '').toLowerCase().includes(search.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [bookings, statusFilter, search]);

  const handleStatusChange = async (id: string, currentStatus: string) => {
    const nextStatus =
      currentStatus === 'confirmed'
        ? 'completed'
        : currentStatus === 'completed'
        ? 'cancelled'
        : 'confirmed';

    try {
      await updateBookingStatus(id, nextStatus, effectiveSiteId);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: nextStatus as any } : b))
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update booking status';
      Alert.alert('Update Error', msg);
    }
  };

  const handleDelete = (id: string, guest: string) => {
    Alert.alert('Confirm Deletion', `Permanently delete reservation for "${guest}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBooking(id, effectiveSiteId);
            setBookings((prev) => prev.filter((b) => b.id !== id));
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to delete booking';
            Alert.alert('Delete Error', msg);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      {/* Search Header */}
      <View style={styles.topBar}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search reservations..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, statusFilter === tab && styles.tabBtnActive]}
            onPress={() => setStatusFilter(tab)}
          >
            <Text
              style={[
                styles.tabText,
                statusFilter === tab && styles.tabTextActive,
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Fetching reservations...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.guestName}>{item.guestName || 'Guest'}</Text>
                  <Text style={styles.guestEmail}>{item.email}</Text>
                  {item.phone && <Text style={styles.guestPhone}>{item.phone}</Text>}
                </View>
                <View style={styles.priceCol}>
                  <Text style={styles.priceText}>${(item.totalPrice || 0).toLocaleString()}</Text>
                  <Text style={styles.travelersText}>{item.travelers || 1} Persons</Text>
                </View>
              </View>

              <View style={styles.tourRow}>
                <Ionicons name="compass-outline" size={14} color="#64748b" />
                <Text style={styles.tourTitle} numberOfLines={1}>
                  {item.tourName || 'Guided Tour'}
                </Text>
              </View>

              <View style={styles.footerRow}>
                <Text style={styles.dateText}>
                  Date: {item.startDate ? new Date(item.startDate).toLocaleDateString() : 'Flexible'}
                </Text>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          item.status?.toLowerCase() === 'confirmed'
                            ? '#d1fae5'
                            : item.status?.toLowerCase() === 'completed'
                            ? '#dbeafe'
                            : item.status?.toLowerCase() === 'cancelled'
                            ? '#fee2e2'
                            : '#fef3c7',
                      },
                    ]}
                    onPress={() => handleStatusChange(item.id, item.status || 'pending')}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            item.status?.toLowerCase() === 'confirmed'
                              ? '#065f46'
                              : item.status?.toLowerCase() === 'completed'
                              ? '#1e40af'
                              : item.status?.toLowerCase() === 'cancelled'
                              ? '#991b1b'
                              : '#92400e',
                        },
                      ]}
                    >
                      {item.status || 'pending'} ↻
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item.id, item.guestName || 'Guest')}
                  >
                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>No reservations found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topBar: {
    padding: SPACING.md,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 6,
    fontSize: 13,
    color: '#0f172a',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: '#ffffff',
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
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
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOW.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  guestName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  guestEmail: {
    fontSize: 11,
    color: '#64748b',
  },
  guestPhone: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1,
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#10b981',
  },
  travelersText: {
    fontSize: 10,
    color: '#64748b',
  },
  tourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f8fafc',
    padding: 6,
    borderRadius: RADIUS.xs,
    marginVertical: 4,
  },
  tourTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
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
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  deleteBtn: {
    padding: 4,
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
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
  },
});

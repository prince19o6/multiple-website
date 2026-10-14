/**
 * app/(admin)/index.tsx
 *
 * Admin Dashboard screen.
 * Displays overall platform metrics, live site tenant indicator, and quick links to admin modules.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAdminAuth } from './_layout';
import { useSelectedSite } from '@/hooks/useSelectedSite';
import { getSiteEntry } from '@/constants/siteRegistry';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { fetchAdminStats, type AdminStats } from '@/services/api';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { isAdminLoggedIn } = useAdminAuth();
  const { siteId } = useSelectedSite();
  const currentSite = getSiteEntry(siteId);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!isAdminLoggedIn) return;
    setError(null);
    try {
      const res = await fetchAdminStats(siteId);
      if (res?.data) {
        setStats(res.data);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard metrics';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdminLoggedIn, siteId]);

  useEffect(() => {
    if (!isAdminLoggedIn) {
      router.replace('/(admin)/login');
      return;
    }
    loadData();
  }, [isAdminLoggedIn, siteId, loadData, router]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (!isAdminLoggedIn) return null;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />}
    >
      {/* Active Site Context Header */}
      <View style={styles.siteHeader}>
        <View>
          <Text style={styles.siteHeaderLabel}>ACTIVE MULTI-TENANT BRAND</Text>
          <Text style={styles.siteHeaderTitle}>{currentSite?.label || siteId}</Text>
        </View>
        <TouchableOpacity
          style={styles.switchSiteBadge}
          onPress={() => router.push('/site-switcher')}
        >
          <Ionicons name="swap-horizontal" size={14} color="#2563eb" />
          <Text style={styles.switchSiteText}>Switch</Text>
        </TouchableOpacity>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={18} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadData} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Fetching live metrics...</Text>
        </View>
      ) : (
        <>
          {/* KPI Cards Grid */}
          <View style={styles.kpiGrid}>
            <View style={[styles.kpiCard, { borderLeftColor: '#3b82f6' }]}>
              <View style={styles.kpiTop}>
                <Text style={styles.kpiTitle}>TOURS</Text>
                <Ionicons name="compass" size={20} color="#3b82f6" />
              </View>
              <Text style={styles.kpiValue}>{stats?.totalTours ?? 0}</Text>
              <Text style={styles.kpiSub}>Active packages</Text>
            </View>

            <View style={[styles.kpiCard, { borderLeftColor: '#f59e0b' }]}>
              <View style={styles.kpiTop}>
                <Text style={styles.kpiTitle}>BOOKINGS</Text>
                <Ionicons name="calendar" size={20} color="#f59e0b" />
              </View>
              <Text style={styles.kpiValue}>{stats?.totalBookings ?? 0}</Text>
              <Text style={styles.kpiSub}>{stats?.pendingBookings ?? 0} pending action</Text>
            </View>

            <View style={[styles.kpiCard, { borderLeftColor: '#10b981' }]}>
              <View style={styles.kpiTop}>
                <Text style={styles.kpiTitle}>REVENUE</Text>
                <Ionicons name="cash" size={20} color="#10b981" />
              </View>
              <Text style={styles.kpiValue}>
                ${(stats?.totalRevenue ?? 0).toLocaleString()}
              </Text>
              <Text style={styles.kpiSub}>Tenant revenue</Text>
            </View>

            <View style={[styles.kpiCard, { borderLeftColor: '#8b5cf6' }]}>
              <View style={styles.kpiTop}>
                <Text style={styles.kpiTitle}>USERS</Text>
                <Ionicons name="people" size={20} color="#8b5cf6" />
              </View>
              <Text style={styles.kpiValue}>{stats?.totalUsers ?? 0}</Text>
              <Text style={styles.kpiSub}>Registered accounts</Text>
            </View>
          </View>

          {/* Quick Management Links */}
          <Text style={styles.sectionTitle}>Operations Management</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(admin)/tours')}
              activeOpacity={0.85}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="map-outline" size={24} color="#2563eb" />
              </View>
              <Text style={styles.actionCardTitle}>Tour Catalog</Text>
              <Text style={styles.actionCardSub}>Create, edit, toggle, duplicate packages</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(admin)/bookings')}
              activeOpacity={0.85}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="receipt-outline" size={24} color="#d97706" />
              </View>
              <Text style={styles.actionCardTitle}>Reservations</Text>
              <Text style={styles.actionCardSub}>Confirm, cancel, and inspect bookings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(admin)/users')}
              activeOpacity={0.85}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#f3e8ff' }]}>
                <Ionicons name="people-outline" size={24} color="#7c3aed" />
              </View>
              <Text style={styles.actionCardTitle}>User Accounts</Text>
              <Text style={styles.actionCardSub}>Manage member roles and status</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(admin)/analytics')}
              activeOpacity={0.85}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#ecfdf5' }]}>
                <Ionicons name="trending-up-outline" size={24} color="#059669" />
              </View>
              <Text style={styles.actionCardTitle}>Analytics</Text>
              <Text style={styles.actionCardSub}>Inspect category volumes & trends</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Reservations */}
          {stats?.recentBookings && stats.recentBookings.length > 0 && (
            <View style={styles.recentSection}>
              <Text style={styles.sectionTitle}>Recent Bookings</Text>
              {stats.recentBookings.slice(0, 3).map((b) => (
                <View key={b.id} style={styles.bookingItem}>
                  <View style={styles.bookingItemLeft}>
                    <Text style={styles.guestName}>{b.guestName || 'Guest'}</Text>
                    <Text style={styles.tourTitle} numberOfLines={1}>
                      {b.tourName}
                    </Text>
                    <Text style={styles.dateSub}>
                      {b.startDate ? new Date(b.startDate).toLocaleDateString() : 'Flexible'}
                    </Text>
                  </View>
                  <View style={styles.bookingItemRight}>
                    <Text style={styles.priceTag}>${(b.totalPrice || 0).toLocaleString()}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            b.status?.toLowerCase() === 'confirmed'
                              ? '#d1fae5'
                              : b.status?.toLowerCase() === 'cancelled'
                              ? '#fee2e2'
                              : '#fef3c7',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          {
                            color:
                              b.status?.toLowerCase() === 'confirmed'
                                ? '#065f46'
                                : b.status?.toLowerCase() === 'cancelled'
                                ? '#991b1b'
                                : '#92400e',
                          },
                        ]}
                      >
                        {b.status || 'pending'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  siteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    ...SHADOW.sm,
  },
  siteHeaderLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  siteHeaderTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: '#0f172a',
  },
  switchSiteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
  },
  switchSiteText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#991b1b',
    fontWeight: '600',
  },
  retryBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  loadingContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  kpiCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#ffffff',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderLeftWidth: 4,
    ...SHADOW.sm,
  },
  kpiTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
    color: '#0f172a',
    marginVertical: 4,
  },
  kpiSub: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: SPACING.sm,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  actionCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#ffffff',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    ...SHADOW.sm,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  actionCardTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  actionCardSub: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 15,
  },
  recentSection: {
    marginBottom: SPACING.lg,
  },
  bookingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
    ...SHADOW.xs,
  },
  bookingItemLeft: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  guestName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  tourTitle: {
    fontSize: 12,
    color: '#475569',
    marginTop: 1,
  },
  dateSub: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  bookingItemRight: {
    alignItems: 'flex-end',
  },
  priceTag: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
});

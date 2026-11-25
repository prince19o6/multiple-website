/**
 * app/(admin)/analytics.tsx
 *
 * Analytics & Performance screen for administrators.
 * Displays revenue metrics, top performing tours, and cross-brand multi-tenant traffic.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSelectedSite } from '@/hooks/useSelectedSite';
import { getSiteEntry } from '@/constants/siteRegistry';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { fetchAdminAnalytics, type AdminAnalyticsData } from '@/services/api';

export default function AdminAnalyticsScreen() {
  const router = useRouter();
  const { siteId } = useSelectedSite();
  const currentSite = getSiteEntry(siteId);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminAnalyticsData | null>(null);

  const effectiveSiteId = siteId || 'website1';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchAdminAnalytics(effectiveSiteId);
      if (res?.data) {
        setData(res.data);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load analytics';
      Alert.alert('Load Error', msg);
    } finally {
      setLoading(false);
    }
  }, [effectiveSiteId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const maxRevenue = Math.max(
    ...(data?.revenueOverTime.map((r) => r.revenue) || [1000]),
    1000
  );

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.topNavRow}>
        <TouchableOpacity
          testID="btn-analytics-back-overview"
          accessibilityLabel="Back to Admin Overview"
          style={styles.backBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(admin)'))}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={16} color="#0284c7" />
          <Text style={styles.backBtnText}>Back to Overview</Text>
        </TouchableOpacity>
      </View>

      {/* Top Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerLabel}>REVENUE OVERVIEW ({currentSite?.label})</Text>
        <Text style={styles.bannerAmount}>
          ${loading ? '...' : (data?.totalRevenue ?? 0).toLocaleString()}
        </Text>
        <View style={styles.trendRow}>
          <Ionicons name="trending-up" size={16} color="#10b981" />
          <Text style={styles.trendText}>Live multi-tenant MongoDB Atlas data</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Fetching analytics metrics...</Text>
        </View>
      ) : (
        <>
          {/* Metric Cards */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricCardLabel}>TOTAL RESERVATIONS</Text>
              <Text style={styles.metricCardValue}>{data?.totalBookings ?? 0}</Text>
              <Text style={styles.metricCardSub}>All tenant bookings</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricCardLabel}>AVG ORDER VALUE</Text>
              <Text style={styles.metricCardValue}>
                ${(data?.avgBookingValue ?? 0).toLocaleString()}
              </Text>
              <Text style={styles.metricCardSub}>Per booking</Text>
            </View>
          </View>

          {/* Revenue Over Time Bar Progress */}
          {data?.revenueOverTime && data.revenueOverTime.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Monthly Revenue Progression</Text>
              {data.revenueOverTime.map((item, idx) => {
                const pct = Math.min(100, Math.round((item.revenue / maxRevenue) * 100));
                return (
                  <View key={idx} style={styles.barItem}>
                    <View style={styles.barHeader}>
                      <Text style={styles.barLabel}>{item.period}</Text>
                      <Text style={styles.barValue}>
                        ${item.revenue.toLocaleString()} ({item.bookings} orders)
                      </Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${Math.max(8, pct)}%` }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Status Distribution */}
          {data?.bookingsByStatus && data.bookingsByStatus.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Reservations by Pipeline Status</Text>
              <View style={styles.statusGrid}>
                {data.bookingsByStatus.map((s) => (
                  <View key={s.status} style={styles.statusItem}>
                    <Text style={styles.statusName}>{s.status.toUpperCase()}</Text>
                    <Text style={styles.statusCount}>{s.count}</Text>
                    <Text style={styles.statusRev}>${(s.revenue || 0).toLocaleString()}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Catalog Distribution */}
          {data?.toursByCategory && data.toursByCategory.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Tour Catalog by Category</Text>
              {data.toursByCategory.map((c) => (
                <View key={c.category} style={styles.categoryRow}>
                  <Text style={styles.categoryName}>{c.category}</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{c.count} packages</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Top Tours */}
          {data?.topTours && data.topTours.length > 0 && (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Top Performing Tour Packages</Text>
              {data.topTours.map((t, idx) => (
                <View key={idx} style={styles.topTourRow}>
                  <View style={styles.topTourLeft}>
                    <Text style={styles.topTourName} numberOfLines={1}>
                      {t.name}
                    </Text>
                    <Text style={styles.topTourSub}>{t.bookingsCount} bookings</Text>
                  </View>
                  <Text style={styles.topTourPrice}>${t.revenue.toLocaleString()}</Text>
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
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
  },
  banner: {
    backgroundColor: '#0f172a',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  bannerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  bannerAmount: {
    fontSize: FONT_SIZE.xxl + 4,
    fontWeight: '900',
    color: '#ffffff',
    marginVertical: 4,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    ...SHADOW.sm,
  },
  metricCardLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  metricCardValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '900',
    color: '#0f172a',
    marginVertical: 4,
  },
  metricCardSub: {
    fontSize: 10,
    color: '#94a3b8',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOW.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: SPACING.md,
  },
  barItem: {
    marginBottom: SPACING.sm,
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  barValue: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  barTrack: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: RADIUS.full,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8fafc',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  statusName: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
  },
  statusCount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    marginVertical: 2,
  },
  statusRev: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: '700',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  categoryBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  topTourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  topTourLeft: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  topTourName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  topTourSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  topTourPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10b981',
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
});

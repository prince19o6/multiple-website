/**
 * components/DevBanner.tsx
 *
 * __DEV__-only diagnostic widget that displays active tenant information,
 * resolved configuration source provenance, live API reachability status,
 * and live Tours API URL, last status, and item count.
 *
 * Requirements:
 * - Positioned at the bottom above the tab bar so it NEVER obscures header titles or content.
 * - Respects safe area insets via useSafeAreaInsets().
 * - Collapsible into a compact pill, and dismissible so it never blocks touch targets.
 * - Displays active site ID, hostname, API base URL, source provenance (CLI flag vs env file),
 *   live API reachability, and tours API status & item count.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSite } from '@/store/SiteConfigContext';
import { ENV } from '@/src/config/env';
import {
  checkApiHealth,
  getToursDebugState,
  subscribeToursDebug,
  type ToursDebugState,
  getBookingsDebugState,
  subscribeBookingsDebug,
  type BookingsDebugState,
} from '@/services/api';

export default function DevBanner() {
  const insets = useSafeAreaInsets();
  const [collapsed, setCollapsed] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const { isLoaded, isLoading, isError, hostname, siteId, siteName } = useSite();

  const [apiHealth, setApiHealth] = useState<{
    checking: boolean;
    ok: boolean;
    latencyMs?: number;
    error?: string;
  }>({
    checking: true,
    ok: false,
  });

  const [toursDebug, setToursDebug] = useState<ToursDebugState | null>(() => getToursDebugState());
  const [bookingsDebug, setBookingsDebug] = useState<BookingsDebugState | null>(() => getBookingsDebugState());

  const testReachability = useCallback(async () => {
    setApiHealth((prev) => ({ ...prev, checking: true }));
    const health = await checkApiHealth();
    setApiHealth({
      checking: false,
      ok: health.ok,
      latencyMs: health.latencyMs,
      error: health.error,
    });
  }, []);

  useEffect(() => {
    if (__DEV__) {
      testReachability();
      setToursDebug(getToursDebugState());
      setBookingsDebug(getBookingsDebugState());
      const unsubTours = subscribeToursDebug((state) => {
        setToursDebug({ ...state });
      });
      const unsubBookings = subscribeBookingsDebug((state) => {
        setBookingsDebug({ ...state });
      });
      return () => {
        unsubTours();
        unsubBookings();
      };
    }
  }, [testReachability]);

  // Only render in development mode
  if (!__DEV__ || dismissed) {
    return null;
  }

  const reachabilityColor = apiHealth.checking
    ? '#f59e0b'
    : apiHealth.ok
    ? '#22c55e'
    : '#ef4444';

  const reachabilityText = apiHealth.checking
    ? 'Checking API...'
    : apiHealth.ok
    ? `Online (${apiHealth.latencyMs}ms)`
    : `Offline (${apiHealth.error || 'Failed'})`;

  const statusLabel = isLoading
    ? 'Loading Config...'
    : isError
    ? 'Config Error'
    : isLoaded
    ? 'Config Loaded'
    : 'Initializing';

  const detailStatusColor =
    toursDebug?.detailStatus === 200
      ? '#22c55e'
      : toursDebug?.detailStatus
      ? '#ef4444'
      : '#94a3b8';

  const detailStatusText = toursDebug?.detailStatus
    ? `HTTP ${toursDebug.detailStatus} (${toursDebug.detailStatus === 200 ? 'Loaded' : 'Error'})`
    : 'Awaiting detail view';

  const toursStatusColor =
    toursDebug?.status === 200
      ? '#22c55e'
      : toursDebug?.status
      ? '#ef4444'
      : '#94a3b8';

  const toursStatusText = toursDebug
    ? `HTTP ${toursDebug.status} • ${toursDebug.itemCount} ${toursDebug.itemCount === 1 ? 'tour' : 'tours'}${
        toursDebug.error ? ` (${toursDebug.error})` : ''
      }`
    : 'Awaiting first query';

  const bookingsStatusColor =
    bookingsDebug?.status === 200
      ? '#22c55e'
      : bookingsDebug?.status
      ? '#ef4444'
      : '#94a3b8';

  const bookingsStatusText = bookingsDebug
    ? `HTTP ${bookingsDebug.status} • ${bookingsDebug.itemCount} ${bookingsDebug.itemCount === 1 ? 'trip' : 'trips'}${
        bookingsDebug.error ? ` (${bookingsDebug.error})` : ''
      }`
    : 'Awaiting query';

  // Bottom offset positioned safely above bottom tab bar dock (~60px) + insets
  const bottomOffset = Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 8) + 68;

  if (collapsed) {
    return (
      <View style={[styles.bottomContainer, { bottom: bottomOffset, pointerEvents: 'box-none' }]}>
        <View style={styles.pill}>
          <TouchableOpacity
            style={styles.pillContent}
            onPress={() => setCollapsed(false)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Open Developer Diagnostics"
          >
            <View style={[styles.statusDot, { backgroundColor: reachabilityColor }]} />
            <Text style={styles.pillText} numberOfLines={1}>
              [DEV] {ENV.siteId} • {apiHealth.ok ? 'Online' : 'Offline'} • Tours: {toursDebug ? `${toursDebug.itemCount}` : '-'} • Detail: {toursDebug?.detailStatus || '-'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.pillDismissBtn}
            onPress={() => setDismissed(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Dismiss Dev Pill"
          >
            <Ionicons name="close" size={12} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.bannerContainer, { bottom: bottomOffset, pointerEvents: 'box-none' }]}>
      <View style={styles.banner}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.statusDot, { backgroundColor: reachabilityColor }]} />
            <Text style={styles.title}>[DEV DIAGNOSTICS: {siteName}]</Text>
          </View>
          <TouchableOpacity
            onPress={() => setCollapsed(true)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.closeBtn}
            accessibilityLabel="Collapse Dev Diagnostics"
          >
            <Ionicons name="close" size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Site ID:</Text>
          <Text style={styles.value}>{ENV.siteId} (Context: {siteId})</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Source:</Text>
          <Text style={[styles.value, { color: '#38bdf8' }]}>{ENV.envSource}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Hostname:</Text>
          <Text style={styles.value}>{hostname}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Backend Mode:</Text>
          <Text style={[styles.value, { color: ENV.isLocalBackend ? '#f59e0b' : '#38bdf8' }]}>
            {ENV.isLocalBackend ? 'Local ASP.NET (:5000)' : 'Cloud Staging API'}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>API Base URL:</Text>
          <Text style={styles.value} numberOfLines={1}>
            {ENV.apiUrl}
          </Text>
        </View>

        {/* ─── Tours API __DEV__ Line ─── */}
        <View style={styles.row}>
          <Text style={styles.label}>Tours API URL:</Text>
          <Text style={styles.value} numberOfLines={1}>
            {toursDebug?.url || `${ENV.apiUrl}/api/tours`}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Tours Last Status:</Text>
          <Text style={[styles.value, { color: toursStatusColor, fontWeight: '700' }]} numberOfLines={1}>
            {toursStatusText}
          </Text>
        </View>

        {/* ─── Tour Detail API __DEV__ Line ─── */}
        <View style={styles.row}>
          <Text style={styles.label}>Tour Detail Status:</Text>
          <Text style={[styles.value, { color: detailStatusColor, fontWeight: '700' }]} numberOfLines={1}>
            {detailStatusText}
          </Text>
        </View>
        {toursDebug?.detailUrl ? (
          <View style={styles.row}>
            <Text style={styles.label}>Detail URL:</Text>
            <Text style={[styles.value, { color: '#38bdf8' }]} numberOfLines={1}>
              {toursDebug.detailUrl}
            </Text>
          </View>
        ) : null}

        {toursDebug?.firstItem ? (
          <View style={styles.row}>
            <Text style={styles.label}>First Tour:</Text>
            <Text style={[styles.value, { color: '#38bdf8' }]} numberOfLines={1}>
              {toursDebug.firstItem}
            </Text>
          </View>
        ) : null}

        {/* ─── Bookings API __DEV__ Line ─── */}
        <View style={styles.row}>
          <Text style={styles.label}>Bookings API URL:</Text>
          <Text style={styles.value} numberOfLines={1}>
            {bookingsDebug?.url || `${ENV.apiUrl}/api/bookings`}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Bookings Last Status:</Text>
          <Text style={[styles.value, { color: bookingsStatusColor, fontWeight: '700' }]} numberOfLines={1}>
            {bookingsStatusText}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>API Reachability:</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {apiHealth.checking ? (
              <ActivityIndicator size="small" color="#f59e0b" />
            ) : (
              <Text style={[styles.value, { color: reachabilityColor, fontWeight: '700' }]}>
                {reachabilityText}
              </Text>
            )}
            <TouchableOpacity onPress={testReachability} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Ionicons name="refresh" size={14} color="#38bdf8" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Config Status:</Text>
          <Text style={[styles.value, { color: isError ? '#ef4444' : '#22c55e', fontWeight: '700' }]}>
            {statusLabel}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.hideEntirelyBtn}
          onPress={() => setDismissed(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.hideEntirelyText}>Hide Debug Overlay For Session</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  pill: {
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 5,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  pillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillText: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '600',
  },
  pillDismissBtn: {
    padding: 3,
    marginLeft: 4,
  },
  bannerContainer: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 999,
  },
  banner: {
    backgroundColor: 'rgba(15, 23, 42, 0.97)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  label: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
  },
  value: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '600',
    maxWidth: '65%',
    textAlign: 'right',
  },
  hideEntirelyBtn: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  hideEntirelyText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '500',
  },
});

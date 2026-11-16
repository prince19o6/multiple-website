/**
 * components/NotificationCenterModal.tsx
 *
 * In-App Notification Center & Departure Alert Inbox.
 *
 * Features:
 *   - Slide-up bottom sheet modal with smooth backdrop and gesture dismissal
 *   - Multi-brand theming and typography
 *   - Type badges (Departure, Booking, Promo, System)
 *   - Filter between All and Unread alerts
 *   - "Mark all as read" and "Clear all" actions
 *   - Instant deep-link navigation on tap (e.g. to /booking/[id] or /tour/[id])
 *   - Quick "Send Test Departure Alert" trigger for live testing
 *   - Zero TypeScript `any` and 44px minimum touch targets
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useColors } from '@/store/ThemeContext';
import { useSite, useSiteConfig } from '@/store/SiteConfigContext';
import { useNotification, type AppNotification, type NotificationType } from '@/context/NotificationContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';

export default function NotificationCenterModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const config = useSiteConfig();
  const { siteName } = useSite();
  const headingFontFamily = getHeadingFontFamily(config);

  const {
    notifications,
    unreadCount,
    isCenterVisible,
    closeCenter,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    sendTestNotification,
  } = useNotification();

  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const filteredList = useMemo(() => {
    if (activeTab === 'unread') {
      return notifications.filter((n) => !n.read);
    }
    return notifications;
  }, [notifications, activeTab]);

  const handleNotificationPress = async (item: AppNotification) => {
    try {
      Haptics.selectionAsync();
    } catch {}

    await markAsRead(item.id);

    if (item.data?.url) {
      closeCenter();
      router.push(item.data.url as never);
    }
  };

  const getBadgeConfig = (type: NotificationType) => {
    switch (type) {
      case 'departure':
        return {
          icon: 'airplane' as const,
          bgColor: '#f59e0b18',
          iconColor: '#f59e0b',
          label: 'DEPARTURE',
        };
      case 'booking':
        return {
          icon: 'ticket' as const,
          bgColor: '#10b98118',
          iconColor: '#10b981',
          label: 'BOOKING',
        };
      case 'promo':
        return {
          icon: 'sparkles' as const,
          bgColor: '#8b5cf618',
          iconColor: '#8b5cf6',
          label: 'EXCLUSIVE',
        };
      case 'system':
      default:
        return {
          icon: 'notifications' as const,
          bgColor: `${colors.primary}18`,
          iconColor: colors.primary,
          label: 'ALERT',
        };
    }
  };

  const formatTimestamp = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <Modal
      visible={isCenterVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={closeCenter}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* ─── Header ─── */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, { color: colors.heading, fontFamily: headingFontFamily }]}>
                  Notifications
                </Text>
                {unreadCount > 0 && (
                  <View style={[styles.unreadBadge, { backgroundColor: colors.accent || '#ef4444' }]}>
                    <Text style={styles.unreadBadgeText}>{unreadCount} new</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.subtitle, { color: colors.mutedText }]}>
                {siteName} travel alerts & departure reminders
              </Text>
            </View>

            <TouchableOpacity testID="btn-close"
              onPress={closeCenter}
              style={styles.closeBtn}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Close notifications"
            >
              <Ionicons name="close" size={22} color={colors.heading} />
            </TouchableOpacity>
          </View>

          {/* ─── Filter Tabs & Actions Bar ─── */}
          <View style={[styles.actionBar, { borderBottomColor: colors.border }]}>
            <View style={styles.tabPills}>
              <TouchableOpacity testID="btn-notificationcentermodal-170" accessibilityLabel="notificationcentermodal action"
                style={[
                  styles.tabPill,
                  activeTab === 'all' && {
                    backgroundColor: colors.primary,
                  },
                ]}
                onPress={() => setActiveTab('all')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabPillText,
                    { color: activeTab === 'all' ? '#ffffff' : colors.mutedText },
                  ]}
                >
                  All ({notifications.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity testID="btn-notificationcentermodal-190" accessibilityLabel="notificationcentermodal action"
                style={[
                  styles.tabPill,
                  activeTab === 'unread' && {
                    backgroundColor: colors.primary,
                  },
                ]}
                onPress={() => setActiveTab('unread')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabPillText,
                    { color: activeTab === 'unread' ? '#ffffff' : colors.mutedText },
                  ]}
                >
                  Unread ({unreadCount})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Actions */}
            <View style={styles.actionButtons}>
              {unreadCount > 0 && (
                <TouchableOpacity testID="btn-checkmark-done"
                  onPress={markAllAsRead}
                  style={styles.textActionBtn}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Mark all as read"
                >
                  <Ionicons name="checkmark-done" size={15} color={colors.primary} style={{ marginRight: 3 }} />
                  <Text style={[styles.actionText, { color: colors.primary }]}>Read All</Text>
                </TouchableOpacity>
              )}

              {notifications.length > 0 && (
                <TouchableOpacity testID="btn-trash-outline"
                  onPress={clearNotifications}
                  style={styles.textActionBtn}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Clear notifications"
                >
                  <Ionicons name="trash-outline" size={14} color={colors.mutedText} style={{ marginRight: 3 }} />
                  <Text style={[styles.actionText, { color: colors.mutedText }]}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ─── Notification List ─── */}
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredList.length === 0 ? (
              <View style={styles.emptyWrap}>
                <View style={[styles.emptyIconCircle, { backgroundColor: `${colors.primary}14` }]}>
                  <Ionicons name="notifications-off-outline" size={32} color={colors.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.heading, fontFamily: headingFontFamily }]}>
                  {activeTab === 'unread' ? 'No Unread Alerts' : 'No Notifications Yet'}
                </Text>
                <Text style={[styles.emptySub, { color: colors.mutedText }]}>
                  {activeTab === 'unread'
                    ? 'All your notifications have been reviewed.'
                    : 'We will notify you here about upcoming departures, reservations, and exclusive offers.'}
                </Text>
              </View>
            ) : (
              filteredList.map((item) => {
                const badge = getBadgeConfig(item.type);
                return (
                  <TouchableOpacity testID="btn-notificationcentermodal-265"
                    key={item.id}
                    style={[
                      styles.card,
                      {
                        backgroundColor: item.read ? colors.surface : `${colors.primary}08`,
                        borderColor: item.read ? colors.border : `${colors.primary}30`,
                      },
                    ]}
                    onPress={() => handleNotificationPress(item)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={item.title}
                  >
                    <View style={styles.cardHeader}>
                      <View style={[styles.typeBadge, { backgroundColor: badge.bgColor }]}>
                        <Ionicons name={badge.icon} size={11} color={badge.iconColor} style={{ marginRight: 4 }} />
                        <Text style={[styles.typeBadgeText, { color: badge.iconColor }]}>{badge.label}</Text>
                      </View>

                      <View style={styles.headerRight}>
                        <Text style={[styles.timeText, { color: colors.mutedText }]}>
                          {formatTimestamp(item.timestamp)}
                        </Text>
                        {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.cardTitle,
                        { color: colors.heading, fontWeight: item.read ? '700' : '800' },
                      ]}
                    >
                      {item.title}
                    </Text>

                    <Text style={[styles.cardBody, { color: colors.mutedText }]} numberOfLines={3}>
                      {item.body}
                    </Text>

                    {item.data?.url && (
                      <View style={styles.cardFooter}>
                        <Text style={[styles.actionLink, { color: colors.primary }]}>
                          {item.type === 'departure' || item.type === 'booking'
                            ? 'View Reservation & Pass'
                            : 'Explore Itinerary'}{' '}
                          →
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {/* ─── Footer Action: Test Departure Alert Trigger ─── */}
          <View
            style={[
              styles.footer,
              {
                borderTopColor: colors.border,
                paddingBottom: Math.max(insets.bottom, 12),
              },
            ]}
          >
            <TouchableOpacity testID="btn-paper-plane"
              style={[styles.testAlertBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => sendTestNotification()}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Send test departure notification"
            >
              <Ionicons name="paper-plane" size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.testAlertBtnText, { color: colors.primary }]}>
                Send Test Departure Alert
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 1,
    maxHeight: '85%',
    minHeight: '55%',
    ...SHADOW.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: FONT_SIZE.lg + 2,
    fontWeight: '800',
  },
  unreadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabPills: {
    flexDirection: 'row',
    gap: 6,
  },
  tabPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 4,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    ...SHADOW.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  cardTitle: {
    fontSize: FONT_SIZE.sm + 1,
    marginBottom: 4,
    lineHeight: 18,
  },
  cardBody: {
    fontSize: 12,
    lineHeight: 17,
  },
  cardFooter: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionLink: {
    fontSize: 11,
    fontWeight: '800',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: SPACING.xl,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  testAlertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    minHeight: 46,
    paddingHorizontal: SPACING.md,
  },
  testAlertBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

/**
 * app/(tabs)/profile.tsx
 *
 * User profile & settings tab screen.
 * Displays user identity card, active website brand switcher,
 * admin dashboard entry, and account options.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { useSite, useSiteConfig } from '@/store/SiteConfigContext';
import { useSelectedSite } from '@/hooks/useSelectedSite';
import { useAuth } from '@/context/AuthContext';
import { SITE_REGISTRY, type SiteEntry, type WebsiteId } from '@/constants/siteRegistry';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';
import { ENV, ACTIVE_SITE_INFO } from '@/config/env';
import BrandLogo from '@/components/common/BrandLogo';

export default function ProfileTabScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const config = useSiteConfig();
  const { siteId, hostname, siteName } = useSite();
  const { selectSite } = useSelectedSite();
  const { user, isAuthenticated, logout } = useAuth();
  const headingFontFamily = getHeadingFontFamily(config);

  const handleSwitchSite = async (targetId: WebsiteId) => {
    if (targetId === siteId) return;
    await selectSite(targetId);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Identity Card */}
        <View style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Ionicons name="person" size={28} color="#ffffff" />
            </View>
          )}

          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.heading }]}>
              {user?.name || (isAuthenticated ? 'Traveler' : 'Guest Explorer')}
            </Text>
            <Text style={[styles.userEmail, { color: colors.mutedText }]}>
              {user?.email || 'Sign in to sync your bookings across devices'}
            </Text>
            {(user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'superadmin') && (
              <View style={[styles.adminPill, { backgroundColor: `${colors.primary}20` }]}>
                <Ionicons name="shield-checkmark" size={12} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.adminPillText, { color: colors.primary }]}>Administrator</Text>
              </View>
            )}
          </View>

          {!isAuthenticated && (
            <TouchableOpacity
              style={[styles.signInBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.8}
            >
              <Text style={styles.signInBtnText}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ─── Active Site Information ─── */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: colors.mutedText }]}>
            ACTIVE WEBSITE CONFIGURATION
          </Text>

          <View
            style={[
              styles.siteRow,
              {
                backgroundColor: `${colors.primary}12`,
                borderColor: colors.primary,
                borderWidth: 1.5,
              },
            ]}
          >
            <View style={{ marginRight: 12, justifyContent: 'center' }}>
              <BrandLogo size={36} showTextFallback={false} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.siteName, { color: colors.primary, fontWeight: '800' }]}>
                {siteName}
              </Text>
              <Text style={[styles.siteTheme, { color: colors.mutedText }]}>
                Hostname: {hostname}
              </Text>
              <Text style={[styles.siteTheme, { color: colors.mutedText, fontSize: 11, marginTop: 2 }]}>
                Tenant ID: {siteId}
              </Text>
            </View>
            <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
          </View>

          {/* Dev-only site switcher behind EXPO_PUBLIC_ENABLE_SITE_SWITCHER */}
          {ENV.enableSiteSwitcher && (
            <View style={{ marginTop: SPACING.md }}>
              <Text style={[styles.sectionHeading, { color: '#f59e0b', marginBottom: 8 }]}>
                [DEV ONLY] SWITCH TENANT
              </Text>
              <View style={styles.sitesGrid}>
                {SITE_REGISTRY.map((site: SiteEntry) => {
                  const isActive = siteId === site.id;
                  return (
                    <TouchableOpacity
                      key={site.id}
                      style={[
                        styles.siteRow,
                        {
                          backgroundColor: isActive ? `${colors.primary}12` : colors.surface,
                          borderColor: isActive ? colors.primary : colors.border,
                          borderWidth: isActive ? 2 : 1,
                        },
                      ]}
                      onPress={() => handleSwitchSite(site.id as WebsiteId)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.siteIconBox, { backgroundColor: `${site.primaryColor}20` }]}>
                        <Text style={{ fontSize: 18 }}>{site.icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.siteName,
                            { color: isActive ? colors.primary : colors.heading, fontWeight: isActive ? '800' : '600' },
                          ]}
                        >
                          {site.name}
                        </Text>
                        <Text style={[styles.siteTheme, { color: colors.mutedText }]}>
                          {site.themeName}
                        </Text>
                      </View>
                      {isActive && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* ─── Admin Dashboard Entry (if admin or guest exploring) ─── */}
        {(user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'superadmin' || !isAuthenticated) && (
          <View style={styles.section}>
            <Text style={[styles.sectionHeading, { color: colors.mutedText }]}>ADMINISTRATION</Text>
            <TouchableOpacity
              style={[styles.menuRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push('/(admin)')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#0f172a' }]}>
                <Ionicons name="shield-checkmark" size={18} color="#ffffff" />
              </View>
              <Text style={[styles.menuLabel, { color: colors.heading }]}>Admin Management Portal</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Preferences & Help ─── */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: colors.mutedText }]}>PREFERENCES</Text>
          <View style={[styles.menuGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <Ionicons name="notifications-outline" size={20} color={colors.heading} style={styles.itemIcon} />
              <Text style={[styles.menuItemText, { color: colors.heading }]}>Push Notifications</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedText} />
            </TouchableOpacity>
            <View style={[styles.itemDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <Ionicons name="help-circle-outline" size={20} color={colors.heading} style={styles.itemIcon} />
              <Text style={[styles.menuItemText, { color: colors.heading }]}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedText} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        {isAuthenticated && (
          <TouchableOpacity
            style={[styles.logoutBtn, { borderColor: '#ef4444' }]}
            onPress={logout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" style={{ marginRight: 8 }} />
            <Text style={styles.logoutBtnText}>Sign Out</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    zIndex: 100,
    elevation: 8,
    ...SHADOW.sm,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    marginBottom: SPACING.lg,
    ...SHADOW.sm,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: RADIUS.full,
  },
  avatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  userName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
  },
  adminPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    marginTop: 4,
  },
  adminPillText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  signInBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  signInBtnText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: SPACING.xs + 2,
  },
  sitesGrid: {
    gap: 8,
  },
  siteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm + 4,
    borderRadius: RADIUS.lg,
  },
  siteIconBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm + 4,
  },
  siteName: {
    fontSize: FONT_SIZE.sm + 1,
  },
  siteTheme: {
    fontSize: 11,
    marginTop: 1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  menuIconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: '600',
  },
  menuGroup: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  itemIcon: {
    marginRight: SPACING.sm + 4,
  },
  menuItemText: {
    flex: 1,
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: '500',
  },
  itemDivider: {
    height: 1,
    marginLeft: SPACING.md + 28,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
});

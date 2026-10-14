/**
 * components/common/AppHeader.tsx
 *
 * Universal, theme-aware application header for the ToursApp platform.
 *
 * Features:
 * - Status-bar aware with reactive light/dark theme icon synchronization.
 * - Dynamic Brand Showcase on Home: Brand logo/emblem, tenant identity, and quick actions.
 * - Single-Header Architecture: On secondary tabs (Explore, Bookings, Wishlist, Profile),
 *   renders clear screen titles with brand badge and subtitle, preventing duplicate header stacking.
 * - Inner Screen Mode: Frosted back button, cleanly truncated screen title, and contextual actions.
 * - Interactive Multi-Tenant Switcher: Tap the site badge/pill to open SiteSwitcherModal directly.
 * - Live Wishlist counter badge and user profile avatar with online indicator.
 * - Sleek elevation with hairline border and soft ambient shadow.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar as StatusBarNative,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useIsDark } from '@/store/ThemeContext';
import { useSite, useSiteConfig } from '@/store/SiteConfigContext';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';
import BrandLogo from './BrandLogo';

export interface AppHeaderProps {
  /** Screen title text */
  title?: string;
  /** Subtitle text under title */
  subtitle?: string;
  /** Whether to show the brand logo */
  showLogo?: boolean;
  /** Size preset for brand logo */
  logoSize?: 'xs' | 'sm' | 'md' | 'lg' | number;
  /** Logo width override */
  logoWidth?: number;
  /** Whether to render a back button */
  showBackButton?: boolean;
  /** Custom back button press handler */
  onBackPress?: () => void;
  /** Custom right-side actions node */
  rightActions?: React.ReactNode;
  /** Center the logo instead of aligning left */
  centerLogo?: boolean;
  /** Whether to show the search button on the right */
  showSearchButton?: boolean;
  /** Whether to show the site switcher globe/pill on the right */
  showSiteSwitcher?: boolean;
  /** Whether to show the user avatar button on the right */
  showAvatarButton?: boolean;
  /** Whether to show the wishlist heart button on the right */
  showWishlistButton?: boolean;
  /** Optional custom children rendered inside the header container */
  children?: React.ReactNode;
  /** Custom container style */
  style?: StyleProp<ViewStyle>;

  // Optional route descriptor when mounted via tab layout
  route?: {
    name?: string;
  };
}

export default function AppHeader({
  title: propTitle,
  subtitle: propSubtitle,
  showLogo = true,
  logoSize,
  logoWidth,
  showBackButton = false,
  onBackPress,
  rightActions,
  centerLogo = false,
  showSearchButton,
  showSiteSwitcher = false,
  showAvatarButton = true,
  showWishlistButton = true,
  children,
  style,
  route,
}: AppHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isDark = useIsDark();
  const config = useSiteConfig();
  const { siteId, siteName } = useSite();
  const { user } = useAuth();
  const { wishlistCount } = useWishlist();
  const headingFontFamily = getHeadingFontFamily(config);

  const routeName = route?.name;
  const isTabHome = routeName === 'index' || (!routeName && !propTitle && !showBackButton);
  const isTabExplore = routeName === 'explore';
  const isTabBookings = routeName === 'bookings';
  const isTabWishlist = routeName === 'wishlist';
  const isTabProfile = routeName === 'profile';

  // Site iconography
  const isTripGo = siteId === 'tripgoasia' || siteId === 'website2';
  const isTechno = siteId === 'technoheaven' || siteId === 'website3';
  const siteIcon = isTripGo ? '🏔️' : isTechno ? '🌴' : '✈️';

  // Safe area top padding
  const headerTopPadding = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBarNative.currentHeight ?? 24) : 16
  );

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  // Derive title & subtitle for tabs
  let displayTitle = propTitle;
  let displaySubtitle = propSubtitle;

  if (!displayTitle) {
    if (isTabExplore) {
      displayTitle = 'Explore Tours';
      displaySubtitle = `${siteName} Catalog`;
    } else if (isTabBookings) {
      displayTitle = 'My Bookings';
      displaySubtitle = 'Reservations & Tickets';
    } else if (isTabWishlist) {
      displayTitle = 'My Wishlist';
      displaySubtitle = `${wishlistCount} Saved ${wishlistCount === 1 ? 'Experience' : 'Experiences'}`;
    } else if (isTabProfile) {
      displayTitle = 'Profile & Settings';
      displaySubtitle = 'Account & Preferences';
    }
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: headerTopPadding,
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
        style,
      ]}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={styles.headerRow}>
        {/* ─── LEFT: Back Button, Brand Logo, or Screen Title ─── */}
        <View style={styles.leftGroup}>
          {showBackButton ? (
            <>
              <TouchableOpacity
                style={[
                  styles.backButton,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.05)',
                    borderColor: colors.border,
                  },
                ]}
                onPress={handleBack}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="chevron-back" size={22} color={colors.heading} />
              </TouchableOpacity>

              <View style={styles.titleColumn}>
                <Text
                  style={[
                    styles.screenTitle,
                    { color: colors.heading, fontFamily: headingFontFamily },
                  ]}
                  numberOfLines={1}
                >
                  {displayTitle || 'Detail'}
                </Text>
                {displaySubtitle && (
                  <Text style={[styles.subtitle, { color: colors.mutedText }]} numberOfLines={1}>
                    {displaySubtitle}
                  </Text>
                )}
              </View>
            </>
          ) : isTabHome ? (
            <TouchableOpacity
              style={styles.logoTouchable}
              onPress={() => router.replace('/(tabs)')}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`${siteName} home`}
            >
              <BrandLogo
                size={logoSize || 'md'}
                width={logoWidth || 140}
                showTextFallback={true}
                showTagline={true}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.tabTitleRow}>
              <View
                style={[
                  styles.screenEmblemBadge,
                  {
                    backgroundColor: `${colors.primary}18`,
                    borderColor: `${colors.primary}30`,
                  },
                ]}
              >
                <Text style={styles.screenEmblemEmoji}>{siteIcon}</Text>
              </View>
              <View style={styles.titleColumn}>
                <Text
                  style={[
                    styles.screenTitle,
                    { color: colors.heading, fontFamily: headingFontFamily },
                  ]}
                  numberOfLines={1}
                >
                  {displayTitle}
                </Text>
                {displaySubtitle && (
                  <Text style={[styles.subtitle, { color: colors.mutedText }]} numberOfLines={1}>
                    {displaySubtitle}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* ─── CENTER: Centered Logo Option ─── */}
        {showLogo && centerLogo && !showBackButton && (
          <View style={styles.centerLogoWrap}>
            <BrandLogo size={logoSize || 'md'} width={logoWidth || 135} align="center" />
          </View>
        )}

        {/* ─── RIGHT: Actions ─── */}
        <View style={styles.rightGroup}>
          {rightActions ? (
            rightActions
          ) : (
            <>

              {/* Wishlist Quick Button (Home & Explore tabs) */}
              {showWishlistButton && (isTabHome || isTabExplore) && (
                <TouchableOpacity
                  style={[
                    styles.iconButton,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.04)',
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => router.push('/(tabs)/wishlist')}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Open saved wishlist"
                >
                  <Ionicons name="heart-outline" size={19} color={colors.heading} />
                  {wishlistCount > 0 && (
                    <View style={[styles.badgePill, { backgroundColor: colors.accent || '#ef4444' }]}>
                      <Text style={styles.badgeText}>
                        {wishlistCount > 9 ? '9+' : wishlistCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}

              {/* User Avatar with Online Indicator */}
              {showAvatarButton && !isTabProfile && (
                <TouchableOpacity
                  style={styles.avatarButton}
                  onPress={() => router.push('/(tabs)/profile')}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="User profile"
                >
                  {user?.avatar ? (
                    <Image
                      source={{ uri: user.avatar }}
                      style={[styles.avatarImage, { borderColor: colors.primary }]}
                    />
                  ) : (
                    <View
                      style={[
                        styles.avatarPlaceholder,
                        {
                          backgroundColor: `${colors.primary}20`,
                          borderColor: colors.primary,
                        },
                      ]}
                    >
                      <Ionicons name="person" size={15} color={colors.primary} />
                    </View>
                  )}
                  <View style={[styles.onlineDot, { borderColor: colors.surface }]} />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 100,
    elevation: 4,
    ...SHADOW.sm,
  },
  headerRow: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.sm,
  },
  logoTouchable: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  tabTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  screenEmblemBadge: {
    width: 36,
    height: 36,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenEmblemEmoji: {
    fontSize: 18,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  titleColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 22,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
    letterSpacing: -0.1,
  },
  centerLogoWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'box-none',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgePill: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  avatarButton: {
    position: 'relative',
    marginLeft: 2,
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
    borderWidth: 2,
  },
});

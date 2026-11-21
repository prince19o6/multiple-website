/**
 * components/Navbar.tsx
 *
 * Polished, reusable top navigation bar for the ToursApp mobile application.
 *
 * Requirements satisfied:
 *   1. Left: site logo or name (from active site's config), tappable to go Home.
 *   2. Right: search shortcut, site switcher, and hamburger icon opening animated drawer.
 *   3. Inner screens: shows a prominent back button instead of logo (e.g. Tour Detail).
 *   4. Dynamic theming: all background, border, text, and active colors come from active site config.
 *   5. Safe areas: respects top safe insets for notch and status bars on iOS and Android.
 *   6. Accessible: 44px+ touch targets and screen-reader accessibility labels.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSiteConfig } from '@/store/SiteConfigContext';
import { useColors } from '@/store/ThemeContext';
import { useSelectedSite } from '@/hooks/useSelectedSite';
import { getSiteEntry } from '@/constants/siteRegistry';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';
import BrandLogo from './common/BrandLogo';
import NavDrawer from './NavDrawer';

export interface NavbarProps {
  /** Optional explicit override to force back button visibility */
  showBackButton?: boolean;
  /** Optional custom back button press handler */
  onBackPress?: () => void;
  /** Optional title override for inner screens */
  title?: string;
}

export default function Navbar({
  showBackButton,
  onBackPress,
  title,
}: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const config = useSiteConfig();
  const colors = useColors();
  const { siteId } = useSelectedSite();
  const currentSite = getSiteEntry(siteId);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const siteName = config?.name || currentSite?.label || 'Tours App';
  const logoUrl = config?.logo;
  const headingFontFamily = getHeadingFontFamily(config);

  // Automatically detect if current route is an inner screen (e.g. Tour Details)
  const isInnerScreen =
    showBackButton !== undefined
      ? showBackButton
      : pathname.includes('/tour') ||
        (pathname !== '/' &&
          pathname !== '/(tabs)' &&
          pathname !== '/(tabs)/index' &&
          pathname !== '/explore' &&
          pathname !== '/(tabs)/explore' &&
          pathname !== '/about' &&
          pathname !== '/contact');

  // Handle back button press
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

  return (
    <>
      <View
        style={[
          styles.container,
          {
            paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 10 : 8),
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.navRow}>
          {/* ─── LEFT: Back Button OR Brand Logo & Title ─── */}
          {isInnerScreen ? (
            <TouchableOpacity testID="btn-navigate"
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              accessibilityHint="Navigates to the previous screen"
            >
              <View
                style={[
                  styles.backIconBox,
                  { backgroundColor: `${colors.primary}18` },
                ]}
              >
                <Ionicons name="arrow-back" size={20} color={colors.primary} />
              </View>
              <View style={styles.backTextCol}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.backTitle,
                    { color: colors.heading, fontFamily: headingFontFamily },
                  ]}
                >
                  {title || 'Back'}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.backSubtitle, { color: colors.mutedText }]}
                >
                  {siteName}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity testID="btn-navbar-141"
              style={styles.brandRow}
              onPress={() => router.replace('/(tabs)')}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Go to ${siteName} Home`}
            >
              <BrandLogo size={32} width={140} showTextFallback={true} />
            </TouchableOpacity>
          )}

          {/* ─── RIGHT: Search, Site Switcher & Hamburger Menu ─── */}
          <View style={styles.actionRow}>
            {/* Quick Explore / Search Shortcut */}
            <TouchableOpacity testID="btn-search"
              style={styles.iconButton}
              onPress={() => router.push('/search-results' as any)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Search catalogue"
            >
              <Ionicons name="search-outline" size={22} color={colors.heading} />
            </TouchableOpacity>

            {/* Quick Switch Site Globe */}
            <TouchableOpacity testID="btn-globe-outline"
              style={[
                styles.switcherButton,
                { backgroundColor: `${colors.primary}18` },
              ]}
              onPress={() => setIsDrawerOpen(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Switch brand site"
              accessibilityHint="Opens drawer to change website"
            >
              <Ionicons name="globe-outline" size={18} color={colors.primary} />
            </TouchableOpacity>

            {/* Hamburger Drawer Trigger */}
            <TouchableOpacity testID="btn-menu-outline"
              style={styles.iconButton}
              onPress={() => setIsDrawerOpen(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Open navigation menu"
              accessibilityHint="Opens slide-in navigation drawer"
            >
              <Ionicons name="menu-outline" size={27} color={colors.heading} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ─── Animated Slide-in Drawer ─── */}
      <NavDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activePath={pathname}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    zIndex: 100,
    elevation: 8,
    ...SHADOW.sm,
  },
  navRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minHeight: 44,
    marginRight: SPACING.xs,
  },
  logoImage: {
    width: 34,
    height: 34,
    marginRight: SPACING.xs + 3,
  },
  fallbackBadge: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs + 4,
  },
  badgeEmoji: {
    fontSize: 18,
  },
  brandTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  brandName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  brandTagline: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minHeight: 44,
    marginRight: SPACING.xs,
  },
  backIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs + 4,
  },
  backTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  backTitle: {
    fontSize: FONT_SIZE.base,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  backSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switcherButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
});

/**
 * components/NavDrawer.tsx
 *
 * Polished, animated slide-in drawer menu for the multi-tenant app.
 * Powered by react-native-reanimated v4 and react-native-gesture-handler.
 *
 * Features:
 *   - Smooth 250ms slide-in animation from the right with cubic easing
 *   - Swipe-to-close pan gesture with momentum threshold
 *   - Tap-outside-to-close on dimmed backdrop
 *   - Respects device safe areas (notches/status bars)
 *   - Dynamic theming & fonts driven by active site config
 *   - Active route highlighting
 *   - Instant site switching with all 3 brands
 *   - Context-aware admin entry (Admin Login vs Admin Dashboard)
 *   - 44px minimum touch targets and accessibility semantics
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
  withSpring,
} from 'react-native-reanimated';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { storeGet } from '@/src/lib/storage';
import { useSiteConfig } from '@/store/SiteConfigContext';
import { useColors } from '@/store/ThemeContext';
import { useSelectedSite } from '@/hooks/useSelectedSite';
import {
  SITE_REGISTRY,
  type SiteEntry,
  type WebsiteId,
} from '@/constants/siteRegistry';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';
import NavItem from './NavItem';

export interface NavDrawerProps {
  /** Controls drawer visibility */
  isOpen: boolean;
  /** Callback fired when drawer requests to close */
  onClose: () => void;
  /** Currently active pathname from Expo Router */
  activePath: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function NavDrawer({
  isOpen,
  onClose,
  activePath,
}: NavDrawerProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const config = useSiteConfig();
  const colors = useColors();
  const { siteId, selectSite } = useSelectedSite();
  const headingFontFamily = getHeadingFontFamily(config);

  const [modalVisible, setModalVisible] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Compute responsive drawer width (up to 340px or 84% screen width)
  const windowWidth = Dimensions.get('window').width;
  const drawerWidth = Math.min(340, Math.floor(windowWidth * 0.84));

  // Reanimated shared values
  const translateX = useSharedValue(drawerWidth);
  const backdropOpacity = useSharedValue(0);

  // Check admin session when opening drawer
  useEffect(() => {
    if (isOpen) {
      const tenantSiteId =
        siteId === 'website2'
          ? 'tripgoasia'
          : siteId === 'website3'
          ? 'technoheaven'
          : siteId === 'website1'
          ? 'gujjutours'
          : siteId || 'gujjutours';
      storeGet('admin.token', tenantSiteId)
        .then((token) => {
          if (token && token !== 'demo-admin-token-12345') {
            setIsAdminLoggedIn(true);
          } else {
            storeGet('admin_token', tenantSiteId)
              .then((fallback) => setIsAdminLoggedIn(!!fallback && fallback !== 'demo-admin-token-12345'))
              .catch(() => setIsAdminLoggedIn(false));
          }
        })
        .catch(() => setIsAdminLoggedIn(false));
    }
  }, [isOpen, siteId]);

  // Handle open / close animation lifecycle
  useEffect(() => {
    if (isOpen) {
      setModalVisible(true);
      translateX.value = withTiming(0, {
        duration: 250,
        easing: Easing.out(Easing.cubic),
      });
      backdropOpacity.value = withTiming(0.6, {
        duration: 250,
        easing: Easing.out(Easing.cubic),
      });
    } else if (modalVisible) {
      backdropOpacity.value = withTiming(0, {
        duration: 220,
        easing: Easing.in(Easing.cubic),
      });
      translateX.value = withTiming(
        drawerWidth,
        {
          duration: 220,
          easing: Easing.in(Easing.cubic),
        },
        (finished) => {
          if (finished) {
            runOnJS(setModalVisible)(false);
          }
        }
      );
    }
  }, [isOpen, drawerWidth, modalVisible, translateX, backdropOpacity]);

  // Close smoothly with animation
  const handleClose = useCallback(() => {
    backdropOpacity.value = withTiming(0, {
      duration: 220,
      easing: Easing.in(Easing.cubic),
    });
    translateX.value = withTiming(
      drawerWidth,
      {
        duration: 220,
        easing: Easing.in(Easing.cubic),
      },
      (finished) => {
        if (finished) {
          runOnJS(onClose)();
        }
      }
    );
  }, [drawerWidth, onClose, translateX, backdropOpacity]);

  // Pan gesture: swipe to close towards the right
  const panGesture = Gesture.Pan()
    .activeOffsetX([10, -10])
    .failOffsetY([-15, 15])
    .onUpdate((event) => {
      if (event.translationX > 0) {
        translateX.value = event.translationX;
        const progress = Math.max(0, 1 - event.translationX / drawerWidth);
        backdropOpacity.value = progress * 0.6;
      }
    })
    .onEnd((event) => {
      if (event.translationX > 70 || event.velocityX > 450) {
        translateX.value = withTiming(
          drawerWidth,
          { duration: 200, easing: Easing.in(Easing.cubic) },
          (finished) => {
            if (finished) {
              runOnJS(onClose)();
            }
          }
        );
        backdropOpacity.value = withTiming(0, { duration: 200 });
      } else {
        translateX.value = withSpring(0, { damping: 18, stiffness: 220 });
        backdropOpacity.value = withTiming(0.6, { duration: 150 });
      }
    });

  const drawerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // Route navigation helper
  const navigateTo = (path: string) => {
    handleClose();
    setTimeout(() => {
      if (path === '/') {
        router.replace('/(app)');
      } else {
        router.push(path as any);
      }
    }, 150);
  };

  // Switch site handler
  const handleSwitchSite = async (targetId: WebsiteId) => {
    if (targetId === siteId) return;
    await selectSite(targetId);
  };

  // Dynamic Explore label based on brand
  const exploreLabel =
    siteId === 'website2'
      ? 'Adventures'
      : siteId === 'website3'
      ? 'Holiday Packages'
      : 'Explore Tours';

  // Navigation Links definition
  const adminIcon: keyof typeof Ionicons.glyphMap = isAdminLoggedIn
    ? 'shield-checkmark-outline'
    : 'shield-outline';

  const menuLinks: {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    path: string;
    isActive: boolean;
    badge?: string;
  }[] = [
    {
      label: 'Home',
      icon: 'home-outline',
      path: '/',
      isActive:
        activePath === '/' ||
        activePath === '/(app)' ||
        activePath === '/(app)/index',
    },
    {
      label: exploreLabel,
      icon: 'compass-outline',
      path: '/explore',
      isActive:
        activePath === '/explore' ||
        activePath.startsWith('/explore') ||
        activePath.startsWith('/(app)/explore'),
    },
    {
      label: 'About Us',
      icon: 'information-circle-outline',
      path: '/about',
      isActive:
        activePath === '/about' ||
        activePath.startsWith('/about') ||
        activePath.startsWith('/(app)/about'),
    },
    {
      label: 'Contact & Concierge',
      icon: 'mail-outline',
      path: '/contact',
      isActive:
        activePath === '/contact' ||
        activePath.startsWith('/contact') ||
        activePath.startsWith('/(app)/contact'),
    },
    {
      label: isAdminLoggedIn ? 'Admin Dashboard' : 'Admin Login',
      icon: adminIcon,
      path: isAdminLoggedIn ? '/(admin)' : '/(admin)/login',
      isActive: activePath.startsWith('/(admin)'),
      badge: isAdminLoggedIn ? 'Logged In' : undefined,
    },
  ];

  if (!modalVisible && !isOpen) {
    return null;
  }

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={styles.modalRoot}>
        {/* Dimmed backdrop (tap outside to close) */}
        <AnimatedPressable
          style={[styles.backdrop, backdropAnimatedStyle]}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close navigation drawer backdrop"
        />

        {/* Slide-in Drawer Container */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.drawer,
              {
                width: drawerWidth,
                backgroundColor: colors.surface,
                paddingTop: Math.max(insets.top, 16),
                paddingBottom: Math.max(insets.bottom, 16),
                borderLeftColor: colors.border,
              },
              drawerAnimatedStyle,
            ]}
          >
            {/* Drawer Header */}
            <View
              style={[
                styles.drawerHeader,
                { borderBottomColor: colors.border },
              ]}
            >
              <View style={styles.brandBadgeRow}>
                <View
                  style={[
                    styles.brandBadge,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Ionicons name="airplane" size={18} color="#ffffff" />
                </View>
                <View style={styles.brandTitleCol}>
                  <Text
                    style={[
                      styles.brandTitle,
                      {
                        color: colors.heading,
                        fontFamily: headingFontFamily,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {config?.name || 'Tours App'}
                  </Text>
                  <Text
                    style={[
                      styles.brandTagline,
                      { color: colors.mutedText },
                    ]}
                    numberOfLines={1}
                  >
                    {config?.tagline || 'Multi-Site Mobile Platform'}
                  </Text>
                </View>
              </View>

              {/* Close Button (min 44x44 touch target) */}
              <TouchableOpacity
                style={[
                  styles.closeButton,
                  { backgroundColor: `${colors.mutedText}14` },
                ]}
                onPress={handleClose}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Close navigation menu"
              >
                <Ionicons name="close" size={22} color={colors.heading} />
              </TouchableOpacity>
            </View>

            {/* Scrollable Menu & Site Switcher */}
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* ─── Switch Site Section ─── */}
              <View style={styles.sectionHeaderRow}>
                <Ionicons
                  name="globe-outline"
                  size={14}
                  color={colors.primary}
                  style={styles.sectionHeaderIcon}
                />
                <Text
                  style={[
                    styles.sectionHeaderLabel,
                    { color: colors.mutedText },
                  ]}
                >
                  SWITCH BRAND & THEME
                </Text>
              </View>

              <View style={styles.sitesList}>
                {SITE_REGISTRY.map((site: SiteEntry) => {
                  const isActiveSite = siteId === site.id;

                  return (
                    <TouchableOpacity
                      key={site.id}
                      style={[
                        styles.siteCard,
                        {
                          borderColor: isActiveSite
                            ? colors.primary
                            : colors.border,
                          backgroundColor: isActiveSite
                            ? `${colors.primary}12`
                            : colors.background,
                          borderWidth: isActiveSite ? 2 : 1,
                        },
                      ]}
                      onPress={() => handleSwitchSite(site.id as WebsiteId)}
                      activeOpacity={0.75}
                      accessibilityRole="button"
                      accessibilityLabel={`Switch to ${site.name}`}
                      accessibilityState={{ selected: isActiveSite }}
                    >
                      {/* Brand Dot / Icon */}
                      <View
                        style={[
                          styles.siteIconBox,
                          {
                            backgroundColor: isActiveSite
                              ? colors.primary
                              : `${site.primaryColor}22`,
                          },
                        ]}
                      >
                        <Text style={styles.siteEmoji}>{site.icon}</Text>
                      </View>

                      {/* Site Names */}
                      <View style={styles.siteInfoCol}>
                        <Text
                          style={[
                            styles.siteNameText,
                            {
                              color: isActiveSite
                                ? colors.primary
                                : colors.heading,
                              fontWeight: isActiveSite ? '800' : '600',
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {site.name}
                        </Text>
                        <Text
                          style={[
                            styles.siteTaglineText,
                            { color: colors.mutedText },
                          ]}
                          numberOfLines={1}
                        >
                          {site.themeName}
                        </Text>
                      </View>

                      {/* Active Checkmark or Radio */}
                      {isActiveSite ? (
                        <View
                          style={[
                            styles.activeCheckBadge,
                            { backgroundColor: colors.primary },
                          ]}
                        >
                          <Ionicons
                            name="checkmark"
                            size={14}
                            color="#ffffff"
                          />
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.inactiveRadioBadge,
                            { borderColor: colors.border },
                          ]}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ─── Navigation Links Section ─── */}
              <View
                style={[
                  styles.divider,
                  { backgroundColor: colors.border },
                ]}
              />

              <View style={styles.sectionHeaderRow}>
                <Ionicons
                  name="navigate-outline"
                  size={14}
                  color={colors.primary}
                  style={styles.sectionHeaderIcon}
                />
                <Text
                  style={[
                    styles.sectionHeaderLabel,
                    { color: colors.mutedText },
                  ]}
                >
                  NAVIGATION
                </Text>
              </View>

              <View style={styles.navItemsList}>
                {menuLinks.map((item, index) => (
                  <NavItem
                    key={index}
                    label={item.label}
                    icon={item.icon}
                    path={item.path}
                    isActive={item.isActive}
                    badge={item.badge}
                    fontFamily={headingFontFamily}
                    onPress={() => navigateTo(item.path)}
                  />
                ))}
              </View>
            </ScrollView>

            {/* Drawer Footer */}
            <View
              style={[
                styles.drawerFooter,
                { borderTopColor: colors.border },
              ]}
            >
              <View style={styles.footerBrandRow}>
                <View
                  style={[
                    styles.footerDot,
                    { backgroundColor: colors.primary },
                  ]}
                />
                <Text
                  style={[
                    styles.footerBrandText,
                    { color: colors.mutedText },
                  ]}
                  numberOfLines={1}
                >
                  {config?.name || 'ToursApp'} • Mobile Edition
                </Text>
              </View>
              <Text
                style={[
                  styles.footerSubText,
                  { color: colors.mutedText },
                ]}
              >
                Multi-Tenant React Native Engine
              </Text>
            </View>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#000000',
  },
  drawer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    borderLeftWidth: 1,
    ...SHADOW.lg,
  },
  drawerHeader: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
  },
  brandBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.sm,
  },
  brandBadge: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  brandTitleCol: {
    flex: 1,
  },
  brandTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  brandTagline: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs + 4,
    marginTop: SPACING.xs,
  },
  sectionHeaderIcon: {
    marginRight: 6,
  },
  sectionHeaderLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sitesList: {
    gap: SPACING.xs + 2,
    marginBottom: SPACING.md,
  },
  siteCard: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm + 4,
    borderRadius: RADIUS.md,
  },
  siteIconBox: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm + 2,
  },
  siteEmoji: {
    fontSize: 16,
  },
  siteInfoCol: {
    flex: 1,
  },
  siteNameText: {
    fontSize: FONT_SIZE.sm + 1,
    letterSpacing: -0.2,
  },
  siteTaglineText: {
    fontSize: 11,
    marginTop: 1,
  },
  activeCheckBadge: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveRadioBadge: {
    width: 20,
    height: 20,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
  },
  divider: {
    height: 1,
    marginVertical: SPACING.sm + 2,
  },
  navItemsList: {
    marginTop: SPACING.xs,
  },
  drawerFooter: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  footerDot: {
    width: 7,
    height: 7,
    borderRadius: RADIUS.full,
    marginRight: 6,
  },
  footerBrandText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footerSubText: {
    fontSize: 10,
    marginTop: 2,
  },
});

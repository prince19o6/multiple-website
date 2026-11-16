/**
 * components/navigation/CustomTabBar.tsx
 *
 * Custom themed bottom navigation tab bar for the native mobile app.
 * Replaces web-style top navbars with an Airbnb/Booking.com style dock.
 *
 * Features:
 *   - Themed icons with filled/outline states
 *   - Active tab indicator pill in site's primary brand color
 *   - Live notification badge on Bookings & Wishlist tabs
 *   - Native tactile haptic feedback on tab press (expo-haptics)
 *   - Safe-area-aware padding for iOS home indicator and Android navigation bars
 *   - 48px+ minimum touch targets with accessibility semantics
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useWishlist } from '@/context/WishlistContext';
import { useBooking } from '@/context/BookingContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTabBadgeStatus } from '@/hooks/useTabBadgeStatus';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';

export interface BottomTabBarProps {
  state: {
    routes: any[];
    index: number;
  };
  descriptors: Record<string, any>;
  navigation?: any;
  navigateToTab?: (routeKey: string) => void;
  insets?: any;
  [key: string]: any;
}

interface TabConfig {
  name: string;
  label: string;
  iconOutline: keyof typeof Ionicons.glyphMap;
  iconFilled: keyof typeof Ionicons.glyphMap;
  badgeCount?: number;
  showDot?: boolean;
  dotColor?: string;
}

export default function CustomTabBar({
  state,
  descriptors,
  navigation,
  navigateToTab,
}: BottomTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { wishlistCount } = useWishlist();
  const { upcomingCount } = useBooking();
  const { t } = useLanguage();

  const activeTabName = state.routes[state.index]?.name;
  const {
    hasUnseenWishlist,
    showWishlistDot,
    hasUnseenBookings,
    showBookingDot,
    markTabSeen,
  } = useTabBadgeStatus(activeTabName);

  const tabConfigs: Record<string, TabConfig> = {
    index: {
      name: 'index',
      label: t('nav_home', 'Home'),
      iconOutline: 'home-outline',
      iconFilled: 'home',
    },
    explore: {
      name: 'explore',
      label: t('nav_explore', 'Explore'),
      iconOutline: 'compass-outline',
      iconFilled: 'compass',
    },
    bookings: {
      name: 'bookings',
      label: t('nav_bookings', 'Bookings'),
      iconOutline: 'ticket-outline',
      iconFilled: 'ticket',
      badgeCount: hasUnseenBookings ? upcomingCount : undefined,
      showDot: showBookingDot,
      dotColor: '#ef4444', // Red dot for Bookings
    },
    wishlist: {
      name: 'wishlist',
      label: t('nav_wishlist', 'Wishlists'),
      iconOutline: 'heart-outline',
      iconFilled: 'heart',
      badgeCount: hasUnseenWishlist ? wishlistCount : undefined,
      showDot: showWishlistDot,
      dotColor: '#ef4444', // Red dot for Wishlists
    },
    profile: {
      name: 'profile',
      label: t('nav_profile', 'Account'),
      iconOutline: 'person-outline',
      iconFilled: 'person',
    },
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 12),
        },
      ]}
    >
      <View style={styles.tabRow}>
        {state.routes
          .filter((route: any) => {
            const descriptor = descriptors[route.key];
            const href = (descriptor?.options as { href?: string | null } | undefined)?.href;
            if (href === null) return false;
            return true;
          })
          .map((route: any) => {
            const descriptor = descriptors[route.key];
            const options = descriptor?.options || {};
            const isFocused = state.routes[state.index]?.key === route.key;
            const config = tabConfigs[route.name] || {
              name: route.name,
              label: options.title || route.name,
              iconOutline: 'ellipse-outline' as const,
              iconFilled: 'ellipse' as const,
            };

          const onPress = () => {
            // Native tactile feedback
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {
              // Ignore haptic errors on unsupported simulators
            }

            // Immediately mark tab as seen when pressed
            if (route.name === 'wishlist') {
              markTabSeen('wishlist');
            } else if (route.name === 'bookings') {
              markTabSeen('bookings');
            }

            let defaultPrevented = false;
            if (navigation?.emit) {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              defaultPrevented = !!event?.defaultPrevented;
            }

            if (!isFocused && !defaultPrevented) {
              if (typeof navigateToTab === 'function') {
                navigateToTab(route.key);
              } else if (navigation?.navigate) {
                navigation.navigate(route.name, route.params);
              } else {
                const targetPath = route.name === 'index' ? '/(tabs)' : `/(tabs)/${route.name}`;
                router.push(targetPath as any);
              }
            }
          };

          const onLongPress = () => {
            try {
              navigation?.emit?.({
                type: 'tabLongPress',
                target: route.key,
              });
            } catch {
              // Ignore
            }
          };

          const activeIconName = isFocused ? config.iconFilled : config.iconOutline;
          const activeColor = isFocused ? colors.primary : colors.mutedText;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={`${config.label} tab`}
              testID={`tab-${route.name}`}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              {/* Icon Container with Pill Indicator */}
              <View
                style={[
                  styles.iconContainer,
                  isFocused && {
                    backgroundColor: `${colors.primary}18`,
                  },
                ]}
              >
                <Ionicons
                  name={activeIconName}
                  size={22}
                  color={activeColor}
                />

                {/* Badge or Dot Indicator (Bookings / Wishlist) */}
                {config.badgeCount !== undefined && config.badgeCount > 0 ? (
                  <View
                    style={[
                      styles.badgeContainer,
                      { backgroundColor: '#0284c7' },
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {config.badgeCount > 99 ? '99+' : config.badgeCount}
                    </Text>
                  </View>
                ) : config.showDot ? (
                  <View
                    style={[
                      styles.dotBadge,
                      {
                        backgroundColor: config.dotColor || '#ef4444',
                        borderColor: colors.surface,
                      },
                    ]}
                  />
                ) : null}
              </View>

              {/* Tab Title Label */}
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused ? colors.primary : colors.mutedText,
                    fontWeight: isFocused ? '700' : '500',
                  },
                ]}
                numberOfLines={1}
              >
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingTop: 8,
    ...SHADOW.sm,
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 50,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingVertical: 2,
  },
  iconContainer: {
    width: 44,
    height: 30,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: FONT_SIZE.xs,
    letterSpacing: -0.1,
  },
  badgeContainer: {
    position: 'absolute',
    top: -3,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  dotBadge: {
    position: 'absolute',
    top: 1,
    right: 5,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
  },
});

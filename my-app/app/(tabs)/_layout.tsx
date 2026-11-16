/**
 * app/(tabs)/_layout.tsx
 *
 * Tab navigator layout for the native mobile application.
 * Driven dynamically by SiteConfig:
 *   - Tabs, labels, and icons are mapped from config.navigation.app.tabs.
 *   - Disabled tabs (or features.wishlist === false) receive `href: null` to hide cleanly from bottom bar.
 *   - Screen headers use the dynamic AppHeader component.
 */

import React from 'react';
import { Tabs } from 'expo-router';
import CustomTabBar from '@/components/navigation/CustomTabBar';
import AppHeader from '@/components/common/AppHeader';
import { useSiteConfig } from '@/store/SiteConfigContext';
import { isFeatureEnabled } from '@/hooks/useFeature';

export default function TabsLayout() {
  const config = useSiteConfig();
  const appTabs = config.navigation?.app?.tabs || [];

  const getTabConfig = (tabId: string, defaultLabel: string) => {
    const entry = appTabs.find((t) => t.id === tabId);
    const isRegistryEnabled = isFeatureEnabled(config, tabId, 'app');
    const isEnabled = (entry?.enabled ?? true) && isRegistryEnabled;

    return {
      label: entry?.label || defaultLabel,
      href: isEnabled ? undefined : null,
    };
  };

  const homeTab = getTabConfig('home', 'Home');
  const exploreTab = getTabConfig('explore', 'Explore');
  const bookingsTab = getTabConfig('bookings', 'Bookings');
  const wishlistTab = getTabConfig('wishlist', 'Wishlists');
  const profileTab = getTabConfig('profile', 'Account');

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...(props as any)} />}
      screenOptions={{
        headerShown: true,
        header: (props) => (
          <AppHeader
            title={props.options.headerTitle?.toString() || props.options.title}
            route={props?.route ? { name: props.route.name } : undefined}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: homeTab.href,
          title: homeTab.label,
          headerTitle: homeTab.label,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: exploreTab.href,
          title: exploreTab.label,
          headerTitle: exploreTab.label,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          href: bookingsTab.href,
          title: bookingsTab.label,
          headerTitle: bookingsTab.label,
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          href: wishlistTab.href,
          headerShown: false,
          title: wishlistTab.label,
          headerTitle: wishlistTab.label,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: profileTab.href,
          title: profileTab.label,
          headerTitle: profileTab.label,
        }}
      />
    </Tabs>
  );
}

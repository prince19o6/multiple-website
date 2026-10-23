/**
 * app/(tabs)/_layout.tsx
 *
 * Tab navigator layout for the native mobile application.
 * Configures the 5 primary tabs (Home, Explore, Bookings, Wishlist, Profile)
 * using the custom dynamic-themed bottom tab bar and unified BrandLogo AppHeader.
 */

import React from 'react';
import { Tabs } from 'expo-router';
import CustomTabBar from '@/components/navigation/CustomTabBar';
import AppHeader from '@/components/common/AppHeader';

export default function TabsLayout() {
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
          title: 'Home',
          headerTitle: 'Home',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore Tours',
          headerTitle: 'Explore Tours',
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'My Bookings',
          headerTitle: 'My Bookings',
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          href: null,
          title: 'Wishlist',
          headerTitle: 'Wishlist',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile & Settings',
          headerTitle: 'Profile & Settings',
        }}
      />
    </Tabs>
  );
}

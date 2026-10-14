/**
 * app/(app)/_layout.tsx
 *
 * Per-site layout wrapping public mobile screens.
 * Integrates:
 *   1. Navbar        — top navbar rendered via Stack screenOptions.header
 *   2. OfflineBanner — network offline notice positioned directly below the navbar
 *   3. Stack         — inner page navigation with custom header
 *
 * Note: Theme and Site providers are maintained at the root in app/_layout.tsx.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import OfflineBanner from '@/components/OfflineBanner';
import Navbar from '@/components/Navbar';

export default function AppLayout() {
  const { isOnline } = useNetworkStatus();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        header: () => (
          <View style={styles.headerWrapper}>
            <Navbar />
            {!isOnline && <OfflineBanner />}
          </View>
        ),
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="explore" />
      <Stack.Screen name="tour/[id]" />
      <Stack.Screen name="about" />
      <Stack.Screen name="contact" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerWrapper: {
    width: '100%',
  },
});

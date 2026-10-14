/**
 * app/_layout.tsx
 *
 * Root Expo Router layout.
 * Responsibilities:
 *   - Validate environment variables (EXPO_PUBLIC_SITE_HOSTNAME, EXPO_PUBLIC_API_URL)
 *   - Load Google Fonts (Inter, Poppins, Playfair Display)
 *   - Provide QueryClientProvider, SiteProvider, ThemeProvider, AuthProvider, WishlistProvider, and BookingProvider
 *   - Manage splash screen coordination
 *   - Configure root Stack navigation hierarchy
 */

import React, { useEffect, useState } from 'react';
import { Platform, LogBox } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { queryClient } from '@/store/queryClient';
import { ENV, getEnv } from '@/config/env';
import { SiteProvider } from '@/store/SiteConfigContext';
import { ThemeProvider } from '@/store/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { BookingProvider } from '@/context/BookingContext';
import EnvErrorScreen from '@/components/EnvErrorScreen';
import DevBanner from '@/components/DevBanner';

// Suppress known development-only hydration/recovery overlays, font timeouts, and HMR reconnect warnings
LogBox.ignoreLogs([
  'There was an error during concurrent rendering',
  '"shadow*" style props are deprecated',
  '12000ms timeout exceeded',
  'fontfaceobserver',
  'FontFaceObserver',
  'Cannot connect to Expo CLI',
]);

if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  const isRecoverable = (msg: unknown) => {
    if (typeof msg !== 'string') return false;
    return (
      msg.includes('concurrent rendering') ||
      msg.includes('recover by instead synchronously rendering') ||
      msg.includes('Hydration failed') ||
      msg.includes('did not match') ||
      msg.includes('"shadow*" style props are deprecated') ||
      msg.includes('12000ms timeout exceeded') ||
      msg.includes('fontfaceobserver') ||
      msg.includes('FontFaceObserver')
    );
  };

  window.addEventListener(
    'error',
    (event: ErrorEvent) => {
      const msg = event?.error?.message || event?.message || '';
      if (isRecoverable(msg)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );
}

// Keep splash visible on native platforms until initial setup completes
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <SiteProvider>
      <ThemeProvider>
        <AuthProvider>
          <WishlistProvider>
            <BookingProvider>
              <DevBanner />
              {children}
            </BookingProvider>
          </WishlistProvider>
        </AuthProvider>
      </ThemeProvider>
    </SiteProvider>
  );
}

export default function RootLayout() {
  const [envState, setEnvState] = useState(ENV);

  const [fontsLoaded, fontError] = useFonts({
    'Inter': Inter_400Regular,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Poppins': Poppins_400Regular,
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
    'Poppins-ExtraBold': Poppins_800ExtraBold,
    'Playfair Display': PlayfairDisplay_400Regular,
    'PlayfairDisplay-Regular': PlayfairDisplay_400Regular,
    'PlayfairDisplay-SemiBold': PlayfairDisplay_600SemiBold,
    'PlayfairDisplay-Bold': PlayfairDisplay_700Bold,
  });

  useEffect(() => {
    if (!envState.isValid && Platform.OS !== 'web') {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [envState.isValid]);

  // Show full-screen error if required env vars are missing or mismatched
  if (!envState.isValid) {
    return (
      <EnvErrorScreen
        missingVariables={envState.missingVariables}
        mismatchError={envState.mismatchError}
        conflictingVariables={envState.conflictingVariables}
        onRetry={() => setEnvState(getEnv())}
      />
    );
  }

  if (!fontsLoaded && !fontError && Platform.OS !== 'web') return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <RootProviders>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            {/* Main Native Bottom Tabs */}
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

            {/* Authentication Flow */}
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />

            {/* Tour & Booking Deep Screens */}
            <Stack.Screen name="tour/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="booking/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="category/[slug]" options={{ headerShown: false }} />
            <Stack.Screen name="search-results" options={{ headerShown: false }} />

            {/* Admin Portal */}
            <Stack.Screen name="(admin)" options={{ headerShown: false }} />

            {/* Modals & Fallbacks */}
            <Stack.Screen name="site-switcher" options={{ presentation: 'modal', title: 'Switch Site' }} />
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
          </Stack>
        </RootProviders>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

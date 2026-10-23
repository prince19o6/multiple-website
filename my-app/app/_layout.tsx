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
import { CurrencyProvider } from '@/context/CurrencyContext';
import EnvErrorScreen from '@/components/EnvErrorScreen';
import DevBanner from '@/components/DevBanner';
import OfflineBanner from '@/components/OfflineBanner';
import { NotificationProvider } from '@/context/NotificationContext';
import NotificationCenterModal from '@/components/NotificationCenterModal';
import { LanguageProvider } from '@/context/LanguageContext';
import LanguageModal from '@/components/LanguageModal';
import { ConciergeProvider } from '@/context/ConciergeContext';
import ConciergeChatModal from '@/components/ConciergeChatModal';
import { TravelVaultProvider } from '@/context/TravelVaultContext';
import { TripBudgetProvider } from '@/context/TripBudgetContext';
import { AudioPlayerProvider } from '@/context/AudioPlayerContext';
import { AudioMiniPlayer } from '@/components/AudioMiniPlayer';
import { PassportProvider } from '@/context/PassportContext';
import { WeatherProvider } from '@/context/WeatherContext';
import { CulinaryProvider } from '@/context/CulinaryContext';
import { DayOfDispatchProvider } from '@/context/DayOfDispatchContext';
import { GroupTripProvider } from '@/context/GroupTripContext';
import { JournalProvider } from '@/context/JournalContext';
import { FlightTransferProvider } from '@/context/FlightTransferContext';
import { PhrasebookProvider } from '@/context/PhrasebookContext';
import { TaxRefundProvider } from '@/context/TaxRefundContext';
import { EsimProvider } from '@/context/EsimContext';
import { InsuranceProvider } from '@/context/InsuranceContext';
import { VisaProvider } from '@/context/VisaContext';
import { EcoProvider } from '@/context/EcoContext';
import { CultureProvider } from '@/context/CultureContext';
import { PowerProvider } from '@/context/PowerContext';
import { BaggageProvider } from '@/context/BaggageContext';
import { TransitProvider } from '@/context/TransitContext';
import { PharmacyProvider } from '@/context/PharmacyContext';
import { TippingProvider } from '@/context/TippingContext';
import { DriveSafetyProvider } from '@/context/DriveSafetyContext';
import { ForexRadarProvider } from '@/context/ForexRadarContext';
import { BargainProvider } from '@/context/BargainContext';
import { ExpeditionSummaryProvider } from '@/context/ExpeditionSummaryContext';

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
        <LanguageProvider>
          <AuthProvider>
            <WishlistProvider>
              <BookingProvider>
                <CurrencyProvider>
                  <NotificationProvider>
                    <ConciergeProvider>
                      <TravelVaultProvider>
                        <TripBudgetProvider>
                          <AudioPlayerProvider>
                            <PassportProvider>
                              <WeatherProvider>
                                <CulinaryProvider>
                                  <DayOfDispatchProvider>
                                    <GroupTripProvider>
                                      <JournalProvider>
                                        <FlightTransferProvider>
                                          <PhrasebookProvider>
                                            <TaxRefundProvider>
                                              <EsimProvider>
                                                <InsuranceProvider>
                                                  <VisaProvider>
                                                    <EcoProvider>
                                                      <CultureProvider>
                                                        <PowerProvider>
                                                          <BaggageProvider>
                                                            <TransitProvider>
                                                              <PharmacyProvider>
                                                                <TippingProvider>
                                                                  <DriveSafetyProvider>
                                                                    <ForexRadarProvider>
                                                                      <BargainProvider>
                                                                        <ExpeditionSummaryProvider>
                                                                          <OfflineBanner />
                                                                          <DevBanner />
                                                                          <NotificationCenterModal />
                                                                          <LanguageModal />
                                                                          <ConciergeChatModal />
                                                                          <AudioMiniPlayer />
                                                                          {children}
                                                                        </ExpeditionSummaryProvider>
                                                                      </BargainProvider>
                                                                    </ForexRadarProvider>
                                                                  </DriveSafetyProvider>
                                                                </TippingProvider>
                                                              </PharmacyProvider>
                                                            </TransitProvider>
                                                          </BaggageProvider>
                                                        </PowerProvider>
                                                      </CultureProvider>
                                                    </EcoProvider>
                                                  </VisaProvider>
                                                </InsuranceProvider>
                                              </EsimProvider>
                                            </TaxRefundProvider>
                                          </PhrasebookProvider>
                                        </FlightTransferProvider>
                                      </JournalProvider>
                                    </GroupTripProvider>
                                  </DayOfDispatchProvider>
                                </CulinaryProvider>
                              </WeatherProvider>
                            </PassportProvider>
                          </AudioPlayerProvider>
                        </TripBudgetProvider>
                      </TravelVaultProvider>
                    </ConciergeProvider>
                  </NotificationProvider>
                </CurrencyProvider>
              </BookingProvider>
            </WishlistProvider>
          </AuthProvider>
        </LanguageProvider>
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
            <Stack.Screen name="group-planning" options={{ headerShown: false }} />
            <Stack.Screen name="travel-journal" options={{ headerShown: false }} />
            <Stack.Screen name="airport-transfer" options={{ headerShown: false }} />
            <Stack.Screen name="phrasebook" options={{ headerShown: false }} />
            <Stack.Screen name="tax-refund" options={{ headerShown: false }} />
            <Stack.Screen name="esim-roaming" options={{ headerShown: false }} />
            <Stack.Screen name="insurance" options={{ headerShown: false }} />
            <Stack.Screen name="visa-hub" options={{ headerShown: false }} />
            <Stack.Screen name="eco-travel" options={{ headerShown: false }} />
            <Stack.Screen name="culture-etiquette" options={{ headerShown: false }} />
            <Stack.Screen name="power-guide" options={{ headerShown: false }} />
            <Stack.Screen name="baggage-calculator" options={{ headerShown: false }} />
            <Stack.Screen name="transit-guide" options={{ headerShown: false }} />
            <Stack.Screen name="pharmacy-guide" options={{ headerShown: false }} />
            <Stack.Screen name="tipping-guide" options={{ headerShown: false }} />
            <Stack.Screen name="drive-safety" options={{ headerShown: false }} />
            <Stack.Screen name="forex-radar" options={{ headerShown: false }} />
            <Stack.Screen name="bargain-assistant" options={{ headerShown: false }} />
            <Stack.Screen name="travel-wrapped" options={{ headerShown: false }} />
            <Stack.Screen name="featured-tours" options={{ headerShown: false }} />
            <Stack.Screen name="destinations" options={{ headerShown: false }} />
            <Stack.Screen name="special-offers" options={{ headerShown: false }} />

            {/* Admin Portal */}
            <Stack.Screen name="(admin)" options={{ headerShown: false }} />

            {/* Modals & Fallbacks */}
            <Stack.Screen name="about" options={{ headerShown: false }} />
            <Stack.Screen name="contact" options={{ headerShown: false }} />
            <Stack.Screen name="site-switcher" options={{ presentation: 'modal', title: 'Switch Site' }} />
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
          </Stack>
        </RootProviders>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

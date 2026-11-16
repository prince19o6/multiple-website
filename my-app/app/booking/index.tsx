/**
 * app/booking/index.tsx
 *
 * Primary Booking Entry / Route Fallback Handler.
 * Gracefully resolves incoming booking queries (e.g. ?service=visa&destination=Thailand),
 * redirecting to specialized clearance modules (like /visa-hub) or the user's Bookings tab.
 */

import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColors } from '@/store/ThemeContext';

export default function BookingIndexScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{
    service?: string;
    destination?: string;
    type?: string;
    id?: string;
  }>();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (params.id) {
        router.replace(`/booking/${params.id}` as any);
      } else if (params.service === 'visa') {
        const destParam = params.destination ? `?destination=${encodeURIComponent(params.destination)}` : '';
        router.replace(`/visa-hub${destParam}` as any);
      } else {
        router.replace('/(tabs)/bookings' as any);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [params, router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingText, { color: colors.mutedText }]}>
        Navigating to your booking clearance...
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});

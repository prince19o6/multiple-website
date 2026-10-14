/**
 * components/OfflineBanner.tsx
 *
 * Appears at the top of the screen when NetInfo reports isOnline === false.
 * Informs the user that cached data is being displayed.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, RADIUS, FONT_SIZE } from '@/constants/theme';

import BrandLogo from './common/BrandLogo';

export default function OfflineBanner() {
  return (
    <View style={styles.banner}>
      <BrandLogo size="xs" width={75} forceDark={true} style={{ marginRight: 8 }} />
      <Ionicons name="cloud-offline-outline" size={16} color="#ffffff" style={styles.icon} />
      <Text style={styles.text}>
        You're offline. Displaying saved & cached tour content.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#b91c1c',
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  icon: {
    marginRight: SPACING.xs,
  },
  text: {
    color: '#ffffff',
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
});

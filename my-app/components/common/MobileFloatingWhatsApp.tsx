/**
 * components/common/MobileFloatingWhatsApp.tsx
 *
 * Fixed floating action button in the bottom-right corner of the mobile app.
 * Opens direct WhatsApp chat with tenant concierge / booking desk.
 */

import React from 'react';
import { TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSiteConfig } from '@/store/SiteConfigContext';
import { RADIUS, SPACING, SHADOW } from '@/constants/theme';

export function MobileFloatingWhatsApp() {
  const config = useSiteConfig();

  const phone = config.contact?.phone || '+919875095616';
  const siteName = config.name || 'Gujju Tours';
  const cleanPhone = phone.replace(/[^0-9]/g, '');

  const handlePress = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    const text = encodeURIComponent(
      `Hello ${siteName}, I need assistance planning my holiday package and booking flights/hotels.`
    );
    const appUrl = `whatsapp://send?phone=${cleanPhone}&text=${text}`;
    const webUrl = `https://wa.me/${cleanPhone}?text=${text}`;

    try {
      const supported = await Linking.canOpenURL(appUrl);
      if (supported) {
        await Linking.openURL(appUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch {
      await Linking.openURL(webUrl);
    }
  };

  return (
    <TouchableOpacity testID="btn-logo-whatsapp"
      style={[styles.floatingButton, SHADOW.lg]}
      onPress={handlePress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Chat with travel consultant on WhatsApp"
    >
      <Ionicons name="logo-whatsapp" size={26} color="#ffffff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 95 : 80,
    right: SPACING.lg,
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
});

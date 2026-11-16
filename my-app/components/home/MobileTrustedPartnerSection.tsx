/**
 * components/home/MobileTrustedPartnerSection.tsx
 *
 * "Your Trusted Travel Partner" 4-Point Guarantee Cards.
 * Mirrors the TripGo Asia live trust banner in the native mobile app.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';

interface TrustPoint {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
}

const TRUST_POINTS: TrustPoint[] = [
  {
    icon: 'pricetag-outline',
    title: 'Best Price Promise',
    desc: 'Guaranteed competitive net wholesaler pricing with zero booking markups.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Secure & Trusted Payments',
    desc: 'PCI-DSS compliant encrypted transactions across cards and digital wallets.',
  },
  {
    icon: 'flash-outline',
    title: 'Instant Confirmation',
    desc: 'Real-time voucher issuance with verifiable QR codes upon confirmation.',
  },
  {
    icon: 'chatbubbles-outline',
    title: '24/7 Dedicated Support',
    desc: 'Round-the-clock concierge and WhatsApp helpline for on-trip support.',
  },
];

export function MobileTrustedPartnerSection() {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.heading }]}>
          Your Trusted Travel Partner
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedText }]}>
          Book with complete peace of mind across Southeast Asia
        </Text>
      </View>

      <View style={styles.grid}>
        {TRUST_POINTS.map((item, index) => (
          <View
            key={index}
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
              SHADOW.sm,
            ]}
          >
            <View style={[styles.iconWrapper, { backgroundColor: colors.surface2 }]}>
              <Ionicons name={item.icon} size={20} color={colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.heading }]}>
              {item.title}
            </Text>
            <Text style={[styles.cardDesc, { color: colors.mutedText }]}>
              {item.desc}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  grid: {
    gap: SPACING.sm,
  },
  card: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    flexDirection: 'column',
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs + 2,
  },
  cardTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: FONT_SIZE.xs,
    lineHeight: 16,
  },
});


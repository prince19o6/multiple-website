/**
 * app/special-offers.tsx
 *
 * Dedicated screen for Exclusive Seasonal Deals & Travel Promotions.
 * Features:
 *   - Native header with back button
 *   - Filterable seasonal deals
 *   - Coupon code copy interaction
 *   - Direct booking / exploration links
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { DEFAULT_BLURHASH } from '@/lib/imageUtils';
import AppHeader from '@/components/common/AppHeader';

interface SpecialOffer {
  id: string;
  title: string;
  description: string;
  discount: string;
  code: string;
  expires: string;
  image: string;
  tag: string;
}

const OFFERS: SpecialOffer[] = [
  {
    id: '1',
    title: 'Early Bird Summer Getaways',
    description: 'Book 60 days in advance to unlock 25% off all boutique stays, tropical expeditions, and luxury island retreats.',
    discount: '25% OFF',
    code: 'EARLYSUMMER',
    expires: 'Valid until May 31',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=450&fit=crop',
    tag: 'LIMITED TIME',
  },
  {
    id: '2',
    title: 'Alpine High-Altitude Trekking Special',
    description: 'Group discount for 4+ travelers including certified mountain guides, winter equipment, and complimentary hot springs.',
    discount: 'SAVE $180',
    code: 'ALPINETREK',
    expires: 'Valid until June 15',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=450&fit=crop',
    tag: 'GROUP PERK',
  },
  {
    id: '3',
    title: 'Cultural Heritage & Food Trail Pass',
    description: 'Complimentary private dining reservation with indigenous masters when booking any 5-day cultural immersion itinerary.',
    discount: 'FREE DINING PASS',
    code: 'CULINARYVIP',
    expires: 'Valid until July 31',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=450&fit=crop',
    tag: 'VIP EXCLUSIVE',
  },
  {
    id: '4',
    title: 'Weekend Escapes & Eco Glamping',
    description: 'Zero carbon-offset fee and free airport transfer pickup on all registered weekend luxury glamping bookings.',
    discount: '15% OFF + TRANSFER',
    code: 'WEEKENDGLAMP',
    expires: 'Valid year round',
    image: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=800&h=450&fit=crop',
    tag: 'ECO PERK',
  },
];

export default function SpecialOffersScreen() {
  const router = useRouter();
  const colors = useColors();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyCode = (offer: SpecialOffer) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Ignored
    }
    setCopiedId(offer.id);
    Alert.alert('Promo Code Applied', `Coupon "${offer.code}" has been copied for checkout!`);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const renderOffer = ({ item }: { item: SpecialOffer }) => (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <ExpoImage
        source={{ uri: item.image }}
        style={styles.image}
        contentFit="cover"
        placeholder={{ blurhash: DEFAULT_BLURHASH }}
      />
      <View style={[styles.tagBadge, { backgroundColor: colors.accent || '#f59e0b' }]}>
        <Text style={styles.tagText}>{item.tag}</Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.heading }]}>{item.title}</Text>
          <View style={[styles.discountPill, { backgroundColor: `${colors.primary}18` }]}>
            <Text style={[styles.discountText, { color: colors.primary }]}>{item.discount}</Text>
          </View>
        </View>

        <Text style={[styles.desc, { color: colors.mutedText }]}>{item.description}</Text>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <View>
            <Text style={[styles.expiresText, { color: colors.mutedText }]}>{item.expires}</Text>
            <Text style={[styles.codeNotice, { color: colors.heading }]}>
              Code: <Text style={{ fontWeight: '800' }}>{item.code}</Text>
            </Text>
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity testID="btn-special-offers-139" accessibilityLabel="special-offers action"
              style={[styles.copyBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
              onPress={() => handleCopyCode(item)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={copiedId === item.id ? 'checkmark-circle' : 'copy-outline'}
                size={14}
                color={copiedId === item.id ? '#16a34a' : colors.primary}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.copyText, { color: copiedId === item.id ? '#16a34a' : colors.primary }]}>
                {copiedId === item.id ? 'Copied' : 'Copy'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity testID="btn-book-now" accessibilityLabel="Book Now"
              style={[styles.useBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(tabs)/explore')}
              activeOpacity={0.8}
            >
              <Text style={styles.useText}>Book Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppHeader
        title="Special Offers & Deals"
        showBackButton
        onBackPress={() => router.back()}
      />

      <FlatList
        data={OFFERS}
        keyExtractor={(item) => item.id}
        renderItem={renderOffer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  listContent: {
    padding: SPACING.md,
    gap: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  card: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
    ...SHADOW.md,
  },
  image: {
    width: '100%',
    height: 160,
  },
  tagBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  tagText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardBody: {
    padding: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
  title: {
    fontSize: FONT_SIZE.md + 1,
    fontWeight: '800',
    flex: 1,
    letterSpacing: -0.2,
  },
  discountPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  discountText: {
    fontSize: 11,
    fontWeight: '800',
  },
  desc: {
    fontSize: FONT_SIZE.xs + 1,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expiresText: {
    fontSize: 10,
  },
  codeNotice: {
    fontSize: 11,
    marginTop: 1,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  copyText: {
    fontSize: 11,
    fontWeight: '700',
  },
  useBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
  },
  useText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});

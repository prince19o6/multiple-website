/**
 * components/home/MobilePromoCarousel.tsx
 *
 * Promotional Deals & Discount Banners Slider.
 * Mirrors the promotional banner row of the reference website.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { DEFAULT_BLURHASH } from '@/lib/imageUtils';

interface PromoBanner {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  code: string;
  image: string;
  targetRoute: string;
}

const PROMO_BANNERS: PromoBanner[] = [
  {
    id: 'promo-1',
    badge: 'Limited Flash Deal',
    title: 'Dubai Megasaver Combo',
    subtitle: 'Burj Khalifa + Desert Safari + Marina Dhow Dinner',
    code: 'DUBAI20',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80',
    targetRoute: '/featured-tours',
  },
  {
    id: 'promo-2',
    badge: 'Jain Friendly Special',
    title: 'Pure Veg Group Escapes',
    subtitle: 'Dedicated Rajasthani/Gujarati chefs in Bali & Thailand',
    code: 'JAINSPECIAL',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80',
    targetRoute: '/destinations',
  },
  {
    id: 'promo-3',
    badge: 'Monsoon Getaways',
    title: 'Kerala & Kashmir Luxury',
    subtitle: 'Up to 35% off on 5-Star resort pool villas & houseboats',
    code: 'EXPLOREINDIA',
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&q=80',
    targetRoute: '/special-offers',
  },
];

export function MobilePromoCarousel() {
  const router = useRouter();
  const colors = useColors();

  const handlePress = (banner: PromoBanner) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    router.push(banner.targetRoute as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.heading }]}>Special Deals &amp; Offers</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>Hand-crafted seasonal savings</Text>
        </View>
        <TouchableOpacity testID="btn-view-all" accessibilityLabel="View All"
          onPress={() => router.push('/special-offers' as any)}
          style={styles.seeAllBtn}
        >
          <Text style={[styles.seeAllText, { color: colors.primary }]}>View All</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {PROMO_BANNERS.map((banner) => (
          <TouchableOpacity testID="btn-mobilepromocarousel-91" accessibilityLabel="mobilepromocarousel action"
            key={banner.id}
            style={[styles.bannerCard, SHADOW.md]}
            onPress={() => handlePress(banner)}
            activeOpacity={0.88}
          >
            <ExpoImage
              source={{ uri: banner.image }}
              placeholder={DEFAULT_BLURHASH}
              contentFit="cover"
              style={styles.bannerImage}
            />
            <View style={styles.gradientOverlay} />

            <View style={styles.bannerContent}>
              <View style={[styles.badgePill, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>{banner.badge}</Text>
              </View>

              <Text style={styles.bannerHeading} numberOfLines={1}>
                {banner.title}
              </Text>
              <Text style={styles.bannerSub} numberOfLines={2}>
                {banner.subtitle}
              </Text>

              <View style={styles.promoCodeRow}>
                <Text style={styles.codeLabel}>Use code:</Text>
                <View style={styles.codeTag}>
                  <Text style={styles.codeText}>{banner.code}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    marginRight: 2,
  },
  scrollList: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  bannerCard: {
    width: 290,
    height: 165,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000000',
  },
  bannerImage: {
    ...StyleSheet.absoluteFill,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.48)',
  },
  bannerContent: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'space-between',
  },
  badgePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  bannerHeading: {
    color: '#ffffff',
    fontSize: FONT_SIZE.md,
    fontWeight: '900',
    marginTop: SPACING.xs,
  },
  bannerSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: FONT_SIZE.xs - 1,
    lineHeight: 16,
    marginTop: 2,
  },
  promoCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  codeLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    marginRight: 6,
  },
  codeTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  codeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});

/**
 * components/home/MobilePerfectStaysSection.tsx
 *
 * "Perfect Stays in Dubai City" Card Slider.
 * Mirrors the PerfectStaysSection of the reference website.
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

interface HotelItem {
  id: string;
  name: string;
  area: string;
  pricePerNight: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  stars: number;
  image: string;
  tag?: string;
}

const DUBAI_HOTELS: HotelItem[] = [
  {
    id: 'al-khoory-executive-hotel',
    name: 'Al Khoory Executive Hotel',
    area: 'Al Wasl, Dubai',
    pricePerNight: 8586,
    originalPrice: 10500,
    rating: 4.6,
    reviews: 842,
    stars: 4,
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80',
    tag: 'Top Pick',
  },
  {
    id: 'grand-excelsior-hotel-bur-dubai',
    name: 'Grand Excelsior Hotel',
    area: 'Bur Dubai',
    pricePerNight: 7850,
    originalPrice: 9400,
    rating: 4.5,
    reviews: 615,
    stars: 4,
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500&q=80',
    tag: 'Jain Food Available',
  },
  {
    id: 'millennium-place-marina',
    name: 'Millennium Place Marina',
    area: 'Dubai Marina',
    pricePerNight: 14200,
    originalPrice: 18000,
    rating: 4.8,
    reviews: 1240,
    stars: 5,
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500&q=80',
    tag: 'Luxury Marina View',
  },
  {
    id: 'paramount-hotel-midtown',
    name: 'Paramount Hotel Midtown',
    area: 'Business Bay, Dubai',
    pricePerNight: 16500,
    originalPrice: 21000,
    rating: 4.9,
    reviews: 970,
    stars: 5,
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=500&q=80',
    tag: 'Rooftop Infinity Pool',
  },
];

interface MobilePerfectStaysSectionProps {
  currency?: string;
}

export function MobilePerfectStaysSection({ currency = '₹' }: MobilePerfectStaysSectionProps) {
  const router = useRouter();
  const colors = useColors();

  const handleSelectHotel = (hotel: HotelItem) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    router.push({
      pathname: '/(tabs)/explore',
      params: { category: 'hotel', search: hotel.name },
    } as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.heading }]}>
            Perfect Stays in Dubai City
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
            Hand-picked verified 4 &amp; 5-star hotels with direct wholesaler rates
          </Text>
        </View>
        <TouchableOpacity testID="btn-view-all" accessibilityLabel="View All"
          onPress={() => router.push({ pathname: '/(tabs)/explore', params: { category: 'hotel' } } as any)}
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
        {DUBAI_HOTELS.map((hotel, idx) => (
          <TouchableOpacity testID="btn-mobileperfectstayssection-126" accessibilityLabel="mobileperfectstayssection action"
            key={`stay_${hotel.id || idx}_${idx}`}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOW.md]}
            onPress={() => handleSelectHotel(hotel)}
            activeOpacity={0.85}
          >
            <View style={styles.imageContainer}>
              <ExpoImage
                source={{ uri: hotel.image }}
                placeholder={DEFAULT_BLURHASH}
                contentFit="cover"
                style={styles.hotelImage}
              />
              {hotel.tag && (
                <View style={[styles.tagBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.tagText}>{hotel.tag}</Text>
                </View>
              )}
              <View style={styles.starBadge}>
                <Text style={styles.starText}>★ {hotel.stars}</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <Text style={[styles.areaText, { color: colors.primary }]}>📍 {hotel.area}</Text>
              <Text style={[styles.hotelName, { color: colors.heading }]} numberOfLines={1}>
                {hotel.name}
              </Text>

              <View style={styles.ratingRow}>
                <View style={styles.ratingBox}>
                  <Text style={styles.ratingScore}>{hotel.rating}</Text>
                </View>
                <Text style={[styles.reviewCount, { color: colors.mutedText }]}>
                  ({hotel.reviews} reviews)
                </Text>
              </View>

              <View style={styles.priceRow}>
                <View>
                  <Text style={[styles.priceLabel, { color: colors.mutedText }]}>Starts from</Text>
                  <Text style={[styles.priceValue, { color: colors.heading }]}>
                    {currency}{hotel.pricePerNight.toLocaleString()}
                    <Text style={styles.priceNight}> / night</Text>
                  </Text>
                </View>
                <View style={[styles.bookBtn, { backgroundColor: colors.primary }]}>
                  <Text style={styles.bookBtnText}>Book</Text>
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
  card: {
    width: 240,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
  },
  imageContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
    backgroundColor: '#e2e8f0',
  },
  hotelImage: {
    width: '100%',
    height: '100%',
  },
  tagBadge: {
    position: 'absolute',
    top: SPACING.xs + 2,
    left: SPACING.xs + 2,
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  tagText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  starBadge: {
    position: 'absolute',
    top: SPACING.xs + 2,
    right: SPACING.xs + 2,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  starText: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '800',
  },
  cardBody: {
    padding: SPACING.md,
  },
  areaText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  hotelName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: 6,
  },
  ratingBox: {
    backgroundColor: '#10b981',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  ratingScore: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  reviewCount: {
    fontSize: 10,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingTop: SPACING.xs + 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  priceLabel: {
    fontSize: 9,
  },
  priceValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '900',
  },
  priceNight: {
    fontSize: 9,
    fontWeight: 'normal',
  },
  bookBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 1,
    borderRadius: RADIUS.md,
  },
  bookBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
});

/**
 * components/home/MobileCityStaysSection.tsx
 *
 * "Top Stays in Cities" Thumbnail Strip.
 * Mirrors CityStaysSection of the reference website.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { DEFAULT_BLURHASH } from '@/lib/imageUtils';

interface CityStay {
  id: string;
  name: string;
  hotelsCount: number;
  image: string;
  slug: string;
}

const TOP_CITIES: CityStay[] = [
  {
    id: 'c-dubai',
    name: 'Dubai',
    hotelsCount: 248,
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80',
    slug: 'dubai',
  },
  {
    id: 'c-singapore',
    name: 'Singapore',
    hotelsCount: 132,
    image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80',
    slug: 'singapore',
  },
  {
    id: 'c-bali',
    name: 'Bali',
    hotelsCount: 184,
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&q=80',
    slug: 'bali',
  },
  {
    id: 'c-bangkok',
    name: 'Bangkok',
    hotelsCount: 195,
    image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&q=80',
    slug: 'bangkok',
  },
  {
    id: 'c-phuket',
    name: 'Phuket',
    hotelsCount: 140,
    image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=400&q=80',
    slug: 'phuket',
  },
  {
    id: 'c-goa',
    name: 'Goa',
    hotelsCount: 210,
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&q=80',
    slug: 'goa',
  },
];

export function MobileCityStaysSection() {
  const router = useRouter();
  const colors = useColors();

  const handleCityPress = (city: CityStay) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    router.push({
      pathname: '/(tabs)/explore',
      params: { category: 'hotel', destination: city.name },
    } as any);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.heading }]}>
        Find Top Stays in Cities
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {TOP_CITIES.map((city) => (
          <TouchableOpacity testID="btn-mobilecitystayssection-95" accessibilityLabel="mobilecitystayssection action"
            key={city.id}
            style={styles.cityCard}
            onPress={() => handleCityPress(city)}
            activeOpacity={0.8}
          >
            <View style={[styles.avatarWrap, { borderColor: colors.border }, SHADOW.sm]}>
              <ExpoImage
                source={{ uri: city.image }}
                placeholder={DEFAULT_BLURHASH}
                contentFit="cover"
                style={styles.avatarImage}
              />
            </View>
            <Text style={[styles.cityName, { color: colors.heading }]} numberOfLines={1}>
              {city.name}
            </Text>
            <Text style={[styles.hotelCount, { color: colors.mutedText }]}>
              {city.hotelsCount} Stays
            </Text>
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
  sectionTitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm + 2,
  },
  scrollList: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md + 4,
  },
  cityCard: {
    alignItems: 'center',
    width: 76,
  },
  avatarWrap: {
    width: 68,
    height: 68,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    borderWidth: 2,
    marginBottom: SPACING.xs,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  cityName: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    textAlign: 'center',
  },
  hotelCount: {
    fontSize: 10,
    marginTop: 1,
    textAlign: 'center',
  },
});

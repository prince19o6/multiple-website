/**
 * components/home/MobileRegionalActivitiesSection.tsx
 *
 * Regional Activities Carousel matching TripGo Asia live mobile layout.
 * Highlights: "New" badge, "Save %" badge, crossed-out original prices, and instant booking navigation.
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

export interface MobileActivityItem {
  id: string | number;
  title: string;
  cityName?: string;
  countryName?: string;
  image: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  rating?: number;
  reviewsCount?: number;
  category?: string;
}

const DEFAULT_LANGKAWI_ACTIVITIES: MobileActivityItem[] = [
  {
    id: 'atv-langkawi-01',
    title: 'ATV Adventure Ride Langkawi',
    cityName: 'Langkawi',
    countryName: 'Malaysia',
    image: 'https://d21bqxhdty55n7.cloudfront.net/uploads/fd63c771-6a91-924c-ae5c-3a1fa5fca46b/ServiceMaster/ImageMaster/621b19a1-7788-4444-93be-08f33c3732c2_01.webp',
    price: 250,
    originalPrice: 300,
    discountPercent: 17,
    rating: 4.8,
    reviewsCount: 34,
    category: 'Adventure',
  },
  {
    id: 'cable-car-langkawi-02',
    title: 'Langkawi Cable Car & SkyBridge Pass',
    cityName: 'Langkawi',
    countryName: 'Malaysia',
    image: 'https://d21bqxhdty55n7.cloudfront.net/uploads/fd63c771-6a91-924c-ae5c-3a1fa5fca46b/ServiceMaster/ImageMaster/1118671c-dae4-4a27-a641-fc176adfcb21_01.webp',
    price: 45,
    originalPrice: 55,
    discountPercent: 18,
    rating: 4.9,
    reviewsCount: 88,
    category: 'Sightseeing',
  },
  {
    id: 'mangrove-tour-03',
    title: 'Kilim Geoforest Mangrove Boat Safari',
    cityName: 'Langkawi',
    countryName: 'Malaysia',
    image: 'https://d21bqxhdty55n7.cloudfront.net/uploads/fd63c771-6a91-924c-ae5c-3a1fa5fca46b/ServiceMaster/ImageMaster/a17112a2-4a0b-4890-8e12-3269aa123654_01.webp',
    price: 60,
    originalPrice: 75,
    discountPercent: 20,
    rating: 4.7,
    reviewsCount: 42,
    category: 'Nature',
  },
  {
    id: 'underwater-world-04',
    title: 'Underwater World Langkawi E-Ticket',
    cityName: 'Langkawi',
    countryName: 'Malaysia',
    image: 'https://d21bqxhdty55n7.cloudfront.net/uploads/fd63c771-6a91-924c-ae5c-3a1fa5fca46b/ServiceMaster/ImageMaster/5d48259b-f111-4475-b827-0e6d6c637a28_01.webp',
    price: 38,
    originalPrice: 45,
    discountPercent: 15,
    rating: 4.6,
    reviewsCount: 29,
    category: 'Family Fun',
  },
];

interface MobileRegionalActivitiesSectionProps {
  title?: string;
  items?: MobileActivityItem[];
  currency?: string;
}

export function MobileRegionalActivitiesSection({
  title = 'Best Activities in Langkawi',
  items = DEFAULT_LANGKAWI_ACTIVITIES,
  currency = '$',
}: MobileRegionalActivitiesSectionProps) {
  const router = useRouter();
  const colors = useColors();

  const handleSelectTour = (item: MobileActivityItem) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    router.push({
      pathname: '/tour/[id]',
      params: { id: String(item.id) },
    } as any);
  };

  const list = items && items.length > 0 ? items : DEFAULT_LANGKAWI_ACTIVITIES;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextGroup}>
          <Text style={[styles.sectionTitle, { color: colors.heading }]}>
            {title}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
            Instant voucher confirmation &amp; best price promise
          </Text>
        </View>
        <TouchableOpacity
          testID="btn-regional-see-all"
          accessibilityLabel={`See all tours for ${title}`}
          onPress={() => router.push({ pathname: '/(tabs)/explore', params: { category: 'tours' } } as any)}
          style={styles.seeAllBtn}
        >
          <Text style={[styles.seeAllText, { color: colors.primary }]}>View All</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Horizontal Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {list.map((item, idx) => {
          const hasDiscount = item.originalPrice && item.originalPrice > item.price;
          const discountPercent =
            item.discountPercent ||
            (hasDiscount
              ? Math.round(((item.originalPrice! - item.price) / item.originalPrice!) * 100)
              : null);

          return (
            <TouchableOpacity
              key={`reg_act_${item.id || idx}_${idx}`}
              testID={`card-activity-${item.id}`}
              accessibilityLabel={`View details for ${item.title}`}
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
                SHADOW.md,
              ]}
              onPress={() => handleSelectTour(item)}
              activeOpacity={0.88}
            >
              {/* Image Container with Badges */}
              <View style={styles.imageContainer}>
                <ExpoImage
                  source={{ uri: item.image }}
                  placeholder={DEFAULT_BLURHASH}
                  contentFit="cover"
                  style={styles.activityImage}
                />

                {/* "New" Badge */}
                <View style={styles.newBadge}>
                  <Text style={styles.badgeText}>NEW</Text>
                </View>

                {/* Discount Badge */}
                {discountPercent && discountPercent > 0 && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.badgeText}>SAVE {discountPercent}%</Text>
                  </View>
                )}

                {/* Category Chip */}
                {item.category && (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{item.category}</Text>
                  </View>
                )}
              </View>

              {/* Card Body */}
              <View style={styles.cardBody}>
                {item.cityName && (
                  <Text style={[styles.locationText, { color: colors.mutedText }]}>
                    📍 {item.cityName}, {item.countryName || 'Asia'}
                  </Text>
                )}

                <Text style={[styles.itemTitle, { color: colors.heading }]} numberOfLines={2}>
                  {item.title}
                </Text>

                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={12} color="#f59e0b" />
                  <Text style={styles.ratingText}>{item.rating || 4.8}</Text>
                  <Text style={[styles.reviewText, { color: colors.mutedText }]}>
                    ({item.reviewsCount || 24} reviews)
                  </Text>
                </View>

                {/* Price & Action Row */}
                <View style={[styles.priceRow, { borderTopColor: colors.border }]}>
                  <View>
                    {hasDiscount && (
                      <Text style={[styles.originalPrice, { color: colors.mutedText }]}>
                        {currency} {item.originalPrice}
                      </Text>
                    )}
                    <Text style={[styles.priceText, { color: colors.heading }]}>
                      {currency} {item.price}
                    </Text>
                  </View>

                  <View style={[styles.bookBtn, { backgroundColor: colors.primary }]}>
                    <Text style={styles.bookBtnText}>Book Now</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  headerTextGroup: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: SPACING.xs,
  },
  seeAllText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  scrollList: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  card: {
    width: 250,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
    backgroundColor: '#171717',
  },
  activityImage: {
    width: '100%',
    height: '100%',
  },
  newBadge: {
    position: 'absolute',
    top: SPACING.xs + 2,
    left: SPACING.xs + 2,
    backgroundColor: '#10b981',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.xs + 3,
    paddingVertical: 2,
  },
  discountBadge: {
    position: 'absolute',
    top: SPACING.xs + 2,
    right: SPACING.xs + 2,
    backgroundColor: '#ef4444',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.xs + 3,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  categoryBadge: {
    position: 'absolute',
    bottom: SPACING.xs + 2,
    left: SPACING.xs + 2,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 2,
  },
  categoryText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  cardBody: {
    padding: SPACING.sm + 2,
  },
  locationText: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    lineHeight: 18,
    minHeight: 36,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.xs,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f59e0b',
  },
  reviewText: {
    fontSize: 10,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs + 2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  originalPrice: {
    fontSize: 10,
    textDecorationLine: 'line-through',
  },
  priceText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '900',
  },
  bookBtn: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
  },
  bookBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
});


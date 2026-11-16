/**
 * components/SimilarToursSection.tsx
 *
 * Horizontal recommendation carousel of similar tours.
 * Renders dynamically on Tour Details based on matching category,
 * destination, and catalog relevance with direct navigation and wishlist toggles.
 *
 * Features:
 *   - Auto-queries backend similar endpoint with resilient catalog ranking fallback
 *   - Fully branded: dynamically adopts site colors, currency, and heading font
 *   - 44px min touch targets for cards and wishlist heart buttons
 *   - High performance ExpoImage with blurhash placeholder
 *   - Zero TypeScript any
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSimilarTours } from '@/hooks/useTours';
import { useWishlist } from '@/context/WishlistContext';
import { useColors } from '@/store/ThemeContext';
import { useSiteConfig, useSite } from '@/store/SiteConfigContext';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';
import { resolveImageUrl, PLACEHOLDER_IMAGE, DEFAULT_BLURHASH } from '@/lib/imageUtils';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import type { Tour } from '@/types';

interface SimilarToursSectionProps {
  tour: Tour;
}

export default function SimilarToursSection({ tour }: SimilarToursSectionProps) {
  const router = useRouter();
  const colors = useColors();
  const config = useSiteConfig();
  const { currency: siteCurrency } = useSite();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const { tours, isLoading } = useSimilarTours(tour, undefined, 5);

  const headingFontFamily = getHeadingFontFamily(config);
  const tourCardConfig = (config as { tourCard?: { currency?: string } } | null)?.tourCard || {};
  const currency = siteCurrency?.symbol || tourCardConfig.currency || '$';

  try {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      );
    }

    if (!tours || !Array.isArray(tours) || tours.length === 0) {
      return null;
    }

    const handleTourPress = (item: Tour) => {
      try {
        Haptics.selectionAsync();
      } catch {
        // Haptics fallback
      }
      const identifier = String(item?.slug || item?.id || '');
      if (!identifier) return;
      router.push({
        pathname: '/tour/[id]',
        params: { id: identifier },
      });
    };

    const handleWishlistToggle = (item: Tour) => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // Haptics fallback
      }
      const ident = item?.id || item?.slug || item?.name || '';
      if (!ident) return;
      toggleWishlist(
        ident,
        {
          id: item.id,
          slug: item.slug,
          name: item.name,
          title: item.name,
          description: item.description,
          price: item.price,
          rating: item.rating,
          image: item.image,
          imageUrl: item.image,
          duration: item.duration,
          difficulty: item.difficulty,
          location: item.location || item.destination,
          module: 'tours',
        },
        'tours'
      );
    };

    return (
      <View style={styles.sectionRoot}>
        {/* Section Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerTextCol}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.heading,
                  fontFamily: headingFontFamily,
                },
              ]}
            >
              Similar Expeditions
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
              Handpicked journeys that match this experience
            </Text>
          </View>
        </View>

        {/* Horizontal Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollList}
          decelerationRate="fast"
        >
          {tours.map((item, index) => {
            if (!item) return null;
            const itemId = item.id != null ? String(item.id) : '';
            const itemSlug = item.slug ? String(item.slug) : '';
            const itemName = item.name ? String(item.name) : '';
            const wishlisted = Boolean(
              (itemId && isWishlisted(itemId)) ||
              (itemSlug && isWishlisted(itemSlug)) ||
              (itemName && isWishlisted(itemName))
            );
            const rawImg = item.image || (item.gallery && item.gallery[0]);
            const imageUrl = resolveImageUrl(rawImg) || PLACEHOLDER_IMAGE;

            return (
              <View
                key={`similar_${itemId || itemSlug || index}_${index}`}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <TouchableOpacity testID="btn-similartourssection-134"
                  style={styles.cardTouchable}
                  activeOpacity={0.88}
                  onPress={() => handleTourPress(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`View ${item.name || 'Tour'}, from ${currency}${item.price || 0}`}
                >
                  {/* Card Image with Overlays */}
                  <View style={styles.imageWrapper}>
                    <ExpoImage
                      source={{ uri: imageUrl }}
                      style={styles.cardImage}
                      contentFit="cover"
                      transition={250}
                      cachePolicy="memory-disk"
                      placeholder={{ blurhash: DEFAULT_BLURHASH }}
                    />

                    {/* Rating Badge */}
                    <View style={[styles.ratingTag, { backgroundColor: colors.primary }]}>
                      <Ionicons name="star" size={11} color="#ffffff" style={{ marginRight: 3 }} />
                      <Text style={styles.ratingText}>
                        {typeof item.rating === 'number' ? item.rating.toFixed(1) : (item.rating || '4.8')}
                      </Text>
                    </View>

                    {/* Duration Pill */}
                    {Boolean(item.duration) && (
                      <View style={styles.durationTag}>
                        <Ionicons name="time-outline" size={11} color="#ffffff" style={{ marginRight: 3 }} />
                        <Text style={styles.durationText} numberOfLines={1}>
                          {item.duration}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Card Body */}
                  <View style={styles.cardBody}>
                    {Boolean(item.category) && (
                      <Text style={[styles.categoryPill, { color: colors.primary }]}>
                        {item.category?.toUpperCase()}
                      </Text>
                    )}

                    <Text
                      style={[
                        styles.tourName,
                        {
                          color: colors.heading,
                          fontFamily: headingFontFamily,
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>

                    {Boolean(item.location || item.destination) && (
                      <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={13} color={colors.mutedText} />
                        <Text style={[styles.locationText, { color: colors.mutedText }]} numberOfLines={1}>
                          {item.location || item.destination}
                        </Text>
                      </View>
                    )}

                    {/* Price & Action Row */}
                    <View style={[styles.priceRow, { borderTopColor: colors.border }]}>
                      <View>
                        <Text style={[styles.pricePrefix, { color: colors.mutedText }]}>From</Text>
                        <Text style={[styles.priceValue, { color: colors.primary }]}>
                          {currency}{typeof item.price === 'number' ? item.price.toLocaleString() : (item.price || 0)}
                        </Text>
                      </View>

                      <View style={[styles.viewDetailsBtn, { backgroundColor: `${colors.primary}15` }]}>
                        <Text style={[styles.viewDetailsText, { color: colors.primary }]}>Explore</Text>
                        <Ionicons name="arrow-forward" size={12} color={colors.primary} style={{ marginLeft: 2 }} />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Wishlist Button (44px touch target) */}
                <TouchableOpacity testID="btn-similartourssection-219"
                  style={styles.wishlistBtn}
                  onPress={() => handleWishlistToggle(item)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                >
                  <Ionicons
                    name={wishlisted ? 'heart' : 'heart-outline'}
                    size={18}
                    color={wishlisted ? '#ef4444' : '#ffffff'}
                  />
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  } catch (err) {
    console.error('[SimilarToursSection] Render error avoided:', err);
    return null;
  }
}

const styles = StyleSheet.create({
  sectionRoot: {
    marginTop: SPACING.xl + 4,
    marginBottom: SPACING.lg,
  },
  loadingContainer: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  headerTextCol: {
    gap: 3,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
  },
  scrollList: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xs,
    gap: SPACING.md,
  },
  card: {
    width: 250,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    ...SHADOW.sm,
  },
  cardTouchable: {
    width: '100%',
  },
  imageWrapper: {
    height: 145,
    width: '100%',
    position: 'relative',
    backgroundColor: '#0f172a',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  ratingTag: {
    position: 'absolute',
    top: SPACING.xs + 2,
    left: SPACING.xs + 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  ratingText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  durationTag: {
    position: 'absolute',
    bottom: SPACING.xs + 2,
    left: SPACING.xs + 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
  },
  durationText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  wishlistBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  cardBody: {
    padding: SPACING.md - 2,
    gap: 4,
  },
  categoryPill: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tourName: {
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: '700',
    lineHeight: 19,
    minHeight: 38,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  locationText: {
    fontSize: FONT_SIZE.xs - 1,
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs + 4,
    paddingTop: SPACING.xs + 2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  pricePrefix: {
    fontSize: 10,
    fontWeight: '500',
  },
  priceValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  viewDetailsText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

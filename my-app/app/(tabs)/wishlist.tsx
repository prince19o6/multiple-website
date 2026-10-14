/**
 * app/(tabs)/wishlist.tsx
 *
 * Wishlist tab screen for saved / favorited tours.
 * Features per-site local persistence and displays saved tour cards.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { useSiteConfig } from '@/store/SiteConfigContext';
import { useSelectedSite } from '@/hooks/useSelectedSite';
import { useWishlist } from '@/context/WishlistContext';
import { useTours } from '@/hooks/useTours';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';
import TourCard from '@/components/TourCard';
import AdventureTourCard from '@/components/AdventureTourCard';
import LuxuryTourCard from '@/components/LuxuryTourCard';
import { tourHref } from '@/lib/navigation';

export default function WishlistTabScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const config = useSiteConfig();
  const { siteId } = useSelectedSite();
  const { wishlistIds, wishlistCount } = useWishlist();
  const { tours } = useTours(siteId || 'website1');
  const headingFontFamily = getHeadingFontFamily(config);

  const savedTours = tours.filter((t) => wishlistIds.includes(Number(t.id)));


  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {savedTours.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconBox, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="heart-outline" size={42} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.heading, fontFamily: headingFontFamily }]}>
              Your wishlist is empty
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedText }]}>
              Tap the heart icon on any tour or expedition to bookmark your favorite places.
            </Text>
            <TouchableOpacity
              style={[styles.exploreButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(tabs)/explore')}
              activeOpacity={0.8}
            >
              <Text style={styles.exploreButtonText}>Explore Tours</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {savedTours.map((t) => {
              const href = tourHref(t);
              if (siteId === 'website2') {
                return (
                  <View key={String(t.id)} style={styles.cardWrapper}>
                    <AdventureTourCard
                      id={t.id}
                      name={t.name}
                      description={t.description}
                      price={t.price}
                      rating={t.rating}
                      image={t.image}
                      duration={t.duration}
                      difficulty={t.difficulty}
                      onBook={() => router.push(href as any)}
                      onPress={() => router.push(href as any)}
                    />
                  </View>
                );
              }
              if (siteId === 'website3') {
                return (
                  <View key={String(t.id)} style={styles.cardWrapper}>
                    <LuxuryTourCard
                      id={t.id}
                      name={t.name}
                      description={t.description}
                      price={t.price}
                      rating={t.rating}
                      image={t.image}
                      duration={t.duration}
                      location={t.location}
                      onBook={() => router.push(href as any)}
                      onPress={() => router.push(href as any)}
                      headingFontFamily={headingFontFamily}
                    />
                  </View>
                );
              }
              return (
                <View key={String(t.id)} style={styles.cardWrapper}>
                  <TourCard
                    id={t.id}
                    name={t.name}
                    description={t.description}
                    price={t.price}
                    rating={t.rating}
                    image={t.image}
                    duration={t.duration}
                    difficulty={t.difficulty}
                    onBook={() => router.push(href as any)}
                    onPress={() => router.push(href as any)}
                  />
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    zIndex: 100,
    elevation: 8,
    ...SHADOW.sm,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl + 20,
  },
  list: {
    gap: SPACING.sm,
  },
  cardWrapper: {
    marginBottom: SPACING.xs,
  },
  emptyContainer: {
    paddingVertical: SPACING.xxl + 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  emptyDesc: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  exploreButton: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    minHeight: 44,
    justifyContent: 'center',
    ...SHADOW.sm,
  },
  exploreButtonText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
});

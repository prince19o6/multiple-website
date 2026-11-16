/**
 * components/home/MobileCuratedPackagesSection.tsx
 *
 * Curated Holiday Packages Slider.
 * Mirrors CuratedPackagesSection of the reference website.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { DEFAULT_BLURHASH } from '@/lib/imageUtils';

interface PackageItem {
  id: string;
  name: string;
  duration: string;
  destination: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  badge?: string;
  highlights: string[];
}

const PACKAGES_DATA: Record<'DUBAI' | 'JAIN' | 'DOMESTIC', PackageItem[]> = {
  DUBAI: [
    {
      id: 'pkg-dubai-1',
      name: 'Dubai Grand Escapes & Desert Safari',
      duration: '5 Days / 4 Nights',
      destination: 'Dubai',
      price: 38500,
      originalPrice: 45000,
      rating: 4.9,
      reviews: 310,
      image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=500&q=80',
      badge: 'Bestseller',
      highlights: ['Burj Khalifa Top', 'Red Dune Safari', '4-Star Hotel'],
    },
    {
      id: 'pkg-dubai-2',
      name: 'Dubai & Abu Dhabi Dual Marvels',
      duration: '6 Days / 5 Nights',
      destination: 'Dubai & Abu Dhabi',
      price: 49200,
      originalPrice: 58000,
      rating: 4.8,
      reviews: 195,
      image: 'https://images.unsplash.com/photo-1546412414-e1885259563a?w=500&q=80',
      badge: 'Family Special',
      highlights: ['Grand Mosque Tour', 'Ferrari World Entry', 'Marina Cruise'],
    },
  ],
  JAIN: [
    {
      id: 'pkg-jain-1',
      name: 'Bali Island with Strictly Jain Cuisine',
      duration: '7 Days / 6 Nights',
      destination: 'Bali, Indonesia',
      price: 52000,
      originalPrice: 62000,
      rating: 4.9,
      reviews: 240,
      image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=500&q=80',
      badge: 'Pure Veg & Jain',
      highlights: ['Dedicated Gujarati Chef', 'Private Pool Villa', 'Uluwatu Sunset'],
    },
    {
      id: 'pkg-jain-2',
      name: 'Thailand Tropical Delights (Jain Plan)',
      duration: '6 Days / 5 Nights',
      destination: 'Phuket & Krabi',
      price: 44000,
      originalPrice: 51000,
      rating: 4.7,
      reviews: 180,
      image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=500&q=80',
      badge: 'Jain Catered',
      highlights: ['Speedboat Island Tour', 'Strictly No Onion/Garlic', '4-Star Resort'],
    },
  ],
  DOMESTIC: [
    {
      id: 'pkg-dom-1',
      name: 'Kashmir Paradise Valley & Gulmarg',
      duration: '6 Days / 5 Nights',
      destination: 'Kashmir',
      price: 29500,
      originalPrice: 36000,
      rating: 4.9,
      reviews: 420,
      image: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=500&q=80',
      badge: 'Top Domestic',
      highlights: ['Dal Lake Houseboat', 'Gulmarg Gondola Ride', 'Betaab Valley'],
    },
  ],
};

interface MobileCuratedPackagesSectionProps {
  currency?: string;
  onOpenEnquiry?: (pkgName: string) => void;
}

export function MobileCuratedPackagesSection({
  currency = '₹',
  onOpenEnquiry,
}: MobileCuratedPackagesSectionProps) {
  const router = useRouter();
  const colors = useColors();

  const [activeTab, setActiveTab] = useState<'DUBAI' | 'JAIN' | 'DOMESTIC'>('DUBAI');
  const items = PACKAGES_DATA[activeTab];

  const handleSelectPackage = (pkg: PackageItem) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}

    if (onOpenEnquiry) {
      onOpenEnquiry(pkg.name);
    } else {
      router.push({
        pathname: '/destinations',
        params: { destination: pkg.destination },
      } as any);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.heading }]}>Curated Holiday Packages</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>All-inclusive family &amp; couple holidays</Text>
        </View>
        <TouchableOpacity testID="btn-view-all" accessibilityLabel="View All"
          onPress={() => router.push('/destinations' as any)}
          style={styles.seeAllBtn}
        >
          <Text style={[styles.seeAllText, { color: colors.primary }]}>View All</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Package Category Filter Tabs */}
      <View style={styles.tabsRow}>
        {[
          { id: 'DUBAI', label: 'Dubai Specials' },
          { id: 'JAIN', label: 'Jain Tours' },
          { id: 'DOMESTIC', label: 'Incredible India' },
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <TouchableOpacity testID="btn-mobilecuratedpackagessection-161" accessibilityLabel="mobilecuratedpackagessection action"
              key={tab.id}
              style={[
                styles.tabPill,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                setActiveTab(tab.id as any);
                try {
                  Haptics.selectionAsync();
                } catch {}
              }}
            >
              <Text
                style={[
                  styles.tabPillText,
                  {
                    color: isSelected ? '#ffffff' : colors.heading,
                    fontWeight: isSelected ? '700' : '600',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Packages Horizontal List */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {items.map((pkg, idx) => (
          <TouchableOpacity testID="btn-mobilecuratedpackagessection-200" accessibilityLabel="mobilecuratedpackagessection action"
            key={`curated_pkg_${pkg.id || idx}_${idx}`}
            style={[styles.packageCard, { backgroundColor: colors.surface, borderColor: colors.border }, SHADOW.md]}
            onPress={() => handleSelectPackage(pkg)}
            activeOpacity={0.88}
          >
            <View style={styles.imageWrap}>
              <ExpoImage
                source={{ uri: pkg.image }}
                placeholder={DEFAULT_BLURHASH}
                contentFit="cover"
                style={styles.packageImage}
              />
              {pkg.badge && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>{pkg.badge}</Text>
                </View>
              )}
              <View style={styles.durationTag}>
                <Ionicons name="time-outline" size={12} color="#ffffff" style={{ marginRight: 3 }} />
                <Text style={styles.durationText}>{pkg.duration}</Text>
              </View>
            </View>

            <View style={styles.body}>
              <Text style={[styles.destinationLabel, { color: colors.primary }]}>
                📍 {pkg.destination}
              </Text>
              <Text style={[styles.packageName, { color: colors.heading }]} numberOfLines={2}>
                {pkg.name}
              </Text>

              {/* Highlights Chips */}
              <View style={styles.highlightsRow}>
                {pkg.highlights.map((h, i) => (
                  <View key={i} style={[styles.highlightChip, { backgroundColor: colors.background }]}>
                    <Text style={[styles.highlightText, { color: colors.mutedText }]}>✓ {h}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.footerRow}>
                <View>
                  <Text style={[styles.pricePrefix, { color: colors.mutedText }]}>Per person</Text>
                  <Text style={[styles.priceAmount, { color: colors.heading }]}>
                    {currency}{pkg.price.toLocaleString()}
                  </Text>
                </View>
                <View style={[styles.enquireBtn, { backgroundColor: colors.primary }]}>
                  <Text style={styles.enquireBtnText}>View Quote</Text>
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
    marginBottom: SPACING.xs,
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
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginVertical: SPACING.sm,
  },
  tabPill: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  tabPillText: {
    fontSize: 11,
  },
  scrollList: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  packageCard: {
    width: 270,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
  },
  imageWrap: {
    width: '100%',
    height: 145,
    position: 'relative',
    backgroundColor: '#cbd5e1',
  },
  packageImage: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: SPACING.xs + 2,
    left: SPACING.xs + 2,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  durationTag: {
    position: 'absolute',
    bottom: SPACING.xs + 2,
    right: SPACING.xs + 2,
    backgroundColor: 'rgba(0,0,0,0.65)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  durationText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  body: {
    padding: SPACING.md,
  },
  destinationLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  packageName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    marginTop: 2,
    minHeight: 38,
  },
  highlightsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginVertical: SPACING.xs + 2,
  },
  highlightChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  highlightText: {
    fontSize: 9,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs + 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  pricePrefix: {
    fontSize: 9,
  },
  priceAmount: {
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: '900',
  },
  enquireBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.md,
  },
  enquireBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
});

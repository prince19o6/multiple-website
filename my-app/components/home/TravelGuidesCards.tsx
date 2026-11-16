/**
 * components/home/TravelGuidesCards.tsx
 *
 * Horizontal scroll of curated Travel Guides & Local Lore cards for Home screen.
 * Displays high-value editorial guides (Culinary, Culture, Transit, Audio, Phrasebook, Pharmacy, Weather, Tipping)
 * with cover imagery, tags, reading times, and direct navigation.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { resolveImageUrl, DEFAULT_BLURHASH } from '@/lib/imageUtils';
import { HorizontalList } from '@/components/home/HorizontalList';

export interface TravelGuideItem {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  tagColor: string;
  icon: keyof typeof Ionicons.glyphMap;
  image: string;
  readTime: string;
  route: string;
}

export const CURATED_TRAVEL_GUIDES: TravelGuideItem[] = [
  {
    id: 'culinary',
    title: 'Food Trails & Street Secrets',
    subtitle: 'Chef-led tastings, iconic night markets & private table bookings',
    tag: 'Food & Dining',
    tagColor: '#f59e0b',
    icon: 'restaurant',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop',
    readTime: '4 min read',
    route: '/culinary-guide',
  },
  {
    id: 'culture',
    title: 'Temple Decorum & Etiquette',
    subtitle: 'Sacred site dress codes, respectful greetings & local customs',
    tag: 'Local Customs',
    tagColor: '#8b5cf6',
    icon: 'sparkles',
    image: 'https://images.unsplash.com/photo-1544971587-b842c27f8e14?w=600&h=400&fit=crop',
    readTime: '3 min read',
    route: '/culture-etiquette',
  },
  {
    id: 'transit',
    title: 'City Transit & Metro Guide',
    subtitle: 'Subway lines, airport express routes & contactless tap cards',
    tag: 'Metro & Transit',
    tagColor: '#3b82f6',
    icon: 'subway',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=600&h=400&fit=crop',
    readTime: '5 min read',
    route: '/transit-guide',
  },
  {
    id: 'audio',
    title: 'GPS Audio Walks & Lore',
    subtitle: 'Narrated monument walking tours voiced by expert local historians',
    tag: 'Audio Story',
    tagColor: '#ec4899',
    icon: 'headset',
    image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=600&h=400&fit=crop',
    readTime: 'Audio Walk',
    route: '/audio-guide',
  },
  {
    id: 'phrasebook',
    title: 'Essential Local Phrasebook',
    subtitle: 'Quick bilingual flashcards for market bargaining, taxis & ordering',
    tag: 'Phrasebook',
    tagColor: '#10b981',
    icon: 'chatbubble-ellipses',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&h=400&fit=crop',
    readTime: 'Bilingual',
    route: '/phrasebook',
  },
  {
    id: 'pharmacy',
    title: 'Pharmacy & Health Shield',
    subtitle: 'Show-to-pharmacist symptom cards & English doctor directory',
    tag: 'Health & Care',
    tagColor: '#ef4444',
    icon: 'medkit',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&h=400&fit=crop',
    readTime: 'Health Shield',
    route: '/pharmacy-guide',
  },
  {
    id: 'weather',
    title: 'Weather & Seasonal Packing',
    subtitle: 'Monthly climate projections, rainfall trends & wardrobe tips',
    tag: 'Climate & Gear',
    tagColor: '#06b6d4',
    icon: 'partly-sunny',
    image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=600&h=400&fit=crop',
    readTime: 'Forecast',
    route: '/weather-forecast',
  },
  {
    id: 'tipping',
    title: 'Tipping & Gratuity Norms',
    subtitle: 'Clear expectations for hotel porters, taxi drivers & fine dining',
    tag: 'Tipping Norms',
    tagColor: '#f97316',
    icon: 'cash',
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&h=400&fit=crop',
    readTime: '2 min read',
    route: '/tipping-guide',
  },
];

interface TravelGuidesCardsProps {
  headingFontFamily?: string;
  onPressGuide?: (guide: TravelGuideItem) => void;
}

export function TravelGuidesCards({ headingFontFamily, onPressGuide }: TravelGuidesCardsProps) {
  const router = useRouter();
  const colors = useColors();

  const handleCardPress = (guide: TravelGuideItem) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignored
    }
    if (onPressGuide) {
      onPressGuide(guide);
    } else {
      router.push(guide.route as any);
    }
  };

  const renderGuideCard = ({ item }: { item: TravelGuideItem }) => (
    <TouchableOpacity testID="btn-travelguidescards-151"
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      onPress={() => handleCardPress(item)}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.tag}`}
    >
      {/* Background Cover Image */}
      <ExpoImage
        source={{ uri: resolveImageUrl(item.image) || undefined }}
        style={styles.image}
        contentFit="cover"
        transition={250}
        cachePolicy="memory-disk"
        placeholder={{ blurhash: DEFAULT_BLURHASH }}
      />

      {/* Contrast Overlay */}
      <View style={styles.overlay} />

      {/* Top Header Pill Row */}
      <View style={styles.topRow}>
        <View style={[styles.tagPill, { backgroundColor: `${item.tagColor}e6` }]}>
          <Ionicons name={item.icon} size={11} color="#ffffff" style={{ marginRight: 4 }} />
          <Text style={styles.tagText}>{item.tag}</Text>
        </View>

        <View style={styles.arrowCircle}>
          <Ionicons name="arrow-forward" size={13} color="#ffffff" />
        </View>
      </View>

      {/* Bottom Content Area */}
      <View style={styles.bottomContent}>
        <Text
          style={[styles.guideTitle, headingFontFamily ? { fontFamily: headingFontFamily } : null]}
          numberOfLines={2}
        >
          {item.title}
        </Text>

        <Text style={styles.guideSubtitle} numberOfLines={2}>
          {item.subtitle}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.readTimeBox}>
            <Ionicons name="time-outline" size={12} color="#f8fafc" style={{ marginRight: 4 }} />
            <Text style={styles.readTimeText}>{item.readTime}</Text>
          </View>
          <Text style={styles.readLabel}>Explore Guide</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <HorizontalList<TravelGuideItem>
        data={CURATED_TRAVEL_GUIDES}
        itemWidth={240}
        keyExtractor={(item) => item.id}
        renderItem={renderGuideCard}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.xs,
  },
  card: {
    width: 240,
    height: 185,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    ...SHADOW.md,
  },
  image: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
  },
  topRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  tagText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  arrowCircle: {
    width: 26,
    height: 26,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomContent: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    zIndex: 2,
  },
  guideTitle: {
    color: '#ffffff',
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: '800',
    lineHeight: 18,
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  guideSubtitle: {
    color: 'rgba(241, 245, 249, 0.88)',
    fontSize: 11,
    lineHeight: 14,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.18)',
  },
  readTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readTimeText: {
    color: '#f8fafc',
    fontSize: 10,
    fontWeight: '600',
  },
  readLabel: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});

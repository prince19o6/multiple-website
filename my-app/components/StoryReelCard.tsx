import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { useSite } from '@/store/SiteConfigContext';
import { TripScrapbook } from '../types';

interface StoryReelCardProps {
  scrapbook: TripScrapbook;
  onShare: () => void;
  style?: object;
}

export const StoryReelCard: React.FC<StoryReelCardProps> = ({
  scrapbook,
  onShare,
  style,
}) => {
  const colors = useColors();
  const { siteId } = useSite();

  const getBrandTagline = () => {
    switch (siteId) {
      case 'tripgoasia':
        return 'Island Escapes & Southeast Asian Adventures';
      case 'technoheaven':
        return 'Bespoke Luxury & Executive VIP Expeditions';
      default:
        return 'Authentic Saurashtra Heritage & Pilgrimages';
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {/* Decorative Gold Certificate Header */}
      <View style={styles.certHeader}>
        <View style={styles.ribbonRow}>
          <Ionicons name="ribbon" size={16} color="#d97706" />
          <Text style={styles.ribbonText}>OFFICIAL EXPEDITION KEEPSAKE REEL</Text>
        </View>
        <Text style={[styles.brandTagline, { color: colors.mutedText }]}>
          {getBrandTagline()}
        </Text>
      </View>

      {/* Trip Title */}
      <Text style={[styles.tripTitle, { color: colors.heading }]}>
        {scrapbook.tourName}
      </Text>
      <Text style={[styles.destDates, { color: colors.mutedText }]}>
        📍 {scrapbook.destination} • 📅 {scrapbook.travelDates}
      </Text>

      {/* Inspirational Cultural Quote */}
      <View
        style={[
          styles.quoteBox,
          {
            backgroundColor: `${colors.primary}0D`,
            borderColor: `${colors.primary}30`,
          },
        ]}
      >
        <Ionicons name="chatbox-ellipses-outline" size={16} color={colors.primary} />
        <Text style={[styles.quoteText, { color: colors.heading }]}>
          "{scrapbook.inspirationalQuote}"
        </Text>
      </View>

      {/* Stats Summary Grid */}
      <View style={styles.statsGrid}>
        <View
          style={[
            styles.statCell,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <Ionicons name="map-outline" size={18} color={colors.primary} />
          <Text style={[styles.statValue, { color: colors.heading }]}>
            {scrapbook.stats.stopsCompleted}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedText }]}>
            Stops Visited
          </Text>
        </View>

        <View
          style={[
            styles.statCell,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <Ionicons name="camera-outline" size={18} color="#ec4899" />
          <Text style={[styles.statValue, { color: colors.heading }]}>
            {scrapbook.stats.totalPhotos}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedText }]}>
            Photos Logged
          </Text>
        </View>

        <View
          style={[
            styles.statCell,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <Ionicons name="headset-outline" size={18} color="#8b5cf6" />
          <Text style={[styles.statValue, { color: colors.heading }]}>
            {scrapbook.stats.audioStoriesPlayed}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedText }]}>
            Audio Stories
          </Text>
        </View>

        <View
          style={[
            styles.statCell,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <Ionicons name="ribbon-outline" size={18} color="#f59e0b" />
          <Text style={[styles.statValue, { color: colors.heading }]}>
            {scrapbook.stats.stampsEarned}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedText }]}>
            Passport Stamps
          </Text>
        </View>

        <View
          style={[
            styles.statCell,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <Ionicons name="navigate-outline" size={18} color="#10b981" />
          <Text style={[styles.statValue, { color: colors.heading }]}>
            {scrapbook.stats.distanceTraveledKm} km
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedText }]}>
            Distance
          </Text>
        </View>

        <View
          style={[
            styles.statCell,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <Ionicons name="restaurant-outline" size={18} color="#f97316" />
          <Text
            style={[styles.statDishValue, { color: colors.heading }]}
            numberOfLines={1}
          >
            {scrapbook.stats.signatureDish.split('&')[0].trim()}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedText }]}>
            Favorite Meal
          </Text>
        </View>
      </View>

      {/* Share Button */}
      <TouchableOpacity testID="btn-share"
        style={[styles.shareBtn, { backgroundColor: colors.primary }]}
        onPress={onShare}
        activeOpacity={0.85}
        accessibilityLabel="Share Story Reel and Keepsake Certificate"
        accessibilityRole="button"
      >
        <Ionicons name="share-social" size={18} color="#ffffff" />
        <Text style={styles.shareBtnText}>Share Story Reel & Keepsake Card</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  certHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  ribbonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  ribbonText: {
    color: '#92400e',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  brandTagline: {
    fontSize: 11,
    marginTop: 6,
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  destDates: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 14,
  },
  quoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  quoteText: {
    fontSize: 12,
    fontStyle: 'italic',
    flex: 1,
    lineHeight: 17,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCell: {
    flexBasis: '31%',
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  statDishValue: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    minHeight: 48,
  },
  shareBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

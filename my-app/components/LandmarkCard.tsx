import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { DestinationLandmark } from '../types';
import { useColors } from '@/store/ThemeContext';

interface LandmarkCardProps {
  landmark: DestinationLandmark;
  isSelected?: boolean;
  onPress: () => void;
  onOpenDetails: () => void;
}

export const LandmarkCard: React.FC<LandmarkCardProps> = ({
  landmark,
  isSelected = false,
  onPress,
  onOpenDetails,
}) => {
  const colors = useColors();

  const handleOpenDirections = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics fallback
    }

    const { latitude, longitude, title } = landmark;
    const label = encodeURIComponent(title);

    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    });

    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
    });
  };

  return (
    <TouchableOpacity testID="btn-press" accessibilityLabel="Press"
      style={[
        styles.cardContainer,
        {
          backgroundColor: colors.surface,
          borderColor: isSelected ? colors.primary : colors.border,
          borderWidth: isSelected ? 2 : 1,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.contentRow}>
        {/* Left Thumbnail */}
        <View style={styles.thumbnailWrapper}>
          <Image
            source={{ uri: landmark.imageUrl }}
            style={styles.thumbnail}
            contentFit="cover"
            transition={200}
          />
          <View style={[styles.categoryBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.categoryBadgeText} numberOfLines={1}>
              {landmark.category}
            </Text>
          </View>
        </View>

        {/* Right Info */}
        <View style={styles.infoWrapper}>
          <View style={styles.headerRow}>
            <Text style={[styles.titleText, { color: colors.heading }]} numberOfLines={1}>
              {landmark.title}
            </Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={13} color="#F59E0B" />
              <Text style={[styles.ratingText, { color: colors.heading }]}>
                {landmark.rating.toFixed(1)}
              </Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={12} color={colors.mutedText} style={{ marginRight: 3 }} />
            <Text style={[styles.locationText, { color: colors.mutedText }]} numberOfLines={1}>
              {landmark.city}, {landmark.region}
            </Text>
          </View>

          <Text style={[styles.subtitleText, { color: colors.mutedText }]} numberOfLines={2}>
            {landmark.subtitle}
          </Text>

          {/* Quick Metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Ionicons name="time-outline" size={11} color={colors.primary} style={{ marginRight: 3 }} />
              <Text style={[styles.metricText, { color: colors.text }]} numberOfLines={1}>
                {landmark.approximateVisitDuration}
              </Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Ionicons name="ticket-outline" size={11} color="#10B981" style={{ marginRight: 3 }} />
              <Text style={[styles.metricText, { color: colors.text }]} numberOfLines={1}>
                {landmark.admissionFee}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity testID="btn-navigate"
              style={[styles.directionsBtn, { backgroundColor: `${colors.primary}15` }]}
              onPress={handleOpenDirections}
              activeOpacity={0.7}
              accessibilityLabel="Get Native Directions"
            >
              <Ionicons name="navigate" size={13} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.directionsBtnText, { color: colors.primary }]}>Directions</Text>
            </TouchableOpacity>

            <TouchableOpacity testID="btn-view-details"
              style={[styles.detailsBtn, { backgroundColor: colors.primary }]}
              onPress={onOpenDetails}
              activeOpacity={0.8}
              accessibilityLabel="View Landmark Details"
            >
              <Text style={styles.detailsBtnText}>View Details</Text>
              <Ionicons name="chevron-forward" size={13} color="#FFFFFF" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: 320,
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  contentRow: {
    flexDirection: 'row',
  },
  thumbnailWrapper: {
    width: 100,
    height: 130,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginRight: 12,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  infoWrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    marginRight: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '500',
  },
  subtitleText: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metricText: {
    fontSize: 10,
    fontWeight: '600',
  },
  metricDivider: {
    width: 1,
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    flex: 1,
  },
  directionsBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    flex: 1,
  },
  detailsBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});

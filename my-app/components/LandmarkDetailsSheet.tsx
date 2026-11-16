import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  Share,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { DestinationLandmark } from '../types';
import { useSite } from '@/store/SiteConfigContext';
import { useColors } from '@/store/ThemeContext';
import { useConcierge } from '../context/ConciergeContext';
import { tourHref } from '../lib/navigation';

interface LandmarkDetailsSheetProps {
  landmark: DestinationLandmark | null;
  visible: boolean;
  onClose: () => void;
}

export const LandmarkDetailsSheet: React.FC<LandmarkDetailsSheetProps> = ({
  landmark,
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { siteName } = useSite();
  const colors = useColors();
  const { openConcierge } = useConcierge();

  if (!landmark) return null;

  const handleOpenDirections = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

  const handleShareLandmark = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        title: landmark.title,
        message: `Explore ${landmark.title} in ${landmark.city}! Highly rated waypoint (${landmark.rating}★). Found on ${siteName}.`,
      });
    } catch {
      // Share cancelled
    }
  };

  const handleAskConcierge = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics fallback
    }
    onClose();
    setTimeout(() => {
      openConcierge(
        landmark.tourId && landmark.tourName
          ? { tourId: landmark.tourId, tourName: `${landmark.title} (${landmark.tourName})` }
          : undefined
      );
    }, 200);
  };

  const handleViewTour = () => {
    if (!landmark.tourId) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics fallback
    }
    onClose();
    router.push(tourHref({ id: landmark.tourId }) as never);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {/* Top Floating Action Buttons */}
        <View style={[styles.topActionsRow, { top: Math.max(insets.top, 12) }]}>
          <TouchableOpacity testID="btn-close"
            style={[styles.floatingCircleBtn, { backgroundColor: 'rgba(0,0,0,0.55)' }]}
            onPress={onClose}
            accessibilityLabel="Close Details"
          >
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity testID="btn-share"
            style={[styles.floatingCircleBtn, { backgroundColor: 'rgba(0,0,0,0.55)' }]}
            onPress={handleShareLandmark}
            accessibilityLabel="Share Landmark"
          >
            <Ionicons name="share-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 80 }}
        >
          {/* Hero Banner */}
          <View style={styles.heroWrapper}>
            <Image
              source={{ uri: landmark.imageUrl }}
              style={styles.heroImage}
              contentFit="cover"
            />
            <View style={styles.heroGradient} />

            <View style={styles.heroBadgeRow}>
              <View style={[styles.categoryPill, { backgroundColor: colors.primary }]}>
                <Ionicons name="compass" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.categoryPillText}>{landmark.category}</Text>
              </View>

              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={14} color="#F59E0B" style={{ marginRight: 4 }} />
                <Text style={styles.ratingBadgeText}>{landmark.rating.toFixed(1)}</Text>
                <Text style={styles.reviewCountText}>({landmark.reviewCount} reviews)</Text>
              </View>
            </View>
          </View>

          {/* Core Info */}
          <View style={styles.bodyContent}>
            <Text style={[styles.title, { color: colors.heading }]}>{landmark.title}</Text>
            <View style={styles.locationMetaRow}>
              <Ionicons name="location" size={16} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.locationMetaText, { color: colors.mutedText }]}>
                {landmark.city}, {landmark.region}
              </Text>
            </View>

            <Text style={[styles.subtitle, { color: colors.text }]}>{landmark.subtitle}</Text>

            {/* Quick Metrics Grid */}
            <View style={styles.metricsGrid}>
              <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="time" size={18} color={colors.primary} />
                <Text style={[styles.metricLabel, { color: colors.mutedText }]}>Duration</Text>
                <Text style={[styles.metricValue, { color: colors.heading }]} numberOfLines={1}>
                  {landmark.approximateVisitDuration}
                </Text>
              </View>

              <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="pricetag" size={18} color="#10B981" />
                <Text style={[styles.metricLabel, { color: colors.mutedText }]}>Admission</Text>
                <Text style={[styles.metricValue, { color: colors.heading }]} numberOfLines={1}>
                  {landmark.admissionFee}
                </Text>
              </View>

              <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="calendar" size={18} color="#6366F1" />
                <Text style={[styles.metricLabel, { color: colors.mutedText }]}>Best Season</Text>
                <Text style={[styles.metricValue, { color: colors.heading }]} numberOfLines={1}>
                  {landmark.bestTimeToVisit}
                </Text>
              </View>
            </View>

            {/* Opening Hours Card */}
            <View style={[styles.detailBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.detailBoxHeader}>
                <Ionicons name="alarm-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.detailBoxTitle, { color: colors.heading }]}>Hours & Timings</Text>
              </View>
              <Text style={[styles.detailBoxBody, { color: colors.mutedText }]}>
                {landmark.openingHours}
              </Text>
            </View>

            {/* Curated Insider Tip Callout */}
            {landmark.insiderTip ? (
              <View style={[styles.insiderTipCard, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}30` }]}>
                <View style={styles.insiderTipHeader}>
                  <Ionicons name="bulb" size={18} color={colors.primary} style={{ marginRight: 6 }} />
                  <Text style={[styles.insiderTipTitle, { color: colors.primary }]}>
                    Travel Specialist Insider Tip
                  </Text>
                </View>
                <Text style={[styles.insiderTipText, { color: colors.text }]}>
                  {landmark.insiderTip}
                </Text>
              </View>
            ) : null}

            {/* Linked Tour Banner */}
            {landmark.tourId && landmark.tourName ? (
              <TouchableOpacity testID="btn-map-outline" accessibilityLabel="map outline"
                style={[styles.linkedTourCard, { backgroundColor: colors.surface, borderColor: colors.primary }]}
                onPress={handleViewTour}
                activeOpacity={0.8}
              >
                <View style={styles.linkedTourLeft}>
                  <Ionicons name="map-outline" size={20} color={colors.primary} style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.linkedTourTag, { color: colors.primary }]}>Featured in Official Tour:</Text>
                    <Text style={[styles.linkedTourName, { color: colors.heading }]} numberOfLines={1}>
                      {landmark.tourName}
                    </Text>
                  </View>
                </View>
                <Ionicons name="arrow-forward-circle" size={24} color={colors.primary} />
              </TouchableOpacity>
            ) : null}

            {/* Tags Row */}
            {landmark.tags && landmark.tags.length > 0 ? (
              <View style={styles.tagsContainer}>
                <Text style={[styles.tagsLabel, { color: colors.mutedText }]}>Highlights & Features:</Text>
                <View style={styles.tagsWrap}>
                  {landmark.tags.map((tag, idx) => (
                    <View key={`tag_${idx}`} style={[styles.tagPill, { backgroundColor: `${colors.primary}12` }]}>
                      <Text style={[styles.tagText, { color: colors.primary }]}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        </ScrollView>

        {/* Sticky Bottom Actions Bar */}
        <View
          style={[
            styles.stickyBottomBar,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 14),
            },
          ]}
        >
          <TouchableOpacity testID="btn-headset"
            style={[styles.audioGuideBtn, { backgroundColor: '#8B5CF618', borderColor: '#8B5CF6' }]}
            onPress={() => {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } catch {}
              onClose();
              router.push('/audio-guide' as never);
            }}
            activeOpacity={0.7}
            accessibilityLabel="Listen to Audio Story"
          >
            <Ionicons name="headset" size={20} color="#8B5CF6" />
          </TouchableOpacity>

          <TouchableOpacity testID="btn-chatbubbles-outline"
            style={[styles.conciergeInquiryBtn, { borderColor: colors.border }]}
            onPress={handleAskConcierge}
            activeOpacity={0.7}
            accessibilityLabel="Ask Concierge"
          >
            <Ionicons name="chatbubbles-outline" size={20} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity testID="btn-navigate"
            style={[styles.directionsActionBtn, { backgroundColor: colors.primary }]}
            onPress={handleOpenDirections}
            activeOpacity={0.85}
            accessibilityLabel="Open Native Directions"
          >
            <Ionicons name="navigate" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.directionsActionBtnText}>Directions (Google / Apple Maps)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topActionsRow: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  floatingCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroWrapper: {
    width: '100%',
    height: 280,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  heroBadgeRow: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  categoryPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  ratingBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  reviewCountText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginLeft: 4,
  },
  bodyContent: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  locationMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationMetaText: {
    fontSize: 13,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    marginTop: 18,
    gap: 10,
  },
  metricCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  detailBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  detailBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  detailBoxBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  insiderTipCard: {
    marginTop: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  insiderTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  insiderTipTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  insiderTipText: {
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  linkedTourCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  linkedTourLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  linkedTourTag: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  linkedTourName: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  tagsContainer: {
    marginTop: 18,
  },
  tagsLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  audioGuideBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  conciergeInquiryBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  directionsActionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  directionsActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

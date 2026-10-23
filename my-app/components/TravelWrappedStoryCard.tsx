import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Share,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ExpeditionWrappedStats } from '@/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TravelWrappedStoryCardProps {
  visible: boolean;
  onClose: () => void;
  stats: ExpeditionWrappedStats;
  currencySymbol: string;
}

export function TravelWrappedStoryCard({
  visible,
  onClose,
  stats,
  currencySymbol,
}: TravelWrappedStoryCardProps) {
  const [activeSlide, setActiveSlide] = useState<number>(0);
  const TOTAL_SLIDES = 4;

  useEffect(() => {
    if (visible) {
      setActiveSlide(0);
    }
  }, [visible]);

  const handleNext = () => {
    if (activeSlide < TOTAL_SLIDES - 1) {
      setActiveSlide((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (activeSlide > 0) {
      setActiveSlide((prev) => prev - 1);
    }
  };

  const handleShare = async () => {
    const message = `🌟 My ${stats.year} Travel Wrapped with ToursApp:\n✈️ ${stats.totalKmTraveled.toLocaleString()} km Traveled across ${stats.countriesVisited} Countries\n🏆 Archetype: ${stats.travelerArchetype}\n💰 Saved ${currencySymbol}${(stats.totalBargainingSavings + stats.totalVatRefundClaimed).toLocaleString()} on Bargaining & Tax Free\n🌱 ${stats.carbonOffsetKg}kg CO₂ Offset (${stats.treesPlantedEquivalent} trees planted)`;

    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(message);
        Alert.alert('Copied to Clipboard!', 'Your travel wrapped summary is ready to share.');
      } else {
        Alert.alert('Travel Wrapped 2026', message);
      }
    } else {
      try {
        await Share.share({ message });
      } catch (e) {
        console.warn('Share error:', e);
      }
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView
        style={[
          styles.container,
          {
            backgroundColor:
              activeSlide === 0
                ? '#0F172A'
                : activeSlide === 1
                ? '#064E3B'
                : activeSlide === 2
                ? '#1E1B4B'
                : '#31103F',
          },
        ]}
      >
        {/* Progress Bar Indicators */}
        <View style={styles.progressBarContainer}>
          {Array.from({ length: TOTAL_SLIDES }).map((_, idx) => (
            <View key={idx} style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: idx < activeSlide ? '100%' : idx === activeSlide ? '100%' : '0%',
                    backgroundColor: idx <= activeSlide ? '#FFD700' : 'rgba(255, 255, 255, 0.2)',
                  },
                ]}
              />
            </View>
          ))}
        </View>

        {/* Top Header */}
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <Ionicons name="sparkles" size={16} color="#FFD700" />
            <Text style={styles.brandText}>ToursApp Wrapped • {stats.year}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Main Interactive Slide Content */}
        <View style={styles.slideContent}>
          {activeSlide === 0 && (
            <View style={styles.slideInner}>
              <View style={styles.iconCircle}>
                <Ionicons name="globe-outline" size={48} color="#38BDF8" />
              </View>
              <Text style={styles.slideSubtitle}>CHAPTER 1: THE ODYSSEY</Text>
              <Text style={styles.slideMainHero}>{stats.totalKmTraveled.toLocaleString()} KM</Text>
              <Text style={styles.slideBodyDesc}>
                You explored {stats.citiesExplored} cities across {stats.countriesVisited} sovereign destinations, completing {stats.toursCompleted} certified expeditions.
              </Text>
              <View style={styles.archetypePill}>
                <Text style={styles.archetypePillLabel}>TRAVELER ARCHETYPE</Text>
                <Text style={styles.archetypePillTitle}>{stats.travelerArchetype}</Text>
              </View>
            </View>
          )}

          {activeSlide === 1 && (
            <View style={styles.slideInner}>
              <View style={styles.iconCircle}>
                <Ionicons name="shield-checkmark-outline" size={48} color="#34D399" />
              </View>
              <Text style={styles.slideSubtitle}>CHAPTER 2: FINANCIAL SHIELD</Text>
              <Text style={styles.slideMainHero}>
                {currencySymbol}
                {(stats.totalBargainingSavings + stats.totalVatRefundClaimed).toLocaleString()}
              </Text>
              <Text style={styles.slideBodyDesc}>
                Total funds shielded from tourist markups and reclaimed via official digital customs refunds.
              </Text>
              <View style={styles.breakdownCard}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Night Market Bargaining Saved</Text>
                  <Text style={styles.breakdownValue}>
                    {currencySymbol}
                    {stats.totalBargainingSavings.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Digital VAT / Tax Free Refund</Text>
                  <Text style={styles.breakdownValue}>
                    {currencySymbol}
                    {stats.totalVatRefundClaimed.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {activeSlide === 2 && (
            <View style={styles.slideInner}>
              <View style={styles.iconCircle}>
                <Ionicons name="leaf-outline" size={48} color="#4ADE80" />
              </View>
              <Text style={styles.slideSubtitle}>CHAPTER 3: ECO & CULTURE STEWARDSHIP</Text>
              <Text style={styles.slideMainHero}>{stats.carbonOffsetKg} KG</Text>
              <Text style={styles.slideBodyDesc}>
                Certified carbon dioxide neutralized through verified community reforestation and renewable energy projects.
              </Text>
              <View style={styles.breakdownCard}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Native Mangrove/Trees Planted</Text>
                  <Text style={styles.breakdownValue}>{stats.treesPlantedEquivalent} Saplings</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Audio Stories & Cultural Guides</Text>
                  <Text style={styles.breakdownValue}>{stats.audioStoriesListenedMinutes} Mins</Text>
                </View>
              </View>
            </View>
          )}

          {activeSlide === 3 && (
            <View style={styles.slideInner}>
              <View style={styles.iconCircle}>
                <Ionicons name="trophy-outline" size={48} color="#FBBF24" />
              </View>
              <Text style={styles.slideSubtitle}>CHAPTER 4: WONDERS & BADGES</Text>
              <Text style={styles.slideMainHero}>{stats.unlockedBadges.length} BADGES</Text>
              <Text style={styles.slideBodyDesc}>
                Official expedition achievements stamped into your digital travel passport:
              </Text>
              <View style={styles.badgeChipsContainer}>
                {stats.unlockedBadges.map((badge, idx) => (
                  <View key={idx} style={styles.badgeChip}>
                    <Ionicons name="ribbon" size={14} color="#FFD700" />
                    <Text style={styles.badgeChipText}>{badge}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.landmarksBox}>
                <Text style={styles.landmarksTitle}>Top Landmarks Stamped:</Text>
                <Text style={styles.landmarksList}>{stats.topLandmarksVisited.join(' • ')}</Text>
              </View>
            </View>
          )}

          {/* Left / Right Invisible Tap Zones */}
          <TouchableOpacity style={styles.leftTapZone} onPress={handlePrev} activeOpacity={1} />
          <TouchableOpacity style={styles.rightTapZone} onPress={handleNext} activeOpacity={1} />
        </View>

        {/* Bottom Bar: Slide counter & Share button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.85}>
            <Ionicons name="share-social-outline" size={18} color="#0B3B60" />
            <Text style={styles.shareButtonText}>Share Travel Wrapped</Text>
          </TouchableOpacity>
          <Text style={styles.slideCounter}>
            {activeSlide + 1} / {TOTAL_SLIDES}
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  progressBarContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 6,
  },
  progressBarTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    position: 'relative',
  },
  slideInner: {
    alignItems: 'center',
    width: '100%',
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  slideSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  slideMainHero: {
    color: '#FFD700',
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 16,
    textAlign: 'center',
  },
  slideBodyDesc: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  archetypePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    width: '100%',
  },
  archetypePillLabel: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  archetypePillTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  breakdownCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
  },
  breakdownValue: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '800',
  },
  badgeChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 16,
  },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  badgeChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  landmarksBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 12,
    width: '100%',
  },
  landmarksTitle: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  landmarksList: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    lineHeight: 18,
  },
  leftTapZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '35%',
  },
  rightTapZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '65%',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  shareButtonText: {
    color: '#0B3B60',
    fontSize: 13,
    fontWeight: '800',
  },
  slideCounter: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontWeight: '600',
  },
});

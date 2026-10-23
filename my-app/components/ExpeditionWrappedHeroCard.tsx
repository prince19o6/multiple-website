import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors, useIsDark } from '@/store/ThemeContext';
import { useExpeditionSummary } from '@/context/ExpeditionSummaryContext';

interface ExpeditionWrappedHeroCardProps {
  style?: StyleProp<ViewStyle>;
}

export function ExpeditionWrappedHeroCard({ style }: ExpeditionWrappedHeroCardProps) {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDark();
  const { hubData, openStoryModal } = useExpeditionSummary();

  const wrapped = hubData?.wrapped;
  const loyalty = hubData?.loyalty;
  const currencySymbol = hubData?.currencySymbol || '฿';

  if (!wrapped) return null;

  const totalSaved = (wrapped.totalBargainingSavings || 0) + (wrapped.totalVatRefundClaimed || 0);

  const handleCardPress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    router.push('/travel-wrapped' as never);
  };

  const handlePlayReel = (e: any) => {
    e.stopPropagation?.();
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    openStoryModal(0);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#111827' : '#0F2C59',
          borderColor: isDark ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.2)',
        },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={handleCardPress}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel="Open Travel Wrapped 2026 and VIP Loyalty Hub"
      >
        {/* Top Banner Row */}
        <View style={styles.topRow}>
          <View style={styles.badgePill}>
            <Ionicons name="sparkles" size={13} color="#FFD700" />
            <Text style={styles.badgeText}>{wrapped.year} TRAVEL WRAPPED</Text>
          </View>

          {loyalty && (
            <View style={styles.loyaltyPill}>
              <Text style={styles.loyaltyText}>
                {loyalty.tierBadgeEmoji} {loyalty.currentTier}
              </Text>
            </View>
          )}
        </View>

        {/* Main Title & Archetype */}
        <Text style={styles.title}>Your 2026 Expedition Odyssey</Text>
        <Text style={styles.archetypeText}>
          {wrapped.travelerArchetype} • {wrapped.travelerName}
        </Text>

        {/* 3 Highlights Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{wrapped.totalKmTraveled.toLocaleString()} km</Text>
            <Text style={styles.statLabel}>Traversed</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{wrapped.toursCompleted}</Text>
            <Text style={styles.statLabel}>Expeditions</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {currencySymbol}
              {totalSaved.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Saved & Reclaimed</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Footer CTA */}
      <View style={styles.footerRow}>
        <TouchableOpacity
          style={styles.playReelBtn}
          onPress={handlePlayReel}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Play Story Reel"
        >
          <Ionicons name="play-circle" size={18} color="#0B3B60" />
          <Text style={styles.playReelText}>Play Story Reel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.viewMoreRow}
          onPress={handleCardPress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="View VIP Club and Diploma"
        >
          <Text style={styles.viewMoreText}>VIP Club & Diploma</Text>
          <Ionicons name="chevron-forward" size={16} color="#FFD700" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 16,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  badgeText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  loyaltyPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  loyaltyText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  archetypeText: {
    fontSize: 12,
    color: '#4ADE80',
    fontWeight: '700',
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statNumber: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 10,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  playReelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFD700',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  playReelText: {
    color: '#0B3B60',
    fontSize: 12,
    fontWeight: '800',
  },
  viewMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewMoreText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
  },
});

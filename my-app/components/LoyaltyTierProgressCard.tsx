import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useIsDark } from '@/store/ThemeContext';
import type { LoyaltyTierData } from '@/types';

interface LoyaltyTierProgressCardProps {
  loyalty: LoyaltyTierData;
  onOpenReview: () => void;
}

export function LoyaltyTierProgressCard({ loyalty, onOpenReview }: LoyaltyTierProgressCardProps) {
  const colors = useColors();
  const isDark = useIsDark();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255, 215, 0, 0.3)' : 'rgba(218, 165, 32, 0.3)',
        },
      ]}
    >
      {/* Header with Member ID & Tier Badge */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.memberId, { color: colors.mutedText }]}>{loyalty.memberId}</Text>
          <View style={styles.tierRow}>
            <Text style={styles.tierEmoji}>{loyalty.tierBadgeEmoji}</Text>
            <Text style={[styles.tierName, { color: isDark ? '#FFD700' : '#B45309' }]}>
              {loyalty.currentTier}
            </Text>
          </View>
        </View>

        <View style={styles.multiplierPill}>
          <Ionicons name="flash" size={12} color="#FFFFFF" />
          <Text style={styles.multiplierText}>{loyalty.multiplierBadge}</Text>
        </View>
      </View>

      {/* Points & Progress Meter */}
      <View style={styles.pointsContainer}>
        <View>
          <Text style={[styles.pointsLabel, { color: colors.mutedText }]}>CURRENT BALANCE</Text>
          <Text style={[styles.pointsValue, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            {loyalty.currentPoints.toLocaleString()} <Text style={styles.ptsUnit}>PTS</Text>
          </Text>
        </View>

        {loyalty.pointsToNextTier > 0 && (
          <View style={styles.nextTierInfo}>
            <Text style={[styles.nextTierLabel, { color: colors.mutedText }]}>
              {loyalty.pointsToNextTier.toLocaleString()} pts to
            </Text>
            <Text style={[styles.nextTierName, { color: colors.primary }]}>{loyalty.nextTierName}</Text>
          </View>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(100, loyalty.progressPercentage)}%` }]} />
      </View>
      <Text style={[styles.progressPercentText, { color: colors.mutedText }]}>
        {loyalty.progressPercentage}% Completed to {loyalty.nextTierName}
      </Text>

      {/* VIP Perks List */}
      <View style={styles.perksSection}>
        <Text style={[styles.perksHeader, { color: colors.heading }]}>VIP Club Privileges</Text>
        {loyalty.perks.map((perk, idx) => (
          <View key={idx} style={styles.perkRow}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={[styles.perkText, { color: colors.mutedText }]}>{perk}</Text>
          </View>
        ))}
      </View>

      {/* Review Booster Action */}
      <TouchableOpacity style={styles.boosterButton} onPress={onOpenReview} activeOpacity={0.85}>
        <Ionicons name="gift-outline" size={18} color="#FFFFFF" />
        <Text style={styles.boosterText}>Write Trip Reflection for +250 Bonus Pts</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  memberId: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  tierEmoji: {
    fontSize: 18,
  },
  tierName: {
    fontSize: 18,
    fontWeight: '800',
  },
  multiplierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F59E0B',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  multiplierText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  pointsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  pointsLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  ptsUnit: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
  },
  nextTierInfo: {
    alignItems: 'flex-end',
  },
  nextTierLabel: {
    fontSize: 11,
  },
  nextTierName: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  progressPercentText: {
    fontSize: 11,
    marginBottom: 16,
    fontWeight: '500',
  },
  perksSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    paddingTop: 14,
    marginBottom: 16,
    gap: 8,
  },
  perksHeader: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  perkText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  boosterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0F766E',
    paddingVertical: 12,
    borderRadius: 12,
  },
  boosterText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

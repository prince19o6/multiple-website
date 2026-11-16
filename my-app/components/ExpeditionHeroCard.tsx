import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useIsDark } from '@/store/ThemeContext';
import type { ExpeditionWrappedStats } from '@/types';

interface ExpeditionHeroCardProps {
  stats: ExpeditionWrappedStats;
  currencySymbol: string;
  onPlayStories: () => void;
  onOpenCertificate: () => void;
  onOpenReview: () => void;
}

export function ExpeditionHeroCard({
  stats,
  currencySymbol,
  onPlayStories,
  onOpenCertificate,
  onOpenReview,
}: ExpeditionHeroCardProps) {
  const colors = useColors();
  const isDark = useIsDark();

  const totalSavings = (stats.totalBargainingSavings || 0) + (stats.totalVatRefundClaimed || 0);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#141E30' : '#0B3B60',
          borderColor: isDark ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.2)',
        },
      ]}
    >
      {/* Top Header Badge */}
      <View style={styles.headerRow}>
        <View style={styles.badgePill}>
          <Ionicons name="sparkles" size={14} color="#FFD700" />
          <Text style={styles.badgeText}>{stats.year} TRAVEL WRAPPED</Text>
        </View>
        <TouchableOpacity testID="btn-ribbon-outline" accessibilityLabel="ribbon outline" style={styles.certButton} onPress={onOpenCertificate} activeOpacity={0.8}>
          <Ionicons name="ribbon-outline" size={16} color="#FFD700" />
          <Text style={styles.certButtonText}>Honorary Diploma</Text>
        </TouchableOpacity>
      </View>

      {/* Main Title & Archetype */}
      <Text style={styles.travelerName}>Expedition of {stats.travelerName}</Text>
      <View style={styles.archetypeContainer}>
        <Ionicons name="compass-outline" size={16} color="#4ADE80" />
        <Text style={styles.archetypeText}>{stats.travelerArchetype}</Text>
      </View>

      <Text style={styles.quoteText}>"{stats.highlightQuote}"</Text>

      {/* 4 Core Stat Boxes */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Ionicons name="airplane-outline" size={20} color="#60A5FA" />
          <Text style={styles.statValue}>{stats.totalKmTraveled.toLocaleString()} km</Text>
          <Text style={styles.statLabel}>Traversed</Text>
        </View>

        <View style={styles.statBox}>
          <Ionicons name="map-outline" size={20} color="#34D399" />
          <Text style={styles.statValue}>{stats.toursCompleted}</Text>
          <Text style={styles.statLabel}>Expeditions Done</Text>
        </View>

        <View style={styles.statBox}>
          <Ionicons name="cash-outline" size={20} color="#FBBF24" />
          <Text style={styles.statValue}>
            {currencySymbol}
            {totalSavings.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>Shielded & Saved</Text>
        </View>

        <View style={styles.statBox}>
          <Ionicons name="leaf-outline" size={20} color="#4ADE80" />
          <Text style={styles.statValue}>{stats.carbonOffsetKg} kg</Text>
          <Text style={styles.statLabel}>CO₂ Offset</Text>
        </View>
      </View>

      {/* Action CTA Row */}
      <View style={styles.actionRow}>
        <TouchableOpacity testID="btn-play-circle" accessibilityLabel="play circle" style={styles.playReelButton} onPress={onPlayStories} activeOpacity={0.85}>
          <Ionicons name="play-circle" size={20} color="#0B3B60" />
          <Text style={styles.playReelText}>Play Wrapped Story Reel</Text>
        </TouchableOpacity>

        <TouchableOpacity testID="btn-star" accessibilityLabel="star" style={styles.reviewButton} onPress={onOpenReview} activeOpacity={0.85}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.reviewButtonText}>+250 Pts Review</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  badgeText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  certButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  certButtonText: {
    color: '#FFD700',
    fontSize: 11,
    fontWeight: '600',
  },
  travelerName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  archetypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  archetypeText: {
    fontSize: 13,
    color: '#4ADE80',
    fontWeight: '700',
  },
  quoteText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 6,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.65)',
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  playReelButton: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    borderRadius: 14,
  },
  playReelText: {
    color: '#0B3B60',
    fontSize: 13,
    fontWeight: '800',
  },
  reviewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  reviewButtonText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '700',
  },
});

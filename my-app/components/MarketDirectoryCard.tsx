import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import type { BargainMarketItem } from '@/types';

interface MarketDirectoryCardProps {
  market: BargainMarketItem;
  onPress?: () => void;
}

export const MarketDirectoryCard: React.FC<MarketDirectoryCardProps> = ({
  market,
  onPress,
}) => {
  const colors = useColors();

  const getIntensityBadge = (intensity?: string) => {
    switch (intensity) {
      case 'HIGH':
        return {
          bg: '#fef2f2',
          border: '#fecaca',
          text: '#dc2626',
          label: '🔥 High Haggling',
        };
      case 'MODERATE':
        return {
          bg: '#fffbeb',
          border: '#fde68a',
          text: '#d97706',
          label: '⚖️ Moderate Haggling',
        };
      case 'LOW_FIXED':
      case 'LOW':
        return {
          bg: '#f0fdf4',
          border: '#bbf7d0',
          text: '#16a34a',
          label: '🏷️ Fixed / Gentle',
        };
      default:
        return {
          bg: '#f3f4f6',
          border: '#e5e7eb',
          text: '#4b5563',
          label: 'Bazaar Standard',
        };
    }
  };

  const badgeStyle = getIntensityBadge(market.bargainingIntensity);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress?.();
      }}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Market ${market.marketName}`}
    >
      {/* Top Row: Name and Local Script */}
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <View style={styles.badgeRow}>
            <View style={[styles.marketTypeBadge, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.marketTypeText, { color: colors.mutedText }]}>
                {market.marketType.replace(/_/g, ' ')}
              </Text>
            </View>
            <View
              style={[
                styles.intensityBadge,
                { backgroundColor: badgeStyle.bg, borderColor: badgeStyle.border },
              ]}
            >
              <Text style={[styles.intensityText, { color: badgeStyle.text }]}>
                {badgeStyle.label}
              </Text>
            </View>
          </View>

          <Text style={[styles.marketTitle, { color: colors.heading }]}>
            {market.marketName}
          </Text>
          <Text style={[styles.localName, { color: colors.mutedText }]}>
            {market.localName}
          </Text>
        </View>

        <View style={[styles.discountBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
          <Text style={styles.discountLabel}>SWEET-SPOT</Text>
          <Text style={styles.discountValue}>{market.hagglingSweetSpot}</Text>
        </View>
      </View>

      {/* Timing and Info Row */}
      <View style={[styles.infoRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.infoCol}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={14} color="#6b7280" />
            <Text style={[styles.infoText, { color: colors.heading }]}>
              {market.bestOperatingHours}
            </Text>
          </View>
          <View style={[styles.infoItem, { marginTop: 4 }]}>
            <Ionicons name="sparkles-outline" size={14} color="#f59e0b" />
            <Text style={[styles.infoText, { color: colors.mutedText }]} numberOfLines={1}>
              {market.bestFor}
            </Text>
          </View>
        </View>
      </View>

      {/* Pro Tip */}
      <View style={[styles.proTipContainer, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}>
        <Ionicons name="bulb" size={14} color="#d97706" style={{ marginTop: 1 }} />
        <Text style={styles.proTipText}>
          <Text style={{ fontWeight: '700' }}>Insider Tip: </Text>
          {market.proTip}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    minHeight: 44,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  marketTypeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  marketTypeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  intensityBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  intensityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  marketTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  localName: {
    fontSize: 12,
    marginTop: 1,
  },
  discountBox: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 80,
  },
  discountLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#16a34a',
    letterSpacing: 0.5,
  },
  discountValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803d',
    marginTop: 1,
  },
  infoRow: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
  },
  infoCol: {
    gap: 2,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  proTipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  proTipText: {
    fontSize: 11,
    color: '#92400e',
    lineHeight: 16,
    flex: 1,
  },
});

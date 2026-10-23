import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useForexRadar } from '@/context/ForexRadarContext';

interface ForexRadarHeroCardProps {
  style?: StyleProp<ViewStyle>;
}

export const ForexRadarHeroCard: React.FC<ForexRadarHeroCardProps> = ({ style }) => {
  const router = useRouter();
  const colors = useColors();
  const { radarData, openCalculator } = useForexRadar();

  const handleOpenHub = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/forex-radar' as any);
  };

  const handleOpenCalc = (e: any) => {
    e.stopPropagation?.();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    openCalculator('USD', 500);
  };

  const primaryRate = radarData?.baseRates?.[0]; // Usually USD
  const destSymbol = radarData?.destinationCurrencySymbol || '฿';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.titleGroup}
          onPress={handleOpenHub}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Open Currency Exchange and ATM DCC Shield Hub"
        >
          <View style={[styles.iconBox, { backgroundColor: '#ecfdf5' }]}>
            <Ionicons name="cash-outline" size={20} color="#059669" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <Text style={styles.liveBadge}>LIVE COUNTER RADAR</Text>
              <Text style={[styles.destCountry, { color: colors.mutedText }]}>
                {radarData?.destinationCountry || 'Destination'}
              </Text>
            </View>
            <Text style={[styles.title, { color: colors.heading }]}>
              Forex Radar & ATM DCC Shield
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.calcIconButton, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={handleOpenCalc}
          accessibilityRole="button"
          accessibilityLabel="Open currency calculator"
        >
          <Ionicons name="calculator-outline" size={18} color="#059669" />
        </TouchableOpacity>
      </View>

      {/* Main Body Touchable Zone */}
      <TouchableOpacity
        onPress={handleOpenHub}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="View live rates and ATM guidance"
      >
        {/* Snapshot rate comparison */}
        {primaryRate && (
          <View style={[styles.rateSnapshotBox, { backgroundColor: colors.background }]}>
            <View style={styles.rateCol}>
              <Text style={[styles.rateLabel, { color: colors.mutedText }]}>
                {primaryRate.currencyCode} City Best Buy:
              </Text>
              <Text style={styles.cityRateVal}>
                {destSymbol} {primaryRate.cityCounterBuyRate.toFixed(2)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.rateCol}>
              <Text style={[styles.rateLabel, { color: colors.mutedText }]}>Airport Bank:</Text>
              <Text style={styles.airportRateVal}>
                {destSymbol} {primaryRate.bankAirportBuyRate.toFixed(2)}
              </Text>
            </View>
            <View style={styles.lossBadgeBox}>
              <Text style={styles.lossBadgeText}>{primaryRate.airportLossPercent}</Text>
            </View>
          </View>
        )}

        {/* Golden Shield Alert */}
        <View style={styles.shieldNoticeRow}>
          <Ionicons name="shield-checkmark" size={15} color="#059669" />
          <Text style={styles.shieldNoticeText} numberOfLines={1}>
            ATM Rule: Always choose &ldquo;Without Conversion&rdquo; to save 8-11%
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.mutedText} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    minHeight: 44,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  liveBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    letterSpacing: 0.5,
  },
  destCountry: {
    fontSize: 11,
    fontWeight: '500',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  calcIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  rateSnapshotBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 10,
  },
  rateCol: {
    flex: 1,
  },
  rateLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 1,
  },
  cityRateVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#047857',
  },
  airportRateVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textDecorationLine: 'line-through',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
  },
  lossBadgeBox: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  lossBadgeText: {
    color: '#dc2626',
    fontSize: 10,
    fontWeight: '700',
  },
  shieldNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shieldNoticeText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#047857',
  },
});

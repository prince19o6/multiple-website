import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { CarbonEmissionBreakdown } from '../types';

interface CarbonGaugeCardProps {
  emissions: CarbonEmissionBreakdown;
  flightRoute?: string;
  onOpenCalculator: () => void;
  style?: StyleProp<ViewStyle>;
}

export const CarbonGaugeCard: React.FC<CarbonGaugeCardProps> = ({
  emissions,
  flightRoute = 'BOM ✈ BKK',
  onOpenCalculator,
  style,
}) => {
  const colors = useColors();

  const total = emissions.totalEmissionsKg || 1;
  const flightPct = Math.round((emissions.flightEmissionsKg / total) * 100);
  const groundPct = Math.round((emissions.groundTransportEmissionsKg / total) * 100);
  const hotelPct = Math.max(0, 100 - flightPct - groundPct);

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
      {/* Header */}
      <View style={styles.topRow}>
        <View style={styles.badgeGroup}>
          <View style={styles.iconCircle}>
            <Ionicons name="leaf" size={18} color="#059669" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.title, { color: colors.heading }]}>
              Trip Carbon Footprint
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedText }]}>
              Route: {flightRoute} &bull; Scope 3 Travel Emissions
            </Text>
          </View>
        </View>

        <TouchableOpacity testID="btn-calculator-outline" accessibilityLabel="calculator outline"
          style={[styles.calcBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            onOpenCalculator();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="calculator-outline" size={15} color={colors.primary} />
          <Text style={[styles.calcBtnText, { color: colors.primary }]}>Custom</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Number */}
      <View style={[styles.heroBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.heroLeft}>
          <Text style={[styles.heroLabel, { color: colors.mutedText }]}>TOTAL TRIP EMISSIONS</Text>
          <View style={styles.emissionsNumRow}>
            <Text style={[styles.heroEmissions, { color: '#059669' }]}>
              {emissions.totalEmissionsKg.toFixed(1)}
            </Text>
            <Text style={[styles.unitText, { color: colors.heading }]}>kg CO2e</Text>
          </View>
        </View>

        <View style={styles.heroDivider} />

        <View style={styles.heroRight}>
          <View style={styles.equivRow}>
            <Ionicons name="leaf" size={16} color="#15803d" />
            <Text style={[styles.equivText, { color: colors.heading }]}>
              <Text style={{ fontWeight: '800' }}>{emissions.treesEquivalentCount}</Text> Trees to absorb
            </Text>
          </View>
          <View style={[styles.equivRow, { marginTop: 4 }]}>
            <Ionicons name="car-outline" size={16} color="#0284c7" />
            <Text style={[styles.equivText, { color: colors.heading }]}>
              <Text style={{ fontWeight: '800' }}>{emissions.carKmEquivalent.toLocaleString()}</Text> km in a car
            </Text>
          </View>
        </View>
      </View>

      {/* Segmented Meter Bar */}
      <View style={styles.meterSection}>
        <View style={styles.meterBarContainer}>
          <View style={[styles.meterSegment, { width: `${flightPct}%`, backgroundColor: '#3b82f6' }]} />
          <View style={[styles.meterSegment, { width: `${groundPct}%`, backgroundColor: '#f59e0b' }]} />
          <View style={[styles.meterSegment, { width: `${hotelPct}%`, backgroundColor: '#10b981' }]} />
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
            <Text style={[styles.legendLabel, { color: colors.mutedText }]}>
              Flight: {emissions.flightEmissionsKg.toFixed(0)}kg ({flightPct}%)
            </Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
            <Text style={[styles.legendLabel, { color: colors.mutedText }]}>
              Ground: {emissions.groundTransportEmissionsKg.toFixed(0)}kg ({groundPct}%)
            </Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
            <Text style={[styles.legendLabel, { color: colors.mutedText }]}>
              Hotel: {emissions.hotelStayEmissionsKg.toFixed(0)}kg ({hotelPct}%)
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  calcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  calcBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  heroLeft: {
    flex: 1.1,
  },
  heroLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  emissionsNumRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  heroEmissions: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  unitText: {
    fontSize: 13,
    fontWeight: '600',
  },
  heroDivider: {
    width: 1,
    height: 38,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 12,
  },
  heroRight: {
    flex: 1.2,
  },
  equivRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  equivText: {
    fontSize: 11,
  },
  meterSection: {
    marginTop: 2,
  },
  meterBarContainer: {
    height: 8,
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
    marginBottom: 8,
  },
  meterSegment: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});

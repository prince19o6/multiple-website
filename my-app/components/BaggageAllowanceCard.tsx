import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { AirlineBaggagePolicy } from '../types';

interface BaggageAllowanceCardProps {
  airline: AirlineBaggagePolicy;
  isSelected?: boolean;
  onSelectAirline?: (airline: AirlineBaggagePolicy) => void;
  style?: StyleProp<ViewStyle>;
}

export const BaggageAllowanceCard: React.FC<BaggageAllowanceCardProps> = ({
  airline,
  isSelected,
  onSelectAirline,
  style,
}) => {
  const colors = useColors();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isSelected ? colors.primary : colors.border,
          borderWidth: isSelected ? 2 : 1,
        },
        style,
      ]}
    >
      {/* Header Row */}
      <View style={styles.topRow}>
        <View style={[styles.codeBadge, { backgroundColor: isSelected ? colors.primary : '#eff6ff' }]}>
          <Text style={[styles.codeText, { color: isSelected ? '#ffffff' : '#1d4ed8' }]}>
            {airline.airlineCode}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.airlineName, { color: colors.heading }]}>
            {airline.airlineName}
          </Text>
          <Text style={[styles.pieceSub, { color: colors.mutedText }]}>
            {airline.checkedPieceLimit}
          </Text>
        </View>

        {isSelected && (
          <View style={[styles.activeTag, { backgroundColor: '#ecfdf5' }]}>
            <Ionicons name="checkmark-circle" size={14} color="#059669" />
            <Text style={styles.activeTagText}>ACTIVE</Text>
          </View>
        )}
      </View>

      {/* Allowance Breakdown Box */}
      <View style={[styles.allowanceGrid, { backgroundColor: colors.background, borderColor: colors.border }]}>
        {/* Cabin */}
        <View style={styles.allowanceCol}>
          <View style={styles.allowanceTitleRow}>
            <Ionicons name="briefcase-outline" size={14} color="#0284c7" />
            <Text style={[styles.allowanceLabel, { color: colors.mutedText }]}>CABIN BAG</Text>
          </View>
          <Text style={[styles.allowanceValue, { color: colors.heading }]}>
            {airline.cabinAllowanceKg} kg
          </Text>
          <Text style={[styles.dimText, { color: colors.mutedText }]} numberOfLines={1}>
            {airline.cabinDimensions}
          </Text>
        </View>

        <View style={styles.gridDivider} />

        {/* Checked */}
        <View style={styles.allowanceCol}>
          <View style={styles.allowanceTitleRow}>
            <Ionicons name="bag-handle-outline" size={14} color="#16a34a" />
            <Text style={[styles.allowanceLabel, { color: colors.mutedText }]}>CHECKED</Text>
          </View>
          <Text style={[styles.allowanceValue, { color: colors.heading }]}>
            {airline.checkedAllowanceKg} kg
          </Text>
          <Text style={[styles.dimText, { color: colors.mutedText }]} numberOfLines={1}>
            Included in standard ticket
          </Text>
        </View>
      </View>

      {/* Pricing Fee Strip */}
      <View style={styles.pricingRow}>
        <View style={styles.priceItem}>
          <Text style={[styles.priceLabel, { color: colors.mutedText }]}>AIRPORT COUNTER EXCESS:</Text>
          <Text style={[styles.priceVal, { color: '#dc2626' }]}>{airline.airportExcessFeePerKg}</Text>
        </View>

        <View style={styles.priceItem}>
          <Text style={[styles.priceLabel, { color: colors.mutedText }]}>ONLINE PREPAID (SAVE 40%):</Text>
          <Text style={[styles.priceVal, { color: '#059669' }]}>{airline.prepaidExcessFeePerKg}</Text>
        </View>
      </View>

      {/* Special Rules */}
      {airline.specialRules && airline.specialRules.length > 0 && (
        <View style={styles.rulesList}>
          {airline.specialRules.map((rule, idx) => (
            <View key={idx} style={styles.ruleRow}>
              <Ionicons name="information-circle-outline" size={12} color={colors.primary} style={{ marginTop: 2 }} />
              <Text style={[styles.ruleText, { color: colors.mutedText }]}>{rule}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Select Action */}
      {onSelectAirline && !isSelected && (
        <TouchableOpacity testID="btn-baggageallowancecard-127" accessibilityLabel="baggageallowancecard action"
          style={[styles.selectBtn, { borderColor: colors.border }]}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            onSelectAirline(airline);
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.selectBtnText, { color: colors.primary }]}>
            Select {airline.airlineName} for Calculation
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  codeBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  airlineName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  pieceSub: {
    fontSize: 11,
    marginTop: 1,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  activeTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  allowanceGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  allowanceCol: {
    flex: 1,
  },
  gridDivider: {
    width: 1,
    height: 34,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginHorizontal: 10,
  },
  allowanceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  allowanceLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  allowanceValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  dimText: {
    fontSize: 10,
    marginTop: 1,
  },
  pricingRow: {
    gap: 4,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  priceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  priceVal: {
    fontSize: 11,
    fontWeight: '800',
  },
  rulesList: {
    gap: 4,
    marginBottom: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 8,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  ruleText: {
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
  },
  selectBtn: {
    marginTop: 8,
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

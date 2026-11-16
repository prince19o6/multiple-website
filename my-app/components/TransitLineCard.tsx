import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { TransitLine } from '../types';

interface TransitLineCardProps {
  line: TransitLine;
  isSelected?: boolean;
  onSelectLine?: (line: TransitLine) => void;
  style?: StyleProp<ViewStyle>;
}

export const TransitLineCard: React.FC<TransitLineCardProps> = ({
  line,
  isSelected,
  onSelectLine,
  style,
}) => {
  const colors = useColors();

  const getSystemIcon = (type: string) => {
    switch (type) {
      case 'Underground_Metro':
        return 'subway-outline';
      case 'Airport_Train':
        return 'airplane-outline';
      case 'Monorail':
        return 'trail-sign-outline';
      default:
        return 'train-outline';
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isSelected ? line.colorHex : colors.border,
          borderWidth: isSelected ? 2 : 1,
        },
        style,
      ]}
    >
      {/* Line Color Header */}
      <View style={styles.topRow}>
        <View style={[styles.iconBox, { backgroundColor: `${line.colorHex}22` }]}>
          <Ionicons name={getSystemIcon(line.systemType) as any} size={20} color={line.colorHex} />
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={[styles.lineName, { color: colors.heading }]}>
              {line.lineName}
            </Text>
            <View style={[styles.colorDot, { backgroundColor: line.colorHex }]} />
          </View>
          <Text style={[styles.hoursText, { color: colors.mutedText }]}>
            {line.operatingHours}
          </Text>
        </View>

        {isSelected && (
          <View style={[styles.activePill, { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }]}>
            <Text style={styles.activePillText}>VIEWING</Text>
          </View>
        )}
      </View>

      {/* Payment Badges Strip */}
      <View style={styles.paymentWrap}>
        <Text style={[styles.paymentLabel, { color: colors.mutedText }]}>ACCEPTED:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paymentScroll}>
          {line.paymentMethods?.map((pm, idx) => (
            <View
              key={idx}
              style={[
                styles.payChip,
                {
                  backgroundColor: pm.includes('Visa') ? '#eff6ff' : colors.background,
                  borderColor: pm.includes('Visa') ? '#bfdbfe' : colors.border,
                },
              ]}
            >
              {pm.includes('Visa') && <Ionicons name="card-outline" size={11} color="#1d4ed8" style={{ marginRight: 3 }} />}
              <Text
                style={[
                  styles.payChipText,
                  { color: pm.includes('Visa') ? '#1d4ed8' : colors.mutedText },
                ]}
              >
                {pm}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Key Stations */}
      <View style={[styles.stationsBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Text style={[styles.stationsHeader, { color: colors.mutedText }]}>KEY STATIONS:</Text>
        <View style={styles.stationsRow}>
          {line.keyStations?.map((stn, idx) => (
            <View key={idx} style={[styles.stationPill, { borderColor: line.colorHex }]}>
              <View style={[styles.stationDot, { backgroundColor: line.colorHex }]} />
              <Text style={[styles.stationText, { color: colors.heading }]}>{stn}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Action */}
      {onSelectLine && !isSelected && (
        <TouchableOpacity testID="btn-transitlinecard-125" accessibilityLabel="transitlinecard action"
          style={[styles.selectBtn, { borderColor: colors.border }]}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            onSelectLine(line);
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.selectBtnText, { color: colors.primary }]}>
            View {line.lineName} Stations & Fares
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
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lineName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  hoursText: {
    fontSize: 11,
    marginTop: 1,
  },
  activePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  activePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  paymentWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  paymentLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  paymentScroll: {
    gap: 6,
  },
  payChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  payChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  stationsBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  stationsHeader: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  stationsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  stationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#ffffff',
    gap: 5,
  },
  stationDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  stationText: {
    fontSize: 10,
    fontWeight: '600',
  },
  selectBtn: {
    marginTop: 10,
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

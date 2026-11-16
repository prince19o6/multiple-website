import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useBaggage } from '../context/BaggageContext';

interface BaggageHeroCardProps {
  style?: StyleProp<ViewStyle>;
}

export const BaggageHeroCard: React.FC<BaggageHeroCardProps> = ({ style }) => {
  const router = useRouter();
  const colors = useColors();
  const {
    selectedAirline,
    cabinWeight,
    checkedWeight,
    setIsCalculatorModalOpen,
    setIsProhibitedSheetOpen,
  } = useBaggage();

  const handleOpenHub = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/baggage-calculator' as any);
  };

  const handleOpenCalculator = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIsCalculatorModalOpen(true);
  };

  const handleOpenProhibited = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsProhibitedSheetOpen(true);
  };

  const checkedLimit = selectedAirline?.checkedAllowanceKg ?? 20;
  const isOverweight = checkedWeight > checkedLimit;

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
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={[styles.iconBox, { backgroundColor: '#f0fdf4' }]}>
            <Ionicons name="airplane-outline" size={20} color="#16a34a" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.heading }]}>
              Airline Baggage & Sizer
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedText }]} numberOfLines={1}>
              {selectedAirline?.airlineName || 'Aviation Baggage'} &bull; {selectedAirline?.cabinAllowanceKg || 7}kg Cabin / {checkedLimit}kg Checked
            </Text>
          </View>
        </View>

        <TouchableOpacity testID="btn-ban-outline" accessibilityLabel="ban outline"
          style={styles.rulesBtn}
          onPress={handleOpenProhibited}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="ban-outline" size={14} color="#dc2626" />
          <Text style={styles.rulesBtnText}>Rules</Text>
        </TouchableOpacity>
      </View>

      {/* Weight Summary Strip */}
      <View style={[styles.infoBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.infoCol}>
          <Text style={[styles.infoLabel, { color: colors.mutedText }]}>ESTIMATED CHECKED</Text>
          <Text
            style={[
              styles.infoMain,
              { color: isOverweight ? '#dc2626' : colors.heading },
            ]}
          >
            {checkedWeight} kg {isOverweight ? `(+${Math.round((checkedWeight - checkedLimit)*10)/10}kg over)` : `(${Math.round((checkedLimit - checkedWeight)*10)/10}kg safe)`}
          </Text>
        </View>

        <View style={styles.infoDivider} />

        <View style={styles.infoCol}>
          <Text style={[styles.infoLabel, { color: colors.mutedText }]}>CABIN CARRY-ON</Text>
          <Text style={[styles.infoMain, { color: colors.heading }]}>
            {cabinWeight} kg / {selectedAirline?.cabinAllowanceKg || 7}kg limit
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity testID="btn-calculator-outline" accessibilityLabel="calculator outline"
          style={[styles.mainBtn, { backgroundColor: colors.primary }]}
          onPress={handleOpenHub}
          activeOpacity={0.85}
        >
          <Ionicons name="calculator-outline" size={16} color="#ffffff" />
          <Text style={styles.mainBtnText}>Baggage Hub & Airline Rules</Text>
        </TouchableOpacity>

        <TouchableOpacity testID="btn-scale-outline" accessibilityLabel="scale outline"
          style={[styles.checkBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={handleOpenCalculator}
          activeOpacity={0.7}
        >
          <Ionicons name="scale-outline" size={16} color={colors.heading} />
          <Text style={[styles.checkBtnText, { color: colors.heading }]}>Weigh Bags</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    gap: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  rulesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
    gap: 4,
  },
  rulesBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#dc2626',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  infoCol: {
    flex: 1,
  },
  infoDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 10,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  infoMain: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  mainBtn: {
    flex: 1.4,
    minHeight: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mainBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  checkBtn: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  checkBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

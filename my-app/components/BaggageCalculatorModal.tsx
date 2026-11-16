import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useBaggage } from '../context/BaggageContext';

interface BaggageCalculatorModalProps {
  visible: boolean;
  onClose: () => void;
}

const FARE_CLASSES = [
  { key: 'Economy_Light', label: 'Eco Light (Hand Only)' },
  { key: 'Economy_Standard', label: 'Standard Economy' },
  { key: 'Flexi_Business', label: 'Flexi / Business (+10kg)' },
];

export const BaggageCalculatorModal: React.FC<BaggageCalculatorModalProps> = ({
  visible,
  onClose,
}) => {
  const colors = useColors();
  const {
    selectedAirline,
    supportedAirlines,
    setSelectedAirline,
    cabinWeight,
    setCabinWeight,
    checkedWeight,
    setCheckedWeight,
    fareClass,
    setFareClass,
    calculationResult,
    isCalculating,
    recalculateFee,
  } = useBaggage();

  const handleAdjustChecked = (delta: number) => {
    Haptics.selectionAsync().catch(() => {});
    const next = Math.max(0, Math.min(50, Math.round((checkedWeight + delta) * 10) / 10));
    setCheckedWeight(next);
  };

  const handleAdjustCabin = (delta: number) => {
    Haptics.selectionAsync().catch(() => {});
    const next = Math.max(0, Math.min(25, Math.round((cabinWeight + delta) * 10) / 10));
    setCabinWeight(next);
  };

  const handleCalculate = async () => {
    await recalculateFee(cabinWeight, checkedWeight, fareClass);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.heading }]}>
                Baggage Weight & Excess Fee Calculator
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedText }]}>
                Avoid Extortionate Check-in Counter Penalties
              </Text>
            </View>
            <TouchableOpacity testID="btn-close" accessibilityLabel="Close"
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={colors.heading} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Step 1: Select Airline */}
            <Text style={[styles.stepLabel, { color: colors.heading }]}>
              1. SELECT AIRLINE:
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.airlinePillsRow}
            >
              {supportedAirlines.map((al) => {
                const isSelected = selectedAirline?.airlineCode === al.airlineCode;
                return (
                  <TouchableOpacity testID="btn-baggagecalculatormodal-108" accessibilityLabel="baggagecalculatormodal action"
                    key={al.airlineCode}
                    style={[
                      styles.airlinePill,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.background,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setSelectedAirline(al);
                    }}
                  >
                    <Text
                      style={[
                        styles.airlinePillText,
                        { color: isSelected ? '#ffffff' : colors.heading },
                      ]}
                    >
                      {al.airlineName} ({al.airlineCode})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Step 2: Fare Class */}
            <Text style={[styles.stepLabel, { color: colors.heading, marginTop: 12 }]}>
              2. TICKET FARE CLASS:
            </Text>
            <View style={styles.fareRow}>
              {FARE_CLASSES.map((fc) => {
                const isSelected = fareClass === fc.key;
                return (
                  <TouchableOpacity testID="btn-baggagecalculatormodal-143" accessibilityLabel="baggagecalculatormodal action"
                    key={fc.key}
                    style={[
                      styles.fareChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.background,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setFareClass(fc.key);
                    }}
                  >
                    <Text
                      style={[
                        styles.fareChipText,
                        { color: isSelected ? '#ffffff' : colors.heading },
                      ]}
                      numberOfLines={1}
                    >
                      {fc.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Step 3: Weight Steppers */}
            <View style={styles.steppersContainer}>
              {/* Checked Suitcase Stepper */}
              <View style={[styles.stepperCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.stepperHeader}>
                  <Ionicons name="bag-handle-outline" size={18} color="#16a34a" />
                  <Text style={[styles.stepperTitle, { color: colors.heading }]}>
                    Checked Suitcase
                  </Text>
                  <Text style={[styles.stepperAllowance, { color: colors.mutedText }]}>
                    Limit: {selectedAirline?.checkedAllowanceKg ?? 20}kg
                  </Text>
                </View>

                <View style={styles.stepperControls}>
                  <TouchableOpacity testID="btn-remove" accessibilityLabel="remove"
                    style={[styles.stepperBtn, { backgroundColor: colors.surface }]}
                    onPress={() => handleAdjustChecked(-1)}
                  >
                    <Ionicons name="remove" size={18} color={colors.heading} />
                  </TouchableOpacity>

                  <View style={styles.stepperValWrap}>
                    <Text style={[styles.stepperVal, { color: colors.heading }]}>
                      {checkedWeight}
                    </Text>
                    <Text style={[styles.stepperUnit, { color: colors.mutedText }]}>kg</Text>
                  </View>

                  <TouchableOpacity testID="btn-add" accessibilityLabel="add"
                    style={[styles.stepperBtn, { backgroundColor: colors.surface }]}
                    onPress={() => handleAdjustChecked(1)}
                  >
                    <Ionicons name="add" size={18} color={colors.heading} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Cabin Carry-On Stepper */}
              <View style={[styles.stepperCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.stepperHeader}>
                  <Ionicons name="briefcase-outline" size={18} color="#0284c7" />
                  <Text style={[styles.stepperTitle, { color: colors.heading }]}>
                    Cabin Carry-On
                  </Text>
                  <Text style={[styles.stepperAllowance, { color: colors.mutedText }]}>
                    Limit: {selectedAirline?.cabinAllowanceKg ?? 7}kg
                  </Text>
                </View>

                <View style={styles.stepperControls}>
                  <TouchableOpacity testID="btn-remove" accessibilityLabel="remove"
                    style={[styles.stepperBtn, { backgroundColor: colors.surface }]}
                    onPress={() => handleAdjustCabin(-0.5)}
                  >
                    <Ionicons name="remove" size={18} color={colors.heading} />
                  </TouchableOpacity>

                  <View style={styles.stepperValWrap}>
                    <Text style={[styles.stepperVal, { color: colors.heading }]}>
                      {cabinWeight}
                    </Text>
                    <Text style={[styles.stepperUnit, { color: colors.mutedText }]}>kg</Text>
                  </View>

                  <TouchableOpacity testID="btn-add" accessibilityLabel="add"
                    style={[styles.stepperBtn, { backgroundColor: colors.surface }]}
                    onPress={() => handleAdjustCabin(0.5)}
                  >
                    <Ionicons name="add" size={18} color={colors.heading} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Calculate Button */}
            <TouchableOpacity testID="btn-calculator-outline" accessibilityLabel="calculator outline"
              style={[
                styles.calculateBtn,
                { backgroundColor: colors.primary, opacity: isCalculating ? 0.7 : 1 },
              ]}
              onPress={handleCalculate}
              disabled={isCalculating}
              activeOpacity={0.85}
            >
              {isCalculating ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="calculator-outline" size={18} color="#ffffff" />
                  <Text style={styles.calculateBtnText}>Estimate Excess Fees & Savings</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Calculation Result Box */}
            {calculationResult && (
              <View
                style={[
                  styles.verdictBox,
                  {
                    backgroundColor:
                      calculationResult.verdictStatus === 'Under_Limit_Safe'
                        ? '#ecfdf5'
                        : calculationResult.verdictStatus === 'Cabin_Heavy_Warning'
                        ? '#fffbeb'
                        : '#fef2f2',
                    borderColor:
                      calculationResult.verdictStatus === 'Under_Limit_Safe'
                        ? '#86efac'
                        : calculationResult.verdictStatus === 'Cabin_Heavy_Warning'
                        ? '#fde68a'
                        : '#fca5a5',
                  },
                ]}
              >
                <View style={styles.verdictHeader}>
                  <Ionicons
                    name={
                      calculationResult.verdictStatus === 'Under_Limit_Safe'
                        ? 'checkmark-circle'
                        : calculationResult.verdictStatus === 'Cabin_Heavy_Warning'
                        ? 'alert-circle'
                        : 'warning'
                    }
                    size={24}
                    color={
                      calculationResult.verdictStatus === 'Under_Limit_Safe'
                        ? '#16a34a'
                        : calculationResult.verdictStatus === 'Cabin_Heavy_Warning'
                        ? '#d97706'
                        : '#dc2626'
                    }
                  />
                  <Text
                    style={[
                      styles.verdictTitle,
                      {
                        color:
                          calculationResult.verdictStatus === 'Under_Limit_Safe'
                            ? '#15803d'
                            : calculationResult.verdictStatus === 'Cabin_Heavy_Warning'
                            ? '#b45309'
                            : '#991b1b',
                      },
                    ]}
                  >
                    {calculationResult.headline}
                  </Text>
                </View>

                <Text style={styles.verdictRec}>{calculationResult.recommendation}</Text>

                {/* Financial Breakdown */}
                {calculationResult.isCheckedOverweight && (
                  <View style={styles.financeBox}>
                    <View style={styles.financeRow}>
                      <Text style={styles.financeLabel}>Airport Counter Fee Penalty:</Text>
                      <Text style={[styles.financeVal, { color: '#dc2626' }]}>
                        {calculationResult.airportCounterFeeEst}
                      </Text>
                    </View>
                    <View style={styles.financeRow}>
                      <Text style={styles.financeLabel}>Online Prepaid Rate (Now):</Text>
                      <Text style={[styles.financeVal, { color: '#059669' }]}>
                        {calculationResult.prepaidFeeEst}
                      </Text>
                    </View>
                    <View style={[styles.financeRow, styles.savingsRow]}>
                      <Text style={styles.savingsLabel}>You Save by Pre-Booking:</Text>
                      <Text style={styles.savingsVal}>
                        {calculationResult.potentialSavings}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  airlinePillsRow: {
    gap: 8,
    paddingBottom: 6,
  },
  airlinePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  airlinePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  fareRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  fareChip: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fareChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  steppersContainer: {
    gap: 10,
    marginBottom: 12,
  },
  stepperCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  stepperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  stepperTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  stepperAllowance: {
    fontSize: 11,
    fontWeight: '600',
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  stepperBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  stepperValWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    minWidth: 80,
    justifyContent: 'center',
  },
  stepperVal: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  stepperUnit: {
    fontSize: 14,
    fontWeight: '700',
  },
  calculateBtn: {
    minHeight: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 14,
  },
  calculateBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  verdictBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  verdictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  verdictTitle: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  verdictRec: {
    fontSize: 12,
    lineHeight: 17,
    color: '#334155',
    marginBottom: 10,
  },
  financeBox: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 8,
    gap: 4,
  },
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  financeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  financeVal: {
    fontSize: 12,
    fontWeight: '800',
  },
  savingsRow: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
  },
  savingsLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  savingsVal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#059669',
  },
});

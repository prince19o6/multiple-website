import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useForexRadar } from '@/context/ForexRadarContext';

export const ForexCalculatorModal: React.FC = () => {
  const colors = useColors();
  const {
    isCalculatorVisible,
    closeCalculator,
    calculatorCurrency,
    setCalculatorCurrency,
    radarData,
    calculateSavings,
  } = useForexRadar();

  const [inputAmount, setInputAmount] = useState<string>('500');

  const supportedCurrencies = radarData?.baseRates?.map((r) => r.currencyCode) || [
    'USD',
    'EUR',
    'GBP',
    'INR',
    'AUD',
    'SGD',
  ];

  const destSymbol = radarData?.destinationCurrencySymbol || '฿';
  const numAmount = parseFloat(inputAmount) || 0;
  const savingsResult = calculateSavings(numAmount, calculatorCurrency);

  const handleSelectCurrency = (curr: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setCalculatorCurrency(curr);
  };

  const handlePresetAmount = (amt: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setInputAmount(amt.toString());
  };

  return (
    <Modal
      visible={isCalculatorVisible}
      animationType="slide"
      transparent
      onRequestClose={closeCalculator}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.modalHeaderTitleRow}>
              <View style={styles.modalIconBox}>
                <Ionicons name="calculator" size={20} color="#059669" />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: colors.heading }]}>
                  Forex Savings & DCC Simulator
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.mutedText }]}>
                  City Counter vs Airport Bank vs ATM DCC Trap
                </Text>
              </View>
            </View>
            <TouchableOpacity testID="btn-close"
              onPress={closeCalculator}
              style={[styles.closeButton, { backgroundColor: colors.background }]}
              accessibilityRole="button"
              accessibilityLabel="Close calculator modal"
            >
              <Ionicons name="close" size={20} color={colors.heading} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {/* Currency Selector Chips */}
            <Text style={[styles.sectionLabel, { color: colors.heading }]}>
              SELECT SOURCE CURRENCY
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.currencyChipsRow}
            >
              {supportedCurrencies.map((curr) => {
                const isSelected = curr === calculatorCurrency;
                return (
                  <TouchableOpacity testID="btn-forexcalculatormodal-104" accessibilityLabel="forexcalculatormodal action"
                    key={curr}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.background,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => handleSelectCurrency(curr)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: isSelected ? '#ffffff' : colors.heading },
                      ]}
                    >
                      {curr}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Cash Input */}
            <Text style={[styles.sectionLabel, { color: colors.heading, marginTop: 14 }]}>
              ENTER CASH / WITHDRAWAL AMOUNT ({calculatorCurrency})
            </Text>
            <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Text style={[styles.currencyPrefix, { color: colors.mutedText }]}>
                {calculatorCurrency}
              </Text>
              <TextInput
                style={[styles.textInput, { color: colors.heading }]}
                keyboardType="numeric"
                value={inputAmount}
                onChangeText={setInputAmount}
                placeholder="500"
                placeholderTextColor={colors.mutedText}
                maxLength={8}
              />
            </View>

            {/* Quick Presets */}
            <View style={styles.presetsRow}>
              {[100, 300, 500, 1000].map((preset) => (
                <TouchableOpacity testID="btn-forexcalculatormodal-151" accessibilityLabel="forexcalculatormodal action"
                  key={preset}
                  style={[styles.presetButton, { borderColor: colors.border }]}
                  onPress={() => handlePresetAmount(preset)}
                >
                  <Text style={[styles.presetText, { color: colors.mutedText }]}>
                    {calculatorCurrency} {preset}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Comparison Results */}
            {savingsResult && (
              <View style={styles.resultsContainer}>
                {/* 1. Best City Counter */}
                <View style={[styles.resultCard, styles.cityCard]}>
                  <View style={styles.resultCardHeader}>
                    <Ionicons name="checkmark-done-circle" size={18} color="#059669" />
                    <Text style={styles.cityCardTitle}>VERIFIED CITY COUNTER (SuperRich / Al Ansari)</Text>
                  </View>
                  <Text style={styles.payoutValue}>
                    {destSymbol} {Math.round(savingsResult.cityCounterThb).toLocaleString()}
                  </Text>
                  <Text style={styles.payoutSub}>
                    True wholesale tight spread counter payout
                  </Text>
                </View>

                {/* 2. Airport Bank Counter */}
                <View style={[styles.resultCard, styles.airportCard]}>
                  <View style={styles.resultCardHeader}>
                    <Ionicons name="airplane-outline" size={18} color="#d97706" />
                    <Text style={styles.airportCardTitle}>AIRPORT TERMINAL BANK BOOTH</Text>
                  </View>
                  <Text style={styles.airportPayoutValue}>
                    {destSymbol} {Math.round(savingsResult.airportBankThb).toLocaleString()}
                  </Text>
                  <View style={styles.lossRow}>
                    <Ionicons name="trending-down" size={14} color="#dc2626" />
                    <Text style={styles.lossAmountText}>
                      Lost: {destSymbol} {Math.round(savingsResult.cashSavingsThb).toLocaleString()}{' '}
                      ({savingsResult.cashSavingsPercent.toFixed(1)}% haircut)
                    </Text>
                  </View>
                </View>

                {/* 3. ATM DCC Markup Trap */}
                <View style={[styles.resultCard, styles.dccCard]}>
                  <View style={styles.resultCardHeader}>
                    <Ionicons name="warning-outline" size={18} color="#dc2626" />
                    <Text style={styles.dccCardTitle}>ATM WITH CONVERSION TRAP (DCC ACCEPTED)</Text>
                  </View>
                  <Text style={styles.dccPayoutValue}>
                    {destSymbol}{' '}
                    {Math.round(savingsResult.cityCounterThb - savingsResult.atmDccLossThb).toLocaleString()}
                  </Text>
                  <View style={styles.lossRow}>
                    <Ionicons name="close-circle-outline" size={14} color="#dc2626" />
                    <Text style={styles.lossAmountText}>
                      Hidden DCC Loss: ~{destSymbol}{' '}
                      {Math.round(savingsResult.atmDccLossThb).toLocaleString()} (8.5% fee)
                    </Text>
                  </View>
                </View>

                {/* Golden Takeaway Advice */}
                <View style={styles.takeawayBox}>
                  <Ionicons name="bulb" size={20} color="#eab308" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.takeawayTitle}>Pro-Traveler Verdict</Text>
                    <Text style={styles.takeawayText}>
                      By exchanging at a verified counter or choosing &ldquo;Without Conversion&rdquo; on ATMs, you keep{' '}
                      <Text style={{ fontWeight: '800', color: '#047857' }}>
                        {destSymbol} {Math.round(savingsResult.cashSavingsThb).toLocaleString()}
                      </Text>{' '}
                      in your pocket — enough for 4-8 local meals!
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  currencyChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 6,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  presetText: {
    fontSize: 11,
    fontWeight: '600',
  },
  resultsContainer: {
    marginTop: 20,
    gap: 12,
  },
  resultCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  cityCard: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  resultCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cityCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065f46',
    letterSpacing: 0.5,
  },
  payoutValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#047857',
  },
  payoutSub: {
    fontSize: 11,
    color: '#059669',
    marginTop: 2,
  },
  airportCard: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  airportCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400e',
    letterSpacing: 0.5,
  },
  airportPayoutValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#78350f',
  },
  lossRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  lossAmountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
  },
  dccCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  dccCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#991b1b',
    letterSpacing: 0.5,
  },
  dccPayoutValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#7f1d1d',
  },
  takeawayBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 4,
  },
  takeawayTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 2,
  },
  takeawayText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#475569',
  },
});

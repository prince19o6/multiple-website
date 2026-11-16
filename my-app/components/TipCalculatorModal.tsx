import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useTipping } from '../context/TippingContext';

interface TipCalculatorModalProps {
  visible: boolean;
  onClose: () => void;
}

const TIP_PRESETS = [0, 5, 10, 15, 20];

export const TipCalculatorModal: React.FC<TipCalculatorModalProps> = ({
  visible,
  onClose,
}) => {
  const colors = useColors();
  const { currentCurrency } = useCurrency();
  const {
    guide,
    selectedCategory,
    billAmount,
    setBillAmount,
    tipPercentage,
    setTipPercentage,
    customTipAmount,
    setCustomTipAmount,
    serviceChargeAlreadyIncluded,
    setServiceChargeAlreadyIncluded,
    splitCount,
    setSplitCount,
    calcResult,
    isCalculating,
  } = useTipping();

  const currencySymbol = guide?.currencySymbol || '฿';
  const currencyCode = guide?.currencyCode || 'THB';

  const approxHomeCurrency = React.useMemo(() => {
    if (!calcResult || !currentCurrency || currentCurrency.code === currencyCode) return null;
    const baseRate = currencyCode === 'AED' ? 3.67 : 34.5;
    const inUSD = calcResult.totalAmount / baseRate;
    const inHome = inUSD * currentCurrency.rate;
    return `${currentCurrency.symbol}${Math.round(inHome).toLocaleString()} ${currentCurrency.code}`;
  }, [calcResult, currentCurrency, currencyCode]);

  const handlePresetSelect = (pct: number) => {
    Haptics.selectionAsync().catch(() => {});
    setCustomTipAmount('');
    setTipPercentage(pct);
  };

  const incrementSplit = () => {
    if (splitCount < 10) {
      Haptics.selectionAsync().catch(() => {});
      setSplitCount(splitCount + 1);
    }
  };

  const decrementSplit = () => {
    if (splitCount > 1) {
      Haptics.selectionAsync().catch(() => {});
      setSplitCount(splitCount - 1);
    }
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
              <View style={styles.headerTitleRow}>
                <Ionicons name="calculator" size={18} color="#16a34a" />
                <Text style={[styles.title, { color: colors.heading }]}>
                  Gratuity & Bill Splitter
                </Text>
              </View>
              <Text style={[styles.subtitle, { color: colors.mutedText }]}>
                {selectedCategory?.categoryName || 'Dining & Services'} ({currencyCode})
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
            {/* Bill Amount Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
                BILL / SERVICE AMOUNT ({currencySymbol})
              </Text>
              <View style={[styles.inputBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.currencyPrefix, { color: colors.heading }]}>{currencySymbol}</Text>
                <TextInput
                  style={[styles.input, { color: colors.heading }]}
                  placeholder="0"
                  placeholderTextColor="#94a3b8"
                  value={billAmount}
                  onChangeText={(val) => setBillAmount(val.replace(/[^0-9.]/g, ''))}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Tip Percentage Presets */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedText }]}>TIP PERCENTAGE</Text>
              <View style={styles.presetRow}>
                {TIP_PRESETS.map((pct) => {
                  const isSelected = !customTipAmount && tipPercentage === pct;
                  return (
                    <TouchableOpacity testID="btn-tipcalculatormodal-142" accessibilityLabel="tipcalculatormodal action"
                      key={pct}
                      style={[
                        styles.presetChip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.background,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => handlePresetSelect(pct)}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          { color: isSelected ? '#ffffff' : colors.heading },
                        ]}
                      >
                        {pct}%
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Service Charge Switch */}
            <View style={[styles.switchCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <View style={styles.switchTitleRow}>
                  <Ionicons name="receipt-outline" size={16} color="#d97706" />
                  <Text style={[styles.switchTitle, { color: colors.heading }]}>
                    10% Service Charge Included?
                  </Text>
                </View>
                <Text style={[styles.switchDesc, { color: colors.mutedText }]}>
                  Turn on if bill already has a 10% service charge (+ or ++) so you don't double tip.
                </Text>
              </View>
              <Switch
                value={serviceChargeAlreadyIncluded}
                onValueChange={(val) => {
                  Haptics.selectionAsync().catch(() => {});
                  setServiceChargeAlreadyIncluded(val);
                }}
                trackColor={{ false: '#cbd5e1', true: '#10b981' }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Split Stepper */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
                SPLIT BILL AMONG CO-TRAVELERS
              </Text>
              <View style={[styles.stepperBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <TouchableOpacity testID="btn-remove" accessibilityLabel="remove"
                  style={[styles.stepBtn, splitCount <= 1 && styles.stepBtnDisabled]}
                  onPress={decrementSplit}
                  disabled={splitCount <= 1}
                >
                  <Ionicons name="remove" size={18} color={splitCount <= 1 ? '#94a3b8' : colors.heading} />
                </TouchableOpacity>

                <View style={styles.stepValueWrap}>
                  <Ionicons name="people-outline" size={16} color={colors.primary} />
                  <Text style={[styles.stepValueText, { color: colors.heading }]}>
                    {splitCount} {splitCount === 1 ? 'Person' : 'People'}
                  </Text>
                </View>

                <TouchableOpacity testID="btn-add" accessibilityLabel="add"
                  style={[styles.stepBtn, splitCount >= 10 && styles.stepBtnDisabled]}
                  onPress={incrementSplit}
                  disabled={splitCount >= 10}
                >
                  <Ionicons name="add" size={18} color={splitCount >= 10 ? '#94a3b8' : colors.heading} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Calculation Output Card */}
            {isCalculating ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.mutedText }]}>Calculating gratuity...</Text>
              </View>
            ) : calcResult ? (
              <View style={[styles.resultCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                {/* Per-Person Highlight */}
                {splitCount > 1 && (
                  <View style={styles.perPersonRow}>
                    <Text style={styles.perPersonLabel}>EACH TRAVELER PAYS:</Text>
                    <Text style={styles.perPersonValue}>
                      {currencySymbol}{calcResult.perPersonTotal.toLocaleString()}
                    </Text>
                  </View>
                )}

                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Tip Amount:</Text>
                  <Text style={styles.resultValue}>
                    {currencySymbol}{calcResult.tipAmount.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Total (Bill + Tip):</Text>
                  <Text style={[styles.resultValue, { fontSize: 16, fontWeight: '800', color: '#166534' }]}>
                    {currencySymbol}{calcResult.totalAmount.toLocaleString()}
                  </Text>
                </View>

                {/* Home Currency Converted Estimate */}
                {approxHomeCurrency && (
                  <View style={styles.homeCurrencyRow}>
                    <Ionicons name="swap-horizontal" size={13} color="#15803d" />
                    <Text style={styles.homeCurrencyText}>
                      Approx. {approxHomeCurrency} (home equivalent)
                    </Text>
                  </View>
                )}

                {/* Advice / Service Charge Note */}
                <View style={styles.adviceBox}>
                  <Ionicons name="bulb-outline" size={14} color="#15803d" />
                  <Text style={styles.adviceText}>{calcResult.etiquetteAdvice}</Text>
                </View>
              </View>
            ) : null}

            {/* Done Button */}
            <TouchableOpacity testID="btn-done" accessibilityLabel="Done"
              style={[styles.doneBtn, { backgroundColor: colors.primary }]}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 6,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  switchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  switchTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  switchDesc: {
    fontSize: 10,
    lineHeight: 14,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    height: 46,
    paddingHorizontal: 6,
  },
  stepBtn: {
    width: 40,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnDisabled: {
    opacity: 0.4,
  },
  stepValueWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  stepValueText: {
    fontSize: 14,
    fontWeight: '700',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
  },
  resultCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  perPersonRow: {
    backgroundColor: '#dcfce7',
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  perPersonLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
    letterSpacing: 0.5,
  },
  perPersonValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#166534',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  resultLabel: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
  },
  resultValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#14532d',
  },
  homeCurrencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#bbf7d0',
  },
  homeCurrencyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
  },
  adviceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#bbf7d0',
  },
  adviceText: {
    fontSize: 11,
    color: '#166534',
    flex: 1,
    lineHeight: 15,
  },
  doneBtn: {
    minHeight: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

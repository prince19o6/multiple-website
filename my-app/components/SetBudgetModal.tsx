import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import { useTripBudget } from '../context/TripBudgetContext';

interface SetBudgetModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SetBudgetModal: React.FC<SetBudgetModalProps> = ({ visible, onClose }) => {
  const colors = useColors();
  const { currencyCode, currencySymbol } = useCurrency();
  const { totalBudget, totalSpent, setBudgetLimit } = useTripBudget();

  const [budgetInput, setBudgetInput] = useState(totalBudget.toString());

  useEffect(() => {
    if (visible) {
      setBudgetInput(totalBudget.toString());
    }
  }, [visible, totalBudget]);

  const parsedBudget = parseFloat(budgetInput) || 0;
  const projectedRemaining = Math.max(0, parsedBudget - totalSpent);

  const presets = currencyCode === 'INR'
    ? [25000, 50000, 100000, 200000]
    : currencyCode === 'THB'
    ? [15000, 30000, 60000, 100000]
    : currencyCode === 'AED'
    ? [2500, 5000, 10000, 20000]
    : [1000, 2500, 5000, 10000];

  const handleSave = async () => {
    if (parsedBudget <= 0) {
      Alert.alert('Invalid Budget', 'Please enter a budget amount greater than 0.');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    await setBudgetLimit(parsedBudget);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity testID="btn-dismiss" accessibilityLabel="Dismiss" style={styles.overlay} activeOpacity={1} onPress={onClose} />

        <View style={[styles.dialogCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleWrap}>
              <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="wallet-outline" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.title, { color: colors.heading }]}>Set Trip Budget</Text>
            </View>
            <TouchableOpacity testID="btn-close" accessibilityLabel="Close" onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={colors.mutedText} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subText, { color: colors.mutedText }]}>
            Define your overall trip spending limit. All category analytics and remaining balances will update live.
          </Text>

          {/* Input */}
          <View style={[styles.inputBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.currencyPrefix, { color: colors.primary }]}>{currencySymbol}</Text>
            <TextInput
              style={[styles.input, { color: colors.heading }]}
              value={budgetInput}
              onChangeText={setBudgetInput}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.mutedText}
              autoFocus
            />
            <Text style={[styles.currencySuffix, { color: colors.mutedText }]}>{currencyCode}</Text>
          </View>

          {/* Quick Presets */}
          <Text style={[styles.presetLabel, { color: colors.mutedText }]}>QUICK PRESETS</Text>
          <View style={styles.presetRow}>
            {presets.map((preset) => (
              <TouchableOpacity testID="btn-setbudgetmodal-112" accessibilityLabel="setbudgetmodal action"
                key={preset}
                style={[
                  styles.presetChip,
                  {
                    backgroundColor: parsedBudget === preset ? colors.primary : colors.background,
                    borderColor: parsedBudget === preset ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => {
                  try {
                    Haptics.selectionAsync();
                  } catch {}
                  setBudgetInput(preset.toString());
                }}
              >
                <Text
                  style={[
                    styles.presetText,
                    { color: parsedBudget === preset ? '#FFFFFF' : colors.text },
                  ]}
                >
                  {currencySymbol}{preset >= 1000 ? `${preset / 1000}k` : preset}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Live impact preview */}
          <View style={[styles.previewCard, { backgroundColor: `${colors.primary}08`, borderColor: `${colors.primary}25` }]}>
            <View style={styles.previewRow}>
              <Text style={[styles.previewLabel, { color: colors.mutedText }]}>Total Spent to Date:</Text>
              <Text style={[styles.previewValue, { color: colors.heading }]}>
                {currencySymbol}{totalSpent.toLocaleString()}
              </Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={[styles.previewLabel, { color: colors.mutedText }]}>Projected Remaining:</Text>
              <Text
                style={[
                  styles.previewValue,
                  { color: projectedRemaining > 0 ? '#10B981' : '#EF4444', fontWeight: '700' },
                ]}
              >
                {currencySymbol}{projectedRemaining.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity testID="btn-cancel" accessibilityLabel="Cancel"
              style={[styles.cancelBtn, { borderColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelBtnText, { color: colors.mutedText }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity testID="btn-update-budget" accessibilityLabel="Update Budget"
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleSave}
            >
              <Text style={styles.saveBtnText}>Update Budget</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  subText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 14,
  },
  currencyPrefix: {
    fontSize: 22,
    fontWeight: '700',
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
  },
  currencySuffix: {
    fontSize: 14,
    fontWeight: '600',
  },
  presetLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  presetChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 38,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '700',
  },
  previewCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 18,
    gap: 6,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 13,
  },
  previewValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1.5,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

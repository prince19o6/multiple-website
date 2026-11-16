import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useCurrency, SUPPORTED_CURRENCIES } from '../context/CurrencyContext';
import { useTripBudget } from '../context/TripBudgetContext';
import { ExpenseCategory, PaymentMethod } from '../types';

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
}

interface CategoryOption {
  category: ExpenseCategory;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const CATEGORIES: CategoryOption[] = [
  { category: 'dining', label: 'Dining', icon: 'restaurant', color: '#EF4444' },
  { category: 'transport', label: 'Transport', icon: 'car', color: '#3B82F6' },
  { category: 'activities', label: 'Activities', icon: 'compass', color: '#8B5CF6' },
  { category: 'shopping', label: 'Shopping', icon: 'bag-handle', color: '#EC4899' },
  { category: 'tipping', label: 'Tipping', icon: 'heart', color: '#10B981' },
  { category: 'lodging', label: 'Lodging', icon: 'bed', color: '#F59E0B' },
  { category: 'other', label: 'Other', icon: 'receipt', color: '#6B7280' },
];

const PAYMENT_METHODS: { method: PaymentMethod; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { method: 'cash', label: 'Cash', icon: 'cash-outline' },
  { method: 'credit_card', label: 'Credit Card', icon: 'card-outline' },
  { method: 'debit_card', label: 'Debit Card', icon: 'card' },
  { method: 'upi', label: 'UPI / QR', icon: 'qr-code-outline' },
  { method: 'mobile_pay', label: 'Mobile Pay', icon: 'phone-portrait-outline' },
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { currencyCode, currentCurrency } = useCurrency();
  const { addExpense, uniqueTravelers } = useTripBudget();

  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState(currencyCode);
  const [category, setCategory] = useState<ExpenseCategory>('dining');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paidBy, setPaidBy] = useState('Me');
  const [splitWith, setSplitWith] = useState<string[]>(['Me']);
  const [newTravelerName, setNewTravelerName] = useState('');
  const [showAddTraveler, setShowAddTraveler] = useState(false);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  // Initial travelers list combining existing + Me
  const [allTravelers, setAllTravelers] = useState<string[]>(['Me']);

  useEffect(() => {
    if (visible) {
      setSelectedCurrency(currencyCode);
      const combined = Array.from(new Set(['Me', ...uniqueTravelers]));
      setAllTravelers(combined);
      if (!splitWith.length) {
        setSplitWith(['Me']);
      }
    }
  }, [visible, currencyCode, uniqueTravelers]);

  const resetForm = () => {
    setTitle('');
    setAmountStr('');
    setCategory('dining');
    setPaymentMethod('cash');
    setPaidBy('Me');
    setSplitWith(['Me']);
    setLocation('');
    setNotes('');
    setShowAddTraveler(false);
    setNewTravelerName('');
  };

  const handleToggleSplitter = (traveler: string) => {
    try {
      Haptics.selectionAsync();
    } catch {}

    if (splitWith.includes(traveler)) {
      if (splitWith.length === 1) {
        Alert.alert('Required', 'At least one traveler must share this expense.');
        return;
      }
      setSplitWith(splitWith.filter((t) => t !== traveler));
    } else {
      setSplitWith([...splitWith, traveler]);
    }
  };

  const handleAddNewTraveler = () => {
    const trimmed = newTravelerName.trim();
    if (!trimmed) return;
    if (allTravelers.includes(trimmed)) {
      Alert.alert('Traveler Exists', 'This traveler is already in your group.');
      return;
    }
    const updated = [...allTravelers, trimmed];
    setAllTravelers(updated);
    setSplitWith([...splitWith, trimmed]);
    setNewTravelerName('');
    setShowAddTraveler(false);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  // Live conversion estimation
  const parsedAmount = parseFloat(amountStr) || 0;
  const estimatedDisplayAmount = (() => {
    if (parsedAmount <= 0) return 0;
    if (selectedCurrency === currencyCode) return parsedAmount;
    const fromDef = SUPPORTED_CURRENCIES.find((c) => c.code === selectedCurrency) || { rate: 1.0 };
    const amountInUSD = parsedAmount / (fromDef.rate || 1.0);
    return Math.round(amountInUSD * currentCurrency.rate * 100) / 100;
  })();

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter a description for the expense.');
      return;
    }
    if (parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter an expense amount greater than 0.');
      return;
    }
    if (!paidBy.trim()) {
      Alert.alert('Payer Required', 'Please specify who paid for this expense.');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    const today = new Date().toISOString().split('T')[0];

    await addExpense({
      title: title.trim(),
      amount: parsedAmount,
      currency: selectedCurrency,
      category,
      paymentMethod,
      paidBy: paidBy.trim(),
      splitWith: splitWith.length > 0 ? splitWith : [paidBy.trim()],
      date: today,
      location: location.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.root, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Modal Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity testID="btn-close" accessibilityLabel="Close" onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={colors.heading} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.heading }]}>Add In-Trip Expense</Text>
          <TouchableOpacity testID="btn-save" accessibilityLabel="Save" onPress={handleSubmit} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Amount and Currency Card */}
          <View style={[styles.amountCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionLabel, { color: colors.mutedText }]}>ENTER AMOUNT</Text>
            <View style={styles.amountInputRow}>
              {/* Currency Picker Horizontal scroll */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.currencyScroll}>
                {SUPPORTED_CURRENCIES.map((cur) => {
                  const isCurSelected = selectedCurrency === cur.code;
                  return (
                    <TouchableOpacity testID="btn-addexpensemodal-214" accessibilityLabel="addexpensemodal action"
                      key={cur.code}
                      style={[
                        styles.currencyPill,
                        {
                          backgroundColor: isCurSelected ? colors.primary : `${colors.border}40`,
                          borderColor: isCurSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => {
                        try {
                          Haptics.selectionAsync();
                        } catch {}
                        setSelectedCurrency(cur.code);
                      }}
                    >
                      <Text style={[styles.currencyPillText, { color: isCurSelected ? '#FFFFFF' : colors.text }]}>
                        {cur.symbol} {cur.code}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.largeInputContainer}>
              <Text style={[styles.largeCurrencySymbol, { color: colors.primary }]}>
                {SUPPORTED_CURRENCIES.find((c) => c.code === selectedCurrency)?.symbol || selectedCurrency}
              </Text>
              <TextInput
                style={[styles.largeAmountInput, { color: colors.heading }]}
                placeholder="0.00"
                placeholderTextColor={colors.mutedText}
                keyboardType="decimal-pad"
                value={amountStr}
                onChangeText={setAmountStr}
                autoFocus
              />
            </View>

            {/* Currency conversion preview if paying in foreign currency */}
            {selectedCurrency !== currencyCode && parsedAmount > 0 && (
              <View style={[styles.conversionBadge, { backgroundColor: `${colors.primary}12` }]}>
                <Ionicons name="swap-horizontal" size={14} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.conversionBadgeText, { color: colors.primary }]}>
                  ≈ {currentCurrency.symbol} {estimatedDisplayAmount.toLocaleString()} {currencyCode}
                </Text>
              </View>
            )}
          </View>

          {/* Expense Title */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>EXPENSE DESCRIPTION *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. Seafood Dinner, TukTuk Ride, Temple Entry"
              placeholderTextColor={colors.mutedText}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Category Chips */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>CATEGORY</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.category;
                return (
                  <TouchableOpacity testID="btn-addexpensemodal-284" accessibilityLabel="addexpensemodal action"
                    key={cat.category}
                    style={[
                      styles.categoryCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: isSelected ? cat.color : colors.border,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    onPress={() => {
                      try {
                        Haptics.selectionAsync();
                      } catch {}
                      setCategory(cat.category);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.categoryIconWrap, { backgroundColor: `${cat.color}15` }]}>
                      <Ionicons name={cat.icon} size={18} color={cat.color} />
                    </View>
                    <Text
                      style={[
                        styles.categoryLabel,
                        { color: isSelected ? cat.color : colors.text, fontWeight: isSelected ? '700' : '500' },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Payment Method */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>PAYMENT METHOD</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paymentScroll}>
              {PAYMENT_METHODS.map((pm) => {
                const isSelected = paymentMethod === pm.method;
                return (
                  <TouchableOpacity testID="btn-addexpensemodal-326" accessibilityLabel="addexpensemodal action"
                    key={pm.method}
                    style={[
                      styles.paymentMethodChip,
                      {
                        backgroundColor: isSelected ? `${colors.primary}18` : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderWidth: isSelected ? 1.5 : 1,
                      },
                    ]}
                    onPress={() => {
                      try {
                        Haptics.selectionAsync();
                      } catch {}
                      setPaymentMethod(pm.method);
                    }}
                  >
                    <Ionicons
                      name={pm.icon}
                      size={16}
                      color={isSelected ? colors.primary : colors.mutedText}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.paymentMethodText,
                        { color: isSelected ? colors.primary : colors.text, fontWeight: isSelected ? '700' : '500' },
                      ]}
                    >
                      {pm.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Paid By Traveler */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>PAID BY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.travelerScroll}>
              {allTravelers.map((traveler) => {
                const isSelected = paidBy === traveler;
                return (
                  <TouchableOpacity testID="btn-person" accessibilityLabel="person"
                    key={traveler}
                    style={[
                      styles.travelerPill,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      try {
                        Haptics.selectionAsync();
                      } catch {}
                      setPaidBy(traveler);
                    }}
                  >
                    <Ionicons
                      name="person"
                      size={14}
                      color={isSelected ? '#FFFFFF' : colors.mutedText}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.travelerText, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                      {traveler}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Split Among Group */}
          <View style={styles.inputGroup}>
            <View style={styles.splitHeaderRow}>
              <Text style={[styles.fieldLabel, { color: colors.mutedText, marginBottom: 0 }]}>
                SPLIT WITH ({splitWith.length} TRAVELERS)
              </Text>
              <TouchableOpacity testID="btn-person-add" accessibilityLabel="person add"
                onPress={() => setShowAddTraveler(!showAddTraveler)}
                style={styles.addTravelerBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="person-add" size={14} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.addTravelerText, { color: colors.primary }]}>+ Add Person</Text>
              </TouchableOpacity>
            </View>

            {/* Add New Traveler inline input */}
            {showAddTraveler && (
              <View style={[styles.addTravelerInputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.newTravelerInput, { color: colors.text }]}
                  placeholder="Enter traveler name (e.g. Sam, Maria)"
                  placeholderTextColor={colors.mutedText}
                  value={newTravelerName}
                  onChangeText={setNewTravelerName}
                  autoFocus
                />
                <TouchableOpacity testID="btn-add" accessibilityLabel="Add"
                  style={[styles.addTravelerConfirmBtn, { backgroundColor: colors.primary }]}
                  onPress={handleAddNewTraveler}
                >
                  <Text style={styles.addTravelerConfirmText}>Add</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.splitTravelersWrap}>
              {allTravelers.map((traveler) => {
                const isIncluded = splitWith.includes(traveler);
                const shareAmount =
                  splitWith.length > 0 && isIncluded
                    ? Math.round((parsedAmount / splitWith.length) * 100) / 100
                    : 0;

                return (
                  <TouchableOpacity testID="btn-addexpensemodal-446" accessibilityLabel="addexpensemodal action"
                    key={traveler}
                    style={[
                      styles.splitChip,
                      {
                        backgroundColor: isIncluded ? `${colors.primary}15` : colors.surface,
                        borderColor: isIncluded ? colors.primary : colors.border,
                        borderWidth: isIncluded ? 1.5 : 1,
                      },
                    ]}
                    onPress={() => handleToggleSplitter(traveler)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isIncluded ? 'checkbox' : 'square-outline'}
                      size={18}
                      color={isIncluded ? colors.primary : colors.mutedText}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.splitChipLabel,
                        { color: isIncluded ? colors.primary : colors.text, fontWeight: isIncluded ? '700' : '500' },
                      ]}
                    >
                      {traveler}
                    </Text>
                    {isIncluded && parsedAmount > 0 && (
                      <Text style={[styles.splitChipShare, { color: colors.mutedText }]}>
                        ({selectedCurrency} {shareAmount.toLocaleString()})
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Location & Venue */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>LOCATION / VENUE (OPTIONAL)</Text>
            <View style={[styles.iconInputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="location-outline" size={18} color={colors.mutedText} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.iconInput, { color: colors.text }]}
                placeholder="e.g. Marina Mall, Floating Market, Old Souk"
                placeholderTextColor={colors.mutedText}
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>NOTES (OPTIONAL)</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. Shared bill with invoice, cash paid by Alex"
              placeholderTextColor={colors.mutedText}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeBtn: {
    padding: 6,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
  },
  amountCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  amountInputRow: {
    width: '100%',
    marginBottom: 12,
  },
  currencyScroll: {
    flexDirection: 'row',
  },
  currencyPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  currencyPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  largeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  largeCurrencySymbol: {
    fontSize: 32,
    fontWeight: '700',
    marginRight: 8,
  },
  largeAmountInput: {
    fontSize: 38,
    fontWeight: '800',
    minWidth: 140,
    textAlign: 'center',
  },
  conversionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  conversionBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  iconInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  iconInput: {
    flex: 1,
    fontSize: 15,
  },
  textArea: {
    height: 76,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryCard: {
    width: '31%',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
  },
  categoryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  paymentScroll: {
    flexDirection: 'row',
    paddingVertical: 2,
    gap: 8,
  },
  paymentMethodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    minHeight: 44,
  },
  paymentMethodText: {
    fontSize: 13,
  },
  travelerScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  travelerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 44,
  },
  travelerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  splitHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addTravelerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  addTravelerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  addTravelerInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    marginBottom: 10,
    height: 44,
  },
  newTravelerInput: {
    flex: 1,
    fontSize: 13,
  },
  addTravelerConfirmBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addTravelerConfirmText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  splitTravelersWrap: {
    flexDirection: 'column',
    gap: 8,
  },
  splitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    minHeight: 44,
  },
  splitChipLabel: {
    fontSize: 13,
    marginRight: 6,
  },
  splitChipShare: {
    fontSize: 12,
  },
});

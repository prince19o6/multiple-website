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
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { useTaxRefund } from '../context/TaxRefundContext';

const CATEGORIES = [
  'Fashion & Apparel',
  'Luxury & Watches',
  'Electronics & Gadgets',
  'Jewelry & Gold',
  'Cosmetics & Perfumes',
  'Souvenirs & Crafts',
];

interface AddTaxReceiptModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AddTaxReceiptModal: React.FC<AddTaxReceiptModalProps> = ({ visible, onClose }) => {
  const colors = useColors();
  const { rules, calculateEstimatedRefund, addReceipt } = useTaxRefund();

  const [storeName, setStoreName] = useState('');
  const [storeBranch, setStoreBranch] = useState('');
  const [purchaseAmountStr, setPurchaseAmountStr] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [taxFormNumber, setTaxFormNumber] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const purchaseAmount = parseFloat(purchaseAmountStr) || 0;
  const estimatedRefund = calculateEstimatedRefund(purchaseAmount);
  const currency = rules?.currencyCode || 'THB';
  const inspectionThreshold = rules?.customsInspectionThreshold || 20000;
  const isLuxury = selectedCategory === 'Luxury & Watches' || selectedCategory === 'Jewelry & Gold' || selectedCategory === 'Electronics & Gadgets';
  const requiresInspection = purchaseAmount >= inspectionThreshold || isLuxury;

  const handleSave = async () => {
    if (!storeName.trim()) {
      Alert.alert('Store Name Required', 'Please enter the name of the store where the purchase was made.');
      return;
    }
    if (purchaseAmount <= 0) {
      Alert.alert('Valid Amount Required', 'Please enter a valid purchase amount greater than zero.');
      return;
    }

    setIsSubmitting(true);
    const success = await addReceipt({
      storeName: storeName.trim(),
      storeBranch: storeBranch.trim() || undefined,
      purchaseAmount,
      category: selectedCategory,
      taxFormNumber: taxFormNumber.trim() || undefined,
      invoiceNumber: invoiceNumber.trim() || undefined,
      notes: notes.trim() || undefined,
      purchaseDate: new Date().toISOString().split('T')[0],
    });

    setIsSubmitting(false);
    if (success) {
      // Reset form
      setStoreName('');
      setStoreBranch('');
      setPurchaseAmountStr('');
      setTaxFormNumber('');
      setInvoiceNumber('');
      setNotes('');
      onClose();
    } else {
      Alert.alert('Save Failed', 'Could not save tax invoice. Please try again.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.modalTitle, { color: colors.heading }]}>
                Add Tax-Free Receipt
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.mutedText }]}>
                Track VAT/GST refund for airport customs claim
              </Text>
            </View>
            <TouchableOpacity testID="btn-close"
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityLabel="Close add receipt modal"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={24} color={colors.heading} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Live Calculation Preview Banner */}
            <View style={[styles.calculationCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.calcRow}>
                <View>
                  <Text style={[styles.calcLabel, { color: colors.mutedText }]}>
                    ESTIMATED NET REFUND
                  </Text>
                  <Text style={styles.calcValue}>
                    +{estimatedRefund.toLocaleString()} {currency}
                  </Text>
                </View>
                <View style={styles.calcRateBadge}>
                  <Text style={styles.calcRateText}>
                    ~{rules?.estimatedRefundPercent || 5.5}% NET
                  </Text>
                </View>
              </View>

              {requiresInspection && (
                <View style={styles.inspectionNotice}>
                  <Ionicons name="alert-circle" size={13} color="#d97706" />
                  <Text style={styles.inspectionNoticeText}>
                    Customs inspection required before check-in (Value &gt; {inspectionThreshold.toLocaleString()} {currency} or luxury item).
                  </Text>
                </View>
              )}
            </View>

            {/* Store Name Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.heading }]}>
                STORE / MERCHANT NAME *
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.background,
                    color: colors.heading,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="e.g. Siam Paragon, Apple Store, Sabyasachi..."
                placeholderTextColor={colors.mutedText}
                value={storeName}
                onChangeText={setStoreName}
              />
            </View>

            {/* Purchase Amount & Branch Row */}
            <View style={styles.twoColRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.heading }]}>
                  AMOUNT ({currency}) *
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.background,
                      color: colors.heading,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="0.00"
                  placeholderTextColor={colors.mutedText}
                  keyboardType="numeric"
                  value={purchaseAmountStr}
                  onChangeText={setPurchaseAmountStr}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.heading }]}>
                  BRANCH / MALL
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.background,
                      color: colors.heading,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="e.g. Terminal 21, Dubai Mall"
                  placeholderTextColor={colors.mutedText}
                  value={storeBranch}
                  onChangeText={setStoreBranch}
                />
              </View>
            </View>

            {/* Category Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.heading }]}>
                PRODUCT CATEGORY
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <TouchableOpacity testID="btn-addtaxreceiptmodal-224" accessibilityLabel="addtaxreceiptmodal action"
                      key={cat}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.background,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setSelectedCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          {
                            color: isSelected ? '#ffffff' : colors.heading,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Tax Form Number & Invoice Number */}
            <View style={styles.twoColRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.heading }]}>
                  TAX FORM / TAG ID
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.background,
                      color: colors.heading,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="e.g. PP10-998124"
                  placeholderTextColor={colors.mutedText}
                  value={taxFormNumber}
                  onChangeText={setTaxFormNumber}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: colors.heading }]}>
                  INVOICE #
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.background,
                      color: colors.heading,
                      borderColor: colors.border,
                    },
                  ]}
                  placeholder="e.g. INV-10294"
                  placeholderTextColor={colors.mutedText}
                  value={invoiceNumber}
                  onChangeText={setInvoiceNumber}
                />
              </View>
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.heading }]}>
                NOTES / REMINDERS
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.background,
                    color: colors.heading,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="e.g. Pack inside carry-on luggage for Customs Gate 10 inspection..."
                placeholderTextColor={colors.mutedText}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity testID="btn-checkmark-circle"
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              disabled={isSubmitting}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Save tax-free shopping receipt"
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.saveBtnText}>Save to Tax Claim Pass</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  calculationCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  calcValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#15803d',
    marginTop: 2,
  },
  calcRateBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  calcRateText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
  },
  inspectionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  inspectionNoticeText: {
    fontSize: 11,
    color: '#b45309',
    flex: 1,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryScroll: {
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 12,
  },
  textArea: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 70,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    marginTop: 10,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});

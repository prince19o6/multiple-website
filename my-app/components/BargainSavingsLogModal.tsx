import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useBargain } from '@/context/BargainContext';

interface BargainSavingsLogModalProps {
  visible: boolean;
  onClose: () => void;
}

export const BargainSavingsLogModal: React.FC<BargainSavingsLogModalProps> = ({
  visible,
  onClose,
}) => {
  const colors = useColors();
  const {
    bargainData,
    savedLogs,
    totalSaved,
    addBargainLog,
    removeBargainLog,
    askingPrice,
    calculation,
  } = useBargain();

  const [itemName, setItemName] = useState<string>('');
  const [marketName, setMarketName] = useState<string>('');
  const [initialPriceInput, setInitialPriceInput] = useState<string>(
    askingPrice > 0 ? askingPrice.toString() : ''
  );
  const [finalPriceInput, setFinalPriceInput] = useState<string>(
    calculation?.targetPrice ? calculation.targetPrice.toString() : ''
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const currencySymbol = bargainData?.currencySymbol || '฿';

  const initialVal = parseFloat(initialPriceInput) || 0;
  const finalVal = parseFloat(finalPriceInput) || 0;
  const potentialSavings = Math.max(0, initialVal - finalVal);

  const handleSave = async () => {
    if (initialVal <= 0 || finalVal <= 0) return;
    setIsSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    try {
      await addBargainLog({
        itemName: itemName.trim() || 'Night Market Treasure',
        marketName: marketName.trim() || bargainData?.city || 'Local Bazaar',
        initialPrice: initialVal,
        finalPrice: finalVal,
      });

      setItemName('');
      setMarketName('');
      setInitialPriceInput('');
      setFinalPriceInput('');
      onClose();
    } catch (err) {
      console.warn('[BargainSavingsLogModal] Error saving log:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    removeBargainLog(id);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {/* Top Bar */}
          <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            <TouchableOpacity testID="btn-close"
              style={[styles.closeBtn, { backgroundColor: colors.background }]}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close log modal"
            >
              <Ionicons name="close" size={22} color={colors.heading} />
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.headerTitle, { color: colors.heading }]}>
                Bargain Savings Wallet
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
                Track your street market discounts
              </Text>
            </View>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
          >
            {/* Total Savings Card */}
            <View
              style={[
                styles.totalSavingsCard,
                { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
              ]}
            >
              <View style={styles.totalSavingsLeft}>
                <Text style={styles.totalSavingsLabel}>TOTAL NEGOTIATED SAVINGS</Text>
                <Text style={styles.totalSavingsAmount}>
                  {currencySymbol}{totalSaved.toLocaleString()}
                </Text>
                <Text style={styles.totalSavingsSub}>
                  {savedLogs.length} bargain win{savedLogs.length !== 1 ? 's' : ''} recorded
                </Text>
              </View>
              <View style={styles.totalSavingsIcon}>
                <Ionicons name="wallet-outline" size={32} color="#16a34a" />
              </View>
            </View>

            {/* Add New Bargain Entry Form */}
            <View
              style={[
                styles.formCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.formTitle, { color: colors.heading }]}>
                Record A New Bargain Win 🏆
              </Text>

              {/* Item Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.mutedText }]}>ITEM NAME</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: colors.background, color: colors.heading, borderColor: colors.border }]}
                  placeholder="e.g. Elephant Pants / Silk Scarf"
                  placeholderTextColor={colors.mutedText}
                  value={itemName}
                  onChangeText={setItemName}
                />
              </View>

              {/* Market Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.mutedText }]}>MARKET / STALL</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: colors.background, color: colors.heading, borderColor: colors.border }]}
                  placeholder="e.g. Chatuchak Weekend Market"
                  placeholderTextColor={colors.mutedText}
                  value={marketName}
                  onChangeText={setMarketName}
                />
              </View>

              {/* Pricing Row */}
              <View style={styles.priceRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.mutedText }]}>INITIAL ASK ({currencySymbol})</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: colors.background, color: colors.heading, borderColor: colors.border }]}
                    placeholder="600"
                    placeholderTextColor={colors.mutedText}
                    keyboardType="numeric"
                    value={initialPriceInput}
                    onChangeText={setInitialPriceInput}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.mutedText }]}>FINAL PAID ({currencySymbol})</Text>
                  <TextInput
                    style={[styles.inputField, { backgroundColor: colors.background, color: colors.heading, borderColor: colors.border }]}
                    placeholder="400"
                    placeholderTextColor={colors.mutedText}
                    keyboardType="numeric"
                    value={finalPriceInput}
                    onChangeText={setFinalPriceInput}
                  />
                </View>
              </View>

              {/* Live Savings Calculation Banner */}
              {potentialSavings > 0 && (
                <View style={[styles.savingsBanner, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                  <Ionicons name="sparkles" size={16} color="#2563eb" />
                  <Text style={styles.savingsBannerText}>
                    You saved {currencySymbol}{potentialSavings.toLocaleString()} on this item! 🎉
                  </Text>
                </View>
              )}

              {/* Submit button */}
              <TouchableOpacity testID="btn-checkmark-circle-outline"
                style={[
                  styles.saveBtn,
                  { backgroundColor: colors.primary },
                  (initialVal <= 0 || finalVal <= 0 || isSubmitting) && { opacity: 0.6 },
                ]}
                disabled={initialVal <= 0 || finalVal <= 0 || isSubmitting}
                onPress={handleSave}
                accessibilityRole="button"
                accessibilityLabel="Save bargain entry"
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#ffffff" />
                <Text style={styles.saveBtnText}>
                  {isSubmitting ? 'Saving...' : 'Add to Savings Wallet'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Past History List */}
            <Text style={[styles.historyHeader, { color: colors.mutedText }]}>
              RECENT BARGAIN WINS
            </Text>

            {savedLogs.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="receipt-outline" size={32} color={colors.mutedText} />
                <Text style={[styles.emptyText, { color: colors.mutedText }]}>
                  No items logged yet. Record your first negotiated night market souvenir!
                </Text>
              </View>
            ) : (
              savedLogs.map((log) => (
                <View
                  key={log.id}
                  style={[
                    styles.logItem,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.logItemName, { color: colors.heading }]}>
                      {log.itemName}
                    </Text>
                    <Text style={[styles.logMarket, { color: colors.mutedText }]}>
                      📍 {log.marketName}
                    </Text>
                    <Text style={[styles.logPriceDetails, { color: colors.mutedText }]}>
                      Initial: {log.currency}{log.initialPrice} • Paid: {log.currency}{log.finalPrice}
                    </Text>
                  </View>

                  <View style={styles.logRight}>
                    <View style={styles.savedBadge}>
                      <Text style={styles.savedBadgeText}>
                        +{log.currency}{log.savings}
                      </Text>
                    </View>
                    <TouchableOpacity testID="btn-trash-outline"
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(log.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete log ${log.itemName}`}
                    >
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  totalSavingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  totalSavingsLeft: {
    flex: 1,
  },
  totalSavingsLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803d',
    letterSpacing: 0.8,
  },
  totalSavingsAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#166534',
    marginVertical: 2,
  },
  totalSavingsSub: {
    fontSize: 12,
    color: '#15803d',
  },
  totalSavingsIcon: {
    marginLeft: 12,
  },
  formCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  inputField: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  priceRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  savingsBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1d4ed8',
  },
  saveBtn: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  historyHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  emptyBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  logItemName: {
    fontSize: 14,
    fontWeight: '700',
  },
  logMarket: {
    fontSize: 12,
    marginTop: 2,
  },
  logPriceDetails: {
    fontSize: 11,
    marginTop: 2,
  },
  logRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  savedBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  savedBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#16a34a',
  },
  deleteBtn: {
    padding: 4,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

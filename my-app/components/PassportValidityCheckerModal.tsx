import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useVisa } from '../context/VisaContext';

interface PassportValidityCheckerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PassportValidityCheckerModal: React.FC<PassportValidityCheckerModalProps> = ({
  visible,
  onClose,
}) => {
  const colors = useColors();
  const { validatePassport, lastValidityResult, selectedDestination } = useVisa();

  const [expiryDate, setExpiryDate] = useState<string>('2027-12-31');
  const [departureDate, setDepartureDate] = useState<string>('2026-11-15');
  const [isValidating, setIsValidating] = useState<boolean>(false);

  const handleQuickPreset = (monthsOut: number) => {
    Haptics.selectionAsync().catch(() => {});
    const now = new Date();
    now.setMonth(now.getMonth() + monthsOut);
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    setDepartureDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleValidate = async () => {
    if (!expiryDate.trim() || !departureDate.trim()) return;
    setIsValidating(true);
    await validatePassport(expiryDate.trim(), departureDate.trim());
    setIsValidating(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.heading }]}>
                Passport 6-Month Validity Checker
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedText }]}>
                ICAO International Immigration Rule &bull; {selectedDestination}
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
            {/* Context Note */}
            <View style={[styles.infoBanner, { backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }]}>
              <Ionicons name="information-circle" size={18} color="#0284c7" />
              <Text style={[styles.infoBannerText, { color: '#0369a1' }]}>
                Airlines and international border immigration will strictly deny boarding if your passport has less than 6 months validity remaining on the day of travel.
              </Text>
            </View>

            {/* Inputs */}
            <Text style={[styles.fieldLabel, { color: colors.heading }]}>
              YOUR PASSPORT EXPIRY DATE (YYYY-MM-DD)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  color: colors.heading,
                  borderColor: colors.border,
                },
              ]}
              value={expiryDate}
              onChangeText={setExpiryDate}
              placeholder="e.g. 2027-10-25"
              placeholderTextColor={colors.mutedText}
              autoCapitalize="none"
            />

            <Text style={[styles.fieldLabel, { color: colors.heading }]}>
              TRIP DEPARTURE DATE (YYYY-MM-DD)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  color: colors.heading,
                  borderColor: colors.border,
                },
              ]}
              value={departureDate}
              onChangeText={setDepartureDate}
              placeholder="e.g. 2026-11-15"
              placeholderTextColor={colors.mutedText}
              autoCapitalize="none"
            />

            {/* Quick Departure Presets */}
            <View style={styles.presetsRow}>
              <Text style={[styles.presetLabel, { color: colors.mutedText }]}>Quick Travel Dates:</Text>
              <TouchableOpacity testID="btn-in-1-month" accessibilityLabel="In 1 Month"
                style={[styles.presetChip, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => handleQuickPreset(1)}
              >
                <Text style={[styles.presetChipText, { color: colors.primary }]}>In 1 Month</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="btn-in-3-months" accessibilityLabel="In 3 Months"
                style={[styles.presetChip, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => handleQuickPreset(3)}
              >
                <Text style={[styles.presetChipText, { color: colors.primary }]}>In 3 Months</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="btn-in-6-months" accessibilityLabel="In 6 Months"
                style={[styles.presetChip, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => handleQuickPreset(6)}
              >
                <Text style={[styles.presetChipText, { color: colors.primary }]}>In 6 Months</Text>
              </TouchableOpacity>
            </View>

            {/* Validate Button */}
            <TouchableOpacity testID="btn-calculator-outline" accessibilityLabel="calculator outline"
              style={[
                styles.validateBtn,
                { backgroundColor: colors.primary, opacity: isValidating ? 0.7 : 1 },
              ]}
              onPress={handleValidate}
              disabled={isValidating}
            >
              {isValidating ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="calculator-outline" size={18} color="#ffffff" />
                  <Text style={styles.validateBtnText}>Verify Passport Compliance</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Results Gauge Box */}
            {lastValidityResult && (
              <View
                style={[
                  styles.resultCard,
                  {
                    backgroundColor:
                      lastValidityResult.status === 'Valid'
                        ? '#ecfdf5'
                        : lastValidityResult.status === 'Warning'
                        ? '#fffbeb'
                        : '#fef2f2',
                    borderColor:
                      lastValidityResult.status === 'Valid'
                        ? '#86efac'
                        : lastValidityResult.status === 'Warning'
                        ? '#fde68a'
                        : '#fca5a5',
                  },
                ]}
              >
                <View style={styles.resultHeader}>
                  <Ionicons
                    name={
                      lastValidityResult.status === 'Valid'
                        ? 'checkmark-circle'
                        : lastValidityResult.status === 'Warning'
                        ? 'warning'
                        : 'close-circle'
                    }
                    size={28}
                    color={
                      lastValidityResult.status === 'Valid'
                        ? '#16a34a'
                        : lastValidityResult.status === 'Warning'
                        ? '#d97706'
                        : '#dc2626'
                    }
                  />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text
                      style={[
                        styles.resultStatusText,
                        {
                          color:
                            lastValidityResult.status === 'Valid'
                              ? '#15803d'
                              : lastValidityResult.status === 'Warning'
                              ? '#b45309'
                              : '#991b1b',
                        },
                      ]}
                    >
                      {lastValidityResult.status === 'Valid'
                        ? 'COMPLIANT • SAFE TO TRAVEL'
                        : lastValidityResult.status === 'Warning'
                        ? 'BOARDING DENIAL RISK'
                        : 'PASSPORT EXPIRED'}
                    </Text>
                    <Text style={styles.resultMonthsText}>
                      {lastValidityResult.monthsRemaining.toFixed(1)} Months Remaining ({lastValidityResult.daysRemainingOnDeparture} Days)
                    </Text>
                  </View>
                </View>

                <Text style={styles.resultMessage}>{lastValidityResult.message}</Text>

                {lastValidityResult.renewalRecommended && (
                  <View style={styles.renewalAlertBox}>
                    <Ionicons name="alert-circle" size={16} color="#b91c1c" />
                    <Text style={styles.renewalAlertText}>
                      Action Recommended: Contact your regional passport office or consulate for urgent tatkal / express passport renewal immediately.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
    maxHeight: '88%',
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
    fontSize: 17,
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
  infoBanner: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    marginBottom: 16,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    marginBottom: 6,
  },
  presetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  presetLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  validateBtn: {
    minHeight: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 18,
  },
  validateBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  resultCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultStatusText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  resultMonthsText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 2,
  },
  resultMessage: {
    fontSize: 13,
    lineHeight: 18,
    color: '#334155',
    marginBottom: 10,
  },
  renewalAlertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fee2e2',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  renewalAlertText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
    color: '#991b1b',
    fontWeight: '600',
  },
});

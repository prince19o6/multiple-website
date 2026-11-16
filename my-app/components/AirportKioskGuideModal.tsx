import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { useTaxRefund } from '../context/TaxRefundContext';

interface AirportKioskGuideModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AirportKioskGuideModal: React.FC<AirportKioskGuideModalProps> = ({
  visible,
  onClose,
}) => {
  const colors = useColors();
  const { rules } = useTaxRefund();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.heading }]}>
                Airport Customs & Refund Guide
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedText }]}>
                {rules?.taxSchemeName || 'International VAT/GST Refund Steps'}
              </Text>
            </View>
            <TouchableOpacity testID="btn-close"
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close airport guide"
            >
              <Ionicons name="close" size={24} color={colors.heading} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Warning Banner */}
            <View style={styles.crucialWarning}>
              <Ionicons name="warning" size={20} color="#b45309" />
              <View style={{ flex: 1 }}>
                <Text style={styles.crucialTitle}>CRITICAL AIRPORT RULE</Text>
                <Text style={styles.crucialText}>
                  Do NOT pack luxury items (watches, jewelry, phones) into checked luggage before getting your Customs Stamp. Customs officers must physically verify high-value items!
                </Text>
              </View>
            </View>

            {/* Step-by-Step Flow */}
            <Text style={[styles.sectionHeading, { color: colors.heading }]}>
              3-STEP AIRPORT REFUND PROCESS
            </Text>

            {/* Step 1 */}
            <View style={[styles.stepCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={[styles.stepNumberBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepBody}>
                <Text style={[styles.stepTitle, { color: colors.heading }]}>
                  Landside: Customs Inspection Desk
                </Text>
                <Text style={[styles.stepDesc, { color: colors.mutedText }]}>
                  BEFORE checking in your airline baggage, visit the Customs Office in the main Departure Hall with your tax invoices and goods to receive the official stamp or digital kiosk validation.
                </Text>
              </View>
            </View>

            {/* Step 2 */}
            <View style={[styles.stepCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={[styles.stepNumberBadge, { backgroundColor: '#64748b' }]}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepBody}>
                <Text style={[styles.stepTitle, { color: colors.heading }]}>
                  Airline Check-In & Security
                </Text>
                <Text style={[styles.stepDesc, { color: colors.mutedText }]}>
                  Check in for your flight, drop your luggage, and clear passport control into the international departures transit lounge.
                </Text>
              </View>
            </View>

            {/* Step 3 */}
            <View style={[styles.stepCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={[styles.stepNumberBadge, { backgroundColor: '#15803d' }]}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepBody}>
                <Text style={[styles.stepTitle, { color: colors.heading }]}>
                  Airside: VAT Refund Office Payout
                </Text>
                <Text style={[styles.stepDesc, { color: colors.mutedText }]}>
                  Visit the VAT Refund counter near your departure gates. Hand in your stamped forms to collect cash (USD/EUR/Local) or instant credit card refund.
                </Text>
              </View>
            </View>

            {/* Terminal Refund Counters */}
            <Text style={[styles.sectionHeading, { color: colors.heading, marginTop: 18 }]}>
              AIRPORT TERMINAL LOCATIONS
            </Text>

            {rules?.airportCounters && rules.airportCounters.length > 0 ? (
              rules.airportCounters.map((counter, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.counterCard,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.counterHeader}>
                    <View style={styles.counterTitleRow}>
                      <Ionicons name="airplane-outline" size={16} color={colors.primary} />
                      <Text style={[styles.counterTerminal, { color: colors.heading }]}>
                        {counter.terminalName}
                      </Text>
                    </View>
                    <View style={styles.locationTypePill}>
                      <Text style={styles.locationTypeText}>{counter.locationType}</Text>
                    </View>
                  </View>

                  <Text style={[styles.counterInstruction, { color: colors.mutedText }]}>
                    {counter.stepInstruction}
                  </Text>

                  <View style={styles.counterFooter}>
                    <View style={styles.footerItem}>
                      <Ionicons name="time-outline" size={13} color={colors.mutedText} />
                      <Text style={[styles.footerText, { color: colors.mutedText }]}>
                        {counter.operatingHours}
                      </Text>
                    </View>

                    {counter.payoutMethods.length > 0 && (
                      <View style={styles.payoutBadgeRow}>
                        {counter.payoutMethods.map((p, pIdx) => (
                          <View key={pIdx} style={styles.payoutChip}>
                            <Text style={styles.payoutChipText}>{p}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <Text style={{ color: colors.mutedText, fontSize: 13 }}>
                Airport refund kiosk details will load with active destination.
              </Text>
            )}

            <TouchableOpacity testID="btn-dismiss"
              style={[styles.dismissBtn, { backgroundColor: colors.primary }]}
              onPress={onClose}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Got it, close airport guide"
            >
              <Text style={styles.dismissBtnText}>I Understand the Refund Steps</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
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
  crucialWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  crucialTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400e',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  crucialText: {
    fontSize: 12,
    color: '#78350f',
    lineHeight: 17,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    gap: 12,
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  stepBody: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  counterCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  counterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  counterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  counterTerminal: {
    fontSize: 13,
    fontWeight: '700',
  },
  locationTypePill: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  locationTypeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  counterInstruction: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  counterFooter: {
    flexDirection: 'column',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 11,
  },
  payoutBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  payoutChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  payoutChipText: {
    fontSize: 10,
    color: '#334155',
    fontWeight: '600',
  },
  dismissBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  dismissBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

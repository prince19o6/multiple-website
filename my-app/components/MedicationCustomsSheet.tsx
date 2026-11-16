import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { MedicationCustomsRule } from '../types';

interface MedicationCustomsSheetProps {
  rules: MedicationCustomsRule[];
  visible: boolean;
  onClose: () => void;
}

export const MedicationCustomsSheet: React.FC<MedicationCustomsSheetProps> = ({
  rules,
  visible,
  onClose,
}) => {
  const colors = useColors();

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
                Medication & Customs Prohibitions
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedText }]}>
                Border Security & Controlled Pharmaceuticals Guide
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
            {/* Warning Alert */}
            <View style={[styles.alertBanner, { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }]}>
              <Ionicons name="alert-circle" size={18} color="#dc2626" />
              <Text style={[styles.alertText, { color: '#991b1b' }]}>
                Carrying unapproved prescription medication across international borders can result in customs detention or confiscation. Always verify requirements prior to boarding.
              </Text>
            </View>

            {/* List of Medication Rules */}
            {rules.map((rule) => {
              let statusBg = '#eff6ff';
              let statusText = '#1d4ed8';

              if (rule.status === 'Strictly_Prohibited') {
                statusBg = '#fee2e2';
                statusText = '#dc2626';
              } else if (rule.status === 'Requires_FDA_Permit') {
                statusBg = '#fffbeb';
                statusText = '#d97706';
              }

              return (
                <View
                  key={rule.id}
                  style={[
                    styles.ruleCard,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.ruleCardHeader}>
                    <Text style={[styles.medName, { color: colors.heading }]}>
                      {rule.medicationCategory}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                      <Text style={[styles.statusText, { color: statusText }]}>
                        {rule.status.replace(/_/g, ' ')}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.guidanceText, { color: colors.mutedText }]}>
                    {rule.officialGuidance}
                  </Text>
                </View>
              );
            })}

            {/* General Advice */}
            <View style={[styles.adviceBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.adviceTitle, { color: colors.heading }]}>
                Golden Travel Rules for Prescriptions:
              </Text>
              <Text style={[styles.adviceBullet, { color: colors.mutedText }]}>
                &bull; Always keep medication in original pharmacy boxes with doctor's label.
              </Text>
              <Text style={[styles.adviceBullet, { color: colors.mutedText }]}>
                &bull; Carry a signed English medical letter stating diagnosis, daily dosage, and generic names.
              </Text>
              <Text style={[styles.adviceBullet, { color: colors.mutedText }]}>
                &bull; Never pack vital prescription medicines into checked luggage; keep them in carry-on.
              </Text>
            </View>
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
  alertBanner: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    marginBottom: 14,
  },
  alertText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  ruleCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  ruleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  medName: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  guidanceText: {
    fontSize: 12,
    lineHeight: 16,
  },
  adviceBox: {
    marginTop: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  adviceTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  adviceBullet: {
    fontSize: 12,
    lineHeight: 16,
  },
});

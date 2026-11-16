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
import { TravelMedicine } from '../types';

interface ShowPharmacistModalProps {
  visible: boolean;
  medicine: TravelMedicine | null;
  onClose: () => void;
}

export const ShowPharmacistModal: React.FC<ShowPharmacistModalProps> = ({
  visible,
  medicine,
  onClose,
}) => {
  const colors = useColors();

  if (!medicine) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          {/* Top Bar */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Ionicons name="medical" size={18} color="#dc2626" />
                <Text style={[styles.title, { color: colors.heading }]}>
                  Show to Pharmacist
                </Text>
              </View>
              <Text style={[styles.subtitle, { color: colors.mutedText }]}>
                Hold phone towards the pharmacist for immediate dispensing
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
            {/* High-Contrast Flashcard Banner */}
            <View style={styles.flashcard}>
              <Text style={styles.flashcardHeader}>ขอซื้อยานี้ครับ / ค่ะ (I need this medicine please):</Text>
              
              <Text style={styles.nativeBigText}>
                {medicine.nativeText}
              </Text>

              <Text style={styles.phoneticText}>
                Pronunciation: "{medicine.phonetic}"
              </Text>
            </View>

            {/* Chemical & Active Compound */}
            <View style={[styles.detailBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.detailLabel, { color: colors.mutedText }]}>ACTIVE INGREDIENT & STRENGTH:</Text>
              <Text style={[styles.detailValue, { color: colors.heading }]}>
                {medicine.genericName}
              </Text>

              <View style={styles.divider} />

              <Text style={[styles.detailLabel, { color: colors.mutedText }]}>EQUIVALENT HOME BRANDS:</Text>
              <Text style={[styles.detailValue, { color: colors.heading }]}>
                {medicine.commonHomeNames.join(', ')}
              </Text>

              <View style={styles.divider} />

              <Text style={[styles.detailLabel, { color: colors.mutedText }]}>RECOMMENDED LOCAL BRANDS:</Text>
              <Text style={[styles.detailValue, { color: '#059669' }]}>
                {medicine.localBrandNames.join(' / ')}
              </Text>
            </View>

            {/* Typical Dosage Box */}
            <View style={[styles.dosageBox, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
              <View style={styles.dosageHeader}>
                <Ionicons name="time-outline" size={16} color="#1d4ed8" />
                <Text style={styles.dosageTitle}>Standard Travel Dosage</Text>
              </View>
              <Text style={styles.dosageText}>{medicine.typicalDosage}</Text>
            </View>

            {/* Precautions */}
            {medicine.precautions ? (
              <View style={[styles.precautionBox, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
                <View style={styles.precautionHeader}>
                  <Ionicons name="alert-circle-outline" size={16} color="#dc2626" />
                  <Text style={styles.precautionTitle}>Safety Precaution</Text>
                </View>
                <Text style={styles.precautionText}>{medicine.precautions}</Text>
              </View>
            ) : null}

            {/* Done Button */}
            <TouchableOpacity testID="btn-close-flashcard" accessibilityLabel="Close Flashcard"
              style={[styles.doneBtn, { backgroundColor: colors.primary }]}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.doneBtnText}>Close Flashcard</Text>
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
    maxHeight: '90%',
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
  titleRow: {
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
  flashcard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    alignItems: 'center',
  },
  flashcardHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  nativeBigText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#38bdf8',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 6,
  },
  phoneticText: {
    fontSize: 13,
    color: '#cbd5e1',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  detailBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 8,
  },
  dosageBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  dosageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  dosageTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  dosageText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#1e3a8a',
  },
  precautionBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  precautionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  precautionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#dc2626',
  },
  precautionText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#991b1b',
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

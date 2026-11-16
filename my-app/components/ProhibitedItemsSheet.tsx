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
import { useBaggage } from '../context/BaggageContext';

interface ProhibitedItemsSheetProps {
  visible: boolean;
  onClose: () => void;
}

export const ProhibitedItemsSheet: React.FC<ProhibitedItemsSheetProps> = ({
  visible,
  onClose,
}) => {
  const colors = useColors();
  const { baggageData } = useBaggage();

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
                Aviation Dangerous Goods & Packing Rules
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedText }]}>
                ICAO / TSA Carry-On & Checked Regulations
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
            {/* Section 1: Cabin Prohibited */}
            <View style={[styles.sectionCard, { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="ban" size={20} color="#dc2626" />
                <Text style={[styles.sectionTitle, { color: '#991b1b' }]}>
                  PROHIBITED IN CABIN CARRY-ON
                </Text>
              </View>
              <Text style={[styles.sectionNote, { color: '#7f1d1d' }]}>
                Items that will be immediately confiscated at airport security:
              </Text>

              {baggageData?.prohibitedCabinItems?.map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Ionicons name="close-circle" size={14} color="#dc2626" style={{ marginTop: 2 }} />
                  <Text style={[styles.itemText, { color: '#450a0a' }]}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Section 2: Checked Baggage Prohibited */}
            <View style={[styles.sectionCard, { backgroundColor: '#fff7ed', borderColor: '#fdba74' }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="flame" size={20} color="#ea580c" />
                <Text style={[styles.sectionTitle, { color: '#9a3412' }]}>
                  PROHIBITED IN CHECKED SUITCASE
                </Text>
              </View>
              <Text style={[styles.sectionNote, { color: '#7c2d12' }]}>
                Strict fire hazard items: Bags will be held back by tarmac X-ray if detected:
              </Text>

              {baggageData?.prohibitedCheckedItems?.map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Ionicons name="warning" size={14} color="#ea580c" style={{ marginTop: 2 }} />
                  <Text style={[styles.itemText, { color: '#431407' }]}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Section 3: Smart Packing Hacks */}
            <View style={[styles.sectionCard, { backgroundColor: '#ecfdf5', borderColor: '#86efac' }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="sparkles" size={20} color="#059669" />
                <Text style={[styles.sectionTitle, { color: '#065f46' }]}>
                  PRO PACKING & WEIGHT SAVING HACKS
                </Text>
              </View>

              {baggageData?.packingTips?.map((tip, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Ionicons name="checkmark-circle" size={14} color="#059669" style={{ marginTop: 2 }} />
                  <Text style={[styles.itemText, { color: '#064e3b' }]}>{tip}</Text>
                </View>
              ))}
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
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionNote: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  itemText: {
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
    fontWeight: '500',
  },
});

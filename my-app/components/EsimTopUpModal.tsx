import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { useEsim } from '../context/EsimContext';

const TOP_UP_OPTIONS = [
  { gb: 1, label: '+1 GB 5G', price: '$3.99', validity: '3 Days' },
  { gb: 3, label: '+3 GB 5G', price: '$7.99', validity: '7 Days', isPopular: true },
  { gb: 10, label: '+10 GB 5G', price: '$14.99', validity: '14 Days' },
];

interface EsimTopUpModalProps {
  visible: boolean;
  onClose: () => void;
}

export const EsimTopUpModal: React.FC<EsimTopUpModalProps> = ({ visible, onClose }) => {
  const colors = useColors();
  const { activeProfile, topUp } = useEsim();

  const [selectedGb, setSelectedGb] = useState<number>(3);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const currentTotal = activeProfile?.totalDataGb || 0;
  const newTotal = currentTotal + selectedGb;

  const handleConfirmTopUp = async () => {
    setIsSubmitting(true);
    const success = await topUp(selectedGb);
    setIsSubmitting(false);

    if (success) {
      Alert.alert(
        'Data Booster Active!',
        `Successfully added ${selectedGb} GB high-speed 5G data to your eSIM profile.`
      );
      onClose();
    } else {
      Alert.alert('Top-Up Failed', 'Could not apply data booster. Please check network connection.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.heading }]}>
                Add 5G Data Booster
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedText }]}>
                Instant high-speed top-up for active eSIM
              </Text>
            </View>
            <TouchableOpacity testID="btn-close"
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close data booster modal"
            >
              <Ionicons name="close" size={24} color={colors.heading} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Balance Preview Card */}
            <View style={[styles.previewCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.previewCol}>
                <Text style={[styles.previewLabel, { color: colors.mutedText }]}>CURRENT TOTAL</Text>
                <Text style={[styles.previewVal, { color: colors.heading }]}>{currentTotal.toFixed(1)} GB</Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color={colors.primary} />
              <View style={styles.previewCol}>
                <Text style={[styles.previewLabel, { color: '#15803d' }]}>NEW TOTAL DATA</Text>
                <Text style={[styles.previewVal, { color: '#15803d' }]}>{newTotal.toFixed(1)} GB</Text>
              </View>
            </View>

            {/* Booster Options */}
            <Text style={[styles.sectionHeading, { color: colors.heading }]}>
              SELECT BOOSTER PACK
            </Text>

            <View style={styles.optionsList}>
              {TOP_UP_OPTIONS.map((opt) => {
                const isSelected = selectedGb === opt.gb;
                return (
                  <TouchableOpacity testID="btn-esimtopupmodal-99" accessibilityLabel="esimtopupmodal action"
                    key={opt.gb}
                    style={[
                      styles.optionCard,
                      {
                        backgroundColor: isSelected ? `${colors.primary}10` : colors.background,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    onPress={() => setSelectedGb(opt.gb)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.optionLeft}>
                      <View style={styles.radioCircle}>
                        {isSelected && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                      </View>
                      <View>
                        <View style={styles.optionTitleRow}>
                          <Text style={[styles.optionLabel, { color: colors.heading }]}>{opt.label}</Text>
                          {opt.isPopular && (
                            <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
                              <Text style={styles.popularBadgeText}>POPULAR</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.optionValidity, { color: colors.mutedText }]}>
                          Valid for {opt.validity}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.optionPrice, { color: colors.primary }]}>{opt.price}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Confirm Button */}
            <TouchableOpacity testID="btn-flash" accessibilityLabel="flash"
              style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
              onPress={handleConfirmTopUp}
              disabled={isSubmitting}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="flash" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.confirmBtnText}>Confirm & Add {selectedGb} GB Data</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
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
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 14,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  previewCol: {
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  previewVal: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  optionsList: {
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    padding: 14,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  popularBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  popularBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
  },
  optionValidity: {
    fontSize: 11,
    marginTop: 1,
  },
  optionPrice: {
    fontSize: 16,
    fontWeight: '800',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 14,
    marginTop: 8,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});

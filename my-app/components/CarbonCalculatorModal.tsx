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
import { useEco } from '../context/EcoContext';

interface CarbonCalculatorModalProps {
  visible: boolean;
  onClose: () => void;
}

const CABIN_CLASSES: Array<'Economy' | 'PremiumEconomy' | 'Business'> = [
  'Economy',
  'PremiumEconomy',
  'Business',
];

export const CarbonCalculatorModal: React.FC<CarbonCalculatorModalProps> = ({
  visible,
  onClose,
}) => {
  const colors = useColors();
  const { calculate } = useEco();

  const [origin, setOrigin] = useState<string>('BOM');
  const [destination, setDestination] = useState<string>('BKK');
  const [cabinClass, setCabinClass] = useState<'Economy' | 'PremiumEconomy' | 'Business'>('Economy');
  const [nights, setNights] = useState<number>(5);
  const [pax, setPax] = useState<number>(2);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  const handleCalculate = async () => {
    setIsCalculating(true);
    await calculate(origin.trim(), destination.trim(), cabinClass, nights, pax);
    setIsCalculating(false);
    onClose();
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
                Flight & Stay Carbon Calculator
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedText }]}>
                ICAO Aviation & Hotel Scope 3 Emissions
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
            {/* Route Inputs */}
            <View style={styles.routeRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.heading }]}>ORIGIN AIRPORT</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      color: colors.heading,
                      borderColor: colors.border,
                    },
                  ]}
                  value={origin}
                  onChangeText={setOrigin}
                  placeholder="e.g. BOM, DEL, LHR"
                  placeholderTextColor={colors.mutedText}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.routeArrowBox}>
                <Ionicons name="airplane" size={20} color={colors.primary} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.heading }]}>DESTINATION</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      color: colors.heading,
                      borderColor: colors.border,
                    },
                  ]}
                  value={destination}
                  onChangeText={setDestination}
                  placeholder="e.g. BKK, HKT, DPS"
                  placeholderTextColor={colors.mutedText}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* Cabin Class */}
            <Text style={[styles.fieldLabel, { color: colors.heading, marginTop: 12 }]}>
              FLIGHT CABIN CLASS
            </Text>
            <View style={styles.cabinClassRow}>
              {CABIN_CLASSES.map((cls) => {
                const isSelected = cabinClass === cls;
                return (
                  <TouchableOpacity testID="btn-carboncalculatormodal-140" accessibilityLabel="carboncalculatormodal action"
                    key={cls}
                    style={[
                      styles.cabinChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.background,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setCabinClass(cls);
                    }}
                  >
                    <Text
                      style={[
                        styles.cabinChipText,
                        { color: isSelected ? '#ffffff' : colors.heading },
                      ]}
                    >
                      {cls === 'PremiumEconomy' ? 'Premium Econ' : cls}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Counters Row: Nights & Passengers */}
            <View style={styles.countersRow}>
              <View style={[styles.counterBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.counterLabel, { color: colors.mutedText }]}>HOTEL NIGHTS</Text>
                <View style={styles.counterControl}>
                  <TouchableOpacity testID="btn-remove" accessibilityLabel="remove"
                    style={[styles.countBtn, { borderColor: colors.border }]}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setNights(Math.max(1, nights - 1));
                    }}
                  >
                    <Ionicons name="remove" size={16} color={colors.heading} />
                  </TouchableOpacity>
                  <Text style={[styles.countVal, { color: colors.heading }]}>{nights}</Text>
                  <TouchableOpacity testID="btn-add" accessibilityLabel="add"
                    style={[styles.countBtn, { borderColor: colors.border }]}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setNights(nights + 1);
                    }}
                  >
                    <Ionicons name="add" size={16} color={colors.heading} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.counterBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.counterLabel, { color: colors.mutedText }]}>PASSENGERS</Text>
                <View style={styles.counterControl}>
                  <TouchableOpacity testID="btn-remove" accessibilityLabel="remove"
                    style={[styles.countBtn, { borderColor: colors.border }]}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setPax(Math.max(1, pax - 1));
                    }}
                  >
                    <Ionicons name="remove" size={16} color={colors.heading} />
                  </TouchableOpacity>
                  <Text style={[styles.countVal, { color: colors.heading }]}>{pax}</Text>
                  <TouchableOpacity testID="btn-add" accessibilityLabel="add"
                    style={[styles.countBtn, { borderColor: colors.border }]}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setPax(pax + 1);
                    }}
                  >
                    <Ionicons name="add" size={16} color={colors.heading} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity testID="btn-calculator-outline" accessibilityLabel="calculator outline"
              style={[
                styles.calculateBtn,
                { backgroundColor: colors.primary, opacity: isCalculating ? 0.7 : 1 },
              ]}
              onPress={handleCalculate}
              disabled={isCalculating}
            >
              {isCalculating ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="calculator-outline" size={18} color="#ffffff" />
                  <Text style={styles.calculateBtnText}>Compute Trip Carbon Output</Text>
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
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeArrowBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  input: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '700',
  },
  cabinClassRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  cabinChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  cabinChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  countersRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  counterBox: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  counterLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
    textAlign: 'center',
  },
  counterControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  countBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countVal: {
    fontSize: 18,
    fontWeight: '800',
  },
  calculateBtn: {
    minHeight: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  calculateBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

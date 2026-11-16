import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { usePower } from '../context/PowerContext';

interface ApplianceSafetyModalProps {
  visible: boolean;
  onClose: () => void;
}

const APPLIANCES = [
  'Smartphones, Tablets & Power Banks',
  'Laptops & MacBooks',
  'Hair Dryers & Straighteners',
  'Electric Shavers & Trimmers',
  'CPAP & Medical Breathing Machines',
];

const VOLTAGES = [
  { key: '100-240V', label: '100V - 240V (Dual Voltage)' },
  { key: '110-120V', label: '110V - 120V (Single Voltage US/CA)' },
  { key: '220-240V', label: '220V - 240V (India / UK / EU)' },
];

const HOME_PLUGS = [
  { key: 'Type_D_India', label: 'India (Type D/C 2 & 3-Pin)' },
  { key: 'Type_G_UK_UAE', label: 'UK & UAE (Type G 3-Pin)' },
  { key: 'Type_A_US', label: 'USA & Canada (Type A/B 2-Pin)' },
];

export const ApplianceSafetyModal: React.FC<ApplianceSafetyModalProps> = ({
  visible,
  onClose,
}) => {
  const colors = useColors();
  const { checkAppliance, lastSafetyResult } = usePower();

  const [category, setCategory] = useState<string>(APPLIANCES[0]);
  const [ratedVoltage, setRatedVoltage] = useState<string>('100-240V');
  const [homePlug, setHomePlug] = useState<string>('Type_D_India');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const handleVerify = async () => {
    setIsVerifying(true);
    await checkAppliance(category, ratedVoltage, homePlug);
    setIsVerifying(false);
  };

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
                Appliance Voltage Safety Checker
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedText }]}>
                Prevent Burned Hair Dryers & Blown Hotel Fuses
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
            {/* Step 1: Appliance Type */}
            <Text style={[styles.stepLabel, { color: colors.heading }]}>
              1. SELECT APPLIANCE TYPE:
            </Text>
            <View style={styles.chipsWrap}>
              {APPLIANCES.map((app) => {
                const isSelected = category === app;
                return (
                  <TouchableOpacity testID="btn-appliancesafetymodal-100" accessibilityLabel="appliancesafetymodal action"
                    key={app}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.background,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setCategory(app);
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: isSelected ? '#ffffff' : colors.heading },
                      ]}
                      numberOfLines={1}
                    >
                      {app}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Step 2: Rated Voltage */}
            <Text style={[styles.stepLabel, { color: colors.heading, marginTop: 12 }]}>
              2. VOLTAGE ON APPLIANCE LABEL:
            </Text>
            <View style={styles.chipsWrap}>
              {VOLTAGES.map((volt) => {
                const isSelected = ratedVoltage === volt.key;
                return (
                  <TouchableOpacity testID="btn-appliancesafetymodal-136" accessibilityLabel="appliancesafetymodal action"
                    key={volt.key}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.background,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setRatedVoltage(volt.key);
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: isSelected ? '#ffffff' : colors.heading },
                      ]}
                    >
                      {volt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Step 3: Home Plug Style */}
            <Text style={[styles.stepLabel, { color: colors.heading, marginTop: 12 }]}>
              3. YOUR HOME COUNTRY PLUG TYPE:
            </Text>
            <View style={styles.chipsWrap}>
              {HOME_PLUGS.map((hp) => {
                const isSelected = homePlug === hp.key;
                return (
                  <TouchableOpacity testID="btn-appliancesafetymodal-171" accessibilityLabel="appliancesafetymodal action"
                    key={hp.key}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.background,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      setHomePlug(hp.key);
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: isSelected ? '#ffffff' : colors.heading },
                      ]}
                    >
                      {hp.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Verify Button */}
            <TouchableOpacity testID="btn-flash-outline" accessibilityLabel="flash outline"
              style={[
                styles.verifyBtn,
                { backgroundColor: colors.primary, opacity: isVerifying ? 0.7 : 1 },
              ]}
              onPress={handleVerify}
              disabled={isVerifying}
              activeOpacity={0.85}
            >
              {isVerifying ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="flash-outline" size={18} color="#ffffff" />
                  <Text style={styles.verifyBtnText}>Check Voltage Compatibility</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Result Card */}
            {lastSafetyResult && (
              <View
                style={[
                  styles.verdictCard,
                  {
                    backgroundColor:
                      lastSafetyResult.verdictStatus === 'Safe_Direct'
                        ? '#ecfdf5'
                        : lastSafetyResult.verdictStatus === 'Safe_With_Adapter'
                        ? '#fffbeb'
                        : '#fef2f2',
                    borderColor:
                      lastSafetyResult.verdictStatus === 'Safe_Direct'
                        ? '#86efac'
                        : lastSafetyResult.verdictStatus === 'Safe_With_Adapter'
                        ? '#fde68a'
                        : '#fca5a5',
                  },
                ]}
              >
                <View style={styles.verdictHeader}>
                  <Ionicons
                    name={
                      lastSafetyResult.verdictStatus === 'Safe_Direct'
                        ? 'checkmark-circle'
                        : lastSafetyResult.verdictStatus === 'Safe_With_Adapter'
                        ? 'alert-circle'
                        : 'flame'
                    }
                    size={26}
                    color={
                      lastSafetyResult.verdictStatus === 'Safe_Direct'
                        ? '#16a34a'
                        : lastSafetyResult.verdictStatus === 'Safe_With_Adapter'
                        ? '#d97706'
                        : '#dc2626'
                    }
                  />
                  <Text
                    style={[
                      styles.verdictTitle,
                      {
                        color:
                          lastSafetyResult.verdictStatus === 'Safe_Direct'
                            ? '#15803d'
                            : lastSafetyResult.verdictStatus === 'Safe_With_Adapter'
                            ? '#b45309'
                            : '#991b1b',
                      },
                    ]}
                  >
                    {lastSafetyResult.headline}
                  </Text>
                </View>

                <Text style={styles.verdictDetails}>{lastSafetyResult.detailedAdvice}</Text>

                {/* Badges Strip */}
                <View style={styles.badgesRow}>
                  <View
                    style={[
                      styles.miniBadge,
                      {
                        backgroundColor: lastSafetyResult.plugAdapterNeeded ? '#fff7ed' : '#f0fdf4',
                        borderColor: lastSafetyResult.plugAdapterNeeded ? '#fdba74' : '#bbf7d0',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.miniBadgeText,
                        { color: lastSafetyResult.plugAdapterNeeded ? '#c2410c' : '#15803d' },
                      ]}
                    >
                      {lastSafetyResult.plugAdapterNeeded ? 'Plug Adapter: REQUIRED' : 'Plug Adapter: NOT NEEDED'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.miniBadge,
                      {
                        backgroundColor: lastSafetyResult.voltageTransformerNeeded ? '#fef2f2' : '#f0fdf4',
                        borderColor: lastSafetyResult.voltageTransformerNeeded ? '#fca5a5' : '#bbf7d0',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.miniBadgeText,
                        { color: lastSafetyResult.voltageTransformerNeeded ? '#dc2626' : '#15803d' },
                      ]}
                    >
                      {lastSafetyResult.voltageTransformerNeeded ? 'Transformer: MANDATORY' : 'Transformer: NOT NEEDED'}
                    </Text>
                  </View>
                </View>
              </View>
            )}
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
  stepLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  verifyBtn: {
    minHeight: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    marginBottom: 16,
  },
  verifyBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  verdictCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  verdictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  verdictTitle: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  verdictDetails: {
    fontSize: 12,
    lineHeight: 17,
    color: '#334155',
    marginBottom: 10,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  miniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  miniBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
});

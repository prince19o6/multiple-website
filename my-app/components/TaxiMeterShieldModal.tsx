import React from 'react';
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
import { useTransit } from '../context/TransitContext';

interface TaxiMeterShieldModalProps {
  visible: boolean;
  onClose: () => void;
}

const TRAFFIC_OPTIONS = [
  { key: 'Light', label: 'Light' },
  { key: 'Moderate', label: 'Moderate' },
  { key: 'Heavy_Gridlock', label: 'Heavy Traffic' },
];

export const TaxiMeterShieldModal: React.FC<TaxiMeterShieldModalProps> = ({
  visible,
  onClose,
}) => {
  const colors = useColors();
  const {
    transitData,
    taxiDistance,
    setTaxiDistance,
    trafficCondition,
    setTrafficCondition,
    useExpressway,
    setUseExpressway,
    taxiEstimate,
    isEstimatingTaxi,
    recalculateTaxi,
  } = useTransit();

  const handleAdjustDistance = (delta: number) => {
    Haptics.selectionAsync().catch(() => {});
    const next = Math.max(1, Math.min(60, Math.round((taxiDistance + delta) * 10) / 10));
    setTaxiDistance(next);
  };

  const handleEstimate = async () => {
    await recalculateTaxi(taxiDistance, trafficCondition, useExpressway);
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
              <View style={styles.titleRow}>
                <Ionicons name="shield-checkmark" size={18} color="#16a34a" />
                <Text style={[styles.title, { color: colors.heading }]}>
                  Taxi Meter Scam Shield
                </Text>
              </View>
              <Text style={[styles.subtitle, { color: colors.mutedText }]}>
                {transitData?.city || 'Destination'} Fair Meter Rates & Driver Cards
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
            {/* Distance Stepper */}
            <View style={[styles.stepperCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.stepperHeader}>
                <Ionicons name="speedometer-outline" size={16} color={colors.primary} />
                <Text style={[styles.stepperTitle, { color: colors.heading }]}>
                  Trip Distance (Kilometers)
                </Text>
              </View>

              <View style={styles.stepperControls}>
                <TouchableOpacity testID="btn-remove" accessibilityLabel="remove"
                  style={[styles.stepperBtn, { backgroundColor: colors.surface }]}
                  onPress={() => handleAdjustDistance(-2)}
                >
                  <Ionicons name="remove" size={18} color={colors.heading} />
                </TouchableOpacity>

                <View style={styles.stepperValWrap}>
                  <Text style={[styles.stepperVal, { color: colors.heading }]}>
                    {taxiDistance}
                  </Text>
                  <Text style={[styles.stepperUnit, { color: colors.mutedText }]}>km</Text>
                </View>

                <TouchableOpacity testID="btn-add" accessibilityLabel="add"
                  style={[styles.stepperBtn, { backgroundColor: colors.surface }]}
                  onPress={() => handleAdjustDistance(2)}
                >
                  <Ionicons name="add" size={18} color={colors.heading} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Traffic & Expressway Controls */}
            <View style={styles.optionsRow}>
              {/* Traffic */}
              <View style={{ flex: 1.5 }}>
                <Text style={[styles.controlLabel, { color: colors.mutedText }]}>TRAFFIC:</Text>
                <View style={styles.trafficPills}>
                  {TRAFFIC_OPTIONS.map((opt) => {
                    const isSelected = trafficCondition === opt.key;
                    return (
                      <TouchableOpacity testID="btn-taximetershieldmodal-133" accessibilityLabel="taximetershieldmodal action"
                        key={opt.key}
                        style={[
                          styles.trafficChip,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.background,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => {
                          Haptics.selectionAsync().catch(() => {});
                          setTrafficCondition(opt.key as any);
                        }}
                      >
                        <Text
                          style={[
                            styles.trafficChipText,
                            { color: isSelected ? '#ffffff' : colors.heading },
                          ]}
                          numberOfLines={1}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Expressway Toll Toggle */}
              <View style={{ flex: 1 }}>
                <Text style={[styles.controlLabel, { color: colors.mutedText }]}>HIGHWAY TOLL:</Text>
                <TouchableOpacity testID="btn-taximetershieldmodal-165" accessibilityLabel="taximetershieldmodal action"
                  style={[
                    styles.tollToggle,
                    {
                      backgroundColor: useExpressway ? '#ecfdf5' : colors.background,
                      borderColor: useExpressway ? '#10b981' : colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setUseExpressway(!useExpressway);
                  }}
                >
                  <Ionicons
                    name={useExpressway ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={useExpressway ? '#10b981' : colors.mutedText}
                  />
                  <Text style={[styles.tollToggleText, { color: useExpressway ? '#047857' : colors.heading }]}>
                    {useExpressway ? 'Expressway' : 'No Toll'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Estimate Button */}
            <TouchableOpacity testID="btn-calculator-outline" accessibilityLabel="calculator outline"
              style={[
                styles.estimateBtn,
                { backgroundColor: colors.primary, opacity: isEstimatingTaxi ? 0.7 : 1 },
              ]}
              onPress={handleEstimate}
              disabled={isEstimatingTaxi}
              activeOpacity={0.85}
            >
              {isEstimatingTaxi ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="calculator-outline" size={18} color="#ffffff" />
                  <Text style={styles.estimateBtnText}>Calculate Fair Meter & Tolls</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Taxi Estimate Result Box */}
            {taxiEstimate && (
              <View style={[styles.resultCard, { backgroundColor: '#f0fdf4', borderColor: '#86efac' }]}>
                <View style={styles.resultHeader}>
                  <Ionicons name="checkmark-done-circle" size={20} color="#16a34a" />
                  <Text style={styles.resultTitle}>Official Meter Fair-Price Range</Text>
                </View>

                <View style={styles.pricingSplit}>
                  <View style={styles.priceCol}>
                    <Text style={styles.priceSubLabel}>REGULAR METER</Text>
                    <Text style={styles.priceBig}>{taxiEstimate.fairMeterRange}</Text>
                  </View>
                  <View style={styles.vDivider} />
                  <View style={styles.priceCol}>
                    <Text style={styles.priceSubLabel}>TOTAL WITH TOLLS</Text>
                    <Text style={[styles.priceBig, { color: '#047857' }]}>
                      {taxiEstimate.totalEstimatedCost}
                    </Text>
                  </View>
                </View>

                {/* Ride-hail Comparison */}
                <View style={styles.compareRow}>
                  <Text style={styles.compareLabel}>App Benchmark (Grab/Bolt):</Text>
                  <Text style={styles.compareVal}>{taxiEstimate.grabBoltEstimate}</Text>
                </View>

                {/* Scam Alert Warning */}
                <View style={styles.scamWarningBox}>
                  <Ionicons name="alert-circle" size={16} color="#dc2626" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.scamWarningTitle}>Tourist Flat-Rate Scam Threshold:</Text>
                    <Text style={styles.scamWarningText}>{taxiEstimate.scamAlertThreshold}</Text>
                  </View>
                </View>

                <Text style={styles.adviceText}>{taxiEstimate.driverAdvice}</Text>
              </View>
            )}

            {/* Show Driver Phrasecards */}
            <View style={styles.phraseSection}>
              <View style={styles.phraseHeader}>
                <Ionicons name="chatbubbles-outline" size={16} color={colors.primary} />
                <Text style={[styles.phraseTitle, { color: colors.heading }]}>
                  SHOW TO TAXI DRIVER (PHONETIC & LOCAL SCRIPT)
                </Text>
              </View>

              {transitData?.taxiGuide?.driverPhrases?.map((p, idx) => (
                <View
                  key={idx}
                  style={[styles.phraseCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                >
                  <Text style={[styles.phraseEng, { color: colors.mutedText }]}>{p.english}</Text>
                  <Text style={[styles.phraseNative, { color: colors.heading }]}>{p.nativeText}</Text>
                  <Text style={[styles.phrasePhonetic, { color: colors.primary }]}>{p.phonetic}</Text>
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
    maxHeight: '92%',
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
  stepperCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  stepperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  stepperTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  stepperBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  stepperValWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    minWidth: 80,
    justifyContent: 'center',
  },
  stepperVal: {
    fontSize: 28,
    fontWeight: '900',
  },
  stepperUnit: {
    fontSize: 14,
    fontWeight: '700',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  controlLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  trafficPills: {
    flexDirection: 'row',
    gap: 4,
  },
  trafficChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trafficChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  tollToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  tollToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  estimateBtn: {
    minHeight: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  estimateBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  resultCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  resultTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803d',
  },
  pricingSplit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  priceCol: {
    flex: 1,
  },
  vDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#bbf7d0',
    marginHorizontal: 10,
  },
  priceSubLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#166534',
    letterSpacing: 0.4,
  },
  priceBig: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803d',
    marginTop: 2,
  },
  compareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#dcfce7',
    marginBottom: 8,
  },
  compareLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#14532d',
  },
  compareVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
  },
  scamWarningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 8,
    gap: 6,
    marginBottom: 8,
  },
  scamWarningTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#991b1b',
  },
  scamWarningText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
    marginTop: 1,
  },
  adviceText: {
    fontSize: 11,
    lineHeight: 15,
    color: '#166534',
  },
  phraseSection: {
    marginTop: 4,
  },
  phraseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  phraseTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  phraseCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
  },
  phraseEng: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  phraseNative: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  phrasePhonetic: {
    fontSize: 11,
    fontStyle: 'italic',
    fontWeight: '600',
  },
});

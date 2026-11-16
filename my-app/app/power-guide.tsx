import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { usePower } from '../context/PowerContext';
import { PowerSocketVisualizerCard } from '../components/PowerSocketVisualizerCard';
import { PowerBankKioskCard } from '../components/PowerBankKioskCard';
import { ApplianceSafetyModal } from '../components/ApplianceSafetyModal';
import { ScreenTorchModal } from '../components/ScreenTorchModal';

export default function PowerGuideScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();

  const {
    voltageSpec,
    supportedPlugs,
    powerBankKiosks,
    powerData,
    isLoading,
    isRefreshing,
    isVoltageModalOpen,
    setIsVoltageModalOpen,
    isTorchModalOpen,
    setIsTorchModalOpen,
    refreshPowerHub,
  } = usePower();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 16),
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity testID="btn-navigate" accessibilityLabel="Navigate"
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.heading} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.heading }]}>
            Power Sockets & Voltage
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
            Plug Types, Converters & Battery Rentals
          </Text>
        </View>

        <TouchableOpacity testID="btn-flashlight" accessibilityLabel="flashlight"
          style={[styles.torchHeaderBtn, { backgroundColor: '#fffbeb' }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
            setIsTorchModalOpen(true);
          }}
        >
          <Ionicons name="flashlight" size={15} color="#b45309" />
          <Text style={styles.torchHeaderText}>Torch</Text>
        </TouchableOpacity>
      </View>

      {/* Main Body */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedText }]}>
            Loading electrical standards and power socket guide...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + 24, 40) },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refreshPowerHub}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* Voltage & Country Grid Overview Banner */}
          {voltageSpec && (
            <View style={[styles.voltageBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.voltageTop}>
                <View style={[styles.voltageIconBox, { backgroundColor: '#eff6ff' }]}>
                  <Ionicons name="flash" size={24} color="#1d4ed8" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.gridVoltageTitle, { color: colors.heading }]}>
                    {voltageSpec.standardVoltage} &bull; {voltageSpec.standardFrequency}
                  </Text>
                  <Text style={[styles.gridCountryText, { color: colors.mutedText }]}>
                    Destination: {voltageSpec.destinationCountry} Electrical Grid
                  </Text>
                </View>

                <TouchableOpacity testID="btn-shield-checkmark" accessibilityLabel="shield checkmark"
                  style={[styles.checkVoltageBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setIsVoltageModalOpen(true);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="shield-checkmark" size={14} color="#ffffff" />
                  <Text style={styles.checkVoltageText}>Will It Burn?</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.comparisonText, { color: colors.heading }]}>
                {voltageSpec.homeCountryComparison}
              </Text>
            </View>
          )}

          {/* Supported Plug Types Section */}
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="hardware-chip" size={18} color={colors.primary} />
              <Text style={[styles.sectionHeading, { color: colors.heading }]}>
                Destination Wall Outlets & Plug Sockets
              </Text>
            </View>
            <Text style={[styles.sectionSub, { color: colors.mutedText }]}>
              Verify pin compatibility before plugging in your phone, laptop, or camera chargers.
            </Text>

            {supportedPlugs.map((plug, idx) => (
              <PowerSocketVisualizerCard key={idx} plug={plug} />
            ))}
          </View>

          {/* In-Destination Power Bank Rental Networks */}
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="battery-charging" size={18} color="#059669" />
              <Text style={[styles.sectionHeading, { color: colors.heading }]}>
                Power Bank Rental Kiosks ({powerBankKiosks.length})
              </Text>
            </View>
            <Text style={[styles.sectionSub, { color: colors.mutedText }]}>
              Rent portable batteries with built-in USB-C & Lightning cables; return anywhere across the city.
            </Text>

            {powerBankKiosks.map((kiosk) => (
              <PowerBankKioskCard key={kiosk.id} kiosk={kiosk} />
            ))}
          </View>

          {/* Quick Airline & Packing Advice */}
          {powerData?.quickTips && powerData.quickTips.length > 0 && (
            <View style={[styles.adviceBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.adviceHeader}>
                <Ionicons name="airplane-outline" size={18} color="#d97706" />
                <Text style={[styles.adviceTitle, { color: colors.heading }]}>
                  Flight Security & Charging Advice
                </Text>
              </View>

              {powerData.quickTips.map((tip, idx) => (
                <View key={idx} style={styles.tipRow}>
                  <Ionicons name="checkmark-circle" size={14} color="#16a34a" style={{ marginTop: 2 }} />
                  <Text style={[styles.tipText, { color: colors.mutedText }]}>{tip}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Appliance Safety Modal */}
      <ApplianceSafetyModal
        visible={isVoltageModalOpen}
        onClose={() => setIsVoltageModalOpen(false)}
      />

      {/* Screen Torch Modal */}
      <ScreenTorchModal
        visible={isTorchModalOpen}
        onClose={() => setIsTorchModalOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  torchHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  torchHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b45309',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  voltageBanner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  voltageTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  voltageIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridVoltageTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  gridCountryText: {
    fontSize: 11,
    marginTop: 1,
  },
  checkVoltageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  checkVoltageText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  comparisonText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  sectionWrap: {
    marginBottom: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  adviceBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  adviceTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  tipText: {
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
});

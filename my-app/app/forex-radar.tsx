import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useForexRadar } from '@/context/ForexRadarContext';
import { ForexRateTableCard } from '@/components/ForexRateTableCard';
import { AtmDccShieldCard } from '@/components/AtmDccShieldCard';
import { ForexKioskCard } from '@/components/ForexKioskCard';
import { ForexCalculatorModal } from '@/components/ForexCalculatorModal';

type ActiveTab = 'rates' | 'atm' | 'kiosks';

export default function ForexRadarScreen() {
  const router = useRouter();
  const colors = useColors();
  const { radarData, loading, error, refreshRadar, openCalculator } = useForexRadar();

  const [activeTab, setActiveTab] = useState<ActiveTab>('rates');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>('All');

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshRadar();
    setRefreshing(false);
  };

  const handleTabChange = (tab: ActiveTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setActiveTab(tab);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.back();
  };

  // Filter kiosks by city
  const allKiosks = radarData?.verifiedKiosks || [];
  const cities = ['All', ...Array.from(new Set(allKiosks.map((k) => k.city)))];
  const filteredKiosks =
    selectedCity === 'All' ? allKiosks : allKiosks.filter((k) => k.city === selectedCity);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style="dark" />

      {/* Screen Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity testID="btn-navigate"
          onPress={handleBack}
          style={[styles.backBtn, { backgroundColor: colors.background }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={20} color={colors.heading} />
        </TouchableOpacity>

        <View style={styles.headerTitleCenter}>
          <Text style={[styles.headerTitle, { color: colors.heading }]}>
            Currency Exchange Radar
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedText }]}>
            {radarData?.destinationCountry || 'Destination'} &bull; {radarData?.destinationCurrencyCode || 'THB'} ({radarData?.destinationCurrencySymbol || '฿'})
          </Text>
        </View>

        <TouchableOpacity testID="btn-sync-outline"
          onPress={onRefresh}
          style={[styles.refreshBtn, { backgroundColor: colors.background }]}
          accessibilityRole="button"
          accessibilityLabel="Refresh rates"
        >
          <Ionicons name="sync-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs / Segments */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity testID="btn-trending-up-outline" accessibilityLabel="trending up outline"
          style={[
            styles.tabItem,
            activeTab === 'rates' && [styles.activeTabItem, { borderBottomColor: colors.primary }],
          ]}
          onPress={() => handleTabChange('rates')}
        >
          <Ionicons
            name="trending-up-outline"
            size={16}
            color={activeTab === 'rates' ? colors.primary : colors.mutedText}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'rates' ? colors.primary : colors.mutedText },
              activeTab === 'rates' && styles.activeTabText,
            ]}
          >
            Counter Rates
          </Text>
        </TouchableOpacity>

        <TouchableOpacity testID="btn-shield-checkmark-outline" accessibilityLabel="shield checkmark outline"
          style={[
            styles.tabItem,
            activeTab === 'atm' && [styles.activeTabItem, { borderBottomColor: colors.primary }],
          ]}
          onPress={() => handleTabChange('atm')}
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={16}
            color={activeTab === 'atm' ? colors.primary : colors.mutedText}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'atm' ? colors.primary : colors.mutedText },
              activeTab === 'atm' && styles.activeTabText,
            ]}
          >
            ATM DCC Shield
          </Text>
        </TouchableOpacity>

        <TouchableOpacity testID="btn-business-outline" accessibilityLabel="business outline"
          style={[
            styles.tabItem,
            activeTab === 'kiosks' && [styles.activeTabItem, { borderBottomColor: colors.primary }],
          ]}
          onPress={() => handleTabChange('kiosks')}
        >
          <Ionicons
            name="business-outline"
            size={16}
            color={activeTab === 'kiosks' ? colors.primary : colors.mutedText}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'kiosks' ? colors.primary : colors.mutedText },
              activeTab === 'kiosks' && styles.activeTabText,
            ]}
          >
            Verified Kiosks
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedText }]}>
            Loading live counter exchange rates...
          </Text>
        </View>
      ) : error && !radarData ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={44} color="#dc2626" />
          <Text style={[styles.errorText, { color: colors.heading }]}>{error}</Text>
          <TouchableOpacity testID="btn-retry-connection" accessibilityLabel="Retry Connection"
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={onRefresh}
          >
            <Text style={styles.retryBtnText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* TAB 1: COUNTER RATES */}
          {activeTab === 'rates' && radarData && (
            <View>
              {/* Quick tip badge */}
              <View style={styles.quickTipBanner}>
                <Ionicons name="bulb-outline" size={16} color="#047857" />
                <Text style={styles.quickTipText}>
                  Airport departure counters typically buy foreign cash at 6% to 9% lower rates. Exchange at City counters (SuperRich) or Basement Level B of the airport!
                </Text>
              </View>

              <ForexRateTableCard
                baseRates={radarData.baseRates}
                destinationCurrencySymbol={radarData.destinationCurrencySymbol}
                passportNotice={radarData.passportRuleNotice}
                onSelectCurrencyForCalc={(code) => openCalculator(code, 500)}
              />
            </View>
          )}

          {/* TAB 2: ATM DCC SHIELD */}
          {activeTab === 'atm' && radarData && (
            <View>
              <AtmDccShieldCard
                tips={radarData.atmDccShield}
                destinationCurrencyCode={radarData.destinationCurrencyCode}
              />
            </View>
          )}

          {/* TAB 3: VERIFIED KIOSKS */}
          {activeTab === 'kiosks' && radarData && (
            <View>
              {/* City filter chips */}
              {cities.length > 2 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.cityChipsRow}
                >
                  {cities.map((city) => {
                    const isSelected = city === selectedCity;
                    return (
                      <TouchableOpacity testID="btn-forex-radar-236" accessibilityLabel="forex-radar action"
                        key={city}
                        style={[
                          styles.cityChip,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.surface,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                          setSelectedCity(city);
                        }}
                      >
                        <Text
                          style={[
                            styles.cityChipText,
                            { color: isSelected ? '#ffffff' : colors.heading },
                          ]}
                        >
                          {city}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {/* Secret Airport Tip */}
              <View style={styles.airportSecretCard}>
                <View style={styles.secretHeaderRow}>
                  <Ionicons name="airplane" size={16} color="#b45309" />
                  <Text style={styles.secretTitle}>INSIDER AIRPORT SECRECY</Text>
                </View>
                <Text style={styles.secretText}>
                  Do NOT use the bank booths in the baggage claim or arrivals hall. Walk down to the Airport Rail Link basement (Level B). SuperRich Orange and HappyRich offer exact city-centre exchange rates!
                </Text>
              </View>

              {/* Kiosks List */}
              {filteredKiosks.map((kiosk) => (
                <ForexKioskCard key={kiosk.kioskId} kiosk={kiosk} />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Floating Bottom Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity testID="btn-calculator-outline"
          style={[styles.floatingCalcBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            openCalculator('USD', 500);
          }}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Open Forex Savings and DCC Simulator"
        >
          <Ionicons name="calculator-outline" size={18} color="#ffffff" />
          <Text style={styles.floatingCalcBtnText}>
            Simulate Cash & ATM Savings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Global Calculator Modal */}
      <ForexCalculatorModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 11,
    marginTop: 2,
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    minHeight: 44,
  },
  activeTabItem: {},
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeTabText: {
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  quickTipBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    marginBottom: 14,
  },
  quickTipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#065f46',
  },
  cityChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  cityChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 34,
    justifyContent: 'center',
  },
  cityChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  airportSecretCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 14,
  },
  secretHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  secretTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400e',
    letterSpacing: 0.5,
  },
  secretText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#78350f',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  floatingCalcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
    minHeight: 48,
  },
  floatingCalcBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

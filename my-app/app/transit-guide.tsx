import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useTransit } from '../context/TransitContext';
import { TransitLineCard } from '../components/TransitLineCard';
import { TransitRouteCard } from '../components/TransitRouteCard';
import { TaxiMeterShieldModal } from '../components/TaxiMeterShieldModal';

export default function TransitGuideScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();

  const {
    transitData,
    selectedLine,
    setSelectedLine,
    transitFareResult,
    isCalculatingTransit,
    calculateRouteFare,
    isLoading,
    isRefreshing,
    isTaxiModalOpen,
    setIsTaxiModalOpen,
    refreshTransitHub,
  } = useTransit();

  const [originInput, setOriginInput] = useState<string>('Siam');
  const [destInput, setDestInput] = useState<string>('Chatuchak (Mo Chit)');

  const handleCalculateRoute = async () => {
    if (!originInput.trim() || !destInput.trim()) return;
    Haptics.selectionAsync().catch(() => {});
    await calculateRouteFare(originInput, destInput);
  };

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
            Transit & Taxi Scam Shield
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
            {transitData?.city || 'Bangkok'} BTS, MRT Metro & Taxi Fair-Fare
          </Text>
        </View>

        <TouchableOpacity testID="btn-shield-checkmark" accessibilityLabel="shield checkmark"
          style={[styles.taxiShieldBtn, { backgroundColor: '#ecfdf5' }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setIsTaxiModalOpen(true);
          }}
        >
          <Ionicons name="shield-checkmark" size={14} color="#059669" />
          <Text style={styles.taxiShieldBtnText}>Taxi Shield</Text>
        </TouchableOpacity>
      </View>

      {/* Main Body */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedText }]}>
            Loading rapid transit lines, station routes and taxi rates...
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
              onRefresh={refreshTransitHub}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* Transit Pass Advice Banner */}
          {transitData?.transitPassAdvice && (
            <View style={[styles.adviceBanner, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
              <Ionicons name="card-outline" size={20} color="#1d4ed8" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.adviceBannerTitle}>Smart Ticketing & Contactless Tap</Text>
                <Text style={styles.adviceBannerText}>{transitData.transitPassAdvice}</Text>
              </View>
            </View>
          )}

          {/* Station-to-Station Route Fare Calculator */}
          <View style={[styles.calcCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.calcHeader}>
              <Ionicons name="navigate-outline" size={18} color={colors.primary} />
              <Text style={[styles.calcTitle, { color: colors.heading }]}>
                Station-to-Station Route & Fare Finder
              </Text>
            </View>

            <View style={styles.inputsRow}>
              <View style={styles.inputWrap}>
                <Text style={[styles.inputLabel, { color: colors.mutedText }]}>FROM STATION:</Text>
                <TextInput
                  style={[styles.textInput, { color: colors.heading, backgroundColor: colors.background, borderColor: colors.border }]}
                  value={originInput}
                  onChangeText={setOriginInput}
                  placeholder="e.g. Siam or Airport"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View style={styles.inputWrap}>
                <Text style={[styles.inputLabel, { color: colors.mutedText }]}>TO STATION:</Text>
                <TextInput
                  style={[styles.textInput, { color: colors.heading, backgroundColor: colors.background, borderColor: colors.border }]}
                  value={destInput}
                  onChangeText={setDestInput}
                  placeholder="e.g. Mo Chit or Chinatown"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            <TouchableOpacity testID="btn-search" accessibilityLabel="Search"
              style={[styles.calcBtn, { backgroundColor: colors.primary, opacity: isCalculatingTransit ? 0.7 : 1 }]}
              onPress={handleCalculateRoute}
              disabled={isCalculatingTransit}
              activeOpacity={0.85}
            >
              {isCalculatingTransit ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons name="search-outline" size={16} color="#ffffff" />
                  <Text style={styles.calcBtnText}>Find Metro Route & Fare</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Calculated Result Box */}
            {transitFareResult && (
              <View style={[styles.routeResultBox, { backgroundColor: '#f0fdf4', borderColor: '#86efac' }]}>
                <View style={styles.routeResultTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.routeResultLine}>{transitFareResult.recommendedLine}</Text>
                    <Text style={styles.routeResultDuration}>
                      {transitFareResult.durationMins} mins &bull; {transitFareResult.stopsCount} stops &bull; {transitFareResult.transfers === 0 ? 'Direct Travel' : `${transitFareResult.transfers} transfer`}
                    </Text>
                  </View>
                  <View style={styles.routeResultPriceBadge}>
                    <Text style={styles.routeResultPriceText}>{transitFareResult.fareAmount}</Text>
                  </View>
                </View>

                <Text style={styles.routeResultInstruction}>
                  {transitFareResult.instruction}
                </Text>
              </View>
            )}
          </View>

          {/* Popular Tourist Routes */}
          {transitData?.popularRoutes && transitData.popularRoutes.length > 0 && (
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="compass-outline" size={18} color={colors.primary} />
                <Text style={[styles.sectionHeading, { color: colors.heading }]}>
                  Popular Fast Routes
                </Text>
              </View>
              <Text style={[styles.sectionSub, { color: colors.mutedText }]}>
                Skip highway gridlock with direct skytrain and underground metro connections.
              </Text>

              {transitData.popularRoutes.map((rt) => (
                <TransitRouteCard
                  key={rt.id}
                  route={rt}
                  onPressRoute={(picked) => {
                    setOriginInput(picked.originStation);
                    setDestInput(picked.destinationStation);
                    handleCalculateRoute();
                  }}
                />
              ))}
            </View>
          )}

          {/* Rapid Transit Lines */}
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="train" size={18} color={colors.primary} />
              <Text style={[styles.sectionHeading, { color: colors.heading }]}>
                Rapid Transit Lines & Stations ({transitData?.lines?.length ?? 0})
              </Text>
            </View>
            <Text style={[styles.sectionSub, { color: colors.mutedText }]}>
              Operating hours, key stations, and accepted payment cards.
            </Text>

            {transitData?.lines?.map((line) => (
              <TransitLineCard
                key={line.lineId}
                line={line}
                isSelected={selectedLine?.lineId === line.lineId}
                onSelectLine={(l) => setSelectedLine(l)}
              />
            ))}
          </View>

          {/* Taxi Scam Defense Trigger Banner */}
          <TouchableOpacity testID="btn-shield-checkmark" accessibilityLabel="shield checkmark"
            style={[styles.taxiShieldBanner, { backgroundColor: '#ecfdf5', borderColor: '#86efac' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setIsTaxiModalOpen(true);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.taxiShieldLeft}>
              <Ionicons name="shield-checkmark" size={24} color="#059669" />
              <View style={{ flex: 1 }}>
                <Text style={styles.taxiShieldTitle}>Taxi Meter Scam Shield & Fair-Fare Calculator</Text>
                <Text style={styles.taxiShieldSub}>
                  Base fare {transitData?.taxiGuide?.baseMeterFare}. Avoid flat-rate tourist traps!
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#059669" />
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Taxi Meter Shield Modal */}
      <TaxiMeterShieldModal
        visible={isTaxiModalOpen}
        onClose={() => setIsTaxiModalOpen(false)}
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
  taxiShieldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  taxiShieldBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
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
  adviceBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 10,
    marginBottom: 14,
  },
  adviceBannerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1d4ed8',
    marginBottom: 2,
  },
  adviceBannerText: {
    fontSize: 11,
    lineHeight: 16,
    color: '#1e3a8a',
  },
  calcCard: {
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
  calcHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  calcTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  inputWrap: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  textInput: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12,
    fontWeight: '600',
  },
  calcBtn: {
    height: 42,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  calcBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  routeResultBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 12,
  },
  routeResultTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  routeResultLine: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803d',
  },
  routeResultDuration: {
    fontSize: 11,
    color: '#166534',
    marginTop: 1,
  },
  routeResultPriceBadge: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  routeResultPriceText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  routeResultInstruction: {
    fontSize: 11,
    lineHeight: 16,
    color: '#14532d',
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
  taxiShieldBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  taxiShieldLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  taxiShieldTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065f46',
  },
  taxiShieldSub: {
    fontSize: 11,
    color: '#047857',
    marginTop: 1,
  },
});

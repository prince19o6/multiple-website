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
import { useBaggage } from '../context/BaggageContext';
import { BaggageAllowanceCard } from '../components/BaggageAllowanceCard';
import { BaggageCalculatorModal } from '../components/BaggageCalculatorModal';
import { ProhibitedItemsSheet } from '../components/ProhibitedItemsSheet';

export default function BaggageCalculatorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();

  const {
    selectedAirline,
    supportedAirlines,
    setSelectedAirline,
    checkedWeight,
    cabinWeight,
    isLoading,
    isRefreshing,
    isCalculatorModalOpen,
    setIsCalculatorModalOpen,
    isProhibitedSheetOpen,
    setIsProhibitedSheetOpen,
    refreshBaggageHub,
  } = useBaggage();

  const checkedLimit = selectedAirline?.checkedAllowanceKg ?? 20;
  const isOverweight = checkedWeight > checkedLimit;

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
            Airline Baggage & Sizer
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
            Weight Allowances, Excess Fees & Restrictions
          </Text>
        </View>

        <TouchableOpacity testID="btn-ban-outline" accessibilityLabel="ban outline"
          style={[styles.dangerRulesBtn, { backgroundColor: '#fef2f2' }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setIsProhibitedSheetOpen(true);
          }}
        >
          <Ionicons name="ban-outline" size={14} color="#dc2626" />
          <Text style={styles.dangerRulesBtnText}>Rules</Text>
        </TouchableOpacity>
      </View>

      {/* Main Body */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedText }]}>
            Loading airline luggage allowances and baggage policies...
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
              onRefresh={refreshBaggageHub}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* Active Flight Allowance Card */}
          {selectedAirline && (
            <View style={[styles.activeBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.activeBannerTop}>
                <View style={[styles.airlineCodeBox, { backgroundColor: colors.primary }]}>
                  <Text style={styles.airlineCodeText}>{selectedAirline.airlineCode}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.activeAirlineTitle, { color: colors.heading }]}>
                    {selectedAirline.airlineName}
                  </Text>
                  <Text style={[styles.activeAllowanceSub, { color: colors.mutedText }]}>
                    Cabin {selectedAirline.cabinAllowanceKg}kg &bull; Checked {selectedAirline.checkedAllowanceKg}kg
                  </Text>
                </View>

                <TouchableOpacity testID="btn-scale-outline" accessibilityLabel="scale outline"
                  style={[styles.weighBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                    setIsCalculatorModalOpen(true);
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="scale-outline" size={14} color="#ffffff" />
                  <Text style={styles.weighBtnText}>Weigh Bags</Text>
                </TouchableOpacity>
              </View>

              {/* Weight Status Meter */}
              <View style={[styles.meterBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.meterCol}>
                  <Text style={[styles.meterLabel, { color: colors.mutedText }]}>CHECKED BAG</Text>
                  <Text style={[styles.meterVal, { color: isOverweight ? '#dc2626' : '#16a34a' }]}>
                    {checkedWeight} kg {isOverweight ? `(+${Math.round((checkedWeight - checkedLimit)*10)/10}kg over)` : `(Under limit)`}
                  </Text>
                </View>
                <View style={styles.meterDivider} />
                <View style={styles.meterCol}>
                  <Text style={[styles.meterLabel, { color: colors.mutedText }]}>CABIN BAG</Text>
                  <Text style={[styles.meterVal, { color: cabinWeight > selectedAirline.cabinAllowanceKg ? '#d97706' : '#16a34a' }]}>
                    {cabinWeight} kg / {selectedAirline.cabinAllowanceKg}kg
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Carry-On Dimensional Limits Box */}
          <View style={[styles.dimCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.dimHeader}>
              <Ionicons name="expand-outline" size={18} color="#0284c7" />
              <Text style={[styles.dimTitle, { color: colors.heading }]}>
                ICAO Carry-On Dimensional Limits
              </Text>
            </View>
            <Text style={[styles.dimDesc, { color: colors.mutedText }]}>
              Cabin roller bags must fit overhead bins (max 55 x 35 x 25 cm, total 115 cm). Bags exceeding this will be offloaded to cargo at the boarding gate.
            </Text>
          </View>

          {/* Supported Airlines Policies Section */}
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="airplane" size={18} color={colors.primary} />
              <Text style={[styles.sectionHeading, { color: colors.heading }]}>
                Airlines Baggage Policies ({supportedAirlines.length})
              </Text>
            </View>
            <Text style={[styles.sectionSub, { color: colors.mutedText }]}>
              Select your flight airline to automatically apply correct weight limits and calculate excess rates.
            </Text>

            {supportedAirlines.map((al) => (
              <BaggageAllowanceCard
                key={al.airlineCode}
                airline={al}
                isSelected={selectedAirline?.airlineCode === al.airlineCode}
                onSelectAirline={(picked) => setSelectedAirline(picked)}
              />
            ))}
          </View>

          {/* Prohibited Items Trigger Banner */}
          <TouchableOpacity testID="btn-shield-half-outline" accessibilityLabel="shield half outline"
            style={[styles.prohibitedBanner, { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setIsProhibitedSheetOpen(true);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.prohibitedLeft}>
              <Ionicons name="shield-half-outline" size={24} color="#dc2626" />
              <View style={{ flex: 1 }}>
                <Text style={styles.prohibitedTitle}>Dangerous Goods & Packing Rules</Text>
                <Text style={styles.prohibitedSub}>
                  View TSA liquid limits (100ml) & lithium power bank rules.
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#dc2626" />
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Baggage Calculator Modal */}
      <BaggageCalculatorModal
        visible={isCalculatorModalOpen}
        onClose={() => setIsCalculatorModalOpen(false)}
      />

      {/* Prohibited Items Sheet */}
      <ProhibitedItemsSheet
        visible={isProhibitedSheetOpen}
        onClose={() => setIsProhibitedSheetOpen(false)}
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
  dangerRulesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  dangerRulesBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
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
  activeBanner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  activeBannerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  airlineCodeBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  airlineCodeText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  activeAirlineTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  activeAllowanceSub: {
    fontSize: 11,
    marginTop: 2,
  },
  weighBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  weighBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  meterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  meterCol: {
    flex: 1,
  },
  meterDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginHorizontal: 10,
  },
  meterLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  meterVal: {
    fontSize: 12,
    fontWeight: '800',
  },
  dimCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  dimHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  dimTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  dimDesc: {
    fontSize: 11,
    lineHeight: 16,
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
  prohibitedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  prohibitedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  prohibitedTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991b1b',
  },
  prohibitedSub: {
    fontSize: 11,
    color: '#7f1d1d',
    marginTop: 1,
  },
});

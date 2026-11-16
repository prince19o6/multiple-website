import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useVisa } from '../context/VisaContext';
import { VisaStatusBadge } from '../components/VisaStatusBadge';
import { PassportValidityCheckerModal } from '../components/PassportValidityCheckerModal';
import { ArrivalCardGuideModal } from '../components/ArrivalCardGuideModal';
import { ConsularEmergencyCard } from '../components/ConsularEmergencyCard';
import { VisaOnlineApplyModal, type VisaTier } from '../components/VisaOnlineApplyModal';
import { DigitalArrivalCard } from '../types';
import { FeatureGuard } from '@/components/common/FeatureGuard';

function VisaHubContent() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();

  const {
    hubData,
    selectedNationality,
    setSelectedNationality,
    selectedDestination,
    setSelectedDestination,
    currentVisaRule,
    arrivalCards,
    embassies,
    isLoading,
    isRefreshing,
    isValidityModalOpen,
    setIsValidityModalOpen,
    isArrivalCardModalOpen,
    setIsArrivalCardModalOpen,
    selectedArrivalCard,
    setSelectedArrivalCard,
    refreshVisaHub,
  } = useVisa();

  const [selectedTierForApply, setSelectedTierForApply] = useState<VisaTier | null>(null);
  const [isApplyModalVisible, setIsApplyModalVisible] = useState(false);

  const params = useLocalSearchParams<{ destination?: string; nationality?: string }>();

  React.useEffect(() => {
    if (params.destination) {
      setSelectedDestination(params.destination);
    }
    if (params.nationality) {
      setSelectedNationality(params.nationality);
    }
  }, [params.destination, params.nationality, setSelectedDestination, setSelectedNationality]);

  const handleOpenArrivalCard = (card: DigitalArrivalCard) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedArrivalCard(card);
    setIsArrivalCardModalOpen(true);
  };

  const handleOpenPortal = (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (url) {
      Linking.openURL(url).catch(() => {});
    }
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
            Visa & Consular Clearance Hub
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
            Digital Entry Cards & Embassy Directory
          </Text>
        </View>

        <TouchableOpacity testID="btn-calculator-outline" accessibilityLabel="calculator outline"
          style={[styles.validityQuickBtn, { backgroundColor: `${colors.primary}15` }]}
          onPress={() => setIsValidityModalOpen(true)}
        >
          <Ionicons name="calculator-outline" size={16} color={colors.primary} />
          <Text style={[styles.validityQuickText, { color: colors.primary }]}>6-Mo</Text>
        </TouchableOpacity>
      </View>

      {/* Main Body */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedText }]}>
            Loading visa requirements & border regulations...
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
              onRefresh={refreshVisaHub}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* Nationality Selector Strip */}
          {hubData?.supportedNationalities && hubData.supportedNationalities.length > 0 && (
            <View style={styles.selectorSection}>
              <Text style={[styles.selectorLabel, { color: colors.mutedText }]}>YOUR PASSPORT NATIONALITY</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pillsScroll}
              >
                {hubData.supportedNationalities.map((nat) => {
                  const isSelected = selectedNationality.toLowerCase() === nat.toLowerCase();
                  return (
                    <TouchableOpacity testID="btn-flag" accessibilityLabel="flag"
                      key={nat}
                      style={[
                        styles.selectorPill,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surface,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setSelectedNationality(nat);
                      }}
                    >
                      <Ionicons
                        name="flag"
                        size={12}
                        color={isSelected ? '#ffffff' : colors.primary}
                        style={{ marginRight: 5 }}
                      />
                      <Text
                        style={[
                          styles.selectorPillText,
                          { color: isSelected ? '#ffffff' : colors.heading },
                        ]}
                      >
                        {nat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Destination Selector Strip */}
          {hubData?.supportedDestinations && hubData.supportedDestinations.length > 0 && (
            <View style={[styles.selectorSection, { marginTop: 8 }]}>
              <Text style={[styles.selectorLabel, { color: colors.mutedText }]}>TRAVELING TO DESTINATION</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pillsScroll}
              >
                {hubData.supportedDestinations.map((dest) => {
                  const isSelected = selectedDestination.toLowerCase() === dest.toLowerCase();
                  return (
                    <TouchableOpacity testID="btn-location" accessibilityLabel="location"
                      key={dest}
                      style={[
                        styles.selectorPill,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surface,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setSelectedDestination(dest);
                      }}
                    >
                      <Ionicons
                        name="location"
                        size={12}
                        color={isSelected ? '#ffffff' : colors.primary}
                        style={{ marginRight: 5 }}
                      />
                      <Text
                        style={[
                          styles.selectorPillText,
                          { color: isSelected ? '#ffffff' : colors.heading },
                        ]}
                      >
                        {dest}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Active Visa Rule Hero Pass */}
          {currentVisaRule && (
            <View
              style={[
                styles.visaPassCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.passTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.passCountryHeading, { color: colors.heading }]}>
                    {currentVisaRule.destinationCountry}
                  </Text>
                  <Text style={[styles.passSubHeading, { color: colors.mutedText }]}>
                    for {currentVisaRule.passportNationality} Citizen Passport
                  </Text>
                </View>
                <VisaStatusBadge
                  status={currentVisaRule.status}
                  badgeText={currentVisaRule.statusBadge}
                />
              </View>

              {/* Grid Metrics */}
              <View
                style={[
                  styles.passMetricsGrid,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
              >
                <View style={styles.passMetricCol}>
                  <Text style={[styles.metricLabel, { color: colors.mutedText }]}>MAX STAY</Text>
                  <Text style={[styles.metricValue, { color: colors.heading }]}>
                    {currentVisaRule.maxStayDays} Days
                  </Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.passMetricCol}>
                  <Text style={[styles.metricLabel, { color: colors.mutedText }]}>BORDER FEE</Text>
                  <Text style={[styles.metricValue, { color: '#059669' }]}>
                    {currentVisaRule.estimatedFee}
                  </Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.passMetricCol}>
                  <Text style={[styles.metricLabel, { color: colors.mutedText }]}>PASSPORT REQ</Text>
                  <Text style={[styles.metricValue, { color: colors.heading }]}>
                    Min {currentVisaRule.passportValidityMonthsRequired} Mo.
                  </Text>
                </View>
              </View>

              {/* Mandatory Documents Checklist */}
              {currentVisaRule.mandatoryDocuments && currentVisaRule.mandatoryDocuments.length > 0 && (
                <View style={styles.docsListWrap}>
                  <Text style={[styles.docsListTitle, { color: colors.heading }]}>
                    Mandatory Boarding & Immigration Documents
                  </Text>
                  {currentVisaRule.mandatoryDocuments.map((doc, i) => (
                    <View key={i} style={styles.docRow}>
                      <Ionicons name="checkmark-circle" size={16} color="#059669" />
                      <Text style={[styles.docText, { color: colors.mutedText }]}>{doc}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Notes */}
              {currentVisaRule.notes ? (
                <View style={[styles.notesBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                  <Ionicons name="information-circle" size={16} color="#15803d" />
                  <Text style={styles.notesText}>{currentVisaRule.notes}</Text>
                </View>
              ) : null}

              {/* Action Buttons */}
              <View style={styles.passActionRow}>
                {currentVisaRule.officialPortalUrl ? (
                  <TouchableOpacity testID="btn-globe-outline" accessibilityLabel="globe outline"
                    style={[styles.portalActionBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleOpenPortal(currentVisaRule.officialPortalUrl)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="globe-outline" size={16} color="#ffffff" />
                    <Text style={styles.portalActionText}>Official Immigration Portal</Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity testID="btn-calculator-outline" accessibilityLabel="calculator outline"
                  style={[styles.calcActionBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => setIsValidityModalOpen(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calculator-outline" size={16} color={colors.heading} />
                  <Text style={[styles.calcActionText, { color: colors.heading }]}>Check My Expiry</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Online eVisa Clearance Packages Section */}
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="shield-checkmark" size={18} color="#059669" />
              <Text style={[styles.sectionHeading, { color: colors.heading }]}>
                Apply For {selectedDestination} eVisas
              </Text>
            </View>
            <Text style={[styles.sectionSub, { color: colors.mutedText }]}>
              Guaranteed 99.4% approval rate with 2-hour pre-screening by our visa experts.
            </Text>

            <View style={{ gap: 10, marginTop: 8 }}>
              {([
                {
                  id: 'tourist-30',
                  title: `${selectedDestination} 30-Day Tourist eVisa`,
                  stay: '30 Days',
                  time: '3-4 Working Days',
                  price: '₹6,499',
                  numericPrice: 6499,
                  type: 'Tourist eVisa',
                  fastTrack: false,
                },
                {
                  id: 'express-48h',
                  title: `${selectedDestination} 48-Hour Express Fast-Track eVisa`,
                  stay: '30 Days',
                  time: '24-48 Hours',
                  price: '₹8,999',
                  numericPrice: 8999,
                  type: 'Express eVisa',
                  fastTrack: true,
                },
                {
                  id: 'tourist-60',
                  title: `${selectedDestination} 60-Day Multiple Entry Tourist eVisa`,
                  stay: '60 Days',
                  time: '4-5 Working Days',
                  price: '₹13,999',
                  numericPrice: 13999,
                  type: 'Multiple Entry',
                  fastTrack: true,
                },
                {
                  id: 'business-90',
                  title: `${selectedDestination} 90-Day Business & Commercial Visa`,
                  stay: '90 Days',
                  time: '4-6 Working Days',
                  price: '₹19,499',
                  numericPrice: 19499,
                  type: 'Business Visa',
                  fastTrack: false,
                },
              ] as VisaTier[]).map((tier) => (
                <View
                  key={tier.id}
                  style={[
                    styles.arrivalCardItem,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      padding: 12,
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: colors.primary, textTransform: 'uppercase' }}>
                        {tier.type}
                      </Text>
                      {tier.fastTrack && (
                        <View style={{ backgroundColor: '#ecfdf5', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                          <Text style={{ fontSize: 9, fontWeight: '800', color: '#059669' }}>⚡ FAST-TRACK</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: colors.heading }}>
                      {tier.price}
                    </Text>
                  </View>

                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.heading, marginBottom: 6 }}>
                    {tier.title}
                  </Text>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: colors.mutedText }}>
                      Stay: {tier.stay} &bull; {tier.time}
                    </Text>
                    <TouchableOpacity
                      testID={`btn-apply-${tier.id}`}
                      accessibilityLabel={`Apply for ${tier.title}`}
                      style={{
                        backgroundColor: colors.primary,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                      }}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                        setSelectedTierForApply(tier);
                        setIsApplyModalVisible(true);
                      }}
                    >
                      <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '700' }}>Apply Online →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Digital Arrival Cards Section */}
          {arrivalCards.length > 0 && (
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="qr-code-outline" size={18} color={colors.primary} />
                <Text style={[styles.sectionHeading, { color: colors.heading }]}>
                  Mandatory Digital Arrival Cards
                </Text>
              </View>
              <Text style={[styles.sectionSub, { color: colors.mutedText }]}>
                Submit online prior to boarding your international flight to avoid immigration hold-ups.
              </Text>

              {arrivalCards.map((card) => (
                <TouchableOpacity testID="btn-document-text" accessibilityLabel="document text"
                  key={card.cardId}
                  style={[
                    styles.arrivalCardItem,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() => handleOpenArrivalCard(card)}
                  activeOpacity={0.8}
                >
                  <View style={styles.arrivalCardLeft}>
                    <View style={[styles.arrivalIconBox, { backgroundColor: `${colors.primary}15` }]}>
                      <Ionicons name="document-text" size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.arrivalCardName, { color: colors.heading }]}>
                        {card.cardName}
                      </Text>
                      <Text style={[styles.arrivalCardWindow, { color: colors.mutedText }]}>
                        Window: {card.submissionWindow}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Consular & Embassy Directory Section */}
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="business" size={18} color="#0284c7" />
              <Text style={[styles.sectionHeading, { color: colors.heading }]}>
                Embassies & Consular Emergency Desks
              </Text>
            </View>
            <Text style={[styles.sectionSub, { color: colors.mutedText }]}>
              Official bilateral assistance, 24/7 hotlines, and emergency lost passport services in {selectedDestination}.
            </Text>

            {embassies.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="information-circle-outline" size={28} color={colors.mutedText} />
                <Text style={[styles.emptyText, { color: colors.mutedText }]}>
                  No consular missions listed for this combination. Please contact the nearest national embassy.
                </Text>
              </View>
            ) : (
              embassies.map((embassy) => (
                <ConsularEmergencyCard key={embassy.id} embassy={embassy} />
              ))
            )}
          </View>
        </ScrollView>
      )}

      {/* Passport Validity Calculator Modal */}
      <PassportValidityCheckerModal
        visible={isValidityModalOpen}
        onClose={() => setIsValidityModalOpen(false)}
      />

      {/* Arrival Card Step-by-Step Guide Modal */}
      <ArrivalCardGuideModal
        card={selectedArrivalCard}
        visible={isArrivalCardModalOpen}
        onClose={() => setIsArrivalCardModalOpen(false)}
      />

      {/* Fast-Track Online Visa Application Modal */}
      <VisaOnlineApplyModal
        visible={isApplyModalVisible}
        tier={selectedTierForApply}
        destination={selectedDestination}
        nationality={selectedNationality}
        onClose={() => {
          setIsApplyModalVisible(false);
          setSelectedTierForApply(null);
        }}
      />
    </View>
  );
}

export default function VisaHubScreen() {
  return (
    <FeatureGuard featureId="visas">
      <VisaHubContent />
    </FeatureGuard>
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
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  validityQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 4,
  },
  validityQuickText: {
    fontSize: 12,
    fontWeight: '700',
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
  selectorSection: {
    marginBottom: 6,
  },
  selectorLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  pillsScroll: {
    gap: 8,
    paddingBottom: 2,
  },
  selectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
  },
  selectorPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  visaPassCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  passTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  passCountryHeading: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  passSubHeading: {
    fontSize: 12,
    marginTop: 2,
  },
  passMetricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  passMetricCol: {
    flex: 1,
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  docsListWrap: {
    marginBottom: 12,
  },
  docsListTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 6,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  docText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    marginBottom: 14,
  },
  notesText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
    color: '#15803d',
    fontWeight: '500',
  },
  passActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  portalActionBtn: {
    flex: 1.4,
    minHeight: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  portalActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  calcActionBtn: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  calcActionText: {
    fontSize: 12,
    fontWeight: '600',
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
  arrivalCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  arrivalCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  arrivalIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrivalCardName: {
    fontSize: 14,
    fontWeight: '700',
  },
  arrivalCardWindow: {
    fontSize: 11,
    marginTop: 2,
  },
  emptyBox: {
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useEco } from '../context/EcoContext';
import { CarbonGaugeCard } from '../components/CarbonGaugeCard';
import { OffsetProjectCard } from '../components/OffsetProjectCard';
import { CarbonCalculatorModal } from '../components/CarbonCalculatorModal';
import { EcoCertificateModal } from '../components/EcoCertificateModal';
import { VerifiedClimateProject, OffsetContribution } from '../types';

export default function EcoTravelScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();

  const {
    ecoData,
    emissions,
    projects,
    contributions,
    pledges,
    selectedContribution,
    setSelectedContribution,
    isLoading,
    isRefreshing,
    isCalculatorModalOpen,
    setIsCalculatorModalOpen,
    isCertificateModalOpen,
    setIsCertificateModalOpen,
    isOffsetting,
    offsetEmissions,
    togglePledge,
    refreshEcoHub,
  } = useEco();

  const handleOffsetProject = async (project: VerifiedClimateProject) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    const amountKg = emissions?.totalEmissionsKg || 500;
    const tonnes = amountKg / 1000.0;
    const cost = Math.max(1, Math.round(tonnes * project.pricePerTonneUsd * 100) / 100);

    Alert.alert(
      'Retire Carbon Emissions',
      `Would you like to retire ${amountKg.toFixed(1)} kg CO2e through ${project.name} ($${cost.toFixed(2)} USD)? An official verifiable certificate will be issued under your name.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Retire & Certify',
          onPress: async () => {
            const res = await offsetEmissions(
              project.projectId,
              amountKg,
              'Verified Traveler'
            );
            if (!res) {
              Alert.alert('Offset Error', 'Could not process offset. Please verify network connection.');
            }
          },
        },
      ]
    );
  };

  const handleViewCertificate = (contrib: OffsetContribution) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedContribution(contrib);
    setIsCertificateModalOpen(true);
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
            Eco-Travel & Climate Action
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
            Verified Offsets & Sustainable Pledges
          </Text>
        </View>

        <View style={styles.levelBadge}>
          <Ionicons name="ribbon" size={12} color="#059669" />
          <Text style={styles.levelBadgeText}>
            {ecoData?.ecoExplorerLevel || 'Eco Pioneer'}
          </Text>
        </View>
      </View>

      {/* Main Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedText }]}>
            Calculating flight emissions & climate projects...
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
              onRefresh={refreshEcoHub}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* Carbon Gauge Metric Card */}
          {emissions && (
            <CarbonGaugeCard
              emissions={emissions}
              flightRoute={ecoData?.defaultFlightRoute}
              onOpenCalculator={() => setIsCalculatorModalOpen(true)}
              style={{ marginBottom: 18 }}
            />
          )}

          {/* Verified Climate Projects Section */}
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="leaf" size={18} color="#059669" />
              <Text style={[styles.sectionHeading, { color: colors.heading }]}>
                Verified Carbon Offset Projects
              </Text>
            </View>
            <Text style={[styles.sectionSub, { color: colors.mutedText }]}>
              Third-party Gold Standard & Verra certified projects restoring local ecosystems in destination.
            </Text>

            {projects.map((proj) => (
              <OffsetProjectCard
                key={proj.projectId}
                project={proj}
                offsetAmountKg={emissions?.totalEmissionsKg || 500}
                onOffset={handleOffsetProject}
                isOffsetting={isOffsetting}
              />
            ))}
          </View>

          {/* My Offset Certificates Section */}
          {contributions.length > 0 && (
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="ribbon-outline" size={18} color={colors.primary} />
                <Text style={[styles.sectionHeading, { color: colors.heading }]}>
                  Your Carbon Neutral Certificates ({contributions.length})
                </Text>
              </View>
              <Text style={[styles.sectionSub, { color: colors.mutedText }]}>
                Official verifiable registry serials retired for your journeys.
              </Text>

              {contributions.map((contrib) => (
                <TouchableOpacity testID="btn-shield-checkmark" accessibilityLabel="shield checkmark"
                  key={contrib.contributionId}
                  style={[
                    styles.certItem,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  onPress={() => handleViewCertificate(contrib)}
                  activeOpacity={0.8}
                >
                  <View style={styles.certIconCircle}>
                    <Ionicons name="shield-checkmark" size={20} color="#059669" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.certSerial, { color: colors.heading }]} numberOfLines={1}>
                      {contrib.certificateNumber}
                    </Text>
                    <Text style={[styles.certDetails, { color: colors.mutedText }]}>
                      {contrib.offsetAmountKg} kg &bull; {contrib.projectName}
                    </Text>
                  </View>
                  <Ionicons name="eye-outline" size={18} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* In-Destination Sustainable Pledges */}
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="heart-circle" size={20} color="#ef4444" />
              <Text style={[styles.sectionHeading, { color: colors.heading }]}>
                Sustainable Traveler Pledges
              </Text>
            </View>
            <Text style={[styles.sectionSub, { color: colors.mutedText }]}>
              Take the pledge to protect marine reefs, animal sanctuaries, and local communities during your trip.
            </Text>

            {pledges.map((pledge) => (
              <TouchableOpacity testID="btn-eco-travel-232" accessibilityLabel="eco-travel action"
                key={pledge.id}
                style={[
                  styles.pledgeCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: pledge.isPledged ? '#86efac' : colors.border,
                  },
                ]}
                onPress={() => togglePledge(pledge.id)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.pledgeCheckbox,
                    {
                      backgroundColor: pledge.isPledged ? '#059669' : colors.background,
                      borderColor: pledge.isPledged ? '#059669' : colors.border,
                    },
                  ]}
                >
                  {pledge.isPledged && <Ionicons name="checkmark" size={14} color="#ffffff" />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pledgeTitle, { color: colors.heading }]}>
                    {pledge.title}
                  </Text>
                  <Text style={[styles.pledgeDesc, { color: colors.mutedText }]}>
                    {pledge.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Carbon Calculator Modal */}
      <CarbonCalculatorModal
        visible={isCalculatorModalOpen}
        onClose={() => setIsCalculatorModalOpen(false)}
      />

      {/* Eco Certificate Modal */}
      <EcoCertificateModal
        contribution={selectedContribution}
        visible={isCertificateModalOpen}
        onClose={() => setIsCertificateModalOpen(false)}
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
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#86efac',
    gap: 4,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
    letterSpacing: 0.3,
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
  sectionWrap: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionSub: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  certItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  certIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  certSerial: {
    fontSize: 13,
    fontWeight: '700',
  },
  certDetails: {
    fontSize: 11,
    marginTop: 2,
  },
  pledgeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    marginBottom: 8,
  },
  pledgeCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  pledgeTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  pledgeDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
});

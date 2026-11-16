import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TextInput,
  Linking,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useInsurance } from '../context/InsuranceContext';
import { PolicyCard } from '../components/PolicyCard';
import { HospitalNetworkCard } from '../components/HospitalNetworkCard';
import { ClaimAssistanceModal } from '../components/ClaimAssistanceModal';
import { HospitalDirectoryItem, InsuranceBenefit } from '../types';
import { FeatureGuard } from '@/components/common/FeatureGuard';

function TravelInsuranceContent() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();

  const {
    policy,
    filteredHospitals,
    availableCities,
    selectedCity,
    setSelectedCity,
    searchQuery,
    setSearchQuery,
    isLoading,
    isRefreshing,
    isClaimModalOpen,
    setIsClaimModalOpen,
    selectedHospitalForClaim,
    setSelectedHospitalForClaim,
    refreshInsurance,
  } = useInsurance();

  const [selectedBenefit, setSelectedBenefit] = useState<InsuranceBenefit | null>(null);

  const handleOpenClaimForHospital = (hospital: HospitalDirectoryItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setSelectedHospitalForClaim(hospital);
    setIsClaimModalOpen(true);
  };

  const handleOpenGeneralClaim = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedHospitalForClaim(null);
    setIsClaimModalOpen(true);
  };

  const handleCallEmergency = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    const phone = policy?.emergencyAssistancePhone || '+66 2 118 8111';
    const clean = phone.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${clean}`).catch(() => {});
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Top App Header */}
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
            Travel Insurance & Medical
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
            Cashless Hospital Directory & GOP
          </Text>
        </View>

        <TouchableOpacity testID="btn-call" accessibilityLabel="call"
          style={styles.emergencySosBtn}
          onPress={handleCallEmergency}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="call" size={18} color="#ffffff" />
          <Text style={styles.emergencySosBtnText}>SOS</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedText }]}>
            Loading insurance wallet & hospital network...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredHospitals}
          keyExtractor={(item) => item.hospitalId}
          renderItem={({ item }) => (
            <HospitalNetworkCard
              hospital={item}
              onRequestCashlessAuth={handleOpenClaimForHospital}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom + 24, 40) },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={refreshInsurance}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              {/* Active Policy Digital Pass */}
              {policy && (
                <PolicyCard
                  policy={policy}
                  onOpenClaimModal={handleOpenGeneralClaim}
                  style={{ marginBottom: 20 }}
                />
              )}

              {/* Coverage Benefits Grid */}
              {policy && policy.benefits && policy.benefits.length > 0 && (
                <View style={styles.benefitsSection}>
                  <Text style={[styles.sectionTitle, { color: colors.heading }]}>
                    Coverage Breakdown & Limits
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.benefitsScroll}
                  >
                    {policy.benefits.map((benefit) => (
                      <TouchableOpacity testID="btn-insurance-163" accessibilityLabel="insurance action"
                        key={benefit.benefitKey}
                        style={[
                          styles.benefitCard,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                          },
                        ]}
                        onPress={() => setSelectedBenefit(benefit)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.benefitTopRow}>
                          <View style={styles.benefitIconBox}>
                            <Ionicons
                              name={(benefit.iconName as any) || 'shield-checkmark'}
                              size={18}
                              color="#059669"
                            />
                          </View>
                          <Text style={styles.benefitLimitText}>{benefit.coverageLimit}</Text>
                        </View>
                        <Text
                          style={[styles.benefitTitle, { color: colors.heading }]}
                          numberOfLines={1}
                        >
                          {benefit.title}
                        </Text>
                        <Text
                          style={[styles.benefitDeductible, { color: colors.mutedText }]}
                          numberOfLines={1}
                        >
                          {benefit.deductible}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Cashless Hospital Directory Header & Filters */}
              <View style={styles.directoryHeader}>
                <View style={styles.directoryTitleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sectionTitle, { color: colors.heading }]}>
                      Pre-Approved Cashless Hospitals
                    </Text>
                    <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
                      Direct Guarantee of Payment (GOP) &bull; Zero Out-of-Pocket
                    </Text>
                  </View>
                  <View style={[styles.countBadge, { backgroundColor: `${colors.primary}15` }]}>
                    <Text style={[styles.countBadgeText, { color: colors.primary }]}>
                      {filteredHospitals.length} Centers
                    </Text>
                  </View>
                </View>

                {/* Search Bar */}
                <View
                  style={[
                    styles.searchBox,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons name="search" size={18} color={colors.mutedText} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.heading }]}
                    placeholder="Search by hospital name, specialty, or area..."
                    placeholderTextColor={colors.mutedText}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity testID="btn-close" accessibilityLabel="Close"
                      onPress={() => setSearchQuery('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle" size={18} color={colors.mutedText} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* City Filter Pills */}
                {availableCities.length > 1 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.cityPillsScroll}
                  >
                    {availableCities.map((city) => {
                      const isSelected = selectedCity.toLowerCase() === city.toLowerCase();
                      return (
                        <TouchableOpacity testID="btn-insurance-259" accessibilityLabel="insurance action"
                          key={city}
                          style={[
                            styles.cityPill,
                            {
                              backgroundColor: isSelected ? colors.primary : colors.surface,
                              borderColor: isSelected ? colors.primary : colors.border,
                            },
                          ]}
                          onPress={() => {
                            Haptics.selectionAsync().catch(() => {});
                            setSelectedCity(city);
                          }}
                        >
                          <Text
                            style={[
                              styles.cityPillText,
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
              </View>
            </View>
          }
          ListEmptyComponent={
            <View
              style={[
                styles.emptyContainer,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons name="medkit-outline" size={40} color={colors.mutedText} />
              <Text style={[styles.emptyTitle, { color: colors.heading }]}>
                No Medical Centers Found
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedText }]}>
                Try selecting a different city or clearing your search keywords.
              </Text>
            </View>
          }
        />
      )}

      {/* Claim Assistance Wizard Modal */}
      <ClaimAssistanceModal
        visible={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        initialHospital={selectedHospitalForClaim}
      />

      {/* Benefit Detail Modal */}
      <Modal
        visible={!!selectedBenefit}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBenefit(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.benefitModalCard, { backgroundColor: colors.surface }]}>
            <View style={styles.benefitModalHeader}>
              <View style={styles.benefitIconBoxLg}>
                <Ionicons
                  name={(selectedBenefit?.iconName as any) || 'shield-checkmark'}
                  size={24}
                  color="#059669"
                />
              </View>
              <TouchableOpacity testID="btn-close" accessibilityLabel="Close"
                onPress={() => setSelectedBenefit(null)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={22} color={colors.heading} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.benefitModalTitle, { color: colors.heading }]}>
              {selectedBenefit?.title}
            </Text>

            <View style={[styles.benefitDetailStrip, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.detailMiniLabel, { color: colors.mutedText }]}>MAX COVERAGE</Text>
                <Text style={[styles.detailMiniVal, { color: '#059669' }]}>
                  {selectedBenefit?.coverageLimit}
                </Text>
              </View>
              <View style={styles.vertDivider} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.detailMiniLabel, { color: colors.mutedText }]}>DEDUCTIBLE</Text>
                <Text style={[styles.detailMiniVal, { color: colors.heading }]}>
                  {selectedBenefit?.deductible}
                </Text>
              </View>
            </View>

            <Text style={[styles.benefitModalDesc, { color: colors.mutedText }]}>
              {selectedBenefit?.description}
            </Text>

            <TouchableOpacity testID="btn-close" accessibilityLabel="Close"
              style={[styles.benefitCloseBtn, { backgroundColor: colors.primary }]}
              onPress={() => setSelectedBenefit(null)}
            >
              <Text style={styles.benefitCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function TravelInsuranceScreen() {
  return (
    <FeatureGuard featureId="insurance">
      <TravelInsuranceContent />
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
  emergencySosBtn: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 18,
    gap: 4,
  },
  emergencySosBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  listHeader: {
    marginBottom: 8,
  },
  benefitsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  benefitsScroll: {
    paddingTop: 10,
    paddingBottom: 4,
    gap: 10,
  },
  benefitCard: {
    width: 170,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  benefitTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  benefitIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitLimitText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803d',
  },
  benefitTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  benefitDeductible: {
    fontSize: 11,
  },
  directoryHeader: {
    marginBottom: 14,
  },
  directoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  cityPillsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  cityPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  cityPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  benefitModalCard: {
    width: '100%',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  benefitModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  benefitIconBoxLg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    padding: 6,
  },
  benefitModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  benefitDetailStrip: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  detailMiniLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  detailMiniVal: {
    fontSize: 14,
    fontWeight: '700',
  },
  vertDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 12,
  },
  benefitModalDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  benefitCloseBtn: {
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitCloseBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

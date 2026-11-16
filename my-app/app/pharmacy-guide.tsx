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
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { usePharmacy } from '../context/PharmacyContext';
import { MedicineCard } from '../components/MedicineCard';
import { ShowPharmacistModal } from '../components/ShowPharmacistModal';
import { PharmacyDirectoryCard } from '../components/PharmacyDirectoryCard';

const CATEGORIES = [
  { key: 'ALL', label: 'All Meds' },
  { key: 'Fever_Pain', label: 'Fever & Pain' },
  { key: 'Stomach_Digestion', label: 'Stomach & ORS' },
  { key: 'Motion_Sickness', label: 'Motion Sickness' },
  { key: 'Allergy_Bites', label: 'Allergies & Bites' },
  { key: 'First_Aid', label: 'First Aid & Cuts' },
];

export default function PharmacyGuideScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();

  const {
    pharmacyData,
    selectedMedicine,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    searchResults,
    searchMeds,
    openShowPharmacist,
    isLoading,
    isRefreshing,
    isSearching,
    isShowPharmacistModalOpen,
    setIsShowPharmacistModalOpen,
    refreshPharmacyHub,
  } = usePharmacy();

  const [activeTab, setActiveTab] = useState<'medicines' | 'pharmacies' | 'customs'>('medicines');

  const displayedMedicines = React.useMemo(() => {
    let list = searchResults !== null ? searchResults : (pharmacyData?.medicines || []);
    if (selectedCategory !== 'ALL') {
      list = list.filter((m) => m.category === selectedCategory);
    }
    return list;
  }, [searchResults, pharmacyData?.medicines, selectedCategory]);

  const handleCallEmergency = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    if (pharmacyData?.emergencyAmbulanceNumber) {
      Linking.openURL(`tel:${pharmacyData.emergencyAmbulanceNumber}`).catch(() => {});
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
            Travel Pharmacy & Medicine Translator
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
            {pharmacyData?.city || 'Bangkok'} &bull; OTC Equivalents & 24/7 Care
          </Text>
        </View>

        <TouchableOpacity testID="btn-call" accessibilityLabel="call"
          style={styles.emergencyBtn}
          onPress={handleCallEmergency}
        >
          <Ionicons name="call" size={13} color="#ffffff" />
          <Text style={styles.emergencyBtnText}>
            SOS {pharmacyData?.emergencyAmbulanceNumber || '1669'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Tabs (Medicines / 24-Hr Pharmacies / Customs Warnings) */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity testID="btn-medkit-outline" accessibilityLabel="medkit outline"
          style={[styles.tabBtn, activeTab === 'medicines' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            setActiveTab('medicines');
          }}
        >
          <Ionicons
            name="medkit-outline"
            size={16}
            color={activeTab === 'medicines' ? colors.primary : colors.mutedText}
          />
          <Text style={[styles.tabBtnText, { color: activeTab === 'medicines' ? colors.primary : colors.mutedText }]}>
            Medicines ({displayedMedicines.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity testID="btn-location-outline" accessibilityLabel="location outline"
          style={[styles.tabBtn, activeTab === 'pharmacies' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            setActiveTab('pharmacies');
          }}
        >
          <Ionicons
            name="location-outline"
            size={16}
            color={activeTab === 'pharmacies' ? colors.primary : colors.mutedText}
          />
          <Text style={[styles.tabBtnText, { color: activeTab === 'pharmacies' ? colors.primary : colors.mutedText }]}>
            24/7 Stores ({pharmacyData?.pharmacies?.length ?? 0})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity testID="btn-alert-circle-outline" accessibilityLabel="alert circle outline"
          style={[styles.tabBtn, activeTab === 'customs' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            setActiveTab('customs');
          }}
        >
          <Ionicons
            name="alert-circle-outline"
            size={16}
            color={activeTab === 'customs' ? '#dc2626' : colors.mutedText}
          />
          <Text style={[styles.tabBtnText, { color: activeTab === 'customs' ? '#dc2626' : colors.mutedText }]}>
            Customs Rules
          </Text>
        </TouchableOpacity>
      </View>

      {/* Body */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedText }]}>
            Loading travel medicine database and 24/7 pharmacies...
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
              onRefresh={refreshPharmacyHub}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* Emergency Doctor Hotline Banner */}
          {pharmacyData?.emergencyDoctorHotline ? (
            <View style={[styles.hotlineBanner, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
              <Ionicons name="call-outline" size={18} color="#16a34a" />
              <View style={{ flex: 1 }}>
                <Text style={styles.hotlineTitle}>24/7 Tourist Doctor Line</Text>
                <Text style={styles.hotlineText}>{pharmacyData.emergencyDoctorHotline}</Text>
              </View>
            </View>
          ) : null}

          {/* TAB 1: MEDICINES */}
          {activeTab === 'medicines' && (
            <View>
              {/* Search Bar */}
              <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="search" size={18} color={colors.mutedText} />
                <TextInput
                  style={[styles.searchInput, { color: colors.heading }]}
                  placeholder="Search symptom or brand (e.g. Dolo, vomiting)..."
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={searchMeds}
                  returnKeyType="search"
                />
                {isSearching && <ActivityIndicator size="small" color={colors.primary} />}
                {searchQuery ? (
                  <TouchableOpacity testID="btn-close" accessibilityLabel="Close" onPress={() => searchMeds('')}>
                    <Ionicons name="close-circle" size={18} color={colors.mutedText} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Category Filter Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
              >
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.key;
                  return (
                    <TouchableOpacity testID="btn-pharmacy-guide-233" accessibilityLabel="pharmacy-guide action"
                      key={cat.key}
                      style={[
                        styles.catChip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.surface,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setSelectedCategory(cat.key);
                      }}
                    >
                      <Text
                        style={[
                          styles.catChipText,
                          { color: isSelected ? '#ffffff' : colors.heading },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Medicines List */}
              {displayedMedicines.length === 0 ? (
                <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="search-outline" size={32} color={colors.mutedText} />
                  <Text style={[styles.emptyTitle, { color: colors.heading }]}>No medicines found</Text>
                  <Text style={[styles.emptySubtitle, { color: colors.mutedText }]}>
                    Try searching for symptoms like "headache", "stomach", or brands like "Crocin".
                  </Text>
                </View>
              ) : (
                displayedMedicines.map((med) => (
                  <MedicineCard
                    key={med.id}
                    medicine={med}
                    onShowPharmacist={openShowPharmacist}
                  />
                ))
              )}
            </View>
          )}

          {/* TAB 2: 24/7 PHARMACIES */}
          {activeTab === 'pharmacies' && (
            <View>
              <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
                Verified 24-hour pharmacies & Boots dispensaries in {pharmacyData?.city || 'Bangkok'}.
              </Text>
              {pharmacyData?.pharmacies?.map((pharmacy) => (
                <PharmacyDirectoryCard
                  key={pharmacy.id}
                  pharmacy={pharmacy}
                />
              ))}
            </View>
          )}

          {/* TAB 3: CUSTOMS & RESTRICTED MEDICINES */}
          {activeTab === 'customs' && (
            <View>
              <View style={[styles.customsAlertBox, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
                <Ionicons name="warning" size={24} color="#dc2626" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.customsAlertTitle}>Strict Border Customs Drug Laws</Text>
                  <Text style={styles.customsAlertDesc}>
                    Certain standard over-the-counter medications at home are strictly classified as Category II Narcotics or Psychotropics abroad. Carrying them without permits risks severe legal penalties.
                  </Text>
                </View>
              </View>

              {pharmacyData?.controlledSubstances?.map((item, idx) => (
                <View
                  key={idx}
                  style={[styles.controlledCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={styles.controlledTop}>
                    <Text style={[styles.controlledMedName, { color: colors.heading }]}>
                      {item.medication}
                    </Text>
                    <View style={styles.controlledStatusBadge}>
                      <Text style={styles.controlledStatusText}>{item.status}</Text>
                    </View>
                  </View>
                  <Text style={[styles.controlledRule, { color: colors.mutedText }]}>
                    {item.rule}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Show Pharmacist Modal */}
      <ShowPharmacistModal
        visible={isShowPharmacistModalOpen}
        medicine={selectedMedicine}
        onClose={() => setIsShowPharmacistModalOpen(false)}
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
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  emergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  emergencyBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnText: {
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
  hotlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    gap: 10,
    marginBottom: 12,
  },
  hotlineTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
  },
  hotlineText: {
    fontSize: 11,
    color: '#166534',
    marginTop: 1,
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
    fontSize: 13,
    fontWeight: '600',
  },
  categoryScroll: {
    gap: 6,
    paddingBottom: 12,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginBottom: 10,
    lineHeight: 16,
  },
  customsAlertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 10,
    marginBottom: 14,
  },
  customsAlertTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#991b1b',
    marginBottom: 3,
  },
  customsAlertDesc: {
    fontSize: 11,
    lineHeight: 16,
    color: '#b91c1c',
  },
  controlledCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  controlledTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  controlledMedName: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  controlledStatusBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  controlledStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#dc2626',
  },
  controlledRule: {
    fontSize: 11,
    lineHeight: 16,
  },
});

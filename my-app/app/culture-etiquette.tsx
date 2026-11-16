import React, { useState } from 'react';
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
import { useCulture } from '../context/CultureContext';
import { SacredSiteDressCard } from '../components/SacredSiteDressCard';
import { CulturalEtiquetteCard } from '../components/CulturalEtiquetteCard';
import { DressCodeCheckerModal } from '../components/DressCodeCheckerModal';
import { MedicationCustomsSheet } from '../components/MedicationCustomsSheet';
import { DressCodeRule } from '../types';

const CATEGORIES = [
  { key: 'all', label: 'All Guidelines' },
  { key: 'Sacred_Sites', label: 'Sacred Sites' },
  { key: 'Monks_Royalty', label: 'Monks & Royalty' },
  { key: 'Social_Taboos', label: 'Social Taboos' },
  { key: 'Legal_Warnings', label: 'Legal Warnings' },
];

export default function CultureEtiquetteScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();

  const {
    cultureData,
    dressCodeRules,
    etiquetteGuidelines,
    medicationRules,
    selectedCategory,
    setSelectedCategory,
    isLoading,
    isRefreshing,
    isDressCheckerOpen,
    setIsDressCheckerOpen,
    isMedicationSheetOpen,
    setIsMedicationSheetOpen,
    refreshCultureHub,
  } = useCulture();

  const [activeSiteRule, setActiveSiteRule] = useState<DressCodeRule | null>(null);

  const handleInspectSite = (rule: DressCodeRule) => {
    setActiveSiteRule(rule);
    setIsDressCheckerOpen(true);
  };

  const filteredEtiquette = etiquetteGuidelines.filter((item) => {
    if (selectedCategory === 'all') return true;
    return item.category.toLowerCase() === selectedCategory.toLowerCase();
  });

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
            Cultural Decorum & Dress Codes
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
            Sacred Temple Attire & Local Customs
          </Text>
        </View>

        <TouchableOpacity testID="btn-shirt" accessibilityLabel="shirt"
          style={[styles.checkerQuickBtn, { backgroundColor: '#fef3c7' }]}
          onPress={() => {
            setActiveSiteRule(dressCodeRules[0] || null);
            setIsDressCheckerOpen(true);
          }}
        >
          <Ionicons name="shirt" size={15} color="#b45309" />
          <Text style={styles.checkerQuickText}>Outfit Check</Text>
        </TouchableOpacity>
      </View>

      {/* Main Body */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedText }]}>
            Loading destination etiquette & sacred site dress codes...
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
              onRefresh={refreshCultureHub}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* Category Filter Pills Strip */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsScroll}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.key;
              return (
                <TouchableOpacity testID="btn-culture-etiquette-140" accessibilityLabel="culture-etiquette action"
                  key={cat.key}
                  style={[
                    styles.catPill,
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
                      styles.catPillText,
                      { color: isSelected ? '#ffffff' : colors.heading },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Quick Customs & Medication Action Strip */}
          <TouchableOpacity testID="btn-medkit" accessibilityLabel="medkit"
            style={[styles.medicationBanner, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setIsMedicationSheetOpen(true);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.medicationLeft}>
              <Ionicons name="medkit" size={20} color="#1d4ed8" />
              <View style={{ flex: 1 }}>
                <Text style={styles.medicationTitle}>
                  Prescription Medication & Customs Prohibitions
                </Text>
                <Text style={styles.medicationSub}>
                  Special rules for ADHD pills, strong pain relief & strict anti-vaping laws.
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#1d4ed8" />
          </TouchableOpacity>

          {/* Sacred Sites & Temple Dress Codes Section */}
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="business" size={18} color={colors.primary} />
              <Text style={[styles.sectionHeading, { color: colors.heading }]}>
                Sacred Sites & Temple Gate Dress Codes
              </Text>
            </View>
            <Text style={[styles.sectionSub, { color: colors.mutedText }]}>
              Modesty requirements enforced by royal guards and temple security officers at entry gates.
            </Text>

            {dressCodeRules.map((rule) => (
              <SacredSiteDressCard
                key={rule.id}
                rule={rule}
                onCheckOutfit={handleInspectSite}
              />
            ))}
          </View>

          {/* Cultural Etiquette Guidelines Section */}
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="shield-checkmark" size={18} color="#059669" />
              <Text style={[styles.sectionHeading, { color: colors.heading }]}>
                Behavioral Decorum & Social Customs ({filteredEtiquette.length})
              </Text>
            </View>
            <Text style={[styles.sectionSub, { color: colors.mutedText }]}>
              Important rules to avoid offending monks, royal institutions, and religious devotees.
            </Text>

            {filteredEtiquette.map((item) => (
              <CulturalEtiquetteCard key={item.id} item={item} />
            ))}
          </View>

          {/* Local Tipping & Gratuity Norms Box */}
          {cultureData?.localTippingNorms ? (
            <View style={[styles.tippingBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.tippingHeader}>
                <Ionicons name="cash-outline" size={18} color="#059669" />
                <Text style={[styles.tippingTitle, { color: colors.heading }]}>
                  Dining & Tipping Etiquette
                </Text>
              </View>
              <Text style={[styles.tippingText, { color: colors.mutedText }]}>
                {cultureData.localTippingNorms}
              </Text>
            </View>
          ) : null}
        </ScrollView>
      )}

      {/* Dress Code Checker Modal */}
      <DressCodeCheckerModal
        visible={isDressCheckerOpen}
        onClose={() => setIsDressCheckerOpen(false)}
        siteName={activeSiteRule?.siteName}
        siteType={activeSiteRule?.siteType}
      />

      {/* Medication Customs Sheet */}
      <MedicationCustomsSheet
        rules={medicationRules}
        visible={isMedicationSheetOpen}
        onClose={() => setIsMedicationSheetOpen(false)}
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
  checkerQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  checkerQuickText: {
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
  pillsScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  medicationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 10,
  },
  medicationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  medicationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e40af',
  },
  medicationSub: {
    fontSize: 11,
    lineHeight: 15,
    color: '#3b82f6',
    marginTop: 1,
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
  tippingBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  tippingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  tippingTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  tippingText: {
    fontSize: 12,
    lineHeight: 17,
  },
});

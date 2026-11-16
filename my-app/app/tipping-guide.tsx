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
import { useTipping } from '../context/TippingContext';
import { TippingCategoryCard } from '../components/TippingCategoryCard';
import { TipCalculatorModal } from '../components/TipCalculatorModal';

export default function TippingGuideScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();

  const {
    guide,
    isLoading,
    isRefreshing,
    refreshGuide,
    openCalculatorForCategory,
    isCalculatorModalOpen,
    setIsCalculatorModalOpen,
  } = useTipping();

  const handleOpenGlobalCalc = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIsCalculatorModalOpen(true);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
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
            Tipping & Gratuity Etiquette
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
            {guide?.country || 'Destination'} &bull; Customs, Norms & Calculator
          </Text>
        </View>

        <TouchableOpacity testID="btn-calculator" accessibilityLabel="calculator"
          style={[styles.calcHeaderBtn, { backgroundColor: colors.primary }]}
          onPress={handleOpenGlobalCalc}
        >
          <Ionicons name="calculator" size={14} color="#ffffff" />
          <Text style={styles.calcHeaderBtnText}>SPLIT</Text>
        </TouchableOpacity>
      </View>

      {/* Body */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedText }]}>
            Loading destination tipping guide...
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
              onRefresh={refreshGuide}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* General Culture Card */}
          <View style={[styles.introCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.introHeader}>
              <Ionicons name="information-circle" size={18} color="#1d4ed8" />
              <Text style={[styles.introTitle, { color: colors.heading }]}>
                Tipping Culture in {guide?.country}
              </Text>
            </View>
            <Text style={[styles.introText, { color: colors.heading }]}>
              {guide?.generalTippingCulture}
            </Text>

            {/* Service Charge '++' explanation */}
            {guide?.taxAndServiceChargeNote ? (
              <View style={[styles.noteBox, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}>
                <Ionicons name="receipt-outline" size={16} color="#d97706" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.noteTitle}>The "++" Bill Rule</Text>
                  <Text style={styles.noteDesc}>{guide.taxAndServiceChargeNote}</Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Local Thank You Phrasecard */}
          {guide?.localThankYouPhrase ? (
            <View style={styles.thankYouCard}>
              <View style={styles.thankYouHeader}>
                <Ionicons name="chatbubbles" size={14} color="#38bdf8" />
                <Text style={styles.thankYouLabel}>SAY THANK YOU IN LOCAL LANGUAGE</Text>
              </View>
              <Text style={styles.thankYouNative}>{guide.localThankYouPhrase}</Text>
              <Text style={styles.thankYouPhonetic}>"{guide.localThankYouPhonetic}"</Text>
            </View>
          ) : null}

          {/* Quick Floating Action Callout */}
          <TouchableOpacity testID="btn-calculator" accessibilityLabel="calculator"
            style={[styles.calloutCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}
            onPress={handleOpenGlobalCalc}
            activeOpacity={0.85}
          >
            <View style={styles.calloutLeft}>
              <View style={styles.calloutIconBox}>
                <Ionicons name="calculator" size={20} color="#16a34a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.calloutTitle}>Split Restaurant Bill or Spa</Text>
                <Text style={styles.calloutDesc}>
                  Auto-adjusts for 10% service charges and calculates exact per-person share in {guide?.currencyCode}.
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#16a34a" />
          </TouchableOpacity>

          {/* Categories Title */}
          <Text style={[styles.sectionTitle, { color: colors.heading }]}>
            Customary Tipping by Service
          </Text>

          {/* Categories List */}
          {guide?.categories?.map((cat) => (
            <TippingCategoryCard
              key={cat.categoryKey}
              category={cat}
              currencySymbol={guide.currencySymbol}
              onOpenCalculator={openCalculatorForCategory}
            />
          ))}
        </ScrollView>
      )}

      {/* Tip Calculator Modal */}
      <TipCalculatorModal
        visible={isCalculatorModalOpen}
        onClose={() => setIsCalculatorModalOpen(false)}
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
  calcHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  calcHeaderBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
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
  introCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  introTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  introText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    gap: 8,
  },
  noteTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400e',
    marginBottom: 2,
  },
  noteDesc: {
    fontSize: 11,
    lineHeight: 15,
    color: '#b45309',
  },
  thankYouCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
  },
  thankYouHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  thankYouLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  thankYouNative: {
    fontSize: 16,
    fontWeight: '800',
    color: '#38bdf8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 4,
  },
  thankYouPhonetic: {
    fontSize: 12,
    color: '#cbd5e1',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  calloutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  calloutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    gap: 10,
  },
  calloutIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calloutTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803d',
  },
  calloutDesc: {
    fontSize: 11,
    color: '#166534',
    marginTop: 1,
    lineHeight: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 10,
  },
});

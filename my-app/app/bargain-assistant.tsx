import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useBargain } from '@/context/BargainContext';
import { CounterOfferCalculatorCard } from '@/components/CounterOfferCalculatorCard';
import { MarketDirectoryCard } from '@/components/MarketDirectoryCard';
import { VendorFlashcardModal } from '@/components/VendorFlashcardModal';
import { BargainSavingsLogModal } from '@/components/BargainSavingsLogModal';
import type { BargainPhraseItem } from '@/types';

type TabKey = 'calculator' | 'phrases' | 'markets' | 'etiquette';

export default function BargainAssistantScreen() {
  const router = useRouter();
  const colors = useColors();
  const {
    bargainData,
    loading: isLoading,
    refreshBargainData: refreshData,
    openFlashcard,
    totalSaved,
    savedLogs,
  } = useBargain();

  const [activeTab, setActiveTab] = useState<TabKey>('calculator');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSavingsModalOpen, setIsSavingsModalOpen] = useState<boolean>(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
  };

  const handleTabChange = (tab: TabKey) => {
    Haptics.selectionAsync().catch(() => {});
    setActiveTab(tab);
  };

  const handlePhrasePress = (phrase: BargainPhraseItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    openFlashcard(phrase);
  };

  const currencySymbol = bargainData?.currencySymbol || '฿';
  const cityName = bargainData?.city || 'Local Markets';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View
        style={[
          styles.headerBar,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity testID="btn-navigate"
          style={[styles.backBtn, { backgroundColor: colors.background }]}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            router.back();
          }}
          accessibilityRole="button"
          accessibilityLabel="Back to previous screen"
        >
          <Ionicons name="arrow-back" size={22} color={colors.heading} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerSuper, { color: colors.primary }]}>
            STREET SHOPPING COMPANION
          </Text>
          <Text style={[styles.headerTitle, { color: colors.heading }]}>
            {cityName} Night Markets 🏮
          </Text>
        </View>

        {/* Savings Wallet Trigger */}
        <TouchableOpacity testID="btn-wallet"
          style={[styles.walletBtn, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setIsSavingsModalOpen(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Open savings wallet"
        >
          <Ionicons name="wallet" size={16} color="#16a34a" />
          {totalSaved > 0 && (
            <Text style={styles.walletSavedText}>
              +{currencySymbol}{totalSaved}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Segmented Tab Navigation */}
      <View
        style={[
          styles.tabBar,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity testID="btn-calculator-outline"
          style={[styles.tabItem, activeTab === 'calculator' && styles.tabItemActive]}
          onPress={() => handleTabChange('calculator')}
          accessibilityRole="button"
          accessibilityLabel="Calculator tab"
        >
          <Ionicons
            name="calculator-outline"
            size={16}
            color={activeTab === 'calculator' ? colors.primary : colors.mutedText}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'calculator' ? colors.primary : colors.mutedText },
              activeTab === 'calculator' && styles.tabTextActive,
            ]}
          >
            Calculator
          </Text>
        </TouchableOpacity>

        <TouchableOpacity testID="btn-chatbubble-ellipses-outline"
          style={[styles.tabItem, activeTab === 'phrases' && styles.tabItemActive]}
          onPress={() => handleTabChange('phrases')}
          accessibilityRole="button"
          accessibilityLabel="Phrases tab"
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={16}
            color={activeTab === 'phrases' ? colors.primary : colors.mutedText}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'phrases' ? colors.primary : colors.mutedText },
              activeTab === 'phrases' && styles.tabTextActive,
            ]}
          >
            Phrases
          </Text>
        </TouchableOpacity>

        <TouchableOpacity testID="btn-trail-sign-outline"
          style={[styles.tabItem, activeTab === 'markets' && styles.tabItemActive]}
          onPress={() => handleTabChange('markets')}
          accessibilityRole="button"
          accessibilityLabel="Markets tab"
        >
          <Ionicons
            name="trail-sign-outline"
            size={16}
            color={activeTab === 'markets' ? colors.primary : colors.mutedText}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'markets' ? colors.primary : colors.mutedText },
              activeTab === 'markets' && styles.tabTextActive,
            ]}
          >
            Markets
          </Text>
        </TouchableOpacity>

        <TouchableOpacity testID="btn-shield-checkmark-outline"
          style={[styles.tabItem, activeTab === 'etiquette' && styles.tabItemActive]}
          onPress={() => handleTabChange('etiquette')}
          accessibilityRole="button"
          accessibilityLabel="Etiquette tab"
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={16}
            color={activeTab === 'etiquette' ? colors.primary : colors.mutedText}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'etiquette' ? colors.primary : colors.mutedText },
              activeTab === 'etiquette' && styles.tabTextActive,
            ]}
          >
            Etiquette
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Tab 1: Calculator */}
        {activeTab === 'calculator' && (
          <View>
            <CounterOfferCalculatorCard />

            {/* Quick Tips Box */}
            <View
              style={[
                styles.quickTipsBox,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.quickTipsHeader}>
                <Ionicons name="sparkles" size={18} color="#f59e0b" />
                <Text style={[styles.quickTipsTitle, { color: colors.heading }]}>
                  The 3 Golden Rules of Bazaar Bargaining
                </Text>
              </View>

              <View style={styles.ruleItem}>
                <Text style={styles.ruleNumber}>1</Text>
                <Text style={[styles.ruleText, { color: colors.heading }]}>
                  <Text style={{ fontWeight: '700' }}>Bundle for leverage: </Text>
                  Buying 2 or 3 items from the same vendor immediately unlocks a 25-35% discount.
                </Text>
              </View>

              <View style={styles.ruleItem}>
                <Text style={styles.ruleNumber}>2</Text>
                <Text style={[styles.ruleText, { color: colors.heading }]}>
                  <Text style={{ fontWeight: '700' }}>Carry small bills: </Text>
                  Negotiating down to {currencySymbol}150 and then handing over a {currencySymbol}1,000 note is considered poor etiquette.
                </Text>
              </View>

              <View style={styles.ruleItem}>
                <Text style={styles.ruleNumber}>3</Text>
                <Text style={[styles.ruleText, { color: colors.heading }]}>
                  <Text style={{ fontWeight: '700' }}>The polite walk-away: </Text>
                  If they hold firm at a higher price, bow or thank them smiling and walk slowly. In 70% of cases, they will call you back!
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Tab 2: Vendor Phrases */}
        {activeTab === 'phrases' && (
          <View>
            <View style={styles.phraseHeaderBox}>
              <Text style={[styles.sectionHeading, { color: colors.heading }]}>
                Polite Local Haggling Phrases 🗣️
              </Text>
              <Text style={[styles.sectionSubheading, { color: colors.mutedText }]}>
                Tap any phrase to open full-screen high-contrast flashcard to show the vendor.
              </Text>
            </View>

            {bargainData?.keyPhrases.map((phrase) => (
              <TouchableOpacity testID="btn-chatbubble-ellipses"
                key={phrase.phraseId}
                style={[
                  styles.phraseCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
                onPress={() => handlePhrasePress(phrase)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Show phrase ${phrase.englishText}`}
              >
                <View style={styles.phraseTopRow}>
                  <View style={[styles.phraseIconBox, { backgroundColor: '#f0fdf4' }]}>
                    <Ionicons name="chatbubble-ellipses" size={16} color="#16a34a" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.phraseEnglish, { color: colors.heading }]}>
                      {phrase.englishText}
                    </Text>
                    <Text style={[styles.phraseScript, { color: colors.primary }]}>
                      {phrase.localScript}
                    </Text>
                  </View>
                  <Ionicons name="phone-portrait-outline" size={18} color={colors.primary} />
                </View>

                <View
                  style={[
                    styles.phoneticContainer,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.phoneticLabel, { color: colors.mutedText }]}>
                    Pronounce:
                  </Text>
                  <Text style={[styles.phoneticValue, { color: colors.heading }]}>
                    "{phrase.phoneticPronunciation}"
                  </Text>
                </View>

                <Text style={[styles.contextText, { color: colors.mutedText }]}>
                  💡 {phrase.contextUsage}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Tab 3: Markets & Bazaars */}
        {activeTab === 'markets' && (
          <View>
            <View style={styles.phraseHeaderBox}>
              <Text style={[styles.sectionHeading, { color: colors.heading }]}>
                Top Street Markets & Bazaars 📍
              </Text>
              <Text style={[styles.sectionSubheading, { color: colors.mutedText }]}>
                Operating schedules, bargaining intensity, and insider pro-tips.
              </Text>
            </View>

            {(bargainData?.famousMarkets || bargainData?.markets || []).map((market) => (
              <MarketDirectoryCard key={market.id || (market as any).marketId} market={market} />
            ))}
          </View>
        )}

        {/* Tab 4: Etiquette & Culture */}
        {activeTab === 'etiquette' && (
          <View>
            <View style={styles.phraseHeaderBox}>
              <Text style={[styles.sectionHeading, { color: colors.heading }]}>
                Local Etiquette & Golden Guidelines 🤝
              </Text>
              <Text style={[styles.sectionSubheading, { color: colors.mutedText }]}>
                Bargaining is viewed as a lighthearted social interaction, not an argument.
              </Text>
            </View>

            {((bargainData as any)?.etiquetteTips || bargainData?.rules?.map((r) => `${r.title}: ${r.description}`) || []).map((tip: string, idx: number) => (
              <View
                key={idx}
                style={[
                  styles.etiquetteCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <View style={styles.etiquetteIconBox}>
                  <Ionicons name="checkmark-done-circle" size={20} color="#16a34a" />
                </View>
                <Text style={[styles.etiquetteText, { color: colors.heading }]}>
                  {tip}
                </Text>
              </View>
            ))}

            {/* When NOT to haggle */}
            <View style={[styles.warningBox, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
              <View style={styles.warningHeader}>
                <Ionicons name="alert-circle" size={18} color="#dc2626" />
                <Text style={styles.warningTitle}>When NOT to Bargain</Text>
              </View>
              <Text style={styles.warningText}>
                • Fresh street food & fruit stalls (prices are fixed and very affordable){'\n'}
                • Convenience stores (7-Eleven) and official shopping malls{'\n'}
                • Artisan goods clearly marked with printed price tags & 'No Bargaining' signage{'\n'}
                • If the amount in question is only a few pennies (10-20 Baht / Rupees)
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Flashcard Modal */}
      <VendorFlashcardModal />

      {/* Savings Log Modal */}
      <BargainSavingsLogModal
        visible={isSavingsModalOpen}
        onClose={() => setIsSavingsModalOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerSuper: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 1,
  },
  walletBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 44,
  },
  walletSavedText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    minHeight: 44,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#2563eb',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    fontWeight: '700',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  quickTipsBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 16,
  },
  quickTipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  quickTipsTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  ruleNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fef3c7',
    color: '#b45309',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 20,
  },
  ruleText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  phraseHeaderBox: {
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionSubheading: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
  phraseCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    minHeight: 44,
  },
  phraseTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  phraseIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phraseEnglish: {
    fontSize: 14,
    fontWeight: '700',
  },
  phraseScript: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  phoneticContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 8,
  },
  phoneticLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  phoneticValue: {
    fontSize: 12,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  contextText: {
    fontSize: 11,
    lineHeight: 16,
  },
  etiquetteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  etiquetteIconBox: {
    marginTop: 1,
  },
  etiquetteText: {
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  warningBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 10,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#dc2626',
  },
  warningText: {
    fontSize: 12,
    color: '#991b1b',
    lineHeight: 18,
  },
});

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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors, useIsDark } from '@/store/ThemeContext';
import { useExpeditionSummary } from '@/context/ExpeditionSummaryContext';
import { ExpeditionHeroCard } from '@/components/ExpeditionHeroCard';
import { TravelWrappedStoryCard } from '@/components/TravelWrappedStoryCard';
import { LoyaltyTierProgressCard } from '@/components/LoyaltyTierProgressCard';
import { RewardVoucherCard } from '@/components/RewardVoucherCard';
import { ExpeditionCertificateModal } from '@/components/ExpeditionCertificateModal';
import { ReviewBoostModal } from '@/components/ReviewBoostModal';

type TabKey = 'wrapped' | 'loyalty' | 'diploma';

export default function TravelWrappedScreen() {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDark();

  const {
    hubData,
    loading,
    error,
    refreshHubData,
    claimReward,
    submitReview,
    claimedVouchers,
    isStoryModalOpen,
    openStoryModal,
    closeStoryModal,
    isCertificateModalOpen,
    openCertificateModal,
    closeCertificateModal,
    isReviewModalOpen,
    openReviewModal,
    closeReviewModal,
    actionSuccessMessage,
    clearActionSuccessMessage,
  } = useExpeditionSummary();

  const [activeTab, setActiveTab] = useState<TabKey>('wrapped');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshHubData();
    setIsRefreshing(false);
  };

  const handleTabChange = (tab: TabKey) => {
    Haptics.selectionAsync().catch(() => {});
    setActiveTab(tab);
  };

  if (loading && !hubData) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedText }]}>
            Loading your Expedition Wrapped & VIP Rewards...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const wrapped = hubData?.wrapped;
  const loyalty = hubData?.loyalty;
  const certificate = hubData?.certificate;
  const rewards = hubData?.availableRewards || [];
  const currencySymbol = hubData?.currencySymbol || '฿';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Top Header */}
      <View
        style={[
          styles.headerBar,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.background }]}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            router.back();
          }}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="arrow-back" size={22} color={colors.heading} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerSuper, { color: colors.primary }]}>
            {wrapped?.year || '2026'} TRAVEL WRAPPED
          </Text>
          <Text style={[styles.headerTitle, { color: colors.heading }]}>
            Expedition Summary & VIP
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.certTriggerBtn, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            openCertificateModal();
          }}
          accessibilityRole="button"
          accessibilityLabel="View Honors Diploma"
        >
          <Ionicons name="ribbon" size={18} color="#D97706" />
        </TouchableOpacity>
      </View>

      {/* Success Alert Banner */}
      {actionSuccessMessage && (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={16} color="#059669" />
          <Text style={styles.successBannerText}>{actionSuccessMessage}</Text>
          <TouchableOpacity onPress={clearActionSuccessMessage}>
            <Ionicons name="close" size={16} color="#059669" />
          </TouchableOpacity>
        </View>
      )}

      {/* Segmented Tab Navigation */}
      <View
        style={[
          styles.tabBar,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'wrapped' && [styles.activeTabItem, { borderColor: colors.primary }],
          ]}
          onPress={() => handleTabChange('wrapped')}
        >
          <Ionicons
            name={activeTab === 'wrapped' ? 'sparkles' : 'sparkles-outline'}
            size={16}
            color={activeTab === 'wrapped' ? colors.primary : colors.mutedText}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'wrapped' ? colors.primary : colors.mutedText },
              activeTab === 'wrapped' && styles.activeTabText,
            ]}
          >
            Wrapped
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'loyalty' && [styles.activeTabItem, { borderColor: colors.primary }],
          ]}
          onPress={() => handleTabChange('loyalty')}
        >
          <Ionicons
            name={activeTab === 'loyalty' ? 'trophy' : 'trophy-outline'}
            size={16}
            color={activeTab === 'loyalty' ? colors.primary : colors.mutedText}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'loyalty' ? colors.primary : colors.mutedText },
              activeTab === 'loyalty' && styles.activeTabText,
            ]}
          >
            VIP Loyalty ({loyalty?.currentPoints.toLocaleString() || '0'} Pts)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'diploma' && [styles.activeTabItem, { borderColor: colors.primary }],
          ]}
          onPress={() => handleTabChange('diploma')}
        >
          <Ionicons
            name={activeTab === 'diploma' ? 'ribbon' : 'ribbon-outline'}
            size={16}
            color={activeTab === 'diploma' ? colors.primary : colors.mutedText}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'diploma' ? colors.primary : colors.mutedText },
              activeTab === 'diploma' && styles.activeTabText,
            ]}
          >
            Diploma
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Top Hero Card is displayed across tabs */}
        {wrapped && (
          <ExpeditionHeroCard
            stats={wrapped}
            currencySymbol={currencySymbol}
            onPlayStories={openStoryModal}
            onOpenCertificate={openCertificateModal}
            onOpenReview={openReviewModal}
          />
        )}

        {/* TAB 1: WRAPPED DEEP DIVE */}
        {activeTab === 'wrapped' && wrapped && (
          <View style={styles.tabContent}>
            {/* Highlights Breakdown */}
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="compass" size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.heading }]}>
                  Expedition Milestones
                </Text>
              </View>

              <View style={styles.milestoneGrid}>
                <View style={styles.milestoneItem}>
                  <Text style={[styles.milestoneValue, { color: colors.primary }]}>
                    {wrapped.countriesVisited}
                  </Text>
                  <Text style={[styles.milestoneLabel, { color: colors.mutedText }]}>
                    Countries Visited
                  </Text>
                </View>

                <View style={styles.milestoneItem}>
                  <Text style={[styles.milestoneValue, { color: colors.primary }]}>
                    {wrapped.citiesExplored}
                  </Text>
                  <Text style={[styles.milestoneLabel, { color: colors.mutedText }]}>
                    Cities Explored
                  </Text>
                </View>

                <View style={styles.milestoneItem}>
                  <Text style={[styles.milestoneValue, { color: colors.primary }]}>
                    {wrapped.toursCompleted}
                  </Text>
                  <Text style={[styles.milestoneLabel, { color: colors.mutedText }]}>
                    Certified Tours
                  </Text>
                </View>

                <View style={styles.milestoneItem}>
                  <Text style={[styles.milestoneValue, { color: colors.primary }]}>
                    {wrapped.audioStoriesListenedMinutes}m
                  </Text>
                  <Text style={[styles.milestoneLabel, { color: colors.mutedText }]}>
                    Audio Guides
                  </Text>
                </View>
              </View>

              {/* Landmarks Stamped */}
              <View style={styles.subSection}>
                <Text style={[styles.subSectionTitle, { color: colors.heading }]}>
                  Stamped Wonders & Landmarks
                </Text>
                <View style={styles.landmarksListContainer}>
                  {wrapped.topLandmarksVisited.map((lm, idx) => (
                    <View key={idx} style={styles.landmarkPill}>
                      <Ionicons name="location" size={14} color="#EA580C" />
                      <Text style={[styles.landmarkText, { color: colors.text }]}>{lm}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Unlocked Badges */}
              <View style={styles.subSection}>
                <Text style={[styles.subSectionTitle, { color: colors.heading }]}>
                  Badges of Honor
                </Text>
                <View style={styles.badgesRow}>
                  {wrapped.unlockedBadges.map((badge, idx) => (
                    <View key={idx} style={styles.badgePill}>
                      <Ionicons name="ribbon-outline" size={14} color="#D97706" />
                      <Text style={styles.badgePillText}>{badge}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Financial Protection Shield Card */}
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.sectionHeaderRow}>
                <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                <Text style={[styles.sectionTitle, { color: colors.heading }]}>
                  Financial Protection Shield
                </Text>
              </View>
              <Text style={[styles.sectionDesc, { color: colors.mutedText }]}>
                Through active street market bargaining and digital customs VAT refunds, you shielded funds while exploring:
              </Text>
              <View style={styles.savingsRow}>
                <View style={styles.savingsBox}>
                  <Text style={styles.savingsAmount}>
                    {currencySymbol}
                    {wrapped.totalBargainingSavings.toLocaleString()}
                  </Text>
                  <Text style={[styles.savingsLabel, { color: colors.mutedText }]}>
                    Bargained & Saved
                  </Text>
                </View>
                <View style={styles.savingsBox}>
                  <Text style={styles.savingsAmount}>
                    {currencySymbol}
                    {wrapped.totalVatRefundClaimed.toLocaleString()}
                  </Text>
                  <Text style={[styles.savingsLabel, { color: colors.mutedText }]}>
                    Tax Free Reclaimed
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* TAB 2: VIP LOYALTY CLUB & REWARDS */}
        {activeTab === 'loyalty' && loyalty && (
          <View style={styles.tabContent}>
            <LoyaltyTierProgressCard loyalty={loyalty} onOpenReview={openReviewModal} />

            <View style={styles.rewardsHeaderRow}>
              <Text style={[styles.rewardsSectionTitle, { color: colors.heading }]}>
                Exclusive Loyalty Vouchers & Rewards
              </Text>
              <Text style={[styles.rewardsSubtitle, { color: colors.mutedText }]}>
                Redeem your points for instant discount codes and VIP passes
              </Text>
            </View>

            {rewards.map((voucher) => (
              <RewardVoucherCard
                key={voucher.voucherId}
                voucher={voucher}
                userPoints={loyalty.currentPoints}
                isClaimed={voucher.isClaimed || !!claimedVouchers[voucher.voucherCode.toUpperCase()]}
                onClaim={async (code, cost) => {
                  await claimReward(code, cost);
                }}
              />
            ))}
          </View>
        )}

        {/* TAB 3: HONORS DIPLOMA */}
        {activeTab === 'diploma' && certificate && (
          <View style={styles.tabContent}>
            <View style={[styles.diplomaPreviewCard, { backgroundColor: colors.surface, borderColor: '#D4AF37' }]}>
              <View style={styles.diplomaSealTop}>
                <Ionicons name="ribbon" size={40} color="#D4AF37" />
              </View>
              <Text style={styles.diplomaTitle}>{certificate.title}</Text>
              <Text style={[styles.diplomaRecipient, { color: colors.heading }]}>
                Conferred to: {certificate.recipientName}
              </Text>
              <Text style={[styles.diplomaCitation, { color: colors.mutedText }]}>
                "{certificate.citation}"
              </Text>

              <TouchableOpacity
                style={styles.openDiplomaBtn}
                onPress={openCertificateModal}
                activeOpacity={0.85}
              >
                <Ionicons name="expand-outline" size={18} color="#FFFFFF" />
                <Text style={styles.openDiplomaBtnText}>View Full Certificate of Completion</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      {wrapped && (
        <TravelWrappedStoryCard
          visible={isStoryModalOpen}
          onClose={closeStoryModal}
          stats={wrapped}
          currencySymbol={currencySymbol}
        />
      )}

      {certificate && (
        <ExpeditionCertificateModal
          visible={isCertificateModalOpen}
          onClose={closeCertificateModal}
          certificate={certificate}
        />
      )}

      <ReviewBoostModal
        visible={isReviewModalOpen}
        onClose={closeReviewModal}
        onSubmit={async (tourId, rating, reviewText, favoriteMoment) => {
          await submitReview(tourId, rating, reviewText, favoriteMoment);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  headerBar: {
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
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerSuper: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  certTriggerBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#A7F3D0',
  },
  successBannerText: {
    flex: 1,
    color: '#065F46',
    fontSize: 12,
    fontWeight: '700',
    marginHorizontal: 8,
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
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  activeTabItem: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeTabText: {
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  tabContent: {
    paddingTop: 4,
  },
  sectionCard: {
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  milestoneGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: 12,
    borderRadius: 14,
  },
  milestoneItem: {
    alignItems: 'center',
  },
  milestoneValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  milestoneLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  subSection: {
    marginTop: 10,
    gap: 8,
  },
  subSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  landmarksListContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  landmarkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(234, 88, 12, 0.08)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  landmarkText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  badgePillText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '700',
  },
  savingsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  savingsBox: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
  },
  savingsAmount: {
    color: '#047857',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 2,
  },
  savingsLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  rewardsHeaderRow: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  rewardsSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  rewardsSubtitle: {
    fontSize: 12,
  },
  diplomaPreviewCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  diplomaSealTop: {
    marginBottom: 12,
  },
  diplomaTitle: {
    color: '#B45309',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  diplomaRecipient: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  diplomaCitation: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  openDiplomaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#B45309',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  openDiplomaBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});

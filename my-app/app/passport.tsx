import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSite } from '@/store/SiteConfigContext';
import { useColors } from '@/store/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { usePassport } from '../context/PassportContext';
import { ExpeditionStamp, MilestoneChallenge } from '../types';
import { StampModal } from '../components/StampModal';

type PassportTab = 'stamps' | 'challenges' | 'perks';

export default function PassportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { siteName } = useSite();
  const colors = useColors();
  const { user } = useAuth();

  const {
    passport,
    isLoading,
    unlockedStampsCount,
    totalStampsCount,
    completedChallengesCount,
    totalChallengesCount,
    claimChallengeReward,
    generateShareSummary,
  } = usePassport();

  const [activeTab, setActiveTab] = useState<PassportTab>('stamps');
  const [selectedStamp, setSelectedStamp] = useState<ExpeditionStamp | null>(null);

  const handleSharePassport = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    const summary = generateShareSummary();
    const encoded = encodeURIComponent(summary);
    const whatsappUrl = `whatsapp://send?text=${encoded}`;

    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
        return;
      }
    } catch {}

    Share.share({
      title: `${siteName} Expedition Passport`,
      message: summary,
    });
  };

  const handleClaimChallenge = async (challenge: MilestoneChallenge) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    await claimChallengeReward(challenge.id);
  };

  const travelerName = user?.name || passport?.holderName || 'Guest Explorer';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 12),
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity testID="btn-navigate"
            style={[styles.backBtn, { borderColor: colors.border }]}
            onPress={() => {
              try {
                Haptics.selectionAsync();
              } catch {}
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/bookings');
              }
            }}
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={20} color={colors.heading} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: colors.heading }]}>Expedition Passport</Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
              {unlockedStampsCount} of {totalStampsCount} Seals Collected • {siteName}
            </Text>
          </View>

          <TouchableOpacity testID="btn-logo-whatsapp"
            style={[styles.shareHeaderBtn, { backgroundColor: '#25D366' }]}
            onPress={handleSharePassport}
            accessibilityLabel="Share Passport via WhatsApp"
          >
            <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Tab Segment Controls */}
        <View style={[styles.segmentContainer, { backgroundColor: colors.background }]}>
          <TouchableOpacity testID="btn-ribbon-outline" accessibilityLabel="ribbon outline"
            style={[
              styles.segmentTab,
              activeTab === 'stamps' && [styles.segmentTabActive, { backgroundColor: colors.surface }],
            ]}
            onPress={() => {
              try {
                Haptics.selectionAsync();
              } catch {}
              setActiveTab('stamps');
            }}
          >
            <Ionicons
              name="ribbon-outline"
              size={15}
              color={activeTab === 'stamps' ? colors.primary : colors.mutedText}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.segmentTabText,
                { color: activeTab === 'stamps' ? colors.primary : colors.mutedText },
              ]}
            >
              Seals ({unlockedStampsCount}/{totalStampsCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity testID="btn-trophy-outline" accessibilityLabel="trophy outline"
            style={[
              styles.segmentTab,
              activeTab === 'challenges' && [styles.segmentTabActive, { backgroundColor: colors.surface }],
            ]}
            onPress={() => {
              try {
                Haptics.selectionAsync();
              } catch {}
              setActiveTab('challenges');
            }}
          >
            <Ionicons
              name="trophy-outline"
              size={15}
              color={activeTab === 'challenges' ? colors.primary : colors.mutedText}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.segmentTabText,
                { color: activeTab === 'challenges' ? colors.primary : colors.mutedText },
              ]}
            >
              Challenges ({completedChallengesCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity testID="btn-sparkles-outline" accessibilityLabel="sparkles outline"
            style={[
              styles.segmentTab,
              activeTab === 'perks' && [styles.segmentTabActive, { backgroundColor: colors.surface }],
            ]}
            onPress={() => {
              try {
                Haptics.selectionAsync();
              } catch {}
              setActiveTab('perks');
            }}
          >
            <Ionicons
              name="sparkles-outline"
              size={15}
              color={activeTab === 'perks' ? colors.primary : colors.mutedText}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.segmentTabText,
                { color: activeTab === 'perks' ? colors.primary : colors.mutedText },
              ]}
            >
              VIP Perks
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={[styles.mainScroll, { paddingBottom: Math.max(insets.bottom, 24) + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedText }]}>Retrieving expedition passport...</Text>
          </View>
        ) : passport ? (
          <>
            {/* ─── Official Digital Passport Identity Card ─── */}
            <View style={[styles.passportIdCard, { backgroundColor: '#1E293B', borderColor: '#334155' }]}>
              {/* Crest Watermark Header */}
              <View style={styles.cardHeaderRow}>
                <View style={styles.crestWrap}>
                  <Ionicons name="shield-checkmark" size={20} color="#F59E0B" style={{ marginRight: 6 }} />
                  <Text style={styles.cardBrandTitle} numberOfLines={1}>
                    {passport.brandCrestTitle.toUpperCase()}
                  </Text>
                </View>

                <View style={[styles.tierPill, { backgroundColor: `${passport.tier.tierBadgeColor}30` }]}>
                  <Text style={[styles.tierPillText, { color: passport.tier.tierBadgeColor }]}>
                    {passport.tier.tierName.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Identity Details */}
              <View style={styles.identityRow}>
                <View style={styles.avatarBox}>
                  <Ionicons name="person" size={28} color="#94A3B8" />
                </View>

                <View style={styles.idInfo}>
                  <Text style={styles.travelerNameText}>{travelerName}</Text>
                  <Text style={styles.passportNumText}>PASSPORT NO: {passport.passportNumber}</Text>
                  <Text style={styles.issuedDateText}>ISSUED: {passport.issuedDate} • CITIZEN OF DISCOVERY</Text>
                </View>
              </View>

              {/* XP Progression Bar */}
              <View style={styles.xpProgressContainer}>
                <View style={styles.xpLabelRow}>
                  <Text style={styles.xpLabel}>LOYALTY XP PROGRESS</Text>
                  <Text style={styles.xpValue}>
                    {passport.tier.currentXp} / {passport.tier.nextTierXp} XP ({passport.tier.progressPercent}%)
                  </Text>
                </View>
                <View style={styles.xpTrack}>
                  <View style={[styles.xpFill, { width: `${passport.tier.progressPercent}%`, backgroundColor: passport.tier.tierBadgeColor }]} />
                </View>
              </View>
            </View>

            {/* TAB 1: STAMPS COLLECTION */}
            {activeTab === 'stamps' && (
              <View>
                <View style={styles.sectionHeader}>
                  <Ionicons name="ribbon" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[styles.sectionTitle, { color: colors.heading }]}>
                    Destination Expedition Stamps ({unlockedStampsCount}/{totalStampsCount})
                  </Text>
                </View>
                <Text style={[styles.sectionSub, { color: colors.mutedText }]}>
                  Each official destination seal certifies your journey. Tap any stamp to inspect coordinates and historical significance.
                </Text>

                <View style={styles.stampsGrid}>
                  {passport.stamps.map((stamp) => (
                    <TouchableOpacity testID="btn-passport-285" accessibilityLabel="passport action"
                      key={stamp.id}
                      style={[
                        styles.stampCard,
                        {
                          backgroundColor: colors.surface,
                          borderColor: stamp.unlocked ? stamp.colorHex : colors.border,
                          borderWidth: stamp.unlocked ? 2 : 1,
                        },
                      ]}
                      onPress={() => {
                        try {
                          Haptics.selectionAsync();
                        } catch {}
                        setSelectedStamp(stamp);
                      }}
                      activeOpacity={0.8}
                    >
                      {/* Stamp Seal Graphic */}
                      <View
                        style={[
                          styles.stampRingPreview,
                          {
                            borderColor: stamp.unlocked ? stamp.colorHex : colors.border,
                            backgroundColor: stamp.unlocked ? `${stamp.colorHex}15` : `${colors.border}15`,
                            borderRadius: stamp.stampShape === 'circle' ? 36 : stamp.stampShape === 'oval' ? 24 : 12,
                            transform: [{ rotate: stamp.unlocked ? '-3deg' : '0deg' }],
                          },
                        ]}
                      >
                        <Ionicons
                          name={stamp.iconName as keyof typeof Ionicons.glyphMap}
                          size={24}
                          color={stamp.unlocked ? stamp.colorHex : colors.mutedText}
                        />
                        {stamp.unlocked && (
                          <View style={[styles.stampedDot, { backgroundColor: stamp.colorHex }]} />
                        )}
                      </View>

                      <Text style={[styles.stampCardTitle, { color: colors.heading }]} numberOfLines={2}>
                        {stamp.title}
                      </Text>

                      <Text style={[styles.stampCardDest, { color: colors.mutedText }]} numberOfLines={1}>
                        {stamp.destination}
                      </Text>

                      <View
                        style={[
                          styles.stampStatusBadge,
                          { backgroundColor: stamp.unlocked ? '#10B98115' : `${colors.primary}12` },
                        ]}
                      >
                        <Text
                          style={[
                            styles.stampStatusText,
                            { color: stamp.unlocked ? '#10B981' : colors.primary },
                          ]}
                        >
                          {stamp.unlocked ? 'COLLECTED' : `+${stamp.xpReward} XP`}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* TAB 2: MILESTONE CHALLENGES */}
            {activeTab === 'challenges' && (
              <View>
                <View style={styles.sectionHeader}>
                  <Ionicons name="trophy" size={18} color="#F59E0B" style={{ marginRight: 8 }} />
                  <Text style={[styles.sectionTitle, { color: colors.heading }]}>
                    Gamified Milestone Challenges ({completedChallengesCount}/{totalChallengesCount})
                  </Text>
                </View>
                <Text style={[styles.sectionSub, { color: colors.mutedText }]}>
                  Complete app and in-trip challenges to unlock bonus loyalty XP and level up your passport tier.
                </Text>

                <View style={styles.challengesList}>
                  {passport.challenges.map((ch) => {
                    const isReadyToClaim = ch.currentCount >= ch.targetCount && !ch.isCompleted;

                    return (
                      <View
                        key={ch.id}
                        style={[styles.challengeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      >
                        <View style={[styles.challengeIconBox, { backgroundColor: `${colors.primary}15` }]}>
                          <Ionicons
                            name={ch.iconName as keyof typeof Ionicons.glyphMap}
                            size={22}
                            color={colors.primary}
                          />
                        </View>

                        <View style={styles.challengeInfo}>
                          <View style={styles.challengeTitleRow}>
                            <Text style={[styles.challengeTitle, { color: colors.heading }]}>{ch.title}</Text>
                            <View style={[styles.xpRewardPill, { backgroundColor: '#F59E0B20' }]}>
                              <Text style={styles.xpRewardText}>+{ch.xpReward} XP</Text>
                            </View>
                          </View>

                          <Text style={[styles.challengeDesc, { color: colors.text }]}>{ch.description}</Text>

                          {/* Progress */}
                          <View style={styles.challengeProgressRow}>
                            <View style={[styles.challengeTrack, { backgroundColor: `${colors.border}60` }]}>
                              <View
                                style={[
                                  styles.challengeFill,
                                  {
                                    width: `${Math.min(100, (ch.currentCount / ch.targetCount) * 100)}%`,
                                    backgroundColor: ch.isCompleted ? '#10B981' : colors.primary,
                                  },
                                ]}
                              />
                            </View>
                            <Text style={[styles.challengeCountText, { color: colors.mutedText }]}>
                              {ch.currentCount} / {ch.targetCount}
                            </Text>
                          </View>
                        </View>

                        {/* Claim or Status Button */}
                        {ch.isCompleted ? (
                          <View style={styles.completedBadge}>
                            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                          </View>
                        ) : isReadyToClaim ? (
                          <TouchableOpacity testID="btn-claim" accessibilityLabel="Claim"
                            style={[styles.claimBtn, { backgroundColor: colors.primary }]}
                            onPress={() => handleClaimChallenge(ch)}
                          >
                            <Text style={styles.claimBtnText}>Claim</Text>
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.inProgressBadge}>
                            <Ionicons name="hourglass-outline" size={18} color={colors.mutedText} />
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* TAB 3: VIP TIER PERKS */}
            {activeTab === 'perks' && (
              <View>
                <View style={styles.sectionHeader}>
                  <Ionicons name="sparkles" size={18} color="#8B5CF6" style={{ marginRight: 8 }} />
                  <Text style={[styles.sectionTitle, { color: colors.heading }]}>
                    Active Tier Privileges ({passport.tier.tierName})
                  </Text>
                </View>

                <View style={[styles.perksCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {passport.tier.perks.map((perk, index) => (
                    <View key={index} style={[styles.perkRow, { borderBottomColor: `${colors.border}40` }]}>
                      <View style={[styles.perkCheckCircle, { backgroundColor: `${passport.tier.tierBadgeColor}18` }]}>
                        <Ionicons name="checkmark" size={16} color={passport.tier.tierBadgeColor} />
                      </View>
                      <Text style={[styles.perkText, { color: colors.heading }]}>{perk}</Text>
                    </View>
                  ))}
                </View>

                {/* Tier Road Map */}
                <View style={[styles.roadMapCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.roadMapTitle, { color: colors.heading }]}>Expedition Tier Roadmap</Text>

                  <View style={styles.roadMapItem}>
                    <View style={[styles.roadDot, { backgroundColor: '#94A3B8' }]} />
                    <View style={styles.roadInfo}>
                      <Text style={[styles.roadTierName, { color: colors.heading }]}>Bronze Explorer (0 - 999 XP)</Text>
                      <Text style={[styles.roadTierDesc, { color: colors.mutedText }]}>
                        Standard loyalty benefits, E-Ticket vault storage, offline audio player.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.roadMapItem}>
                    <View style={[styles.roadDot, { backgroundColor: '#D97706' }]} />
                    <View style={styles.roadInfo}>
                      <Text style={[styles.roadTierName, { color: colors.heading }]}>Silver Adventurer (1,000 - 2,499 XP)</Text>
                      <Text style={[styles.roadTierDesc, { color: colors.mutedText }]}>
                        5% instant tour discounts, priority concierge queue, VIP darshan passes.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.roadMapItem}>
                    <View style={[styles.roadDot, { backgroundColor: '#F59E0B' }]} />
                    <View style={styles.roadInfo}>
                      <Text style={[styles.roadTierName, { color: colors.heading }]}>Gold Globetrotter (2,500 - 4,499 XP)</Text>
                      <Text style={[styles.roadTierDesc, { color: colors.mutedText }]}>
                        7% instant booking discounts, free snorkel/quad upgrades, flexible cancellations.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.roadMapItem}>
                    <View style={[styles.roadDot, { backgroundColor: '#8B5CF6' }]} />
                    <View style={styles.roadInfo}>
                      <Text style={[styles.roadTierName, { color: colors.heading }]}>Platinum VIP Pioneer (4,500+ XP)</Text>
                      <Text style={[styles.roadTierDesc, { color: colors.mutedText }]}>
                        10% elite discounts, dedicated personal concierge line, free airport transfers.
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </>
        ) : null}
      </ScrollView>

      {/* Stamp Detail Modal */}
      <StampModal
        stamp={selectedStamp}
        visible={!!selectedStamp}
        onClose={() => setSelectedStamp(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  shareHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
  },
  segmentTabActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  segmentTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  mainScroll: {
    padding: 16,
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 13,
    marginTop: 10,
  },
  passportIdCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  crestWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  cardBrandTitle: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  tierPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tierPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1.5,
    borderColor: '#475569',
  },
  idInfo: {
    flex: 1,
  },
  travelerNameText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  passportNumText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  issuedDateText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
  xpProgressContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#334155',
    paddingTop: 12,
  },
  xpLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  xpLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  xpValue: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
  },
  xpTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#334155',
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionSub: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  stampsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  stampCard: {
    width: '48%',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  stampRingPreview: {
    width: 72,
    height: 72,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  stampedDot: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stampCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 3,
    minHeight: 32,
  },
  stampCardDest: {
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 8,
  },
  stampStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  stampStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  challengesList: {
    flexDirection: 'column',
    gap: 10,
  },
  challengeCard: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  challengeIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  challengeInfo: {
    flex: 1,
    marginRight: 8,
  },
  challengeTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  challengeTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginRight: 6,
  },
  xpRewardPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  xpRewardText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '800',
  },
  challengeDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 8,
  },
  challengeProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  challengeTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  challengeFill: {
    height: '100%',
    borderRadius: 3,
  },
  challengeCountText: {
    fontSize: 10,
    fontWeight: '600',
  },
  completedBadge: {
    padding: 6,
  },
  claimBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  claimBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  inProgressBadge: {
    padding: 6,
  },
  perksCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  perkCheckCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  perkText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  roadMapCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  roadMapTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 14,
  },
  roadMapItem: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  roadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    marginTop: 3,
  },
  roadInfo: {
    flex: 1,
  },
  roadTierName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  roadTierDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
});

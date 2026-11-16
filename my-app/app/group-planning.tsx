import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Linking,
  Platform,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useSite } from '@/store/SiteConfigContext';
import { useGroupTrip, GroupTab } from '../context/GroupTripContext';
import { GroupPollCard } from '../components/GroupPollCard';
import { GroupMember, GroupGearItem, DietarySummaryItem } from '../types';
import { FeatureGuard } from '@/components/common/FeatureGuard';

function GroupPlanningContent() {
  const router = useRouter();
  const colors = useColors();
  const { siteId } = useSite();
  const {
    groupTrip,
    isLoading,
    isRefreshing,
    activeTab,
    setActiveTab,
    userVotedOptions,
    packedGearIds,
    currentUserRsvp,
    refreshGroupTrip,
    voteOnPoll,
    toggleGearPacked,
    addNewGearItem,
    sharePartyInvite,
    updateUserRsvp,
  } = useGroupTrip();

  // Add Gear Modal State
  const [isAddGearModalVisible, setIsAddGearModalVisible] = useState(false);
  const [newGearTitle, setNewGearTitle] = useState('');
  const [newGearCategory, setNewGearCategory] = useState('General');
  const [newGearAssignee, setNewGearAssignee] = useState('');

  const copyInviteCode = async () => {
    if (!groupTrip?.inviteCode) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await Share.share({
      title: `Party Code: ${groupTrip.inviteCode}`,
      message: `Join our expedition squad for "${groupTrip.groupName}"!\nParty Invite Code: ${groupTrip.inviteCode}\nLink: ${groupTrip.shareableInviteUrl || 'https://toursapp.travel/join?code=' + groupTrip.inviteCode}`,
    });
  };

  const handleCallMember = (phone: string, name: string) => {
    if (!phone) {
      Alert.alert('Contact', `No phone number on file for ${name}.`);
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Error', 'Unable to initiate phone call.');
    });
  };

  const handleAddGearSubmit = async () => {
    if (!newGearTitle.trim()) {
      Alert.alert('Required', 'Please enter a gear or checklist item name.');
      return;
    }
    const success = await addNewGearItem(
      newGearTitle.trim(),
      newGearCategory,
      newGearAssignee.trim() || 'Unassigned'
    );
    if (success) {
      setNewGearTitle('');
      setNewGearAssignee('');
      setIsAddGearModalVisible(false);
    }
  };

  const gearCategories = [
    'General',
    'Medical/Safety',
    'Electronics',
    'Snacks & Food',
    'Religious/Puja',
    'Documentation',
  ];

  const handleBack = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/bookings');
    }
  };

  if (isLoading && !groupTrip) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.headerBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity testID="btn-navigate" style={styles.backBtn} onPress={handleBack} accessibilityLabel="Back" accessibilityRole="button">
            <Ionicons name="chevron-back" size={24} color={colors.heading} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: colors.heading }]} numberOfLines={1}>
              Group Expedition Hub
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
              Connecting...
            </Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
        <View style={[styles.centered, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedText }]}>
            Loading expedition group hub...
          </Text>
        </View>
      </View>
    );
  }

  if (!groupTrip) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.headerBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity testID="btn-navigate" style={styles.backBtn} onPress={handleBack} accessibilityLabel="Back" accessibilityRole="button">
            <Ionicons name="chevron-back" size={24} color={colors.heading} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={[styles.headerTitle, { color: colors.heading }]} numberOfLines={1}>
              Group Expedition Hub
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
              Squad Planning
            </Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
        <View style={[styles.centered, { backgroundColor: colors.background }]}>
          <Ionicons name="people-outline" size={54} color={colors.mutedText} />
          <Text style={[styles.noGroupTitle, { color: colors.heading }]}>
            No Active Group Trip
          </Text>
          <Text style={[styles.noGroupSubtitle, { color: colors.mutedText }]}>
            Create or join a group travel party to plan together with co-travelers.
          </Text>
          <TouchableOpacity testID="btn-retry-connection" accessibilityLabel="Retry Connection"
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={refreshGroupTrip}
          >
            <Text style={styles.retryBtnText}>Retry Connection</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="btn-return-to-reservation" accessibilityLabel="Return to Reservation"
            style={[styles.retryBtn, { backgroundColor: `${colors.primary}18`, marginTop: 10 }]}
            onPress={handleBack}
          >
            <Text style={[styles.retryBtnText, { color: colors.primary }]}>Return to Reservation</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const packedCount = groupTrip.gearItems.filter(
    (g) => g.isPacked || packedGearIds.includes(g.itemId)
  ).length;
  const totalGearCount = groupTrip.gearItems.length;
  const gearPackingPercent =
    totalGearCount > 0 ? Math.round((packedCount / totalGearCount) * 100) : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header Bar */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity testID="btn-navigate"
          style={styles.backBtn}
          onPress={handleBack}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={24} color={colors.heading} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.heading }]} numberOfLines={1}>
            Group Expedition Hub
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
            {groupTrip.members.length} Co-Travelers Party
          </Text>
        </View>

        <TouchableOpacity testID="btn-share"
          style={[styles.shareHeaderBtn, { backgroundColor: colors.primary }]}
          onPress={sharePartyInvite}
          accessibilityLabel="Share invite"
          accessibilityRole="button"
        >
          <Ionicons name="share-social-outline" size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshGroupTrip}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Hero Card */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.heroBadge}>
              <Ionicons name="airplane" size={12} color={colors.primary} />
              <Text style={[styles.heroBadgeText, { color: colors.primary }]}>
                EXPEDITION SQUAD
              </Text>
            </View>

            <TouchableOpacity testID="btn-copy-outline" accessibilityLabel="copy outline"
              style={[styles.codeBadge, { backgroundColor: `${colors.primary}15` }]}
              onPress={copyInviteCode}
            >
              <Ionicons name="copy-outline" size={12} color={colors.primary} />
              <Text style={[styles.codeBadgeText, { color: colors.primary }]}>
                {groupTrip.inviteCode}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.tripTitle, { color: colors.heading }]}>
            {groupTrip.groupName}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color={colors.mutedText} />
              <Text style={[styles.metaText, { color: colors.mutedText }]}>
                {groupTrip.destination}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={colors.mutedText} />
              <Text style={[styles.metaText, { color: colors.mutedText }]}>
                {groupTrip.travelDates}
              </Text>
            </View>
          </View>

          {/* Cost Estimates */}
          <View
            style={[
              styles.costContainer,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.costItem}>
              <Text style={[styles.costLabel, { color: colors.mutedText }]}>
                Total Estimated
              </Text>
              <Text style={[styles.costValue, { color: colors.heading }]}>
                {groupTrip.totalEstimatedCost}
              </Text>
            </View>

            <View style={[styles.costDivider, { backgroundColor: colors.border }]} />

            <View style={styles.costItem}>
              <Text style={[styles.costLabel, { color: colors.mutedText }]}>
                Per Member
              </Text>
              <Text style={[styles.costValue, { color: colors.primary }]}>
                {groupTrip.perPersonEstimatedCost}
              </Text>
            </View>
          </View>

          {/* RSVP Status Selector */}
          <View style={styles.rsvpRow}>
            <Text style={[styles.rsvpTitle, { color: colors.heading }]}>
              Your RSVP:
            </Text>
            {(['Confirmed', 'Tentative', 'Invited'] as const).map((status) => {
              const isSelected = currentUserRsvp === status;
              return (
                <TouchableOpacity testID="btn-group-planning-324" accessibilityLabel="group-planning action"
                  key={status}
                  style={[
                    styles.rsvpPill,
                    {
                      borderColor: isSelected ? colors.primary : colors.border,
                      backgroundColor: isSelected
                        ? colors.primary
                        : 'transparent',
                    },
                  ]}
                  onPress={() => updateUserRsvp(status)}
                >
                  <Text
                    style={[
                      styles.rsvpPillText,
                      { color: isSelected ? '#ffffff' : colors.mutedText },
                    ]}
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Tab Selection Bar */}
        <View style={styles.tabsContainer}>
          {(
            [
              { key: 'members', label: 'Party', icon: 'people' },
              { key: 'polls', label: 'Polls', icon: 'stats-chart' },
              { key: 'gear', label: 'Gear List', icon: 'checkbox' },
              { key: 'dietary', label: 'Dietary', icon: 'nutrition' },
            ] as const
          ).map((tab) => {
            const isTabActive = activeTab === tab.key;
            return (
              <TouchableOpacity testID="btn-group-planning-363" accessibilityLabel="group-planning action"
                key={tab.key}
                style={[
                  styles.tabButton,
                  {
                    backgroundColor: isTabActive
                      ? colors.primary
                      : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setActiveTab(tab.key as GroupTab);
                }}
              >
                <Ionicons
                  name={
                    (isTabActive
                      ? tab.icon
                      : `${tab.icon}-outline`) as keyof typeof Ionicons.glyphMap
                  }
                  size={16}
                  color={isTabActive ? '#ffffff' : colors.mutedText}
                />
                <Text
                  style={[
                    styles.tabButtonText,
                    {
                      color: isTabActive ? '#ffffff' : colors.heading,
                      fontWeight: isTabActive ? '700' : '500',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ─── TAB 1: MEMBERS & PARTY ─── */}
        {activeTab === 'members' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeading, { color: colors.heading }]}>
                Squad Members ({groupTrip.members.length})
              </Text>
              <TouchableOpacity testID="btn-person-add-outline" accessibilityLabel="person add outline"
                style={[styles.inviteActionBtn, { borderColor: colors.primary }]}
                onPress={sharePartyInvite}
              >
                <Ionicons name="person-add-outline" size={14} color={colors.primary} />
                <Text style={[styles.inviteActionText, { color: colors.primary }]}>
                  Invite More
                </Text>
              </TouchableOpacity>
            </View>

            {groupTrip.members.map((member: GroupMember) => (
              <View
                key={member.memberId}
                style={[
                  styles.memberCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={[styles.avatarBox, { backgroundColor: `${colors.primary}20` }]}>
                  <Text style={[styles.avatarInitials, { color: colors.primary }]}>
                    {member.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </Text>
                </View>

                <View style={styles.memberInfo}>
                  <View style={styles.memberNameRow}>
                    <Text
                      style={[styles.memberName, { color: colors.heading }]}
                      numberOfLines={1}
                    >
                      {member.name}
                    </Text>
                    {member.role === 'Leader' && (
                      <View style={styles.leaderBadge}>
                        <Text style={styles.leaderBadgeText}>LEADER</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.memberTagsRow}>
                    <View
                      style={[
                        styles.dietaryPill,
                        {
                          backgroundColor:
                            member.dietaryTag.includes('Jain') ||
                            member.dietaryTag.includes('Veg')
                              ? '#dcfce7'
                              : '#f1f5f9',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dietaryPillText,
                          {
                            color:
                              member.dietaryTag.includes('Jain') ||
                              member.dietaryTag.includes('Veg')
                                ? '#15803d'
                                : '#475569',
                          },
                        ]}
                      >
                        {member.dietaryTag}
                      </Text>
                    </View>

                    <Text style={[styles.rsvpStatusText, { color: colors.mutedText }]}>
                      • {member.rsvpStatus}
                    </Text>
                  </View>
                </View>

                {member.phone ? (
                  <TouchableOpacity testID="btn-call-outline"
                    style={[styles.callBtn, { backgroundColor: `${colors.primary}15` }]}
                    onPress={() => handleCallMember(member.phone, member.name)}
                    accessibilityLabel={`Call ${member.name}`}
                  >
                    <Ionicons name="call-outline" size={16} color={colors.primary} />
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </View>
        )}

        {/* ─── TAB 2: GROUP POLLS ─── */}
        {activeTab === 'polls' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeading, { color: colors.heading }]}>
                Group Decision Polls ({groupTrip.polls.length})
              </Text>
              <Text style={[styles.pollHintText, { color: colors.mutedText }]}>
                Tap any option to cast or update vote
              </Text>
            </View>

            {groupTrip.polls.map((poll) => (
              <GroupPollCard
                key={poll.pollId}
                poll={poll}
                userVotedOptionId={userVotedOptions[poll.pollId]}
                onVote={(pollId, optionId) => voteOnPoll(pollId, optionId)}
              />
            ))}
          </View>
        )}

        {/* ─── TAB 3: SHARED GEAR CHECKLIST ─── */}
        {activeTab === 'gear' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={[styles.sectionHeading, { color: colors.heading }]}>
                  Shared Expedition Gear
                </Text>
                <Text style={[styles.pollHintText, { color: colors.mutedText }]}>
                  {packedCount} of {totalGearCount} packed ({gearPackingPercent}%)
                </Text>
              </View>

              <TouchableOpacity testID="btn-add" accessibilityLabel="add"
                style={[styles.addGearBtn, { backgroundColor: colors.primary }]}
                onPress={() => setIsAddGearModalVisible(true)}
              >
                <Ionicons name="add" size={16} color="#ffffff" />
                <Text style={styles.addGearBtnText}>Add Item</Text>
              </TouchableOpacity>
            </View>

            {/* Gear Progress Bar */}
            <View
              style={[
                styles.gearProgressBarTrack,
                { backgroundColor: `${colors.border}60` },
              ]}
            >
              <View
                style={[
                  styles.gearProgressBarFill,
                  {
                    width: `${gearPackingPercent}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>

            {/* Gear List */}
            {groupTrip.gearItems.map((item: GroupGearItem) => {
              const isPacked =
                item.isPacked || packedGearIds.includes(item.itemId);

              return (
                <TouchableOpacity testID="btn-group-planning-577" accessibilityLabel="group-planning action"
                  key={item.itemId}
                  style={[
                    styles.gearItemCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isPacked ? colors.primary : colors.border,
                      opacity: isPacked ? 0.75 : 1,
                    },
                  ]}
                  onPress={() => toggleGearPacked(item.itemId)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.checkbox,
                      {
                        borderColor: isPacked ? colors.primary : colors.border,
                        backgroundColor: isPacked ? colors.primary : 'transparent',
                      },
                    ]}
                  >
                    {isPacked && (
                      <Ionicons name="checkmark" size={14} color="#ffffff" />
                    )}
                  </View>

                  <View style={styles.gearItemInfo}>
                    <Text
                      style={[
                        styles.gearTitle,
                        {
                          color: colors.heading,
                          textDecorationLine: isPacked ? 'line-through' : 'none',
                        },
                      ]}
                    >
                      {item.title}
                    </Text>

                    <View style={styles.gearMetaRow}>
                      <View
                        style={[
                          styles.gearCategoryBadge,
                          { backgroundColor: `${colors.primary}12` },
                        ]}
                      >
                        <Text
                          style={[
                            styles.gearCategoryText,
                            { color: colors.primary },
                          ]}
                        >
                          {item.category}
                        </Text>
                      </View>

                      <Text
                        style={[styles.assignedText, { color: colors.mutedText }]}
                      >
                        Assigned: {item.assignedToMemberName}
                      </Text>
                    </View>
                  </View>

                  <Ionicons
                    name={isPacked ? 'cube' : 'cube-outline'}
                    size={20}
                    color={isPacked ? colors.primary : colors.mutedText}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ─── TAB 4: DIETARY HARMONIZER ─── */}
        {activeTab === 'dietary' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeading, { color: colors.heading }]}>
                Dietary Harmonizer & Kitchen Guide
              </Text>
            </View>

            <Text style={[styles.dietaryLeadText, { color: colors.mutedText }]}>
              Ensuring all travel companions dine safely with zero cross-contamination
              and pre-arranged meal requirements.
            </Text>

            {groupTrip.dietarySummary.map((diet: DietarySummaryItem, idx: number) => (
              <View
                key={idx}
                style={[
                  styles.dietaryCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.dietaryCardHeader}>
                  <View style={styles.dietaryTitleRow}>
                    <Ionicons
                      name="leaf"
                      size={18}
                      color={
                        diet.dietType.includes('Jain')
                          ? '#16a34a'
                          : diet.dietType.includes('Halal')
                          ? '#0284c7'
                          : colors.primary
                      }
                    />
                    <Text
                      style={[styles.dietTypeHeading, { color: colors.heading }]}
                    >
                      {diet.dietType} ({diet.count}{' '}
                      {diet.count === 1 ? 'member' : 'members'})
                    </Text>
                  </View>
                </View>

                <View style={styles.dietMembersWrap}>
                  <Text style={[styles.dietMembersLabel, { color: colors.mutedText }]}>
                    Travelers:
                  </Text>
                  <Text style={[styles.dietMembersList, { color: colors.heading }]}>
                    {diet.memberNames.join(', ')}
                  </Text>
                </View>

                <View
                  style={[
                    styles.diningTipBox,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={[styles.diningTipText, { color: colors.heading }]}>
                    {diet.diningTip}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Gear Modal */}
      <Modal
        visible={isAddGearModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddGearModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.heading }]}>
                Add Shared Gear Item
              </Text>
              <TouchableOpacity testID="btn-close"
                onPress={() => setIsAddGearModalVisible(false)}
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={22} color={colors.heading} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.heading }]}>
              Item Title *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.heading,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              placeholder="e.g. Travel Iron, Power Strip, Snacks"
              placeholderTextColor={colors.mutedText}
              value={newGearTitle}
              onChangeText={setNewGearTitle}
            />

            <Text style={[styles.fieldLabel, { color: colors.heading }]}>
              Category
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryPillsRow}
            >
              {gearCategories.map((cat) => (
                <TouchableOpacity testID="btn-group-planning-789" accessibilityLabel="group-planning action"
                  key={cat}
                  style={[
                    styles.catPill,
                    {
                      backgroundColor:
                        newGearCategory === cat
                          ? colors.primary
                          : colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setNewGearCategory(cat)}
                >
                  <Text
                    style={[
                      styles.catPillText,
                      {
                        color:
                          newGearCategory === cat
                            ? '#ffffff'
                            : colors.heading,
                      },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: colors.heading }]}>
              Assign To Traveler
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.heading,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Member Name (Optional)"
              placeholderTextColor={colors.mutedText}
              value={newGearAssignee}
              onChangeText={setNewGearAssignee}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity testID="btn-cancel" accessibilityLabel="Cancel"
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setIsAddGearModalVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: colors.mutedText }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity testID="btn-add-to-checklist" accessibilityLabel="Add to Checklist"
                style={[styles.modalSubmitBtn, { backgroundColor: colors.primary }]}
                onPress={handleAddGearSubmit}
              >
                <Text style={styles.modalSubmitText}>Add to Checklist</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function GroupPlanningScreen() {
  return (
    <FeatureGuard featureId="build-package">
      <GroupPlanningContent />
    </FeatureGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  noGroupTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 14,
  },
  noGroupSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 20,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
  },
  shareHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  codeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  costItem: {
    alignItems: 'center',
  },
  costLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  costValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  costDivider: {
    width: 1,
    height: 30,
  },
  rsvpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rsvpTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  rsvpPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 32,
    justifyContent: 'center',
  },
  rsvpPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 44,
  },
  tabButtonText: {
    fontSize: 12,
  },
  tabContent: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
  },
  inviteActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 36,
  },
  inviteActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  avatarBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitials: {
    fontSize: 15,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
  },
  leaderBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  leaderBadgeText: {
    color: '#92400e',
    fontSize: 9,
    fontWeight: '800',
  },
  memberTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dietaryPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dietaryPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  rsvpStatusText: {
    fontSize: 12,
  },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  pollHintText: {
    fontSize: 12,
  },
  addGearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    minHeight: 36,
  },
  addGearBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  gearProgressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  gearProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  gearItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  gearItemInfo: {
    flex: 1,
  },
  gearTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  gearMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gearCategoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  gearCategoryText: {
    fontSize: 10,
    fontWeight: '700',
  },
  assignedText: {
    fontSize: 11,
  },
  dietaryLeadText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  dietaryCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 8,
  },
  dietaryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dietaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dietTypeHeading: {
    fontSize: 15,
    fontWeight: '700',
  },
  dietMembersWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dietMembersLabel: {
    fontSize: 12,
  },
  dietMembersList: {
    fontSize: 13,
    fontWeight: '600',
  },
  diningTipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  diningTipText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderWidth: 1,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 44,
  },
  categoryPillsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  modalCancelText: {
    fontWeight: '600',
    fontSize: 14,
  },
  modalSubmitBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  modalSubmitText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});

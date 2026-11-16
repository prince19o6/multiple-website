import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { useGroupTrip } from '@/context/GroupTripContext';

export const GroupTripCard: React.FC<{ style?: object }> = ({ style }) => {
  const router = useRouter();
  const colors = useColors();
  const { groupTrip, packedGearIds, sharePartyInvite } = useGroupTrip();

  if (!groupTrip) return null;

  const totalGear = groupTrip.gearItems.length;
  const packedCount = groupTrip.gearItems.filter(
    (g) => g.isPacked || packedGearIds.includes(g.itemId)
  ).length;
  const gearPercent = totalGear > 0 ? Math.round((packedCount / totalGear) * 100) : 0;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {/* Top Banner Row */}
      <View style={styles.topRow}>
        <View style={styles.tagWrap}>
          <Ionicons name="people" size={14} color={colors.primary} />
          <Text style={[styles.tagText, { color: colors.primary }]}>
            EXPEDITION PARTY HUB
          </Text>
        </View>

        <TouchableOpacity testID="btn-share"
          style={[styles.shareIconBtn, { backgroundColor: `${colors.primary}15` }]}
          onPress={sharePartyInvite}
          accessibilityLabel="Share Group Invite"
          accessibilityRole="button"
        >
          <Ionicons name="share-social-outline" size={15} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Group Title & Details */}
      <Text style={[styles.groupTitle, { color: colors.heading }]} numberOfLines={1}>
        {groupTrip.groupName}
      </Text>

      <Text style={[styles.destinationText, { color: colors.mutedText }]} numberOfLines={1}>
        📍 {groupTrip.destination} • 📅 {groupTrip.travelDates}
      </Text>

      {/* Member Avatar Stack & Active Polls */}
      <View style={styles.midRow}>
        <View style={styles.memberStack}>
          {groupTrip.members.slice(0, 4).map((member, i) => (
            <View
              key={member.memberId}
              style={[
                styles.avatarCircle,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.surface,
                  marginLeft: i === 0 ? 0 : -8,
                },
              ]}
            >
              <Text style={styles.avatarLetter}>
                {member.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          ))}
          {groupTrip.members.length > 4 && (
            <View
              style={[
                styles.avatarCircle,
                {
                  backgroundColor: colors.mutedText,
                  borderColor: colors.surface,
                  marginLeft: -8,
                },
              ]}
            >
              <Text style={styles.avatarLetter}>
                +{groupTrip.members.length - 4}
              </Text>
            </View>
          )}
          <Text style={[styles.memberCountText, { color: colors.mutedText }]}>
            {groupTrip.members.length} Travelers
          </Text>
        </View>

        <View style={styles.pollBadge}>
          <Ionicons name="stats-chart" size={12} color="#f59e0b" />
          <Text style={styles.pollBadgeText}>
            {groupTrip.polls.length} Polls Active
          </Text>
        </View>
      </View>

      {/* Gear Packing Progress Bar */}
      <View style={styles.gearProgressWrap}>
        <View style={styles.gearLabelsRow}>
          <Text style={[styles.gearLabel, { color: colors.mutedText }]}>
            Shared Gear Packing
          </Text>
          <Text style={[styles.gearPercentText, { color: colors.heading }]}>
            {packedCount}/{totalGear} ({gearPercent}%)
          </Text>
        </View>
        <View
          style={[
            styles.progressTrack,
            { backgroundColor: `${colors.border}60` },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${gearPercent}%`,
                backgroundColor: colors.primary,
              },
            ]}
          />
        </View>
      </View>

      {/* Open Group Planning Screen */}
      <TouchableOpacity testID="btn-navigate"
        style={[styles.openBtn, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/group-planning')}
        activeOpacity={0.85}
        accessibilityLabel="Open Group Planning Hub"
        accessibilityRole="button"
      >
        <Text style={styles.openBtnText}>Collaborate & Vote with Party</Text>
        <Ionicons name="arrow-forward" size={16} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  shareIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  destinationText: {
    fontSize: 12,
    marginBottom: 12,
  },
  midRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memberStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  memberCountText: {
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '500',
  },
  pollBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  pollBadgeText: {
    color: '#92400e',
    fontSize: 11,
    fontWeight: '700',
  },
  gearProgressWrap: {
    marginBottom: 14,
  },
  gearLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  gearLabel: {
    fontSize: 11,
  },
  gearPercentText: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressTrack: {
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 44,
  },
  openBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});

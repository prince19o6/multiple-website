import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { GroupPoll, PollOption } from '../types';

interface GroupPollCardProps {
  poll: GroupPoll;
  userVotedOptionId?: string;
  onVote: (pollId: string, optionId: string) => void;
}

export const GroupPollCard: React.FC<GroupPollCardProps> = ({
  poll,
  userVotedOptionId,
  onVote,
}) => {
  const colors = useColors();

  // Find max votes to determine leading option
  const maxVotes = Math.max(...poll.options.map((o) => o.votesCount), 0);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Activity':
        return 'compass-outline';
      case 'Dining':
        return 'restaurant-outline';
      case 'Timing':
        return 'time-outline';
      case 'Budget':
        return 'wallet-outline';
      default:
        return 'help-circle-outline';
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Poll Header */}
      <View style={styles.headerRow}>
        <View style={styles.categoryBadge}>
          <Ionicons
            name={getCategoryIcon(poll.category) as keyof typeof Ionicons.glyphMap}
            size={14}
            color={colors.primary}
          />
          <Text style={[styles.categoryText, { color: colors.primary }]}>
            {poll.category.toUpperCase()} POLL
          </Text>
        </View>

        <View style={styles.statusBadge}>
          <View style={styles.liveDot} />
          <Text style={[styles.statusText, { color: colors.mutedText }]}>
            {poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'votes'}
          </Text>
        </View>
      </View>

      {/* Question */}
      <Text style={[styles.questionText, { color: colors.heading }]}>
        {poll.question}
      </Text>
      <Text style={[styles.createdByText, { color: colors.mutedText }]}>
        Proposed by {poll.createdBy}
      </Text>

      {/* Poll Options */}
      <View style={styles.optionsContainer}>
        {poll.options.map((option: PollOption) => {
          const isSelected = userVotedOptionId === option.optionId;
          const isLeading = option.votesCount === maxVotes && maxVotes > 0;
          const percent = option.votePercent || 0;

          return (
            <TouchableOpacity testID="btn-grouppollcard-85" accessibilityLabel="grouppollcard action"
              key={option.optionId}
              style={[
                styles.optionRow,
                {
                  borderColor: isSelected ? colors.primary : colors.border,
                  backgroundColor: isSelected
                    ? `${colors.primary}12`
                    : colors.background,
                },
              ]}
              onPress={() => onVote(poll.pollId, option.optionId)}
              activeOpacity={0.7}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
            >
              {/* Progress Bar Fill */}
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${percent}%`,
                    backgroundColor: isSelected
                      ? `${colors.primary}25`
                      : `${colors.border}40`,
                  },
                ]}
              />

              <View style={styles.optionContent}>
                <View style={styles.optionTopRow}>
                  <View style={styles.optionTitleContainer}>
                    <View
                      style={[
                        styles.radioIndicator,
                        {
                          borderColor: isSelected ? colors.primary : colors.border,
                          backgroundColor: isSelected ? colors.primary : 'transparent',
                        },
                      ]}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={12} color="#ffffff" />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.optionTitle,
                        {
                          color: colors.heading,
                          fontWeight: isSelected ? '700' : '600',
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {option.title}
                    </Text>
                  </View>

                  <View style={styles.votePercentContainer}>
                    <Text style={[styles.percentText, { color: colors.heading }]}>
                      {percent}%
                    </Text>
                    <Text style={[styles.voteCountText, { color: colors.mutedText }]}>
                      {option.votesCount} {option.votesCount === 1 ? 'vote' : 'votes'}
                    </Text>
                  </View>
                </View>

                {option.subtitle ? (
                  <Text
                    style={[styles.optionSubtitle, { color: colors.mutedText }]}
                  >
                    {option.subtitle}
                  </Text>
                ) : null}

                {/* Badges Row */}
                <View style={styles.badgesRow}>
                  {isSelected && (
                    <View
                      style={[
                        styles.badgePill,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <Ionicons name="person" size={10} color="#ffffff" />
                      <Text style={styles.badgePillText}>Your Vote</Text>
                    </View>
                  )}

                  {isLeading && (
                    <View style={styles.leadingPill}>
                      <Text style={styles.leadingPillText}>🏆 Leading</Text>
                    </View>
                  )}

                  {option.votedMemberNames && option.votedMemberNames.length > 0 && (
                    <Text
                      style={[styles.votersText, { color: colors.mutedText }]}
                      numberOfLines={1}
                    >
                      • {option.votedMemberNames.join(', ')}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 4,
  },
  createdByText: {
    fontSize: 12,
    marginBottom: 14,
  },
  optionsContainer: {
    gap: 10,
  },
  optionRow: {
    borderRadius: 12,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 56,
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 12,
  },
  optionContent: {
    padding: 12,
    position: 'relative',
    zIndex: 1,
  },
  optionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  optionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  radioIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  optionTitle: {
    fontSize: 14,
    flex: 1,
  },
  votePercentContainer: {
    alignItems: 'flex-end',
  },
  percentText: {
    fontSize: 14,
    fontWeight: '700',
  },
  voteCountText: {
    fontSize: 10,
  },
  optionSubtitle: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 30,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
    marginLeft: 30,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgePillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  leadingPill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  leadingPillText: {
    color: '#92400e',
    fontSize: 10,
    fontWeight: '700',
  },
  votersText: {
    fontSize: 11,
    flex: 1,
  },
});

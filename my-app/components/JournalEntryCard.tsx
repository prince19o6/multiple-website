import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { JournalEntry } from '../types';

interface JournalEntryCardProps {
  entry: JournalEntry;
  isLiked?: boolean;
  onToggleLike: (entryId: string) => void;
}

export const JournalEntryCard: React.FC<JournalEntryCardProps> = ({
  entry,
  isLiked = false,
  onToggleLike,
}) => {
  const colors = useColors();

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'Spiritual & Serene':
        return '#059669';
      case 'Thrilled & Adventurous':
        return '#dc2626';
      case 'Awestruck':
        return '#7c3aed';
      case 'Relaxed & Peaceful':
        return '#0284c7';
      case 'Foodie Heaven':
        return '#d97706';
      default:
        return colors.primary;
    }
  };

  const moodColor = getMoodColor(entry.moodTag);

  const handleShareEntry = async () => {
    try {
      await Share.share({
        title: entry.title,
        message: `📸 Travel Memory: "${entry.title}"\n📍 Location: ${entry.locationName}\n📅 Day ${entry.dayNumber} (${entry.date})\n\n"${entry.notes}"\n\nShared from my Travel Expedition Journal`,
      });
    } catch {}
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
      {/* Top Meta Row */}
      <View style={styles.topMetaRow}>
        <View style={styles.dayBadge}>
          <Text style={[styles.dayBadgeText, { color: colors.primary }]}>
            DAY {entry.dayNumber}
          </Text>
          <Text style={[styles.dateText, { color: colors.mutedText }]}>
            • {entry.date}
          </Text>
        </View>

        <View style={[styles.moodPill, { backgroundColor: `${moodColor}15` }]}>
          <Text style={[styles.moodPillText, { color: moodColor }]}>
            {entry.moodTag}
          </Text>
        </View>
      </View>

      {/* Photo Image Banner */}
      {entry.photoUrl ? (
        <View style={styles.imageContainer}>
          <ExpoImage
            source={{ uri: entry.photoUrl }}
            style={styles.image}
            contentFit="cover"
            transition={300}
          />
        </View>
      ) : null}

      {/* Content */}
      <View style={styles.contentWrap}>
        <Text style={[styles.title, { color: colors.heading }]}>
          {entry.title}
        </Text>

        <View style={styles.locationRow}>
          <Ionicons name="location" size={13} color={colors.primary} />
          <Text
            style={[styles.locationText, { color: colors.mutedText }]}
            numberOfLines={1}
          >
            {entry.locationName}
          </Text>
        </View>

        <Text style={[styles.notesText, { color: colors.heading }]}>
          {entry.notes}
        </Text>

        {/* Footer Row */}
        <View
          style={[
            styles.footerRow,
            { borderTopColor: colors.border },
          ]}
        >
          <View style={styles.authorWrap}>
            <Ionicons name="person-circle-outline" size={16} color={colors.mutedText} />
            <Text style={[styles.authorText, { color: colors.mutedText }]}>
              {entry.authorName}
            </Text>
          </View>

          <View style={styles.actionsWrap}>
            <TouchableOpacity testID="btn-journalentrycard-124"
              style={styles.actionBtn}
              onPress={() => onToggleLike(entry.entryId)}
              accessibilityLabel="Like memory"
              accessibilityRole="button"
            >
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={18}
                color={isLiked ? '#ef4444' : colors.mutedText}
              />
              <Text
                style={[
                  styles.likeCountText,
                  { color: isLiked ? '#ef4444' : colors.mutedText },
                ]}
              >
                {entry.likesCount}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity testID="btn-share"
              style={styles.actionBtn}
              onPress={handleShareEntry}
              accessibilityLabel="Share memory"
              accessibilityRole="button"
            >
              <Ionicons name="share-outline" size={18} color={colors.mutedText} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  topMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  dayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dayBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  dateText: {
    fontSize: 12,
  },
  moodPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moodPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  imageContainer: {
    width: '100%',
    height: 190,
    backgroundColor: '#e2e8f0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  contentWrap: {
    padding: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  locationText: {
    fontSize: 12,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  authorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  authorText: {
    fontSize: 12,
  },
  actionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
  },
  likeCountText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

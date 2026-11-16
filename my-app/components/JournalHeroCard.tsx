import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { useJournal } from '@/context/JournalContext';

export const JournalHeroCard: React.FC<{ style?: object }> = ({ style }) => {
  const router = useRouter();
  const colors = useColors();
  const { scrapbook, shareStoryReel } = useJournal();

  if (!scrapbook) return null;

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
          <Ionicons name="journal" size={13} color={colors.primary} />
          <Text style={[styles.tagText, { color: colors.primary }]}>
            EXPEDITION MEMORY SCRAPBOOK
          </Text>
        </View>

        <TouchableOpacity testID="btn-share"
          style={[styles.shareBtn, { backgroundColor: `${colors.primary}15` }]}
          onPress={shareStoryReel}
          accessibilityLabel="Share Story Reel"
          accessibilityRole="button"
        >
          <Ionicons name="share-social-outline" size={15} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tour & Destination Title */}
      <Text style={[styles.title, { color: colors.heading }]} numberOfLines={1}>
        {scrapbook.tourName}
      </Text>
      <Text style={[styles.subtitle, { color: colors.mutedText }]} numberOfLines={1}>
        📍 {scrapbook.destination} • 📷 {scrapbook.stats.totalPhotos} Photos & Milestones
      </Text>

      {/* Quote Banner */}
      <View
        style={[
          styles.quoteBanner,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
          },
        ]}
      >
        <Ionicons name="sparkles" size={14} color="#f59e0b" />
        <Text
          style={[styles.quoteText, { color: colors.heading }]}
          numberOfLines={2}
        >
          "{scrapbook.inspirationalQuote}"
        </Text>
      </View>

      {/* Bottom CTA Row */}
      <View style={styles.btnRow}>
        <TouchableOpacity testID="btn-book-outline"
          style={[styles.openBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/travel-journal')}
          activeOpacity={0.85}
          accessibilityLabel="View Expedition Scrapbook"
          accessibilityRole="button"
        >
          <Ionicons name="book-outline" size={16} color="#ffffff" />
          <Text style={styles.openBtnText}>Open Memory Scrapbook</Text>
        </TouchableOpacity>
      </View>
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
  shareBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 10,
  },
  quoteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  quoteText: {
    fontSize: 12,
    fontStyle: 'italic',
    flex: 1,
    lineHeight: 16,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  openBtn: {
    flex: 1,
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

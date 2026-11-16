import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { PhraseItem } from '../types';

interface PhraseCardProps {
  phrase: PhraseItem;
  isFavorite: boolean;
  onToggleFavorite: (phraseId: string) => void;
  onShowFlashcard: (phrase: PhraseItem) => void;
  style?: object;
}

export const PhraseCard: React.FC<PhraseCardProps> = ({
  phrase,
  isFavorite,
  onToggleFavorite,
  onShowFlashcard,
  style,
}) => {
  const colors = useColors();

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
      {/* Top Meta Row */}
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          <View style={[styles.catBadge, { backgroundColor: `${colors.primary}12` }]}>
            <Text style={[styles.catBadgeText, { color: colors.primary }]}>
              {phrase.category.toUpperCase()}
            </Text>
          </View>

          {phrase.isDietarySafe && (
            <View style={styles.dietaryBadge}>
              <Ionicons name="leaf" size={10} color="#15803d" />
              <Text style={styles.dietaryBadgeText}>DIETARY VERIFIED</Text>
            </View>
          )}
        </View>

        <TouchableOpacity testID="btn-phrasecard-52"
          style={styles.favBtn}
          onPress={() => onToggleFavorite(phrase.phraseId)}
          accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          accessibilityRole="button"
        >
          <Ionicons
            name={isFavorite ? 'star' : 'star-outline'}
            size={18}
            color={isFavorite ? '#f59e0b' : colors.mutedText}
          />
        </TouchableOpacity>
      </View>

      {/* Target Native Script (Prominent & Clear) */}
      <Text style={[styles.targetScript, { color: colors.heading }]}>
        {phrase.targetScriptText}
      </Text>

      {/* Phonetic Pronunciation Bar */}
      <View
        style={[
          styles.phoneticBox,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}
      >
        <Ionicons name="volume-medium-outline" size={15} color={colors.primary} />
        <Text style={[styles.phoneticText, { color: colors.heading }]}>
          "{phrase.phoneticText}"
        </Text>
      </View>

      {/* English Meaning */}
      <Text style={[styles.englishText, { color: colors.mutedText }]}>
        {phrase.englishText}
      </Text>

      {/* Cultural Context Note */}
      {phrase.culturalContextNote ? (
        <View style={styles.noteRow}>
          <Ionicons name="information-circle-outline" size={13} color={colors.mutedText} />
          <Text style={[styles.noteText, { color: colors.mutedText }]}>
            {phrase.culturalContextNote}
          </Text>
        </View>
      ) : null}

      {/* Show to Local Flashcard Button */}
      <TouchableOpacity testID="btn-expand"
        style={[styles.flashcardBtn, { backgroundColor: `${colors.primary}10`, borderColor: colors.primary }]}
        onPress={() => onShowFlashcard(phrase)}
        activeOpacity={0.8}
        accessibilityLabel="Show full-screen to local"
        accessibilityRole="button"
      >
        <Ionicons name="expand" size={15} color={colors.primary} />
        <Text style={[styles.flashcardBtnText, { color: colors.primary }]}>
          Show Big to Local (Flashcard Mode)
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
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
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  dietaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dietaryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803d',
    letterSpacing: 0.5,
  },
  favBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetScript: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: 10,
  },
  phoneticBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  phoneticText: {
    fontSize: 13,
    fontWeight: '600',
    fontStyle: 'italic',
    flex: 1,
  },
  englishText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  noteText: {
    fontSize: 11,
    flex: 1,
  },
  flashcardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 40,
  },
  flashcardBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

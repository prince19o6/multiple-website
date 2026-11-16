import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/store/ThemeContext';
import { useSite, useSiteConfig } from '@/store/SiteConfigContext';
import { usePhrasebook } from '../context/PhrasebookContext';

interface PhrasebookCardProps {
  style?: StyleProp<ViewStyle>;
}

export const PhrasebookCard: React.FC<PhrasebookCardProps> = ({ style }) => {
  const router = useRouter();
  const colors = useColors();
  const { siteId } = useSite();
  const config = useSiteConfig();
  const { phrasebook } = usePhrasebook();

  const getDialectTag = () => {
    if (phrasebook?.languageName) {
      return phrasebook.regionDescription
        ? `${phrasebook.languageName} (${phrasebook.regionDescription})`
        : phrasebook.languageName;
    }
    if ((config as any)?.content?.phrasebook?.languageName) {
      return (config as any).content.phrasebook.languageName;
    }
    return (config as any)?.site?.defaultLanguage?.toUpperCase() || 'Local Dialect';
  };

  const getSamplePhrase = () => {
    if ((config as any)?.content?.phrasebook?.sample) {
      return (config as any).content.phrasebook.sample;
    }
    return {
      original: 'Hello & Welcome',
      phonetic: 'Greetings',
      meaning: 'Pleasant travels with us',
    };
  };

  const sample = getSamplePhrase();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {/* Top Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <View style={[styles.iconBox, { backgroundColor: `${colors.primary}15` }]}>
            <Ionicons name="chatbubbles" size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.title, { color: colors.heading }]}>
              Pocket Phrasebook
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedText }]}>
              {getDialectTag()}
            </Text>
          </View>
        </View>

        <View style={styles.offlineBadge}>
          <Ionicons name="cloud-offline" size={12} color="#15803d" />
          <Text style={styles.offlineText}>Offline Ready</Text>
        </View>
      </View>

      {/* Preview Card Box */}
      <View style={[styles.previewBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.previewTagRow}>
          <Text style={[styles.previewCategory, { color: colors.primary }]}>
            QUICK SURVIVAL ESSENTIAL
          </Text>
          <View style={styles.flashcardIndicator}>
            <Ionicons name="expand" size={12} color={colors.mutedText} />
            <Text style={[styles.flashcardText, { color: colors.mutedText }]}>Flashcard</Text>
          </View>
        </View>

        <Text style={[styles.previewOriginal, { color: colors.heading }]}>
          {sample.original}
        </Text>
        <Text style={[styles.previewPhonetic, { color: colors.primary }]}>
          {sample.phonetic}
        </Text>
        <Text style={[styles.previewMeaning, { color: colors.mutedText }]}>
          "{sample.meaning}"
        </Text>
      </View>

      {/* Action Button */}
      <TouchableOpacity testID="btn-language"
        style={[styles.actionBtn, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/phrasebook')}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Open Destination Phrasebook and Flashcard Translator"
      >
        <Ionicons name="language" size={18} color="#ffffff" style={{ marginRight: 6 }} />
        <Text style={styles.actionBtnText}>Open Phrasebook & Local Translator</Text>
        <Ionicons name="chevron-forward" size={16} color="#ffffff" style={{ marginLeft: 4 }} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  offlineText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
  },
  previewBox: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  previewTagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  previewCategory: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  flashcardIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flashcardText: {
    fontSize: 11,
    fontWeight: '600',
  },
  previewOriginal: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 3,
  },
  previewPhonetic: {
    fontSize: 13,
    fontWeight: '600',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  previewMeaning: {
    fontSize: 12,
    fontWeight: '400',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 12,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useBargain } from '@/context/BargainContext';
import type { BargainPhraseItem } from '@/types';

interface BargainHeroCardProps {
  style?: ViewStyle;
}

export const BargainHeroCard: React.FC<BargainHeroCardProps> = ({ style }) => {
  const router = useRouter();
  const colors = useColors();
  const { bargainData, totalSaved, openFlashcard } = useBargain();

  const handleOpenHub = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/bargain-assistant');
  };

  const handleQuickFlashcard = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const defaultPhrase: BargainPhraseItem = bargainData?.keyPhrases?.[0] || {
      id: 'can_you_discount',
      phraseId: 'can_you_discount',
      englishMeaning: 'Can you discount a little bit?',
      englishText: 'Can you discount a little bit?',
      localScript: 'ลดหน่อยได้ไหมครับ/ค่ะ',
      phonetic: 'Lod noi dai mai khrup/ka?',
      phoneticPronunciation: 'Lod noi dai mai khrup/ka?',
      literalMeaning: 'Reduce a bit, can you?',
      contextAdvice: 'Show this gently to stall owner with a polite smile.',
      contextUsage: 'Show this gently to stall owner with a polite smile.',
      icon: 'pricetag',
    };
    openFlashcard(defaultPhrase);
  };

  const currencySymbol = bargainData?.currencySymbol || '฿';
  const cityName = bargainData?.city || 'Local Bazaars';
  const topMarket = bargainData?.famousMarkets?.[0]?.marketName || bargainData?.markets?.[0]?.marketName || 'Night Markets';

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
      {/* Top Banner Row */}
      <View style={styles.topRow}>
        <View style={styles.badgeGroup}>
          <View style={[styles.marketPill, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}>
            <Ionicons name="flame" size={12} color="#d97706" />
            <Text style={styles.marketPillText}>{cityName} Street Shopping</Text>
          </View>
          {totalSaved > 0 && (
            <View style={[styles.savedPill, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
              <Text style={styles.savedPillText}>
                +{currencySymbol}{totalSaved.toLocaleString()} Saved
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity testID="btn-phone-portrait-outline"
          style={styles.flashcardQuickBtn}
          onPress={handleQuickFlashcard}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Quick vendor flashcard"
        >
          <Ionicons name="phone-portrait-outline" size={16} color={colors.primary} />
          <Text style={[styles.flashcardQuickText, { color: colors.primary }]}>
            Flashcard 📱
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Title & Teaser */}
      <TouchableOpacity testID="btn-openhub" accessibilityLabel="Open Hub"
        onPress={handleOpenHub}
        activeOpacity={0.9}
        style={styles.mainTouchable}
      >
        <View style={styles.titleRow}>
          <View style={[styles.iconBox, { backgroundColor: '#fff7ed' }]}>
            <Text style={{ fontSize: 22 }}>🏮</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.heading }]}>
              Bargaining & Street Market Guide
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedText }]} numberOfLines={2}>
              Counter-offer calculator, polite vendor phrases, & haggling sweet-spots for {topMarket}.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.mutedText} />
        </View>
      </TouchableOpacity>

      {/* Footer Action Bar */}
      <View style={[styles.footerBar, { borderTopColor: colors.border }]}>
        <TouchableOpacity testID="btn-calculator-outline"
          style={[styles.fullActionBtn, { backgroundColor: colors.primary }]}
          onPress={handleOpenHub}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Launch Haggling & Market Assistant"
        >
          <Ionicons name="calculator-outline" size={16} color="#ffffff" />
          <Text style={styles.fullActionBtnText}>
            Launch Fair Offer Calculator
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  marketPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  marketPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b45309',
  },
  savedPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  savedPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803d',
  },
  flashcardQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    minHeight: 44,
  },
  flashcardQuickText: {
    fontSize: 12,
    fontWeight: '700',
  },
  mainTouchable: {
    paddingVertical: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  footerBar: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  fullActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 10,
  },
  fullActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useBargain } from '@/context/BargainContext';
import type { BargainPhraseItem } from '@/types';

export const VendorFlashcardModal: React.FC = () => {
  const colors = useColors();
  const {
    isFlashcardOpen,
    flashcardPhrase,
    flashcardCustomAmount,
    closeFlashcard,
    bargainData,
  } = useBargain();

  const [activePhrase, setActivePhrase] = useState<BargainPhraseItem | null>(null);

  // Sync or fallback
  const currentPhrase = activePhrase || flashcardPhrase || bargainData?.keyPhrases[0] || null;
  const currencySymbol = bargainData?.currencySymbol || '฿';
  const phrases = bargainData?.keyPhrases || [];

  const handleSelectPhrase = (phrase: BargainPhraseItem) => {
    Haptics.selectionAsync().catch(() => {});
    setActivePhrase(phrase);
  };

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setActivePhrase(null);
    closeFlashcard();
  };

  if (!isFlashcardOpen) return null;

  return (
    <Modal
      visible={isFlashcardOpen}
      animationType="fade"
      transparent={false}
      onRequestClose={handleDismiss}
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: '#0f172a' }]}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleDismiss}
            accessibilityRole="button"
            accessibilityLabel="Close flashcard"
          >
            <Ionicons name="close" size={26} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <Text style={styles.headerSuper}>SHOW DIRECTLY TO VENDOR</Text>
            <Text style={styles.headerTitle}>Haggling Flashcard 📱</Text>
          </View>

          <View style={{ width: 44 }} />
        </View>

        {/* Giant Main Card */}
        <View style={styles.contentContainer}>
          <View style={styles.flashcardContainer}>
            {/* Polite Smile Badge */}
            <View style={styles.smileBadge}>
              <Text style={styles.smileEmoji}>😊</Text>
              <Text style={styles.smileText}>Smile & Show Phone Gently</Text>
            </View>

            {/* Custom Amount Display (if calculated) */}
            {flashcardCustomAmount !== null && flashcardCustomAmount !== undefined && (
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>MY OFFER / ข้อเสนอของฉัน</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.priceCurrency}>{currencySymbol}</Text>
                  <Text style={styles.priceNumber}>
                    {flashcardCustomAmount.toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.priceNote}>Fair Cash Offer • จ่ายสด</Text>
              </View>
            )}

            {/* Local Script */}
            {currentPhrase && (
              <View style={styles.scriptContainer}>
                <Text style={styles.localScriptText} numberOfLines={2} adjustsFontSizeToFit>
                  {currentPhrase.localScript}
                </Text>

                <View style={styles.phoneticBox}>
                  <Ionicons name="volume-medium-outline" size={16} color="#38bdf8" />
                  <Text style={styles.phoneticText}>
                    "{currentPhrase.phoneticPronunciation || currentPhrase.phonetic}"
                  </Text>
                </View>

                <Text style={styles.englishTranslation}>
                  {currentPhrase.englishText || currentPhrase.englishMeaning}
                </Text>

                <Text style={styles.contextUsageText}>
                  Context: {currentPhrase.contextUsage || currentPhrase.contextAdvice}
                </Text>
              </View>
            )}
          </View>

          {/* Quick Phrase Switcher Carousel */}
          <Text style={styles.carouselHeader}>SWAP VENDOR PHRASE</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselScroll}
          >
            {phrases.map((phrase) => {
              const isSelected = (currentPhrase?.phraseId || currentPhrase?.id) === (phrase.phraseId || phrase.id);
              return (
                <TouchableOpacity
                  key={phrase.phraseId || phrase.id}
                  style={[
                    styles.phrasePill,
                    isSelected && styles.phrasePillActive,
                  ]}
                  onPress={() => handleSelectPhrase(phrase)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.phrasePillText,
                      isSelected && styles.phrasePillTextActive,
                    ]}
                  >
                    {phrase.englishText || phrase.englishMeaning}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Bottom Etiquette Reminder */}
          <View style={styles.bottomAdvice}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#10b981" />
            <Text style={styles.bottomAdviceText}>
              Bargaining is a social dance. If vendor declines, say "Kob Khun Krub/Ka" and walk away politely.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  headerSuper: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  flashcardContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#38bdf8',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  smileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  smileEmoji: {
    fontSize: 14,
  },
  smileText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  priceContainer: {
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f59e0b',
    letterSpacing: 0.8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 4,
  },
  priceCurrency: {
    fontSize: 32,
    fontWeight: '800',
    color: '#38bdf8',
    marginRight: 4,
  },
  priceNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -1,
  },
  priceNote: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  scriptContainer: {
    alignItems: 'center',
    width: '100%',
  },
  localScriptText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
    lineHeight: 46,
    marginBottom: 10,
  },
  phoneticBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    marginBottom: 10,
  },
  phoneticText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#38bdf8',
    fontStyle: 'italic',
  },
  englishTranslation: {
    fontSize: 16,
    fontWeight: '700',
    color: '#cbd5e1',
    textAlign: 'center',
    marginBottom: 4,
  },
  contextUsageText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },
  carouselHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 12,
  },
  carouselScroll: {
    gap: 8,
    paddingBottom: 8,
  },
  phrasePill: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 44,
  },
  phrasePillActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8',
  },
  phrasePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  phrasePillTextActive: {
    color: '#0f172a',
    fontWeight: '700',
  },
  bottomAdvice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bottomAdviceText: {
    fontSize: 12,
    color: '#94a3b8',
    flex: 1,
    lineHeight: 16,
  },
});

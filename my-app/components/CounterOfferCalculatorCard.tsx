import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useBargain } from '@/context/BargainContext';
import type { BargainCategoryItem, BargainPhraseItem } from '@/types';

interface CounterOfferCalculatorCardProps {
  onOpenLogModal?: () => void;
}

export const CounterOfferCalculatorCard: React.FC<CounterOfferCalculatorCardProps> = ({
  onOpenLogModal,
}) => {
  const colors = useColors();
  const {
    bargainData,
    askingPrice,
    setAskingPrice,
    selectedCategoryId,
    setSelectedCategoryId,
    bargainAggression,
    setBargainAggression,
    calculation,
    openFlashcard,
  } = useBargain();

  const [inputVal, setInputVal] = useState<string>(askingPrice.toString());

  const handlePriceChange = (text: string) => {
    const numeric = text.replace(/[^0-9]/g, '');
    setInputVal(numeric);
    const val = parseInt(numeric, 10);
    if (!isNaN(val) && val > 0) {
      setAskingPrice(val);
    } else if (text === '') {
      setAskingPrice(0);
    }
  };

  const handleQuickAdd = (amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const newPrice = Math.max(10, askingPrice + amount);
    setAskingPrice(newPrice);
    setInputVal(newPrice.toString());
  };

  const handleSetExact = (amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setAskingPrice(amount);
    setInputVal(amount.toString());
  };

  const handleSelectCategory = (catId: string) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedCategoryId(catId);
  };

  const handleAggression = (mode: 'gentle' | 'balanced' | 'firm') => {
    Haptics.selectionAsync().catch(() => {});
    setBargainAggression(mode);
  };

  const handleShowToVendor = () => {
    if (!calculation) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    // Find phrase for "How much for this?" or "Can you discount?"
    const discountPhrase: BargainPhraseItem =
      bargainData?.keyPhrases.find((p) => (p.phraseId === 'can_you_discount' || p.id === 'can_you_discount')) ||
      bargainData?.keyPhrases[0] || {
        id: 'custom_offer',
        phraseId: 'custom_offer',
        englishMeaning: 'Can you do this price please?',
        englishText: 'Can you do this price please?',
        localScript: 'ลดราคาได้ไหม',
        phonetic: 'Lod rah-kah dai mai khrup/ka?',
        phoneticPronunciation: 'Lod rah-kah dai mai khrup/ka?',
        literalMeaning: 'Can you reduce the price?',
        contextAdvice: 'Show phone screen with your counter-offer directly to vendor.',
        contextUsage: 'Show phone screen with your counter-offer directly to vendor.',
        icon: 'pricetag',
      };

    openFlashcard(discountPhrase, calculation.firstOfferPrice);
  };

  const currencySymbol = bargainData?.currencySymbol || '฿';
  const categories = bargainData?.categories || [];

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
      {/* Title Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.headerIconBox, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="calculator" size={20} color="#d97706" />
          </View>
          <View>
            <Text style={[styles.cardTitle, { color: colors.heading }]}>
              Counter-Offer Calculator
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.mutedText }]}>
              Real-time fair price algorithm for street bazaars
            </Text>
          </View>
        </View>
      </View>

      {/* Category Horizontal Pill Selector */}
      <Text style={[styles.sectionLabel, { color: colors.mutedText }]}>
        SELECT ITEM TYPE
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {categories.map((cat: BargainCategoryItem) => {
          const isSelected = cat.categoryId === selectedCategoryId;
          const isFirm = cat.bargainingFlexibility === 'FIRM_FIXED';

          return (
            <TouchableOpacity
              key={cat.categoryId || cat.id}
              style={[
                styles.categoryPill,
                {
                  backgroundColor: isSelected ? colors.primary : colors.background,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => handleSelectCategory(cat.categoryId || cat.id)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  { color: isSelected ? '#ffffff' : colors.heading },
                ]}
              >
                {cat.categoryName}
              </Text>
              {isFirm ? (
                <View style={styles.fixedBadge}>
                  <Text style={styles.fixedBadgeText}>Fixed</Text>
                </View>
              ) : (
                <Text
                  style={[
                    styles.discountPercentHint,
                    { color: isSelected ? 'rgba(255,255,255,0.8)' : '#059669' },
                  ]}
                >
                  ~{cat.typicalDiscountPercent}%
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Asking Price Input Box */}
      <View style={styles.inputSection}>
        <Text style={[styles.sectionLabel, { color: colors.mutedText }]}>
          VENDOR ASKING PRICE ({currencySymbol})
        </Text>
        <View
          style={[
            styles.inputRow,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.currencyPrefix, { color: colors.heading }]}>
            {currencySymbol}
          </Text>
          <TextInput
            style={[styles.textInput, { color: colors.heading }]}
            keyboardType="number-pad"
            value={inputVal}
            onChangeText={handlePriceChange}
            placeholder="0"
            placeholderTextColor={colors.mutedText}
            maxLength={7}
          />
          {inputVal.length > 0 && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => {
                setInputVal('');
                setAskingPrice(0);
              }}
            >
              <Ionicons name="close-circle" size={18} color={colors.mutedText} />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick presets */}
        <View style={styles.presetsRow}>
          {[200, 500, 800, 1200].map((preset) => (
            <TouchableOpacity
              key={preset}
              style={[styles.presetBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
              onPress={() => handleSetExact(preset)}
            >
              <Text style={[styles.presetText, { color: colors.heading }]}>
                {currencySymbol}{preset}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.presetBtnAdd, { borderColor: colors.primary }]}
            onPress={() => handleQuickAdd(100)}
          >
            <Text style={[styles.presetTextAdd, { color: colors.primary }]}>+100</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bargaining Strategy Toggle */}
      <View style={styles.strategySection}>
        <Text style={[styles.sectionLabel, { color: colors.mutedText }]}>
          NEGOTIATION TEMPERAMENT
        </Text>
        <View
          style={[
            styles.toggleContainer,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.toggleTab,
              bargainAggression === 'gentle' && { backgroundColor: colors.surface },
            ]}
            onPress={() => handleAggression('gentle')}
          >
            <Text
              style={[
                styles.toggleTabText,
                { color: bargainAggression === 'gentle' ? colors.primary : colors.mutedText },
                bargainAggression === 'gentle' && styles.activeTabText,
              ]}
            >
              😊 Gentle
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleTab,
              bargainAggression === 'balanced' && { backgroundColor: colors.surface },
            ]}
            onPress={() => handleAggression('balanced')}
          >
            <Text
              style={[
                styles.toggleTabText,
                { color: bargainAggression === 'balanced' ? colors.primary : colors.mutedText },
                bargainAggression === 'balanced' && styles.activeTabText,
              ]}
            >
              ⚖️ Balanced
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleTab,
              bargainAggression === 'firm' && { backgroundColor: colors.surface },
            ]}
            onPress={() => handleAggression('firm')}
          >
            <Text
              style={[
                styles.toggleTabText,
                { color: bargainAggression === 'firm' ? colors.primary : colors.mutedText },
                bargainAggression === 'firm' && styles.activeTabText,
              ]}
            >
              🔥 Street Savvy
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Calculated Results 3-Tier Grid */}
      {calculation && calculation.askingPrice > 0 ? (
        <View style={styles.resultsContainer}>
          <View style={styles.resultsGrid}>
            {/* 1st Offer */}
            <View style={[styles.tierCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
              <View style={styles.tierHeader}>
                <Ionicons name="chatbubble-ellipses" size={14} color="#16a34a" />
                <Text style={[styles.tierTitle, { color: '#16a34a' }]}>1ST COUNTER</Text>
              </View>
              <Text style={[styles.tierAmount, { color: '#15803d' }]}>
                {currencySymbol}{calculation.firstOfferPrice.toLocaleString()}
              </Text>
              <Text style={styles.tierSubtext}>Your starting proposal</Text>
            </View>

            {/* Target Price */}
            <View style={[styles.tierCard, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
              <View style={styles.tierHeader}>
                <Ionicons name="star" size={14} color="#2563eb" />
                <Text style={[styles.tierTitle, { color: '#2563eb' }]}>FAIR TARGET</Text>
              </View>
              <Text style={[styles.tierAmount, { color: '#1d4ed8' }]}>
                {currencySymbol}{calculation.targetPrice.toLocaleString()}
              </Text>
              <Text style={styles.tierSubtext}>
                Save {currencySymbol}{calculation.savingsAmount} ({calculation.discountPercent}%)
              </Text>
            </View>

            {/* Walkaway limit */}
            <View style={[styles.tierCard, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
              <View style={styles.tierHeader}>
                <Ionicons name="hand-left" size={14} color="#dc2626" />
                <Text style={[styles.tierTitle, { color: '#dc2626' }]}>WALKAWAY</Text>
              </View>
              <Text style={[styles.tierAmount, { color: '#b91c1c' }]}>
                {currencySymbol}{calculation.walkawayPrice.toLocaleString()}
              </Text>
              <Text style={styles.tierSubtext}>Walk if above this</Text>
            </View>
          </View>

          {/* Advice banner */}
          <View
            style={[
              styles.adviceCard,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
          >
            <View style={styles.adviceIcon}>
              <Ionicons name="bulb" size={18} color="#f59e0b" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.adviceHeadline, { color: colors.heading }]}>
                Tactical Playbook
              </Text>
              <Text style={[styles.adviceBody, { color: colors.mutedText }]}>
                {calculation.recommendedTactic}
              </Text>
              {calculation.categoryAdvice ? (
                <Text style={[styles.adviceSub, { color: colors.mutedText }]}>
                  💡 <Text style={{ fontWeight: '600' }}>Item Insight:</Text> {calculation.categoryAdvice}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonActionRow}>
            <TouchableOpacity
              style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
              onPress={handleShowToVendor}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Show large flashcard counter offer to vendor"
            >
              <Ionicons name="phone-portrait-outline" size={18} color="#ffffff" />
              <Text style={styles.primaryActionText}>
                Show {currencySymbol}{calculation.firstOfferPrice} to Vendor 📱
              </Text>
            </TouchableOpacity>

            {onOpenLogModal && (
              <TouchableOpacity
                style={[
                  styles.logActionBtn,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  onOpenLogModal();
                }}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Log purchase to track savings"
              >
                <Ionicons name="bookmark-outline" size={18} color={colors.heading} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.emptyPrompt}>
          <Text style={[styles.emptyPromptText, { color: colors.mutedText }]}>
            Enter the vendor's price above to see your exact 3-tier counter-offer breakdown.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  categoryScroll: {
    paddingBottom: 14,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 44,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  fixedBadge: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fixedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6b7280',
  },
  discountPercentHint: {
    fontSize: 11,
    fontWeight: '700',
  },
  inputSection: {
    marginBottom: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
  },
  currencyPrefix: {
    fontSize: 20,
    fontWeight: '800',
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 6,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  presetBtn: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '600',
  },
  presetBtnAdd: {
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  presetTextAdd: {
    fontSize: 12,
    fontWeight: '700',
  },
  strategySection: {
    marginBottom: 14,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
  },
  toggleTab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    minHeight: 44,
  },
  toggleTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeTabText: {
    fontWeight: '700',
  },
  resultsContainer: {
    marginTop: 6,
  },
  resultsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tierCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  tierTitle: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tierAmount: {
    fontSize: 16,
    fontWeight: '800',
    marginVertical: 2,
  },
  tierSubtext: {
    fontSize: 9,
    color: '#6b7280',
    textAlign: 'center',
  },
  adviceCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  adviceIcon: {
    marginTop: 2,
  },
  adviceHeadline: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  adviceBody: {
    fontSize: 12,
    lineHeight: 17,
  },
  adviceSub: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
  },
  buttonActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  logActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPrompt: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  emptyPromptText: {
    fontSize: 12,
    textAlign: 'center',
  },
});

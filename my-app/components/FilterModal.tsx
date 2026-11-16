/**
 * components/FilterModal.tsx
 *
 * Modern bottom-sheet filter & sort modal.
 * Features:
 *   - Brand-tailored colors, dynamic typography, and light/dark theme support
 *   - Sort by: Featured, Price (Low to High), Price (High to Low), Highest Rated, Newest
 *   - Filter by: Categories, Price Range, Duration, Difficulty
 *   - Quick budget presets + custom min/max inputs
 *   - Haptic feedback on selections
 *   - 44px minimum touch targets and accessibility labels
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useSiteConfig } from '@/store/SiteConfigContext';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';
import { RADIUS, SPACING, FONT_SIZE } from '@/constants/theme';
import type { TourFilterState, TourSortOption } from '@/types';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: TourFilterState) => void;
  initialFilters: TourFilterState;
  currencySymbol?: string;
  totalResults?: number;
}

const SORT_OPTIONS: { label: string; value: TourSortOption; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Recommended', value: 'featured', icon: 'sparkles-outline' },
  { label: 'Price: Low to High', value: 'price-low', icon: 'arrow-up-outline' },
  { label: 'Price: High to Low', value: 'price-high', icon: 'arrow-down-outline' },
  { label: 'Highest Rated', value: 'rating', icon: 'star-outline' },
  { label: 'Newest First', value: 'newest', icon: 'time-outline' },
];

const CATEGORIES = ['All', 'Adventure', 'Beach', 'Cultural', 'Wildlife', 'Luxury'];

const DURATION_OPTIONS = [
  { label: 'Any', value: '' },
  { label: '1 - 3 Days', value: '1-3' },
  { label: '4 - 7 Days', value: '4-7' },
  { label: '8+ Days', value: '8+' },
];

const DIFFICULTY_OPTIONS = [
  { label: 'Any', value: '' },
  { label: 'Easy', value: 'Easy' },
  { label: 'Moderate', value: 'Moderate' },
  { label: 'Challenging', value: 'Challenging' },
];

const PRICE_PRESETS = [
  { label: 'Any Price', min: undefined, max: undefined },
  { label: '< 5,000', min: undefined, max: 5000 },
  { label: '5k - 15k', min: 5000, max: 15000 },
  { label: '15k - 30k', min: 15000, max: 30000 },
  { label: '30k+', min: 30000, max: undefined },
];

export default function FilterModal({
  visible,
  onClose,
  onApply,
  initialFilters,
  currencySymbol = '₹',
  totalResults,
}: FilterModalProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const config = useSiteConfig();
  const headingFont = getHeadingFontFamily(config);

  const [sort, setSort] = useState<TourSortOption>(initialFilters.sort);
  const [category, setCategory] = useState<string>(initialFilters.category || 'All');
  const [minPrice, setMinPrice] = useState<string>(
    initialFilters.minPrice !== undefined ? String(initialFilters.minPrice) : ''
  );
  const [maxPrice, setMaxPrice] = useState<string>(
    initialFilters.maxPrice !== undefined ? String(initialFilters.maxPrice) : ''
  );
  const [duration, setDuration] = useState<string>(initialFilters.duration || '');
  const [difficulty, setDifficulty] = useState<string>(initialFilters.difficulty || '');

  // Synchronize when opened with new initial filters
  useEffect(() => {
    if (visible) {
      setSort(initialFilters.sort);
      setCategory(initialFilters.category || 'All');
      setMinPrice(initialFilters.minPrice !== undefined ? String(initialFilters.minPrice) : '');
      setMaxPrice(initialFilters.maxPrice !== undefined ? String(initialFilters.maxPrice) : '');
      setDuration(initialFilters.duration || '');
      setDifficulty(initialFilters.difficulty || '');
    }
  }, [visible, initialFilters]);

  // Count active filters (excluding default values)
  const activeCount = useMemo(() => {
    let count = 0;
    if (sort !== 'featured') count += 1;
    if (category && category !== 'All') count += 1;
    if (minPrice.trim() || maxPrice.trim()) count += 1;
    if (duration) count += 1;
    if (difficulty) count += 1;
    return count;
  }, [sort, category, minPrice, maxPrice, duration, difficulty]);

  const handleReset = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Haptics optional fallback
    }
    setSort('featured');
    setCategory('All');
    setMinPrice('');
    setMaxPrice('');
    setDuration('');
    setDifficulty('');
  };

  const handleApply = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics optional fallback
    }

    const parsedMin = minPrice.trim() ? parseFloat(minPrice.trim()) : undefined;
    const parsedMax = maxPrice.trim() ? parseFloat(maxPrice.trim()) : undefined;

    onApply({
      sort,
      category,
      minPrice: !isNaN(parsedMin ?? NaN) ? parsedMin : undefined,
      maxPrice: !isNaN(parsedMax ?? NaN) ? parsedMax : undefined,
      duration: duration || undefined,
      difficulty: difficulty || undefined,
    });
    onClose();
  };

  const selectSort = (val: TourSortOption) => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Haptics fallback
    }
    setSort(val);
  };

  const selectCategory = (val: string) => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Haptics fallback
    }
    setCategory(val);
  };

  const selectDuration = (val: string) => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Haptics fallback
    }
    setDuration(val);
  };

  const selectDifficulty = (val: string) => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Haptics fallback
    }
    setDifficulty(val);
  };

  const selectPricePreset = (preset: (typeof PRICE_PRESETS)[0]) => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Haptics fallback
    }
    setMinPrice(preset.min !== undefined ? String(preset.min) : '');
    setMaxPrice(preset.max !== undefined ? String(preset.max) : '');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback testID="btn-dismiss" accessibilityLabel="Dismiss" onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback testID="btn-filtermodal-214" accessibilityLabel="filtermodal action" onPress={() => {}}>
            <View
              style={[
                styles.modalContainer,
                {
                  backgroundColor: colors.surface,
                  paddingBottom: Math.max(insets.bottom, 20),
                },
              ]}
            >
              {/* Drag Handle */}
              <View style={styles.handleWrapper}>
                <View style={[styles.handleBar, { backgroundColor: colors.border }]} />
              </View>

              {/* Modal Header */}
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerLeft}>
                  <Text style={[styles.title, { color: colors.text, fontFamily: headingFont }]}>
                    Sort & Filter
                  </Text>
                  {totalResults !== undefined && (
                    <Text style={[styles.resultsCount, { color: colors.mutedText }]}>
                      {totalResults} tours found
                    </Text>
                  )}
                </View>

                <View style={styles.headerRight}>
                  {activeCount > 0 && (
                    <TouchableOpacity testID="btn-reset"
                      onPress={handleReset}
                      style={styles.resetButton}
                      accessibilityRole="button"
                      accessibilityLabel="Reset all filters"
                    >
                      <Text style={[styles.resetText, { color: colors.primary }]}>Reset</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity testID="btn-close"
                    onPress={onClose}
                    style={[styles.closeButton, { backgroundColor: colors.background }]}
                    accessibilityRole="button"
                    accessibilityLabel="Close filter modal"
                  >
                    <Ionicons name="close" size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Filter Body */}
              <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* 1. Sort Options */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Sort By</Text>
                  <View style={styles.chipRow}>
                    {SORT_OPTIONS.map((opt) => {
                      const isSelected = sort === opt.value;
                      return (
                        <TouchableOpacity testID="btn-filtermodal-278"
                          key={opt.value}
                          onPress={() => selectSort(opt.value)}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: isSelected ? colors.primary : colors.background,
                              borderColor: isSelected ? colors.primary : colors.border,
                            },
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`Sort by ${opt.label}`}
                          accessibilityState={{ selected: isSelected }}
                        >
                          <Ionicons
                            name={opt.icon}
                            size={14}
                            color={isSelected ? '#ffffff' : colors.mutedText}
                            style={{ marginRight: 6 }}
                          />
                          <Text
                            style={[
                              styles.chipText,
                              { color: isSelected ? '#ffffff' : colors.text },
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 2. Category / Theme */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Category / Theme</Text>
                  <View style={styles.chipRow}>
                    {CATEGORIES.map((cat) => {
                      const isSelected = category.toLowerCase() === cat.toLowerCase();
                      return (
                        <TouchableOpacity testID="btn-filtermodal-319"
                          key={cat}
                          onPress={() => selectCategory(cat)}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: isSelected ? colors.primary : colors.background,
                              borderColor: isSelected ? colors.primary : colors.border,
                            },
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`Category ${cat}`}
                          accessibilityState={{ selected: isSelected }}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              { color: isSelected ? '#ffffff' : colors.text },
                            ]}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 3. Price Range */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Price Range ({currencySymbol})
                  </Text>

                  {/* Quick presets */}
                  <View style={styles.chipRow}>
                    {PRICE_PRESETS.map((preset, idx) => {
                      const pMin = preset.min !== undefined ? String(preset.min) : '';
                      const pMax = preset.max !== undefined ? String(preset.max) : '';
                      const isSelected = minPrice === pMin && maxPrice === pMax;

                      return (
                        <TouchableOpacity testID="btn-filtermodal-361"
                          key={idx}
                          onPress={() => selectPricePreset(preset)}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: isSelected ? colors.primary : colors.background,
                              borderColor: isSelected ? colors.primary : colors.border,
                            },
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`Price preset ${preset.label}`}
                          accessibilityState={{ selected: isSelected }}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              { color: isSelected ? '#ffffff' : colors.text },
                            ]}
                          >
                            {preset.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Custom Min / Max inputs */}
                  <View style={styles.inputsRow}>
                    <View
                      style={[
                        styles.inputContainer,
                        { backgroundColor: colors.background, borderColor: colors.border },
                      ]}
                    >
                      <Text style={[styles.inputPrefix, { color: colors.mutedText }]}>
                        {currencySymbol}
                      </Text>
                      <TextInput
                        style={[styles.numericInput, { color: colors.text }]}
                        placeholder="Min price"
                        placeholderTextColor={colors.mutedText}
                        keyboardType="numeric"
                        value={minPrice}
                        onChangeText={setMinPrice}
                        accessibilityLabel="Minimum price"
                      />
                    </View>

                    <Text style={[styles.rangeSeparator, { color: colors.mutedText }]}>–</Text>

                    <View
                      style={[
                        styles.inputContainer,
                        { backgroundColor: colors.background, borderColor: colors.border },
                      ]}
                    >
                      <Text style={[styles.inputPrefix, { color: colors.mutedText }]}>
                        {currencySymbol}
                      </Text>
                      <TextInput
                        style={[styles.numericInput, { color: colors.text }]}
                        placeholder="Max price"
                        placeholderTextColor={colors.mutedText}
                        keyboardType="numeric"
                        value={maxPrice}
                        onChangeText={setMaxPrice}
                        accessibilityLabel="Maximum price"
                      />
                    </View>
                  </View>
                </View>

                {/* 4. Duration */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Duration</Text>
                  <View style={styles.chipRow}>
                    {DURATION_OPTIONS.map((d) => {
                      const isSelected = duration === d.value;
                      return (
                        <TouchableOpacity testID="btn-filtermodal-441"
                          key={d.value || 'all-duration'}
                          onPress={() => selectDuration(d.value)}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: isSelected ? colors.primary : colors.background,
                              borderColor: isSelected ? colors.primary : colors.border,
                            },
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`Duration ${d.label}`}
                          accessibilityState={{ selected: isSelected }}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              { color: isSelected ? '#ffffff' : colors.text },
                            ]}
                          >
                            {d.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* 5. Difficulty */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Difficulty</Text>
                  <View style={styles.chipRow}>
                    {DIFFICULTY_OPTIONS.map((diff) => {
                      const isSelected = difficulty === diff.value;
                      return (
                        <TouchableOpacity testID="btn-filtermodal-476"
                          key={diff.value || 'all-diff'}
                          onPress={() => selectDifficulty(diff.value)}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: isSelected ? colors.primary : colors.background,
                              borderColor: isSelected ? colors.primary : colors.border,
                            },
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`Difficulty ${diff.label}`}
                          accessibilityState={{ selected: isSelected }}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              { color: isSelected ? '#ffffff' : colors.text },
                            ]}
                          >
                            {diff.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>

              {/* Modal Footer */}
              <View style={[styles.footer, { borderTopColor: colors.border }]}>
                <TouchableOpacity testID="btn-navigate"
                  onPress={handleApply}
                  style={[styles.applyButton, { backgroundColor: colors.primary }]}
                  accessibilityRole="button"
                  accessibilityLabel="Apply filters"
                >
                  <Text style={styles.applyButtonText}>
                    {activeCount > 0 ? `Apply Filters (${activeCount})` : 'Show Results'}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '85%',
    minHeight: '60%',
  },
  handleWrapper: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
  resultsCount: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  resetButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  resetText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    minHeight: 40,
  },
  chipText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  inputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    minHeight: 44,
  },
  inputPrefix: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    marginRight: 4,
  },
  numericInput: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    paddingVertical: Platform.OS === 'ios' ? SPACING.sm : 6,
  },
  rangeSeparator: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
  },
  applyButton: {
    minHeight: 48,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
});

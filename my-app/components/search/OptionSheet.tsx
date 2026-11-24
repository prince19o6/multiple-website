/**
 * components/search/OptionSheet.tsx
 *
 * Generic option selection bottom sheet.
 * Supports:
 *   - Single select or multi-select chips/list
 *   - Search input filter
 *   - Custom icons or subtitles per option
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import SelectionSheet from './SelectionSheet';
import { useColors, useIsDark } from '@/store/ThemeContext';
import { RADIUS, FONT_SIZE } from '@/constants/theme';

export interface SheetOption {
  label: string;
  value: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  badge?: string;
}

export interface OptionSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  options: (string | SheetOption)[];
  selectedValue?: string;
  selectedValues?: string[];
  isMultiSelect?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSelect?: (val: string) => void;
  onSelectMultiple?: (vals: string[]) => void;
}

export default function OptionSheet({
  visible,
  onClose,
  title,
  subtitle,
  options,
  selectedValue,
  selectedValues = [],
  isMultiSelect = false,
  searchable = false,
  searchPlaceholder = 'Search...',
  onSelect,
  onSelectMultiple,
}: OptionSheetProps) {
  const colors = useColors();
  const isDark = useIsDark();
  const [searchText, setSearchText] = useState('');
  const [multiSelected, setMultiSelected] = useState<string[]>(selectedValues);

  // Normalize options
  const normalizedOptions: SheetOption[] = useMemo(() => {
    return options.map((opt) =>
      typeof opt === 'string' ? { label: opt, value: opt } : opt
    );
  }, [options]);

  const filtered = useMemo(() => {
    if (!searchText.trim()) return normalizedOptions;
    const q = searchText.toLowerCase();
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.subtitle?.toLowerCase().includes(q)
    );
  }, [normalizedOptions, searchText]);

  const handleSelectSingle = (val: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    if (onSelect) {
      onSelect(val);
    }
    onClose();
  };

  const handleToggleMulti = (val: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setMultiSelected((prev) =>
      prev.includes(val) ? prev.filter((item) => item !== val) : [...prev, val]
    );
  };

  const handleDone = () => {
    if (isMultiSelect && onSelectMultiple) {
      onSelectMultiple(multiSelected);
    }
    onClose();
  };

  return (
    <SelectionSheet
      visible={visible}
      onClose={onClose}
      title={title}
      subtitle={
        subtitle ||
        (isMultiSelect
          ? `${multiSelected.length} selected`
          : undefined)
      }
      onDone={handleDone}
      onReset={
        isMultiSelect
          ? () => setMultiSelected([])
          : undefined
      }
    >
      <View style={styles.container}>
        {/* Search Bar */}
        {searchable && (
          <View
            style={[
              styles.searchBarWrap,
              {
                backgroundColor: isDark ? colors.surface : '#f1f5f9',
                borderColor: isDark ? colors.border : '#e2e8f0',
              },
            ]}
          >
            <Ionicons name="search" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder={searchPlaceholder}
              placeholderTextColor="#94a3b8"
              style={[styles.searchInput, { color: colors.heading }]}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={16} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Options List */}
        <ScrollView contentContainerStyle={styles.scrollList} keyboardShouldPersistTaps="handled">
          {filtered.map((item) => {
            const isSelected = isMultiSelect
              ? multiSelected.includes(item.value)
              : selectedValue === item.value;

            return (
              <TouchableOpacity
                key={item.value}
                onPress={() =>
                  isMultiSelect
                    ? handleToggleMulti(item.value)
                    : handleSelectSingle(item.value)
                }
                activeOpacity={0.7}
                style={[
                  styles.optionRow,
                  {
                    backgroundColor: isSelected
                      ? colors.primary + '15'
                      : isDark
                      ? colors.surface
                      : '#ffffff',
                    borderColor: isSelected ? colors.primary : isDark ? colors.border : '#f1f5f9',
                  },
                ]}
              >
                {item.icon && (
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={isSelected ? colors.primary : '#64748b'}
                    style={{ marginRight: 10 }}
                  />
                )}

                <View style={styles.optionTextColumn}>
                  <Text
                    style={[
                      styles.optionLabel,
                      {
                        color: isSelected ? colors.primary : colors.heading,
                        fontWeight: isSelected ? '700' : '600',
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.subtitle && (
                    <Text style={styles.optionSubtitle}>{item.subtitle}</Text>
                  )}
                </View>

                {item.badge && (
                  <View style={[styles.badgePill, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.badgeText, { color: colors.primary }]}>{item.badge}</Text>
                  </View>
                )}

                <View
                  style={[
                    isMultiSelect ? styles.checkboxBox : styles.radioCircle,
                    isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                    !isSelected && { borderColor: '#cbd5e1' },
                  ]}
                >
                  {isSelected && (
                    <Ionicons
                      name={isMultiSelect ? 'checkmark' : 'ellipse'}
                      size={isMultiSelect ? 13 : 8}
                      color="#ffffff"
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          {filtered.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No matching options found</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SelectionSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 0,
  },
  scrollList: {
    gap: 6,
    paddingBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  optionTextColumn: {
    flex: 1,
  },
  optionLabel: {
    fontSize: FONT_SIZE.sm || 14,
  },
  optionSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
});

/**
 * components/LanguageModal.tsx
 *
 * Interactive Multi-Language Selection Modal.
 *
 * Features:
 *   - Slide-up bottom sheet with search filtering
 *   - Native script typography (Gujarati, Hindi, Thai, Vietnamese, Arabic)
 *   - Tenant-based recommendation badges (e.g. GujjuTours Recommended for Gujarati)
 *   - Instant reactive application and persistence
 *   - 44px minimum touch targets and zero TypeScript `any`
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useSite, useSiteConfig } from '@/store/SiteConfigContext';
import { useLanguage } from '@/context/LanguageContext';
import { type LanguageOption } from '@/constants/translations';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';

export default function LanguageModal() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const config = useSiteConfig();
  const { siteId, siteName } = useSite();
  const headingFontFamily = getHeadingFontFamily(config);

  const {
    language: activeCode,
    supportedLanguages,
    setLanguage,
    isLanguageModalVisible,
    closeLanguageModal,
    t,
  } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');

  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) return supportedLanguages;
    const q = searchQuery.toLowerCase().trim();
    return supportedLanguages.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q)
    );
  }, [supportedLanguages, searchQuery]);

  const handleSelect = async (code: LanguageOption['code']) => {
    try {
      Haptics.selectionAsync();
    } catch {}
    await setLanguage(code);
    closeLanguageModal();
  };

  const getRecommendedLabel = (lang: LanguageOption): string | null => {
    if (!lang.recommendedBrand) return null;
    const brand = siteId === 'website2' ? 'tripgoasia' : siteId === 'website3' ? 'technoheaven' : siteId;
    if (lang.recommendedBrand === brand) {
      return `${siteName} Recommended`;
    }
    return null;
  };

  return (
    <Modal
      visible={isLanguageModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={closeLanguageModal}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* ─── Header ─── */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.heading, fontFamily: headingFontFamily }]}>
                {t('profile_language', 'App Language')}
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedText }]}>
                Choose your preferred language for tours, itineraries & vouchers
              </Text>
            </View>

            <TouchableOpacity testID="btn-close"
              onPress={closeLanguageModal}
              style={styles.closeBtn}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Close language selector"
            >
              <Ionicons name="close" size={22} color={colors.heading} />
            </TouchableOpacity>
          </View>

          {/* ─── Search Bar ─── */}
          <View style={[styles.searchBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Ionicons name="search" size={17} color={colors.mutedText} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: colors.heading }]}
              placeholder="Search languages (e.g. Gujarati, Thai, العربية)..."
              placeholderTextColor={colors.mutedText}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity testID="btn-close" accessibilityLabel="Close" onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                <Ionicons name="close-circle" size={16} color={colors.mutedText} />
              </TouchableOpacity>
            )}
          </View>

          {/* ─── Languages List ─── */}
          <ScrollView
            style={styles.list}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: Math.max(insets.bottom, 20) },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {filteredLanguages.map((item) => {
              const isSelected = item.code === activeCode;
              const recLabel = getRecommendedLabel(item);

              return (
                <TouchableOpacity testID="btn-languagemodal-144"
                  key={item.code}
                  style={[
                    styles.langCard,
                    {
                      backgroundColor: isSelected ? `${colors.primary}0c` : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleSelect(item.code)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name} (${item.nativeName})`}
                >
                  <View style={styles.cardLeft}>
                    <Text style={styles.flagEmoji}>{item.flag}</Text>
                    <View>
                      <View style={styles.nameRow}>
                        <Text
                          style={[
                            styles.nativeName,
                            { color: isSelected ? colors.primary : colors.heading },
                          ]}
                        >
                          {item.nativeName}
                        </Text>
                        {recLabel && (
                          <View style={[styles.recBadge, { backgroundColor: `${colors.primary}18` }]}>
                            <Text style={[styles.recBadgeText, { color: colors.primary }]}>
                              {recLabel}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.englishName, { color: colors.mutedText }]}>
                        {item.name} ({item.code.toUpperCase()})
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.checkCircle,
                      {
                        backgroundColor: isSelected ? colors.primary : 'transparent',
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    {isSelected && <Ionicons name="checkmark" size={14} color="#ffffff" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 1,
    maxHeight: '75%',
    minHeight: '45%',
    ...SHADOW.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZE.lg + 2,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
    maxWidth: 290,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    height: 40,
  },
  clearSearchBtn: {
    padding: 4,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
    gap: SPACING.sm,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    minHeight: 58,
    ...SHADOW.sm,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  flagEmoji: {
    fontSize: 26,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nativeName: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  englishName: {
    fontSize: 11,
    marginTop: 1,
    fontWeight: '500',
  },
  recBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  recBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});

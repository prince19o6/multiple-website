/**
 * components/CurrencyModal.tsx
 *
 * Luxury Multi-Currency Selector Modal.
 * Displays all supported platform currencies with live exchange rates,
 * national flags, active indicator badges, and 44px+ touch targets.
 * Works seamlessly with CurrencyContext and active website branding.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useSiteConfig } from '@/store/SiteConfigContext';
import { useCurrency, type CurrencyDefinition } from '@/context/CurrencyContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';

interface CurrencyModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function CurrencyModal({ visible, onClose }: CurrencyModalProps) {
  const colors = useColors();
  const config = useSiteConfig();
  const { currentCurrency, currencies, setCurrency } = useCurrency();
  const headingFontFamily = getHeadingFontFamily(config);

  const handleSelect = async (c: CurrencyDefinition) => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Haptics fallback
    }
    await setCurrency(c.code);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.heading, fontFamily: headingFontFamily }]}>
                Display Currency
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedText }]}>
                Prices across all expeditions will convert in real time
              </Text>
            </View>
            <TouchableOpacity testID="btn-close"
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close currency modal"
            >
              <Ionicons name="close" size={22} color={colors.heading} />
            </TouchableOpacity>
          </View>

          {/* Currencies List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          >
            {currencies.map((c) => {
              const isSelected = currentCurrency.code === c.code;

              return (
                <TouchableOpacity testID="btn-currencymodal-86"
                  key={c.code}
                  style={[
                    styles.currencyRow,
                    {
                      backgroundColor: isSelected ? `${colors.primary}12` : colors.background,
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderWidth: isSelected ? 1.5 : 1,
                    },
                  ]}
                  onPress={() => handleSelect(c)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${c.name} (${c.code})`}
                >
                  {/* Flag Icon */}
                  <View style={styles.flagBox}>
                    <Text style={styles.flagText}>{c.flag}</Text>
                  </View>

                  {/* Currency Name & Rate */}
                  <View style={styles.infoCol}>
                    <View style={styles.codeRow}>
                      <Text
                        style={[
                          styles.codeText,
                          {
                            color: isSelected ? colors.primary : colors.heading,
                            fontWeight: isSelected ? '800' : '600',
                          },
                        ]}
                      >
                        {c.code}
                      </Text>
                      <Text style={[styles.symbolPill, { color: colors.mutedText }]}>
                        ({c.symbol.trim()})
                      </Text>
                    </View>
                    <Text style={[styles.nameText, { color: colors.mutedText }]}>
                      {c.name}
                    </Text>
                  </View>

                  {/* Exchange Rate Badge */}
                  <View style={styles.rateCol}>
                    <Text style={[styles.rateText, { color: colors.mutedText }]}>
                      {c.code === 'USD' ? 'Base Currency' : `1 USD ≈ ${c.rate} ${c.code}`}
                    </Text>
                  </View>

                  {/* Selection Checkmark */}
                  <View style={styles.radioBox}>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                    ) : (
                      <View style={[styles.radioOutline, { borderColor: colors.border }]} />
                    )}
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
  content: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 1,
    padding: SPACING.lg,
    maxHeight: '80%',
    ...SHADOW.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
    maxWidth: 280,
  },
  closeBtn: {
    padding: 6,
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    gap: SPACING.sm,
    paddingBottom: SPACING.xl,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    minHeight: 56,
  },
  flagBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm + 4,
  },
  flagText: {
    fontSize: 22,
  },
  infoCol: {
    flex: 1,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  codeText: {
    fontSize: FONT_SIZE.sm + 1,
  },
  symbolPill: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
  },
  nameText: {
    fontSize: 11,
    marginTop: 1,
  },
  rateCol: {
    alignItems: 'flex-end',
    marginRight: SPACING.sm,
  },
  rateText: {
    fontSize: 10,
    fontWeight: '500',
  },
  radioBox: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOutline: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
  },
});

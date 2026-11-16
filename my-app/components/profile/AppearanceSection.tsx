/**
 * components/profile/AppearanceSection.tsx
 *
 * Dedicated appearance and display theme mode selector for the mobile Profile tab.
 * Allows switching between Light (default pure white #ffffff theme), Dark, and System modes.
 * Preferences are persisted with tenant isolation via ThemeContext and storeSet.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors, useAppearanceMode } from '@/store/ThemeContext';
import { RADIUS, SPACING, FONT_SIZE } from '@/constants/theme';

export function AppearanceSection() {
  const colors = useColors();
  const { appearanceMode, setAppearanceMode } = useAppearanceMode();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionHeading, { color: colors.mutedText }]}>
        APPEARANCE & DISPLAY THEME
      </Text>

      <View style={[styles.menuGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={{ padding: SPACING.md }}>
          <Text style={[styles.menuItemText, { color: colors.heading, marginBottom: 2 }]}>
            Theme Mode
          </Text>
          <Text style={{ fontSize: 11, color: colors.mutedText, marginBottom: SPACING.sm }}>
            Default is clean white theme. Switch to dark mode or match device settings.
          </Text>

          <View style={styles.appearanceRow}>
            {(
              [
                { key: 'light', label: 'Light', icon: 'sunny-outline' },
                { key: 'dark', label: 'Dark', icon: 'moon-outline' },
                { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
              ] as const
            ).map((opt) => {
              const isSelected = appearanceMode === opt.key;
              return (
                <TouchableOpacity testID="btn-appearancesection-45"
                  key={opt.key}
                  style={[
                    styles.appearanceChip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.background,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch {}
                    setAppearanceMode(opt.key);
                  }}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Set appearance to ${opt.label}`}
                >
                  <Ionicons
                    name={opt.icon}
                    size={15}
                    color={isSelected ? '#ffffff' : colors.mutedText}
                    style={{ marginRight: 5 }}
                  />
                  <Text
                    style={[
                      styles.appearanceChipText,
                      { color: isSelected ? '#ffffff' : colors.heading },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

export default AppearanceSection;

const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeading: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  menuGroup: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItemText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
  },
  appearanceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  appearanceChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    minHeight: 44,
  },
  appearanceChipText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
});


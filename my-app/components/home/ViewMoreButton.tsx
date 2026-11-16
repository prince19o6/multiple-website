/**
 * components/home/ViewMoreButton.tsx
 *
 * Reusable toggle button for expanding/collapsing sections
 * with chevron icon and 44px+ minimum touch target.
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { RADIUS, FONT_SIZE } from '@/constants/theme';

export interface ViewMoreButtonProps {
  isExpanded: boolean;
  onPress: () => void;
  moreText?: string;
  lessText?: string;
}

export function ViewMoreButton({
  isExpanded,
  onPress,
  moreText = 'View more',
  lessText = 'Show less',
}: ViewMoreButtonProps) {
  const colors = useColors();

  const handlePress = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Ignored
    }
    onPress();
  };

  return (
    <TouchableOpacity testID="btn-press"
      style={[
        styles.button,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={isExpanded ? lessText : moreText}
    >
      <Text style={[styles.text, { color: colors.primary }]}>
        {isExpanded ? lessText : moreText}
      </Text>
      <Ionicons
        name={isExpanded ? 'chevron-up' : 'chevron-down'}
        size={16}
        color={colors.primary}
        style={{ marginLeft: 6 }}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 20,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignSelf: 'center',
    marginVertical: 12,
  },
  text: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '700',
  },
});

/**
 * components/NavItem.tsx
 *
 * Reusable drawer menu item component.
 * Dynamic theming based on active site and active navigation route.
 * Accessible with 44px+ minimum touch target.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  type GestureResponderEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { RADIUS, SPACING, FONT_SIZE } from '@/constants/theme';

export interface NavItemProps {
  /** Display label for the item */
  label: string;
  /** Ionicons icon glyph name */
  icon: keyof typeof Ionicons.glyphMap;
  /** Whether this item matches the current active route */
  isActive: boolean;
  /** Press handler */
  onPress: (event: GestureResponderEvent) => void;
  /** Optional target route path for reference */
  path?: string;
  /** Optional badge text (e.g. "Admin", "Active") */
  badge?: string;
  /** Optional custom heading font family */
  fontFamily?: string;
  /** Accessibility hint */
  accessibilityHint?: string;
}

export default function NavItem({
  label,
  icon,
  isActive,
  onPress,
  badge,
  fontFamily,
  accessibilityHint,
}: NavItemProps) {
  const colors = useColors();

  return (
    <TouchableOpacity testID="btn-press"
      style={[
        styles.container,
        isActive
          ? {
              backgroundColor: `${colors.primary}18`,
              borderColor: `${colors.primary}33`,
            }
          : {
              backgroundColor: 'transparent',
              borderColor: 'transparent',
            },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected: isActive }}
    >
      {/* Active Indicator Bar */}
      {isActive && (
        <View
          style={[
            styles.activeIndicator,
            { backgroundColor: colors.primary },
          ]}
        />
      )}

      {/* Icon Container */}
      <View
        style={[
          styles.iconBox,
          isActive
            ? { backgroundColor: `${colors.primary}22` }
            : { backgroundColor: `${colors.mutedText}12` },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={isActive ? colors.primary : colors.mutedText}
        />
      </View>

      {/* Label Text */}
      <Text
        style={[
          styles.label,
          {
            color: isActive ? colors.primary : colors.heading,
            fontWeight: isActive ? '700' : '600',
            fontFamily: fontFamily || undefined,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>

      {/* Optional Badge */}
      {badge && (
        <View
          style={[
            styles.badge,
            isActive
              ? { backgroundColor: colors.primary }
              : { backgroundColor: `${colors.mutedText}24` },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: isActive ? '#ffffff' : colors.mutedText },
            ]}
          >
            {badge}
          </Text>
        </View>
      )}

      {/* Chevron */}
      <Ionicons
        name="chevron-forward"
        size={16}
        color={isActive ? colors.primary : colors.border}
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 3.5,
    borderRadius: RADIUS.full,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm + 4,
  },
  label: {
    flex: 1,
    fontSize: FONT_SIZE.base,
    letterSpacing: -0.2,
  },
  badge: {
    paddingHorizontal: SPACING.xs + 3,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    marginRight: SPACING.xs,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  chevron: {
    marginLeft: SPACING.xs,
  },
});

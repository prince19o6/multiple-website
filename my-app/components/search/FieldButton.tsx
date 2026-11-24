/**
 * components/search/FieldButton.tsx
 *
 * Reusable pressable search field button for Expo Mobile.
 * Shows label, value, leading icon, trailing chevron/calendar icon,
 * and handles error/shake state with theme colors and 44px+ touch targets.
 */

import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Animated,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useIsDark } from '@/store/ThemeContext';
import { RADIUS, FONT_SIZE } from '@/constants/theme';

export interface FieldButtonProps {
  label: string;
  value?: string;
  placeholder?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  error?: string | boolean;
  style?: StyleProp<ViewStyle>;
  flex?: number;
  badge?: string;
  testID?: string;
}

export default function FieldButton({
  label,
  value,
  placeholder = 'Select...',
  icon,
  rightIcon = 'chevron-down',
  onPress,
  error,
  style,
  flex,
  badge,
  testID,
}: FieldButtonProps) {
  const colors = useColors();
  const isDark = useIsDark();
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  }, [error, shakeAnim]);

  const hasValue = Boolean(value && value.trim().length > 0);
  const isError = Boolean(error);

  return (
    <Animated.View
      style={[
        { transform: [{ translateX: shakeAnim }] },
        flex !== undefined ? { flex } : null,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.75}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${hasValue ? value : placeholder}`}
        style={[
          styles.container,
          {
            backgroundColor: isDark ? colors.surface : '#f8f9fa',
            borderColor: isError
              ? '#ef4444'
              : isDark
              ? colors.border
              : '#e2e8f0',
          },
          style,
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={isError ? '#ef4444' : colors.primary}
            style={styles.leadingIcon}
          />
        )}

        <View style={styles.textColumn}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>{label}</Text>
            {badge && (
              <View style={[styles.badge, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.badgeText, { color: colors.primary }]}>{badge}</Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.valueText,
              {
                color: hasValue ? colors.heading : '#94a3b8',
                fontWeight: hasValue ? '700' : '500',
              },
            ]}
            numberOfLines={1}
          >
            {hasValue ? value : placeholder}
          </Text>
        </View>

        {rightIcon && (
          <Ionicons
            name={rightIcon}
            size={16}
            color="#94a3b8"
            style={styles.trailingIcon}
          />
        )}
      </TouchableOpacity>

      {typeof error === 'string' && error.length > 0 && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 56,
    borderRadius: RADIUS.lg,
    borderWidth: 1.2,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  leadingIcon: {
    marginRight: 10,
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#64748b',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  valueText: {
    fontSize: FONT_SIZE.sm,
    letterSpacing: -0.2,
  },
  trailingIcon: {
    marginLeft: 6,
  },
  errorText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600',
    marginTop: 2,
    marginLeft: 4,
  },
});

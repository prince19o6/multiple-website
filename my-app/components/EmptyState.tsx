/**
 * components/EmptyState.tsx
 *
 * Polished empty state component displayed when a list or query returns no items.
 * Shows an icon, title, description, and optional action/reset button.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { RADIUS, SPACING, FONT_SIZE } from '@/constants/theme';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon = 'compass-outline',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.iconBox, { backgroundColor: `${colors.primary}15` }]}>
        <Ionicons name={icon} size={42} color={colors.primary} />
      </View>

      <Text style={[styles.title, { color: colors.heading }]}>{title}</Text>

      {description && (
        <Text style={[styles.description, { color: colors.mutedText }]}>
          {description}
        </Text>
      )}

      {actionLabel && onAction && (
        <TouchableOpacity testID="btn-action" accessibilityLabel="Action"
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={onAction}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.md,
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.md + 2,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: FONT_SIZE.xs + 1,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: SPACING.md,
  },
  button: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
});

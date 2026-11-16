/**
 * components/ErrorScreen.tsx
 *
 * Full-screen or inline error state with retry action.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { RADIUS, SPACING, FONT_SIZE } from '@/constants/theme';

interface ErrorScreenProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  fullScreen?: boolean;
}

export default function ErrorScreen({
  title = 'Something went wrong',
  message = 'We encountered an error while loading the data. Please try again.',
  onRetry,
  fullScreen = true,
}: ErrorScreenProps) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.container,
        fullScreen && styles.fullScreen,
        { backgroundColor: colors.background },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.primary} />
      </View>

      <Text style={[styles.title, { color: colors.heading }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.mutedText }]}>{message}</Text>

      {onRetry && (
        <TouchableOpacity testID="btn-refresh-outline" accessibilityLabel="refresh outline"
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={onRetry}
          activeOpacity={0.85}
        >
          <Ionicons name="refresh-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  message: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
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

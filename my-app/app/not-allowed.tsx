/**
 * app/not-allowed.tsx
 *
 * Screen displayed when an invalid, disabled, or non-whitelisted site is requested.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, FONT_SIZE } from '@/constants/theme';

export default function NotAllowedScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="lock-closed-outline" size={48} color="#ef4444" />
      </View>
      <Text style={styles.title}>Access Restricted</Text>
      <Text style={styles.message}>
        This website brand is not available or is currently deactivated in this multi-tenant engine.
      </Text>

      <TouchableOpacity testID="btn-choose-available-brand" accessibilityLabel="Choose Available Brand"
        style={styles.btn}
        onPress={() => router.replace('/site-switcher')}
        activeOpacity={0.85}
      >
        <Text style={styles.btnText}>Choose Available Brand</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.full,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.xl + 2,
    fontWeight: '800',
    color: '#111827',
    marginBottom: SPACING.xs,
  },
  message: {
    fontSize: FONT_SIZE.sm,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
    maxWidth: 300,
  },
  btn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  btnText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
});

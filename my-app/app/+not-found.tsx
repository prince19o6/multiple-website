/**
 * app/+not-found.tsx
 *
 * 404 Route Not Found screen.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING, FONT_SIZE } from '@/constants/theme';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Ionicons name="help-buoy-outline" size={64} color="#64748b" style={{ marginBottom: SPACING.md }} />
      <Text style={styles.title}>404 - Page Not Found</Text>
      <Text style={styles.message}>
        The screen you are looking for does not exist or has been relocated.
      </Text>

      <TouchableOpacity testID="btn-return-to-home" accessibilityLabel="Return to Home"
        style={styles.btn}
        onPress={() => router.replace('/(tabs)')}
        activeOpacity={0.85}
      >
        <Text style={styles.btnText}>Return to Home</Text>
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
  title: {
    fontSize: FONT_SIZE.xl + 2,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: SPACING.xs,
  },
  message: {
    fontSize: FONT_SIZE.sm,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
    maxWidth: 280,
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

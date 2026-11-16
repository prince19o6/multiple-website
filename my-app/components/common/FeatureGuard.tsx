import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFeature } from '@/hooks/useFeature';
import { useColors } from '@/store/ThemeContext';
import { SPACING, RADIUS, FONT_SIZE } from '@/constants/theme';

interface FeatureGuardProps {
  featureId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGuard({ featureId, children, fallback }: FeatureGuardProps) {
  const router = useRouter();
  const colors = useColors();
  const { isEnabled, label } = useFeature(featureId);

  if (!isEnabled) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="construct-outline" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            {label} Not Available
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedText }]}>
            This feature is not enabled for this destination. Check back later or explore other experiences.
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => router.replace('/(tabs)')}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Return to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    padding: SPACING.xl,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    alignItems: 'center',
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  button: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
});


/**
 * components/ConciergeFloatingPill.tsx
 *
 * Compact, tactile floating concierge trigger pill with live online status.
 * Mounted on Tour Details and Booking Confirmation screens.
 *
 * Features:
 *   - Live specialist avatar with pulsing online indicator
 *   - Automatic tour context injection (tourId, tourName)
 *   - Tactile haptic feedback
 *   - Zero TypeScript `any`
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useConcierge } from '@/context/ConciergeContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';

interface ConciergeFloatingPillProps {
  tourId?: number;
  tourName?: string;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

export default function ConciergeFloatingPill({
  tourId,
  tourName,
  style,
  compact = false,
}: ConciergeFloatingPillProps) {
  const colors = useColors();
  const { openConcierge, specialist } = useConcierge();

  const handlePress = () => {
    try {
      Haptics.selectionAsync();
    } catch {
      // Haptics fallback
    }
    openConcierge({ tourId, tourName });
  };

  if (compact) {
    return (
      <TouchableOpacity testID="btn-press"
        style={[
          styles.compactPill,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
          style,
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Chat with travel specialist ${specialist.specialistName}`}
      >
        <View style={styles.avatarBox}>
          <Image source={{ uri: specialist.avatarUrl }} style={styles.compactAvatar} />
          <View style={[styles.compactDot, { borderColor: colors.surface }]} />
        </View>
        <Ionicons name="chatbubbles" size={14} color={colors.primary} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity testID="btn-press"
      style={[
        styles.fullPill,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Chat with travel specialist ${specialist.specialistName}`}
    >
      <View style={styles.avatarBox}>
        <Image source={{ uri: specialist.avatarUrl }} style={styles.avatar} />
        <View style={[styles.onlineDot, { borderColor: colors.surface }]} />
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.specialistLabel, { color: colors.heading }]} numberOfLines={1}>
          {specialist.specialistName}
        </Text>
        <Text style={[styles.actionPrompt, { color: colors.mutedText }]} numberOfLines={1}>
          Ask Specialist · 24/7 Concierge
        </Text>
      </View>

      <View style={[styles.chatIconCircle, { backgroundColor: `${colors.primary}15` }]}>
        <Ionicons name="chatbubble-ellipses" size={15} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fullPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    ...SHADOW.md,
  },
  avatarBox: {
    position: 'relative',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
    borderWidth: 1.5,
  },
  textContainer: {
    marginLeft: 10,
    marginRight: 12,
  },
  specialistLabel: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '800',
  },
  actionPrompt: {
    fontSize: 10,
    marginTop: 1,
  },
  chatIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    ...SHADOW.sm,
  },
  compactAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  compactDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    borderWidth: 1,
  },
});

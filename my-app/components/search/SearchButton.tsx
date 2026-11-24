/**
 * components/search/SearchButton.tsx
 *
 * Full-width CTA button for search forms in Expo Mobile.
 * Includes loading spinner, haptic feedback, theme color styling,
 * 48px+ min touch target height, and disabled state.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { RADIUS, FONT_SIZE, SHADOW } from '@/constants/theme';

export interface SearchButtonProps {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export default function SearchButton({
  title,
  icon,
  onPress,
  loading = false,
  disabled = false,
  style,
  testID,
}: SearchButtonProps) {
  const colors = useColors();

  const handlePress = () => {
    if (disabled || loading) return;

    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    }
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={[
        styles.button,
        { backgroundColor: colors.primary },
        (disabled || loading) && styles.disabledButton,
        SHADOW.md,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#ffffff" style={styles.spinner} />
      ) : icon ? (
        <Ionicons name={icon} size={20} color="#ffffff" style={styles.icon} />
      ) : null}

      <Text style={styles.titleText}>
        {loading ? 'Searching...' : title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.65,
  },
  spinner: {
    marginRight: 8,
  },
  icon: {
    marginRight: 8,
  },
  titleText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.md || 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});

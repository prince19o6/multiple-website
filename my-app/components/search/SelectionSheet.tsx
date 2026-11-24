/**
 * components/search/SelectionSheet.tsx
 *
 * Base bottom sheet component for Expo Mobile.
 * Includes drag handle, header actions (Done, Reset), backdrop tap-to-dismiss,
 * swipe-down pan responder gesture to close, and KeyboardAvoidingView.
 */

import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors, useIsDark } from '@/store/ThemeContext';
import { RADIUS, FONT_SIZE } from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface SelectionSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  onDone?: () => void;
  onReset?: () => void;
  doneLabel?: string;
  resetLabel?: string;
  children: React.ReactNode;
  maxHeight?: number | string;
}

export default function SelectionSheet({
  visible,
  onClose,
  title,
  subtitle,
  onDone,
  onReset,
  doneLabel = 'Done',
  resetLabel = 'Reset',
  children,
  maxHeight = SCREEN_HEIGHT * 0.85,
}: SelectionSheetProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isDark = useIsDark();

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      if (Platform.OS !== 'web') {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {}
      }
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          damping: 24,
          stiffness: 240,
          mass: 0.9,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacity, translateY]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: SCREEN_HEIGHT, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      onClose();
    });
  };

  const handleDone = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    }
    if (onDone) {
      onDone();
    }
    handleDismiss();
  };

  // Pan responder to allow swiping down on handle to close
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 0.8) {
          handleDismiss();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            damping: 20,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlayContainer}
      >
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={handleDismiss}>
          <Animated.View style={[styles.backdrop, { opacity }]} />
        </TouchableWithoutFeedback>

        {/* Bottom Sheet Card */}
        <Animated.View
          style={[
            styles.sheetCard,
            {
              backgroundColor: isDark ? colors.surface : '#ffffff',
              maxHeight: typeof maxHeight === 'number' ? maxHeight : SCREEN_HEIGHT * 0.85,
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Top Handle Container */}
          <View {...panResponder.panHandlers} style={styles.handleWrap}>
            <View
              style={[
                styles.handleBar,
                { backgroundColor: isDark ? '#475569' : '#cbd5e1' },
              ]}
            />
          </View>

          {/* Header Bar */}
          <View style={styles.headerRow}>
            <View style={styles.titleWrap}>
              <Text
                style={[styles.headerTitle, { color: colors.heading }]}
                numberOfLines={1}
              >
                {title}
              </Text>
              {subtitle && (
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {subtitle}
                </Text>
              )}
            </View>

            <View style={styles.actionButtonsRow}>
              {onReset && (
                <TouchableOpacity
                  onPress={onReset}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.resetButton}
                >
                  <Text style={styles.resetButtonText}>{resetLabel}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleDone}
                style={[
                  styles.doneButton,
                  { backgroundColor: colors.primary },
                ]}
                activeOpacity={0.8}
              >
                <Text style={styles.doneButtonText}>{doneLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Content Area */}
          <View style={styles.contentWrap}>{children}</View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  sheetCard: {
    borderTopLeftRadius: RADIUS.xl || 24,
    borderTopRightRadius: RADIUS.xl || 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 24,
  },
  handleWrap: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148, 163, 184, 0.25)',
  },
  titleWrap: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg || 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resetButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  doneButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  contentWrap: {
    flexShrink: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});

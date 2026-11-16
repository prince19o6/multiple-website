/**
 * components/ReviewModal.tsx
 *
 * Interactive traveler review and 5-star rating submission modal.
 * Allows verified guests to submit detailed feedback directly into
 * the tour's MongoDB collection with instant average rating recalculation.
 *
 * Features:
 *   - Interactive 5-star selector with dynamic emotion badge and haptic feedback
 *   - Auto-prefill for authenticated traveler identity
 *   - Minimum character validation and live character count
 *   - Optimistic invalidation and celebration state on completion
 *   - 44px min touch targets and accessibility labels
 *   - Zero TypeScript any
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/store/ThemeContext';
import { useSiteConfig, useSite } from '@/store/SiteConfigContext';
import { useAuth } from '@/context/AuthContext';
import { submitTourReview } from '@/services/api';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';
import { RADIUS, SPACING, FONT_SIZE } from '@/constants/theme';
import type { GuestReview } from '@/types';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  tourIdOrSlug: string | number;
  tourName: string;
  onReviewSubmitted?: (review: GuestReview) => void;
}

const RATING_DESCRIPTIONS: Record<number, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  5: { label: 'Exceptional! Beyond expectations', icon: 'sparkles' },
  4: { label: 'Very Good journey', icon: 'thumbs-up' },
  3: { label: 'Good / Average experience', icon: 'checkmark-circle' },
  2: { label: 'Could be better', icon: 'alert-circle' },
  1: { label: 'Disappointing', icon: 'close-circle' },
};

export default function ReviewModal({
  visible,
  onClose,
  tourIdOrSlug,
  tourName,
  onReviewSubmitted,
}: ReviewModalProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const config = useSiteConfig();
  const { siteId } = useSite();
  const { user } = useAuth();
  const headingFontFamily = getHeadingFontFamily(config);

  const [rating, setRating] = useState<number>(5);
  const [author, setAuthor] = useState<string>(user?.name || '');
  const [text, setText] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setSubmitted(false);
      setErrorMsg(null);
      if (user?.name && !author) {
        setAuthor(user.name);
      }
    }
  }, [visible, user]);

  const handleStarPress = (val: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Haptics fallback
    }
    setRating(val);
  };

  const handleSubmit = async () => {
    const trimmedAuthor = author.trim() || user?.name || 'Verified Traveler';
    const trimmedText = text.trim();

    if (trimmedText.length < 10) {
      setErrorMsg('Please write at least 10 characters to describe your experience.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const response = await submitTourReview(
        tourIdOrSlug,
        {
          author: trimmedAuthor,
          rating,
          text: trimmedText,
        },
        siteId
      );

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // Haptics fallback
      }

      setSubmitted(true);
      if (onReviewSubmitted && response.data) {
        onReviewSubmitted(response.data);
      }

      setTimeout(() => {
        handleClose();
      }, 1600);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to post review. Please try again.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setText('');
    setRating(5);
    setSubmitted(false);
    setErrorMsg(null);
    onClose();
  };

  const currentDesc = RATING_DESCRIPTIONS[rating] || RATING_DESCRIPTIONS[5];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.modalRoot, { backgroundColor: colors.background }]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.heading, fontFamily: headingFontFamily }]}>
            Write a Review
          </Text>
          <TouchableOpacity testID="btn-close"
            style={styles.closeBtn}
            onPress={handleClose}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Close review modal"
          >
            <Ionicons name="close" size={24} color={colors.heading} />
          </TouchableOpacity>
        </View>

        {submitted ? (
          <View style={styles.successState}>
            <View style={[styles.successIconCircle, { backgroundColor: `${colors.primary}18` }]}>
              <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
            </View>
            <Text style={[styles.successTitle, { color: colors.heading, fontFamily: headingFontFamily }]}>
              Review Published!
            </Text>
            <Text style={[styles.successSubtitle, { color: colors.mutedText }]}>
              Thank you for sharing your journey. Your review is now visible to travelers exploring {tourName}.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={[styles.contentContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Tour Subtitle */}
            <Text style={[styles.tourNameBanner, { color: colors.primary }]} numberOfLines={1}>
              {tourName}
            </Text>

            {/* Star Rating Section */}
            <View style={[styles.ratingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>Overall Rating</Text>

              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const isActive = starVal <= rating;
                  return (
                    <TouchableOpacity testID="btn-reviewmodal-210"
                      key={starVal}
                      style={styles.starTouch}
                      onPress={() => handleStarPress(starVal)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Rate ${starVal} star${starVal > 1 ? 's' : ''}`}
                    >
                      <Ionicons
                        name={isActive ? 'star' : 'star-outline'}
                        size={36}
                        color={isActive ? '#f59e0b' : colors.border}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={[styles.ratingFeedbackBadge, { backgroundColor: `${colors.primary}12` }]}>
                <Ionicons name={currentDesc.icon} size={14} color={colors.primary} style={{ marginRight: 5 }} />
                <Text style={[styles.ratingFeedbackText, { color: colors.primary }]}>
                  {rating}.0 • {currentDesc.label}
                </Text>
              </View>
            </View>

            {/* Author Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.heading }]}>Your Name</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g. Maya Sharma"
                placeholderTextColor={colors.mutedText}
                value={author}
                onChangeText={setAuthor}
              />
            </View>

            {/* Review Text */}
            <View style={styles.inputGroup}>
              <View style={styles.labelCountRow}>
                <Text style={[styles.inputLabel, { color: colors.heading }]}>Your Experience</Text>
                <Text style={[styles.charCountText, { color: colors.mutedText }]}>
                  {text.trim().length} chars
                </Text>
              </View>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Share specific highlights, guides, recommendations, or tips for future travelers..."
                placeholderTextColor={colors.mutedText}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                value={text}
                onChangeText={setText}
              />
            </View>

            {/* Error Message */}
            {Boolean(errorMsg) && (
              <View style={styles.errorAlert}>
                <Ionicons name="warning-outline" size={16} color="#ef4444" style={{ marginRight: 6 }} />
                <Text style={styles.errorAlertText}>{errorMsg}</Text>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity testID="btn-paper-plane-outline"
              style={[
                styles.submitBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: submitting || text.trim().length < 10 ? 0.6 : 1,
                },
              ]}
              onPress={handleSubmit}
              disabled={submitting || text.trim().length < 10}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Submit your review"
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <View style={styles.btnContentRow}>
                  <Ionicons name="paper-plane-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.submitBtnText}>Post Traveler Review</Text>
                </View>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  tourNameBanner: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    marginBottom: 4,
  },
  ratingCard: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.xs + 2,
  },
  fieldLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  starsRow: {
    flexDirection: 'row',
    gap: SPACING.xs + 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  starTouch: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingFeedbackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    marginTop: 2,
  },
  ratingFeedbackText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
  inputGroup: {
    gap: 6,
  },
  labelCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  charCountText: {
    fontSize: FONT_SIZE.xs,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: FONT_SIZE.sm,
    minHeight: 46,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    fontSize: FONT_SIZE.sm,
    minHeight: 120,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorAlertText: {
    color: '#b91c1c',
    fontSize: FONT_SIZE.xs,
    flex: 1,
  },
  submitBtn: {
    borderRadius: RADIUS.full,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xs,
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.sm + 1,
    fontWeight: '800',
  },
  successState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  successIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  successTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '900',
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
});

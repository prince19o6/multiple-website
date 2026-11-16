/**
 * components/CouponSelectionModal.tsx
 *
 * Interactive Promotional Coupon & Voucher Selection Modal.
 *
 * Features:
 *   - Manual promo code entry with uppercase auto-formatting
 *   - Live server verification against backend endpoint (/api/bookings/validate-coupon)
 *   - Tenant-curated voucher showcase (GujjuTours Exclusive, TripGoAsia Special, Technoheaven VIP)
 *   - Minimum spend requirements indicator
 *   - Tactile haptic feedback on code copy and apply
 *   - Strict TypeScript typing with zero `any`
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useSite, useSiteConfig } from '@/store/SiteConfigContext';
import { useCurrency } from '@/context/CurrencyContext';
import {
  type PromotionalCoupon,
  getCouponsForSite,
} from '@/constants/bookingAddOns';
import { validateCoupon } from '@/services/api';
import type { CouponValidationResult } from '@/types';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { getHeadingFontFamily } from '@/lib/sectionHelpers';

interface CouponSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  subtotal: number;
  tourId: number;
  travelers: number;
  onCouponApplied: (result: CouponValidationResult) => void;
}

export default function CouponSelectionModal({
  visible,
  onClose,
  subtotal,
  tourId,
  travelers,
  onCouponApplied,
}: CouponSelectionModalProps) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const config = useSiteConfig();
  const { siteId, siteName } = useSite();
  const { formatPrice } = useCurrency();
  const headingFontFamily = getHeadingFontFamily(config);

  const availableCoupons = getCouponsForSite(siteId);

  const [inputCode, setInputCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleApplyCode = async (codeToApply: string) => {
    const trimmed = codeToApply.trim().toUpperCase();
    if (!trimmed) {
      setErrorMessage('Please enter a promotional code.');
      return;
    }

    try {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // Haptics fallback
      }
      setValidating(true);
      setErrorMessage(null);

      const result = await validateCoupon(trimmed, subtotal, tourId, travelers, siteId);

      if (result.isValid) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
          // Haptics fallback
        }
        onCouponApplied(result);
        setInputCode('');
        onClose();
      } else {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch {
          // Haptics fallback
        }
        setErrorMessage(result.message || 'Invalid or expired promotional code.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not validate promotional code.';
      setErrorMessage(msg);
    } finally {
      setValidating(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
              paddingTop: Math.max(16, insets.top),
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.heading, fontFamily: headingFontFamily }]}>
              Apply Promo Voucher
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
              Exclusive savings for {siteName}
            </Text>
          </View>
          <TouchableOpacity testID="btn-close"
            style={[styles.closeBtn, { backgroundColor: `${colors.text}10` }]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close voucher dialog"
          >
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(30, insets.bottom + 20) }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Manual Input Field */}
          <View style={[styles.inputCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.inputLabel, { color: colors.mutedText }]}>HAVE A PROMO CODE?</Text>
            <View style={styles.inputRow}>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <Ionicons name="pricetag-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.input, { color: colors.heading }]}
                  placeholder="e.g. GUJJU20, TRIPGO15"
                  placeholderTextColor={colors.mutedText}
                  value={inputCode}
                  onChangeText={(val) => {
                    setInputCode(val.toUpperCase());
                    if (errorMessage) setErrorMessage(null);
                  }}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={() => handleApplyCode(inputCode)}
                />
                {inputCode.length > 0 && (
                  <TouchableOpacity testID="btn-close" accessibilityLabel="Close" onPress={() => setInputCode('')}>
                    <Ionicons name="close-circle" size={16} color={colors.mutedText} />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity testID="btn-apply"
                style={[
                  styles.applyBtn,
                  {
                    backgroundColor: colors.primary,
                    opacity: !inputCode.trim() || validating ? 0.6 : 1,
                  },
                ]}
                onPress={() => handleApplyCode(inputCode)}
                disabled={!inputCode.trim() || validating}
                accessibilityRole="button"
                accessibilityLabel="Apply entered promo code"
              >
                {validating ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.applyBtnText}>Apply</Text>
                )}
              </TouchableOpacity>
            </View>

            {errorMessage && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={15} color="#ef4444" style={{ marginRight: 6 }} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}
          </View>

          {/* Available Brand Coupons List */}
          <View style={styles.sectionHeader}>
            <Ionicons name="gift-outline" size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.heading }]}>
              Available Coupons for This Reservation
            </Text>
          </View>

          {availableCoupons.map((coupon: PromotionalCoupon) => {
            const isMinSpendMet = !coupon.minSpendUSD || subtotal >= coupon.minSpendUSD;

            return (
              <View
                key={coupon.code}
                style={[
                  styles.couponCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    opacity: isMinSpendMet ? 1 : 0.7,
                  },
                ]}
              >
                <View style={styles.couponTop}>
                  <View style={styles.codePill}>
                    <Text style={[styles.codeText, { color: colors.primary }]}>{coupon.code}</Text>
                  </View>

                  {coupon.badge && (
                    <View style={[styles.badgePill, { backgroundColor: `${colors.primary}15` }]}>
                      <Text style={[styles.badgeText, { color: colors.primary }]}>{coupon.badge}</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.couponTitle, { color: colors.heading }]}>{coupon.title}</Text>
                <Text style={[styles.couponDesc, { color: colors.mutedText }]}>{coupon.description}</Text>

                {coupon.minSpendUSD && !isMinSpendMet && (
                  <Text style={styles.minSpendNotice}>
                    Requires minimum booking of {formatPrice(coupon.minSpendUSD)}
                  </Text>
                )}

                <View style={styles.couponBottom}>
                  <TouchableOpacity testID="btn-checkmark-circle-outline"
                    style={[
                      styles.couponApplyBtn,
                      {
                        backgroundColor: isMinSpendMet ? `${colors.primary}15` : `${colors.text}08`,
                        borderColor: isMinSpendMet ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => handleApplyCode(coupon.code)}
                    disabled={validating}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Apply coupon code ${coupon.code}`}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={16}
                      color={isMinSpendMet ? colors.primary : colors.mutedText}
                    />
                    <Text
                      style={[
                        styles.couponApplyText,
                        { color: isMinSpendMet ? colors.primary : colors.mutedText },
                      ]}
                    >
                      Apply Voucher
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  inputCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: SPACING.lg,
    ...SHADOW.sm,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  inputWrapper: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    letterSpacing: 1,
  },
  applyBtn: {
    height: 48,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: '#ef444415',
    borderRadius: RADIUS.sm,
  },
  errorText: {
    color: '#ef4444',
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  couponCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: SPACING.md,
  },
  couponTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  codePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  codeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  couponTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    marginTop: SPACING.xs,
  },
  couponDesc: {
    fontSize: FONT_SIZE.xs,
    marginTop: 4,
    lineHeight: 18,
  },
  minSpendNotice: {
    fontSize: 11,
    color: '#f59e0b',
    marginTop: 6,
    fontStyle: 'italic',
  },
  couponBottom: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  couponApplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  couponApplyText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
  },
});

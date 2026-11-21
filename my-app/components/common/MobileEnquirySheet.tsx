/**
 * components/common/MobileEnquirySheet.tsx
 *
 * Native Quotation Lead Sheet Modal.
 * Mirrors EnquiryModal of the web app, creating a pending_quotation booking.
 * Features full dismissibility:
 *  - Top-left dedicated Back Arrow button with haptic feedback
 *  - Top-right Close (X) button
 *  - Top Drag Handle
 *  - Tap anywhere outside on the backdrop to dismiss
 *  - Bottom "Cancel & Go Back" secondary button
 *  - Android Hardware Back Button listener
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useSite, useSiteConfig } from '@/store/SiteConfigContext';
import { RADIUS, SPACING, FONT_SIZE, SHADOW } from '@/constants/theme';
import { ENV } from '@/src/config/env';

interface MobileEnquirySheetProps {
  visible: boolean;
  onClose: () => void;
  serviceName?: string;
  defaultDestination?: string;
}

export function MobileEnquirySheet({
  visible,
  onClose,
  serviceName = 'Custom Travel Package',
  defaultDestination = '',
}: MobileEnquirySheetProps) {
  const colors = useColors();
  const config = useSiteConfig();
  const { siteId, hostname } = useSite();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [destination, setDestination] = useState(defaultDestination);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync default destination when prop changes
  useEffect(() => {
    if (defaultDestination) {
      setDestination(defaultDestination);
    }
  }, [defaultDestination]);

  // Support Android hardware back button
  useEffect(() => {
    if (!visible) return;
    const backAction = () => {
      handleClose();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [visible]);

  const resetForm = () => {
    setName('');
    setPhone('');
    setEmail('');
    setDestination(defaultDestination);
    setNotes('');
    setSubmittedRef(null);
    setErrorMessage(null);
  };

  const handleClose = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim() || !email.trim()) {
      setErrorMessage('Please fill in your Name, Phone and Email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const ref = `${siteId.toUpperCase().slice(0, 2)}-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const payload = {
      reference: ref,
      guestName: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      tourId: 0,
      tourName: `${serviceName} Custom Inquiry: ${destination || 'General'}`,
      travelDate: new Date().toISOString().split('T')[0],
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      travelers: 2,
      adults: 2,
      children: 0,
      specialRequest: `Service: ${serviceName} | Destination: ${destination} | Details: ${notes}`,
      status: 'pending_quotation',
      paymentStatus: 'unpaid',
      currency: 'INR',
      source: 'mobile_app_enquiry',
      website: siteId,
    };

    try {
      const res = await fetch(`${ENV.apiUrl}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Website-Hostname': hostname || 'www.gujjutours.com',
          'X-Website-Id': siteId,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Unable to submit inquiry at this moment');
      }

      const json = await res.json().catch(() => null);
      const generatedRef = json?.data?.reference || json?.reference || ref;
      setSubmittedRef(generatedRef);
      if (Platform.OS !== 'web') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error submitting quote inquiry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        {/* Tapping outside on the darkened backdrop dismisses the sheet */}
        <TouchableWithoutFeedback onPress={handleClose} accessibilityLabel="Dismiss">
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          {/* Top visual drag indicator */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* Header with Back, Title, and Close */}
          <View style={styles.sheetHeader}>
            <TouchableOpacity
              testID="btn-back"
              accessibilityLabel="Back"
              accessibilityRole="button"
              onPress={handleClose}
              style={[styles.navBtn, { backgroundColor: colors.border + '22' }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={20} color={colors.heading} />
            </TouchableOpacity>

            <View style={styles.headerTextWrap}>
              <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.title, { color: colors.heading }]}>
                {submittedRef ? 'Quotation Confirmed!' : `Get Quote: ${serviceName}`}
              </Text>
              <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.sub, { color: colors.mutedText }]}>
                {submittedRef
                  ? 'Our travel desk will contact you within 2 hours'
                  : 'Fast response with direct wholesaler rates'}
              </Text>
            </View>

            <TouchableOpacity
              testID="btn-close"
              accessibilityLabel="Close"
              accessibilityRole="button"
              onPress={handleClose}
              style={[styles.navBtn, { backgroundColor: colors.border + '22' }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={20} color={colors.heading} />
            </TouchableOpacity>
          </View>

          {submittedRef ? (
            <View style={styles.successBox}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={48} color="#10b981" />
              </View>
              <Text style={[styles.successTitle, { color: colors.heading }]}>
                Inquiry Successfully Logged!
              </Text>
              <Text style={[styles.successRef, { color: colors.primary }]}>
                Reference: {submittedRef}
              </Text>
              <Text style={[styles.successMsg, { color: colors.mutedText }]}>
                A dedicated destination specialist will review your request and send the customized itinerary and price quote via WhatsApp &amp; Email.
              </Text>
              <TouchableOpacity
                testID="btn-done"
                accessibilityLabel="Done"
                accessibilityRole="button"
                style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                onPress={handleClose}
              >
                <Text style={styles.confirmBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContent}>
              {/* Destination Input */}
              <View style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.heading }]}>Destination</Text>
                <TextInput
                  value={destination}
                  onChangeText={setDestination}
                  placeholder="e.g. Dubai, Bali, Singapore, Thailand"
                  placeholderTextColor={colors.mutedText}
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.heading }]}
                />
              </View>

              {/* Name Input */}
              <View style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.heading }]}>Full Name *</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Rahul Shah"
                  placeholderTextColor={colors.mutedText}
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.heading }]}
                />
              </View>

              {/* WhatsApp Phone */}
              <View style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.heading }]}>WhatsApp Phone Number *</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+91 98765 43210"
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.mutedText}
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.heading }]}
                />
              </View>

              {/* Email Input */}
              <View style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.heading }]}>Email Address *</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="rahul@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={colors.mutedText}
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.heading }]}
                />
              </View>

              {/* Special Requests / Notes */}
              <View style={styles.fieldWrap}>
                <Text style={[styles.label, { color: colors.heading }]}>Dietary / Custom Requests</Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="e.g. Strictly Jain meals required, private transfers, 4-star hotel preferred..."
                  placeholderTextColor={colors.mutedText}
                  multiline
                  numberOfLines={3}
                  style={[styles.inputMulti, { backgroundColor: colors.background, borderColor: colors.border, color: colors.heading }]}
                />
              </View>

              {errorMessage && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{errorMessage}</Text>
                </View>
              )}

              {/* Submit CTA Button */}
              <TouchableOpacity
                testID="btn-submit"
                accessibilityLabel="Submit"
                accessibilityRole="button"
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                onPress={handleSubmit}
                disabled={isSubmitting}
                activeOpacity={0.85}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Request Free Quotation 🚀</Text>
                )}
              </TouchableOpacity>

              {/* Explicit Back / Cancel Button at bottom */}
              <TouchableOpacity
                testID="btn-cancel"
                accessibilityLabel="Cancel and Go Back"
                accessibilityRole="button"
                style={[styles.cancelBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={16} color={colors.heading} style={{ marginRight: 6 }} />
                <Text style={[styles.cancelBtnText, { color: colors.heading }]}>Cancel &amp; Go Back</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    borderTopLeftRadius: RADIUS.xl + 4,
    borderTopRightRadius: RADIUS.xl + 4,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xl : SPACING.lg,
    maxHeight: '90%',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9ca3af',
    opacity: 0.5,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs + 2,
    marginBottom: SPACING.xs,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
    paddingHorizontal: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZE.md - 1,
    fontWeight: '800',
  },
  sub: {
    fontSize: FONT_SIZE.xs - 1,
    marginTop: 1,
  },
  formContent: {
    paddingBottom: SPACING.xl,
  },
  fieldWrap: {
    marginBottom: SPACING.sm + 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  input: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    fontSize: FONT_SIZE.xs + 1,
  },
  inputMulti: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    fontSize: FONT_SIZE.xs + 1,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  errorBanner: {
    backgroundColor: '#fee2e2',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  errorBannerText: {
    color: '#b91c1c',
    fontSize: 11,
    fontWeight: '600',
  },
  submitBtn: {
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm + 3,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginTop: SPACING.xs + 4,
  },
  cancelBtnText: {
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: '700',
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  successIcon: {
    marginBottom: SPACING.sm,
  },
  successTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
  },
  successRef: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    marginTop: 4,
  },
  successMsg: {
    fontSize: FONT_SIZE.xs,
    textAlign: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    lineHeight: 18,
  },
  confirmBtn: {
    marginTop: SPACING.xl,
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.xl * 2,
    borderRadius: RADIUS.md,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
});

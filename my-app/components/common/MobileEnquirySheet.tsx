/**
 * components/common/MobileEnquirySheet.tsx
 *
 * Native Quotation Lead Sheet Modal.
 * Mirrors EnquiryModal of the web app, creating a pending_quotation booking.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
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
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={[styles.title, { color: colors.heading }]}>
                {submittedRef ? 'Quotation Confirmed!' : `Get Quote: ${serviceName}`}
              </Text>
              <Text style={[styles.sub, { color: colors.mutedText }]}>
                {submittedRef
                  ? 'Our travel desk will contact you within 2 hours'
                  : 'Fast response with direct wholesaler rates'}
              </Text>
            </View>
            <TouchableOpacity testID="btn-close" accessibilityLabel="Close" onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.heading} />
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
              <TouchableOpacity testID="btn-done" accessibilityLabel="Done"
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

              <TouchableOpacity testID="btn-submit" accessibilityLabel="Submit"
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
  sheet: {
    borderTopLeftRadius: RADIUS.xl + 4,
    borderTopRightRadius: RADIUS.xl + 4,
    padding: SPACING.lg,
    maxHeight: '90%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
  },
  sub: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  closeBtn: {
    padding: SPACING.xs,
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

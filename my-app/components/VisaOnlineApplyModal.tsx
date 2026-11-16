import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useBooking } from '@/context/BookingContext';
import type { Booking } from '@/types';

export interface VisaTier {
  id: string;
  title: string;
  stay: string;
  time: string;
  price: string;
  numericPrice: number;
  type: string;
  fastTrack?: boolean;
}

export interface VisaOnlineApplyModalProps {
  visible: boolean;
  tier: VisaTier | null;
  destination: string;
  nationality: string;
  onClose: () => void;
}

export const VisaOnlineApplyModal: React.FC<VisaOnlineApplyModalProps> = ({
  visible,
  tier,
  destination,
  nationality,
  onClose,
}) => {
  const router = useRouter();
  const colors = useColors();
  const { user } = useAuth();
  const { addBooking } = useBooking();

  // Form Fields
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantNationality, setApplicantNationality] = useState(nationality || 'India');
  const [passportNumber, setPassportNumber] = useState('');
  const [passportExpiry, setPassportExpiry] = useState('2028-12-31');
  const [dateOfBirth, setDateOfBirth] = useState('1995-05-15');
  const [travelDate, setTravelDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [travelersCount, setTravelersCount] = useState(1);

  // Document consent checklist
  const [hasPassportScan, setHasPassportScan] = useState(true);
  const [hasPhoto, setHasPhoto] = useState(true);
  const [hasAirTicket, setHasAirTicket] = useState(true);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Sync state whenever modal opens or user/tier changes
  useEffect(() => {
    if (visible) {
      setIsSuccess(false);
      setConfirmedBooking(null);
      setFormError(null);
      setApplicantNationality(nationality || 'India');

      if (user) {
        if (user.name && !applicantName) setApplicantName(user.name);
        if (user.email && !applicantEmail) setApplicantEmail(user.email);
        if (user.phone && !applicantPhone) setApplicantPhone(user.phone);
      }
    }
  }, [visible, user, nationality]);

  // Real-time 6-month validity analysis
  const validityAnalysis = useMemo(() => {
    if (!passportExpiry || !travelDate) return null;
    const expiry = new Date(passportExpiry);
    const travel = new Date(travelDate);
    if (isNaN(expiry.getTime()) || isNaN(travel.getTime())) return null;

    const diffMs = expiry.getTime() - travel.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = Math.round((diffDays / 30.4375) * 10) / 10;

    return {
      isValid: diffDays >= 180,
      diffDays,
      diffMonths,
      isExpired: diffDays <= 0,
    };
  }, [passportExpiry, travelDate]);

  // Pricing
  const unitPrice = tier?.numericPrice || 6499;
  const subtotal = unitPrice * travelersCount;
  const tax = Math.round(subtotal * 0.05);
  const grandTotal = subtotal + tax;

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsSuccess(false);
    setConfirmedBooking(null);
    setFormError(null);
    onClose();
  };

  const handleSubmit = async () => {
    setFormError(null);

    if (!applicantName.trim()) {
      setFormError('Please enter applicant full name as printed on passport.');
      return;
    }
    if (!applicantEmail.trim() || !applicantEmail.includes('@')) {
      setFormError('Please enter a valid email address for receiving your visa.');
      return;
    }
    if (!applicantPhone.trim() || applicantPhone.trim().length < 6) {
      setFormError('Please enter a valid WhatsApp / contact number.');
      return;
    }
    if (!passportNumber.trim() || passportNumber.trim().length < 5) {
      setFormError('Please enter a valid passport number (at least 6 characters).');
      return;
    }
    if (!passportExpiry.trim()) {
      setFormError('Please enter passport expiration date (YYYY-MM-DD).');
      return;
    }

    if (validityAnalysis && validityAnalysis.isExpired) {
      setFormError('Passport appears to be expired before departure. A renewed passport is required.');
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    try {
      const tierTitle = tier?.title || `${destination} eVisa Clearance`;
      const tierId = tier?.id || 'standard';

      const bookingPayload = {
        tourId: `visa-${tierId}-${destination.toLowerCase().replace(/\s+/g, '-')}`,
        tourSlug: `visa-${destination.toLowerCase().replace(/\s+/g, '-')}-${tierId}`,
        tourName: tierTitle,
        destination: destination,
        location: destination,
        service: 'visa',
        serviceType: 'visa',
        module: 'visa',
        email: applicantEmail.trim().toLowerCase(),
        phone: applicantPhone.trim(),
        guestName: applicantName.trim(),
        name: applicantName.trim(),
        travelers: travelersCount,
        adults: travelersCount,
        travelDate: travelDate,
        startDate: travelDate,
        date: travelDate,
        unitPrice: unitPrice,
        totalPrice: grandTotal,
        amountPaid: grandTotal,
        currency: 'INR',
        travelersList: [
          {
            id: 'lead_applicant',
            name: applicantName.trim(),
            type: 'Adult',
            passportNumber: passportNumber.trim().toUpperCase(),
            passportExpiry: passportExpiry.trim(),
            dateOfBirth: dateOfBirth.trim() || undefined,
            nationality: applicantNationality.trim(),
          },
        ],
        specialRequest: `Online Visa Application | Tier: ${tierTitle} | Stay: ${tier?.stay || 'N/A'} | Time: ${tier?.time || 'N/A'} | Passport: ${passportNumber.trim().toUpperCase()} | Expiry: ${passportExpiry.trim()} | Nat: ${applicantNationality.trim()}`,
        paymentMethod: 'card',
        paymentPlan: 'full',
        paymentStatus: 'paid',
        source: 'app',
      };

      const result = await addBooking(bookingPayload);
      setConfirmedBooking(result);
      setIsSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit visa application. Please try again.';
      setFormError(message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewVoucher = () => {
    const bookingRef = confirmedBooking?.reference || confirmedBooking?.id;
    handleClose();
    if (bookingRef) {
      router.push(`/booking/${bookingRef}` as any);
    } else {
      router.push('/(tabs)/bookings' as any);
    }
  };

  if (!visible || !tier) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={[styles.root, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header Bar */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.heading }]}>
              {isSuccess ? 'Application Confirmed' : 'Fast-Track Online Visa'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.mutedText }]}>
              {destination} Consular Pre-Screening Clearance
            </Text>
          </View>
          <TouchableOpacity
            testID="btn-close-visa-modal"
            accessibilityLabel="Close Visa Application"
            style={styles.closeBtn}
            onPress={handleClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={24} color={colors.heading} />
          </TouchableOpacity>
        </View>

        {/* Content Body */}
        {isSuccess ? (
          /* Confirmation Screen */
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.successContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.successIconWrap}>
              <View style={[styles.successIconCircle, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="checkmark-done" size={44} color="#15803d" />
              </View>
            </View>

            <Text style={[styles.successTitle, { color: colors.heading }]}>
              Visa Application Submitted!
            </Text>
            <Text style={[styles.successSubtitle, { color: colors.mutedText }]}>
              Your visa submission has been received by our consular clearance desk and is now undergoing pre-screening.
            </Text>

            {/* Reference Badge */}
            <View style={[styles.refCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.refLabel}>OFFICIAL BOOKING REFERENCE</Text>
              <Text style={[styles.refCode, { color: colors.primary }]}>
                #{confirmedBooking?.reference || confirmedBooking?.id || 'GT-PROCESSING'}
              </Text>
              <View style={styles.statusPill}>
                <Ionicons name="shield-checkmark" size={14} color="#059669" />
                <Text style={styles.statusPillText}>Under Consular Pre-Screening</Text>
              </View>
            </View>

            {/* Summary Details */}
            <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.mutedText }]}>Destination</Text>
                <Text style={[styles.summaryValue, { color: colors.heading }]}>{destination}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.mutedText }]}>Visa Category</Text>
                <Text style={[styles.summaryValue, { color: colors.heading }]}>{tier.title}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.mutedText }]}>Lead Applicant</Text>
                <Text style={[styles.summaryValue, { color: colors.heading }]}>{applicantName}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.mutedText }]}>Passport No</Text>
                <Text style={[styles.summaryValue, { color: colors.heading }]}>
                  {passportNumber.toUpperCase()}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.mutedText }]}>Processing Time</Text>
                <Text style={[styles.summaryValue, { color: colors.heading }]}>{tier.time}</Text>
              </View>
              <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.summaryLabel, { color: colors.mutedText }]}>Total Paid</Text>
                <Text style={[styles.summaryValue, { color: colors.primary, fontWeight: '800' }]}>
                  ₹{grandTotal.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* What Happens Next */}
            <View style={[styles.noticeBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
              <Ionicons name="mail-unread-outline" size={20} color="#15803d" />
              <Text style={[styles.noticeText, { color: '#166534' }]}>
                We will email your approved visa PDF and send live milestone updates directly to{' '}
                <Text style={{ fontWeight: '700' }}>{applicantEmail}</Text> and WhatsApp at{' '}
                <Text style={{ fontWeight: '700' }}>{applicantPhone}</Text>.
              </Text>
            </View>

            {/* Actions */}
            <TouchableOpacity
              testID="btn-view-voucher"
              accessibilityLabel="View Booking Voucher"
              style={[styles.primaryActionBtn, { backgroundColor: colors.primary }]}
              onPress={handleViewVoucher}
            >
              <Ionicons name="receipt-outline" size={18} color="#ffffff" />
              <Text style={styles.primaryActionBtnText}>View Booking Voucher & Pass</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="btn-done-modal"
              accessibilityLabel="Done"
              style={[styles.secondaryActionBtn, { borderColor: colors.border }]}
              onPress={handleClose}
            >
              <Text style={[styles.secondaryActionBtnText, { color: colors.heading }]}>Done</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          /* Application Form */
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.formContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Tier Summary Card */}
            <View style={[styles.tierCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.tierHeaderRow}>
                <View style={styles.tierBadgeRow}>
                  <Text style={[styles.tierTypeBadge, { color: colors.primary }]}>{tier.type}</Text>
                  {tier.fastTrack && (
                    <View style={styles.fastTrackTag}>
                      <Text style={styles.fastTrackText}>⚡ FAST-TRACK</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.tierPrice, { color: colors.heading }]}>
                  {tier.price} <Text style={styles.perPerson}>/ person</Text>
                </Text>
              </View>

              <Text style={[styles.tierTitle, { color: colors.heading }]}>{tier.title}</Text>

              <View style={styles.tierSpecsRow}>
                <View style={styles.tierSpecItem}>
                  <Ionicons name="calendar-outline" size={14} color={colors.mutedText} />
                  <Text style={[styles.tierSpecText, { color: colors.mutedText }]}>Stay: {tier.stay}</Text>
                </View>
                <View style={styles.tierSpecItem}>
                  <Ionicons name="time-outline" size={14} color={colors.mutedText} />
                  <Text style={[styles.tierSpecText, { color: colors.mutedText }]}>Time: {tier.time}</Text>
                </View>
              </View>
            </View>

            {/* Form Error Banner */}
            {formError && (
              <View style={[styles.errorBanner, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
                <Ionicons name="alert-circle" size={18} color="#dc2626" />
                <Text style={styles.errorBannerText}>{formError}</Text>
              </View>
            )}

            {/* Section 1: Lead Applicant */}
            <Text style={[styles.sectionTitle, { color: colors.heading }]}>1. Applicant Information</Text>

            <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>
              FULL NAME (AS PRINTED ON PASSPORT) *
            </Text>
            <TextInput
              testID="input-applicant-name"
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.heading }]}
              placeholder="e.g. Prince Patel"
              placeholderTextColor={colors.mutedText}
              value={applicantName}
              onChangeText={setApplicantName}
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>
              EMAIL ADDRESS (FOR EVISA PDF DISPATCH) *
            </Text>
            <TextInput
              testID="input-applicant-email"
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.heading }]}
              placeholder="e.g. prince@example.com"
              placeholderTextColor={colors.mutedText}
              keyboardType="email-address"
              autoCapitalize="none"
              value={applicantEmail}
              onChangeText={setApplicantEmail}
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>
              WHATSAPP & CONTACT PHONE NUMBER *
            </Text>
            <TextInput
              testID="input-applicant-phone"
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.heading }]}
              placeholder="e.g. +91 98765 43210"
              placeholderTextColor={colors.mutedText}
              keyboardType="phone-pad"
              value={applicantPhone}
              onChangeText={setApplicantPhone}
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>
              PASSPORT NATIONALITY
            </Text>
            <TextInput
              testID="input-applicant-nationality"
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.heading }]}
              placeholder="e.g. India"
              placeholderTextColor={colors.mutedText}
              value={applicantNationality}
              onChangeText={setApplicantNationality}
            />

            {/* Section 2: Passport & Travel Information */}
            <Text style={[styles.sectionTitle, { color: colors.heading, marginTop: 16 }]}>
              2. Passport & Travel Clearance
            </Text>

            <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>
              PASSPORT NUMBER *
            </Text>
            <TextInput
              testID="input-passport-number"
              style={[
                styles.input,
                { backgroundColor: colors.surface, borderColor: colors.border, color: colors.heading, fontWeight: '700' },
              ]}
              placeholder="e.g. Z1234567"
              placeholderTextColor={colors.mutedText}
              autoCapitalize="characters"
              value={passportNumber}
              onChangeText={setPassportNumber}
            />

            <View style={styles.rowTwoCols}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>
                  PASSPORT EXPIRY *
                </Text>
                <TextInput
                  testID="input-passport-expiry"
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.heading }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.mutedText}
                  value={passportExpiry}
                  onChangeText={setPassportExpiry}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>
                  DATE OF BIRTH
                </Text>
                <TextInput
                  testID="input-date-of-birth"
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.heading }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.mutedText}
                  value={dateOfBirth}
                  onChangeText={setDateOfBirth}
                />
              </View>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>
              PLANNED TRIP DEPARTURE DATE (YYYY-MM-DD) *
            </Text>
            <TextInput
              testID="input-travel-date"
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.heading }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.mutedText}
              value={travelDate}
              onChangeText={setTravelDate}
            />

            {/* Live 6-Month Passport Rule Check */}
            {validityAnalysis && (
              <View
                style={[
                  styles.validityBadgeBox,
                  {
                    backgroundColor: validityAnalysis.isValid ? '#f0fdf4' : '#fffbeb',
                    borderColor: validityAnalysis.isValid ? '#bbf7d0' : '#fde68a',
                  },
                ]}
              >
                <Ionicons
                  name={validityAnalysis.isValid ? 'checkmark-circle' : 'alert-circle'}
                  size={18}
                  color={validityAnalysis.isValid ? '#15803d' : '#b45309'}
                />
                <Text
                  style={[
                    styles.validityBadgeText,
                    { color: validityAnalysis.isValid ? '#166534' : '#92400e' },
                  ]}
                >
                  {validityAnalysis.isValid
                    ? `✓ 6-Month Rule Satisfied (${validityAnalysis.diffMonths} months validity remaining on travel date).`
                    : validityAnalysis.isExpired
                    ? '⚠️ Passport expires before departure date. Renewal required.'
                    : `⚠️ Less than 6 months validity (${validityAnalysis.diffMonths} months). Border authorities may deny entry.`}
                </Text>
              </View>
            )}

            {/* Number of Travelers Stepper */}
            <View style={[styles.stepperRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View>
                <Text style={[styles.stepperLabel, { color: colors.heading }]}>Number of Applicants</Text>
                <Text style={[styles.stepperSub, { color: colors.mutedText }]}>Visas processed in one batch</Text>
              </View>
              <View style={styles.stepperControls}>
                <TouchableOpacity
                  testID="btn-decrement-travelers"
                  style={[styles.stepBtn, { borderColor: colors.border }]}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setTravelersCount((prev) => Math.max(1, prev - 1));
                  }}
                  disabled={travelersCount <= 1}
                >
                  <Text style={[styles.stepBtnText, { color: travelersCount <= 1 ? colors.mutedText : colors.heading }]}>
                    -
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.stepCount, { color: colors.heading }]}>{travelersCount}</Text>
                <TouchableOpacity
                  testID="btn-increment-travelers"
                  style={[styles.stepBtn, { borderColor: colors.border }]}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setTravelersCount((prev) => Math.min(10, prev + 1));
                  }}
                  disabled={travelersCount >= 10}
                >
                  <Text style={[styles.stepBtnText, { color: travelersCount >= 10 ? colors.mutedText : colors.heading }]}>
                    +
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Section 3: Document Checklist Consent */}
            <Text style={[styles.sectionTitle, { color: colors.heading, marginTop: 16 }]}>
              3. Document Readiness Checklist
            </Text>

            <TouchableOpacity
              style={styles.checkItem}
              onPress={() => setHasPassportScan((prev) => !prev)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={hasPassportScan ? 'checkbox' : 'square-outline'}
                size={22}
                color={hasPassportScan ? colors.primary : colors.mutedText}
              />
              <Text style={[styles.checkItemText, { color: colors.heading }]}>
                Passport bio page (front & back clear color scan ready)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkItem}
              onPress={() => setHasPhoto((prev) => !prev)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={hasPhoto ? 'checkbox' : 'square-outline'}
                size={22}
                color={hasPhoto ? colors.primary : colors.mutedText}
              />
              <Text style={[styles.checkItemText, { color: colors.heading }]}>
                Recent passport-sized photo with white background (35x45mm)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkItem}
              onPress={() => setHasAirTicket((prev) => !prev)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={hasAirTicket ? 'checkbox' : 'square-outline'}
                size={22}
                color={hasAirTicket ? colors.primary : colors.mutedText}
              />
              <Text style={[styles.checkItemText, { color: colors.heading }]}>
                Confirmed round-trip flight booking or itinerary
              </Text>
            </TouchableOpacity>

            {/* Price Breakdown */}
            <View style={[styles.priceBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, { color: colors.mutedText }]}>
                  Visa Fee (₹{unitPrice.toLocaleString()} × {travelersCount})
                </Text>
                <Text style={[styles.priceVal, { color: colors.heading }]}>₹{subtotal.toLocaleString()}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, { color: colors.mutedText }]}>
                  Consular Clearance & Verification (5%)
                </Text>
                <Text style={[styles.priceVal, { color: colors.heading }]}>₹{tax.toLocaleString()}</Text>
              </View>
              <View style={[styles.priceRow, styles.priceTotalRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.totalLabel, { color: colors.heading }]}>Total Amount</Text>
                <Text style={[styles.totalVal, { color: colors.primary }]}>₹{grandTotal.toLocaleString()}</Text>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              testID="btn-submit-visa-application"
              accessibilityLabel="Submit Visa Application"
              style={[
                styles.submitBtn,
                { backgroundColor: colors.primary },
                isSubmitting && { opacity: 0.7 },
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.submitBtnText}>Submitting Application...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="paper-plane" size={18} color="#ffffff" />
                  <Text style={styles.submitBtnText}>Submit Visa Application</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  scrollBody: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  tierCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  tierHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tierBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tierTypeBadge: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  fastTrackTag: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fastTrackText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  tierPrice: {
    fontSize: 16,
    fontWeight: '900',
  },
  perPerson: {
    fontSize: 11,
    fontWeight: '500',
  },
  tierTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  tierSpecsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  tierSpecItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tierSpecText: {
    fontSize: 11,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#b91c1c',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    marginBottom: 10,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 10,
  },
  validityBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  validityBadgeText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  stepperLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  stepperSub: {
    fontSize: 11,
    marginTop: 2,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  stepCount: {
    fontSize: 14,
    fontWeight: '800',
    minWidth: 18,
    textAlign: 'center',
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  checkItemText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  priceBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 10,
    marginBottom: 18,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  priceLabel: {
    fontSize: 12,
  },
  priceVal: {
    fontSize: 12,
    fontWeight: '600',
  },
  priceTotalRow: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  totalVal: {
    fontSize: 16,
    fontWeight: '900',
  },
  submitBtn: {
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  // Success Screen
  successContainer: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 40,
  },
  successIconWrap: {
    marginTop: 10,
    marginBottom: 14,
  },
  successIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 12,
  },
  refCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  refLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  refCode: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  summaryCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  summaryLabel: {
    fontSize: 12,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    width: '100%',
  },
  noticeText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  primaryActionBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

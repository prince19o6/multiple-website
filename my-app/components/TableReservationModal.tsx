import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useSite, useSiteConfig } from '@/store/SiteConfigContext';
import { DiningSpot, DiningReservationResponse } from '../types';
import { submitDiningReservation } from '../services/api';

interface TableReservationModalProps {
  spot: DiningSpot | null;
  visible: boolean;
  onClose: () => void;
}

export const TableReservationModal: React.FC<TableReservationModalProps> = ({
  spot,
  visible,
  onClose,
}) => {
  const colors = useColors();
  const { siteId } = useSite();
  const config = useSiteConfig();

  const [guestName, setGuestName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [partySize, setPartySize] = useState(2);
  const [selectedDate, setSelectedDate] = useState('Tomorrow');
  const [selectedSlot, setSelectedSlot] = useState('Dinner (19:30)');
  const [dietaryRequests, setDietaryRequests] = useState<string[]>([]);
  const [specialNotes, setSpecialNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmation, setConfirmation] = useState<DiningReservationResponse | null>(null);

  useEffect(() => {
    if (visible && spot) {
      setConfirmation(null);
      setErrorMsg('');
      setSpecialNotes('');
      // Default dietary request based on config
      const defaultRequests = (config as any)?.content?.defaultDietaryRequests || ['Pure Veg Kitchen', 'Halal Options'];
      setDietaryRequests(defaultRequests);
    }
  }, [visible, spot, config]);

  if (!spot) return null;

  const dateOptions = ['Today', 'Tomorrow', 'This Weekend', 'Custom Date'];
  const slotOptions = [
    'Lunch (12:30)',
    'Afternoon (14:00)',
    'Sunset (17:30)',
    'Dinner (19:30)',
    'Late Dining (21:00)',
  ];

  const dietaryChecklist =
    (config as any)?.content?.dietaryOptions || [
      '100% Pure Veg Kitchen',
      'Strict Jain (No Onion / Garlic)',
      '100% Halal Certified',
      'Non-Alcoholic Area',
      'Window / Skyline View',
      'VIP Private Booth',
      'Gluten-Free Available',
      'Mild Spice Preferred',
    ];

  const toggleDietaryItem = (item: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDietaryRequests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handlePartyChange = (delta: number) => {
    Haptics.selectionAsync();
    setPartySize((prev) => Math.max(1, Math.min(12, prev + delta)));
  };

  const handleSubmit = async () => {
    if (!guestName.trim()) {
      setErrorMsg('Please enter your full guest name.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorMsg('Please enter your contact phone number.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const res = await submitDiningReservation(
        {
          guestName: guestName.trim(),
          phoneNumber: phoneNumber.trim(),
          email: email.trim() || undefined,
          diningSpotId: spot.id,
          diningSpotName: spot.name,
          destinationId: spot.destinationId,
          partySize,
          reservationDate: selectedDate,
          timeSlot: selectedSlot,
          dietaryRequests,
          specialNotes: specialNotes.trim() || undefined,
        },
        siteId
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setConfirmation(res);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Reservation submission failed.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactConcierge = () => {
    if (!confirmation?.conciergeContact) return;
    const phoneMatch = confirmation.conciergeContact.match(/\+[\d\s-]+/);
    if (phoneMatch) {
      const cleanPhone = phoneMatch[0].replace(/\s+/g, '');
      Linking.openURL(`tel:${cleanPhone}`);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
          {/* Header Bar */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.spotIconCircle, { backgroundColor: colors.primary + '18' }]}>
                <Ionicons name="restaurant" size={20} color={colors.primary} />
              </View>
              <View style={styles.spotHeaderText}>
                <Text style={[styles.spotTitle, { color: colors.heading }]} numberOfLines={1}>
                  {spot.name}
                </Text>
                <Text style={[styles.spotSubtitle, { color: colors.mutedText }]}>
                  {spot.cuisineType} • {spot.priceTier}
                </Text>
              </View>
            </View>

            <TouchableOpacity testID="btn-close"
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityLabel="Close reservation modal"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={24} color={colors.mutedText} />
            </TouchableOpacity>
          </View>

          {confirmation ? (
            /* Confirmation Success Screen */
            <ScrollView contentContainerStyle={styles.successScroll}>
              <View style={[styles.successIconCircle, { backgroundColor: '#10b98120' }]}>
                <Ionicons name="checkmark-circle" size={54} color="#10b981" />
              </View>

              <Text style={[styles.successTitle, { color: colors.heading }]}>
                Table Reservation Requested!
              </Text>

              <View style={[styles.referenceBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.referenceLabel, { color: colors.mutedText }]}>
                  Booking Reference
                </Text>
                <Text style={[styles.referenceCode, { color: colors.primary }]}>
                  {confirmation.reservationReference}
                </Text>
              </View>

              <View style={[styles.confirmationBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.confirmMsg, { color: colors.text }]}>
                  {confirmation.confirmationMessage}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Ionicons name="people-outline" size={18} color={colors.mutedText} />
                <Text style={[styles.summaryText, { color: colors.mutedText }]}>
                  Party of {partySize} Guests • {selectedSlot} ({selectedDate})
                </Text>
              </View>

              {confirmation.conciergeContact ? (
                <TouchableOpacity testID="btn-call-outline" accessibilityLabel="call outline"
                  style={[styles.conciergeContactBtn, { borderColor: colors.primary }]}
                  onPress={handleContactConcierge}
                  accessibilityRole="button"
                >
                  <Ionicons name="call-outline" size={18} color={colors.primary} />
                  <Text style={[styles.conciergeContactText, { color: colors.primary }]}>
                    {confirmation.conciergeContact}
                  </Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity testID="btn-return-to-culinary-guide" accessibilityLabel="Return to Culinary Guide"
                style={[styles.doneBtn, { backgroundColor: colors.primary }]}
                onPress={onClose}
                accessibilityRole="button"
              >
                <Text style={styles.doneBtnText}>Return to Culinary Guide</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            /* Reservation Form Screen */
            <ScrollView
              contentContainerStyle={styles.formScroll}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {errorMsg ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color="#ef4444" />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              {/* Guest Name & Contact */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
                  Primary Guest Name *
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="e.g. Rajesh Shah / Somchai / Ahmed"
                  placeholderTextColor={colors.mutedText}
                  value={guestName}
                  onChangeText={setGuestName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
                  Mobile Phone / WhatsApp *
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="+91 / +66 / +971"
                  placeholderTextColor={colors.mutedText}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
                  Email Address (Optional)
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="guest@example.com"
                  placeholderTextColor={colors.mutedText}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Party Size Stepper */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
                  Number of Guests
                </Text>
                <View style={styles.stepperRow}>
                  <TouchableOpacity testID="btn-remove"
                    style={[
                      styles.stepperBtn,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                    onPress={() => handlePartyChange(-1)}
                    disabled={partySize <= 1}
                    accessibilityRole="button"
                    accessibilityLabel="Decrease guest count"
                  >
                    <Ionicons
                      name="remove"
                      size={20}
                      color={partySize <= 1 ? colors.border : colors.text}
                    />
                  </TouchableOpacity>

                  <View style={styles.stepperValueContainer}>
                    <Text style={[styles.stepperValueText, { color: colors.text }]}>
                      {partySize} {partySize === 1 ? 'Guest' : 'Guests'}
                    </Text>
                  </View>

                  <TouchableOpacity testID="btn-add"
                    style={[
                      styles.stepperBtn,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                    ]}
                    onPress={() => handlePartyChange(1)}
                    disabled={partySize >= 12}
                    accessibilityRole="button"
                    accessibilityLabel="Increase guest count"
                  >
                    <Ionicons
                      name="add"
                      size={20}
                      color={partySize >= 12 ? colors.border : colors.text}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Date Selection */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
                  Reservation Day
                </Text>
                <View style={styles.chipsRow}>
                  {dateOptions.map((opt) => {
                    const isSelected = selectedDate === opt;
                    return (
                      <TouchableOpacity testID="btn-tablereservationmodal-371" accessibilityLabel="tablereservationmodal action"
                        key={opt}
                        style={[
                          styles.chipItem,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.surface,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setSelectedDate(opt);
                        }}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: isSelected ? '#ffffff' : colors.text },
                          ]}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Time Slot Selection */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
                  Preferred Dining Time Slot
                </Text>
                <View style={styles.chipsRow}>
                  {slotOptions.map((slot) => {
                    const isSelected = selectedSlot === slot;
                    return (
                      <TouchableOpacity testID="btn-tablereservationmodal-408" accessibilityLabel="tablereservationmodal action"
                        key={slot}
                        style={[
                          styles.chipItem,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.surface,
                            borderColor: isSelected ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setSelectedSlot(slot);
                        }}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: isSelected ? '#ffffff' : colors.text },
                          ]}
                        >
                          {slot}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Dietary Preferences & Requests */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
                  Dietary & Seating Preferences
                </Text>
                <View style={styles.checklistContainer}>
                  {dietaryChecklist.map((item: string) => {
                    const isChecked = dietaryRequests.includes(item);
                    return (
                      <TouchableOpacity testID="btn-tablereservationmodal-445" accessibilityLabel="tablereservationmodal action"
                        key={item}
                        style={[
                          styles.checklistItem,
                          {
                            backgroundColor: isChecked ? colors.primary + '12' : colors.surface,
                            borderColor: isChecked ? colors.primary : colors.border,
                          },
                        ]}
                        onPress={() => toggleDietaryItem(item)}
                      >
                        <Ionicons
                          name={isChecked ? 'checkbox' : 'square-outline'}
                          size={20}
                          color={isChecked ? colors.primary : colors.mutedText}
                        />
                        <Text
                          style={[
                            styles.checklistText,
                            { color: isChecked ? colors.text : colors.mutedText },
                          ]}
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Special Notes */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
                  Special Requests / Occasion
                </Text>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Anniversary, birthday, food allergies, specific table preference..."
                  placeholderTextColor={colors.mutedText}
                  value={specialNotes}
                  onChangeText={setSpecialNotes}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity testID="btn-restaurant-outline" accessibilityLabel="restaurant outline"
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                onPress={handleSubmit}
                disabled={isSubmitting}
                accessibilityRole="button"
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="restaurant-outline" size={20} color="#ffffff" />
                    <Text style={styles.submitBtnText}>Confirm Concierge Reservation</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '88%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  spotIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  spotHeaderText: {
    flex: 1,
  },
  spotTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  spotSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef444415',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  textArea: {
    minHeight: 76,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 10,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperValueContainer: {
    flex: 1,
    alignItems: 'center',
  },
  stepperValueText: {
    fontSize: 16,
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipItem: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  checklistContainer: {
    gap: 8,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    minHeight: 44,
  },
  checklistText: {
    fontSize: 14,
    fontWeight: '500',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderRadius: 14,
    marginTop: 12,
    marginBottom: 8,
    gap: 8,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  successScroll: {
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  referenceBadge: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
  },
  referenceLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  referenceCode: {
    fontSize: 19,
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: 1,
  },
  confirmationBox: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    width: '100%',
  },
  confirmMsg: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  summaryText: {
    fontSize: 13,
  },
  conciergeContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 20,
    minHeight: 44,
  },
  conciergeContactText: {
    fontSize: 13,
    fontWeight: '700',
  },
  doneBtn: {
    width: '100%',
    minHeight: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});

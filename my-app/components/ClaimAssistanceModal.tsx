import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useInsurance } from '../context/InsuranceContext';
import { HospitalDirectoryItem } from '../types';

interface ClaimAssistanceModalProps {
  visible: boolean;
  onClose: () => void;
  initialHospital?: HospitalDirectoryItem | null;
}

const CLAIM_TYPES = [
  'Medical Emergency',
  'Baggage Loss',
  'Flight Delay',
  'Trip Cancellation',
];

export const ClaimAssistanceModal: React.FC<ClaimAssistanceModalProps> = ({
  visible,
  onClose,
  initialHospital,
}) => {
  const colors = useColors();
  const { policy, submitClaim, lastSubmittedClaimRef } = useInsurance();

  const [activeTab, setActiveTab] = useState<'request' | 'documents'>('request');
  const [claimType, setClaimType] = useState<string>('Medical Emergency');
  const [hospitalName, setHospitalName] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successRef, setSuccessRef] = useState<string | null>(null);

  useEffect(() => {
    if (initialHospital) {
      setHospitalName(initialHospital.name);
      setCity(initialHospital.city);
      setClaimType('Medical Emergency');
    } else {
      setHospitalName('');
      setCity('');
    }
    setSuccessRef(null);
  }, [initialHospital, visible]);

  const handleSubmit = async () => {
    if (!contactPhone.trim()) {
      Alert.alert('Phone Required', 'Please enter a contact phone number where the medical desk can reach you.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Details Required', 'Please provide a brief description of the medical condition or emergency.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await submitClaim(
        claimType,
        hospitalName || 'Pending Admission',
        city || 'Current Destination',
        contactPhone.trim(),
        description.trim()
      );

      if (res && res.success) {
        setSuccessRef(res.claimReferenceNumber);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } else {
        Alert.alert('Submission Error', 'Failed to register assistance inquiry. Please call the emergency hotline directly.');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred. Please contact the 24/7 hotline.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDone = () => {
    setSuccessRef(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.heading }]}>
                {successRef ? 'Assistance Request Logged' : 'Medical Claim Concierge'}
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedText }]}>
                Policy #{policy?.policyNumber || 'Active'} &bull; 24/7 Fast-Track
              </Text>
            </View>
            <TouchableOpacity testID="btn-close" accessibilityLabel="Close"
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={colors.heading} />
            </TouchableOpacity>
          </View>

          {/* If successfully submitted */}
          {successRef ? (
            <View style={styles.successContainer}>
              <View style={styles.successIconBox}>
                <Ionicons name="checkmark-done-circle" size={56} color="#059669" />
              </View>
              <Text style={[styles.successTitle, { color: colors.heading }]}>
                Claim Reference Generated
              </Text>
              <View style={[styles.refBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.refLabel, { color: colors.mutedText }]}>AUTHORIZATION CODE</Text>
                <Text style={[styles.refCode, { color: colors.primary }]}>{successRef}</Text>
              </View>
              <Text style={[styles.successDesc, { color: colors.mutedText }]}>
                Your inquiry has been assigned to our Emergency Medical Team. A specialist is calling{' '}
                <Text style={{ fontWeight: '700', color: colors.heading }}>{contactPhone}</Text> or the hospital coordination desk within 5 minutes.
              </Text>
              <TouchableOpacity testID="btn-return-to-policy" accessibilityLabel="Return to Policy"
                style={[styles.doneBtn, { backgroundColor: colors.primary }]}
                onPress={handleDone}
              >
                <Text style={styles.doneBtnText}>Return to Policy</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Segmented Control */}
              <View style={[styles.tabsRow, { backgroundColor: colors.background }]}>
                <TouchableOpacity testID="btn-claimassistancemodal-160" accessibilityLabel="claimassistancemodal action"
                  style={[
                    styles.tabItem,
                    activeTab === 'request' && [styles.activeTabItem, { backgroundColor: colors.surface }],
                  ]}
                  onPress={() => setActiveTab('request')}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: activeTab === 'request' ? colors.heading : colors.mutedText },
                      activeTab === 'request' && styles.activeTabText,
                    ]}
                  >
                    Request Pre-Auth
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity testID="btn-claimassistancemodal-178" accessibilityLabel="claimassistancemodal action"
                  style={[
                    styles.tabItem,
                    activeTab === 'documents' && [styles.activeTabItem, { backgroundColor: colors.surface }],
                  ]}
                  onPress={() => setActiveTab('documents')}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: activeTab === 'documents' ? colors.heading : colors.mutedText },
                      activeTab === 'documents' && styles.activeTabText,
                    ]}
                  >
                    Required Docs ({policy?.requiredClaimDocs?.length || 4})
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.scrollBody}
                contentContainerStyle={{ paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
              >
                {activeTab === 'request' ? (
                  <View style={styles.formContainer}>
                    {/* Claim Type Picker */}
                    <Text style={[styles.fieldLabel, { color: colors.heading }]}>CLAIM TYPE</Text>
                    <View style={styles.claimTypeGrid}>
                      {CLAIM_TYPES.map((t) => {
                        const isSelected = claimType === t;
                        return (
                          <TouchableOpacity testID="btn-claimassistancemodal-210" accessibilityLabel="claimassistancemodal action"
                            key={t}
                            style={[
                              styles.claimTypeChip,
                              {
                                backgroundColor: isSelected ? colors.primary : colors.background,
                                borderColor: isSelected ? colors.primary : colors.border,
                              },
                            ]}
                            onPress={() => {
                              Haptics.selectionAsync().catch(() => {});
                              setClaimType(t);
                            }}
                          >
                            <Text
                              style={[
                                styles.claimTypeChipText,
                                { color: isSelected ? '#ffffff' : colors.heading },
                              ]}
                            >
                              {t}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Hospital Name */}
                    <Text style={[styles.fieldLabel, { color: colors.heading }]}>
                      TREATING HOSPITAL / CLINIC (OPTIONAL)
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.background,
                          color: colors.heading,
                          borderColor: colors.border,
                        },
                      ]}
                      value={hospitalName}
                      onChangeText={setHospitalName}
                      placeholder="e.g. Bumrungrad International or Hotel Doctor"
                      placeholderTextColor={colors.mutedText}
                    />

                    {/* City */}
                    <Text style={[styles.fieldLabel, { color: colors.heading }]}>DESTINATION CITY</Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.background,
                          color: colors.heading,
                          borderColor: colors.border,
                        },
                      ]}
                      value={city}
                      onChangeText={setCity}
                      placeholder="e.g. Bangkok, Phuket, Dubai"
                      placeholderTextColor={colors.mutedText}
                    />

                    {/* Contact Phone */}
                    <Text style={[styles.fieldLabel, { color: colors.heading }]}>
                      CONTACT PHONE NUMBER (WITH COUNTRY CODE) *
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: colors.background,
                          color: colors.heading,
                          borderColor: colors.border,
                        },
                      ]}
                      value={contactPhone}
                      onChangeText={setContactPhone}
                      placeholder="+66 81 234 5678"
                      placeholderTextColor={colors.mutedText}
                      keyboardType="phone-pad"
                    />

                    {/* Description */}
                    <Text style={[styles.fieldLabel, { color: colors.heading }]}>
                      CONDITION & EMERGENCY DETAILS *
                    </Text>
                    <TextInput
                      style={[
                        styles.textArea,
                        {
                          backgroundColor: colors.background,
                          color: colors.heading,
                          borderColor: colors.border,
                        },
                      ]}
                      value={description}
                      onChangeText={setDescription}
                      placeholder="Briefly explain symptoms, diagnosis, accident time, and whether hospitalization is required..."
                      placeholderTextColor={colors.mutedText}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />

                    {/* Fast-track assurance badge */}
                    <View style={[styles.fastTrackBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                      <Ionicons name="flash" size={16} color="#16a34a" />
                      <Text style={styles.fastTrackText}>
                        Pre-authorization requests are routed directly to on-duty physicians for instantaneous GOP (Guarantee of Payment) issuance.
                      </Text>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity testID="btn-shield-checkmark" accessibilityLabel="shield checkmark"
                      style={[
                        styles.submitBtn,
                        { backgroundColor: colors.primary, opacity: isSubmitting ? 0.7 : 1 },
                      ]}
                      onPress={handleSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <>
                          <Ionicons name="shield-checkmark" size={18} color="#ffffff" />
                          <Text style={styles.submitBtnText}>Request Emergency GOP</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.docsContainer}>
                    <Text style={[styles.docsHeader, { color: colors.heading }]}>
                      Standard Claim Checklist
                    </Text>
                    <Text style={[styles.docsDesc, { color: colors.mutedText }]}>
                      Keep these digital photos/scans ready to expedite reimbursement processing:
                    </Text>

                    {(policy?.requiredClaimDocs || []).map((doc) => (
                      <View
                        key={doc.docId}
                        style={[
                          styles.docItem,
                          {
                            backgroundColor: colors.background,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <View style={styles.docIconBox}>
                          <Ionicons
                            name={doc.isRequired ? 'document-attach' : 'document-outline'}
                            size={20}
                            color={doc.isRequired ? '#dc2626' : colors.primary}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.docTitleRow}>
                            <Text style={[styles.docTitle, { color: colors.heading }]}>
                              {doc.title}
                            </Text>
                            {doc.isRequired && (
                              <View style={styles.requiredBadge}>
                                <Text style={styles.requiredText}>MANDATORY</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.docDescText, { color: colors.mutedText }]}>
                            {doc.description}
                          </Text>
                        </View>
                      </View>
                    ))}

                    <View style={[styles.tipBox, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}>
                      <Ionicons name="bulb-outline" size={18} color="#d97706" />
                      <Text style={[styles.tipText, { color: '#b45309' }]}>
                        Tip: You can photograph receipts directly with your phone. Never leave the hospital without the signed Medical Summary and Itemized Breakdown.
                      </Text>
                    </View>
                  </View>
                )}
              </ScrollView>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  tabsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 10,
    padding: 3,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabItem: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabText: {
    fontWeight: '700',
  },
  scrollBody: {
    paddingHorizontal: 20,
  },
  formContainer: {
    paddingTop: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginTop: 12,
    marginBottom: 6,
  },
  claimTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  claimTypeChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  claimTypeChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  textArea: {
    height: 90,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    fontSize: 14,
  },
  fastTrackBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 14,
    marginBottom: 16,
  },
  fastTrackText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: '#15803d',
    fontWeight: '500',
  },
  submitBtn: {
    minHeight: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  docsContainer: {
    paddingTop: 10,
  },
  docsHeader: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  docsDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  docItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  docIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  docTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  requiredBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  requiredText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#dc2626',
    letterSpacing: 0.5,
  },
  docDescText: {
    fontSize: 12,
    lineHeight: 16,
  },
  tipBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    marginTop: 6,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  successContainer: {
    padding: 24,
    alignItems: 'center',
  },
  successIconBox: {
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14,
    textAlign: 'center',
  },
  refBox: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 14,
  },
  refLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  refCode: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
  },
  successDesc: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  doneBtn: {
    width: '100%',
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});

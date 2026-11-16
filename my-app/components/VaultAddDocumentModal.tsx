import React, { useState } from 'react';
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
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useTravelVault } from '../context/TravelVaultContext';
import { VaultDocumentType } from '../types';

interface VaultAddDocumentModalProps {
  visible: boolean;
  onClose: () => void;
}

const DOCUMENT_TYPES: { type: VaultDocumentType; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { type: 'passport', label: 'Passport', icon: 'book', color: '#2563EB' },
  { type: 'visa', label: 'E-Visa / Permit', icon: 'shield-checkmark', color: '#059669' },
  { type: 'boarding_pass', label: 'Boarding Pass', icon: 'airplane', color: '#D97706' },
  { type: 'insurance', label: 'Insurance Policy', icon: 'medical', color: '#7C3AED' },
  { type: 'id_card', label: 'National ID / License', icon: 'card', color: '#4B5563' },
];

export const VaultAddDocumentModal: React.FC<VaultAddDocumentModalProps> = ({
  visible,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { addDocument } = useTravelVault();

  const [selectedType, setSelectedType] = useState<VaultDocumentType>('passport');
  const [title, setTitle] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [issuingCountry, setIssuingCountry] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setSelectedType('passport');
    setTitle('');
    setDocumentNumber('');
    setHolderName('');
    setExpiryDate('');
    setIssuingCountry('');
    setNotes('');
  };

  const handleSave = async () => {
    if (!title.trim() || !documentNumber.trim() || !holderName.trim()) {
      Alert.alert('Required Fields', 'Please fill in Document Title, Document Number, and Traveler Name.');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Haptics fallback
    }

    await addDocument({
      type: selectedType,
      title: title.trim(),
      documentNumber: documentNumber.trim(),
      holderName: holderName.trim(),
      expiryDate: expiryDate.trim() || '2030-12-31',
      issuingCountry: issuingCountry.trim() || 'International',
      notes: notes.trim() || undefined,
    });

    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.root, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity testID="btn-close" accessibilityLabel="Close" onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={colors.heading} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.heading }]}>Secure New Document</Text>
          <TouchableOpacity testID="btn-save" accessibilityLabel="Save" onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={[styles.formContainer, { paddingBottom: Math.max(insets.bottom, 24) + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Document Type Selector */}
          <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>SELECT DOCUMENT CATEGORY</Text>
          <View style={styles.typeGrid}>
            {DOCUMENT_TYPES.map((dt) => {
              const isSelected = selectedType === dt.type;
              return (
                <TouchableOpacity testID="btn-vaultadddocumentmodal-118" accessibilityLabel="vaultadddocumentmodal action"
                  key={dt.type}
                  style={[
                    styles.typeCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isSelected ? dt.color : colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => {
                    try {
                      Haptics.selectionAsync();
                    } catch {
                      // Haptics fallback
                    }
                    setSelectedType(dt.type);
                    if (!title) {
                      setTitle(`${dt.label}`);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.typeIconBox, { backgroundColor: `${dt.color}15` }]}>
                    <Ionicons name={dt.icon} size={20} color={dt.color} />
                  </View>
                  <Text
                    style={[
                      styles.typeLabel,
                      { color: isSelected ? dt.color : colors.text, fontWeight: isSelected ? '700' : '500' },
                    ]}
                    numberOfLines={1}
                  >
                    {dt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Document Title */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>DOCUMENT TITLE *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. Primary Passport, Schengen Visa"
              placeholderTextColor={colors.mutedText}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Document / Number */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>DOCUMENT / POLICY NUMBER *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. Z1234567, POL-992011"
              placeholderTextColor={colors.mutedText}
              value={documentNumber}
              onChangeText={setDocumentNumber}
              autoCapitalize="characters"
            />
          </View>

          {/* Holder Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>FULL TRAVELER NAME *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="Name as it appears on official ID"
              placeholderTextColor={colors.mutedText}
              value={holderName}
              onChangeText={setHolderName}
            />
          </View>

          {/* Row: Expiry Date + Issuing Authority */}
          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>EXPIRY DATE (YYYY-MM-DD)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                placeholder="2030-12-31"
                placeholderTextColor={colors.mutedText}
                value={expiryDate}
                onChangeText={setExpiryDate}
                keyboardType="numbers-and-punctuation"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>ISSUING COUNTRY / ORG</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                placeholder="e.g. India, Thai Embassy"
                placeholderTextColor={colors.mutedText}
                value={issuingCountry}
                onChangeText={setIssuingCountry}
              />
            </View>
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: colors.mutedText }]}>NOTES / EMERGENCY INSTRUCTIONS</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. Keep original in hotel safe, photocopy with tour leader."
              placeholderTextColor={colors.mutedText}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Encryption Note */}
          <View style={[styles.securityNote, { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}30` }]}>
            <Ionicons name="lock-closed" size={16} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.securityNoteText, { color: colors.text }]}>
              End-to-End Local Storage: Your travel credentials are encrypted and stored strictly on-device for offline in-trip access.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 16,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  formContainer: {
    padding: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
  },
  typeIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  typeLabel: {
    fontSize: 12,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 14,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  textArea: {
    height: 72,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  securityNoteText: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
});

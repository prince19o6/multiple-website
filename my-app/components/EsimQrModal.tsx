import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { ActiveEsimProfile } from '../types';

interface EsimQrModalProps {
  visible: boolean;
  onClose: () => void;
  profile: ActiveEsimProfile | null;
}

export const EsimQrModal: React.FC<EsimQrModalProps> = ({ visible, onClose, profile }) => {
  const colors = useColors();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!profile) return null;

  const handleCopy = (label: string, text: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2500);
    Alert.alert('Copied to Clipboard', `${label} has been copied to your clipboard.`);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.heading }]}>
                Install Your eSIM
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedText }]}>
                {profile.packageTitle}
              </Text>
            </View>
            <TouchableOpacity testID="btn-close"
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close QR install modal"
            >
              <Ionicons name="close" size={24} color={colors.heading} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* QR Code Container */}
            <View style={styles.qrContainer}>
              <View style={styles.qrFrame}>
                <Image
                  source={{ uri: profile.qrCodeUrl }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={[styles.qrHelpText, { color: colors.mutedText }]}>
                Scan this code from a secondary screen/printout, or copy the manual codes below.
              </Text>
            </View>

            {/* Manual Activation Code Box */}
            <View style={[styles.codeBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              {/* SM-DP+ Address */}
              <View style={styles.codeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.codeLabel, { color: colors.mutedText }]}>SM-DP+ ADDRESS</Text>
                  <Text style={[styles.codeValue, { color: colors.heading }]} selectable>
                    {profile.smdpAddress}
                  </Text>
                </View>
                <TouchableOpacity testID="btn-esimqrmodal-92" accessibilityLabel="esimqrmodal action"
                  style={[styles.copyBtn, { backgroundColor: `${colors.primary}12` }]}
                  onPress={() => handleCopy('SM-DP+ Address', profile.smdpAddress)}
                  accessibilityRole="button"
                >
                  <Ionicons
                    name={copiedField === 'SM-DP+ Address' ? 'checkmark' : 'copy-outline'}
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={[styles.copyBtnText, { color: colors.primary }]}>
                    {copiedField === 'SM-DP+ Address' ? 'Copied' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              {/* Activation Code */}
              <View style={styles.codeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.codeLabel, { color: colors.mutedText }]}>ACTIVATION CODE</Text>
                  <Text style={[styles.codeValue, { color: colors.heading }]} selectable>
                    {profile.activationCode}
                  </Text>
                </View>
                <TouchableOpacity testID="btn-esimqrmodal-118" accessibilityLabel="esimqrmodal action"
                  style={[styles.copyBtn, { backgroundColor: `${colors.primary}12` }]}
                  onPress={() => handleCopy('Activation Code', profile.activationCode)}
                  accessibilityRole="button"
                >
                  <Ionicons
                    name={copiedField === 'Activation Code' ? 'checkmark' : 'copy-outline'}
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={[styles.copyBtnText, { color: colors.primary }]}>
                    {copiedField === 'Activation Code' ? 'Copied' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              {/* ICCID */}
              <View style={styles.codeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.codeLabel, { color: colors.mutedText }]}>ICCID NUMBER</Text>
                  <Text style={[styles.codeValue, { color: colors.heading }]} selectable>
                    {profile.iccid}
                  </Text>
                </View>
                <TouchableOpacity testID="btn-esimqrmodal-144" accessibilityLabel="esimqrmodal action"
                  style={[styles.copyBtn, { backgroundColor: `${colors.primary}12` }]}
                  onPress={() => handleCopy('ICCID', profile.iccid)}
                  accessibilityRole="button"
                >
                  <Ionicons
                    name={copiedField === 'ICCID' ? 'checkmark' : 'copy-outline'}
                    size={16}
                    color={colors.primary}
                  />
                  <Text style={[styles.copyBtnText, { color: colors.primary }]}>
                    {copiedField === 'ICCID' ? 'Copied' : 'Copy'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Step-by-Step Instructions */}
            <Text style={[styles.sectionHeading, { color: colors.heading }]}>
              DEVICE SETUP INSTRUCTIONS
            </Text>

            <View style={[styles.instructionsCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.platformSection}>
                <View style={styles.platformHeader}>
                  <Ionicons name="logo-apple" size={16} color={colors.heading} />
                  <Text style={[styles.platformTitle, { color: colors.heading }]}>Apple iPhone (iOS)</Text>
                </View>
                <Text style={[styles.stepItem, { color: colors.mutedText }]}>
                  1. Open <Text style={{ fontWeight: '700' }}>Settings &gt; Cellular / Mobile Data</Text>.
                </Text>
                <Text style={[styles.stepItem, { color: colors.mutedText }]}>
                  2. Tap <Text style={{ fontWeight: '700' }}>Add eSIM</Text> (or Add Cellular Plan).
                </Text>
                <Text style={[styles.stepItem, { color: colors.mutedText }]}>
                  3. Tap <Text style={{ fontWeight: '700' }}>Use QR Code</Text> or <Text style={{ fontWeight: '700' }}>Enter Details Manually</Text> using the SM-DP+ address and code above.
                </Text>
                <Text style={[styles.stepItem, { color: colors.mutedText }]}>
                  4. Label this plan "Travel eSIM" and enable <Text style={{ fontWeight: '700', color: '#15803d' }}>Data Roaming</Text> once landed.
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.platformSection}>
                <View style={styles.platformHeader}>
                  <Ionicons name="logo-android" size={16} color="#15803d" />
                  <Text style={[styles.platformTitle, { color: colors.heading }]}>Android (Samsung, Pixel)</Text>
                </View>
                <Text style={[styles.stepItem, { color: colors.mutedText }]}>
                  1. Open <Text style={{ fontWeight: '700' }}>Settings &gt; Connections &gt; SIM Manager</Text>.
                </Text>
                <Text style={[styles.stepItem, { color: colors.mutedText }]}>
                  2. Select <Text style={{ fontWeight: '700' }}>Add eSIM &gt; Scan QR code</Text>.
                </Text>
                <Text style={[styles.stepItem, { color: colors.mutedText }]}>
                  3. Scan the code or tap "Enter activation code". Turn on Roaming on arrival.
                </Text>
              </View>
            </View>

            <TouchableOpacity testID="btn-done" accessibilityLabel="Done"
              style={[styles.doneBtn, { backgroundColor: colors.primary }]}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 18,
  },
  qrFrame: {
    width: 200,
    height: 200,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  qrImage: {
    width: 180,
    height: 180,
  },
  qrHelpText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 280,
  },
  codeBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  codeLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  codeValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  instructionsCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    marginBottom: 18,
  },
  platformSection: {
    gap: 4,
  },
  platformHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  platformTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  stepItem: {
    fontSize: 12,
    lineHeight: 17,
  },
  doneBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

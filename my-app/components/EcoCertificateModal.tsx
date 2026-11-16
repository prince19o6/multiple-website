import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Clipboard,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { OffsetContribution } from '../types';

interface EcoCertificateModalProps {
  contribution: OffsetContribution | null;
  visible: boolean;
  onClose: () => void;
}

export const EcoCertificateModal: React.FC<EcoCertificateModalProps> = ({
  contribution,
  visible,
  onClose,
}) => {
  const colors = useColors();
  const [copied, setCopied] = useState<boolean>(false);

  if (!contribution) return null;

  const handleCopySerial = () => {
    Clipboard.setString(contribution.certificateNumber);
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      await Share.share({
        message: `I just offset ${contribution.offsetAmountKg} kg of travel emissions through ${contribution.projectName}! Official Certificate: ${contribution.certificateNumber} 🌱`,
      });
    } catch {
      // Ignored
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.certificateCard, { backgroundColor: colors.surface }]}>
          {/* Certificate Border Ring */}
          <View style={[styles.innerFrame, { borderColor: colors.border }]}>
            {/* Top Seal */}
            <View style={styles.sealCircle}>
              <Ionicons name="ribbon" size={32} color="#059669" />
            </View>

            <Text style={[styles.certHeading, { color: colors.heading }]}>
              OFFICIAL CLIMATE OFFSET CERTIFICATE
            </Text>
            <Text style={[styles.certSub, { color: colors.mutedText }]}>
              Verified Carbon Retirement & Green Explorer Registry
            </Text>

            {/* Serial Box */}
            <TouchableOpacity testID="btn-certificate-serial" accessibilityLabel="CERTIFICATE SERIAL"
              style={[styles.serialBox, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={handleCopySerial}
              activeOpacity={0.7}
            >
              <Text style={[styles.serialLabel, { color: colors.mutedText }]}>CERTIFICATE SERIAL</Text>
              <Text style={[styles.serialNum, { color: colors.primary }]}>
                {contribution.certificateNumber}
              </Text>
              <Text style={[styles.copyHint, { color: colors.mutedText }]}>
                {copied ? 'Copied to clipboard!' : 'Tap to copy'}
              </Text>
            </TouchableOpacity>

            {/* Certificate Body */}
            <Text style={[styles.bodyText, { color: colors.heading }]}>
              This certifies that{' '}
              <Text style={{ fontWeight: '800', color: colors.primary }}>
                {contribution.travelerName}
              </Text>{' '}
              has successfully retired
            </Text>

            <View style={styles.amountBadge}>
              <Text style={styles.amountText}>{contribution.offsetAmountKg.toFixed(1)} KG CO2e</Text>
            </View>

            <Text style={[styles.projectCredText, { color: colors.mutedText }]}>
              Invested directly into the verified climate initiative:{'\n'}
              <Text style={{ fontWeight: '700', color: colors.heading }}>
                {contribution.projectName}
              </Text>
            </Text>

            <Text style={[styles.dateText, { color: colors.mutedText }]}>
              Certified on {contribution.certifiedDate} &bull; Status: {contribution.status.replace('_', ' ')}
            </Text>

            {/* Action Row */}
            <View style={styles.actionsRow}>
              <TouchableOpacity testID="btn-share" accessibilityLabel="Share"
                style={[styles.shareBtn, { backgroundColor: colors.primary }]}
                onPress={handleShare}
                activeOpacity={0.85}
              >
                <Ionicons name="share-social-outline" size={16} color="#ffffff" />
                <Text style={styles.shareBtnText}>Share Certificate</Text>
              </TouchableOpacity>

              <TouchableOpacity testID="btn-done" accessibilityLabel="Done"
                style={[styles.closeBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={[styles.closeBtnText, { color: colors.heading }]}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  certificateCard: {
    width: '100%',
    borderRadius: 24,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  innerFrame: {
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: 'dashed',
    padding: 18,
    alignItems: 'center',
  },
  sealCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  certHeading: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },
  certSub: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 14,
    textAlign: 'center',
  },
  serialBox: {
    width: '100%',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 12,
  },
  serialLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  serialNum: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  copyHint: {
    fontSize: 10,
    marginTop: 2,
  },
  bodyText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  amountBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    marginBottom: 10,
  },
  amountText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: 0.5,
  },
  projectCredText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 10,
  },
  dateText: {
    fontSize: 11,
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  shareBtn: {
    flex: 1.4,
    minHeight: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  shareBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  closeBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

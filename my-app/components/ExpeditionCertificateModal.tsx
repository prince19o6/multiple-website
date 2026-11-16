import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ExpeditionCertificate } from '@/types';

interface ExpeditionCertificateModalProps {
  visible: boolean;
  onClose: () => void;
  certificate: ExpeditionCertificate;
}

export function ExpeditionCertificateModal({
  visible,
  onClose,
  certificate,
}: ExpeditionCertificateModalProps) {
  if (!visible) return null;

  const handleShareOrDownload = () => {
    Alert.alert(
      'Certificate of Completion',
      `Official Certificate [${certificate.certificateId}] successfully recorded.\nYou can present this certificate at airport check-in or partner hotels for VIP courtesies.`
    );
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.modalContent}>
          {/* Close Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Official Expedition Diploma</Text>
            <TouchableOpacity testID="btn-close" accessibilityLabel="Close" onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#1E293B" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Certificate Parchment Box */}
            <View style={styles.parchment}>
              {/* Outer Golden Border */}
              <View style={styles.goldBorder}>
                {/* Inner Border */}
                <View style={styles.innerBorder}>
                  {/* Top Seal Crest */}
                  <View style={styles.crestContainer}>
                    <Ionicons name="shield-checkmark" size={36} color="#B45309" />
                    <Text style={styles.crestText}>CERTIFIED EXPEDITION LAUREATE</Text>
                  </View>

                  <Text style={styles.mainTitle}>{certificate.title}</Text>

                  <Text style={styles.presentedTo}>THIS HONORS DIPLOMA IS ACCORDED TO</Text>
                  <Text style={styles.recipientName}>{certificate.recipientName}</Text>

                  <View style={styles.dividerLine} />

                  <Text style={styles.citationText}>"{certificate.citation}"</Text>

                  <View style={styles.dividerLine} />

                  {/* Signatory & Gold Seal */}
                  <View style={styles.footerRow}>
                    <View style={styles.signatureBlock}>
                      <Text style={styles.signatureName}>{certificate.expeditionSignature}</Text>
                      <Text style={styles.signatureTitle}>Authorized Expedition Director</Text>
                      <Text style={styles.issueDate}>Conferred: {certificate.issueDate}</Text>
                    </View>

                    <View style={styles.goldSealBadge}>
                      <Ionicons name="ribbon" size={24} color="#D97706" />
                      <Text style={styles.sealLabel}>OFFICIAL</Text>
                      <Text style={styles.sealSub}>SOVEREIGN</Text>
                    </View>
                  </View>

                  <Text style={styles.certIdText}>CERTIFICATE ID: {certificate.certificateId}</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
              <TouchableOpacity testID="btn-download-outline" accessibilityLabel="download outline"
                style={styles.downloadButton}
                onPress={handleShareOrDownload}
                activeOpacity={0.85}
              >
                <Ionicons name="download-outline" size={18} color="#FFFFFF" />
                <Text style={styles.downloadText}>Save / Share Honors Diploma</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxHeight: '92%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  parchment: {
    backgroundColor: '#FFFDF5',
    borderRadius: 16,
    padding: 8,
    width: '100%',
    shadowColor: '#B45309',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  goldBorder: {
    borderWidth: 2,
    borderColor: '#D4AF37',
    borderRadius: 12,
    padding: 6,
  },
  innerBorder: {
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.6)',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  crestContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  crestText: {
    color: '#92400E',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  mainTitle: {
    color: '#78350F',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  presentedTo: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  recipientName: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 12,
  },
  dividerLine: {
    width: '70%',
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.4)',
    marginVertical: 10,
  },
  citationText: {
    color: '#475569',
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: 10,
    marginVertical: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 12,
    paddingHorizontal: 8,
  },
  signatureBlock: {
    flex: 1,
  },
  signatureName: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
  },
  signatureTitle: {
    color: '#64748B',
    fontSize: 10,
  },
  issueDate: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  goldSealBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#D4AF37',
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sealLabel: {
    color: '#B45309',
    fontSize: 8,
    fontWeight: '900',
  },
  sealSub: {
    color: '#92400E',
    fontSize: 7,
    fontWeight: '700',
  },
  certIdText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 14,
    letterSpacing: 0.5,
  },
  actionContainer: {
    width: '100%',
    marginTop: 16,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#B45309',
    paddingVertical: 13,
    borderRadius: 14,
  },
  downloadText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

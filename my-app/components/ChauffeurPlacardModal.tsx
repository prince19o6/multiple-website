import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { useSite } from '@/store/SiteConfigContext';
import { AirportTransfer } from '../types';

interface ChauffeurPlacardModalProps {
  visible: boolean;
  transfer: AirportTransfer;
  onClose: () => void;
}

export const ChauffeurPlacardModal: React.FC<ChauffeurPlacardModalProps> = ({
  visible,
  transfer,
  onClose,
}) => {
  const colors = useColors();
  const { siteId } = useSite();

  const getBrandSubtitle = () => {
    switch (siteId) {
      case 'tripgoasia':
        return 'TRIPGOASIA ISLANDS EXPEDITION GUEST';
      case 'technoheaven':
        return 'TECHNOHEAVEN VIP EXECUTIVE PROTOCOL';
      default:
        return 'GUJJUTOURS OFFICIAL PILGRIMAGE & TOUR GUEST';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Full-Screen Placard Card */}
        <View style={styles.placardContainer}>
          {/* Close Icon in corner */}
          <TouchableOpacity testID="btn-close"
            style={styles.closeBtn}
            onPress={onClose}
            accessibilityLabel="Close Placard"
            accessibilityRole="button"
          >
            <Ionicons name="close-circle" size={32} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.placardBoard}>
            {/* Top Brand Banner */}
            <View style={styles.bannerRow}>
              <Ionicons name="airplane" size={16} color="#d97706" />
              <Text style={styles.bannerText}>AIRPORT MEET & GREET PAGING SIGN</Text>
            </View>

            <Text style={styles.brandSubtitle}>
              {getBrandSubtitle()}
            </Text>

            {/* Huge Name Display */}
            <View style={styles.nameContainer}>
              <Text style={styles.placardMainText} numberOfLines={3}>
                {transfer.digitalPagingBoardText}
              </Text>
            </View>

            <View style={styles.dashedDivider} />

            {/* Key Chauffeur & Vehicle Credentials */}
            <View style={styles.credentialsRow}>
              <View style={styles.credItem}>
                <Text style={styles.credLabel}>ASSIGNED CHAUFFEUR</Text>
                <Text style={styles.credValue}>{transfer.chauffeurName}</Text>
              </View>

              <View style={styles.credItem}>
                <Text style={styles.credLabel}>VEHICLE PLATE</Text>
                <View style={styles.plateWrap}>
                  <Text style={styles.plateText}>{transfer.vehiclePlateNumber}</Text>
                </View>
              </View>
            </View>

            <View style={styles.credentialsRow}>
              <View style={styles.credItem}>
                <Text style={styles.credLabel}>MEETING POINT</Text>
                <Text style={styles.credSubValue} numberOfLines={2}>
                  {transfer.pickupMeetingPoint}
                </Text>
              </View>

              <View style={styles.credItem}>
                <Text style={styles.credLabel}>WAITING BAY</Text>
                <Text style={styles.bayValue}>{transfer.waitingBay}</Text>
              </View>
            </View>

            {/* Bottom Footer Notice */}
            <View style={styles.footerNote}>
              <Ionicons name="information-circle-outline" size={14} color="#64748b" />
              <Text style={styles.footerNoteText}>
                Hold up your screen or show to the arrivals greeting marshal
              </Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  placardContainer: {
    width: '100%',
    maxWidth: 420,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: -46,
    right: 0,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placardBoard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 4,
    borderColor: '#d97706',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 8,
  },
  bannerText: {
    color: '#92400e',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  brandSubtitle: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 20,
  },
  nameContainer: {
    backgroundColor: '#f8fafc',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  placardMainText: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 28,
  },
  dashedDivider: {
    width: '100%',
    height: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  credentialsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 14,
  },
  credItem: {
    flex: 1,
  },
  credLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  credValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  credSubValue: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
    lineHeight: 16,
  },
  plateWrap: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  plateText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  bayValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#d97706',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  footerNoteText: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
  },
});

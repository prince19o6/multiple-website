import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { useEsim } from '../context/EsimContext';

interface AirportWifiModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AirportWifiModal: React.FC<AirportWifiModalProps> = ({ visible, onClose }) => {
  const colors = useColors();
  const { wifiGuides, emergencyUssdCodes } = useEsim();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.heading }]}>
                Airport Wi-Fi & Hotspots
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedText }]}>
                Offline airport connection guides & carrier balance codes
              </Text>
            </View>
            <TouchableOpacity testID="btn-close"
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close Wi-Fi guide"
            >
              <Ionicons name="close" size={24} color={colors.heading} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Free Airport Wi-Fi Guides */}
            <Text style={[styles.sectionHeading, { color: colors.heading }]}>
              FREE AIRPORT WI-FI NETWORKS
            </Text>

            {wifiGuides.map((guide, idx) => (
              <View
                key={idx}
                style={[
                  styles.wifiCard,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.wifiHeader}>
                  <View style={styles.airportTitleGroup}>
                    <Ionicons name="airplane" size={16} color={colors.primary} />
                    <Text style={[styles.airportName, { color: colors.heading }]}>
                      {guide.airportName}
                    </Text>
                  </View>
                  <View style={styles.speedBadge}>
                    <Text style={styles.speedText}>{guide.speedTier}</Text>
                  </View>
                </View>

                {/* SSID Box */}
                <View style={styles.ssidRow}>
                  <Text style={[styles.ssidLabel, { color: colors.mutedText }]}>NETWORK SSID:</Text>
                  <View style={styles.ssidPill}>
                    <Ionicons name="wifi" size={12} color="#15803d" />
                    <Text style={styles.ssidName}>{guide.ssid}</Text>
                  </View>
                </View>

                <Text style={[styles.loginSteps, { color: colors.mutedText }]}>
                  {guide.loginSteps}
                </Text>

                <View style={styles.wifiFooter}>
                  <View style={styles.footerItem}>
                    <Ionicons name="time-outline" size={12} color={colors.mutedText} />
                    <Text style={[styles.footerText, { color: colors.mutedText }]}>
                      Time: {guide.timeLimit}
                    </Text>
                  </View>
                  <View style={styles.footerItem}>
                    <Ionicons name="location-outline" size={12} color={colors.mutedText} />
                    <Text style={[styles.footerText, { color: colors.mutedText }]}>
                      {guide.helpDeskLocation}
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            {/* Emergency Carrier USSD Codes */}
            {emergencyUssdCodes && Object.keys(emergencyUssdCodes).length > 0 && (
              <View style={[styles.ussdCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.ussdHeader}>
                  <Ionicons name="keypad-outline" size={16} color={colors.primary} />
                  <Text style={[styles.ussdTitle, { color: colors.heading }]}>
                    Carrier USSD Shortcodes (Offline)
                  </Text>
                </View>

                <View style={styles.ussdGrid}>
                  {Object.entries(emergencyUssdCodes).map(([label, code], idx) => (
                    <View key={idx} style={styles.ussdItem}>
                      <Text style={[styles.ussdLabel, { color: colors.mutedText }]}>{label}</Text>
                      <View style={styles.ussdCodeBox}>
                        <Text style={[styles.ussdCode, { color: colors.primary }]}>{code}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <TouchableOpacity testID="btn-dismiss" accessibilityLabel="Dismiss"
              style={[styles.dismissBtn, { backgroundColor: colors.primary }]}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.dismissBtnText}>Close Wi-Fi Guide</Text>
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
    gap: 12,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  wifiCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  wifiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  airportTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  airportName: {
    fontSize: 14,
    fontWeight: '700',
  },
  speedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  speedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803d',
  },
  ssidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ssidLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ssidPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ssidName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  loginSteps: {
    fontSize: 12,
    lineHeight: 17,
  },
  wifiFooter: {
    flexDirection: 'column',
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 11,
  },
  ussdCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  ussdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ussdTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  ussdGrid: {
    gap: 6,
  },
  ussdItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  ussdLabel: {
    fontSize: 12,
  },
  ussdCodeBox: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ussdCode: {
    fontSize: 12,
    fontWeight: '800',
  },
  dismissBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  dismissBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

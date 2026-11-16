import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/store/ThemeContext';
import { useEsim } from '../context/EsimContext';

interface EsimHeroCardProps {
  style?: StyleProp<ViewStyle>;
}

export const EsimHeroCard: React.FC<EsimHeroCardProps> = ({ style }) => {
  const router = useRouter();
  const colors = useColors();
  const { activeProfile, setIsWifiModalOpen } = useEsim();

  const remainingGb = activeProfile
    ? Math.max(0, Math.round((activeProfile.totalDataGb - activeProfile.usedDataGb) * 10) / 10)
    : null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={[styles.iconBox, { backgroundColor: `${colors.primary}15` }]}>
            <Ionicons name="cellular" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.heading }]}>
              Travel eSIM & 5G Roaming
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedText }]} numberOfLines={1}>
              {activeProfile
                ? `${activeProfile.carrierName} · ${activeProfile.destinationName}`
                : 'Instant International Cellular Connectivity'}
            </Text>
          </View>
        </View>

        <View style={styles.networkBadge}>
          <Text style={styles.networkBadgeText}>5G READY</Text>
        </View>
      </View>

      {/* Metric / Information Box */}
      <View style={[styles.infoBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.infoLeft}>
          <Text style={[styles.infoLabel, { color: colors.mutedText }]}>
            {activeProfile ? 'CELLULAR DATA BALANCE' : 'DESTINATION ROAMING'}
          </Text>
          <Text style={[styles.infoMain, { color: remainingGb !== null ? '#15803d' : colors.heading }]}>
            {remainingGb !== null ? `${remainingGb} GB Available` : 'Instant 5G Travel eSIM'}
          </Text>
          <Text style={[styles.infoSub, { color: colors.mutedText }]}>
            {activeProfile
              ? `${activeProfile.daysRemaining} days remaining on ${activeProfile.packageTitle}`
              : 'Scan QR code & connect instantly at your destination airport without roaming fees'}
          </Text>
        </View>

        <TouchableOpacity testID="btn-wifi"
          style={[styles.wifiShortcutBtn, { borderColor: colors.border }]}
          onPress={() => setIsWifiModalOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Open airport Wi-Fi instructions"
        >
          <Ionicons name="wifi" size={16} color={colors.primary} />
          <Text style={[styles.wifiShortcutText, { color: colors.primary }]}>Airport Wi-Fi</Text>
        </TouchableOpacity>
      </View>

      {/* Primary Action Button */}
      <TouchableOpacity testID="btn-qr-code-outline"
        style={[styles.actionBtn, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/esim-roaming')}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Open eSIM Roaming Hub"
      >
        <Ionicons name="qr-code-outline" size={17} color="#ffffff" style={{ marginRight: 6 }} />
        <Text style={styles.actionBtnText}>Open eSIM & Cellular Hub</Text>
        <Ionicons name="chevron-forward" size={16} color="#ffffff" style={{ marginLeft: 4 }} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  networkBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  networkBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803d',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  infoLeft: {
    flex: 1,
    marginRight: 8,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  infoMain: {
    fontSize: 19,
    fontWeight: '800',
    marginTop: 2,
    marginBottom: 2,
  },
  infoSub: {
    fontSize: 11,
    lineHeight: 15,
  },
  wifiShortcutBtn: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 3,
    minWidth: 70,
  },
  wifiShortcutText: {
    fontSize: 10,
    fontWeight: '700',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 12,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});

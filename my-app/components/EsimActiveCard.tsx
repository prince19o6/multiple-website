import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { ActiveEsimProfile } from '../types';

interface EsimActiveCardProps {
  profile: ActiveEsimProfile;
  onOpenQr: () => void;
  onOpenTopUp: () => void;
  style?: StyleProp<ViewStyle>;
}

export const EsimActiveCard: React.FC<EsimActiveCardProps> = ({
  profile,
  onOpenQr,
  onOpenTopUp,
  style,
}) => {
  const colors = useColors();

  const usedPercent = Math.min(100, Math.round((profile.usedDataGb / (profile.totalDataGb || 1)) * 100));
  const remainingGb = Math.max(0, Math.round((profile.totalDataGb - profile.usedDataGb) * 10) / 10);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {/* Top Carrier Row */}
      <View style={styles.topRow}>
        <View style={styles.carrierGroup}>
          <View style={[styles.signalIconBox, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="cellular" size={18} color="#15803d" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.carrierRow}>
              <Text style={[styles.carrierName, { color: colors.heading }]}>
                {profile.carrierName}
              </Text>
              <View style={styles.activePill}>
                <View style={styles.pulsingDot} />
                <Text style={styles.activePillText}>CONNECTED</Text>
              </View>
            </View>
            <Text style={[styles.packageTitle, { color: colors.mutedText }]} numberOfLines={1}>
              {profile.packageTitle}
            </Text>
          </View>
        </View>
      </View>

      {/* Main Data Meter */}
      <View style={[styles.meterContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.meterHeader}>
          <View>
            <Text style={[styles.meterLabel, { color: colors.mutedText }]}>REMAINING 5G DATA</Text>
            <Text style={[styles.remainingText, { color: remainingGb > 2 ? '#15803d' : '#ea580c' }]}>
              {remainingGb} GB
            </Text>
          </View>
          <View style={styles.daysBadge}>
            <Ionicons name="time-outline" size={12} color="#0284c7" />
            <Text style={styles.daysBadgeText}>{profile.daysRemaining} Days Left</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${usedPercent}%`,
                backgroundColor: usedPercent > 85 ? '#ef4444' : colors.primary,
              },
            ]}
          />
        </View>

        <View style={styles.meterFooter}>
          <Text style={[styles.usedSubText, { color: colors.mutedText }]}>
            {profile.usedDataGb.toFixed(1)} GB used of {profile.totalDataGb.toFixed(1)} GB Total
          </Text>
          <Text style={[styles.apnText, { color: colors.mutedText }]}>
            APN: {profile.apnSetting}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity testID="btn-qr-code-outline"
          style={[styles.qrBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
          onPress={onOpenQr}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="View eSIM installation QR code and activation address"
        >
          <Ionicons name="qr-code-outline" size={16} color={colors.heading} />
          <Text style={[styles.qrBtnText, { color: colors.heading }]}>Install Code</Text>
        </TouchableOpacity>

        <TouchableOpacity testID="btn-flash"
          style={[styles.topUpBtn, { backgroundColor: colors.primary }]}
          onPress={onOpenTopUp}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Top up data booster"
        >
          <Ionicons name="flash" size={16} color="#ffffff" />
          <Text style={styles.topUpBtnText}>+ Top Up Data</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  carrierGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  signalIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carrierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  carrierName: {
    fontSize: 15,
    fontWeight: '800',
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#15803d',
  },
  activePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803d',
    letterSpacing: 0.4,
  },
  packageTitle: {
    fontSize: 11,
    marginTop: 1,
  },
  meterContainer: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  meterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  meterLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  remainingText: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 2,
  },
  daysBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  daysBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284c7',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  meterFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usedSubText: {
    fontSize: 11,
  },
  apnText: {
    fontSize: 10,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qrBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  qrBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  topUpBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    gap: 6,
  },
  topUpBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});

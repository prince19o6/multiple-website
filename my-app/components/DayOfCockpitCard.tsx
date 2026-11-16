import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useSite } from '@/store/SiteConfigContext';
import { useDayOfDispatch } from '../context/DayOfDispatchContext';

interface DayOfCockpitCardProps {
  style?: object;
}

export const DayOfCockpitCard: React.FC<DayOfCockpitCardProps> = ({ style }) => {
  const router = useRouter();
  const colors = useColors();
  const { siteId } = useSite();
  const { dispatch, currentStop, openBoardingPassModal } = useDayOfDispatch();

  if (!dispatch) return null;

  const handleLaunchCockpit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/day-cockpit');
  };

  const handleCallDriver = () => {
    if (!dispatch.assignedCrew.driverPhone) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const clean = dispatch.assignedCrew.driverPhone.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${clean}`);
  };

  const brandPillColor = colors.accent || colors.primary || '#ea580c';

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      {/* Top Status Header */}
      <View style={styles.topRow}>
        <View style={styles.badgeGroup}>
          <View style={[styles.pulsingDot, { backgroundColor: brandPillColor }]} />
          <Text style={[styles.badgeText, { color: brandPillColor }]}>
            MISSION ACTIVE TODAY
          </Text>
        </View>

        <TouchableOpacity testID="btn-qr-code-outline"
          style={[styles.qrQuickBtn, { borderColor: colors.border }]}
          onPress={openBoardingPassModal}
          accessibilityRole="button"
          accessibilityLabel="Open boarding pass QR"
        >
          <Ionicons name="qr-code-outline" size={16} color={colors.text} />
          <Text style={[styles.qrQuickText, { color: colors.text }]}>Pass</Text>
        </TouchableOpacity>
      </View>

      {/* Main Tour Title */}
      <Text style={[styles.tourTitle, { color: colors.heading }]} numberOfLines={1}>
        {dispatch.tourName}
      </Text>

      {/* Current Stop & Status */}
      <View style={styles.statusBox}>
        <Ionicons name="navigate-circle" size={18} color={colors.primary} />
        <View style={styles.statusTextGroup}>
          <Text style={[styles.statusSummary, { color: colors.text }]}>
            {currentStop ? `Current: ${currentStop.stopName}` : dispatch.currentStatusSummary}
          </Text>
          <Text style={[styles.pickupNote, { color: colors.mutedText }]}>
            {dispatch.assignedCrew.driverStatus} • {dispatch.assignedCrew.vehiclePlateNumber}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: colors.primary, width: `${dispatch.overallProgressPercent}%` },
          ]}
        />
      </View>

      {/* Footer Controls */}
      <View style={[styles.footerRow, { borderTopColor: colors.border }]}>
        <TouchableOpacity testID="btn-call-outline"
          style={[styles.callDriverBtn, { borderColor: colors.border }]}
          onPress={handleCallDriver}
          accessibilityRole="button"
          accessibilityLabel="Call chauffeur"
        >
          <Ionicons name="call-outline" size={16} color={colors.text} />
          <Text style={[styles.callDriverText, { color: colors.text }]} numberOfLines={1}>
            {dispatch.assignedCrew.driverName.split(' ')[0]}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity testID="btn-launch-mission-cockpit"
          style={[styles.launchBtn, { backgroundColor: colors.primary }]}
          onPress={handleLaunchCockpit}
          accessibilityRole="button"
          accessibilityLabel="Launch Expedition Cockpit"
        >
          <Text style={styles.launchBtnText}>Launch Mission Cockpit</Text>
          <Ionicons name="arrow-forward" size={16} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  qrQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  qrQuickText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tourTitle: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
    marginBottom: 8,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
  },
  statusTextGroup: {
    flex: 1,
  },
  statusSummary: {
    fontSize: 13,
    fontWeight: '700',
  },
  pickupNote: {
    fontSize: 11,
    marginTop: 2,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 10,
  },
  callDriverBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 44,
    gap: 6,
  },
  callDriverText: {
    fontSize: 12,
    fontWeight: '700',
  },
  launchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    minHeight: 44,
    gap: 6,
  },
  launchBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});

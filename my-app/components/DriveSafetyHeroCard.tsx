import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useDriveSafety } from '../context/DriveSafetyContext';

interface DriveSafetyHeroCardProps {
  style?: StyleProp<ViewStyle>;
}

export const DriveSafetyHeroCard: React.FC<DriveSafetyHeroCardProps> = ({ style }) => {
  const router = useRouter();
  const colors = useColors();
  const { hubData, setIsInspectionModalOpen } = useDriveSafety();

  const handleOpenHub = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/drive-safety' as any);
  };

  const handleOpenInspection = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIsInspectionModalOpen(true);
  };

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
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={[styles.iconBox, { backgroundColor: '#eff6ff' }]}>
            <Ionicons name="car-sport" size={20} color="#2563eb" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.heading }]}>
              Road Rules & Motorbike Safety
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedText }]} numberOfLines={1}>
              {hubData?.country || 'Destination'} &bull; IDP Laws & Rental Scam Shield
            </Text>
          </View>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>{hubData?.country?.toUpperCase() || 'SAFETY'}</Text>
        </View>
      </View>

      {/* Quick Specs Strip */}
      <View style={[styles.specsBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.specCol}>
          <Text style={[styles.specLabel, { color: colors.mutedText }]}>DRIVING SIDE</Text>
          <Text style={[styles.specMain, { color: '#0284c7' }]}>
            {hubData?.drivingSide.includes('LEFT') ? 'LEFT SIDE' : 'RIGHT SIDE'}
          </Text>
        </View>

        <View style={styles.specDivider} />

        <View style={styles.specCol}>
          <Text style={[styles.specLabel, { color: colors.mutedText }]}>IDP LICENSE</Text>
          <Text style={[styles.specMain, { color: '#dc2626' }]}>Mandatory</Text>
        </View>

        <View style={styles.specDivider} />

        <View style={styles.specCol}>
          <Text style={[styles.specLabel, { color: colors.mutedText }]}>EMERGENCY</Text>
          <Text style={[styles.specMain, { color: '#16a34a' }]}>
            {hubData?.roadsideAssistanceNumber || '1155'}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.mainBtn, { backgroundColor: colors.primary }]}
          onPress={handleOpenHub}
          activeOpacity={0.85}
        >
          <Ionicons name="book-outline" size={16} color="#ffffff" />
          <Text style={styles.mainBtnText}>Road Rules & Scam Shield</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.inspectBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={handleOpenInspection}
          activeOpacity={0.7}
        >
          <Ionicons name="camera-outline" size={16} color={colors.heading} />
          <Text style={[styles.inspectBtnText, { color: colors.heading }]}>Pre-Ride Check</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
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
    flex: 1,
    marginRight: 8,
    gap: 10,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  badge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1d4ed8',
  },
  specsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  specCol: {
    flex: 1,
    alignItems: 'center',
  },
  specDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#e2e8f0',
  },
  specLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  specMain: {
    fontSize: 12,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  mainBtn: {
    flex: 1.4,
    minHeight: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  mainBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  inspectBtn: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  inspectBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useTransit } from '../context/TransitContext';

interface TransitHeroCardProps {
  style?: StyleProp<ViewStyle>;
}

export const TransitHeroCard: React.FC<TransitHeroCardProps> = ({ style }) => {
  const router = useRouter();
  const colors = useColors();
  const {
    transitData,
    setIsTaxiModalOpen,
  } = useTransit();

  const handleOpenHub = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/transit-guide' as any);
  };

  const handleOpenTaxiModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIsTaxiModalOpen(true);
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
            <Ionicons name="train-outline" size={20} color="#1d4ed8" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.heading }]}>
              Rapid Transit & Taxi Scam Shield
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedText }]} numberOfLines={1}>
              {transitData?.city || 'Bangkok'} &bull; BTS, MRT Subway & Taxi Fair-Fare
            </Text>
          </View>
        </View>

        <TouchableOpacity testID="btn-shield-checkmark" accessibilityLabel="shield checkmark"
          style={styles.scamBadge}
          onPress={handleOpenTaxiModal}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="shield-checkmark" size={13} color="#16a34a" />
          <Text style={styles.scamBadgeText}>Meter Shield</Text>
        </TouchableOpacity>
      </View>

      {/* Info Strip */}
      <View style={[styles.infoBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.infoCol}>
          <Text style={[styles.infoLabel, { color: colors.mutedText }]}>BASE METER FARE</Text>
          <Text style={[styles.infoMain, { color: '#16a34a' }]}>
            {transitData?.taxiGuide?.baseMeterFare || '35 THB base rate'}
          </Text>
        </View>

        <View style={styles.infoDivider} />

        <View style={styles.infoCol}>
          <Text style={[styles.infoLabel, { color: colors.mutedText }]}>FASTEST TRANSIT</Text>
          <Text style={[styles.infoMain, { color: colors.heading }]}>
            Airport Train: 26 mins
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity testID="btn-subway-outline" accessibilityLabel="subway outline"
          style={[styles.mainBtn, { backgroundColor: colors.primary }]}
          onPress={handleOpenHub}
          activeOpacity={0.85}
        >
          <Ionicons name="subway-outline" size={16} color="#ffffff" />
          <Text style={styles.mainBtnText}>Metro Lines & Route Fares</Text>
        </TouchableOpacity>

        <TouchableOpacity testID="btn-calculator-outline" accessibilityLabel="calculator outline"
          style={[styles.checkBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={handleOpenTaxiModal}
          activeOpacity={0.7}
        >
          <Ionicons name="calculator-outline" size={16} color={colors.heading} />
          <Text style={[styles.checkBtnText, { color: colors.heading }]}>Fair Taxi Fare</Text>
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
  scamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    gap: 4,
  },
  scamBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  infoCol: {
    flex: 1,
  },
  infoDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 10,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  infoMain: {
    fontSize: 12,
    fontWeight: '700',
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
  checkBtn: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  checkBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

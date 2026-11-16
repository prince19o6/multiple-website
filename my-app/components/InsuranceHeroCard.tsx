import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { useInsurance } from '../context/InsuranceContext';

interface InsuranceHeroCardProps {
  style?: StyleProp<ViewStyle>;
}

export const InsuranceHeroCard: React.FC<InsuranceHeroCardProps> = ({ style }) => {
  const router = useRouter();
  const colors = useColors();
  const { policy, hospitals } = useInsurance();

  const handleOpenWallet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push('/insurance' as any);
  };

  const handleCallEmergency = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    const phone = policy?.emergencyAssistancePhone || '+66 2 118 8111';
    const clean = phone.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${clean}`).catch(() => {});
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
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={[styles.iconBox, { backgroundColor: '#ecfdf5' }]}>
            <Ionicons name="shield-checkmark" size={20} color="#059669" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.heading }]}>
              Travel Insurance & Medical
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedText }]} numberOfLines={1}>
              {policy ? `${policy.underwriterName} · ${policy.planTier}` : 'Comprehensive Global Protection'}
            </Text>
          </View>
        </View>

        <View style={styles.guaranteeBadge}>
          <Text style={styles.guaranteeBadgeText}>$500K COVERAGE</Text>
        </View>
      </View>

      {/* Info Strip */}
      <View style={[styles.infoBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.infoCol}>
          <Text style={[styles.infoLabel, { color: colors.mutedText }]}>POLICY STATUS</Text>
          <View style={styles.statusRow}>
            <View style={styles.greenDot} />
            <Text style={[styles.infoMain, { color: colors.heading }]}>
              {policy?.policyNumber || 'Active Protection'}
            </Text>
          </View>
        </View>

        <View style={styles.infoDivider} />

        <View style={styles.infoCol}>
          <Text style={[styles.infoLabel, { color: colors.mutedText }]}>CASHLESS HOSPITALS</Text>
          <Text style={[styles.infoMain, { color: colors.primary }]}>
            {hospitals.length > 0 ? `${hospitals.length} Pre-Approved Centers` : '24/7 Global ER Network'}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity testID="btn-wallet-outline" accessibilityLabel="wallet outline"
          style={[styles.mainBtn, { backgroundColor: colors.primary }]}
          onPress={handleOpenWallet}
          activeOpacity={0.85}
        >
          <Ionicons name="wallet-outline" size={16} color="#ffffff" />
          <Text style={styles.mainBtnText}>Open Policy Wallet</Text>
        </TouchableOpacity>

        <TouchableOpacity testID="btn-call" accessibilityLabel="call"
          style={[styles.sosBtn, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}
          onPress={handleCallEmergency}
          activeOpacity={0.7}
        >
          <Ionicons name="call" size={16} color="#dc2626" />
          <Text style={styles.sosBtnText}>24/7 SOS</Text>
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
  guaranteeBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  guaranteeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803d',
    letterSpacing: 0.4,
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
  },
  infoMain: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
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
    fontSize: 13,
    fontWeight: '700',
  },
  sosBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  sosBtnText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '700',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Clipboard,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { TravelInsurancePolicy } from '../types';

interface PolicyCardProps {
  policy: TravelInsurancePolicy;
  onOpenClaimModal: () => void;
  style?: StyleProp<ViewStyle>;
}

export const PolicyCard: React.FC<PolicyCardProps> = ({
  policy,
  onOpenClaimModal,
  style,
}) => {
  const colors = useColors();
  const [copied, setCopied] = useState(false);

  const handleCopyPolicy = () => {
    Clipboard.setString(policy.policyNumber);
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCallEmergency = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    const cleanPhone = policy.emergencyAssistancePhone.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {});
  };

  const handleWhatsApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const cleanPhone = policy.emergencyWhatsApp.replace(/[^\d]/g, '');
    const text = encodeURIComponent(
      `Hello, I need emergency travel medical assistance. My policy number is ${policy.policyNumber}.`
    );
    Linking.openURL(`https://wa.me/${cleanPhone}?text=${text}`).catch(() => {});
  };

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
      {/* Top Header Badge */}
      <View style={styles.topRow}>
        <View style={styles.underwriterBadge}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={18} color="#059669" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.underwriterName, { color: colors.heading }]} numberOfLines={1}>
              {policy.underwriterName}
            </Text>
            <Text style={[styles.planTierText, { color: colors.mutedText }]} numberOfLines={1}>
              {policy.planTier}
            </Text>
          </View>
        </View>

        <View style={styles.statusPill}>
          <View style={styles.pulsingDot} />
          <Text style={styles.statusPillText}>{policy.status.toUpperCase()}</Text>
        </View>
      </View>

      {/* Policy Details Strip */}
      <View style={[styles.detailsStrip, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.detailCol}>
          <Text style={[styles.detailLabel, { color: colors.mutedText }]}>INSURED TRAVELER</Text>
          <Text style={[styles.detailValue, { color: colors.heading }]} numberOfLines={1}>
            {policy.policyHolderName}
          </Text>
          <Text style={[styles.subValue, { color: colors.mutedText }]}>
            +{policy.beneficiaryCount - 1} Covered Dependent(s)
          </Text>
        </View>

        <View style={styles.detailDivider} />

        <View style={styles.detailCol}>
          <Text style={[styles.detailLabel, { color: colors.mutedText }]}>POLICY NUMBER</Text>
          <TouchableOpacity testID="btn-copypolicy" accessibilityLabel="Copy Policy"
            style={styles.copyRow}
            onPress={handleCopyPolicy}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.policyNumberText, { color: colors.primary }]}>
              {policy.policyNumber}
            </Text>
            <Ionicons
              name={copied ? 'checkmark-circle' : 'copy-outline'}
              size={15}
              color={copied ? '#059669' : colors.primary}
            />
          </TouchableOpacity>
          <Text style={[styles.subValue, { color: colors.mutedText }]}>
            {copied ? 'Copied to clipboard!' : 'Tap to copy'}
          </Text>
        </View>
      </View>

      {/* Coverage Highlights */}
      <View style={styles.coverageRow}>
        <View style={[styles.coveragePill, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
          <Ionicons name="medkit" size={14} color="#16a34a" />
          <Text style={styles.coveragePillText}>$500k Emergency Medical</Text>
        </View>
        {policy.adventureSportsRider && (
          <View style={[styles.coveragePill, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
            <Ionicons name="boat" size={14} color="#2563eb" />
            <Text style={[styles.coveragePillText, { color: '#1d4ed8' }]}>Adventure Rider</Text>
          </View>
        )}
      </View>

      {/* Dates row */}
      <View style={styles.datesRow}>
        <Ionicons name="calendar-outline" size={14} color={colors.mutedText} />
        <Text style={[styles.datesText, { color: colors.mutedText }]}>
          Valid: {policy.startDate} &mdash; {policy.endDate}
        </Text>
      </View>

      {/* Action Buttons Row */}
      <View style={styles.actionRow}>
        <TouchableOpacity testID="btn-call" accessibilityLabel="call"
          style={[styles.primaryActionBtn, { backgroundColor: '#dc2626' }]}
          onPress={handleCallEmergency}
          activeOpacity={0.85}
        >
          <Ionicons name="call" size={16} color="#ffffff" />
          <Text style={styles.primaryActionText}>24/7 SOS Call</Text>
        </TouchableOpacity>

        <TouchableOpacity testID="btn-logo-whatsapp" accessibilityLabel="logo whatsapp"
          style={[styles.secondaryActionBtn, { backgroundColor: '#25D366' }]}
          onPress={handleWhatsApp}
          activeOpacity={0.85}
        >
          <Ionicons name="logo-whatsapp" size={17} color="#ffffff" />
          <Text style={styles.secondaryActionText}>WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity testID="btn-document-text-outline" accessibilityLabel="document text outline"
          style={[
            styles.claimActionBtn,
            { backgroundColor: colors.background, borderColor: colors.border },
          ]}
          onPress={onOpenClaimModal}
          activeOpacity={0.7}
        >
          <Ionicons name="document-text-outline" size={16} color={colors.heading} />
          <Text style={[styles.claimActionText, { color: colors.heading }]}>File Claim</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  underwriterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  underwriterName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  planTierText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  pulsingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#16a34a',
    marginRight: 5,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
    letterSpacing: 0.5,
  },
  detailsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  detailCol: {
    flex: 1,
  },
  detailDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 12,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  subValue: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  policyNumberText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  coverageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  coveragePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  coveragePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803d',
  },
  datesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  datesText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryActionBtn: {
    flex: 1.2,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    gap: 6,
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    minHeight: 44,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    gap: 5,
  },
  secondaryActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  claimActionBtn: {
    minHeight: 44,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    gap: 5,
  },
  claimActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

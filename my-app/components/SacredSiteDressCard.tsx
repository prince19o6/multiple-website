import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/store/ThemeContext';
import { DressCodeRule } from '../types';

interface SacredSiteDressCardProps {
  rule: DressCodeRule;
  onCheckOutfit: (rule: DressCodeRule) => void;
  style?: StyleProp<ViewStyle>;
}

export const SacredSiteDressCard: React.FC<SacredSiteDressCardProps> = ({
  rule,
  onCheckOutfit,
  style,
}) => {
  const colors = useColors();

  let siteBadgeColor = '#eff6ff';
  let siteBadgeBorder = '#bfdbfe';
  let siteBadgeText = '#1d4ed8';

  if (rule.siteType === 'Grand_Palace') {
    siteBadgeColor = '#fef3c7';
    siteBadgeBorder = '#fde68a';
    siteBadgeText = '#b45309';
  } else if (rule.siteType === 'Islamic_Mosque') {
    siteBadgeColor = '#ecfdf5';
    siteBadgeBorder = '#a7f3d0';
    siteBadgeText = '#047857';
  } else if (rule.siteType === 'Hindu_Mandir') {
    siteBadgeColor = '#fff7ed';
    siteBadgeBorder = '#fed7aa';
    siteBadgeText = '#c2410c';
  }

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
      {/* Top Header */}
      <View style={styles.topRow}>
        <View style={styles.titleWrap}>
          <Text style={[styles.siteName, { color: colors.heading }]}>
            {rule.siteName}
          </Text>
          <Text style={[styles.destCountry, { color: colors.mutedText }]}>
            {rule.destinationCountry} &bull; Security Gate Enforced
          </Text>
        </View>

        <View style={[styles.badge, { backgroundColor: siteBadgeColor, borderColor: siteBadgeBorder }]}>
          <Text style={[styles.badgeText, { color: siteBadgeText }]}>
            {rule.siteType.replace('_', ' ')}
          </Text>
        </View>
      </View>

      {/* Policies Strip */}
      <View style={[styles.policyBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.policyRow}>
          <Ionicons name="footsteps-outline" size={15} color={colors.primary} />
          <Text style={[styles.policyText, { color: colors.heading }]}>
            {rule.footwearPolicy}
          </Text>
        </View>

        <View style={[styles.policyRow, { marginTop: 6 }]}>
          <Ionicons name="glasses-outline" size={15} color="#d97706" />
          <Text style={[styles.policyText, { color: colors.heading }]}>
            {rule.headwearPolicy}
          </Text>
        </View>
      </View>

      {/* Key Strict Rules List */}
      <View style={styles.rulesList}>
        {rule.keyRules.map((kr, idx) => (
          <View key={idx} style={styles.ruleItem}>
            <Ionicons name="ellipse" size={5} color={colors.primary} style={{ marginTop: 6 }} />
            <Text style={[styles.ruleText, { color: colors.mutedText }]}>{kr}</Text>
          </View>
        ))}
      </View>

      {/* On-Site Rental Banner */}
      {rule.onSiteCoverupAvailable && (
        <View style={[styles.rentalBanner, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
          <Ionicons name="shirt-outline" size={15} color="#15803d" />
          <Text style={styles.rentalText}>
            On-site coverup: {rule.onSiteCoverupFee}
          </Text>
        </View>
      )}

      {/* Inspect Button */}
      <TouchableOpacity testID="btn-checkmark-done-circle-outline" accessibilityLabel="checkmark done circle outline"
        style={[styles.inspectBtn, { backgroundColor: colors.primary }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          onCheckOutfit(rule);
        }}
        activeOpacity={0.85}
      >
        <Ionicons name="checkmark-done-circle-outline" size={16} color="#ffffff" />
        <Text style={styles.inspectBtnText}>Check If My Outfit Passes Gate Security</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  titleWrap: {
    flex: 1,
  },
  siteName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  destCountry: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  policyBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  policyText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
    fontWeight: '500',
  },
  rulesList: {
    marginBottom: 10,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  ruleText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  rentalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    marginBottom: 12,
  },
  rentalText: {
    fontSize: 11,
    color: '#15803d',
    fontWeight: '600',
    flex: 1,
  },
  inspectBtn: {
    minHeight: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  inspectBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/store/ThemeContext';
import { useTaxRefund } from '../context/TaxRefundContext';

interface TaxRefundHeroCardProps {
  style?: StyleProp<ViewStyle>;
}

export const TaxRefundHeroCard: React.FC<TaxRefundHeroCardProps> = ({ style }) => {
  const router = useRouter();
  const colors = useColors();
  const { summary, rules, claims, setIsKioskGuideOpen } = useTaxRefund();

  const totalRefund = summary?.pendingRefund ?? 0;
  const currency = summary?.currency || rules?.currencyCode || 'THB';
  const pendingCount = summary?.totalReceiptsCount ?? claims.length;

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
            <Ionicons name="receipt" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.heading }]}>
              Tax-Free Shopping Pass
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedText }]} numberOfLines={1}>
              {rules?.taxSchemeName || 'International VAT/GST Refund'}
            </Text>
          </View>
        </View>

        <View style={[styles.taxRateBadge, { backgroundColor: '#dcfce7' }]}>
          <Text style={styles.taxRateText}>
            {rules?.vatRatePercent ? `${rules.vatRatePercent}% VAT` : 'TAX FREE'}
          </Text>
        </View>
      </View>

      {/* Main Metric Box */}
      <View style={[styles.metricBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.metricLeft}>
          <Text style={[styles.metricLabel, { color: colors.mutedText }]}>
            CLAIMABLE AIRPORT REFUND
          </Text>
          <Text style={[styles.metricValue, { color: totalRefund > 0 ? '#15803d' : colors.heading }]}>
            {totalRefund > 0 ? `+${totalRefund.toLocaleString()} ${currency}` : `0.00 ${currency}`}
          </Text>
          <Text style={[styles.metricSub, { color: colors.mutedText }]}>
            {pendingCount > 0
              ? `${pendingCount} saved ${pendingCount === 1 ? 'invoice' : 'invoices'} to claim at airport`
              : 'Add receipts to track minimum spend & customs refund'}
          </Text>
        </View>

        <TouchableOpacity testID="btn-airplane-outline"
          style={[styles.guideQuickBtn, { borderColor: colors.border }]}
          onPress={() => setIsKioskGuideOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Open airport tax refund guide"
        >
          <Ionicons name="airplane-outline" size={16} color={colors.primary} />
          <Text style={[styles.guideQuickText, { color: colors.primary }]}>Airport Guide</Text>
        </TouchableOpacity>
      </View>

      {/* Primary Action Button */}
      <TouchableOpacity testID="btn-cash-outline"
        style={[styles.actionBtn, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/tax-refund')}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Open Tax Refund and Duty Free Tracker"
      >
        <Ionicons name="cash-outline" size={17} color="#ffffff" style={{ marginRight: 6 }} />
        <Text style={styles.actionBtnText}>Open Tax-Free Refund Pass</Text>
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
  taxRateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  taxRateText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803d',
  },
  metricBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  metricLeft: {
    flex: 1,
    marginRight: 8,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
    marginBottom: 2,
  },
  metricSub: {
    fontSize: 11,
    lineHeight: 15,
  },
  guideQuickBtn: {
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
  guideQuickText: {
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

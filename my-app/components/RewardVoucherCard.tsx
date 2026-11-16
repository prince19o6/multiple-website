import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors, useIsDark } from '@/store/ThemeContext';
import type { LoyaltyRewardVoucher } from '@/types';

interface RewardVoucherCardProps {
  voucher: LoyaltyRewardVoucher;
  userPoints: number;
  isClaimed: boolean;
  onClaim: (voucherCode: string, pointsCost: number) => Promise<void>;
}

export function RewardVoucherCard({
  voucher,
  userPoints,
  isClaimed,
  onClaim,
}: RewardVoucherCardProps) {
  const colors = useColors();
  const isDark = useIsDark();
  const [claiming, setClaiming] = useState(false);

  const canAfford = userPoints >= voucher.pointsCost;

  const handleClaimPress = async () => {
    if (isClaimed) {
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText(voucher.voucherCode);
          Alert.alert('Code Copied!', `Promo code ${voucher.voucherCode} copied to clipboard.`);
        }
      } else {
        Alert.alert('Promo Voucher Code', `Use code "${voucher.voucherCode}" at checkout.`);
      }
      return;
    }

    if (!canAfford) {
      Alert.alert(
        'Insufficient Points',
        `You need ${voucher.pointsCost} points for this reward. Current balance: ${userPoints} points.`
      );
      return;
    }

    try {
      setClaiming(true);
      await onClaim(voucher.voucherCode, voucher.pointsCost);
    } catch (e: any) {
      Alert.alert('Claim Failed', e?.message || 'Could not claim voucher.');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          borderColor: isClaimed
            ? '#10B981'
            : isDark
            ? 'rgba(255, 215, 0, 0.2)'
            : 'rgba(0, 0, 0, 0.08)',
        },
      ]}
    >
      {/* Top Tag Row */}
      <View style={styles.topRow}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{voucher.category}</Text>
        </View>

        <View
          style={[
            styles.discountBadge,
            { backgroundColor: isClaimed ? '#ECFDF5' : '#FEF3C7' },
          ]}
        >
          <Text
            style={[
              styles.discountText,
              { color: isClaimed ? '#059669' : '#D97706' },
            ]}
          >
            {voucher.discountLabel}
          </Text>
        </View>
      </View>

      {/* Title & Description */}
      <Text style={[styles.title, { color: colors.heading }]}>{voucher.title}</Text>
      <Text style={[styles.description, { color: colors.mutedText }]}>{voucher.description}</Text>

      {/* Expiry & Code info */}
      <View style={styles.metaRow}>
        <View style={styles.expiryRow}>
          <Ionicons name="time-outline" size={14} color={colors.mutedText} />
          <Text style={[styles.expiryText, { color: colors.mutedText }]}>
            Expires {voucher.expiryDate}
          </Text>
        </View>

        <View style={styles.costBadge}>
          <Ionicons name="diamond-outline" size={12} color="#D97706" />
          <Text style={styles.costText}>{voucher.pointsCost} Pts</Text>
        </View>
      </View>

      {/* Action Button */}
      <TouchableOpacity testID="btn-claimpress" accessibilityLabel="Claim Press"
        style={[
          styles.actionButton,
          isClaimed
            ? styles.claimedButton
            : canAfford
            ? styles.claimButton
            : styles.disabledButton,
        ]}
        onPress={handleClaimPress}
        disabled={claiming || (!isClaimed && !canAfford)}
        activeOpacity={0.85}
      >
        <Ionicons
          name={isClaimed ? 'copy-outline' : 'gift-outline'}
          size={16}
          color={isClaimed ? '#065F46' : '#FFFFFF'}
        />
        <Text
          style={[
            styles.actionButtonText,
            { color: isClaimed ? '#065F46' : '#FFFFFF' },
          ]}
        >
          {isClaimed
            ? `Copy Code: ${voucher.voucherCode}`
            : claiming
            ? 'Unlocking...'
            : canAfford
            ? `Redeem for ${voucher.pointsCost} Pts`
            : `Need ${voucher.pointsCost - userPoints} More Pts`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '700',
  },
  discountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
  },
  discountText: {
    fontSize: 11,
    fontWeight: '800',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expiryText: {
    fontSize: 11,
  },
  costBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  costText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '800',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
  },
  claimButton: {
    backgroundColor: '#D97706',
  },
  claimedButton: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },
});

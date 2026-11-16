import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { TaxRefundReceipt } from '../types';

interface TaxReceiptCardProps {
  receipt: TaxRefundReceipt;
  onAdvanceStatus: (claimId: string, nextStatus: 'Draft' | 'Customs_Inspected' | 'Refund_Claimed') => void;
  onDelete: (claimId: string) => void;
  onPress?: () => void;
  style?: object;
}

export const TaxReceiptCard: React.FC<TaxReceiptCardProps> = ({
  receipt,
  onAdvanceStatus,
  onDelete,
  onPress,
  style,
}) => {
  const colors = useColors();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Luxury & Watches':
        return 'watch-outline';
      case 'Electronics & Gadgets':
        return 'phone-portrait-outline';
      case 'Jewelry & Gold':
        return 'diamond-outline';
      case 'Cosmetics & Perfumes':
        return 'sparkles-outline';
      default:
        return 'shirt-outline';
    }
  };

  const getStatusBadge = () => {
    switch (receipt.status) {
      case 'Refund_Claimed':
        return {
          label: 'REFUND CLAIMED',
          bgColor: '#dcfce7',
          textColor: '#15803d',
          icon: 'checkmark-circle' as const,
        };
      case 'Customs_Inspected':
        return {
          label: 'CUSTOMS STAMPED',
          bgColor: '#e0f2fe',
          textColor: '#0284c7',
          icon: 'shield-checkmark' as const,
        };
      default:
        return {
          label: 'PENDING AIRPORT',
          bgColor: '#fef3c7',
          textColor: '#b45309',
          icon: 'time-outline' as const,
        };
    }
  };

  const statusBadge = getStatusBadge();

  const handleNextStatus = () => {
    if (receipt.status === 'Draft') {
      onAdvanceStatus(receipt.claimId, 'Customs_Inspected');
    } else if (receipt.status === 'Customs_Inspected') {
      onAdvanceStatus(receipt.claimId, 'Refund_Claimed');
    } else {
      Alert.alert(
        'Revert Status',
        'Do you want to reset this receipt back to Pending Airport status?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reset', onPress: () => onAdvanceStatus(receipt.claimId, 'Draft') },
        ]
      );
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Receipt',
      `Are you sure you want to remove the invoice for ${receipt.storeName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(receipt.claimId) },
      ]
    );
  };

  return (
    <TouchableOpacity testID="btn-press" accessibilityLabel="Press"
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
      activeOpacity={onPress ? 0.85 : 1}
      onPress={onPress}
    >
      {/* Top Meta Row */}
      <View style={styles.topRow}>
        <View style={styles.storeInfoGroup}>
          <View style={[styles.catIconBox, { backgroundColor: `${colors.primary}12` }]}>
            <Ionicons name={getCategoryIcon(receipt.category)} size={18} color={colors.primary} />
          </View>
          <View style={styles.storeTextGroup}>
            <Text style={[styles.storeName, { color: colors.heading }]} numberOfLines={1}>
              {receipt.storeName}
            </Text>
            {receipt.storeBranch ? (
              <Text style={[styles.storeBranch, { color: colors.mutedText }]} numberOfLines={1}>
                {receipt.storeBranch}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusBadge.bgColor }]}>
          <Ionicons name={statusBadge.icon} size={11} color={statusBadge.textColor} />
          <Text style={[styles.statusText, { color: statusBadge.textColor }]}>
            {statusBadge.label}
          </Text>
        </View>
      </View>

      {/* Financials Row: Purchase & Net Refund */}
      <View style={[styles.amountRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.amountCol}>
          <Text style={[styles.amountLabel, { color: colors.mutedText }]}>PURCHASE AMOUNT</Text>
          <Text style={[styles.purchaseAmount, { color: colors.heading }]}>
            {receipt.purchaseAmount.toLocaleString()} {receipt.currency}
          </Text>
        </View>

        <View style={styles.verticalDivider} />

        <View style={styles.amountCol}>
          <Text style={[styles.amountLabel, { color: '#15803d' }]}>EST. NET REFUND</Text>
          <Text style={styles.refundAmount}>
            +{receipt.estimatedRefundAmount.toLocaleString()} {receipt.currency}
          </Text>
        </View>
      </View>

      {/* Physical Customs Inspection Warning */}
      {receipt.requiresPhysicalInspection && receipt.status !== 'Refund_Claimed' && (
        <View style={styles.inspectionWarningBox}>
          <Ionicons name="alert-circle" size={14} color="#d97706" />
          <Text style={styles.inspectionWarningText}>
            Keep in carry-on bag: Customs officer will inspect this luxury item before check-in.
          </Text>
        </View>
      )}

      {/* Invoice & Form ID Row */}
      <View style={styles.metaRow}>
        <View style={styles.metaCol}>
          <Text style={[styles.metaText, { color: colors.mutedText }]}>
            Form: <Text style={{ fontWeight: '700' }}>{receipt.taxFormNumber}</Text>
          </Text>
          <Text style={[styles.metaText, { color: colors.mutedText }]}>
            Date: {receipt.purchaseDate}
          </Text>
        </View>

        {receipt.invoiceNumber ? (
          <Text style={[styles.invoiceNumber, { color: colors.mutedText }]}>
            #{receipt.invoiceNumber}
          </Text>
        ) : null}
      </View>

      {/* Card Actions Footer */}
      <View style={styles.actionsRow}>
        <TouchableOpacity testID="btn-nextstatus"
          style={[
            styles.statusActionBtn,
            {
              backgroundColor:
                receipt.status === 'Refund_Claimed'
                  ? '#dcfce7'
                  : receipt.status === 'Customs_Inspected'
                  ? '#0284c7'
                  : colors.primary,
            },
          ]}
          onPress={handleNextStatus}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Change tax claim status. Currently ${receipt.status}`}
        >
          <Ionicons
            name={
              receipt.status === 'Refund_Claimed'
                ? 'checkmark-done-circle'
                : receipt.status === 'Customs_Inspected'
                ? 'cash-outline'
                : 'shield-checkmark-outline'
            }
            size={16}
            color={receipt.status === 'Refund_Claimed' ? '#15803d' : '#ffffff'}
          />
          <Text
            style={[
              styles.statusActionBtnText,
              { color: receipt.status === 'Refund_Claimed' ? '#15803d' : '#ffffff' },
            ]}
          >
            {receipt.status === 'Draft'
              ? 'Mark Customs Inspected'
              : receipt.status === 'Customs_Inspected'
              ? 'Mark Refund Collected'
              : 'Refund Completed'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity testID="btn-trash-outline"
          style={styles.deleteBtn}
          onPress={confirmDelete}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Delete tax refund invoice"
        >
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  storeInfoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  catIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeTextGroup: {
    flex: 1,
  },
  storeName: {
    fontSize: 15,
    fontWeight: '700',
  },
  storeBranch: {
    fontSize: 11,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  amountCol: {
    flex: 1,
  },
  verticalDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 10,
  },
  amountLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  purchaseAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  refundAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#15803d',
  },
  inspectionWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
  },
  inspectionWarningText: {
    fontSize: 11,
    color: '#92400e',
    flex: 1,
    lineHeight: 15,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaCol: {
    gap: 2,
  },
  metaText: {
    fontSize: 11,
  },
  invoiceNumber: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 10,
    gap: 6,
  },
  statusActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  deleteBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/store/ThemeContext';
import { useTaxRefund, ClaimStatusFilter } from '../context/TaxRefundContext';
import { TaxReceiptCard } from '../components/TaxReceiptCard';
import { AddTaxReceiptModal } from '../components/AddTaxReceiptModal';
import { AirportKioskGuideModal } from '../components/AirportKioskGuideModal';
import { CustomsAllowanceSheet } from '../components/CustomsAllowanceSheet';
import { TaxRefundReceipt } from '../types';

export default function TaxRefundScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useColors();

  const {
    rules,
    allowances,
    claims,
    summary,
    isLoading,
    isRefreshing,
    selectedFilter,
    setSelectedFilter,
    filteredClaims,
    isAddModalOpen,
    setIsAddModalOpen,
    isKioskGuideOpen,
    setIsKioskGuideOpen,
    isAllowanceSheetOpen,
    setIsAllowanceSheetOpen,
    changeStatus,
    removeReceipt,
    refreshData,
  } = useTaxRefund();

  const currency = summary?.currency || rules?.currencyCode || 'THB';
  const totalPurchases = summary?.totalPurchases ?? 0;
  const totalRefund = summary?.totalEstimatedRefund ?? 0;
  const pendingRefund = summary?.pendingRefund ?? 0;
  const pendingInspectionCount = summary?.pendingInspectionCount ?? 0;

  const draftCount = claims.filter((c) => c.status === 'Draft').length;
  const inspectedCount = claims.filter((c) => c.status === 'Customs_Inspected').length;
  const claimedCount = claims.filter((c) => c.status === 'Refund_Claimed').length;

  const filterTabs: { id: ClaimStatusFilter; label: string; count: number }[] = [
    { id: 'All', label: 'All Receipts', count: claims.length },
    { id: 'Draft', label: 'Pending Airport', count: draftCount },
    { id: 'Customs_Inspected', label: 'Stamped', count: inspectedCount },
    { id: 'Refund_Claimed', label: 'Refunded', count: claimedCount },
  ];

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Destination Scheme Banner */}
      <View style={[styles.schemeBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.schemeTopRow}>
          <View style={[styles.schemeIconBox, { backgroundColor: `${colors.primary}15` }]}>
            <Ionicons name="card" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <View style={styles.officialPill}>
                <Ionicons name="shield-checkmark" size={10} color="#15803d" />
                <Text style={styles.officialPillText}>OFFICIAL SCHEME</Text>
              </View>
              <View style={[styles.vatRatePill, { backgroundColor: `${colors.primary}12` }]}>
                <Text style={[styles.vatRatePillText, { color: colors.primary }]}>
                  {rules?.vatRatePercent}% VAT
                </Text>
              </View>
            </View>
            <Text style={[styles.schemeName, { color: colors.heading }]}>
              {rules?.taxSchemeName || 'Tourist VAT / GST Refund'}
            </Text>
          </View>
        </View>

        {/* Rules Highlights Bar */}
        <View style={[styles.rulesGrid, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.ruleCol}>
            <Text style={[styles.ruleLabel, { color: colors.mutedText }]}>MIN SPEND/STORE</Text>
            <Text style={[styles.ruleVal, { color: colors.heading }]}>
              {rules?.minimumSpendPerStore.toLocaleString()} {currency}
            </Text>
          </View>
          <View style={styles.ruleDivider} />
          <View style={styles.ruleCol}>
            <Text style={[styles.ruleLabel, { color: colors.mutedText }]}>MIN AIRPORT CLAIM</Text>
            <Text style={[styles.ruleVal, { color: colors.heading }]}>
              {rules?.minimumTotalAirportClaim.toLocaleString()} {currency}
            </Text>
          </View>
          <View style={styles.ruleDivider} />
          <View style={styles.ruleCol}>
            <Text style={[styles.ruleLabel, { color: colors.mutedText }]}>EST. NET REFUND</Text>
            <Text style={[styles.ruleVal, { color: '#15803d' }]}>
              ~{rules?.estimatedRefundPercent}%
            </Text>
          </View>
        </View>

        {/* Airport Desk Shortcut Row */}
        <View style={styles.guideButtonsRow}>
          <TouchableOpacity testID="btn-airplane"
            style={[styles.guideBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
            onPress={() => setIsKioskGuideOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Open Airport Customs & Refund Steps"
          >
            <Ionicons name="airplane" size={16} color={colors.primary} />
            <Text style={[styles.guideBtnText, { color: colors.heading }]}>
              Airport Kiosks & Gates
            </Text>
            <Ionicons name="chevron-forward" size={14} color={colors.mutedText} />
          </TouchableOpacity>

          <TouchableOpacity testID="btn-shield-outline"
            style={[styles.guideBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
            onPress={() => setIsAllowanceSheetOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Open Return Customs Allowance Guide"
          >
            <Ionicons name="shield-outline" size={16} color="#8b5cf6" />
            <Text style={[styles.guideBtnText, { color: colors.heading }]}>
              Customs Allowances
            </Text>
            <Ionicons name="chevron-forward" size={14} color={colors.mutedText} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Financial Summary Card */}
      <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.summaryTop}>
          <View>
            <Text style={[styles.summaryLabel, { color: colors.mutedText }]}>
              TOTAL ESTIMATED AIRPORT REFUND
            </Text>
            <Text style={[styles.summaryRefundAmount, { color: '#15803d' }]}>
              +{totalRefund.toLocaleString()} {currency}
            </Text>
          </View>

          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeLabel}>PENDING CLAIM</Text>
            <Text style={styles.pendingBadgeAmount}>
              {pendingRefund.toLocaleString()} {currency}
            </Text>
          </View>
        </View>

        <View style={[styles.summaryBottom, { borderTopColor: colors.border }]}>
          <View style={styles.summarySubItem}>
            <Ionicons name="cart-outline" size={14} color={colors.mutedText} />
            <Text style={[styles.summarySubText, { color: colors.mutedText }]}>
              Total Purchases: <Text style={{ fontWeight: '700', color: colors.heading }}>{totalPurchases.toLocaleString()} {currency}</Text>
            </Text>
          </View>

          {pendingInspectionCount > 0 && (
            <View style={styles.inspectionAlertPill}>
              <Ionicons name="alert-circle" size={12} color="#b45309" />
              <Text style={styles.inspectionAlertPillText}>
                {pendingInspectionCount} luxury items need customs check
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterTabsScroll}
      >
        {filterTabs.map((tab) => {
          const isSelected = selectedFilter === tab.id;
          return (
            <TouchableOpacity testID="btn-tax-refund-195" accessibilityLabel="tax-refund action"
              key={tab.id}
              style={[
                styles.filterTab,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedFilter(tab.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterTabText,
                  {
                    color: isSelected ? '#ffffff' : colors.heading,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}
              >
                {tab.label}
              </Text>
              <View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : colors.background,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.countBadgeText,
                    { color: isSelected ? '#ffffff' : colors.mutedText },
                  ]}
                >
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.mutedText, marginTop: 12 }]}>
            Loading tax claims & customs rules...
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="receipt-outline" size={50} color={colors.mutedText} />
        <Text style={[styles.emptyTitle, { color: colors.heading, marginTop: 14 }]}>
          No Tax-Free Invoices Found
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.mutedText }]}>
          When shopping in department stores, ask for the "VAT Refund / Tax Free" certificate (P.P.10 or Planet tag). Tap the button below to add your receipt and calculate airport payout.
        </Text>

        <TouchableOpacity testID="btn-add-circle" accessibilityLabel="add circle"
          style={[styles.addFirstBtn, { backgroundColor: colors.primary }]}
          onPress={() => setIsAddModalOpen(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add-circle" size={18} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.addFirstBtnText}>Add First Invoice</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Navigation Bar */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: Math.max(insets.top, 12),
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.topBarRow}>
          <TouchableOpacity testID="btn-navigate"
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color={colors.heading} />
          </TouchableOpacity>

          <View style={styles.topBarTitles}>
            <Text style={[styles.topBarHeading, { color: colors.heading }]}>
              Tax-Free Shopping Pass
            </Text>
            <Text style={[styles.topBarSubheading, { color: colors.mutedText }]}>
              VAT / GST Refund & Customs Tracker
            </Text>
          </View>

          <TouchableOpacity testID="btn-add"
            style={styles.addIconBtn}
            onPress={() => setIsAddModalOpen(true)}
            accessibilityLabel="Add new tax receipt"
            accessibilityRole="button"
          >
            <Ionicons name="add" size={26} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main List of Receipts */}
      <FlatList
        data={filteredClaims}
        keyExtractor={(item: TaxRefundReceipt) => item.claimId}
        renderItem={({ item }: { item: TaxRefundReceipt }) => (
          <TaxReceiptCard
            receipt={item}
            onAdvanceStatus={(claimId, nextStatus) => changeStatus(claimId, nextStatus)}
            onDelete={(claimId) => removeReceipt(claimId)}
            style={styles.receiptCardSpacing}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 60 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshData}
            tintColor={colors.primary}
          />
        }
      />

      {/* Bottom Floating Action Button */}
      <View style={[styles.fabContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity testID="btn-add-circle"
          style={[styles.fabButton, { backgroundColor: colors.primary }]}
          onPress={() => setIsAddModalOpen(true)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Add tax-free shopping invoice"
        >
          <Ionicons name="add-circle" size={22} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.fabButtonText}>Add Tax-Free Invoice</Text>
        </TouchableOpacity>
      </View>

      {/* Interactive Modals */}
      <AddTaxReceiptModal visible={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <AirportKioskGuideModal visible={isKioskGuideOpen} onClose={() => setIsKioskGuideOpen(false)} />
      <CustomsAllowanceSheet visible={isAllowanceSheetOpen} onClose={() => setIsAllowanceSheetOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  topBarTitles: {
    flex: 1,
    marginLeft: 4,
  },
  topBarHeading: {
    fontSize: 18,
    fontWeight: '700',
  },
  topBarSubheading: {
    fontSize: 12,
    fontWeight: '400',
  },
  addIconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerContainer: {
    marginBottom: 12,
  },
  schemeBanner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  schemeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  schemeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  officialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  officialPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803d',
  },
  vatRatePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  vatRatePillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  schemeName: {
    fontSize: 15,
    fontWeight: '700',
  },
  rulesGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  ruleCol: {
    flex: 1,
    alignItems: 'center',
  },
  ruleDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#cbd5e1',
  },
  ruleLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  ruleVal: {
    fontSize: 13,
    fontWeight: '800',
  },
  guideButtonsRow: {
    flexDirection: 'column',
    gap: 8,
  },
  guideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  guideBtnText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  summaryRefundAmount: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 2,
  },
  pendingBadge: {
    alignItems: 'flex-end',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  pendingBadgeLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#92400e',
    letterSpacing: 0.5,
  },
  pendingBadgeAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#b45309',
    marginTop: 1,
  },
  summaryBottom: {
    borderTopWidth: 1,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  summarySubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summarySubText: {
    fontSize: 12,
  },
  inspectionAlertPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  inspectionAlertPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400e',
  },
  filterTabsScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterTabText: {
    fontSize: 12,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  receiptCardSpacing: {
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
  },
  addFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addFirstBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  fabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 50,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  fabButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});

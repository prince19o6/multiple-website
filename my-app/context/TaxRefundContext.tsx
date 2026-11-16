import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import { useSite } from '@/store/SiteConfigContext';
import {
  DestinationTaxRule,
  CustomsAllowanceRule,
  TaxRefundReceipt,
  TaxRefundSummary,
  CreateTaxReceiptRequest,
  UpdateClaimStatusRequest,
} from '../types';
import {
  fetchTaxRefundRules,
  fetchCustomsAllowances,
  fetchTaxClaims,
  createTaxClaim,
  updateTaxClaimStatus,
  deleteTaxClaim,
} from '../services/api';
import { storeGet, storeSet } from '../src/lib/storage';

export type ClaimStatusFilter = 'All' | 'Draft' | 'Customs_Inspected' | 'Refund_Claimed';

interface TaxRefundContextType {
  rules: DestinationTaxRule | null;
  allowances: CustomsAllowanceRule | null;
  claims: TaxRefundReceipt[];
  summary: TaxRefundSummary | null;
  isLoading: boolean;
  isRefreshing: boolean;
  selectedFilter: ClaimStatusFilter;
  setSelectedFilter: (filter: ClaimStatusFilter) => void;
  filteredClaims: TaxRefundReceipt[];
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  isKioskGuideOpen: boolean;
  setIsKioskGuideOpen: (open: boolean) => void;
  isAllowanceSheetOpen: boolean;
  setIsAllowanceSheetOpen: (open: boolean) => void;
  selectedClaim: TaxRefundReceipt | null;
  setSelectedClaim: (claim: TaxRefundReceipt | null) => void;
  calculateEstimatedRefund: (amount: number) => number;
  addReceipt: (payload: CreateTaxReceiptRequest) => Promise<boolean>;
  changeStatus: (claimId: string, status: 'Draft' | 'Customs_Inspected' | 'Refund_Claimed', notes?: string) => Promise<boolean>;
  removeReceipt: (claimId: string) => Promise<boolean>;
  refreshData: () => Promise<void>;
}

const TaxRefundContext = createContext<TaxRefundContextType | undefined>(undefined);

const getStorageKey = (siteId: string) => `@toursapp_tax_claims:${siteId}`;

export const TaxRefundProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { siteId } = useSite();

  const [rules, setRules] = useState<DestinationTaxRule | null>(null);
  const [allowances, setAllowances] = useState<CustomsAllowanceRule | null>(null);
  const [claims, setClaims] = useState<TaxRefundReceipt[]>([]);
  const [summary, setSummary] = useState<TaxRefundSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<ClaimStatusFilter>('All');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isKioskGuideOpen, setIsKioskGuideOpen] = useState<boolean>(false);
  const [isAllowanceSheetOpen, setIsAllowanceSheetOpen] = useState<boolean>(false);
  const [selectedClaim, setSelectedClaim] = useState<TaxRefundReceipt | null>(null);

  const calculateSummaryFromClaims = useCallback(
    (claimsList: TaxRefundReceipt[], currentRule: DestinationTaxRule | null): TaxRefundSummary => {
      const currency = currentRule?.currencyCode || 'THB';
      const totalPurchases = claimsList.reduce((acc, c) => acc + (c.purchaseAmount || 0), 0);
      const totalEstimatedRefund = claimsList.reduce((acc, c) => acc + (c.estimatedRefundAmount || 0), 0);
      const claimedRefund = claimsList
        .filter((c) => c.status === 'Refund_Claimed')
        .reduce((acc, c) => acc + (c.estimatedRefundAmount || 0), 0);
      const pendingRefund = claimsList
        .filter((c) => c.status !== 'Refund_Claimed')
        .reduce((acc, c) => acc + (c.estimatedRefundAmount || 0), 0);
      const pendingInspectionCount = claimsList.filter(
        (c) => c.requiresPhysicalInspection && c.status === 'Draft'
      ).length;

      return {
        totalPurchases: Math.round(totalPurchases * 100) / 100,
        totalEstimatedRefund: Math.round(totalEstimatedRefund * 100) / 100,
        claimedRefund: Math.round(claimedRefund * 100) / 100,
        pendingRefund: Math.round(pendingRefund * 100) / 100,
        totalReceiptsCount: claimsList.length,
        pendingInspectionCount,
        currency,
      };
    },
    []
  );

  const loadTaxData = useCallback(async () => {
    try {
      // 1. Try local cache first for instant offline render
      const cached = await storeGet(getStorageKey(siteId)).catch(() => null);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed.claims)) {
            setClaims(parsed.claims);
            if (parsed.summary) setSummary(parsed.summary);
            if (parsed.rules) setRules(parsed.rules);
          }
        } catch {}
      }

      // 2. Fetch fresh from backend
      const [rulesRes, allowancesRes, claimsRes] = await Promise.all([
        fetchTaxRefundRules(siteId),
        fetchCustomsAllowances(siteId),
        fetchTaxClaims(siteId),
      ]);

      if (rulesRes) setRules(rulesRes);
      if (allowancesRes) setAllowances(allowancesRes);

      if (claimsRes && claimsRes.claims) {
        setClaims(claimsRes.claims);
        setSummary(claimsRes.summary);

        // Cache latest claims
        await storeSet(
          getStorageKey(siteId),
          JSON.stringify({
            claims: claimsRes.claims,
            summary: claimsRes.summary,
            rules: rulesRes,
          })
        ).catch(() => {});
      }
    } catch (err) {
      console.error('[TaxRefundContext] Error loading tax data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    setIsLoading(true);
    loadTaxData();
  }, [loadTaxData]);

  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await loadTaxData();
    setIsRefreshing(false);
  }, [loadTaxData]);

  const calculateEstimatedRefund = useCallback(
    (amount: number): number => {
      if (!amount || amount <= 0) return 0;
      const rate = rules?.estimatedRefundPercent || rules?.vatRatePercent || 5.5;
      return Math.round(amount * (rate / 100) * 100) / 100;
    },
    [rules]
  );

  const addReceipt = useCallback(
    async (payload: CreateTaxReceiptRequest): Promise<boolean> => {
      try {
        const created = await createTaxClaim(payload, siteId);
        if (created) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          setClaims((prev) => {
            const next = [created, ...prev];
            setSummary(calculateSummaryFromClaims(next, rules));
            storeSet(getStorageKey(siteId), JSON.stringify({ claims: next, summary, rules })).catch(() => {});
            return next;
          });
          return true;
        }
      } catch (err) {
        console.error('[TaxRefundContext] Failed to add receipt:', err);
      }
      return false;
    },
    [siteId, rules, summary, calculateSummaryFromClaims]
  );

  const changeStatus = useCallback(
    async (
      claimId: string,
      status: 'Draft' | 'Customs_Inspected' | 'Refund_Claimed',
      notes?: string
    ): Promise<boolean> => {
      try {
        Haptics.selectionAsync().catch(() => {});
        const updated = await updateTaxClaimStatus(claimId, { status, notes }, siteId);
        if (updated) {
          setClaims((prev) => {
            const next = prev.map((item) => (item.claimId === claimId ? { ...item, status, notes: notes ?? item.notes } : item));
            setSummary(calculateSummaryFromClaims(next, rules));
            storeSet(getStorageKey(siteId), JSON.stringify({ claims: next, summary, rules })).catch(() => {});
            return next;
          });
          return true;
        }
      } catch (err) {
        console.error('[TaxRefundContext] Failed to update status:', err);
      }
      return false;
    },
    [siteId, rules, summary, calculateSummaryFromClaims]
  );

  const removeReceipt = useCallback(
    async (claimId: string): Promise<boolean> => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        const success = await deleteTaxClaim(claimId, siteId);
        if (success) {
          setClaims((prev) => {
            const next = prev.filter((item) => item.claimId !== claimId);
            setSummary(calculateSummaryFromClaims(next, rules));
            storeSet(getStorageKey(siteId), JSON.stringify({ claims: next, summary, rules })).catch(() => {});
            return next;
          });
          return true;
        }
      } catch (err) {
        console.error('[TaxRefundContext] Failed to remove receipt:', err);
      }
      return false;
    },
    [siteId, rules, summary, calculateSummaryFromClaims]
  );

  // Filtered claims according to tab selection
  const filteredClaims = useMemo(() => {
    if (selectedFilter === 'All') return claims;
    return claims.filter((c) => c.status === selectedFilter);
  }, [claims, selectedFilter]);

  const value = useMemo(
    () => ({
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
      selectedClaim,
      setSelectedClaim,
      calculateEstimatedRefund,
      addReceipt,
      changeStatus,
      removeReceipt,
      refreshData,
    }),
    [
      rules,
      allowances,
      claims,
      summary,
      isLoading,
      isRefreshing,
      selectedFilter,
      filteredClaims,
      isAddModalOpen,
      isKioskGuideOpen,
      isAllowanceSheetOpen,
      selectedClaim,
      calculateEstimatedRefund,
      addReceipt,
      changeStatus,
      removeReceipt,
      refreshData,
    ]
  );

  return <TaxRefundContext.Provider value={value}>{children}</TaxRefundContext.Provider>;
};

export const useTaxRefund = (): TaxRefundContextType => {
  const context = useContext(TaxRefundContext);
  if (!context) {
    throw new Error('useTaxRefund must be used within a TaxRefundProvider');
  }
  return context;
};

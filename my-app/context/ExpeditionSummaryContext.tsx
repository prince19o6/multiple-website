import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useSite } from '@/store/SiteConfigContext';
import { storeGetObject, storeSetObject } from '@/src/lib/storage';
import { fetchExpeditionSummaryHub, claimLoyaltyReward, submitReviewBoost } from '@/services/api';
import type {
  ExpeditionSummaryHubData,
  ExpeditionWrappedStats,
  LoyaltyTierData,
  LoyaltyRewardVoucher,
  ExpeditionCertificate,
  ClaimRewardResult,
  ReviewBoostResult,
} from '@/types';

export interface ExpeditionSummaryContextValue {
  hubData: ExpeditionSummaryHubData | null;
  loading: boolean;
  error: string | null;
  activeTab: 'wrapped' | 'loyalty' | 'certificate';
  setActiveTab: (tab: 'wrapped' | 'loyalty' | 'certificate') => void;
  // Wrapped Story Reel Modal
  isStoryModalOpen: boolean;
  openStoryModal: (startIdx?: number) => void;
  closeStoryModal: () => void;
  currentStoryIndex: number;
  setCurrentStoryIndex: (idx: number) => void;
  // Certificate Modal
  isCertificateModalOpen: boolean;
  openCertificateModal: () => void;
  closeCertificateModal: () => void;
  // Review Boost Modal
  isReviewModalOpen: boolean;
  openReviewModal: () => void;
  closeReviewModal: () => void;
  // Actions
  refreshHubData: () => Promise<void>;
  claimReward: (voucherCode: string, pointsCost: number) => Promise<ClaimRewardResult>;
  submitReview: (tourId: string, rating: number, reviewText: string, favoriteMoment: string) => Promise<ReviewBoostResult>;
  claimedVouchers: Record<string, ClaimRewardResult>;
  actionSuccessMessage: string | null;
  clearActionSuccessMessage: () => void;
}

const ExpeditionSummaryContext = createContext<ExpeditionSummaryContextValue | undefined>(undefined);

const STORAGE_KEY_PREFIX = '@toursapp_expedition_hub_';
const CLAIMED_VOUCHERS_KEY = '@toursapp_claimed_vouchers_';

export function ExpeditionSummaryProvider({ children }: { children: React.ReactNode }) {
  const { siteId } = useSite();

  const [hubData, setHubData] = useState<ExpeditionSummaryHubData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'wrapped' | 'loyalty' | 'certificate'>('wrapped');

  const [isStoryModalOpen, setIsStoryModalOpen] = useState<boolean>(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState<number>(0);

  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState<boolean>(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);

  const [claimedVouchers, setClaimedVouchers] = useState<Record<string, ClaimRewardResult>>({});
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Load cached data & claimed vouchers on mount / site change
  useEffect(() => {
    let isMounted = true;

    async function loadInitial() {
      setLoading(true);
      setError(null);

      // Load cached vouchers
      try {
        const storedClaims = await storeGetObject<Record<string, ClaimRewardResult>>(`${CLAIMED_VOUCHERS_KEY}${siteId}`);
        if (storedClaims && isMounted) {
          setClaimedVouchers(storedClaims);
        }
      } catch (e) {
        console.warn('[ExpeditionSummaryContext] Error loading cached vouchers:', e);
      }

      // Load cached hub
      try {
        const cached = await storeGetObject<ExpeditionSummaryHubData>(`${STORAGE_KEY_PREFIX}${siteId}`);
        if (cached && isMounted) {
          setHubData(cached);
        }
      } catch (e) {
        console.warn('[ExpeditionSummaryContext] Error loading cached hub:', e);
      }

      // Fetch fresh from backend
      try {
        const fresh = await fetchExpeditionSummaryHub(siteId);
        if (fresh && isMounted) {
          setHubData(fresh);
          await storeSetObject(`${STORAGE_KEY_PREFIX}${siteId}`, fresh);
        }
      } catch (err: any) {
        console.warn('[ExpeditionSummaryContext] Backend fetch error:', err);
        if (isMounted && !hubData) {
          setError('Unable to load expedition summary data.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadInitial();

    return () => {
      isMounted = false;
    };
  }, [siteId]);

  const refreshHubData = useCallback(async () => {
    setLoading(true);
    try {
      const fresh = await fetchExpeditionSummaryHub(siteId);
      if (fresh) {
        setHubData(fresh);
        await storeSetObject(`${STORAGE_KEY_PREFIX}${siteId}`, fresh);
      }
    } catch (err: any) {
      console.warn('[ExpeditionSummaryContext] Refresh error:', err);
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  const openStoryModal = useCallback((startIdx = 0) => {
    setCurrentStoryIndex(startIdx);
    setIsStoryModalOpen(true);
  }, []);

  const closeStoryModal = useCallback(() => {
    setIsStoryModalOpen(false);
  }, []);

  const openCertificateModal = useCallback(() => {
    setIsCertificateModalOpen(true);
  }, []);

  const closeCertificateModal = useCallback(() => {
    setIsCertificateModalOpen(false);
  }, []);

  const openReviewModal = useCallback(() => {
    setIsReviewModalOpen(true);
  }, []);

  const closeReviewModal = useCallback(() => {
    setIsReviewModalOpen(false);
  }, []);

  const clearActionSuccessMessage = useCallback(() => {
    setActionSuccessMessage(null);
  }, []);

  const claimReward = useCallback(
    async (voucherCode: string, pointsCost: number): Promise<ClaimRewardResult> => {
      const result = await claimLoyaltyReward(voucherCode, pointsCost, siteId);
      if (!result) {
        throw new Error('Failed to claim reward voucher.');
      }

      const updatedClaims = {
        ...claimedVouchers,
        [voucherCode.toUpperCase()]: result,
      };
      setClaimedVouchers(updatedClaims);
      await storeSetObject(`${CLAIMED_VOUCHERS_KEY}${siteId}`, updatedClaims);

      // Optimistically update loyalty points and voucher claimed state in local hubData
      if (hubData) {
        const updatedRewards = hubData.availableRewards.map((v) =>
          v.voucherCode.toUpperCase() === voucherCode.toUpperCase() ? { ...v, isClaimed: true } : v
        );
        const updatedHub: ExpeditionSummaryHubData = {
          ...hubData,
          loyalty: {
            ...hubData.loyalty,
            currentPoints: Math.max(0, hubData.loyalty.currentPoints - pointsCost),
          },
          availableRewards: updatedRewards,
        };
        setHubData(updatedHub);
        await storeSetObject(`${STORAGE_KEY_PREFIX}${siteId}`, updatedHub);
      }

      setActionSuccessMessage(`Unlocked voucher code ${voucherCode}!`);
      return result;
    },
    [siteId, claimedVouchers, hubData]
  );

  const submitReview = useCallback(
    async (tourId: string, rating: number, reviewText: string, favoriteMoment: string): Promise<ReviewBoostResult> => {
      const result = await submitReviewBoost(tourId, rating, reviewText, favoriteMoment, siteId);
      if (!result) {
        throw new Error('Failed to submit review boost.');
      }

      // Optimistically boost points in local hubData
      if (hubData) {
        const updatedHub: ExpeditionSummaryHubData = {
          ...hubData,
          loyalty: {
            ...hubData.loyalty,
            currentPoints: result.newTotalPoints,
          },
        };
        setHubData(updatedHub);
        await storeSetObject(`${STORAGE_KEY_PREFIX}${siteId}`, updatedHub);
      }

      setActionSuccessMessage(`+${result.pointsAwarded} VIP Points Added for your expedition reflection!`);
      return result;
    },
    [siteId, hubData]
  );

  const value = useMemo<ExpeditionSummaryContextValue>(
    () => ({
      hubData,
      loading,
      error,
      activeTab,
      setActiveTab,
      isStoryModalOpen,
      openStoryModal,
      closeStoryModal,
      currentStoryIndex,
      setCurrentStoryIndex,
      isCertificateModalOpen,
      openCertificateModal,
      closeCertificateModal,
      isReviewModalOpen,
      openReviewModal,
      closeReviewModal,
      refreshHubData,
      claimReward,
      submitReview,
      claimedVouchers,
      actionSuccessMessage,
      clearActionSuccessMessage,
    }),
    [
      hubData,
      loading,
      error,
      activeTab,
      isStoryModalOpen,
      openStoryModal,
      closeStoryModal,
      currentStoryIndex,
      isCertificateModalOpen,
      openCertificateModal,
      closeCertificateModal,
      isReviewModalOpen,
      openReviewModal,
      closeReviewModal,
      refreshHubData,
      claimReward,
      submitReview,
      claimedVouchers,
      actionSuccessMessage,
      clearActionSuccessMessage,
    ]
  );

  return <ExpeditionSummaryContext.Provider value={value}>{children}</ExpeditionSummaryContext.Provider>;
}

export function useExpeditionSummary() {
  const context = useContext(ExpeditionSummaryContext);
  if (!context) {
    throw new Error('useExpeditionSummary must be used within an ExpeditionSummaryProvider');
  }
  return context;
}

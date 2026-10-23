import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useSite } from '@/store/SiteConfigContext';
import { storeGetObject, storeSetObject } from '@/src/lib/storage';
import { fetchBargainHubData } from '@/services/api';
import type {
  BargainHubData,
  BargainCategoryItem,
  BargainPhraseItem,
  BargainMarketItem,
  BargainHistoryLog,
} from '@/types';

export interface CounterOfferCalculation {
  askingPrice: number;
  currencySymbol: string;
  firstOfferPrice: number;
  targetPrice: number;
  walkawayPrice: number;
  discountPercent: number;
  savingsAmount: number;
  categoryAdvice: string[] | string | undefined;
  recommendedTactic: string;
}

export interface BargainContextValue {
  bargainData: BargainHubData | null;
  loading: boolean;
  error: string | null;
  refreshBargainData: () => Promise<void>;
  // Calculator state
  askingPrice: number;
  setAskingPrice: (price: number) => void;
  selectedCategoryId: string;
  setSelectedCategoryId: (catId: string) => void;
  bargainAggression: 'gentle' | 'balanced' | 'firm';
  setBargainAggression: (mode: 'gentle' | 'balanced' | 'firm') => void;
  calculation: CounterOfferCalculation | null;
  // Flashcard Modal
  isFlashcardOpen: boolean;
  flashcardPhrase: BargainPhraseItem | null;
  flashcardCustomAmount: number | null;
  openFlashcard: (phrase: BargainPhraseItem, customAmount?: number) => void;
  closeFlashcard: () => void;
  // Savings & History Log
  savedLogs: BargainHistoryLog[];
  totalSaved: number;
  addBargainLog: (log: {
    itemName: string;
    marketName: string;
    initialPrice: number;
    finalPrice: number;
  }) => Promise<void>;
  removeBargainLog: (id: string) => Promise<void>;
  clearBargainLogs: () => Promise<void>;
}

const BargainContext = createContext<BargainContextValue | undefined>(undefined);

const STORAGE_DATA_PREFIX = '@toursapp_bargain_data';
const STORAGE_LOGS_PREFIX = '@toursapp_bargain_logs';

export const BargainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { siteId } = useSite();

  const [bargainData, setBargainData] = useState<BargainHubData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Calculator inputs
  const [askingPrice, setAskingPrice] = useState<number>(500);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('clothing_textiles');
  const [bargainAggression, setBargainAggression] = useState<'gentle' | 'balanced' | 'firm'>('balanced');

  // Flashcard state
  const [isFlashcardOpen, setIsFlashcardOpen] = useState<boolean>(false);
  const [flashcardPhrase, setFlashcardPhrase] = useState<BargainPhraseItem | null>(null);
  const [flashcardCustomAmount, setFlashcardCustomAmount] = useState<number | null>(null);

  // Bargain logs
  const [savedLogs, setSavedLogs] = useState<BargainHistoryLog[]>([]);

  // Load hub data & logs
  const loadData = useCallback(
    async (forceRefresh = false) => {
      setLoading(true);
      setError(null);
      const dataKey = `${STORAGE_DATA_PREFIX}:${siteId}`;
      const logsKey = `${STORAGE_LOGS_PREFIX}:${siteId}`;

      try {
        // Load saved logs from storage
        const storedLogs = await storeGetObject<BargainHistoryLog[]>(logsKey);
        if (storedLogs && Array.isArray(storedLogs)) {
          setSavedLogs(storedLogs);
        } else {
          setSavedLogs([]);
        }

        // Cache first if not force
        if (!forceRefresh) {
          const cached = await storeGetObject<BargainHubData>(dataKey);
          if (cached && cached.categories && cached.categories.length > 0) {
            setBargainData(cached);
            if (cached.categories[0] && !selectedCategoryId) {
              setSelectedCategoryId(cached.categories[0].categoryId || cached.categories[0].id || '');
            }
            setLoading(false);
            return;
          }
        }

        const live = await fetchBargainHubData(siteId);
        if (live && live.categories && live.categories.length > 0) {
          setBargainData(live);
          await storeSetObject(dataKey, live);
          if (live.categories[0] && !selectedCategoryId) {
            setSelectedCategoryId(live.categories[0].categoryId || live.categories[0].id || '');
          }
        } else {
          const cached = await storeGetObject<BargainHubData>(dataKey);
          if (cached) {
            setBargainData(cached);
          } else {
            setError('Unable to load market bargaining intelligence. Please check network.');
          }
        }
      } catch (err) {
        console.warn('[BargainContext] Error loading bargaining data:', err);
        setError('Error synchronizing market bargaining intelligence.');
      } finally {
        setLoading(false);
      }
    },
    [siteId, selectedCategoryId]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshBargainData = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  // Flashcard controls
  const openFlashcard = useCallback((phrase: BargainPhraseItem, customAmount?: number) => {
    setFlashcardPhrase(phrase);
    setFlashcardCustomAmount(customAmount !== undefined ? customAmount : null);
    setIsFlashcardOpen(true);
  }, []);

  const closeFlashcard = useCallback(() => {
    setIsFlashcardOpen(false);
    setFlashcardPhrase(null);
    setFlashcardCustomAmount(null);
  }, []);

  // Calculator calculation engine
  const calculation = useMemo<CounterOfferCalculation | null>(() => {
    if (!bargainData || askingPrice <= 0) return null;

    const activeCat = bargainData.categories.find((c) => c.categoryId === selectedCategoryId) ||
      bargainData.categories[0];
    if (!activeCat) return null;

    let baseTargetDiscount = activeCat.typicalDiscountPercent || 25;
    if (activeCat.bargainingFlexibility === 'FIRM_FIXED') {
      baseTargetDiscount = 0;
    }

    let modifier = 0;
    let tactic = 'Smile, remain pleasant, and bundle 2 or 3 items to unlock an effortless extra discount.';

    if (activeCat.bargainingFlexibility === 'FIRM_FIXED') {
      return {
        askingPrice,
        currencySymbol: bargainData.currencySymbol,
        firstOfferPrice: askingPrice,
        targetPrice: askingPrice,
        walkawayPrice: askingPrice,
        discountPercent: 0,
        savingsAmount: 0,
        categoryAdvice: activeCat.buyingTips,
        recommendedTactic: 'Fixed price zone (Food & fresh drinks). Enjoy the fair transparent price!',
      };
    }

    if (bargainAggression === 'gentle') {
      modifier = -5; // slightly less discount for quick easy win
      tactic = 'Polite & gentle: Offer around 15-20% off. Vendors appreciate courteous, no-hassle buyers.';
    } else if (bargainAggression === 'balanced') {
      modifier = 0;
      tactic = 'Golden standard: Counter at 30-35% lower, negotiate smoothly, settle near target price.';
    } else {
      modifier = 7; // firm negotiation
      tactic = 'Firm & savvy: Start 40% below asking. Use the respectful walkaway technique if they hesitate.';
    }

    const effectiveTargetDiscount = Math.max(5, Math.min(50, baseTargetDiscount + modifier));
    const firstOfferDiscount = Math.min(55, effectiveTargetDiscount + (bargainAggression === 'firm' ? 12 : 8));
    const walkawayDiscount = Math.max(5, effectiveTargetDiscount - 6);

    const firstOfferPrice = Math.max(10, Math.round((askingPrice * (100 - firstOfferDiscount)) / 100 / 10) * 10);
    const targetPrice = Math.max(10, Math.round((askingPrice * (100 - effectiveTargetDiscount)) / 100 / 10) * 10);
    const walkawayPrice = Math.max(10, Math.round((askingPrice * (100 - walkawayDiscount)) / 100 / 10) * 10);
    const savingsAmount = Math.max(0, askingPrice - targetPrice);

    return {
      askingPrice,
      currencySymbol: bargainData.currencySymbol,
      firstOfferPrice,
      targetPrice,
      walkawayPrice,
      discountPercent: effectiveTargetDiscount,
      savingsAmount,
      categoryAdvice: activeCat.buyingTips,
      recommendedTactic: tactic,
    };
  }, [bargainData, askingPrice, selectedCategoryId, bargainAggression]);

  // Log management
  const addBargainLog = useCallback(
    async (log: {
      itemName: string;
      marketName: string;
      initialPrice: number;
      finalPrice: number;
    }) => {
      const logsKey = `${STORAGE_LOGS_PREFIX}:${siteId}`;
      const savings = Math.max(0, log.initialPrice - log.finalPrice);
      const newEntry: BargainHistoryLog = {
        id: `bargain_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        itemName: log.itemName.trim() || 'Night Market Souvenir',
        marketName: log.marketName.trim() || 'Local Bazaar',
        initialPrice: log.initialPrice,
        finalPrice: log.finalPrice,
        savings,
        currency: bargainData?.currencySymbol || '฿',
        timestamp: new Date().toISOString(),
      };

      const updated = [newEntry, ...savedLogs];
      setSavedLogs(updated);
      await storeSetObject(logsKey, updated);
    },
    [siteId, savedLogs, bargainData]
  );

  const removeBargainLog = useCallback(
    async (id: string) => {
      const logsKey = `${STORAGE_LOGS_PREFIX}:${siteId}`;
      const updated = savedLogs.filter((l) => l.id !== id);
      setSavedLogs(updated);
      await storeSetObject(logsKey, updated);
    },
    [siteId, savedLogs]
  );

  const clearBargainLogs = useCallback(async () => {
    const logsKey = `${STORAGE_LOGS_PREFIX}:${siteId}`;
    setSavedLogs([]);
    await storeSetObject(logsKey, []);
  }, [siteId]);

  const totalSaved = useMemo(() => {
    return savedLogs.reduce((acc, curr) => acc + (curr.savings || 0), 0);
  }, [savedLogs]);

  const value = useMemo<BargainContextValue>(() => ({
    bargainData,
    loading,
    error,
    refreshBargainData,
    askingPrice,
    setAskingPrice,
    selectedCategoryId,
    setSelectedCategoryId,
    bargainAggression,
    setBargainAggression,
    calculation,
    isFlashcardOpen,
    flashcardPhrase,
    flashcardCustomAmount,
    openFlashcard,
    closeFlashcard,
    savedLogs,
    totalSaved,
    addBargainLog,
    removeBargainLog,
    clearBargainLogs,
  }), [
    bargainData,
    loading,
    error,
    refreshBargainData,
    askingPrice,
    selectedCategoryId,
    bargainAggression,
    calculation,
    isFlashcardOpen,
    flashcardPhrase,
    flashcardCustomAmount,
    openFlashcard,
    closeFlashcard,
    savedLogs,
    totalSaved,
    addBargainLog,
    removeBargainLog,
    clearBargainLogs,
  ]);

  return <BargainContext.Provider value={value}>{children}</BargainContext.Provider>;
};

export function useBargain(): BargainContextValue {
  const ctx = useContext(BargainContext);
  if (!ctx) {
    throw new Error('useBargain must be used within a BargainProvider');
  }
  return ctx;
}

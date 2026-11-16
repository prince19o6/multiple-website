import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import { useSite } from '@/store/SiteConfigContext';
import {
  TippingCountryGuide,
  TippingServiceCategory,
  CalculateTipResult,
} from '../types';
import {
  fetchTippingGuide,
  calculateTipping,
} from '../services/api';
import { storeGet, storeSet } from '../src/lib/storage';

interface TippingContextType {
  guide: TippingCountryGuide | null;
  selectedCategory: TippingServiceCategory | null;
  billAmount: string;
  tipPercentage: number;
  customTipAmount: string;
  serviceChargeAlreadyIncluded: boolean;
  splitCount: number;
  calcResult: CalculateTipResult | null;
  isLoading: boolean;
  isCalculating: boolean;
  isRefreshing: boolean;
  isCalculatorModalOpen: boolean;
  setIsCalculatorModalOpen: (open: boolean) => void;
  setSelectedCategory: (cat: TippingServiceCategory | null) => void;
  setBillAmount: (val: string) => void;
  setTipPercentage: (pct: number) => void;
  setCustomTipAmount: (val: string) => void;
  setServiceChargeAlreadyIncluded: (val: boolean) => void;
  setSplitCount: (cnt: number) => void;
  openCalculatorForCategory: (cat: TippingServiceCategory) => void;
  calculate: (overrideBill?: number) => Promise<void>;
  refreshGuide: () => Promise<void>;
}

const TippingContext = createContext<TippingContextType | undefined>(undefined);

const getStorageKey = (siteId: string) => `@toursapp_tipping_guide:${siteId}`;

export const TippingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { siteId } = useSite();

  const [guide, setGuide] = useState<TippingCountryGuide | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<TippingServiceCategory | null>(null);

  const [billAmount, setBillAmount] = useState<string>('1000');
  const [tipPercentage, setTipPercentage] = useState<number>(10);
  const [customTipAmount, setCustomTipAmount] = useState<string>('');
  const [serviceChargeAlreadyIncluded, setServiceChargeAlreadyIncluded] = useState<boolean>(false);
  const [splitCount, setSplitCount] = useState<number>(1);
  const [calcResult, setCalcResult] = useState<CalculateTipResult | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState<boolean>(false);

  const loadTippingGuide = useCallback(async () => {
    try {
      // 1. Local Cache
      const cached = await storeGet(getStorageKey(siteId)).catch(() => null);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as TippingCountryGuide;
          setGuide(parsed);
          if (parsed.categories && parsed.categories.length > 0) {
            setSelectedCategory(parsed.categories[0]);
          }
        } catch (e) {
          console.warn('[TippingContext] Error parsing cached guide:', e);
        }
      }

      // 2. Fresh Network
      const fresh = await fetchTippingGuide(siteId);
      if (fresh) {
        setGuide(fresh);
        if (fresh.categories && fresh.categories.length > 0) {
          setSelectedCategory(fresh.categories[0]);
        }
        await storeSet(getStorageKey(siteId), JSON.stringify(fresh)).catch(() => {});
      }
    } catch (err) {
      console.warn('[TippingContext] loadTippingGuide error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [siteId]);

  useEffect(() => {
    setIsLoading(true);
    setCalcResult(null);
    loadTippingGuide();
  }, [siteId, loadTippingGuide]);

  const refreshGuide = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await loadTippingGuide();
  }, [loadTippingGuide]);

  const calculate = useCallback(
    async (overrideBill?: number) => {
      const numericBill = overrideBill !== undefined ? overrideBill : parseFloat(billAmount) || 0;
      const numericCustomTip = customTipAmount ? parseFloat(customTipAmount) : undefined;

      setIsCalculating(true);
      try {
        const res = await calculateTipping(
          {
            billAmount: numericBill,
            categoryKey: selectedCategory?.categoryKey || 'Dining',
            tipPercentage: numericCustomTip ? undefined : tipPercentage,
            customTipAmount: numericCustomTip,
            serviceChargeAlreadyIncluded,
            splitCount,
          },
          siteId
        );

        if (res) {
          setCalcResult(res);
        }
      } catch (err) {
        console.warn('[TippingContext] calculate error:', err);
      } finally {
        setIsCalculating(false);
      }
    },
    [billAmount, customTipAmount, tipPercentage, selectedCategory, serviceChargeAlreadyIncluded, splitCount, siteId]
  );

  const openCalculatorForCategory = useCallback(
    (cat: TippingServiceCategory) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      setSelectedCategory(cat);
      setTipPercentage(Number(cat.defaultPercentage) || 10);
      setCustomTipAmount('');
      setIsCalculatorModalOpen(true);
    },
    []
  );

  // Auto calculate when modal is open and inputs change
  useEffect(() => {
    if (isCalculatorModalOpen) {
      const timer = setTimeout(() => {
        calculate();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [billAmount, tipPercentage, customTipAmount, serviceChargeAlreadyIncluded, splitCount, isCalculatorModalOpen, calculate]);

  const value = useMemo<TippingContextType>(
    () => ({
      guide,
      selectedCategory,
      billAmount,
      tipPercentage,
      customTipAmount,
      serviceChargeAlreadyIncluded,
      splitCount,
      calcResult,
      isLoading,
      isCalculating,
      isRefreshing,
      isCalculatorModalOpen,
      setIsCalculatorModalOpen,
      setSelectedCategory,
      setBillAmount,
      setTipPercentage,
      setCustomTipAmount,
      setServiceChargeAlreadyIncluded,
      setSplitCount,
      openCalculatorForCategory,
      calculate,
      refreshGuide,
    }),
    [
      guide,
      selectedCategory,
      billAmount,
      tipPercentage,
      customTipAmount,
      serviceChargeAlreadyIncluded,
      splitCount,
      calcResult,
      isLoading,
      isCalculating,
      isRefreshing,
      isCalculatorModalOpen,
      openCalculatorForCategory,
      calculate,
      refreshGuide,
    ]
  );

  return <TippingContext.Provider value={value}>{children}</TippingContext.Provider>;
};

export const useTipping = (): TippingContextType => {
  const context = useContext(TippingContext);
  if (!context) {
    throw new Error('useTipping must be used within a TippingProvider');
  }
  return context;
};

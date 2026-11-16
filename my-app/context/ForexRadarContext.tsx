import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useSite } from '@/store/SiteConfigContext';
import { storeGetObject, storeSetObject } from '@/src/lib/storage';
import { fetchForexRadar } from '@/services/api';
import type { ForexRadarData, ForexCounterRate, ForexKioskItem, AtmDccTip } from '@/types';

interface ForexSavingsResult {
  currencyCode: string;
  foreignAmount: number;
  cityCounterThb: number;
  airportBankThb: number;
  cashSavingsThb: number;
  cashSavingsPercent: number;
  atmDccLossThb: number;
  totalPotentialLossThb: number;
}

interface ForexRadarContextValue {
  radarData: ForexRadarData | null;
  loading: boolean;
  error: string | null;
  refreshRadar: () => Promise<void>;
  // Calculator Modal controls & state
  isCalculatorVisible: boolean;
  calculatorCurrency: string;
  calculatorAmount: number;
  openCalculator: (initialCurrency?: string, initialAmount?: number) => void;
  closeCalculator: () => void;
  setCalculatorCurrency: (curr: string) => void;
  setCalculatorAmount: (amt: number) => void;
  calculateSavings: (amount: number, currCode: string) => ForexSavingsResult | null;
}

const ForexRadarContext = createContext<ForexRadarContextValue | undefined>(undefined);

const STORAGE_KEY_PREFIX = '@toursapp_forex_radar';

export const ForexRadarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { siteId } = useSite();

  const [radarData, setRadarData] = useState<ForexRadarData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Calculator modal state
  const [isCalculatorVisible, setIsCalculatorVisible] = useState<boolean>(false);
  const [calculatorCurrency, setCalculatorCurrency] = useState<string>('USD');
  const [calculatorAmount, setCalculatorAmount] = useState<number>(500);

  const loadData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    const cacheKey = `${STORAGE_KEY_PREFIX}:${siteId}`;

    try {
      if (!forceRefresh) {
        const cached = await storeGetObject<ForexRadarData>(cacheKey);
        if (cached && cached.baseRates && cached.baseRates.length > 0) {
          setRadarData(cached);
          setLoading(false);
          return;
        }
      }

      const live = await fetchForexRadar(siteId);
      if (live) {
        setRadarData(live);
        await storeSetObject(cacheKey, live);
      } else {
        const cached = await storeGetObject<ForexRadarData>(cacheKey);
        if (cached) {
          setRadarData(cached);
        } else {
          setError('Unable to load live counter exchange rates. Please check network.');
        }
      }
    } catch (err) {
      console.warn('[ForexRadarContext] Error loading forex radar:', err);
      setError('An unexpected error occurred while fetching currency rates.');
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshRadar = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  const openCalculator = useCallback((initialCurrency?: string, initialAmount?: number) => {
    if (initialCurrency) setCalculatorCurrency(initialCurrency);
    if (initialAmount && initialAmount > 0) setCalculatorAmount(initialAmount);
    setIsCalculatorVisible(true);
  }, []);

  const closeCalculator = useCallback(() => {
    setIsCalculatorVisible(false);
  }, []);

  const calculateSavings = useCallback(
    (amount: number, currCode: string): ForexSavingsResult | null => {
      if (!radarData || !radarData.baseRates) return null;
      const rate = radarData.baseRates.find(
        (r) => r.currencyCode.toUpperCase() === currCode.toUpperCase()
      );
      if (!rate) return null;

      const cityCounterThb = amount * rate.cityCounterBuyRate;
      const airportBankThb = amount * rate.bankAirportBuyRate;
      const cashSavingsThb = Math.max(0, cityCounterThb - airportBankThb);
      const cashSavingsPercent =
        cityCounterThb > 0 ? (cashSavingsThb / cityCounterThb) * 100 : 0;

      // ATM DCC Markup estimated at 8.5%
      const atmDccLossThb = cityCounterThb * 0.085;
      const totalPotentialLossThb = cashSavingsThb + atmDccLossThb;

      return {
        currencyCode: rate.currencyCode,
        foreignAmount: amount,
        cityCounterThb,
        airportBankThb,
        cashSavingsThb,
        cashSavingsPercent,
        atmDccLossThb,
        totalPotentialLossThb,
      };
    },
    [radarData]
  );

  const value = useMemo(
    () => ({
      radarData,
      loading,
      error,
      refreshRadar,
      isCalculatorVisible,
      calculatorCurrency,
      calculatorAmount,
      openCalculator,
      closeCalculator,
      setCalculatorCurrency,
      setCalculatorAmount,
      calculateSavings,
    }),
    [
      radarData,
      loading,
      error,
      refreshRadar,
      isCalculatorVisible,
      calculatorCurrency,
      calculatorAmount,
      openCalculator,
      closeCalculator,
      setCalculatorCurrency,
      setCalculatorAmount,
      calculateSavings,
    ]
  );

  return <ForexRadarContext.Provider value={value}>{children}</ForexRadarContext.Provider>;
};

export const useForexRadar = (): ForexRadarContextValue => {
  const context = useContext(ForexRadarContext);
  if (!context) {
    throw new Error('useForexRadar must be used within a ForexRadarProvider');
  }
  return context;
};

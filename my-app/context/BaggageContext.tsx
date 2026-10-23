import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import { useSite } from '@/store/SiteConfigContext';
import {
  BaggageHubData,
  AirlineBaggagePolicy,
  CalculateBaggageFeeResult,
} from '../types';
import {
  fetchBaggageHubData,
  calculateBaggageFee,
} from '../services/api';
import { storeGet, storeSet } from '../src/lib/storage';

interface BaggageContextType {
  baggageData: BaggageHubData | null;
  selectedAirline: AirlineBaggagePolicy | null;
  supportedAirlines: AirlineBaggagePolicy[];
  cabinWeight: number;
  checkedWeight: number;
  fareClass: string;
  calculationResult: CalculateBaggageFeeResult | null;
  isCalculating: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  isCalculatorModalOpen: boolean;
  setIsCalculatorModalOpen: (open: boolean) => void;
  isProhibitedSheetOpen: boolean;
  setIsProhibitedSheetOpen: (open: boolean) => void;
  setSelectedAirline: (airline: AirlineBaggagePolicy) => void;
  setCabinWeight: (weight: number) => void;
  setCheckedWeight: (weight: number) => void;
  setFareClass: (cls: string) => void;
  recalculateFee: (
    cabinKg?: number,
    checkedKg?: number,
    fareCls?: string
  ) => Promise<CalculateBaggageFeeResult | null>;
  refreshBaggageHub: () => Promise<void>;
}

const BaggageContext = createContext<BaggageContextType | undefined>(undefined);

const getStorageKey = (siteId: string) => `@toursapp_baggage_hub:${siteId}`;

export const BaggageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { siteId } = useSite();

  const [baggageData, setBaggageData] = useState<BaggageHubData | null>(null);
  const [selectedAirline, setSelectedAirline] = useState<AirlineBaggagePolicy | null>(null);
  const [supportedAirlines, setSupportedAirlines] = useState<AirlineBaggagePolicy[]>([]);
  const [cabinWeight, setCabinWeight] = useState<number>(6.0);
  const [checkedWeight, setCheckedWeight] = useState<number>(18.0);
  const [fareClass, setFareClass] = useState<string>('Economy_Standard');
  const [calculationResult, setCalculationResult] = useState<CalculateBaggageFeeResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Modals state
  const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState<boolean>(false);
  const [isProhibitedSheetOpen, setIsProhibitedSheetOpen] = useState<boolean>(false);

  const loadBaggageData = useCallback(async () => {
    try {
      // 1. Local Cache Fallback
      const cached = await storeGet(getStorageKey(siteId)).catch(() => null);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as BaggageHubData;
          setBaggageData(parsed);
          setSupportedAirlines(parsed.supportedAirlines || []);
          setSelectedAirline((prev) => prev || parsed.defaultAirline || null);
        } catch (e) {
          console.warn('[BaggageContext] Failed to parse cached baggage data:', e);
        }
      }

      // 2. Fetch fresh from API
      const freshData = await fetchBaggageHubData(undefined, siteId);
      if (freshData) {
        setBaggageData(freshData);
        setSupportedAirlines(freshData.supportedAirlines || []);
        setSelectedAirline((prev) => prev || freshData.defaultAirline || null);
        await storeSet(getStorageKey(siteId), JSON.stringify(freshData)).catch(() => {});
      }
    } catch (err) {
      console.warn('[BaggageContext] Error loading baggage hub data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [siteId]);

  useEffect(() => {
    setIsLoading(true);
    setCalculationResult(null);
    loadBaggageData();
  }, [siteId, loadBaggageData]);

  const refreshBaggageHub = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await loadBaggageData();
  }, [loadBaggageData]);

  const recalculateFee = useCallback(
    async (
      cabinKg?: number,
      checkedKg?: number,
      fareCls?: string
    ): Promise<CalculateBaggageFeeResult | null> => {
      const activeAirline = selectedAirline || baggageData?.defaultAirline;
      if (!activeAirline) return null;

      const cKg = cabinKg !== undefined ? cabinKg : cabinWeight;
      const chkKg = checkedKg !== undefined ? checkedKg : checkedWeight;
      const fCls = fareCls || fareClass;

      setIsCalculating(true);
      try {
        const res = await calculateBaggageFee(
          {
            airlineCode: activeAirline.airlineCode,
            cabinWeightKg: cKg,
            checkedWeightKg: chkKg,
            fareClass: fCls,
          },
          siteId
        );

        if (res) {
          setCalculationResult(res);
          if (res.verdictStatus === 'Under_Limit_Safe') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          }
        }
        return res;
      } catch (err) {
        console.warn('[BaggageContext] recalculateFee failed:', err);
        return null;
      } finally {
        setIsCalculating(false);
      }
    },
    [selectedAirline, baggageData, cabinWeight, checkedWeight, fareClass, siteId]
  );

  const value = useMemo<BaggageContextType>(
    () => ({
      baggageData,
      selectedAirline,
      supportedAirlines,
      cabinWeight,
      checkedWeight,
      fareClass,
      calculationResult,
      isCalculating,
      isLoading,
      isRefreshing,
      isCalculatorModalOpen,
      setIsCalculatorModalOpen,
      isProhibitedSheetOpen,
      setIsProhibitedSheetOpen,
      setSelectedAirline,
      setCabinWeight,
      setCheckedWeight,
      setFareClass,
      recalculateFee,
      refreshBaggageHub,
    }),
    [
      baggageData,
      selectedAirline,
      supportedAirlines,
      cabinWeight,
      checkedWeight,
      fareClass,
      calculationResult,
      isCalculating,
      isLoading,
      isRefreshing,
      isCalculatorModalOpen,
      isProhibitedSheetOpen,
      recalculateFee,
      refreshBaggageHub,
    ]
  );

  return <BaggageContext.Provider value={value}>{children}</BaggageContext.Provider>;
};

export const useBaggage = (): BaggageContextType => {
  const context = useContext(BaggageContext);
  if (!context) {
    throw new Error('useBaggage must be used within a BaggageProvider');
  }
  return context;
};

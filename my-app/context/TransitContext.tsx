import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import { useSite } from '@/store/SiteConfigContext';
import {
  TransitHubData,
  TransitLine,
  CalculateTransitFareResult,
  EstimateTaxiFareResult,
} from '../types';
import {
  fetchTransitHubData,
  calculateTransitFare,
  estimateTaxiFare,
} from '../services/api';
import { storeGet, storeSet } from '../src/lib/storage';

interface TransitContextType {
  transitData: TransitHubData | null;
  selectedLine: TransitLine | null;
  taxiDistance: number;
  trafficCondition: 'Light' | 'Moderate' | 'Heavy_Gridlock';
  useExpressway: boolean;
  taxiEstimate: EstimateTaxiFareResult | null;
  transitFareResult: CalculateTransitFareResult | null;
  isEstimatingTaxi: boolean;
  isCalculatingTransit: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  isTaxiModalOpen: boolean;
  setIsTaxiModalOpen: (open: boolean) => void;
  isFareCalculatorOpen: boolean;
  setIsFareCalculatorOpen: (open: boolean) => void;
  setSelectedLine: (line: TransitLine | null) => void;
  setTaxiDistance: (dist: number) => void;
  setTrafficCondition: (cond: 'Light' | 'Moderate' | 'Heavy_Gridlock') => void;
  setUseExpressway: (use: boolean) => void;
  recalculateTaxi: (
    dist?: number,
    traffic?: 'Light' | 'Moderate' | 'Heavy_Gridlock',
    toll?: boolean
  ) => Promise<EstimateTaxiFareResult | null>;
  calculateRouteFare: (origin: string, dest: string) => Promise<CalculateTransitFareResult | null>;
  refreshTransitHub: () => Promise<void>;
}

const TransitContext = createContext<TransitContextType | undefined>(undefined);

const getStorageKey = (siteId: string) => `@toursapp_transit_hub:${siteId}`;

export const TransitProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { siteId } = useSite();

  const [transitData, setTransitData] = useState<TransitHubData | null>(null);
  const [selectedLine, setSelectedLine] = useState<TransitLine | null>(null);
  const [taxiDistance, setTaxiDistance] = useState<number>(10.0);
  const [trafficCondition, setTrafficCondition] = useState<'Light' | 'Moderate' | 'Heavy_Gridlock'>('Moderate');
  const [useExpressway, setUseExpressway] = useState<boolean>(true);
  const [taxiEstimate, setTaxiEstimate] = useState<EstimateTaxiFareResult | null>(null);
  const [transitFareResult, setTransitFareResult] = useState<CalculateTransitFareResult | null>(null);

  const [isEstimatingTaxi, setIsEstimatingTaxi] = useState<boolean>(false);
  const [isCalculatingTransit, setIsCalculatingTransit] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Modals state
  const [isTaxiModalOpen, setIsTaxiModalOpen] = useState<boolean>(false);
  const [isFareCalculatorOpen, setIsFareCalculatorOpen] = useState<boolean>(false);

  const loadTransitData = useCallback(async () => {
    try {
      // 1. Local Cache Fallback
      const cached = await storeGet(getStorageKey(siteId)).catch(() => null);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as TransitHubData;
          setTransitData(parsed);
          if (parsed.lines && parsed.lines.length > 0) {
            setSelectedLine(parsed.lines[0]);
          }
        } catch (e) {
          console.warn('[TransitContext] Failed to parse cached transit data:', e);
        }
      }

      // 2. Fetch fresh from API
      const freshData = await fetchTransitHubData(siteId);
      if (freshData) {
        setTransitData(freshData);
        if (freshData.lines && freshData.lines.length > 0) {
          setSelectedLine(freshData.lines[0]);
        }
        await storeSet(getStorageKey(siteId), JSON.stringify(freshData)).catch(() => {});
      }
    } catch (err) {
      console.warn('[TransitContext] Error loading transit hub data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [siteId]);

  useEffect(() => {
    setIsLoading(true);
    setTaxiEstimate(null);
    setTransitFareResult(null);
    loadTransitData();
  }, [siteId, loadTransitData]);

  const refreshTransitHub = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await loadTransitData();
  }, [loadTransitData]);

  const recalculateTaxi = useCallback(
    async (
      dist?: number,
      traffic?: 'Light' | 'Moderate' | 'Heavy_Gridlock',
      toll?: boolean
    ): Promise<EstimateTaxiFareResult | null> => {
      const d = dist !== undefined ? dist : taxiDistance;
      const t = traffic || trafficCondition;
      const exp = toll !== undefined ? toll : useExpressway;

      setIsEstimatingTaxi(true);
      try {
        const res = await estimateTaxiFare(
          {
            distanceKm: d,
            trafficCondition: t,
            useExpressway: exp,
          },
          siteId
        );

        if (res) {
          setTaxiEstimate(res);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
        return res;
      } catch (err) {
        console.warn('[TransitContext] recalculateTaxi failed:', err);
        return null;
      } finally {
        setIsEstimatingTaxi(false);
      }
    },
    [taxiDistance, trafficCondition, useExpressway, siteId]
  );

  const calculateRouteFare = useCallback(
    async (origin: string, dest: string): Promise<CalculateTransitFareResult | null> => {
      setIsCalculatingTransit(true);
      try {
        const res = await calculateTransitFare({ origin, destination: dest }, siteId);
        if (res) {
          setTransitFareResult(res);
          Haptics.selectionAsync().catch(() => {});
        }
        return res;
      } catch (err) {
        console.warn('[TransitContext] calculateRouteFare failed:', err);
        return null;
      } finally {
        setIsCalculatingTransit(false);
      }
    },
    [siteId]
  );

  const value = useMemo<TransitContextType>(
    () => ({
      transitData,
      selectedLine,
      taxiDistance,
      trafficCondition,
      useExpressway,
      taxiEstimate,
      transitFareResult,
      isEstimatingTaxi,
      isCalculatingTransit,
      isLoading,
      isRefreshing,
      isTaxiModalOpen,
      setIsTaxiModalOpen,
      isFareCalculatorOpen,
      setIsFareCalculatorOpen,
      setSelectedLine,
      setTaxiDistance,
      setTrafficCondition,
      setUseExpressway,
      recalculateTaxi,
      calculateRouteFare,
      refreshTransitHub,
    }),
    [
      transitData,
      selectedLine,
      taxiDistance,
      trafficCondition,
      useExpressway,
      taxiEstimate,
      transitFareResult,
      isEstimatingTaxi,
      isCalculatingTransit,
      isLoading,
      isRefreshing,
      isTaxiModalOpen,
      isFareCalculatorOpen,
      recalculateTaxi,
      calculateRouteFare,
      refreshTransitHub,
    ]
  );

  return <TransitContext.Provider value={value}>{children}</TransitContext.Provider>;
};

export const useTransit = (): TransitContextType => {
  const context = useContext(TransitContext);
  if (!context) {
    throw new Error('useTransit must be used within a TransitProvider');
  }
  return context;
};

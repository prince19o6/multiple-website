import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import { useSite } from '@/store/SiteConfigContext';
import {
  PowerHubData,
  VoltageSpec,
  PlugType,
  ApplianceVoltageRule,
  PowerBankKiosk,
  CheckApplianceResult,
} from '../types';
import {
  fetchPowerHubData,
  checkApplianceSafety,
} from '../services/api';
import { storeGet, storeSet } from '../src/lib/storage';

interface PowerContextType {
  powerData: PowerHubData | null;
  voltageSpec: VoltageSpec | null;
  supportedPlugs: PlugType[];
  applianceRules: ApplianceVoltageRule[];
  powerBankKiosks: PowerBankKiosk[];
  selectedPlug: PlugType | null;
  setSelectedPlug: (plug: PlugType | null) => void;
  selectedAppliance: ApplianceVoltageRule | null;
  setSelectedAppliance: (rule: ApplianceVoltageRule | null) => void;
  isLoading: boolean;
  isRefreshing: boolean;
  isVoltageModalOpen: boolean;
  setIsVoltageModalOpen: (open: boolean) => void;
  isTorchModalOpen: boolean;
  setIsTorchModalOpen: (open: boolean) => void;
  lastSafetyResult: CheckApplianceResult | null;
  checkAppliance: (
    category: string,
    ratedVoltage: string,
    homePlug: string
  ) => Promise<CheckApplianceResult | null>;
  refreshPowerHub: () => Promise<void>;
}

const PowerContext = createContext<PowerContextType | undefined>(undefined);

const getStorageKey = (siteId: string) => `@toursapp_power_hub:${siteId}`;

export const PowerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { siteId } = useSite();

  const [powerData, setPowerData] = useState<PowerHubData | null>(null);
  const [voltageSpec, setVoltageSpec] = useState<VoltageSpec | null>(null);
  const [supportedPlugs, setSupportedPlugs] = useState<PlugType[]>([]);
  const [applianceRules, setApplianceRules] = useState<ApplianceVoltageRule[]>([]);
  const [powerBankKiosks, setPowerBankKiosks] = useState<PowerBankKiosk[]>([]);
  const [selectedPlug, setSelectedPlug] = useState<PlugType | null>(null);
  const [selectedAppliance, setSelectedAppliance] = useState<ApplianceVoltageRule | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Modals state
  const [isVoltageModalOpen, setIsVoltageModalOpen] = useState<boolean>(false);
  const [isTorchModalOpen, setIsTorchModalOpen] = useState<boolean>(false);
  const [lastSafetyResult, setLastSafetyResult] = useState<CheckApplianceResult | null>(null);

  const loadPowerData = useCallback(async () => {
    try {
      // 1. Local Cache Fallback
      const cached = await storeGet(getStorageKey(siteId)).catch(() => null);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as PowerHubData;
          setPowerData(parsed);
          setVoltageSpec(parsed.voltageSpec || null);
          setSupportedPlugs(parsed.supportedPlugTypes || []);
          setApplianceRules(parsed.applianceRules || []);
          setPowerBankKiosks(parsed.powerBankKiosks || []);
        } catch (e) {
          console.warn('[PowerContext] Failed to parse cached power data:', e);
        }
      }

      // 2. Fetch fresh from API
      const freshData = await fetchPowerHubData(undefined, siteId);
      if (freshData) {
        setPowerData(freshData);
        setVoltageSpec(freshData.voltageSpec || null);
        setSupportedPlugs(freshData.supportedPlugTypes || []);
        setApplianceRules(freshData.applianceRules || []);
        setPowerBankKiosks(freshData.powerBankKiosks || []);
        await storeSet(getStorageKey(siteId), JSON.stringify(freshData)).catch(() => {});
      }
    } catch (err) {
      console.warn('[PowerContext] Error loading power hub data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [siteId]);

  useEffect(() => {
    setIsLoading(true);
    setLastSafetyResult(null);
    loadPowerData();
  }, [siteId, loadPowerData]);

  const refreshPowerHub = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await loadPowerData();
  }, [loadPowerData]);

  const checkAppliance = useCallback(
    async (
      category: string,
      ratedVoltage: string,
      homePlug: string
    ): Promise<CheckApplianceResult | null> => {
      try {
        const res = await checkApplianceSafety(
          {
            applianceCategory: category,
            ratedVoltage,
            homePlugType: homePlug,
          },
          siteId
        );

        if (res) {
          setLastSafetyResult(res);
          if (res.isSafe) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
          }
        }
        return res;
      } catch (err) {
        console.warn('[PowerContext] checkAppliance failed:', err);
        return null;
      }
    },
    [siteId]
  );

  const value = useMemo<PowerContextType>(
    () => ({
      powerData,
      voltageSpec,
      supportedPlugs,
      applianceRules,
      powerBankKiosks,
      selectedPlug,
      setSelectedPlug,
      selectedAppliance,
      setSelectedAppliance,
      isLoading,
      isRefreshing,
      isVoltageModalOpen,
      setIsVoltageModalOpen,
      isTorchModalOpen,
      setIsTorchModalOpen,
      lastSafetyResult,
      checkAppliance,
      refreshPowerHub,
    }),
    [
      powerData,
      voltageSpec,
      supportedPlugs,
      applianceRules,
      powerBankKiosks,
      selectedPlug,
      selectedAppliance,
      isLoading,
      isRefreshing,
      isVoltageModalOpen,
      isTorchModalOpen,
      lastSafetyResult,
      checkAppliance,
      refreshPowerHub,
    ]
  );

  return <PowerContext.Provider value={value}>{children}</PowerContext.Provider>;
};

export const usePower = (): PowerContextType => {
  const context = useContext(PowerContext);
  if (!context) {
    throw new Error('usePower must be used within a PowerProvider');
  }
  return context;
};

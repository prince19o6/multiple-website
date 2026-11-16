import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import { useSite } from '@/store/SiteConfigContext';
import {
  ActiveEsimProfile,
  EsimPackage,
  AirportWifiGuide,
  EsimHubData,
} from '../types';
import {
  fetchEsimHubData,
  activateEsimPackage,
  topUpEsimData,
} from '../services/api';
import { storeGet, storeSet } from '../src/lib/storage';

interface EsimContextType {
  activeProfile: ActiveEsimProfile | null;
  packages: EsimPackage[];
  wifiGuides: AirportWifiGuide[];
  emergencyUssdCodes: Record<string, string>;
  isLoading: boolean;
  isRefreshing: boolean;
  selectedPackage: EsimPackage | null;
  setSelectedPackage: (pkg: EsimPackage | null) => void;
  isQrModalOpen: boolean;
  setIsQrModalOpen: (open: boolean) => void;
  isTopUpModalOpen: boolean;
  setIsTopUpModalOpen: (open: boolean) => void;
  isWifiModalOpen: boolean;
  setIsWifiModalOpen: (open: boolean) => void;
  activate: (packageId: string) => Promise<boolean>;
  topUp: (additionalGb: number) => Promise<boolean>;
  refreshEsim: () => Promise<void>;
}

const EsimContext = createContext<EsimContextType | undefined>(undefined);

const getStorageKey = (siteId: string) => `@toursapp_active_esim:${siteId}`;

export const EsimProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { siteId } = useSite();

  const [activeProfile, setActiveProfile] = useState<ActiveEsimProfile | null>(null);
  const [packages, setPackages] = useState<EsimPackage[]>([]);
  const [wifiGuides, setWifiGuides] = useState<AirportWifiGuide[]>([]);
  const [emergencyUssdCodes, setEmergencyUssdCodes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Modals state
  const [selectedPackage, setSelectedPackage] = useState<EsimPackage | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState<boolean>(false);
  const [isWifiModalOpen, setIsWifiModalOpen] = useState<boolean>(false);

  const loadEsimData = useCallback(async () => {
    try {
      // 1. Try local cache first for instant offline render
      const cached = await storeGet(getStorageKey(siteId)).catch(() => null);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.activeProfile) setActiveProfile(parsed.activeProfile);
          if (Array.isArray(parsed.packages)) setPackages(parsed.packages);
          if (Array.isArray(parsed.wifiGuides)) setWifiGuides(parsed.wifiGuides);
          if (parsed.emergencyUssdCodes) setEmergencyUssdCodes(parsed.emergencyUssdCodes);
        } catch {}
      }

      // 2. Fetch fresh from backend
      const hubData = await fetchEsimHubData(siteId);
      if (hubData) {
        if (hubData.activeProfile) setActiveProfile(hubData.activeProfile);
        if (hubData.packages) setPackages(hubData.packages);
        if (hubData.wifiGuides) setWifiGuides(hubData.wifiGuides);
        if (hubData.emergencyUssdCodes) setEmergencyUssdCodes(hubData.emergencyUssdCodes);

        await storeSet(
          getStorageKey(siteId),
          JSON.stringify({
            activeProfile: hubData.activeProfile,
            packages: hubData.packages,
            wifiGuides: hubData.wifiGuides,
            emergencyUssdCodes: hubData.emergencyUssdCodes,
          })
        ).catch(() => {});
      }
    } catch (err) {
      console.error('[EsimContext] Error loading eSIM data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    setIsLoading(true);
    loadEsimData();
  }, [loadEsimData]);

  const refreshEsim = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await loadEsimData();
    setIsRefreshing(false);
  }, [loadEsimData]);

  const activate = useCallback(
    async (packageId: string): Promise<boolean> => {
      try {
        const profile = await activateEsimPackage({ packageId }, siteId);
        if (profile) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          setActiveProfile(profile);
          setIsQrModalOpen(true);
          await storeSet(
            getStorageKey(siteId),
            JSON.stringify({ activeProfile: profile, packages, wifiGuides, emergencyUssdCodes })
          ).catch(() => {});
          return true;
        }
      } catch (err) {
        console.error('[EsimContext] Failed to activate eSIM:', err);
      }
      return false;
    },
    [siteId, packages, wifiGuides, emergencyUssdCodes]
  );

  const topUp = useCallback(
    async (additionalGb: number): Promise<boolean> => {
      if (!activeProfile) return false;
      try {
        const updated = await topUpEsimData(
          { profileId: activeProfile.profileId, additionalGb },
          siteId
        );
        if (updated) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          setActiveProfile(updated);
          await storeSet(
            getStorageKey(siteId),
            JSON.stringify({ activeProfile: updated, packages, wifiGuides, emergencyUssdCodes })
          ).catch(() => {});
          return true;
        }
      } catch (err) {
        console.error('[EsimContext] Failed to top up data:', err);
      }
      return false;
    },
    [activeProfile, siteId, packages, wifiGuides, emergencyUssdCodes]
  );

  const value = useMemo(
    () => ({
      activeProfile,
      packages,
      wifiGuides,
      emergencyUssdCodes,
      isLoading,
      isRefreshing,
      selectedPackage,
      setSelectedPackage,
      isQrModalOpen,
      setIsQrModalOpen,
      isTopUpModalOpen,
      setIsTopUpModalOpen,
      isWifiModalOpen,
      setIsWifiModalOpen,
      activate,
      topUp,
      refreshEsim,
    }),
    [
      activeProfile,
      packages,
      wifiGuides,
      emergencyUssdCodes,
      isLoading,
      isRefreshing,
      selectedPackage,
      isQrModalOpen,
      isTopUpModalOpen,
      isWifiModalOpen,
      activate,
      topUp,
      refreshEsim,
    ]
  );

  return <EsimContext.Provider value={value}>{children}</EsimContext.Provider>;
};

export const useEsim = (): EsimContextType => {
  const context = useContext(EsimContext);
  if (!context) {
    throw new Error('useEsim must be used within an EsimProvider');
  }
  return context;
};

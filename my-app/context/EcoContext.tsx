import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import { useSite } from '@/store/SiteConfigContext';
import {
  EcoHubData,
  CarbonEmissionBreakdown,
  VerifiedClimateProject,
  OffsetContribution,
  EcoPledgeItem,
} from '../types';
import {
  fetchEcoHubData,
  calculateCarbonEmissions,
  submitCarbonOffset,
  toggleEcoPledge as apiToggleEcoPledge,
} from '../services/api';
import { storeGet, storeSet } from '../src/lib/storage';

interface EcoContextType {
  ecoData: EcoHubData | null;
  emissions: CarbonEmissionBreakdown | null;
  projects: VerifiedClimateProject[];
  contributions: OffsetContribution[];
  pledges: EcoPledgeItem[];
  selectedProject: VerifiedClimateProject | null;
  setSelectedProject: (proj: VerifiedClimateProject | null) => void;
  selectedContribution: OffsetContribution | null;
  setSelectedContribution: (contrib: OffsetContribution | null) => void;
  isLoading: boolean;
  isRefreshing: boolean;
  isCalculatorModalOpen: boolean;
  setIsCalculatorModalOpen: (open: boolean) => void;
  isCertificateModalOpen: boolean;
  setIsCertificateModalOpen: (open: boolean) => void;
  isOffsetting: boolean;
  calculate: (
    origin: string,
    dest: string,
    cabin: 'Economy' | 'PremiumEconomy' | 'Business',
    nights: number,
    pax: number
  ) => Promise<CarbonEmissionBreakdown | null>;
  offsetEmissions: (
    projectId: string,
    amountKg: number,
    travelerName: string,
    bookingId?: string
  ) => Promise<OffsetContribution | null>;
  togglePledge: (pledgeId: string) => Promise<void>;
  refreshEcoHub: () => Promise<void>;
}

const EcoContext = createContext<EcoContextType | undefined>(undefined);

const getStorageKey = (siteId: string) => `@toursapp_eco_hub:${siteId}`;

export const EcoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { siteId } = useSite();

  const [ecoData, setEcoData] = useState<EcoHubData | null>(null);
  const [emissions, setEmissions] = useState<CarbonEmissionBreakdown | null>(null);
  const [projects, setProjects] = useState<VerifiedClimateProject[]>([]);
  const [contributions, setContributions] = useState<OffsetContribution[]>([]);
  const [pledges, setPledges] = useState<EcoPledgeItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isOffsetting, setIsOffsetting] = useState<boolean>(false);

  // Modals state
  const [selectedProject, setSelectedProject] = useState<VerifiedClimateProject | null>(null);
  const [selectedContribution, setSelectedContribution] = useState<OffsetContribution | null>(null);
  const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState<boolean>(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState<boolean>(false);

  const loadEcoData = useCallback(async () => {
    try {
      // 1. Local Cache Fallback
      const cached = await storeGet(getStorageKey(siteId)).catch(() => null);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as EcoHubData;
          setEcoData(parsed);
          setEmissions(parsed.emissions || null);
          setProjects(parsed.projects || []);
          setContributions(parsed.myContributions || []);
          setPledges(parsed.pledges || []);
        } catch (e) {
          console.warn('[EcoContext] Failed to parse cached eco data:', e);
        }
      }

      // 2. Fetch fresh from API
      const freshEco = await fetchEcoHubData(siteId);
      if (freshEco) {
        setEcoData(freshEco);
        setEmissions(freshEco.emissions || null);
        setProjects(freshEco.projects || []);
        setContributions(freshEco.myContributions || []);
        setPledges(freshEco.pledges || []);
        await storeSet(getStorageKey(siteId), JSON.stringify(freshEco)).catch(() => {});
      }
    } catch (err) {
      console.warn('[EcoContext] Error loading eco hub data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [siteId]);

  useEffect(() => {
    setIsLoading(true);
    loadEcoData();
  }, [siteId, loadEcoData]);

  const refreshEcoHub = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await loadEcoData();
  }, [loadEcoData]);

  const calculate = useCallback(
    async (
      origin: string,
      dest: string,
      cabin: 'Economy' | 'PremiumEconomy' | 'Business',
      nights: number,
      pax: number
    ): Promise<CarbonEmissionBreakdown | null> => {
      try {
        const res = await calculateCarbonEmissions(
          {
            originAirport: origin,
            destinationAirport: dest,
            flightClass: cabin,
            nightsCount: nights,
            paxCount: pax,
          },
          siteId
        );
        if (res) {
          setEmissions(res);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
        return res;
      } catch (err) {
        console.warn('[EcoContext] calculate failed:', err);
        return null;
      }
    },
    [siteId]
  );

  const offsetEmissions = useCallback(
    async (
      projectId: string,
      amountKg: number,
      travelerName: string,
      bookingId?: string
    ): Promise<OffsetContribution | null> => {
      try {
        setIsOffsetting(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        const res = await submitCarbonOffset(
          {
            projectId,
            offsetAmountKg: amountKg,
            travelerName,
            bookingId,
          },
          siteId
        );

        if (res && res.success && res.data) {
          const updatedContributions = [res.data, ...contributions];
          setContributions(updatedContributions);
          setSelectedContribution(res.data);
          setIsCertificateModalOpen(true);

          if (ecoData) {
            const updatedHub = {
              ...ecoData,
              myContributions: updatedContributions,
              totalKgOffset: ecoData.totalKgOffset + amountKg,
            };
            setEcoData(updatedHub);
            await storeSet(getStorageKey(siteId), JSON.stringify(updatedHub)).catch(() => {});
          }
          return res.data;
        }
        return null;
      } catch (err) {
        console.warn('[EcoContext] offsetEmissions failed:', err);
        return null;
      } finally {
        setIsOffsetting(false);
      }
    },
    [contributions, ecoData, siteId]
  );

  const togglePledge = useCallback(
    async (pledgeId: string) => {
      Haptics.selectionAsync().catch(() => {});
      const target = pledges.find((p) => p.id === pledgeId);
      const newStatus = target ? !target.isPledged : true;

      const updatedPledges = pledges.map((p) =>
        p.id === pledgeId ? { ...p, isPledged: newStatus } : p
      );
      setPledges(updatedPledges);

      if (ecoData) {
        const updatedHub = { ...ecoData, pledges: updatedPledges };
        setEcoData(updatedHub);
        storeSet(getStorageKey(siteId), JSON.stringify(updatedHub)).catch(() => {});
      }

      await apiToggleEcoPledge(pledgeId, newStatus, siteId);
    },
    [pledges, ecoData, siteId]
  );

  const value = useMemo<EcoContextType>(
    () => ({
      ecoData,
      emissions,
      projects,
      contributions,
      pledges,
      selectedProject,
      setSelectedProject,
      selectedContribution,
      setSelectedContribution,
      isLoading,
      isRefreshing,
      isCalculatorModalOpen,
      setIsCalculatorModalOpen,
      isCertificateModalOpen,
      setIsCertificateModalOpen,
      isOffsetting,
      calculate,
      offsetEmissions,
      togglePledge,
      refreshEcoHub,
    }),
    [
      ecoData,
      emissions,
      projects,
      contributions,
      pledges,
      selectedProject,
      selectedContribution,
      isLoading,
      isRefreshing,
      isCalculatorModalOpen,
      isCertificateModalOpen,
      isOffsetting,
      calculate,
      offsetEmissions,
      togglePledge,
      refreshEcoHub,
    ]
  );

  return <EcoContext.Provider value={value}>{children}</EcoContext.Provider>;
};

export const useEco = (): EcoContextType => {
  const context = useContext(EcoContext);
  if (!context) {
    throw new Error('useEco must be used within an EcoProvider');
  }
  return context;
};

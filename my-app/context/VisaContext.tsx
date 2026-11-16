import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import { useSite } from '@/store/SiteConfigContext';
import {
  VisaHubData,
  VisaRequirement,
  DigitalArrivalCard,
  EmbassyConsulate,
  PassportValidityCheckResult,
} from '../types';
import {
  fetchVisaHubData,
  checkVisaRule,
  checkPassportValidity,
} from '../services/api';
import { storeGet, storeSet } from '../src/lib/storage';

interface VisaContextType {
  hubData: VisaHubData | null;
  selectedNationality: string;
  setSelectedNationality: (nat: string) => void;
  selectedDestination: string;
  setSelectedDestination: (dest: string) => void;
  currentVisaRule: VisaRequirement | null;
  arrivalCards: DigitalArrivalCard[];
  embassies: EmbassyConsulate[];
  isLoading: boolean;
  isRefreshing: boolean;
  isValidityModalOpen: boolean;
  setIsValidityModalOpen: (open: boolean) => void;
  isArrivalCardModalOpen: boolean;
  setIsArrivalCardModalOpen: (open: boolean) => void;
  selectedArrivalCard: DigitalArrivalCard | null;
  setSelectedArrivalCard: (card: DigitalArrivalCard | null) => void;
  lastValidityResult: PassportValidityCheckResult | null;
  validatePassport: (expiryDate: string, departureDate: string) => Promise<PassportValidityCheckResult | null>;
  refreshVisaHub: () => Promise<void>;
}

const VisaContext = createContext<VisaContextType | undefined>(undefined);

const getStorageKey = (siteId: string) => `@toursapp_visa_hub:${siteId}`;

export const VisaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { siteId } = useSite();

  const [hubData, setHubData] = useState<VisaHubData | null>(null);
  const [selectedNationality, setSelectedNationality] = useState<string>('India');
  const [selectedDestination, setSelectedDestination] = useState<string>('Thailand');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Modals state
  const [isValidityModalOpen, setIsValidityModalOpen] = useState<boolean>(false);
  const [isArrivalCardModalOpen, setIsArrivalCardModalOpen] = useState<boolean>(false);
  const [selectedArrivalCard, setSelectedArrivalCard] = useState<DigitalArrivalCard | null>(null);
  const [lastValidityResult, setLastValidityResult] = useState<PassportValidityCheckResult | null>(null);

  const loadVisaData = useCallback(async () => {
    try {
      // 1. Local Cache Fallback
      const cached = await storeGet(getStorageKey(siteId)).catch(() => null);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as VisaHubData;
          setHubData(parsed);
          setSelectedNationality(parsed.defaultNationality || 'India');
          setSelectedDestination(parsed.defaultDestination || 'Thailand');
        } catch (e) {
          console.warn('[VisaContext] Failed to parse cached hub data:', e);
        }
      }

      // 2. Fetch fresh from API
      const freshHub = await fetchVisaHubData(undefined, undefined, siteId);
      if (freshHub) {
        setHubData(freshHub);
        setSelectedNationality(freshHub.defaultNationality || 'India');
        setSelectedDestination(freshHub.defaultDestination || 'Thailand');
        await storeSet(getStorageKey(siteId), JSON.stringify(freshHub)).catch(() => {});
      }
    } catch (err) {
      console.warn('[VisaContext] Error loading visa hub data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [siteId]);

  useEffect(() => {
    setIsLoading(true);
    setLastValidityResult(null);
    loadVisaData();
  }, [siteId, loadVisaData]);

  const refreshVisaHub = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await loadVisaData();
  }, [loadVisaData]);

  // Dynamically resolve current rule based on selected nationality & destination
  const currentVisaRule = useMemo<VisaRequirement | null>(() => {
    if (!hubData || !hubData.visaRequirements) return null;
    const match = hubData.visaRequirements.find(
      (r) =>
        r.destinationCountry.toLowerCase() === selectedDestination.toLowerCase() &&
        r.passportNationality.toLowerCase() === selectedNationality.toLowerCase()
    );
    if (match) return match;
    // Fallback if destination matches
    const destMatch = hubData.visaRequirements.find(
      (r) => r.destinationCountry.toLowerCase() === selectedDestination.toLowerCase()
    );
    return destMatch || hubData.visaRequirements[0] || null;
  }, [hubData, selectedDestination, selectedNationality]);

  // Filtered arrival cards for selected destination
  const arrivalCards = useMemo<DigitalArrivalCard[]>(() => {
    if (!hubData || !hubData.arrivalCards) return [];
    const matched = hubData.arrivalCards.filter(
      (c) => c.destinationCountry.toLowerCase() === selectedDestination.toLowerCase()
    );
    return matched.length > 0 ? matched : hubData.arrivalCards;
  }, [hubData, selectedDestination]);

  // Filtered embassies for destination
  const embassies = useMemo<EmbassyConsulate[]>(() => {
    if (!hubData || !hubData.embassies) return [];
    return hubData.embassies.filter(
      (e) =>
        e.destinationCountry.toLowerCase() === selectedDestination.toLowerCase() ||
        e.homeCountry.toLowerCase() === selectedNationality.toLowerCase()
    );
  }, [hubData, selectedDestination, selectedNationality]);

  // Passport validity checker method
  const validatePassport = useCallback(
    async (expiryDate: string, departureDate: string): Promise<PassportValidityCheckResult | null> => {
      try {
        const res = await checkPassportValidity(
          {
            passportExpiryDate: expiryDate,
            tripDepartureDate: departureDate,
            destinationCountry: selectedDestination,
          },
          siteId
        );
        if (res) {
          setLastValidityResult(res);
          if (res.isValid) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          }
        }
        return res;
      } catch (err) {
        console.warn('[VisaContext] validatePassport failed:', err);
        return null;
      }
    },
    [selectedDestination, siteId]
  );

  const value = useMemo<VisaContextType>(
    () => ({
      hubData,
      selectedNationality,
      setSelectedNationality,
      selectedDestination,
      setSelectedDestination,
      currentVisaRule,
      arrivalCards,
      embassies,
      isLoading,
      isRefreshing,
      isValidityModalOpen,
      setIsValidityModalOpen,
      isArrivalCardModalOpen,
      setIsArrivalCardModalOpen,
      selectedArrivalCard,
      setSelectedArrivalCard,
      lastValidityResult,
      validatePassport,
      refreshVisaHub,
    }),
    [
      hubData,
      selectedNationality,
      selectedDestination,
      currentVisaRule,
      arrivalCards,
      embassies,
      isLoading,
      isRefreshing,
      isValidityModalOpen,
      isArrivalCardModalOpen,
      selectedArrivalCard,
      lastValidityResult,
      validatePassport,
      refreshVisaHub,
    ]
  );

  return <VisaContext.Provider value={value}>{children}</VisaContext.Provider>;
};

export const useVisa = (): VisaContextType => {
  const context = useContext(VisaContext);
  if (!context) {
    throw new Error('useVisa must be used within a VisaProvider');
  }
  return context;
};

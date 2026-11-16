import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import { useSite } from '@/store/SiteConfigContext';
import {
  PharmacyHubData,
  TravelMedicine,
} from '../types';
import {
  fetchPharmacyHubData,
  searchPharmacyMedicines,
} from '../services/api';
import { storeGet, storeSet } from '../src/lib/storage';

interface PharmacyContextType {
  pharmacyData: PharmacyHubData | null;
  selectedMedicine: TravelMedicine | null;
  selectedCategory: string;
  searchQuery: string;
  searchResults: TravelMedicine[] | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isSearching: boolean;
  isShowPharmacistModalOpen: boolean;
  setIsShowPharmacistModalOpen: (open: boolean) => void;
  setSelectedMedicine: (med: TravelMedicine | null) => void;
  setSelectedCategory: (cat: string) => void;
  setSearchQuery: (q: string) => void;
  openShowPharmacist: (med: TravelMedicine) => void;
  searchMeds: (query: string) => Promise<void>;
  refreshPharmacyHub: () => Promise<void>;
}

const PharmacyContext = createContext<PharmacyContextType | undefined>(undefined);

const getStorageKey = (siteId: string) => `@toursapp_pharmacy_hub:${siteId}`;

export const PharmacyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { siteId } = useSite();

  const [pharmacyData, setPharmacyData] = useState<PharmacyHubData | null>(null);
  const [selectedMedicine, setSelectedMedicine] = useState<TravelMedicine | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<TravelMedicine[] | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isShowPharmacistModalOpen, setIsShowPharmacistModalOpen] = useState<boolean>(false);

  const loadPharmacyData = useCallback(async () => {
    try {
      // 1. Local Cache Fallback
      const cached = await storeGet(getStorageKey(siteId)).catch(() => null);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as PharmacyHubData;
          setPharmacyData(parsed);
          if (parsed.medicines && parsed.medicines.length > 0) {
            setSelectedMedicine(parsed.medicines[0]);
          }
        } catch (e) {
          console.warn('[PharmacyContext] Failed to parse cached pharmacy data:', e);
        }
      }

      // 2. Fetch fresh from API
      const freshData = await fetchPharmacyHubData(siteId);
      if (freshData) {
        setPharmacyData(freshData);
        if (freshData.medicines && freshData.medicines.length > 0) {
          setSelectedMedicine(freshData.medicines[0]);
        }
        await storeSet(getStorageKey(siteId), JSON.stringify(freshData)).catch(() => {});
      }
    } catch (err) {
      console.warn('[PharmacyContext] Error loading pharmacy data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [siteId]);

  useEffect(() => {
    setIsLoading(true);
    setSearchQuery('');
    setSearchResults(null);
    loadPharmacyData();
  }, [siteId, loadPharmacyData]);

  const refreshPharmacyHub = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await loadPharmacyData();
  }, [loadPharmacyData]);

  const searchMeds = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      if (!query.trim()) {
        setSearchResults(null);
        return;
      }

      setIsSearching(true);
      try {
        const matches = await searchPharmacyMedicines(query, siteId);
        setSearchResults(matches);
      } catch (err) {
        console.warn('[PharmacyContext] searchMeds failed:', err);
      } finally {
        setIsSearching(false);
      }
    },
    [siteId]
  );

  const openShowPharmacist = useCallback((med: TravelMedicine) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setSelectedMedicine(med);
    setIsShowPharmacistModalOpen(true);
  }, []);

  const value = useMemo<PharmacyContextType>(
    () => ({
      pharmacyData,
      selectedMedicine,
      selectedCategory,
      searchQuery,
      searchResults,
      isLoading,
      isRefreshing,
      isSearching,
      isShowPharmacistModalOpen,
      setIsShowPharmacistModalOpen,
      setSelectedMedicine,
      setSelectedCategory,
      setSearchQuery,
      openShowPharmacist,
      searchMeds,
      refreshPharmacyHub,
    }),
    [
      pharmacyData,
      selectedMedicine,
      selectedCategory,
      searchQuery,
      searchResults,
      isLoading,
      isRefreshing,
      isSearching,
      isShowPharmacistModalOpen,
      openShowPharmacist,
      searchMeds,
      refreshPharmacyHub,
    ]
  );

  return <PharmacyContext.Provider value={value}>{children}</PharmacyContext.Provider>;
};

export const usePharmacy = (): PharmacyContextType => {
  const context = useContext(PharmacyContext);
  if (!context) {
    throw new Error('usePharmacy must be used within a PharmacyProvider');
  }
  return context;
};

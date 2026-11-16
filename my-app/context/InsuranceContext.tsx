import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import { useSite } from '@/store/SiteConfigContext';
import {
  TravelInsurancePolicy,
  HospitalDirectoryItem,
  InsuranceBenefit,
  SubmitClaimInquiryRequest,
  ClaimInquiryResponse,
} from '../types';
import {
  fetchTravelInsurancePolicy,
  fetchInsuranceHospitals,
  submitClaimInquiry,
} from '../services/api';
import { storeGet, storeSet } from '../src/lib/storage';

interface InsuranceContextType {
  policy: TravelInsurancePolicy | null;
  hospitals: HospitalDirectoryItem[];
  filteredHospitals: HospitalDirectoryItem[];
  availableCities: string[];
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isLoading: boolean;
  isRefreshing: boolean;
  selectedBenefit: InsuranceBenefit | null;
  setSelectedBenefit: (b: InsuranceBenefit | null) => void;
  isClaimModalOpen: boolean;
  setIsClaimModalOpen: (open: boolean) => void;
  selectedHospitalForClaim: HospitalDirectoryItem | null;
  setSelectedHospitalForClaim: (h: HospitalDirectoryItem | null) => void;
  lastSubmittedClaimRef: string | null;
  submitClaim: (
    claimType: string,
    hospitalName: string,
    city: string,
    contactPhone: string,
    description: string
  ) => Promise<ClaimInquiryResponse | null>;
  refreshInsurance: () => Promise<void>;
}

const InsuranceContext = createContext<InsuranceContextType | undefined>(undefined);

const getStorageKey = (siteId: string) => `@toursapp_insurance_policy:${siteId}`;

export const InsuranceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { siteId } = useSite();

  const [policy, setPolicy] = useState<TravelInsurancePolicy | null>(null);
  const [hospitals, setHospitals] = useState<HospitalDirectoryItem[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Modals & Active selections
  const [selectedBenefit, setSelectedBenefit] = useState<InsuranceBenefit | null>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState<boolean>(false);
  const [selectedHospitalForClaim, setSelectedHospitalForClaim] = useState<HospitalDirectoryItem | null>(null);
  const [lastSubmittedClaimRef, setLastSubmittedClaimRef] = useState<string | null>(null);

  const loadInsuranceData = useCallback(async () => {
    try {
      // 1. Local cache fallback
      const cached = await storeGet(getStorageKey(siteId)).catch(() => null);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as TravelInsurancePolicy;
          setPolicy(parsed);
          if (parsed.preApprovedHospitals && parsed.preApprovedHospitals.length > 0) {
            setHospitals(parsed.preApprovedHospitals);
          }
        } catch (e) {
          console.warn('[InsuranceContext] Failed to parse cached policy:', e);
        }
      }

      // 2. Fetch fresh policy from API
      const freshPolicy = await fetchTravelInsurancePolicy(siteId);
      if (freshPolicy) {
        setPolicy(freshPolicy);
        if (freshPolicy.preApprovedHospitals) {
          setHospitals(freshPolicy.preApprovedHospitals);
        }
        await storeSet(getStorageKey(siteId), JSON.stringify(freshPolicy)).catch(() => {});
      }
    } catch (err) {
      console.warn('[InsuranceContext] Error loading insurance data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [siteId]);

  useEffect(() => {
    setIsLoading(true);
    setSelectedCity('All');
    setSearchQuery('');
    setLastSubmittedClaimRef(null);
    loadInsuranceData();
  }, [siteId, loadInsuranceData]);

  const refreshInsurance = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await loadInsuranceData();
  }, [loadInsuranceData]);

  // Derived cities list
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    hospitals.forEach((h) => {
      if (h.city) set.add(h.city);
    });
    return ['All', ...Array.from(set)];
  }, [hospitals]);

  // Filtered hospitals
  const filteredHospitals = useMemo(() => {
    return hospitals.filter((h) => {
      const matchCity = selectedCity === 'All' || h.city.toLowerCase() === selectedCity.toLowerCase();
      const q = searchQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        h.name.toLowerCase().includes(q) ||
        h.city.toLowerCase().includes(q) ||
        h.district.toLowerCase().includes(q) ||
        h.specialties.some((s) => s.toLowerCase().includes(q));
      return matchCity && matchQuery;
    });
  }, [hospitals, selectedCity, searchQuery]);

  const submitClaim = useCallback(
    async (
      claimType: string,
      hospitalName: string,
      city: string,
      contactPhone: string,
      description: string
    ): Promise<ClaimInquiryResponse | null> => {
      if (!policy) return null;
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        const res = await submitClaimInquiry(
          {
            policyId: policy.policyId,
            claimType,
            hospitalName,
            city,
            contactPhone,
            description,
          },
          siteId
        );

        if (res && res.success) {
          setLastSubmittedClaimRef(res.claimReferenceNumber);
        }
        return res;
      } catch (err) {
        console.warn('[InsuranceContext] submitClaim failed:', err);
        return null;
      }
    },
    [policy, siteId]
  );

  const value = useMemo<InsuranceContextType>(
    () => ({
      policy,
      hospitals,
      filteredHospitals,
      availableCities,
      selectedCity,
      setSelectedCity,
      searchQuery,
      setSearchQuery,
      isLoading,
      isRefreshing,
      selectedBenefit,
      setSelectedBenefit,
      isClaimModalOpen,
      setIsClaimModalOpen,
      selectedHospitalForClaim,
      setSelectedHospitalForClaim,
      lastSubmittedClaimRef,
      submitClaim,
      refreshInsurance,
    }),
    [
      policy,
      hospitals,
      filteredHospitals,
      availableCities,
      selectedCity,
      searchQuery,
      isLoading,
      isRefreshing,
      selectedBenefit,
      isClaimModalOpen,
      selectedHospitalForClaim,
      lastSubmittedClaimRef,
      submitClaim,
      refreshInsurance,
    ]
  );

  return <InsuranceContext.Provider value={value}>{children}</InsuranceContext.Provider>;
};

export const useInsurance = (): InsuranceContextType => {
  const context = useContext(InsuranceContext);
  if (!context) {
    throw new Error('useInsurance must be used within an InsuranceProvider');
  }
  return context;
};

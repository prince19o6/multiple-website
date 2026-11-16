import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import { useSite } from '@/store/SiteConfigContext';
import {
  CultureHubData,
  DressCodeRule,
  CulturalEtiquetteItem,
  MedicationCustomsRule,
  CheckOutfitComplianceResult,
} from '../types';
import {
  fetchCultureHubData,
  checkOutfitCompliance,
} from '../services/api';
import { storeGet, storeSet } from '../src/lib/storage';

interface CultureContextType {
  cultureData: CultureHubData | null;
  dressCodeRules: DressCodeRule[];
  etiquetteGuidelines: CulturalEtiquetteItem[];
  medicationRules: MedicationCustomsRule[];
  selectedRule: DressCodeRule | null;
  setSelectedRule: (rule: DressCodeRule | null) => void;
  selectedEtiquette: CulturalEtiquetteItem | null;
  setSelectedEtiquette: (eti: CulturalEtiquetteItem | null) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  isLoading: boolean;
  isRefreshing: boolean;
  isDressCheckerOpen: boolean;
  setIsDressCheckerOpen: (open: boolean) => void;
  isMedicationSheetOpen: boolean;
  setIsMedicationSheetOpen: (open: boolean) => void;
  lastCheckResult: CheckOutfitComplianceResult | null;
  checkOutfit: (
    shoulders: boolean,
    knees: boolean,
    looseOpaque: boolean,
    footwearRemovable: boolean,
    headwearRemovable: boolean,
    siteType?: string
  ) => Promise<CheckOutfitComplianceResult | null>;
  refreshCultureHub: () => Promise<void>;
}

const CultureContext = createContext<CultureContextType | undefined>(undefined);

const getStorageKey = (siteId: string) => `@toursapp_culture_hub:${siteId}`;

export const CultureProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { siteId } = useSite();

  const [cultureData, setCultureData] = useState<CultureHubData | null>(null);
  const [dressCodeRules, setDressCodeRules] = useState<DressCodeRule[]>([]);
  const [etiquetteGuidelines, setEtiquetteGuidelines] = useState<CulturalEtiquetteItem[]>([]);
  const [medicationRules, setMedicationRules] = useState<MedicationCustomsRule[]>([]);
  const [selectedRule, setSelectedRule] = useState<DressCodeRule | null>(null);
  const [selectedEtiquette, setSelectedEtiquette] = useState<CulturalEtiquetteItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Modals state
  const [isDressCheckerOpen, setIsDressCheckerOpen] = useState<boolean>(false);
  const [isMedicationSheetOpen, setIsMedicationSheetOpen] = useState<boolean>(false);
  const [lastCheckResult, setLastCheckResult] = useState<CheckOutfitComplianceResult | null>(null);

  const loadCultureData = useCallback(async () => {
    try {
      // 1. Local Cache Fallback
      const cached = await storeGet(getStorageKey(siteId)).catch(() => null);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as CultureHubData;
          setCultureData(parsed);
          setDressCodeRules(parsed.dressCodeRules || []);
          setEtiquetteGuidelines(parsed.etiquetteGuidelines || []);
          setMedicationRules(parsed.medicationRules || []);
        } catch (e) {
          console.warn('[CultureContext] Failed to parse cached culture data:', e);
        }
      }

      // 2. Fetch fresh from API
      const freshData = await fetchCultureHubData(undefined, siteId);
      if (freshData) {
        setCultureData(freshData);
        setDressCodeRules(freshData.dressCodeRules || []);
        setEtiquetteGuidelines(freshData.etiquetteGuidelines || []);
        setMedicationRules(freshData.medicationRules || []);
        await storeSet(getStorageKey(siteId), JSON.stringify(freshData)).catch(() => {});
      }
    } catch (err) {
      console.warn('[CultureContext] Error loading culture hub data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [siteId]);

  useEffect(() => {
    setIsLoading(true);
    setLastCheckResult(null);
    loadCultureData();
  }, [siteId, loadCultureData]);

  const refreshCultureHub = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await loadCultureData();
  }, [loadCultureData]);

  const checkOutfit = useCallback(
    async (
      shoulders: boolean,
      knees: boolean,
      looseOpaque: boolean,
      footwearRemovable: boolean,
      headwearRemovable: boolean,
      siteType?: string
    ): Promise<CheckOutfitComplianceResult | null> => {
      try {
        const res = await checkOutfitCompliance(
          {
            siteType: siteType || 'Grand_Palace',
            isShouldersCovered: shoulders,
            isKneesCovered: knees,
            isClothingLooseAndOpaque: looseOpaque,
            isFootwearRemovable: footwearRemovable,
            isHeadwearRemovable: headwearRemovable,
          },
          siteId
        );

        if (res) {
          setLastCheckResult(res);
          if (res.isCompliant) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          }
        }
        return res;
      } catch (err) {
        console.warn('[CultureContext] checkOutfit failed:', err);
        return null;
      }
    },
    [siteId]
  );

  const value = useMemo<CultureContextType>(
    () => ({
      cultureData,
      dressCodeRules,
      etiquetteGuidelines,
      medicationRules,
      selectedRule,
      setSelectedRule,
      selectedEtiquette,
      setSelectedEtiquette,
      selectedCategory,
      setSelectedCategory,
      isLoading,
      isRefreshing,
      isDressCheckerOpen,
      setIsDressCheckerOpen,
      isMedicationSheetOpen,
      setIsMedicationSheetOpen,
      lastCheckResult,
      checkOutfit,
      refreshCultureHub,
    }),
    [
      cultureData,
      dressCodeRules,
      etiquetteGuidelines,
      medicationRules,
      selectedRule,
      selectedEtiquette,
      selectedCategory,
      isLoading,
      isRefreshing,
      isDressCheckerOpen,
      isMedicationSheetOpen,
      lastCheckResult,
      checkOutfit,
      refreshCultureHub,
    ]
  );

  return <CultureContext.Provider value={value}>{children}</CultureContext.Provider>;
};

export const useCulture = (): CultureContextType => {
  const context = useContext(CultureContext);
  if (!context) {
    throw new Error('useCulture must be used within a CultureProvider');
  }
  return context;
};

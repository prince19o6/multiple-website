import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Linking, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSite } from '@/store/SiteConfigContext';
import { DriveSafetyHubData } from '../types';
import { fetchDriveSafetyHub } from '../services/api';
import { storeGet, storeSet } from '../src/lib/storage';

interface DriveSafetyContextType {
  hubData: DriveSafetyHubData | null;
  activeTab: 'rules' | 'scams' | 'checklist';
  completedSteps: Record<string, boolean>;
  isInspectionModalOpen: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  setActiveTab: (tab: 'rules' | 'scams' | 'checklist') => void;
  toggleStepCompleted: (stepId: string) => void;
  resetChecklist: () => void;
  setIsInspectionModalOpen: (open: boolean) => void;
  refreshHub: () => Promise<void>;
  dialEmergencyRoadside: () => void;
}

const DriveSafetyContext = createContext<DriveSafetyContextType | undefined>(undefined);

const getStorageKey = (siteId: string) => `@toursapp_drive_safety:${siteId}`;
const getChecklistStorageKey = (siteId: string) => `@toursapp_pre_ride_completed:${siteId}`;

export const DriveSafetyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { siteId } = useSite();

  const [hubData, setHubData] = useState<DriveSafetyHubData | null>(null);
  const [activeTab, setActiveTab] = useState<'rules' | 'scams' | 'checklist'>('rules');
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadDriveSafetyHub = useCallback(async () => {
    try {
      // 1. Cached Hub Data
      const cached = await storeGet(getStorageKey(siteId)).catch(() => null);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as DriveSafetyHubData;
          setHubData(parsed);
        } catch (e) {
          console.warn('[DriveSafetyContext] Error parsing cached hub:', e);
        }
      }

      // 2. Cached Completed Checklist
      const cachedChecklist = await storeGet(getChecklistStorageKey(siteId)).catch(() => null);
      if (cachedChecklist) {
        try {
          setCompletedSteps(JSON.parse(cachedChecklist));
        } catch {}
      }

      // 3. Network Fetch
      const fresh = await fetchDriveSafetyHub(siteId);
      if (fresh) {
        setHubData(fresh);
        await storeSet(getStorageKey(siteId), JSON.stringify(fresh)).catch(() => {});
      }
    } catch (err) {
      console.warn('[DriveSafetyContext] loadDriveSafetyHub error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [siteId]);

  useEffect(() => {
    setIsLoading(true);
    loadDriveSafetyHub();
  }, [siteId, loadDriveSafetyHub]);

  const refreshHub = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await loadDriveSafetyHub();
  }, [loadDriveSafetyHub]);

  const toggleStepCompleted = useCallback(
    (stepId: string) => {
      Haptics.selectionAsync().catch(() => {});
      setCompletedSteps((prev) => {
        const next = { ...prev, [stepId]: !prev[stepId] };
        storeSet(getChecklistStorageKey(siteId), JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    [siteId]
  );

  const resetChecklist = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    setCompletedSteps({});
    storeSet(getChecklistStorageKey(siteId), JSON.stringify({})).catch(() => {});
  }, [siteId]);

  const dialEmergencyRoadside = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    const rawNumber = hubData?.roadsideAssistanceNumber || '1155';
    // extract digits
    const digits = rawNumber.replace(/[^0-9]/g, '');
    const phoneUrl = `tel:${digits}`;

    Alert.alert(
      'Emergency Roadside Assistance',
      `Call ${rawNumber} for English-speaking Tourist Police & Roadside Emergency Dispatch?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          style: 'destructive',
          onPress: () => {
            Linking.canOpenURL(phoneUrl).then((supported) => {
              if (supported) {
                Linking.openURL(phoneUrl).catch(() => {});
              }
            });
          },
        },
      ]
    );
  }, [hubData]);

  const value = useMemo<DriveSafetyContextType>(
    () => ({
      hubData,
      activeTab,
      completedSteps,
      isInspectionModalOpen,
      isLoading,
      isRefreshing,
      setActiveTab,
      toggleStepCompleted,
      resetChecklist,
      setIsInspectionModalOpen,
      refreshHub,
      dialEmergencyRoadside,
    }),
    [
      hubData,
      activeTab,
      completedSteps,
      isInspectionModalOpen,
      isLoading,
      isRefreshing,
      setActiveTab,
      toggleStepCompleted,
      resetChecklist,
      refreshHub,
      dialEmergencyRoadside,
    ]
  );

  return <DriveSafetyContext.Provider value={value}>{children}</DriveSafetyContext.Provider>;
};

export const useDriveSafety = (): DriveSafetyContextType => {
  const context = useContext(DriveSafetyContext);
  if (!context) {
    throw new Error('useDriveSafety must be used within a DriveSafetyProvider');
  }
  return context;
};

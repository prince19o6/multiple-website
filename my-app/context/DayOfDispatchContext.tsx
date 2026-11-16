import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import { useSite } from '@/store/SiteConfigContext';
import { DayOfDispatch, ExpeditionStopProgress, GuideAnnouncement } from '../types';
import { fetchTodayDispatch, postGuideAnnouncement } from '../services/api';
import { storeGet, storeSet } from '../src/lib/storage';

interface DayOfDispatchContextType {
  dispatch: DayOfDispatch | null;
  activeTourMode: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  currentStop: ExpeditionStopProgress | null;
  completedStopIds: string[];
  isBoardingPassModalVisible: boolean;
  refreshDispatch: () => Promise<void>;
  toggleTourMode: () => void;
  markStopCompleted: (stopId: string) => Promise<void>;
  openBoardingPassModal: () => void;
  closeBoardingPassModal: () => void;
  postAnnouncement: (title: string, message: string, priority?: 'Normal' | 'Important' | 'Urgent') => Promise<void>;
}

const DayOfDispatchContext = createContext<DayOfDispatchContextType | undefined>(undefined);

const getProgressStorageKey = (siteId: string) => `@toursapp_dispatch_progress:${siteId}`;
const getTourModeStorageKey = (siteId: string) => `@toursapp_tour_mode:${siteId}`;

export const DayOfDispatchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { siteId } = useSite();

  const [dispatch, setDispatch] = useState<DayOfDispatch | null>(null);
  const [activeTourMode, setActiveTourMode] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [completedStopIds, setCompletedStopIds] = useState<string[]>([]);
  const [isBoardingPassModalVisible, setIsBoardingPassModalVisible] = useState<boolean>(false);

  // Load dispatch data from backend and cached progress from storage
  const loadDispatchData = useCallback(async () => {
    try {
      const [fetchedDispatch, cachedProgress, cachedMode] = await Promise.all([
        fetchTodayDispatch(undefined, undefined, siteId).catch(() => null),
        storeGet(getProgressStorageKey(siteId)).catch(() => null),
        storeGet(getTourModeStorageKey(siteId)).catch(() => null),
      ]);

      if (cachedMode !== null) {
        setActiveTourMode(cachedMode === 'true');
      }

      if (cachedProgress) {
        try {
          const parsed = JSON.parse(cachedProgress) as string[];
          if (Array.isArray(parsed)) setCompletedStopIds(parsed);
        } catch {}
      }

      if (fetchedDispatch) {
        setDispatch(fetchedDispatch);
        // By default initialize completed stops from server data if none cached
        if (!cachedProgress && fetchedDispatch.stops) {
          const initialCompleted = fetchedDispatch.stops
            .filter((s) => s.status === 'Completed')
            .map((s) => s.stopId);
          setCompletedStopIds(initialCompleted);
        }
      }
    } catch {
      // offline handling
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [siteId]);

  useEffect(() => {
    setIsLoading(true);
    loadDispatchData();
  }, [siteId, loadDispatchData]);

  const refreshDispatch = async () => {
    setIsRefreshing(true);
    await loadDispatchData();
  };

  const toggleTourMode = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const nextMode = !activeTourMode;
    setActiveTourMode(nextMode);
    try {
      await storeSet(getTourModeStorageKey(siteId), String(nextMode));
    } catch {}
  };

  const markStopCompleted = async (stopId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const updated = completedStopIds.includes(stopId)
      ? completedStopIds.filter((id) => id !== stopId)
      : [...completedStopIds, stopId];
    setCompletedStopIds(updated);
    try {
      await storeSet(getProgressStorageKey(siteId), JSON.stringify(updated));
    } catch {}
  };

  const openBoardingPassModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsBoardingPassModalVisible(true);
  };

  const closeBoardingPassModal = () => {
    setIsBoardingPassModalVisible(false);
  };

  const postAnnouncement = async (
    title: string,
    message: string,
    priority: 'Normal' | 'Important' | 'Urgent' = 'Normal'
  ) => {
    if (!dispatch) return;
    try {
      const newAnn = await postGuideAnnouncement(
        {
          tourId: dispatch.tourId,
          title,
          message,
          priority,
        },
        siteId
      );

      setDispatch((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          announcements: [newAnn, ...prev.announcements],
        };
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      // optimistic update
      const fallbackAnn: GuideAnnouncement = {
        id: `ann-${Date.now()}`,
        title,
        message,
        timestamp: 'Just now',
        priority,
        sentBy: dispatch.assignedCrew.leadGuideName || 'Tour Director',
      };
      setDispatch((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          announcements: [fallbackAnn, ...prev.announcements],
        };
      });
    }
  };

  // Compute current active stop
  const currentStop = useMemo(() => {
    if (!dispatch || dispatch.stops.length === 0) return null;
    // Return first stop not completed, or explicitly marked 'Current'
    const currentExplicit = dispatch.stops.find((s) => s.status === 'Current');
    if (currentExplicit && !completedStopIds.includes(currentExplicit.stopId)) {
      return currentExplicit;
    }
    const nextUncompleted = dispatch.stops.find((s) => !completedStopIds.includes(s.stopId));
    return nextUncompleted || dispatch.stops[dispatch.stops.length - 1];
  }, [dispatch, completedStopIds]);

  const value = useMemo(
    () => ({
      dispatch,
      activeTourMode,
      isLoading,
      isRefreshing,
      currentStop,
      completedStopIds,
      isBoardingPassModalVisible,
      refreshDispatch,
      toggleTourMode,
      markStopCompleted,
      openBoardingPassModal,
      closeBoardingPassModal,
      postAnnouncement,
    }),
    [
      dispatch,
      activeTourMode,
      isLoading,
      isRefreshing,
      currentStop,
      completedStopIds,
      isBoardingPassModalVisible,
    ]
  );

  return (
    <DayOfDispatchContext.Provider value={value}>
      {children}
    </DayOfDispatchContext.Provider>
  );
};

export const useDayOfDispatch = (): DayOfDispatchContextType => {
  const context = useContext(DayOfDispatchContext);
  if (!context) {
    throw new Error('useDayOfDispatch must be used within a DayOfDispatchProvider');
  }
  return context;
};

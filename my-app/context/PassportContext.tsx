import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import { useSite } from '@/store/SiteConfigContext';
import { PassportProfile, ExpeditionStamp, MilestoneChallenge } from '../types';
import { fetchPassportProfile, claimExpeditionStamp, claimMilestoneChallenge } from '../services/api';
import { storeGetObject, storeSetObject } from '../src/lib/storage';

interface PassportContextType {
  passport: PassportProfile | null;
  isLoading: boolean;
  unlockedStampsCount: number;
  totalStampsCount: number;
  completedChallengesCount: number;
  totalChallengesCount: number;
  currentXp: number;
  unlockStamp: (stampId: string) => Promise<boolean>;
  claimChallengeReward: (challengeId: string) => Promise<boolean>;
  refreshPassport: () => Promise<void>;
  generateShareSummary: () => string;
}

const PassportContext = createContext<PassportContextType | undefined>(undefined);

const getStampsStorageKey = (siteId: string) => `@toursapp_passport_stamps:${siteId}`;
const getChallengesStorageKey = (siteId: string) => `@toursapp_passport_challenges:${siteId}`;

export const PassportProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { siteId, siteName } = useSite();

  const [passport, setPassport] = useState<PassportProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadPassportData = useCallback(async () => {
    setIsLoading(true);
    const stampsKey = getStampsStorageKey(siteId);
    const challengesKey = getChallengesStorageKey(siteId);

    try {
      const [remoteProfile, localStamps, localChallenges] = await Promise.all([
        fetchPassportProfile(siteId).catch(() => null),
        storeGetObject<Record<string, { unlocked: boolean; unlockedDate: string }>>(stampsKey).catch(() => null),
        storeGetObject<Record<string, boolean>>(challengesKey).catch(() => null),
      ]);

      if (remoteProfile) {
        // Merge local storage overrides
        const rawStamps = remoteProfile.stamps || [];
        const mergedStamps: ExpeditionStamp[] = rawStamps.map((s: ExpeditionStamp) => {
          const local = localStamps?.[s.id];
          if (local && local.unlocked) {
            return { ...s, unlocked: true, unlockedDate: local.unlockedDate || s.unlockedDate };
          }
          return s;
        });

        const mergedChallenges = (remoteProfile.challenges || []).map((c) => {
          if (localChallenges?.[c.id]) {
            return { ...c, isCompleted: true, currentCount: c.targetCount };
          }
          return c;
        });

        const unlockedCount = mergedStamps.filter((s) => s.unlocked).length;

        setPassport({
          ...remoteProfile,
          stamps: mergedStamps,
          challenges: mergedChallenges,
          unlockedStampsCount: unlockedCount,
        });
      }
    } catch {
      // offline fallback
    } finally {
      setIsLoading(false);
    }
  }, [siteId]);

  useEffect(() => {
    loadPassportData();
  }, [loadPassportData]);

  const unlockStamp = useCallback(
    async (stampId: string): Promise<boolean> => {
      if (!passport) return false;

      const targetStamp = passport.stamps.find((s) => s.id === stampId);
      if (!targetStamp || targetStamp.unlocked) return false;

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      const today = new Date().toISOString().split('T')[0];

      // Update in local state
      const updatedStamps = passport.stamps.map((s) =>
        s.id === stampId ? { ...s, unlocked: true, unlockedDate: today } : s
      );

      const newUnlockedCount = updatedStamps.filter((s) => s.unlocked).length;
      const updatedXp = passport.tier.currentXp + targetStamp.xpReward;

      const updatedProfile: PassportProfile = {
        ...passport,
        stamps: updatedStamps,
        unlockedStampsCount: newUnlockedCount,
        tier: {
          ...passport.tier,
          currentXp: updatedXp,
          progressPercent: Math.min(100, Math.round((updatedXp / passport.tier.nextTierXp) * 100)),
        },
      };

      setPassport(updatedProfile);

      // Persist in local storage
      const stampsKey = getStampsStorageKey(siteId);
      const existing = (await storeGetObject<Record<string, { unlocked: boolean; unlockedDate: string }>>(stampsKey)) || {};
      existing[stampId] = { unlocked: true, unlockedDate: today };
      await storeSetObject(stampsKey, existing);

      // Notify server in background
      claimExpeditionStamp(stampId, siteId).catch(() => {});

      return true;
    },
    [passport, siteId]
  );

  const claimChallengeReward = useCallback(
    async (challengeId: string): Promise<boolean> => {
      if (!passport) return false;

      const challenge = passport.challenges.find((c) => c.id === challengeId);
      if (!challenge || challenge.isCompleted) return false;

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      const updatedChallenges = passport.challenges.map((c) =>
        c.id === challengeId ? { ...c, isCompleted: true, currentCount: c.targetCount } : c
      );

      const updatedXp = passport.tier.currentXp + challenge.xpReward;

      const updatedProfile: PassportProfile = {
        ...passport,
        challenges: updatedChallenges,
        tier: {
          ...passport.tier,
          currentXp: updatedXp,
          progressPercent: Math.min(100, Math.round((updatedXp / passport.tier.nextTierXp) * 100)),
        },
      };

      setPassport(updatedProfile);

      // Persist locally
      const challengesKey = getChallengesStorageKey(siteId);
      const existing = (await storeGetObject<Record<string, boolean>>(challengesKey)) || {};
      existing[challengeId] = true;
      await storeSetObject(challengesKey, existing);

      // Notify server in background
      claimMilestoneChallenge(challengeId, siteId).catch(() => {});

      return true;
    },
    [passport, siteId]
  );

  const unlockedStampsCount = useMemo(() => {
    return passport?.stamps.filter((s) => s.unlocked).length || 0;
  }, [passport]);

  const totalStampsCount = useMemo(() => {
    return passport?.stamps.length || 0;
  }, [passport]);

  const completedChallengesCount = useMemo(() => {
    return passport?.challenges.filter((c) => c.isCompleted).length || 0;
  }, [passport]);

  const totalChallengesCount = useMemo(() => {
    return passport?.challenges.length || 0;
  }, [passport]);

  const currentXp = useMemo(() => {
    return passport?.tier.currentXp || 0;
  }, [passport]);

  const generateShareSummary = useCallback((): string => {
    if (!passport) return '';

    const header = `*Official Expedition Passport* • _${siteName}_\n`;
    const traveler = `*Passport No:* ${passport.passportNumber} | *Tier:* ${passport.tier.tierName}\n*XP Score:* ${passport.tier.currentXp} XP\n\n`;
    const stampsHead = `*Earned Destination Seals (${unlockedStampsCount}/${totalStampsCount}):*\n`;

    let stampsList = '';
    passport.stamps.forEach((s) => {
      stampsList += s.unlocked
        ? `✅ *${s.title}* (${s.destination}) • Stamped on ${s.unlockedDate || '2026'}\n`
        : `🔒 ${s.title} (${s.destination})\n`;
    });

    const footer = `\n_Track your travel milestones with the official ${siteName} companion app! ✈️_`;

    return `${header}${traveler}${stampsHead}${stampsList}${footer}`;
  }, [passport, siteName, unlockedStampsCount, totalStampsCount]);

  return (
    <PassportContext.Provider
      value={{
        passport,
        isLoading,
        unlockedStampsCount,
        totalStampsCount,
        completedChallengesCount,
        totalChallengesCount,
        currentXp,
        unlockStamp,
        claimChallengeReward,
        refreshPassport: loadPassportData,
        generateShareSummary,
      }}
    >
      {children}
    </PassportContext.Provider>
  );
};

export const usePassport = (): PassportContextType => {
  const context = useContext(PassportContext);
  if (!context) {
    throw new Error('usePassport must be used within a PassportProvider');
  }
  return context;
};

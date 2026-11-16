import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Share, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSite } from '@/store/SiteConfigContext';
import {
  GroupTrip,
  GroupPoll,
  GroupGearItem,
  GroupMember,
  DietarySummaryItem,
} from '../types';
import {
  fetchActiveGroupTrip,
  castGroupPollVote,
  createGroupGearItem,
} from '../services/api';
import { storeGet, storeSet } from '../src/lib/storage';

export type GroupTab = 'members' | 'polls' | 'gear' | 'dietary';

interface GroupTripContextType {
  groupTrip: GroupTrip | null;
  isLoading: boolean;
  isRefreshing: boolean;
  activeTab: GroupTab;
  setActiveTab: (tab: GroupTab) => void;
  userVotedOptions: Record<string, string>; // pollId -> optionId
  packedGearIds: string[];
  currentUserRsvp: 'Confirmed' | 'Tentative' | 'Invited';
  refreshGroupTrip: () => Promise<void>;
  voteOnPoll: (pollId: string, optionId: string, voterName?: string) => Promise<boolean>;
  toggleGearPacked: (itemId: string) => Promise<void>;
  addNewGearItem: (title: string, category: string, assignedToMemberName: string) => Promise<boolean>;
  sharePartyInvite: () => Promise<void>;
  updateUserRsvp: (status: 'Confirmed' | 'Tentative' | 'Invited') => Promise<void>;
}

const GroupTripContext = createContext<GroupTripContextType | undefined>(undefined);

const getVotesStorageKey = (siteId: string) => `@toursapp_group_votes:${siteId}`;
const getPackedGearStorageKey = (siteId: string) => `@toursapp_group_packed_gear:${siteId}`;
const getRsvpStorageKey = (siteId: string) => `@toursapp_group_rsvp:${siteId}`;

export const GroupTripProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { siteId } = useSite();

  const [groupTrip, setGroupTrip] = useState<GroupTrip | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<GroupTab>('members');
  const [userVotedOptions, setUserVotedOptions] = useState<Record<string, string>>({});
  const [packedGearIds, setPackedGearIds] = useState<string[]>([]);
  const [currentUserRsvp, setCurrentUserRsvp] = useState<'Confirmed' | 'Tentative' | 'Invited'>('Confirmed');

  // Load group trip data from API and stored voter preferences
  const loadGroupTripData = useCallback(async () => {
    try {
      const [fetchedTrip, cachedVotes, cachedPacked, cachedRsvp] = await Promise.all([
        fetchActiveGroupTrip(siteId).catch(() => null),
        storeGet(getVotesStorageKey(siteId)).catch(() => null),
        storeGet(getPackedGearStorageKey(siteId)).catch(() => null),
        storeGet(getRsvpStorageKey(siteId)).catch(() => null),
      ]);

      if (cachedVotes) {
        try {
          const parsed = JSON.parse(cachedVotes);
          if (parsed && typeof parsed === 'object') setUserVotedOptions(parsed);
        } catch {}
      }

      if (cachedPacked) {
        try {
          const parsed = JSON.parse(cachedPacked);
          if (Array.isArray(parsed)) setPackedGearIds(parsed);
        } catch {}
      }

      if (cachedRsvp && ['Confirmed', 'Tentative', 'Invited'].includes(cachedRsvp)) {
        setCurrentUserRsvp(cachedRsvp as 'Confirmed' | 'Tentative' | 'Invited');
      }

      if (fetchedTrip) {
        setGroupTrip(fetchedTrip);
      }
    } catch (err) {
      console.error('[GroupTripContext] Failed to load active group trip:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [siteId]);

  useEffect(() => {
    setIsLoading(true);
    loadGroupTripData();
  }, [loadGroupTripData]);

  // Pull to refresh
  const refreshGroupTrip = useCallback(async () => {
    setIsRefreshing(true);
    await loadGroupTripData();
  }, [loadGroupTripData]);

  // Cast vote on a poll
  const voteOnPoll = useCallback(
    async (pollId: string, optionId: string, voterName = 'You (Co-Traveler)'): Promise<boolean> => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

        // Optimistically record vote locally
        const updatedVotes = { ...userVotedOptions, [pollId]: optionId };
        setUserVotedOptions(updatedVotes);
        await storeSet(getVotesStorageKey(siteId), JSON.stringify(updatedVotes));

        // Call backend API
        const updatedPoll = await castGroupPollVote(
          {
            groupId: groupTrip?.groupId,
            pollId,
            optionId,
            voterName,
          },
          siteId
        );

        if (updatedPoll) {
          setGroupTrip((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              polls: prev.polls.map((p) => (p.pollId === pollId ? updatedPoll : p)),
            };
          });
        }
        return true;
      } catch (err) {
        console.error('[GroupTripContext] Error voting on poll:', err);
        Alert.alert('Notice', 'Vote saved locally. It will synchronize with the group server shortly.');
        return false;
      }
    },
    [groupTrip?.groupId, siteId, userVotedOptions]
  );

  // Toggle packed status for a gear item
  const toggleGearPacked = useCallback(
    async (itemId: string) => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        setPackedGearIds((prev) => {
          const next = prev.includes(itemId)
            ? prev.filter((id) => id !== itemId)
            : [...prev, itemId];
          storeSet(getPackedGearStorageKey(siteId), JSON.stringify(next)).catch(() => {});
          return next;
        });

        // Also update local in-memory group trip item if present
        setGroupTrip((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            gearItems: prev.gearItems.map((item) =>
              item.itemId === itemId ? { ...item, isPacked: !item.isPacked } : item
            ),
          };
        });
      } catch (err) {
        console.error('[GroupTripContext] Error toggling gear packed status:', err);
      }
    },
    [siteId]
  );

  // Add new gear item
  const addNewGearItem = useCallback(
    async (title: string, category: string, assignedToMemberName: string): Promise<boolean> => {
      if (!title.trim()) return false;
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        const created = await createGroupGearItem(
          {
            groupId: groupTrip?.groupId,
            title: title.trim(),
            category: category.trim() || 'General',
            assignedToMemberName: assignedToMemberName.trim() || 'Unassigned',
          },
          siteId
        );

        if (created) {
          setGroupTrip((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              gearItems: [created, ...prev.gearItems],
            };
          });
        }
        return true;
      } catch (err) {
        console.error('[GroupTripContext] Error creating gear item:', err);
        // Fallback local creation
        const localItem: GroupGearItem = {
          itemId: `gear-${Date.now()}`,
          title: title.trim(),
          category: category.trim() || 'General',
          assignedToMemberName: assignedToMemberName.trim() || 'Unassigned',
          isPacked: false,
        };
        setGroupTrip((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            gearItems: [localItem, ...prev.gearItems],
          };
        });
        return true;
      }
    },
    [groupTrip?.groupId, siteId]
  );

  // Share party invite
  const sharePartyInvite = useCallback(async () => {
    if (!groupTrip) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      const inviteMsg =
        `✈️ Join our travel expedition group "${groupTrip.groupName}" to ${groupTrip.destination}!\n\n` +
        `📅 Dates: ${groupTrip.travelDates}\n` +
        `🔑 Group Invite Code: ${groupTrip.inviteCode}\n` +
        `🗳️ Vote on excursions, coordinate packing gear, and review group dietary plans:\n` +
        `${groupTrip.shareableInviteUrl || 'https://toursapp.travel/join?code=' + groupTrip.inviteCode}\n\n` +
        `Open in the app to join our party!`;

      await Share.share({
        title: `Join ${groupTrip.groupName}`,
        message: inviteMsg,
      });
    } catch (err) {
      console.error('[GroupTripContext] Error sharing party invite:', err);
    }
  }, [groupTrip]);

  // Update current user RSVP
  const updateUserRsvp = useCallback(
    async (status: 'Confirmed' | 'Tentative' | 'Invited') => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        setCurrentUserRsvp(status);
        await storeSet(getRsvpStorageKey(siteId), status);
      } catch (err) {
        console.error('[GroupTripContext] Error setting RSVP:', err);
      }
    },
    [siteId]
  );

  const value = useMemo(
    () => ({
      groupTrip,
      isLoading,
      isRefreshing,
      activeTab,
      setActiveTab,
      userVotedOptions,
      packedGearIds,
      currentUserRsvp,
      refreshGroupTrip,
      voteOnPoll,
      toggleGearPacked,
      addNewGearItem,
      sharePartyInvite,
      updateUserRsvp,
    }),
    [
      groupTrip,
      isLoading,
      isRefreshing,
      activeTab,
      userVotedOptions,
      packedGearIds,
      currentUserRsvp,
      refreshGroupTrip,
      voteOnPoll,
      toggleGearPacked,
      addNewGearItem,
      sharePartyInvite,
      updateUserRsvp,
    ]
  );

  return (
    <GroupTripContext.Provider value={value}>
      {children}
    </GroupTripContext.Provider>
  );
};

export const useGroupTrip = (): GroupTripContextType => {
  const context = useContext(GroupTripContext);
  if (!context) {
    throw new Error('useGroupTrip must be used within a GroupTripProvider');
  }
  return context;
};

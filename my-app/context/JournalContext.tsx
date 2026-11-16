import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Share, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSite } from '@/store/SiteConfigContext';
import {
  TripScrapbook,
  JournalEntry,
  CreateJournalEntryRequest,
} from '../types';
import {
  fetchTripScrapbook,
  createJournalEntry,
} from '../services/api';
import { storeGet, storeSet } from '../src/lib/storage';

interface JournalContextType {
  scrapbook: TripScrapbook | null;
  isLoading: boolean;
  isRefreshing: boolean;
  selectedDayFilter: number | 'all';
  setSelectedDayFilter: (day: number | 'all') => void;
  selectedMoodFilter: string | 'all';
  setSelectedMoodFilter: (mood: string | 'all') => void;
  likedEntryIds: string[];
  filteredEntries: JournalEntry[];
  refreshScrapbook: () => Promise<void>;
  toggleLikeEntry: (entryId: string) => Promise<void>;
  addMemoryEntry: (
    title: string,
    notes: string,
    locationName: string,
    moodTag: string,
    photoUrl?: string,
    dayNumber?: number
  ) => Promise<boolean>;
  shareStoryReel: () => Promise<void>;
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);

const getLikesStorageKey = (siteId: string) => `@toursapp_journal_likes:${siteId}`;
const getLocalEntriesStorageKey = (siteId: string) => `@toursapp_journal_entries:${siteId}`;

export const JournalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { siteId } = useSite();

  const [scrapbook, setScrapbook] = useState<TripScrapbook | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | 'all'>('all');
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string | 'all'>('all');
  const [likedEntryIds, setLikedEntryIds] = useState<string[]>([]);

  // Load scrapbook and cached entries/likes
  const loadScrapbookData = useCallback(async () => {
    try {
      const [fetchedScrapbook, cachedLikes, cachedLocalEntries] = await Promise.all([
        fetchTripScrapbook(undefined, siteId).catch(() => null),
        storeGet(getLikesStorageKey(siteId)).catch(() => null),
        storeGet(getLocalEntriesStorageKey(siteId)).catch(() => null),
      ]);

      if (cachedLikes) {
        try {
          const parsed = JSON.parse(cachedLikes);
          if (Array.isArray(parsed)) setLikedEntryIds(parsed);
        } catch {}
      }

      let combined = fetchedScrapbook;
      if (cachedLocalEntries && combined) {
        try {
          const localParsed = JSON.parse(cachedLocalEntries) as JournalEntry[];
          if (Array.isArray(localParsed) && localParsed.length > 0) {
            const existingIds = new Set(combined.entries.map((e) => e.entryId));
            const newLocals = localParsed.filter((l) => !existingIds.has(l.entryId));
            combined = {
              ...combined,
              entries: [...newLocals, ...combined.entries],
              stats: {
                ...combined.stats,
                totalPhotos: combined.stats.totalPhotos + newLocals.length,
              },
            };
          }
        } catch {}
      }

      if (combined) {
        setScrapbook(combined);
      }
    } catch (err) {
      console.error('[JournalContext] Failed to load scrapbook data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [siteId]);

  useEffect(() => {
    setIsLoading(true);
    loadScrapbookData();
  }, [loadScrapbookData]);

  const refreshScrapbook = useCallback(async () => {
    setIsRefreshing(true);
    await loadScrapbookData();
  }, [loadScrapbookData]);

  // Toggle Like on an entry
  const toggleLikeEntry = useCallback(
    async (entryId: string) => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        setLikedEntryIds((prev) => {
          const isLiked = prev.includes(entryId);
          const next = isLiked ? prev.filter((id) => id !== entryId) : [...prev, entryId];
          storeSet(getLikesStorageKey(siteId), JSON.stringify(next)).catch(() => {});

          setScrapbook((current) => {
            if (!current) return current;
            return {
              ...current,
              entries: current.entries.map((entry) => {
                if (entry.entryId === entryId) {
                  return {
                    ...entry,
                    likesCount: isLiked
                      ? Math.max(0, entry.likesCount - 1)
                      : entry.likesCount + 1,
                  };
                }
                return entry;
              }),
            };
          });

          return next;
        });
      } catch (err) {
        console.error('[JournalContext] Error toggling entry like:', err);
      }
    },
    [siteId]
  );

  // Add a new memory entry
  const addMemoryEntry = useCallback(
    async (
      title: string,
      notes: string,
      locationName: string,
      moodTag: string,
      photoUrl?: string,
      dayNumber = 1
    ): Promise<boolean> => {
      if (!title.trim() || !notes.trim()) return false;
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

        const payload: CreateJournalEntryRequest = {
          tripId: scrapbook?.tripId,
          dayNumber,
          title: title.trim(),
          notes: notes.trim(),
          locationName: locationName.trim() || scrapbook?.destination || 'Expedition Landmark',
          moodTag: moodTag.trim() || 'Awestruck',
          photoUrl: photoUrl?.trim() || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
          authorName: 'You (Expedition Traveler)',
        };

        const created = await createJournalEntry(payload, siteId);

        if (created) {
          setScrapbook((prev) => {
            if (!prev) return prev;
            const updated = [created, ...prev.entries];
            // Cache locally
            storeSet(getLocalEntriesStorageKey(siteId), JSON.stringify(updated)).catch(() => {});
            return {
              ...prev,
              entries: updated,
              stats: {
                ...prev.stats,
                totalPhotos: prev.stats.totalPhotos + 1,
              },
            };
          });
        }
        return true;
      } catch (err) {
        console.error('[JournalContext] Error creating journal memory:', err);
        // Fallback local memory creation
        const localEntry: JournalEntry = {
          entryId: `mem-local-${Date.now()}`,
          tripId: scrapbook?.tripId || 'trip-local',
          dayNumber,
          date: 'Today',
          title: title.trim(),
          notes: notes.trim(),
          locationName: locationName.trim() || scrapbook?.destination || 'Expedition Landmark',
          moodTag: moodTag.trim() || 'Awestruck',
          photoUrl: photoUrl?.trim() || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
          authorName: 'You (Expedition Traveler)',
          likesCount: 1,
          createdAt: new Date().toISOString(),
        };

        setScrapbook((prev) => {
          if (!prev) return prev;
          const updated = [localEntry, ...prev.entries];
          storeSet(getLocalEntriesStorageKey(siteId), JSON.stringify(updated)).catch(() => {});
          return {
            ...prev,
            entries: updated,
            stats: {
              ...prev.stats,
              totalPhotos: prev.stats.totalPhotos + 1,
            },
          };
        });
        return true;
      }
    },
    [scrapbook?.destination, scrapbook?.tripId, siteId]
  );

  // Share exportable story reel
  const shareStoryReel = useCallback(async () => {
    if (!scrapbook) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      const shareMsg =
        `📖✨ EXPEDITION MEMORY STORYBOOK: ${scrapbook.tourName.toUpperCase()}\n` +
        `📍 Destination: ${scrapbook.destination} (${scrapbook.travelDates})\n\n` +
        `"${scrapbook.inspirationalQuote}"\n\n` +
        `📊 My Journey In Numbers:\n` +
        `• 🗺️ ${scrapbook.stats.stopsCompleted} Historic Stops Completed\n` +
        `• 📷 ${scrapbook.stats.totalPhotos} Photos & Milestones Captured\n` +
        `• 🎙️ ${scrapbook.stats.audioStoriesPlayed} Cultural Audio Stories Listened To\n` +
        `• 🏅 ${scrapbook.stats.stampsEarned} Expedition Passport Stamps Earned\n` +
        `• 🍽️ Top Gastronomy: ${scrapbook.stats.signatureDish}\n` +
        `• 🧭 Distance Explored: ${scrapbook.stats.distanceTraveledKm} km\n\n` +
        `View my digital photo journal & souvenir reel:\n${scrapbook.shareableStoryUrl}`;

      await Share.share({
        title: `${scrapbook.tourName} - Travel Keepsake Reel`,
        message: shareMsg,
      });
    } catch (err) {
      console.error('[JournalContext] Error sharing story reel:', err);
    }
  }, [scrapbook]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    if (!scrapbook) return [];
    return scrapbook.entries.filter((entry) => {
      const matchDay =
        selectedDayFilter === 'all' || entry.dayNumber === selectedDayFilter;
      const matchMood =
        selectedMoodFilter === 'all' || entry.moodTag === selectedMoodFilter;
      return matchDay && matchMood;
    });
  }, [scrapbook, selectedDayFilter, selectedMoodFilter]);

  const value = useMemo(
    () => ({
      scrapbook,
      isLoading,
      isRefreshing,
      selectedDayFilter,
      setSelectedDayFilter,
      selectedMoodFilter,
      setSelectedMoodFilter,
      likedEntryIds,
      filteredEntries,
      refreshScrapbook,
      toggleLikeEntry,
      addMemoryEntry,
      shareStoryReel,
    }),
    [
      scrapbook,
      isLoading,
      isRefreshing,
      selectedDayFilter,
      selectedMoodFilter,
      likedEntryIds,
      filteredEntries,
      refreshScrapbook,
      toggleLikeEntry,
      addMemoryEntry,
      shareStoryReel,
    ]
  );

  return (
    <JournalContext.Provider value={value}>
      {children}
    </JournalContext.Provider>
  );
};

export const useJournal = (): JournalContextType => {
  const context = useContext(JournalContext);
  if (!context) {
    throw new Error('useJournal must be used within a JournalProvider');
  }
  return context;
};

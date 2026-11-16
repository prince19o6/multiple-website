import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import { useSite } from '@/store/SiteConfigContext';
import { DestinationPhrasebook, PhraseItem } from '../types';
import { fetchDestinationPhrasebook } from '../services/api';
import { storeGet, storeSet } from '../src/lib/storage';

interface PhrasebookContextType {
  phrasebook: DestinationPhrasebook | null;
  isLoading: boolean;
  isRefreshing: boolean;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  favoritePhraseIds: string[];
  filteredPhrases: PhraseItem[];
  selectedPhraseForFlashcard: PhraseItem | null;
  openFlashcard: (phrase: PhraseItem) => void;
  closeFlashcard: () => void;
  toggleFavorite: (phraseId: string) => Promise<void>;
  refreshPhrasebook: () => Promise<void>;
}

const PhrasebookContext = createContext<PhrasebookContextType | undefined>(undefined);

const getFavoritesStorageKey = (siteId: string) => `@toursapp_phrasebook_favorites:${siteId}`;

export const PhrasebookProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { siteId } = useSite();

  const [phrasebook, setPhrasebook] = useState<DestinationPhrasebook | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favoritePhraseIds, setFavoritePhraseIds] = useState<string[]>([]);
  const [selectedPhraseForFlashcard, setSelectedPhraseForFlashcard] = useState<PhraseItem | null>(null);

  const loadPhrasebookData = useCallback(async () => {
    try {
      const [fetched, cachedFavorites] = await Promise.all([
        fetchDestinationPhrasebook(undefined, undefined, siteId).catch(() => null),
        storeGet(getFavoritesStorageKey(siteId)).catch(() => null),
      ]);

      if (cachedFavorites) {
        try {
          const parsed = JSON.parse(cachedFavorites);
          if (Array.isArray(parsed)) setFavoritePhraseIds(parsed);
        } catch {}
      }

      if (fetched) {
        setPhrasebook(fetched);
      }
    } catch (err) {
      console.error('[PhrasebookContext] Error loading phrasebook:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [siteId]);

  useEffect(() => {
    setIsLoading(true);
    loadPhrasebookData();
  }, [loadPhrasebookData]);

  const refreshPhrasebook = useCallback(async () => {
    setIsRefreshing(true);
    await loadPhrasebookData();
  }, [loadPhrasebookData]);

  const toggleFavorite = useCallback(
    async (phraseId: string) => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        setFavoritePhraseIds((prev) => {
          const isFav = prev.includes(phraseId);
          const next = isFav ? prev.filter((id) => id !== phraseId) : [...prev, phraseId];
          storeSet(getFavoritesStorageKey(siteId), JSON.stringify(next)).catch(() => {});
          return next;
        });
      } catch (err) {
        console.error('[PhrasebookContext] Error toggling favorite:', err);
      }
    },
    [siteId]
  );

  const openFlashcard = useCallback((phrase: PhraseItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setSelectedPhraseForFlashcard(phrase);
  }, []);

  const closeFlashcard = useCallback(() => {
    setSelectedPhraseForFlashcard(null);
  }, []);

  // Filter phrases based on category, search, and favorites
  const filteredPhrases = useMemo(() => {
    if (!phrasebook) return [];

    return phrasebook.phrases.filter((item) => {
      // Category filter
      if (selectedCategory === 'Favorites') {
        if (!favoritePhraseIds.includes(item.phraseId)) return false;
      } else if (selectedCategory !== 'All') {
        if (item.category.toLowerCase() !== selectedCategory.toLowerCase()) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesEnglish = item.englishText.toLowerCase().includes(q);
        const matchesPhonetic = item.phoneticText.toLowerCase().includes(q);
        const matchesScript = item.targetScriptText.toLowerCase().includes(q);
        const matchesNote = item.culturalContextNote.toLowerCase().includes(q);
        return matchesEnglish || matchesPhonetic || matchesScript || matchesNote;
      }

      return true;
    });
  }, [phrasebook, selectedCategory, favoritePhraseIds, searchQuery]);

  const value = useMemo(
    () => ({
      phrasebook,
      isLoading,
      isRefreshing,
      selectedCategory,
      setSelectedCategory,
      searchQuery,
      setSearchQuery,
      favoritePhraseIds,
      filteredPhrases,
      selectedPhraseForFlashcard,
      openFlashcard,
      closeFlashcard,
      toggleFavorite,
      refreshPhrasebook,
    }),
    [
      phrasebook,
      isLoading,
      isRefreshing,
      selectedCategory,
      searchQuery,
      favoritePhraseIds,
      filteredPhrases,
      selectedPhraseForFlashcard,
      openFlashcard,
      closeFlashcard,
      toggleFavorite,
      refreshPhrasebook,
    ]
  );

  return (
    <PhrasebookContext.Provider value={value}>
      {children}
    </PhrasebookContext.Provider>
  );
};

export const usePhrasebook = (): PhrasebookContextType => {
  const context = useContext(PhrasebookContext);
  if (!context) {
    throw new Error('usePhrasebook must be used within a PhrasebookProvider');
  }
  return context;
};

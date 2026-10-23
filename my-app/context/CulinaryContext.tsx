import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import { useSite } from '@/store/SiteConfigContext';
import {
  CulinaryTrail,
  DishRecommendation,
  DiningSpot,
  DietaryPreference,
} from '../types';
import { fetchBrandCulinaryTrails } from '../services/api';
import { storeGet, storeSet } from '../src/lib/storage';

interface CulinaryContextType {
  currentTrail: CulinaryTrail | null;
  allTrails: CulinaryTrail[];
  selectedDestinationId: string;
  selectedDietaryFilter: DietaryPreference;
  searchQuery: string;
  favoriteDishIds: string[];
  favoriteSpotIds: string[];
  isLoading: boolean;
  isRefreshing: boolean;
  activeReservationSpot: DiningSpot | null;
  selectDestination: (destinationId: string) => void;
  setDietaryFilter: (filter: DietaryPreference) => void;
  setSearchQuery: (query: string) => void;
  toggleFavoriteDish: (dishId: string) => Promise<void>;
  toggleFavoriteSpot: (spotId: string) => Promise<void>;
  refreshTrails: () => Promise<void>;
  openReservationModal: (spot: DiningSpot) => void;
  closeReservationModal: () => void;
  filteredDishes: DishRecommendation[];
  filteredDiningSpots: DiningSpot[];
}

const CulinaryContext = createContext<CulinaryContextType | undefined>(undefined);

const getFavoritesStorageKey = (siteId: string) => `@toursapp_culinary_favs:${siteId}`;

export const CulinaryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { siteId } = useSite();

  const [allTrails, setAllTrails] = useState<CulinaryTrail[]>([]);
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>('');
  const [selectedDietaryFilter, setSelectedDietaryFilter] = useState<DietaryPreference>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favoriteDishIds, setFavoriteDishIds] = useState<string[]>([]);
  const [favoriteSpotIds, setFavoriteSpotIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeReservationSpot, setActiveReservationSpot] = useState<DiningSpot | null>(null);

  // Load favorites from local storage
  const loadFavorites = useCallback(async () => {
    try {
      const raw = await storeGet(getFavoritesStorageKey(siteId));
      if (raw) {
        const parsed = JSON.parse(raw) as { dishes?: string[]; spots?: string[] };
        if (Array.isArray(parsed.dishes)) setFavoriteDishIds(parsed.dishes);
        if (Array.isArray(parsed.spots)) setFavoriteSpotIds(parsed.spots);
      }
    } catch {
      // ignore
    }
  }, [siteId]);

  // Load trails from backend
  const loadTrails = useCallback(async () => {
    try {
      const trails = await fetchBrandCulinaryTrails(siteId);
      if (trails && trails.length > 0) {
        setAllTrails(trails);
        setSelectedDestinationId((prev) =>
          prev && trails.find((t) => t.destinationId === prev)
            ? prev
            : trails[0].destinationId
        );
      }
    } catch {
      // offline fallback or network drop
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [siteId]);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([loadTrails(), loadFavorites()]).finally(() => {
      setIsLoading(false);
    });
  }, [siteId, loadTrails, loadFavorites]);

  const refreshTrails = async () => {
    setIsRefreshing(true);
    await loadTrails();
  };

  const selectDestination = (destinationId: string) => {
    Haptics.selectionAsync();
    setSelectedDestinationId(destinationId);
  };

  const setDietaryFilter = (filter: DietaryPreference) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDietaryFilter(filter);
  };

  const toggleFavoriteDish = async (dishId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const updated = favoriteDishIds.includes(dishId)
      ? favoriteDishIds.filter((id) => id !== dishId)
      : [...favoriteDishIds, dishId];
    setFavoriteDishIds(updated);
    try {
      await storeSet(
        getFavoritesStorageKey(siteId),
        JSON.stringify({ dishes: updated, spots: favoriteSpotIds })
      );
    } catch {
      // ignore
    }
  };

  const toggleFavoriteSpot = async (spotId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const updated = favoriteSpotIds.includes(spotId)
      ? favoriteSpotIds.filter((id) => id !== spotId)
      : [...favoriteSpotIds, spotId];
    setFavoriteSpotIds(updated);
    try {
      await storeSet(
        getFavoritesStorageKey(siteId),
        JSON.stringify({ dishes: favoriteDishIds, spots: updated })
      );
    } catch {
      // ignore
    }
  };

  const openReservationModal = (spot: DiningSpot) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveReservationSpot(spot);
  };

  const closeReservationModal = () => {
    setActiveReservationSpot(null);
  };

  const currentTrail = useMemo(() => {
    if (allTrails.length === 0) return null;
    return allTrails.find((t) => t.destinationId === selectedDestinationId) || allTrails[0];
  }, [allTrails, selectedDestinationId]);

  // Filter dishes based on dietary filter and search text
  const filteredDishes = useMemo(() => {
    if (!currentTrail) return [];
    return currentTrail.dishes.filter((dish) => {
      // 1. Dietary filter
      if (selectedDietaryFilter !== 'all') {
        const badges = dish.dietaryBadges.map((b) => b.toLowerCase());
        if (selectedDietaryFilter === 'pure_veg' && !badges.some((b) => b.includes('pure veg') || b.includes('veg'))) {
          return false;
        }
        if (selectedDietaryFilter === 'jain' && !badges.some((b) => b.includes('jain'))) {
          return false;
        }
        if (selectedDietaryFilter === 'halal' && !badges.some((b) => b.includes('halal'))) {
          return false;
        }
        if (selectedDietaryFilter === 'vegan' && !badges.some((b) => b.includes('vegan'))) {
          return false;
        }
        if (selectedDietaryFilter === 'gluten_free' && !badges.some((b) => b.includes('gluten-free') || b.includes('gluten free'))) {
          return false;
        }
        if (selectedDietaryFilter === 'seafood' && !badges.some((b) => b.includes('seafood'))) {
          return false;
        }
      }

      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = dish.name.toLowerCase().includes(q);
        const matchesLocal = dish.localName.toLowerCase().includes(q);
        const matchesCategory = dish.category.toLowerCase().includes(q);
        const matchesDesc = dish.description.toLowerCase().includes(q);
        if (!matchesName && !matchesLocal && !matchesCategory && !matchesDesc) {
          return false;
        }
      }

      return true;
    });
  }, [currentTrail, selectedDietaryFilter, searchQuery]);

  // Filter dining spots based on dietary certifications and search
  const filteredDiningSpots = useMemo(() => {
    if (!currentTrail) return [];
    return currentTrail.diningSpots.filter((spot) => {
      // 1. Dietary filter
      if (selectedDietaryFilter !== 'all') {
        const certs = spot.dietaryCertifications.map((c) => c.toLowerCase());
        if (selectedDietaryFilter === 'pure_veg' && !certs.some((c) => c.includes('pure veg') || c.includes('veg'))) {
          return false;
        }
        if (selectedDietaryFilter === 'jain' && !certs.some((c) => c.includes('jain'))) {
          return false;
        }
        if (selectedDietaryFilter === 'halal' && !certs.some((c) => c.includes('halal'))) {
          return false;
        }
      }

      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = spot.name.toLowerCase().includes(q);
        const matchesCuisine = spot.cuisineType.toLowerCase().includes(q);
        const matchesAddress = spot.address.toLowerCase().includes(q);
        const matchesDishes = spot.signatureDishes.some((d) => d.toLowerCase().includes(q));
        if (!matchesName && !matchesCuisine && !matchesAddress && !matchesDishes) {
          return false;
        }
      }

      return true;
    });
  }, [currentTrail, selectedDietaryFilter, searchQuery]);

  const value = useMemo(
    () => ({
      currentTrail,
      allTrails,
      selectedDestinationId,
      selectedDietaryFilter,
      searchQuery,
      favoriteDishIds,
      favoriteSpotIds,
      isLoading,
      isRefreshing,
      activeReservationSpot,
      selectDestination,
      setDietaryFilter,
      setSearchQuery,
      toggleFavoriteDish,
      toggleFavoriteSpot,
      refreshTrails,
      openReservationModal,
      closeReservationModal,
      filteredDishes,
      filteredDiningSpots,
    }),
    [
      currentTrail,
      allTrails,
      selectedDestinationId,
      selectedDietaryFilter,
      searchQuery,
      favoriteDishIds,
      favoriteSpotIds,
      isLoading,
      isRefreshing,
      activeReservationSpot,
      filteredDishes,
      filteredDiningSpots,
    ]
  );

  return <CulinaryContext.Provider value={value}>{children}</CulinaryContext.Provider>;
};

export const useCulinary = (): CulinaryContextType => {
  const context = useContext(CulinaryContext);
  if (!context) {
    throw new Error('useCulinary must be used within a CulinaryProvider');
  }
  return context;
};

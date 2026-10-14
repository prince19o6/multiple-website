/**
 * context/WishlistContext.tsx
 *
 * Persists wishlist state per website tenant in storage so each branded site
 * keeps its own independent saved tours list with zero cross-site data leaking.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSelectedSite } from '@/hooks/useSelectedSite';
import { storeGetObject, storeSetObject, storeRemove } from '@/src/lib/storage';

export interface WishlistContextType {
  wishlistIds: number[];
  wishlistCount: number;
  isWishlisted: (tourId: number) => boolean;
  toggleWishlist: (tourId: number) => Promise<void>;
  addToWishlist: (tourId: number) => Promise<void>;
  removeFromWishlist: (tourId: number) => Promise<void>;
  clearWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType>({
  wishlistIds: [],
  wishlistCount: 0,
  isWishlisted: () => false,
  toggleWishlist: async () => {},
  addToWishlist: async () => {},
  removeFromWishlist: async () => {},
  clearWishlist: async () => {},
});

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { siteId } = useSelectedSite();
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);

  const rawId = String(siteId || '');
  const currentSiteId =
    rawId === 'website2' || rawId === 'tripgoasia'
      ? 'tripgoasia'
      : rawId === 'website3' || rawId === 'technoheaven'
      ? 'technoheaven'
      : 'gujjutours';

  // Load wishlist whenever active site changes
  useEffect(() => {
    let cancelled = false;
    const loadWishlist = async () => {
      try {
        const stored = await storeGetObject<number[]>('wishlist', currentSiteId);
        if (!cancelled) {
          if (Array.isArray(stored)) {
            setWishlistIds(stored);
          } else {
            setWishlistIds([]);
          }
        }
      } catch (err) {
        console.warn('[WishlistContext] Failed to load wishlist:', err);
      }
    };

    loadWishlist();
    return () => {
      cancelled = true;
    };
  }, [currentSiteId]);

  const persistWishlist = async (ids: number[]) => {
    try {
      await storeSetObject('wishlist', ids, currentSiteId);
    } catch (err) {
      console.warn('[WishlistContext] Failed to persist wishlist:', err);
    }
  };

  const isWishlisted = useCallback(
    (tourId: number) => wishlistIds.includes(tourId),
    [wishlistIds]
  );

  const addToWishlist = useCallback(
    async (tourId: number) => {
      if (wishlistIds.includes(tourId)) return;
      const updated = [...wishlistIds, tourId];
      setWishlistIds(updated);
      await persistWishlist(updated);
    },
    [wishlistIds, currentSiteId]
  );

  const removeFromWishlist = useCallback(
    async (tourId: number) => {
      const updated = wishlistIds.filter((id) => id !== tourId);
      setWishlistIds(updated);
      await persistWishlist(updated);
    },
    [wishlistIds, currentSiteId]
  );

  const toggleWishlist = useCallback(
    async (tourId: number) => {
      if (wishlistIds.includes(tourId)) {
        await removeFromWishlist(tourId);
      } else {
        await addToWishlist(tourId);
      }
    },
    [wishlistIds, addToWishlist, removeFromWishlist]
  );

  const clearWishlist = useCallback(async () => {
    setWishlistIds([]);
    await storeRemove('wishlist', currentSiteId);
  }, [currentSiteId]);

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistCount: wishlistIds.length,
        isWishlisted,
        toggleWishlist,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}

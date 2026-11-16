/**
 * context/WishlistContext.tsx
 *
 * Persists wishlist state per individual user and website tenant.
 * Guarantees strict user isolation: each traveler account maintains their
 * own private saved tours list with zero cross-user or cross-site leaking.
 *
 * Rich Metadata Persistence:
 * Stores full item representations (title, photos, pricing, category, module)
 * so bookmarked expeditions and module offerings appear immediately on the Wishlist tab
 * without requiring secondary network queries or fragile ID-only mapping.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSelectedSite } from '@/hooks/useSelectedSite';
import { useAuth } from '@/context/AuthContext';
import { storeGetObject, storeSetObject, storeRemove } from '@/src/lib/storage';

export interface WishlistItem {
  id: number | string;
  slug?: string;
  title?: string;
  name?: string;
  description?: string;
  category?: string;
  price?: number;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  image?: string;
  imageUrl?: string;
  duration?: string;
  difficulty?: string;
  location?: string;
  city?: string;
  country?: string;
  module?: string;
  badge?: string;
  stars?: number;
  addedAt?: number;
}

export interface WishlistContextType {
  wishlistIds: (number | string)[];
  wishlistItems: WishlistItem[];
  wishlistCount: number;
  isWishlisted: (tourIdOrSlugOrTitle: number | string) => boolean;
  toggleWishlist: (
    tourIdOrSlugOrTitle: number | string,
    itemData?: Partial<WishlistItem>,
    module?: string
  ) => Promise<void>;
  addToWishlist: (
    tourIdOrSlugOrTitle: number | string,
    itemData?: Partial<WishlistItem>,
    module?: string
  ) => Promise<void>;
  removeFromWishlist: (tourIdOrSlugOrTitle: number | string) => Promise<void>;
  clearWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType>({
  wishlistIds: [],
  wishlistItems: [],
  wishlistCount: 0,
  isWishlisted: () => false,
  toggleWishlist: async () => {},
  addToWishlist: async () => {},
  removeFromWishlist: async () => {},
  clearWishlist: async () => {},
});

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { siteId } = useSelectedSite();
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<(number | string)[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

  const rawId = String(siteId || '');
  const currentSiteId =
    rawId === 'website2' || rawId === 'tripgoasia'
      ? 'tripgoasia'
      : rawId === 'website3' || rawId === 'technoheaven'
      ? 'technoheaven'
      : 'gujjutours';

  // Derive unique identifier for the active traveler account
  const userIdentifier = user?.id
    ? `user_${user.id}`
    : user?.email
    ? `user_${user.email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_')}`
    : 'guest';

  const storageKey = `wishlist_${userIdentifier}`;
  const storageKeyItems = `wishlist_items_${userIdentifier}`;

  // Track previous user identifier to migrate guest bookmarks upon login
  const prevUserIdentifierRef = useRef<string>(userIdentifier);

  // Load wishlist whenever active site or logged-in user changes
  useEffect(() => {
    let cancelled = false;

    const loadWishlist = async () => {
      try {
        const wasGuest = prevUserIdentifierRef.current === 'guest';
        const isNowLoggedIn = userIdentifier !== 'guest';
        prevUserIdentifierRef.current = userIdentifier;

        // 1. Fetch rich wishlist items
        const storedItems = await storeGetObject<WishlistItem[]>(storageKeyItems, currentSiteId);
        let currentItems: WishlistItem[] = Array.isArray(storedItems) ? storedItems : [];

        // 2. Fetch legacy or ID-only wishlist
        const storedIds = await storeGetObject<(number | string)[]>(storageKey, currentSiteId);
        let currentIds: (number | string)[] = Array.isArray(storedIds) ? storedIds : [];

        // If items exist, ensure IDs are synced
        if (currentItems.length > 0) {
          const itemIds = currentItems.map((i) => i.id);
          currentIds = Array.from(new Set([...currentIds, ...itemIds]));
        } else if (currentIds.length > 0) {
          // If only IDs exist, build initial items
          currentItems = currentIds.map((id) => ({
            id,
            slug: typeof id === 'string' ? id : undefined,
            title: `Expedition #${id}`,
            name: `Expedition #${id}`,
            price: 0,
            rating: 5.0,
            module: 'tours',
          }));
        }

        // 3. Guest migration upon login
        if (wasGuest && isNowLoggedIn) {
          const guestStoredItems = await storeGetObject<WishlistItem[]>(
            'wishlist_items_guest',
            currentSiteId
          );
          const guestStoredIds = await storeGetObject<(number | string)[]>(
            'wishlist_guest',
            currentSiteId
          );

          if (Array.isArray(guestStoredItems) && guestStoredItems.length > 0) {
            const existingKeys = new Set(
              currentItems.map((i) => String(i.slug || i.id || i.title).toLowerCase().trim())
            );
            const mergedItems = [...currentItems];
            guestStoredItems.forEach((gi) => {
              const k = String(gi.slug || gi.id || gi.title).toLowerCase().trim();
              if (!existingKeys.has(k)) {
                existingKeys.add(k);
                mergedItems.push(gi);
              }
            });
            currentItems = mergedItems;
            currentIds = Array.from(new Set([...currentIds, ...currentItems.map((i) => i.id)]));

            await storeSetObject(storageKeyItems, currentItems, currentSiteId);
            await storeSetObject(storageKey, currentIds, currentSiteId);
            await storeRemove('wishlist_items_guest', currentSiteId);
            await storeRemove('wishlist_guest', currentSiteId);
          } else if (Array.isArray(guestStoredIds) && guestStoredIds.length > 0) {
            currentIds = Array.from(new Set([...currentIds, ...guestStoredIds]));
            await storeSetObject(storageKey, currentIds, currentSiteId);
            await storeRemove('wishlist_guest', currentSiteId);
          }
        }

        // 4. Migration from un-scoped common 'wishlist' key
        if (currentIds.length === 0 && isNowLoggedIn) {
          const legacyItems = await storeGetObject<(number | string)[]>('wishlist', currentSiteId);
          if (Array.isArray(legacyItems) && legacyItems.length > 0) {
            currentIds = legacyItems;
            currentItems = currentIds.map((id) => ({
              id,
              slug: typeof id === 'string' ? id : undefined,
              title: `Expedition #${id}`,
              name: `Expedition #${id}`,
              price: 0,
              rating: 5.0,
              module: 'tours',
            }));
            await storeSetObject(storageKey, currentIds, currentSiteId);
            await storeSetObject(storageKeyItems, currentItems, currentSiteId);
            await storeRemove('wishlist', currentSiteId);
          }
        }

        if (!cancelled) {
          setWishlistIds(currentIds);
          setWishlistItems(currentItems);
        }
      } catch (err) {
        console.warn('[WishlistContext] Failed to load wishlist:', err);
        if (!cancelled) {
          setWishlistIds([]);
          setWishlistItems([]);
        }
      }
    };

    loadWishlist();

    return () => {
      cancelled = true;
    };
  }, [currentSiteId, userIdentifier, storageKey, storageKeyItems]);

  const isWishlisted = useCallback(
    (tourIdOrSlugOrTitle: number | string) => {
      if (
        tourIdOrSlugOrTitle === undefined ||
        tourIdOrSlugOrTitle === null ||
        tourIdOrSlugOrTitle === ''
      ) {
        return false;
      }
      const queryStr = String(tourIdOrSlugOrTitle).trim().toLowerCase();
      const queryNum = Number(tourIdOrSlugOrTitle);

      // 1. Check in wishlistIds
      const foundInIds = wishlistIds.some((id) => {
        if (String(id).trim().toLowerCase() === queryStr) return true;
        if (!isNaN(queryNum) && Number(id) === queryNum) return true;
        return false;
      });
      if (foundInIds) return true;

      // 2. Comprehensive check in wishlistItems (id, slug, title, or name)
      return wishlistItems.some((item) => {
        if (String(item.id).trim().toLowerCase() === queryStr) return true;
        if (item.slug && String(item.slug).trim().toLowerCase() === queryStr) return true;
        if (item.title && String(item.title).trim().toLowerCase() === queryStr) return true;
        if (item.name && String(item.name).trim().toLowerCase() === queryStr) return true;
        if (!isNaN(queryNum) && Number(item.id) === queryNum) return true;
        return false;
      });
    },
    [wishlistIds, wishlistItems]
  );

  const addToWishlist = useCallback(
    async (
      tourIdOrSlugOrTitle: number | string,
      itemData?: Partial<WishlistItem>,
      moduleName?: string
    ) => {
      if (
        tourIdOrSlugOrTitle === undefined ||
        tourIdOrSlugOrTitle === null ||
        tourIdOrSlugOrTitle === ''
      ) {
        return;
      }

      const queryStr = String(tourIdOrSlugOrTitle).trim();
      const queryNum = Number(tourIdOrSlugOrTitle);
      const primaryId = !isNaN(queryNum) && String(queryNum) === queryStr ? queryNum : queryStr;

      const newItem: WishlistItem = {
        id: itemData?.id ?? primaryId,
        slug: itemData?.slug || (typeof primaryId === 'string' ? primaryId : undefined),
        title: itemData?.title || itemData?.name || String(primaryId),
        name: itemData?.name || itemData?.title || String(primaryId),
        description: itemData?.description || '',
        category: itemData?.category || (moduleName ? moduleName.toUpperCase() : 'TOURS'),
        price: itemData?.price || 0,
        originalPrice: itemData?.originalPrice,
        rating: itemData?.rating || 5.0,
        reviewCount: itemData?.reviewCount,
        image: itemData?.image || itemData?.imageUrl || '',
        imageUrl: itemData?.imageUrl || itemData?.image || '',
        duration: itemData?.duration,
        difficulty: itemData?.difficulty || 'Moderate',
        location: itemData?.location || itemData?.city || itemData?.country || '',
        city: itemData?.city,
        country: itemData?.country,
        module: moduleName || itemData?.module || 'tours',
        badge: itemData?.badge,
        stars: itemData?.stars,
        addedAt: Date.now(),
      };

      setWishlistIds((prevIds) => {
        const nextIds = Array.from(
          new Set([
            ...prevIds,
            primaryId,
            ...(itemData?.id !== undefined ? [itemData.id] : []),
            ...(itemData?.slug ? [itemData.slug] : []),
          ])
        );
        storeSetObject(storageKey, nextIds, currentSiteId).catch((err) =>
          console.warn('[WishlistContext] Failed to persist IDs:', err)
        );
        return nextIds;
      });

      setWishlistItems((prevItems) => {
        const qStr = queryStr.toLowerCase();
        const itemIdStr = itemData?.id !== undefined ? String(itemData.id).toLowerCase() : '';
        const itemSlugStr = itemData?.slug ? itemData.slug.toLowerCase() : '';
        const itemTitleStr = (itemData?.title || itemData?.name)
          ? String(itemData.title || itemData.name).toLowerCase()
          : '';

        const filtered = prevItems.filter((i) => {
          const sid = String(i.id).toLowerCase();
          const sslug = i.slug ? String(i.slug).toLowerCase() : '';
          const stitle = i.title ? String(i.title).toLowerCase() : '';
          const sname = i.name ? String(i.name).toLowerCase() : '';

          if (sid === qStr || (itemIdStr && sid === itemIdStr)) return false;
          if (sslug && (sslug === qStr || (itemSlugStr && sslug === itemSlugStr))) return false;
          if (stitle && (stitle === qStr || (itemTitleStr && stitle === itemTitleStr))) return false;
          if (sname && (sname === qStr || (itemTitleStr && sname === itemTitleStr))) return false;
          return true;
        });

        const nextItems = [...filtered, newItem];
        storeSetObject(storageKeyItems, nextItems, currentSiteId).catch((err) =>
          console.warn('[WishlistContext] Failed to persist Items:', err)
        );
        return nextItems;
      });
    },
    [storageKey, storageKeyItems, currentSiteId]
  );

  const removeFromWishlist = useCallback(
    async (tourIdOrSlugOrTitle: number | string) => {
      if (
        tourIdOrSlugOrTitle === undefined ||
        tourIdOrSlugOrTitle === null ||
        tourIdOrSlugOrTitle === ''
      ) {
        return;
      }
      const queryStr = String(tourIdOrSlugOrTitle).trim().toLowerCase();
      const queryNum = Number(tourIdOrSlugOrTitle);

      setWishlistItems((prevItems) => {
        // Find matching item to also purge its associated ID and slug
        const matched = prevItems.find((item) => {
          if (String(item.id).trim().toLowerCase() === queryStr) return true;
          if (item.slug && String(item.slug).trim().toLowerCase() === queryStr) return true;
          if (item.title && String(item.title).trim().toLowerCase() === queryStr) return true;
          if (item.name && String(item.name).trim().toLowerCase() === queryStr) return true;
          if (!isNaN(queryNum) && Number(item.id) === queryNum) return true;
          return false;
        });

        const matchedIdStr = matched ? String(matched.id).trim().toLowerCase() : queryStr;
        const matchedSlugStr = matched?.slug ? String(matched.slug).trim().toLowerCase() : '';
        const matchedTitleStr = (matched?.title || matched?.name)
          ? String(matched?.title || matched?.name).trim().toLowerCase()
          : '';

        const nextItems = prevItems.filter((item) => {
          const sId = String(item.id).trim().toLowerCase();
          const sSlug = item.slug ? String(item.slug).trim().toLowerCase() : '';
          const sTitle = item.title ? String(item.title).trim().toLowerCase() : '';
          const sName = item.name ? String(item.name).trim().toLowerCase() : '';

          if (
            sId === queryStr ||
            sId === matchedIdStr ||
            (sSlug && (sSlug === queryStr || sSlug === matchedSlugStr)) ||
            (sTitle && (sTitle === queryStr || sTitle === matchedTitleStr)) ||
            (sName && (sName === queryStr || sName === matchedTitleStr))
          ) {
            return false;
          }
          if (!isNaN(queryNum) && Number(item.id) === queryNum) return false;
          return true;
        });

        setWishlistIds((prevIds) => {
          const nextIds = prevIds.filter((id) => {
            const s = String(id).trim().toLowerCase();
            if (
              s === queryStr ||
              s === matchedIdStr ||
              (matchedSlugStr && s === matchedSlugStr) ||
              (matchedTitleStr && s === matchedTitleStr)
            ) {
              return false;
            }
            if (!isNaN(queryNum) && Number(id) === queryNum) return false;
            return true;
          });
          storeSetObject(storageKey, nextIds, currentSiteId).catch((err) =>
            console.warn('[WishlistContext] Failed to persist removal IDs:', err)
          );
          return nextIds;
        });

        storeSetObject(storageKeyItems, nextItems, currentSiteId).catch((err) =>
          console.warn('[WishlistContext] Failed to persist removal Items:', err)
        );
        return nextItems;
      });
    },
    [storageKey, storageKeyItems, currentSiteId]
  );

  const toggleWishlist = useCallback(
    async (
      tourIdOrSlugOrTitle: number | string,
      itemData?: Partial<WishlistItem>,
      moduleName?: string
    ) => {
      if (isWishlisted(tourIdOrSlugOrTitle)) {
        await removeFromWishlist(tourIdOrSlugOrTitle);
      } else {
        await addToWishlist(tourIdOrSlugOrTitle, itemData, moduleName);
      }
    },
    [isWishlisted, removeFromWishlist, addToWishlist]
  );

  const clearWishlist = useCallback(async () => {
    setWishlistIds([]);
    setWishlistItems([]);
    try {
      await storeRemove(storageKey, currentSiteId);
      await storeRemove(storageKeyItems, currentSiteId);
    } catch (err) {
      console.warn('[WishlistContext] Failed to clear wishlist:', err);
    }
  }, [storageKey, storageKeyItems, currentSiteId]);

  const totalCount = Math.max(wishlistIds.length, wishlistItems.length);

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistItems,
        wishlistCount: totalCount,
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

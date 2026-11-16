/**
 * hooks/useTabBadgeStatus.ts
 *
 * Tracks seen status for Bookings and Wishlist bottom tabs.
 *
 * Requirements:
 * - When a booking is created or tour is added to wishlist: Displays the numeric count badge.
 * - When the user visits/views the respective page: The count badge transitions to a single red indicator dot.
 * - Persisted per user and site tenant in local storage.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { useBooking } from '@/context/BookingContext';
import { useSelectedSite } from '@/hooks/useSelectedSite';
import { storeGetObject, storeSetObject } from '@/src/lib/storage';

export interface TabBadgeStatus {
  wishlistCount: number;
  upcomingCount: number;
  hasUnseenWishlist: boolean;
  showWishlistDot: boolean;
  hasUnseenBookings: boolean;
  showBookingDot: boolean;
  markTabSeen: (tab: 'wishlist' | 'bookings') => void;
}

export function useTabBadgeStatus(activeTabName?: string): TabBadgeStatus {
  const { user } = useAuth();
  const { wishlistCount } = useWishlist();
  const { upcomingCount } = useBooking();
  const { siteId } = useSelectedSite();

  const currentSiteId = siteId || 'gujjutours';

  const userKey = user?.id
    ? `user_${user.id}`
    : user?.email
    ? `user_${user.email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_')}`
    : 'guest';

  const [seenWishlistCount, setSeenWishlistCount] = useState<number>(0);
  const [seenBookingCount, setSeenBookingCount] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load persisted seen counts on mount or user/site change
  useEffect(() => {
    let cancelled = false;

    const loadSeen = async () => {
      try {
        const storedWishlist = await storeGetObject<number>(`seen_wishlist_${userKey}`, currentSiteId);
        const storedBookings = await storeGetObject<number>(`seen_bookings_${userKey}`, currentSiteId);
        if (!cancelled) {
          setSeenWishlistCount(typeof storedWishlist === 'number' ? storedWishlist : 0);
          setSeenBookingCount(typeof storedBookings === 'number' ? storedBookings : 0);
          setIsLoaded(true);
        }
      } catch {
        if (!cancelled) setIsLoaded(true);
      }
    };

    loadSeen();

    return () => {
      cancelled = true;
    };
  }, [userKey, currentSiteId]);

  // Mark a specific tab as seen
  const markTabSeen = useCallback(
    (tab: 'wishlist' | 'bookings') => {
      if (tab === 'wishlist') {
        setSeenWishlistCount(wishlistCount);
        void storeSetObject(`seen_wishlist_${userKey}`, wishlistCount, currentSiteId);
      } else if (tab === 'bookings') {
        setSeenBookingCount(upcomingCount);
        void storeSetObject(`seen_bookings_${userKey}`, upcomingCount, currentSiteId);
      }
    },
    [wishlistCount, upcomingCount, userKey, currentSiteId]
  );

  // Automatically mark as seen when user visits the tab
  useEffect(() => {
    if (!isLoaded) return;

    if (activeTabName === 'wishlist') {
      if (seenWishlistCount < wishlistCount) {
        markTabSeen('wishlist');
      }
    } else if (activeTabName === 'bookings') {
      if (seenBookingCount < upcomingCount) {
        markTabSeen('bookings');
      }
    }
  }, [activeTabName, isLoaded, wishlistCount, upcomingCount, seenWishlistCount, seenBookingCount, markTabSeen]);

  // Keep seen count from exceeding total if items are removed or cleared
  useEffect(() => {
    if (!isLoaded) return;

    if (wishlistCount < seenWishlistCount) {
      setSeenWishlistCount(wishlistCount);
      void storeSetObject(`seen_wishlist_${userKey}`, wishlistCount, currentSiteId);
    }
    if (upcomingCount < seenBookingCount) {
      setSeenBookingCount(upcomingCount);
      void storeSetObject(`seen_bookings_${userKey}`, upcomingCount, currentSiteId);
    }
  }, [wishlistCount, upcomingCount, isLoaded, seenWishlistCount, seenBookingCount, userKey, currentSiteId]);

  // If there are newly added items that haven't been seen, show the number count badge
  const hasUnseenWishlist = wishlistCount > seenWishlistCount;
  // If items exist and user has already seen them, show the single dot indicator
  const showWishlistDot = wishlistCount > 0 && !hasUnseenWishlist;

  const hasUnseenBookings = upcomingCount > seenBookingCount;
  const showBookingDot = upcomingCount > 0 && !hasUnseenBookings;

  return {
    wishlistCount,
    upcomingCount,
    hasUnseenWishlist,
    showWishlistDot,
    hasUnseenBookings,
    showBookingDot,
    markTabSeen,
  };
}

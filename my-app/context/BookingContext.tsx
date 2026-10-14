/**
 * context/BookingContext.tsx
 *
 * Booking context managing trip reservations across active websites.
 * Synchronizes with backend endpoints, tracks guest bookings locally,
 * supports user authentication association, and powers the Tab bar badge count.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Booking, BookingStatus } from '@/types';
import { useSelectedSite } from '@/hooks/useSelectedSite';
import { useAuth } from './AuthContext';
import {
  createBooking as apiCreateBooking,
  fetchBookings as apiFetchBookings,
  cancelBookingApi,
  setBookingsDebugState,
  type CreateBookingPayload,
} from '@/services/api';
import { storeGetObject, storeSetObject } from '@/src/lib/storage';

export interface GuestContact {
  email: string;
  phone?: string;
  name?: string;
}

export interface BookingContextType {
  bookings: Booking[];
  upcomingCount: number;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  addBooking: (payload: CreateBookingPayload) => Promise<Booking>;
  cancelBooking: (id: string) => Promise<Booking>;
  getBooking: (id: string) => Booking | undefined;
  refreshBookings: () => Promise<void>;
}

const BookingContext = createContext<BookingContextType>({
  bookings: [],
  upcomingCount: 0,
  isLoading: false,
  isError: false,
  error: null,
  addBooking: async () => {
    throw new Error('BookingProvider not mounted');
  },
  cancelBooking: async () => {
    throw new Error('BookingProvider not mounted');
  },
  getBooking: () => undefined,
  refreshBookings: async () => {},
});

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { siteId } = useSelectedSite();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rawId = String(siteId || '');
  const currentSiteId =
    rawId === 'website2' || rawId === 'tripgoasia'
      ? 'tripgoasia'
      : rawId === 'website3' || rawId === 'technoheaven'
      ? 'technoheaven'
      : 'gujjutours';
  const userIdentifier = user?.id || user?.email || 'guest';
  const cacheKey = `bookings.cache.${userIdentifier}`;

  // Helper to load stored guest IDs
  const getStoredGuestIds = useCallback(async (): Promise<string[]> => {
    try {
      const parsed = await storeGetObject<string[]>('bookings.guest_ids', currentSiteId);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Storage read failed
    }
    return [];
  }, [currentSiteId]);

  // Helper to load stored guest contact
  const getStoredGuestContact = useCallback(async (): Promise<GuestContact | null> => {
    try {
      return await storeGetObject<GuestContact>('bookings.guest_contact', currentSiteId);
    } catch {
      // Storage read failed
    }
    return null;
  }, [currentSiteId]);

  // Refresh bookings from API and synchronize local cache
  const refreshBookings = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      // 1. Initial hydration from offline cache
      const cached = await storeGetObject<Booking[]>(cacheKey, currentSiteId);
      if (Array.isArray(cached)) {
        setBookings(cached);
      }

      // 2. Fetch fresh bookings from backend
      let remoteBookings: Booking[] = [];
      const guestIds = await getStoredGuestIds();
      const guestContact = await getStoredGuestContact();

      const queryEmail = user?.email || guestContact?.email;

      // Unauthenticated guests without saved bookings don't query remote API (avoids 401)
      if (!user?.email && (!guestIds || guestIds.length === 0) && !queryEmail) {
        setBookings([]);
        await storeSetObject(cacheKey, [], currentSiteId);
        setBookingsDebugState({
          url: `/api/bookings (guest local: 0 items)`,
          status: 200,
          itemCount: 0,
          lastUpdated: Date.now(),
        });
        return;
      }

      const response = await apiFetchBookings(
        currentSiteId,
        queryEmail || undefined,
        guestIds.length > 0 ? guestIds : undefined
      );

      if (response && Array.isArray(response.data)) {
        remoteBookings = response.data;
        setBookings(remoteBookings);
        await storeSetObject(cacheKey, remoteBookings, currentSiteId);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch bookings';
      console.warn('[BookingContext] refreshBookings error:', message);
      setIsError(true);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [cacheKey, currentSiteId, getStoredGuestContact, getStoredGuestIds, user]);

  // Trigger refresh on site or auth changes
  useEffect(() => {
    refreshBookings();
  }, [refreshBookings]);

  // Add booking
  const addBooking = useCallback(
    async (payload: CreateBookingPayload): Promise<Booking> => {
      setIsLoading(true);
      try {
        const enrichedPayload: CreateBookingPayload = {
          ...payload,
          website: currentSiteId,
          websiteId: currentSiteId,
          userId: user?.id,
        };

        const createdBooking = await apiCreateBooking(enrichedPayload, currentSiteId);

        // If user is guest, persist booking ID and contact info for future tab listings
        if (!user) {
          const existingIds = await getStoredGuestIds();
          if (!existingIds.includes(createdBooking.id)) {
            const updatedIds = [createdBooking.id, ...existingIds];
            await storeSetObject('bookings.guest_ids', updatedIds, currentSiteId);
          }

          if (payload.email) {
            const contact: GuestContact = {
              email: payload.email,
              phone: payload.phone,
              name: payload.guestName || payload.name,
            };
            await storeSetObject('bookings.guest_contact', contact, currentSiteId);
          }
        }

        // Update in-memory state and cache
        setBookings((prev) => {
          const filtered = prev.filter((b) => b.id !== createdBooking.id);
          const next = [createdBooking, ...filtered];
          storeSetObject(cacheKey, next, currentSiteId).catch(() => {});
          return next;
        });

        // Invalidate React Query caches
        queryClient.invalidateQueries({ queryKey: ['bookings'] });

        return createdBooking;
      } finally {
        setIsLoading(false);
      }
    },
    [cacheKey, currentSiteId, getStoredGuestIds, queryClient, user]
  );

  // Cancel booking
  const cancelBooking = useCallback(
    async (id: string): Promise<Booking> => {
      setIsLoading(true);
      try {
        const guestContact = await getStoredGuestContact();
        const contactEmail = user?.email || guestContact?.email;

        const updated = await cancelBookingApi(id, contactEmail, currentSiteId);

        setBookings((prev) => {
          const mapped = prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' as BookingStatus } : b));
          storeSetObject(cacheKey, mapped, currentSiteId).catch(() => {});
          return mapped;
        });

        queryClient.invalidateQueries({ queryKey: ['bookings'] });
        return updated;
      } finally {
        setIsLoading(false);
      }
    },
    [cacheKey, currentSiteId, getStoredGuestContact, queryClient, user]
  );

  // Get booking by ID
  const getBooking = useCallback(
    (id: string): Booking | undefined => {
      return bookings.find((b) => b.id === id);
    },
    [bookings]
  );

  // Upcoming count for Tab Badge
  const upcomingCount = useMemo(() => {
    return bookings.filter((b) => {
      const st = (b.status || '').toLowerCase();
      return st === 'upcoming' || st === 'pending' || st === 'confirmed';
    }).length;
  }, [bookings]);

  return (
    <BookingContext.Provider
      value={{
        bookings,
        upcomingCount,
        isLoading,
        isError,
        error,
        addBooking,
        cancelBooking,
        getBooking,
        refreshBookings,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  return useContext(BookingContext);
}

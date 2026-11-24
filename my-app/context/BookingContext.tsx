/**
 * context/BookingContext.tsx
 *
 * Booking context managing trip reservations across active websites.
 * Synchronizes with backend endpoints, tracks guest bookings locally,
 * supports user authentication association, automatic guest claiming,
 * and powers the Tab bar badge count and dev banner diagnostics.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Booking, BookingStatus } from '@/types';
import { useSelectedSite } from '@/hooks/useSelectedSite';
import { useAuth } from './AuthContext';
import {
  createBooking as apiCreateBooking,
  fetchBookings as apiFetchBookings,
  claimGuestBookingsApi,
  cancelBookingApi,
  requestCancellationApi,
  lookupGuestBooking as apiLookupGuestBooking,
  setBookingsDebugState,
  type CreateBookingPayload,
} from '@/services/api';
import { storeGetObject, storeSetObject, migrateLegacyStorage } from '@/src/lib/storage';

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
  cancelBooking: (id: string, emailOverride?: string) => Promise<Booking>;
  requestCancellation: (id: string, reason: string, emailOverride?: string) => Promise<Booking>;
  getBooking: (id: string) => Booking | undefined;
  refreshBookings: (force?: boolean) => Promise<void>;
  claimGuestBookings: () => Promise<number>;
  lookupGuestBooking: (reference: string, email: string) => Promise<Booking>;
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
  requestCancellation: async () => {
    throw new Error('BookingProvider not mounted');
  },
  getBooking: () => undefined,
  refreshBookings: async () => { },
  claimGuestBookings: async () => 0,
  lookupGuestBooking: async () => {
    throw new Error('BookingProvider not mounted');
  },
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

  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);

  // Helper to load stored guest IDs and references
  const getStoredGuestRefs = useCallback(async (): Promise<string[]> => {
    try {
      // Check both guest_refs and guest_ids
      const refs = await storeGetObject<string[]>('bookings.guest_refs', currentSiteId);
      const ids = await storeGetObject<string[]>('bookings.guest_ids', currentSiteId);
      const combined = [...(Array.isArray(refs) ? refs : []), ...(Array.isArray(ids) ? ids : [])];
      return Array.from(new Set(combined.filter(Boolean)));
    } catch {
      return [];
    }
  }, [currentSiteId]);

  // Helper to load stored guest contact
  const getStoredGuestContact = useCallback(async (): Promise<GuestContact | null> => {
    try {
      return await storeGetObject<GuestContact>('bookings.guest_contact', currentSiteId);
    } catch {
      return null;
    }
  }, [currentSiteId]);

  // Claim guest bookings after registration or login
  const claimGuestBookings = useCallback(async (): Promise<number> => {
    if (!user) return 0;
    try {
      const storedRefs = await getStoredGuestRefs();
      // Only claim if there are actual local guest references to claim
      if (!storedRefs || storedRefs.length === 0) {
        return 0;
      }

      const guestContact = await getStoredGuestContact();
      const targetEmail = user.email || guestContact?.email;

      if (__DEV__) {
        console.log(`[DEBUG] [BOOKINGS-CLAIM] Linking guest bookings for user '${user.id}' (${targetEmail}). Refs:`, storedRefs);
      }

      const res = await claimGuestBookingsApi(storedRefs, targetEmail, currentSiteId);
      if (res.success && res.claimed > 0) {
        if (__DEV__) {
          console.log(`[DEBUG] [BOOKINGS-CLAIM] Successfully linked ${res.claimed} earlier bookings!`);
        }
        // Invalidate query caches
        queryClient.invalidateQueries({ queryKey: ['bookings'] });
      }
      return res.claimed;
    } catch (err: unknown) {
      if (__DEV__) {
        console.warn('[DEBUG] [BOOKINGS-CLAIM] Error claiming guest bookings:', err);
      }
      return 0;
    }
  }, [currentSiteId, getStoredGuestContact, getStoredGuestRefs, queryClient, user]);

  // Refresh bookings from API and synchronize local cache
  const refreshBookings = useCallback(async (force = false) => {
    const now = Date.now();
    if (isFetchingRef.current) return;
    if (!force && now - lastFetchTimeRef.current < 2000) return;
    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;

    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      // 1. Initial hydration from offline cache
      const cached = await storeGetObject<Booking[]>(cacheKey, currentSiteId);
      if (Array.isArray(cached) && cached.length > 0) {
        setBookings(cached);
      }

      // 2. Fetch fresh bookings from backend
      // When a user is logged in, query strictly by user.email to ensure user account isolation.
      // Guest refs are only queried when user is not logged in.
      const guestRefs = user ? [] : await getStoredGuestRefs();
      const guestContact = user ? null : await getStoredGuestContact();
      const queryEmail = user?.email || guestContact?.email;

      // Unauthenticated guests without saved bookings don't query remote API
      if (!user && guestRefs.length === 0 && !queryEmail) {
        setBookings([]);
        await storeSetObject(cacheKey, [], currentSiteId);
        setBookingsDebugState({
          url: `/api/bookings (guest: 0 saved items)`,
          status: 200,
          itemCount: 0,
          lastUpdated: Date.now(),
        });
        return;
      }

      if (__DEV__) {
        console.log(`[DEBUG] [BOOKING-QUERY] Fetching bookings for site '${currentSiteId}'. User: '${user?.email || 'guest'}', GuestRefs: [${guestRefs.join(', ')}]`);
      }

      const response = await apiFetchBookings(
        currentSiteId,
        queryEmail || undefined,
        guestRefs.length > 0 ? guestRefs : undefined
      );

      if (response && Array.isArray(response.data)) {
        const remoteBookings = response.data;

        // Deduplicate remoteBookings by unique id / reference to prevent duplicate cards
        const dedupedMap = new Map<string, (typeof remoteBookings)[0]>();
        for (const b of remoteBookings) {
          const key = b.id || b.reference;
          if (key && !dedupedMap.has(key)) {
            dedupedMap.set(key, b);
          }
        }
        const dedupedBookings = Array.from(dedupedMap.values());

        if (__DEV__) {
          console.log(`[DEBUG] [BOOKING-QUERY] Received ${remoteBookings.length} bookings (${dedupedBookings.length} unique) from backend.`);
        }

        setBookings(dedupedBookings);
        await storeSetObject(cacheKey, dedupedBookings, currentSiteId);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch bookings';
      console.warn('[BookingContext] refreshBookings error:', message);
      setIsError(true);
      setError(message);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, [cacheKey, currentSiteId, getStoredGuestContact, getStoredGuestRefs, user]);

  // Reset bookings in-memory immediately whenever active user or site changes to guarantee isolation
  useEffect(() => {
    setBookings([]);
  }, [userIdentifier, currentSiteId]);

  // Initial mount: run legacy storage migration and fetch bookings
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      await migrateLegacyStorage(currentSiteId);
      if (!cancelled) {
        // If logged in, claim any previously orphaned guest bookings
        if (user) {
          await claimGuestBookings();
          // After claiming, clear the guest refs so they don't linger for future guests/accounts
          await storeSetObject('bookings.guest_refs', [], currentSiteId);
          await storeSetObject('bookings.guest_ids', [], currentSiteId);
          await storeSetObject('bookings.guest_contact', null, currentSiteId);
        }
        await refreshBookings();
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, [claimGuestBookings, currentSiteId, refreshBookings, user]);

  // Add booking
  const addBooking = useCallback(
    async (payload: CreateBookingPayload): Promise<Booking> => {
      if (!user) {
        throw new Error('Please log in to your account to complete your booking. Guest checkout is not permitted.');
      }
      setIsLoading(true);
      try {
        const enrichedPayload: CreateBookingPayload = {
          ...payload,
          website: currentSiteId,
          websiteId: currentSiteId,
          userId: user?.id,
        };

        const createdBooking = await apiCreateBooking(enrichedPayload, currentSiteId);

        // If user is guest, persist booking ID, reference, and contact info
        if (!user) {
          const existingRefs = await getStoredGuestRefs();
          const validIdentifiers = [createdBooking.reference, createdBooking.id].filter(
            (val): val is string => typeof val === 'string' && val.trim().length > 0
          );
          const newIdentifiers = validIdentifiers.filter((val) => !existingRefs.includes(val));

          if (newIdentifiers.length > 0) {
            const updatedRefs = [...newIdentifiers, ...existingRefs];
            await storeSetObject('bookings.guest_refs', updatedRefs, currentSiteId);
            await storeSetObject('bookings.guest_ids', updatedRefs, currentSiteId);
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

        // Update in-memory state and cache immediately
        setBookings((prev) => {
          const filtered = prev.filter(
            (b) => b.id !== createdBooking.id && b.reference !== createdBooking.reference
          );
          const next = [createdBooking, ...filtered];
          storeSetObject(cacheKey, next, currentSiteId).catch(() => { });
          return next;
        });

        // Append instant booking confirmation alert to tenant notification inbox
        try {
          const bookingNotif = {
            id: `booking-${createdBooking.id}-${Date.now()}`,
            title: `🎟️ Booking Confirmed: ${createdBooking.tourName || 'Your Tour'}`,
            body: `Reservation #${createdBooking.reference || createdBooking.id} is confirmed. Departure date: ${createdBooking.startDate || createdBooking.travelDate || createdBooking.date || 'Upcoming'}. Tap to view your pass.`,
            type: 'booking',
            timestamp: new Date().toISOString(),
            read: false,
            data: {
              url: `/booking/${createdBooking.id}`,
              bookingId: createdBooking.id,
            },
          };
          const existingNotifs = (await storeGetObject<unknown[]>('app_notifications', currentSiteId)) || [];
          await storeSetObject('app_notifications', [bookingNotif, ...existingNotifs], currentSiteId);
        } catch { }

        // Invalidate React Query caches
        queryClient.invalidateQueries({ queryKey: ['bookings'] });

        return createdBooking;
      } finally {
        setIsLoading(false);
      }
    },
    [cacheKey, currentSiteId, getStoredGuestRefs, queryClient, user]
  );

  // Cancel booking
  const cancelBooking = useCallback(
    async (id: string, emailOverride?: string): Promise<Booking> => {
      setIsLoading(true);
      try {
        const guestContact = await getStoredGuestContact();
        const contactEmail = emailOverride || user?.email || guestContact?.email;

        const updated = await cancelBookingApi(id, contactEmail, currentSiteId);

        setBookings((prev) => {
          const mapped = prev.map((b) =>
            b.id === id || b.reference === id
              ? { ...b, status: 'cancelled' as BookingStatus }
              : b
          );
          storeSetObject(cacheKey, mapped, currentSiteId).catch(() => { });
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

  // Request cancellation with customer reason
  const requestCancellation = useCallback(
    async (id: string, reason: string, emailOverride?: string): Promise<Booking> => {
      setIsLoading(true);
      try {
        const guestContact = await getStoredGuestContact();
        const contactEmail = emailOverride || user?.email || guestContact?.email;

        const updated = await requestCancellationApi(id, reason, contactEmail, currentSiteId);

        setBookings((prev) => {
          const mapped = prev.map((b) =>
            b.id === id || b.reference === id
              ? {
                ...b,
                cancellationRequest: updated.cancellationRequest || {
                  requestedAt: new Date().toISOString(),
                  reason,
                  status: 'pending',
                },
              }
              : b
          );
          storeSetObject(cacheKey, mapped, currentSiteId).catch(() => { });
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

  // Lookup guest booking by Reference and Email
  const lookupGuestBooking = useCallback(
    async (reference: string, email: string): Promise<Booking> => {
      setIsLoading(true);
      setIsError(false);
      setError(null);
      try {
        const found = await apiLookupGuestBooking(reference, email, currentSiteId);

        // Store this reference so it stays in user's mobile list
        const existingRefs = await getStoredGuestRefs();
        const validIdentifiers = [found.reference, found.id].filter(
          (val): val is string => typeof val === 'string' && val.trim().length > 0
        );
        const newIdentifiers = validIdentifiers.filter((val) => !existingRefs.includes(val));
        if (newIdentifiers.length > 0) {
          const updatedRefs = [...newIdentifiers, ...existingRefs];
          await storeSetObject('bookings.guest_refs', updatedRefs, currentSiteId);
          await storeSetObject('bookings.guest_ids', updatedRefs, currentSiteId);
        }

        // Add or update in-memory state and cache
        setBookings((prev) => {
          const filtered = prev.filter(
            (b) => b.id !== found.id && b.reference !== found.reference
          );
          const next = [found, ...filtered];
          storeSetObject(cacheKey, next, currentSiteId).catch(() => { });
          return next;
        });

        queryClient.invalidateQueries({ queryKey: ['bookings'] });
        return found;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Reservation not found';
        setIsError(true);
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [cacheKey, currentSiteId, getStoredGuestRefs, queryClient]
  );

  // Get booking by ID or Reference
  const getBooking = useCallback(
    (idOrRef: string): Booking | undefined => {
      return bookings.find(
        (b) => b.id === idOrRef || b.reference === idOrRef
      );
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
        requestCancellation,
        getBooking,
        refreshBookings,
        claimGuestBookings,
        lookupGuestBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  return useContext(BookingContext);
}

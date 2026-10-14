/**
 * hooks/useBookings.ts
 *
 * TanStack Query hooks for fetching, creating, and cancelling bookings.
 * Scoped strictly to the active website hostname and site ID.
 * Enabled only after the site configuration and theme have loaded.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchBookings,
  fetchBooking,
  createBooking,
  cancelBookingApi,
  type CreateBookingPayload,
} from '@/services/api';
import { queryKeys } from '@/store/queryClient';
import { useSite } from '@/store/SiteConfigContext';
import type { Booking } from '@/types';

// ─── Fetch Bookings Hook ──────────────────────────────────────────────────────

export interface UseBookingsResult {
  bookings: Booking[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch bookings (optionally filtered by email and booking IDs).
 * Scoped to queryKeys.bookings(hostname, email).
 * Enabled only after site config has loaded.
 */
export function useBookings(email?: string, ids?: string[]): UseBookingsResult {
  const { isLoaded, hostname, siteId } = useSite();

  const query = useQuery<Booking[], Error>({
    queryKey: queryKeys.bookings(hostname, email),
    queryFn: async () => {
      const response = await fetchBookings(siteId, email, ids);
      return response.data;
    },
    enabled: isLoaded && !!hostname,
    staleTime: 2 * 60 * 1000,
  });

  return {
    bookings: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ?? null,
    refetch: query.refetch,
  };
}

// ─── Single Booking Detail Hook ───────────────────────────────────────────────

export interface UseBookingResult {
  booking: Booking | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useBooking(bookingId?: string): UseBookingResult {
  const { isLoaded, hostname, siteId } = useSite();

  const query = useQuery<Booking | null, Error>({
    queryKey: queryKeys.booking(hostname, bookingId),
    queryFn: async () => {
      if (!bookingId) return null;
      return await fetchBooking(bookingId, siteId);
    },
    enabled: isLoaded && !!hostname && !!bookingId,
    staleTime: 5 * 60 * 1000,
  });

  return {
    booking: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ?? null,
    refetch: query.refetch,
  };
}

// ─── Create Booking Mutation Hook ─────────────────────────────────────────────

export function useCreateBooking() {
  const queryClient = useQueryClient();
  const { hostname } = useSite();

  return useMutation({
    mutationFn: async (bookingData: CreateBookingPayload) => {
      return await createBooking(bookingData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['bookings', hostname],
      });
      queryClient.invalidateQueries({
        queryKey: ['bookings'],
      });
    },
  });
}

// ─── Cancel Booking Mutation Hook ─────────────────────────────────────────────

export function useCancelBooking() {
  const queryClient = useQueryClient();
  const { siteId } = useSite();

  return useMutation({
    mutationFn: async ({ id, email }: { id: string; email?: string }) => {
      return await cancelBookingApi(id, email, siteId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['bookings'],
      });
    },
  });
}

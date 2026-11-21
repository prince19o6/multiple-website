/**
 * web/lib/api/flights.ts
 *
 * Typed API client functions and interfaces for Flights module.
 */

import { api, type RequestOptions } from "./client";

export interface FlightAirport {
  code: string;
  name: string;
  city: string;
  country: string;
  terminal?: string;
}

export interface FlightItem {
  id: string;
  flightNumericId?: number;
  slug: string;
  flightNumber: string;
  airline: string;
  airlineCode?: string;
  airlineLogo?: string;
  fromAirport: FlightAirport;
  toAirport: FlightAirport;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  durationFormatted?: string;
  stops: number;
  stopAirports?: string[];
  cabinClass: string;
  availableSeats: number;
  price: number;
  currency: string;
  refundable?: boolean;
  baggageAllowance?: string;
  status?: string;
  rating?: number;
  reviews?: number;
}

export interface FlightSearchParams {
  from?: string;
  to?: string;
  date?: string;
  pax?: number;
  cabinClass?: string;
  airline?: string;
  stops?: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  pageSize?: number;
  siteId?: string;
}

export interface FlightPagedResponse {
  items: FlightItem[];
  total: number;
  page: number;
  pageSize: number;
}

export async function searchFlights(
  params?: FlightSearchParams,
  options?: RequestOptions
): Promise<FlightPagedResponse> {
  const queryParams: Record<string, any> = {
    from: params?.from,
    to: params?.to,
    date: params?.date,
    pax: params?.pax,
    cabinClass: params?.cabinClass,
    airline: params?.airline,
    stops: params?.stops,
    search: params?.search,
    category: params?.category,
    minPrice: params?.minPrice,
    maxPrice: params?.maxPrice,
    sort: params?.sort,
    page: params?.page ?? 1,
    pageSize: params?.pageSize ?? 10,
  };

  const res = await api.get<any>("/api/flights/search", {
    ...options,
    siteId: params?.siteId ?? options?.siteId,
    params: queryParams,
  });

  const items = res?.items ?? res?.data ?? [];
  const total = res?.total ?? res?.meta?.total ?? items.length;
  const page = res?.page ?? res?.meta?.page ?? (params?.page ?? 1);
  const pageSize = res?.pageSize ?? res?.meta?.pageSize ?? (params?.pageSize ?? 10);

  return {
    items,
    total,
    page,
    pageSize,
  };
}

export async function getFlights(
  params?: FlightSearchParams,
  options?: RequestOptions
): Promise<FlightPagedResponse> {
  const queryParams: Record<string, any> = {
    search: params?.search,
    from: params?.from,
    to: params?.to,
    date: params?.date,
    cabinClass: params?.cabinClass,
    airline: params?.airline,
    minPrice: params?.minPrice,
    maxPrice: params?.maxPrice,
    sort: params?.sort,
    page: params?.page ?? 1,
    pageSize: params?.pageSize ?? 10,
  };

  const res = await api.get<any>("/api/flights", {
    ...options,
    siteId: params?.siteId ?? options?.siteId,
    params: queryParams,
  });

  const items = res?.items ?? res?.data ?? [];
  const total = res?.total ?? res?.meta?.total ?? items.length;
  const page = res?.page ?? res?.meta?.page ?? (params?.page ?? 1);
  const pageSize = res?.pageSize ?? res?.meta?.pageSize ?? (params?.pageSize ?? 10);

  return {
    items,
    total,
    page,
    pageSize,
  };
}

export async function getFlightBySlug(
  idOrSlug: string,
  options?: RequestOptions
): Promise<FlightItem> {
  const res = await api.get<any>(`/api/flights/${encodeURIComponent(idOrSlug)}`, options);
  return res?.data ?? res;
}

export async function getFlightAirports(
  options?: RequestOptions
): Promise<FlightAirport[]> {
  const res = await api.get<any>("/api/flights/airports", options);
  return res?.data ?? res?.items ?? (Array.isArray(res) ? res : []);
}

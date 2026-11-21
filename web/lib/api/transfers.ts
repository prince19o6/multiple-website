/**
 * web/lib/api/transfers.ts
 *
 * Typed API client functions and interfaces for Transfers & Cabs module.
 */

import { api, type RequestOptions } from "./client";

export interface CabFleetItem {
  id: string;
  name: string;
  category: "Sedan" | "SUV" | "Luxury" | "Tempo Traveller" | string;
  rateMultiplier: number;
  capacityPassengers: number;
  capacityLuggage: number;
  sampleModels: string[];
  features: string[];
  image: string;
}

export interface TransferRouteItem {
  id: string;
  transferNumericId?: number;
  slug: string;
  title?: string;
  pickupLocation: string;
  dropoffLocation: string;
  distanceKm: number;
  estimatedMinutes: number;
  vehicleType: string;
  capacityPassengers: number;
  capacityLuggage: number;
  price: number;
  currency: string;
  includesTolls?: boolean;
  includesMeetAndGreet?: boolean;
  freeCancellationHours?: number;
  images?: string[];
  image?: string;
  description?: string;
  rating?: number;
  reviews?: number;
  fleetOptions?: Array<{
    vehicleType: string;
    price: number;
    multiplier: number;
    capacity: number;
  }>;
}

export interface TransferFilterParams {
  from?: string;
  to?: string;
  vehicleType?: string;
  cabType?: string;
  passengers?: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  pageSize?: number;
  siteId?: string;
}

export interface TransferPagedResponse {
  items: TransferRouteItem[];
  total: number;
  page: number;
  pageSize: number;
  fleet?: CabFleetItem[];
}

export async function getTransfers(
  params?: TransferFilterParams,
  options?: RequestOptions
): Promise<TransferPagedResponse> {
  const queryParams: Record<string, any> = {
    from: params?.from,
    to: params?.to,
    vehicleType: params?.vehicleType ?? params?.cabType,
    passengers: params?.passengers,
    search: params?.search,
    category: params?.category,
    minPrice: params?.minPrice,
    maxPrice: params?.maxPrice,
    sort: params?.sort,
    page: params?.page ?? 1,
    pageSize: params?.pageSize ?? 12,
  };

  const res = await api.get<any>("/api/transfers", {
    ...options,
    siteId: params?.siteId ?? options?.siteId,
    params: queryParams,
  });

  const items = res?.items ?? res?.data ?? [];
  const total = res?.total ?? res?.meta?.total ?? items.length;
  const page = res?.page ?? res?.meta?.page ?? (params?.page ?? 1);
  const pageSize = res?.pageSize ?? res?.meta?.pageSize ?? (params?.pageSize ?? 12);
  const fleet = res?.fleet;

  return {
    items,
    total,
    page,
    pageSize,
    fleet,
  };
}

export async function getTransferBySlug(
  idOrSlug: string,
  options?: RequestOptions
): Promise<TransferRouteItem> {
  const res = await api.get<any>(`/api/transfers/${encodeURIComponent(idOrSlug)}`, options);
  return res?.data ?? res;
}

export async function getCabFleet(
  options?: RequestOptions
): Promise<CabFleetItem[]> {
  const res = await api.get<any>("/api/transfers/fleet", options);
  return res?.fleet ?? res?.data ?? res?.items ?? [];
}

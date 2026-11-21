/**
 * web/lib/api/hotels.ts
 *
 * Typed API client functions and interfaces for Hotels module.
 */

import { api, type RequestOptions } from "./client";

export interface HotelRoom {
  roomType: string;
  name: string;
  pricePerNight: number;
  capacityAdults: number;
  capacityChildren: number;
  amenities?: string[];
  availableUnits?: number;
  description?: string;
  images?: string[];
}

export interface HotelItem {
  id: string;
  hotelNumericId?: number;
  slug: string;
  title: string;
  name?: string;
  description: string;
  starRating: number;
  rating?: number;
  reviews?: number;
  reviewsCount?: number;
  destination: {
    cityName: string;
    country: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  amenities: string[];
  images: string[];
  image?: string;
  rooms: HotelRoom[];
  featured?: boolean;
  currency: string;
  price?: number;
  status?: string;
}

export interface HotelFilterParams {
  destination?: string;
  search?: string;
  category?: string;
  starRating?: number;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
  siteId?: string;
}

export interface HotelPagedResponse {
  items: HotelItem[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getHotels(
  params?: HotelFilterParams,
  options?: RequestOptions
): Promise<HotelPagedResponse> {
  const queryParams: Record<string, any> = {
    destination: params?.destination,
    search: params?.search,
    category: params?.category,
    starRating: params?.starRating,
    minPrice: params?.minPrice,
    maxPrice: params?.maxPrice,
    amenities: params?.amenities,
    sort: params?.sort,
    page: params?.page ?? 1,
    pageSize: params?.pageSize ?? 12,
  };

  const res = await api.get<any>("/api/hotels", {
    ...options,
    siteId: params?.siteId ?? options?.siteId,
    params: queryParams,
  });

  const items = res?.items ?? res?.data ?? [];
  const total = res?.total ?? res?.meta?.total ?? items.length;
  const page = res?.page ?? res?.meta?.page ?? (params?.page ?? 1);
  const pageSize = res?.pageSize ?? res?.meta?.pageSize ?? (params?.pageSize ?? 12);

  return {
    items,
    total,
    page,
    pageSize,
  };
}

export async function getHotelBySlug(
  idOrSlug: string,
  options?: RequestOptions
): Promise<HotelItem> {
  const res = await api.get<any>(`/api/hotels/${encodeURIComponent(idOrSlug)}`, options);
  return res?.data ?? res;
}

export async function getHotelDestinations(
  options?: RequestOptions
): Promise<Array<{ city: string; country: string; count: number; image: string }>> {
  const res = await api.get<any>("/api/hotels/destinations", options);
  return res?.data ?? res?.items ?? (Array.isArray(res) ? res : []);
}

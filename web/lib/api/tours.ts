/**
 * web/lib/api/tours.ts
 *
 * Typed API client functions and interfaces for Tours module.
 */

import { api, type RequestOptions } from "./client";

export interface TourItem {
  id: string | number;
  slug: string;
  title: string;
  name?: string;
  description?: string;
  image?: string;
  images?: string[];
  gallery?: string[];
  price: number;
  originalPrice?: number;
  currency?: string;
  rating?: number;
  reviews?: number;
  duration?: string;
  location?: string;
  destination?: string;
  country?: string;
  category?: string;
  categorySlug?: string;
  groupSize?: string;
  highlights?: string[];
  itinerary?: Array<{
    day?: number;
    title?: string;
    description?: string;
  }>;
  inclusions?: string[];
  exclusions?: string[];
  included?: string[];
  excluded?: string[];
  featured?: boolean;
  isActive?: boolean;
}

export interface TourCategory {
  id?: string;
  name: string;
  slug: string;
  count?: number;
  image?: string;
  description?: string;
}

export interface TourFilterParams {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  pageSize?: number;
  siteId?: string;
}

export interface TourPagedResponse {
  items: TourItem[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getTours(
  params?: TourFilterParams,
  options?: RequestOptions
): Promise<TourPagedResponse> {
  const queryParams: Record<string, any> = {
    search: params?.search,
    category: params?.category,
    minPrice: params?.minPrice,
    maxPrice: params?.maxPrice,
    sort: params?.sort,
    page: params?.page ?? 1,
    pageSize: params?.pageSize ?? 12,
  };

  const res = await api.get<any>("/api/tours", {
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

export async function getTourBySlug(
  idOrSlug: string,
  options?: RequestOptions
): Promise<TourItem> {
  const res = await api.get<any>(`/api/tours/${encodeURIComponent(idOrSlug)}`, options);
  return res?.data ?? res;
}

export async function getTourCategories(
  options?: RequestOptions
): Promise<TourCategory[]> {
  const res = await api.get<any>("/api/tours/categories", options);
  return res?.data ?? res?.items ?? (Array.isArray(res) ? res : []);
}

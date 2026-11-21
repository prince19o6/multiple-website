/**
 * web/lib/api/restaurants.ts
 *
 * Typed API client functions and interfaces for Dining & Restaurants module.
 */

import { api, type RequestOptions } from "./client";

export interface RestaurantItem {
  id: string;
  restaurantNumericId?: number;
  slug: string;
  title: string;
  name?: string;
  description: string;
  city: string;
  country: string;
  address: string;
  cuisine: string;
  cuisines?: string[];
  priceRange?: string; // "$" | "$$" | "$$$" | "$$$$"
  averageCostForTwo?: number;
  currency: string;
  rating: number;
  reviews?: number;
  reviewsCount?: number;
  images: string[];
  image?: string;
  pureVeg?: boolean;
  jainAvailable?: boolean;
  halalCertified?: boolean;
  operatingHours?: string;
  features?: string[];
  signatureDishes?: string[];
  contactPhone?: string;
  status?: string;
}

export interface RestaurantFilterParams {
  search?: string;
  query?: string;
  city?: string;
  cuisine?: string;
  category?: string;
  pureVeg?: boolean;
  jain?: boolean;
  halal?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  pageSize?: number;
  siteId?: string;
}

export interface RestaurantPagedResponse {
  items: RestaurantItem[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getRestaurants(
  params?: RestaurantFilterParams,
  options?: RequestOptions
): Promise<RestaurantPagedResponse> {
  const queryParams: Record<string, any> = {
    search: params?.search ?? params?.query,
    city: params?.city,
    cuisine: params?.cuisine ?? params?.category,
    pureVeg: params?.pureVeg,
    jain: params?.jain,
    halal: params?.halal,
    minPrice: params?.minPrice,
    maxPrice: params?.maxPrice,
    sort: params?.sort,
    page: params?.page ?? 1,
    pageSize: params?.pageSize ?? 12,
  };

  const res = await api.get<any>("/api/restaurants", {
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

export async function getRestaurantBySlug(
  idOrSlug: string,
  options?: RequestOptions
): Promise<RestaurantItem> {
  const res = await api.get<any>(`/api/restaurants/${encodeURIComponent(idOrSlug)}`, options);
  if (Array.isArray(res)) {
    const clean = idOrSlug.toLowerCase().trim();
    return res.find((r: any) => r?.slug?.toLowerCase() === clean || r?.id?.toString() === clean) || res[0];
  }
  if (res?.data) {
    if (Array.isArray(res.data)) {
      const clean = idOrSlug.toLowerCase().trim();
      return res.data.find((r: any) => r?.slug?.toLowerCase() === clean || r?.id?.toString() === clean) || res.data[0];
    }
    return res.data;
  }
  if (res?.items && Array.isArray(res.items)) {
    const clean = idOrSlug.toLowerCase().trim();
    return res.items.find((r: any) => r?.slug?.toLowerCase() === clean || r?.id?.toString() === clean) || res.items[0];
  }
  return res;
}

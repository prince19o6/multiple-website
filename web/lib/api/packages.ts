/**
 * web/lib/api/packages.ts
 *
 * Typed API client functions and interfaces for Packages & Holidays module.
 */

import { api, type RequestOptions } from "./client";

export interface PackageDayPlan {
  day: number;
  title: string;
  description: string;
  mealsIncluded?: string[];
  hotelStay?: string;
  activities?: string[];
}

export interface PackageHotelPlan {
  city: string;
  hotelName: string;
  starRating: number;
  roomType: string;
  nights: number;
}

export interface PackageItem {
  id: string;
  packageNumericId?: number;
  slug: string;
  title: string;
  name?: string;
  description: string;
  destination: string;
  country: string;
  category: string;
  duration: string;
  durationDays: number;
  durationNights: number;
  price: number;
  originalPrice?: number;
  currency: string;
  rating: number;
  reviews?: number;
  reviewsCount?: number;
  images: string[];
  image?: string;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  pureVegAvailable?: boolean;
  jainMealAvailable?: boolean;
  itinerary: PackageDayPlan[];
  hotels: PackageHotelPlan[];
  status?: string;
}

export interface PackageFilterParams {
  destination?: string;
  search?: string;
  category?: string;
  durationDays?: number;
  minPrice?: number;
  maxPrice?: number;
  pureVeg?: boolean;
  jain?: boolean;
  sort?: string;
  page?: number;
  pageSize?: number;
  siteId?: string;
}

export interface PackagePagedResponse {
  items: PackageItem[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getPackages(
  params?: PackageFilterParams,
  options?: RequestOptions
): Promise<PackagePagedResponse> {
  const queryParams: Record<string, any> = {
    destination: params?.destination,
    search: params?.search,
    category: params?.category,
    durationDays: params?.durationDays,
    minPrice: params?.minPrice,
    maxPrice: params?.maxPrice,
    pureVeg: params?.pureVeg,
    jain: params?.jain,
    sort: params?.sort,
    page: params?.page ?? 1,
    pageSize: params?.pageSize ?? 12,
  };

  const res = await api.get<any>("/api/packages", {
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

export async function getPackageBySlug(
  idOrSlug: string,
  options?: RequestOptions
): Promise<PackageItem> {
  const res = await api.get<any>(`/api/packages/${encodeURIComponent(idOrSlug)}`, options);
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

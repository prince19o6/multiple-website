/**
 * web/lib/api/activities.ts
 *
 * Typed API client functions and interfaces for Activities module.
 */

import { api, type RequestOptions } from "./client";

export interface ActivityItem {
  id: string | number;
  activityNumericId?: number;
  slug: string;
  title: string;
  name?: string;
  description: string;
  category: string;
  categorySlug?: string;
  destination: string;
  location: string;
  country: string;
  city?: string;
  price: number;
  originalPrice?: number;
  currency: string;
  rating: number;
  reviews?: number;
  reviewCount?: number;
  duration: string;
  groupSize?: string;
  images: string[];
  image?: string;
  highlights: string[];
  itinerary?: Array<{
    title?: string;
    description?: string;
  }>;
  inclusions?: string[];
  exclusions?: string[];
  included?: string[];
  excluded?: string[];
  isActive?: boolean;
}

export interface ActivityFilterParams {
  search?: string;
  category?: string;
  destination?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  pageSize?: number;
  siteId?: string;
}

export interface ActivityPagedResponse {
  items: ActivityItem[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getActivities(
  params?: ActivityFilterParams,
  options?: RequestOptions
): Promise<ActivityPagedResponse> {
  const queryParams: Record<string, any> = {
    search: params?.search,
    category: params?.category,
    destination: params?.destination,
    minPrice: params?.minPrice,
    maxPrice: params?.maxPrice,
    sort: params?.sort,
    page: params?.page ?? 1,
    pageSize: params?.pageSize ?? 12,
  };

  const res = await api.get<any>("/api/activities", {
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

export async function getActivityBySlug(
  idOrSlug: string,
  options?: RequestOptions
): Promise<ActivityItem> {
  const res = await api.get<any>(`/api/activities/${encodeURIComponent(idOrSlug)}`, options);
  return res?.data ?? res;
}

export async function getActivityCategories(
  options?: RequestOptions
): Promise<Array<{ name: string; slug: string; count?: number }>> {
  const res = await api.get<any>("/api/activities/categories", options);
  return res?.data ?? res?.items ?? (Array.isArray(res) ? res : []);
}

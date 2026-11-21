/**
 * web/lib/api/visas.ts
 *
 * Typed API client functions and interfaces for Visa module.
 */

import { api, type RequestOptions } from "./client";

export interface VisaItem {
  id: string;
  visaNumericId?: number;
  slug: string;
  country: string;
  countryCode: string;
  countrySlug: string;
  flag?: string;
  continent?: string;
  title: string;
  subtitle?: string;
  description?: string;
  visaType: string;
  entryType?: string;
  validityDays?: number;
  stayDurationDays?: number;
  processingTimeDays?: number;
  price: number;
  originalPrice?: number;
  currency: string;
  governmentFee?: number;
  serviceFee?: number;
  approvalRate?: number;
  requirements?: string[];
  documentsRequired?: string[];
  steps?: Array<{
    stepNumber: number;
    title: string;
    description: string;
  }>;
  images?: string[];
  image?: string;
  status?: string;
  rating?: number;
  reviews?: number;
}

export interface CountryVisaSummary {
  country: string;
  countryCode: string;
  countrySlug: string;
  flag: string;
  continent: string;
  startingPrice: number;
  currency: string;
  approvalRate: number;
  totalOptions: number;
  sampleImage: string;
}

export interface VisaFilterParams {
  country?: string;
  countryCode?: string;
  visaType?: string;
  continent?: string;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  pageSize?: number;
  siteId?: string;
}

export interface VisaPagedResponse {
  items: VisaItem[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getVisas(
  params?: VisaFilterParams,
  options?: RequestOptions
): Promise<VisaPagedResponse> {
  const queryParams: Record<string, any> = {
    search: params?.search,
    category: params?.category,
    country: params?.country,
    countryCode: params?.countryCode,
    visaType: params?.visaType,
    continent: params?.continent,
    minPrice: params?.minPrice,
    maxPrice: params?.maxPrice,
    sort: params?.sort,
    page: params?.page ?? 1,
    pageSize: params?.pageSize ?? 20,
  };

  const res = await api.get<any>("/api/visas", {
    ...options,
    siteId: params?.siteId ?? options?.siteId,
    params: queryParams,
  });

  const items = res?.items ?? res?.data ?? [];
  const total = res?.total ?? res?.meta?.total ?? items.length;
  const page = res?.page ?? res?.meta?.page ?? (params?.page ?? 1);
  const pageSize = res?.pageSize ?? res?.meta?.pageSize ?? (params?.pageSize ?? 20);

  return {
    items,
    total,
    page,
    pageSize,
  };
}

export async function getCountryVisaSummaries(
  options?: RequestOptions
): Promise<CountryVisaSummary[]> {
  const res = await api.get<any>("/api/visas/countries", options);
  return res?.data ?? res?.items ?? (Array.isArray(res) ? res : []);
}

export async function getVisasByCountry(
  countrySlug: string,
  options?: RequestOptions
): Promise<VisaItem[]> {
  const res = await api.get<any>(`/api/visas/country/${encodeURIComponent(countrySlug)}`, options);
  return res?.data ?? res?.items ?? (Array.isArray(res) ? res : []);
}

export async function getVisaBySlug(
  slugOrCountry: string,
  options?: RequestOptions
): Promise<VisaItem | { isCountry: boolean; country: any; data: VisaItem[] }> {
  const res = await api.get<any>(`/api/visas/${encodeURIComponent(slugOrCountry)}`, options);
  return res?.data ?? res;
}

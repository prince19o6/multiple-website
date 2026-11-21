/**
 * web/lib/api/home.ts
 *
 * Typed API client functions and interfaces for Aggregated Home and Landing pages.
 */

import { api, type RequestOptions } from "./client";

export interface HomeHero {
  title: string;
  subtitle: string;
  badge?: string;
  searchPlaceholder?: string;
  backgroundImage?: string;
  activeModule?: string;
}

export interface HomeCategoryItem {
  id?: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  count?: number;
  description?: string;
}

export interface HomeDestinationItem {
  id?: string;
  name: string;
  city?: string;
  country?: string;
  image: string;
  tours?: number;
  count?: number;
  badge?: string;
}

export interface HomeSpecialOffer {
  id?: string;
  code: string;
  title: string;
  subtitle?: string;
  discountPercent?: number;
  discountAmount?: number;
  expiryDate?: string;
  bannerImage?: string;
  badge?: string;
}

export interface HomePayload {
  success?: boolean;
  site: string;
  module: string;
  hero?: HomeHero;
  featured: any[];
  trending?: any[];
  offers?: HomeSpecialOffer[];
  categories?: HomeCategoryItem[];
  destinations?: HomeDestinationItem[];
  banners?: any[];
  stats?: Array<{ label: string; value: string }>;
  faqs?: Array<{ question: string; answer: string }>;
  reviews?: any[];
}

export interface HomeQueryParams {
  module?: string;
  site?: string;
}

export async function getHomeData(
  params?: HomeQueryParams,
  options?: RequestOptions
): Promise<HomePayload> {
  const queryParams: Record<string, any> = {
    module: params?.module ?? "hotels",
    site: params?.site,
  };

  const res = await api.get<any>("/api/home", {
    ...options,
    siteId: params?.site ?? options?.siteId,
    params: queryParams,
  });

  const payload = res?.data ?? res;
  if (payload && Array.isArray(payload.categories)) {
    payload.categories = payload.categories.map((c: any) => {
      const resolvedName =
        typeof c.name === "object" && c.name !== null
          ? c.name.en || c.name.gu || c.name.ms || Object.values(c.name)[0] || c.slug || "Category"
          : c.name || c.title || c.label || c.slug || "Category";
      return {
        ...c,
        name: resolvedName,
        label: resolvedName,
      };
    });
  }
  return payload;
}

export async function getDestinations(
  params?: { search?: string; category?: string; page?: number; pageSize?: number },
  options?: RequestOptions
): Promise<{ items: HomeDestinationItem[]; total: number; page: number; pageSize: number }> {
  const res = await api.get<any>("/api/destinations", {
    ...options,
    params: {
      search: params?.search,
      category: params?.category,
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? 50,
    },
  });

  const items = res?.items ?? res?.data ?? [];
  const total = res?.total ?? res?.count ?? items.length;
  const page = res?.page ?? 1;
  const pageSize = res?.pageSize ?? 50;

  return { items, total, page, pageSize };
}

export async function getCategoriesByModule(
  module: string,
  options?: RequestOptions
): Promise<HomeCategoryItem[]> {
  const res = await api.get<any>("/api/categories", {
    ...options,
    params: { module },
  });

  return res?.items ?? res?.data ?? (Array.isArray(res) ? res : []);
}

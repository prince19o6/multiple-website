/**
 * lib/api.ts
 *
 * UNIFIED SERVER-SIDE API CLIENT FOR MULTI-TENANT TRAVEL PLATFORM.
 * Used by all Server Components, Route Handlers, and Server Actions.
 *
 * Architecture Guarantees:
 * - NO mutable module-level state (eliminates cross-tenant race conditions).
 * - Driven strictly by the per-request resolved SiteDefinition.
 * - Injects X-Website-Hostname matching backend WebsiteRegistry.cs.
 * - All Next.js fetch cache tags are isolated by site.siteId.
 * - Typed errors, timeout handling, and bounded retries.
 * - Zero `any`.
 */

import { headers as nextHeaders } from "next/headers";
import { ENV } from "@/lib/env";
import {
  getSiteById,
  resolveSiteFromHost,
  type SiteDefinition,
  type SiteId,
} from "@/lib/siteRegistry";
import type { Tour } from "@/lib/type";
import type { DestinationItem } from "@/lib/componentRegistry";
import type { SiteConfigResult, SiteConfigResponse } from "@/lib/siteConfig";

// ─── Typed Errors ─────────────────────────────────────────────────────────────

export type ApiErrorType = "network" | "client" | "server" | "timeout" | "json";

export class ApiError extends Error {
  readonly type: ApiErrorType;
  readonly status: number;
  readonly url: string;
  readonly details?: unknown;

  constructor(
    message: string,
    type: ApiErrorType = "network",
    status: number = 0,
    url: string = "",
    details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.type = type;
    this.status = status;
    this.url = url;
    this.details = details;
  }
}

// ─── Booking Types ────────────────────────────────────────────────────────────

export interface Booking {
  id: string;
  website: string;
  tourId: number | string;
  tourName: string;
  totalPrice: number;
  guestName: string;
  email: string;
  phone: string;
  travelers: number;
  startDate: string;
  endDate: string;
  status?: string;
  reference?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  paymentReference?: string;
  paidAt?: string;
  createdAt?: string;
  tourImage?: string;
  location?: string;
  currency?: string;
}

export interface CreateBookingPayload {
  website?: string;
  tourId: number | string;
  tourName: string;
  totalPrice: number;
  guestName: string;
  email: string;
  phone: string;
  travelers: number;
  startDate: string;
  endDate: string;
  paymentMethod?: string;
  paymentStatus?: string;
  paymentReference?: string;
}

export interface ApiHealthResult {
  host: string;
  siteId: string;
  backendHostname: string;
  apiUrl: string;
  status: number;
  configOk: boolean;
  toursOk: boolean;
  latencyMs: number;
  tourCount: number;
  brandName: string;
  firstItem?: string;
  toursUrl?: string;
  resolvedWebsite?: string;
  resolvedDatabase?: string;
  resolvedHostname?: string;
  dataSource: "mongodb" | "seed-fallback" | "unknown";
  error?: string;
}

// ─── Site Resolution Helper ───────────────────────────────────────────────────

export async function resolveSite(
  siteOrHost?: SiteDefinition | SiteId | string | null
): Promise<SiteDefinition> {
  if (siteOrHost && typeof siteOrHost === "object" && "siteId" in siteOrHost) {
    return siteOrHost;
  }

  if (typeof siteOrHost === "string") {
    const byId = getSiteById(siteOrHost);
    if (byId) return byId;
    const byHost = resolveSiteFromHost(siteOrHost);
    if (byHost) return byHost;
  }

  // Attempt reading from current request headers
  try {
    const h = await nextHeaders();
    const siteIdHeader = h.get("x-site-id");
    if (siteIdHeader) {
      const byId = getSiteById(siteIdHeader);
      if (byId) return byId;
    }

    const hostHeader = h.get("x-forwarded-host") || h.get("host");
    const byHost = resolveSiteFromHost(hostHeader);
    if (byHost) return byHost;
  } catch {
    // headers() might be called outside request context (e.g. static generation)
  }

  // Fallback to defaultSiteId if configured in env
  if (ENV.defaultSiteId) {
    const def = getSiteById(ENV.defaultSiteId);
    if (def) return def;
  }

  // Fail fast: No default site
  throw new ApiError(
    "Cannot execute API request: Unable to resolve active website from context or host header.",
    "client",
    400
  );
}

// ─── Normalizers ──────────────────────────────────────────────────────────────

function normalizeImageUrl(url?: string | null): string {
  if (!url || typeof url !== "string") {
    return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80";
  }
  const clean = url.trim();
  if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("data:")) {
    return clean;
  }
  if (clean.startsWith("/")) {
    return `${ENV.apiUrl}${clean}`;
  }
  return `${ENV.apiUrl}/${clean}`;
}

export function normalizeTour(raw: Record<string, unknown>, backendHostname?: string): Tour {
  const id = String(raw.id ?? raw._id ?? raw.tourNumericId ?? Math.random().toString(36).slice(2));
  const numericId = typeof raw.tourNumericId === "number" ? raw.tourNumericId : (parseInt(id, 10) || 1);
  const name = String(raw.name ?? raw.title ?? "Tour Package");
  const price = typeof raw.price === "number" ? raw.price : (parseFloat(String(raw.price ?? 0)) || 0);

  let rawImages: string[] = [];
  if (Array.isArray(raw.gallery)) {
    rawImages = raw.gallery.map((x) => String(x));
  } else if (Array.isArray(raw.images)) {
    rawImages = raw.images.map((x) => String(x));
  } else if (raw.image) {
    rawImages = [String(raw.image)];
  }

  const gallery = rawImages.length > 0
    ? rawImages.map(normalizeImageUrl)
    : [normalizeImageUrl(raw.image as string)];

  const itinerary: { day: number; title: string; description: string }[] = Array.isArray(raw.itinerary)
    ? (raw.itinerary as Record<string, unknown>[]).map((item, idx) => ({
        day: typeof item.day === "number" ? item.day : idx + 1,
        title: String(item.title ?? `Day ${idx + 1}`),
        description: String(item.description ?? ""),
      }))
    : [];

  const guestReviews: { author: string; rating: number; text: string }[] = Array.isArray(raw.guestReviews)
    ? (raw.guestReviews as Record<string, unknown>[]).map((item) => ({
        author: String(item.author ?? "Traveler"),
        rating: typeof item.rating === "number" ? item.rating : 5,
        text: String(item.text ?? ""),
      }))
    : [];

  return {
    id: numericId,
    _id: id,
    website: String(raw.website ?? raw.Website ?? backendHostname ?? ""),
    name,
    slug: String(raw.slug ?? name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")),
    category: String(raw.category ?? "General"),
    destination: String(raw.destination ?? raw.location ?? "Various"),
    location: String(raw.location ?? raw.destination ?? "Various"),
    description: String(raw.description ?? raw.shortDescription ?? ""),
    fullDescription: String(raw.fullDescription ?? raw.description ?? ""),
    price,
    duration: String(raw.duration ?? "1 Day"),
    difficulty: String(raw.difficulty ?? "Easy"),
    rating: typeof raw.rating === "number" ? raw.rating : (parseFloat(String(raw.rating ?? 4.5)) || 4.5),
    reviews: typeof raw.reviews === "number" ? raw.reviews : (parseInt(String(raw.reviews ?? 10), 10) || 10),
    image: gallery[0],
    gallery,
    groupSize: String(raw.groupSize ?? "2-10"),
    bestTime: String(raw.bestTime ?? "All Year"),
    language: String(raw.language ?? "English"),
    highlights: Array.isArray(raw.highlights) ? raw.highlights.map(String) : [],
    included: Array.isArray(raw.included) ? raw.included.map(String) : [],
    itinerary,
    guestReviews,
    featured: Boolean(raw.featured),
    popular: Boolean(raw.popular),
  };
}

export function normalizeDestination(raw: Record<string, unknown>): DestinationItem {
  const name = String(raw.name ?? raw.title ?? "Destination");
  const image = normalizeImageUrl((raw.image ?? raw.Image ?? raw.imageUrl) as string);
  const tours = Number(raw.tours ?? raw.Tours ?? raw.toursCount ?? 1);
  const id = raw.id ? String(raw.id) : name.toLowerCase().replace(/\s+/g, "-");
  return { id, name, image, tours };
}

// ─── Core Request Runner with Timeout & Retry ─────────────────────────────────

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  revalidate?: number | false;
  tags?: string[];
  timeoutMs?: number;
  retries?: number;
}

interface RequestResponse<T> {
  data: T;
  headers: Headers;
  status: number;
}

async function requestWithRetry<T>(
  site: SiteDefinition,
  url: string,
  options: RequestOptions = {}
): Promise<RequestResponse<T>> {
  const {
    method = "GET",
    body,
    headers = {},
    revalidate,
    tags,
    timeoutMs = 8000,
    retries = 1,
  } = options;

  let lastError: ApiError | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const requestHeaders: Record<string, string> = {
        Accept: "application/json",
        "X-Website-Hostname": site.backendHostname,
        "X-Website-Id": site.siteId,
        ...headers,
      };

      if (body) {
        requestHeaders["Content-Type"] = "application/json";
      }

      const fetchOptions: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } } = {
        method,
        headers: requestHeaders,
        signal: controller.signal,
      };

      if (body) {
        fetchOptions.body = JSON.stringify(body);
      }

      if (revalidate !== undefined || tags) {
        fetchOptions.next = {
          revalidate: revalidate === false ? 0 : revalidate,
          tags,
        };
      } else {
        fetchOptions.cache = "no-store";
      }

      const response = await fetch(url, fetchOptions);
      clearTimeout(timer);

      const text = await response.text();

      if (!response.ok) {
        const errorType: ApiErrorType = response.status >= 500 ? "server" : "client";
        const err = new ApiError(
          `API request failed with status ${response.status}`,
          errorType,
          response.status,
          url,
          text.slice(0, 300)
        );

        if (response.status < 500) {
          throw err;
        }

        lastError = err;
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
          continue;
        }
        throw err;
      }

      let parsed: T;
      try {
        parsed = JSON.parse(text) as T;
      } catch {
        throw new ApiError("Failed to parse JSON response from API", "json", response.status, url);
      }

      return {
        data: parsed,
        headers: response.headers,
        status: response.status,
      };
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof ApiError) {
        if (err.status < 500) throw err;
        lastError = err;
      } else if (err instanceof Error && err.name === "AbortError") {
        lastError = new ApiError(`API request timed out after ${timeoutMs}ms`, "timeout", 0, url);
      } else {
        lastError = new ApiError(
          err instanceof Error ? err.message : "Network error connecting to API",
          "network",
          0,
          url
        );
      }

      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 200 * (attempt + 1)));
        continue;
      }
      throw lastError;
    }
  }

  throw lastError ?? new ApiError("Request failed", "network", 0, url);
}

// ─── Domain API Functions ─────────────────────────────────────────────────────

/**
 * Fetch dynamic website configuration for the specified site.
 * Cache isolated strictly by site.siteId.
 */
export async function fetchSiteConfig(
  siteTarget?: SiteDefinition | SiteId | string,
  lang: string = ENV.defaultLang
): Promise<SiteConfigResult> {
  const site = await resolveSite(siteTarget);
  const cleanHost = encodeURIComponent(site.backendHostname);
  const cleanLang = encodeURIComponent(lang);
  const primaryUrl = `${ENV.apiUrl}/api/core/v1/config/${cleanHost}?lang=${cleanLang}`;

  try {
    const res = await requestWithRetry<SiteConfigResponse>(site, primaryUrl, {
      revalidate: 300,
      tags: [`site-config:${site.siteId}`],
      timeoutMs: 6000,
      retries: 1,
    });

    if (res.data?.isSuccess && res.data?.result) {
      return res.data.result;
    }
    throw new ApiError(res.data?.error || "Config API reported error", "server", 200, primaryUrl);
  } catch (primaryErr) {
    if (site.stagingApiUrl && !ENV.apiUrl.includes(site.stagingApiUrl)) {
      const fallbackUrl = `${site.stagingApiUrl}/api/core/v1/config/${cleanHost}?lang=${cleanLang}`;
      try {
        const fallbackRes = await requestWithRetry<SiteConfigResponse>(site, fallbackUrl, {
          revalidate: 300,
          tags: [`site-config:${site.siteId}`],
          timeoutMs: 6000,
          retries: 1,
        });
        if (fallbackRes.data?.isSuccess && fallbackRes.data?.result) {
          return fallbackRes.data.result;
        }
      } catch {
        // preserve original error
      }
    }
    throw primaryErr;
  }
}

/**
 * Fetch all tours for the specified site.
 * Cache isolated strictly by site.siteId.
 */
export async function fetchTours(
  siteTarget?: SiteDefinition | SiteId | string,
  category?: string
): Promise<{ success: boolean; data: Tour[]; error?: string; dataSource: "mongodb" | "seed-fallback" }> {
  const site = await resolveSite(siteTarget);
  const url = category && category.toLowerCase() !== "all"
    ? `${ENV.apiUrl}/api/tours?category=${encodeURIComponent(category)}`
    : `${ENV.apiUrl}/api/tours`;

  try {
    const res = await requestWithRetry<unknown>(site, url, {
      revalidate: 60,
      tags: [`tours:${site.siteId}`],
      timeoutMs: 6000,
      retries: 1,
    });

    const isSeedFallback = res.headers.get("x-data-source") === "seed-fallback";
    let rawList: Record<string, unknown>[] = [];
    const json = res.data;

    if (Array.isArray(json)) {
      rawList = json as Record<string, unknown>[];
    } else if (json && typeof json === "object") {
      const obj = json as Record<string, unknown>;
      if (Array.isArray(obj.data)) rawList = obj.data as Record<string, unknown>[];
      else if (Array.isArray(obj.result)) rawList = obj.result as Record<string, unknown>[];
      else if (Array.isArray(obj.tours)) rawList = obj.tours as Record<string, unknown>[];
    }

    const data = rawList.map((t) => normalizeTour(t, site.backendHostname));
    return {
      success: true,
      data,
      dataSource: isSeedFallback ? "seed-fallback" : "mongodb",
    };
  } catch (err) {
    return {
      success: false,
      data: [],
      error: err instanceof Error ? err.message : String(err),
      dataSource: "mongodb",
    };
  }
}

/**
 * Fetch a single tour by ID or Slug for the specified site.
 */
export async function fetchTourById(
  id: string,
  siteTarget?: SiteDefinition | SiteId | string
): Promise<Tour | null> {
  const site = await resolveSite(siteTarget);
  const url = `${ENV.apiUrl}/api/tours/${encodeURIComponent(id)}`;

  try {
    const res = await requestWithRetry<unknown>(site, url, {
      revalidate: 60,
      tags: [`tour:${site.siteId}:${id}`],
      timeoutMs: 6000,
      retries: 1,
    });

    const json = res.data;
    let raw: Record<string, unknown> | null = null;
    if (json && typeof json === "object") {
      const obj = json as Record<string, unknown>;
      raw = (obj.data ?? obj.tour ?? obj.result ?? obj) as Record<string, unknown>;
    }

    return raw ? normalizeTour(raw, site.backendHostname) : null;
  } catch {
    return null;
  }
}

export { fetchTourById as fetchTour };

/**
 * Fetch destinations for the specified site.
 * Cache isolated strictly by site.siteId.
 */
export async function fetchDestinations(
  siteTarget?: SiteDefinition | SiteId | string
): Promise<DestinationItem[]> {
  const site = await resolveSite(siteTarget);
  const url = `${ENV.apiUrl}/api/destinations`;

  try {
    const res = await requestWithRetry<unknown>(site, url, {
      revalidate: 300,
      tags: [`destinations:${site.siteId}`],
      timeoutMs: 6000,
      retries: 1,
    });

    let rawList: Record<string, unknown>[] = [];
    const json = res.data;
    if (Array.isArray(json)) {
      rawList = json as Record<string, unknown>[];
    } else if (json && typeof json === "object") {
      const obj = json as Record<string, unknown>;
      if (Array.isArray(obj.data)) rawList = obj.data as Record<string, unknown>[];
      else if (Array.isArray(obj.result)) rawList = obj.result as Record<string, unknown>[];
    }

    return rawList.map(normalizeDestination);
  } catch {
    return [];
  }
}

/**
 * Create a new booking for the specified site.
 */
export async function createBooking(
  siteTarget: SiteDefinition | SiteId | string,
  payload: CreateBookingPayload
): Promise<Booking> {
  const site = await resolveSite(siteTarget);
  const url = `${ENV.apiUrl}/api/bookings`;

  const bookingData = {
    ...payload,
    website: site.backendHostname,
  };

  const res = await requestWithRetry<Record<string, unknown>>(site, url, {
    method: "POST",
    body: bookingData,
    timeoutMs: 8000,
    retries: 0,
  });

  return (res.data.data ?? res.data) as Booking;
}

/**
 * Fetch bookings list for the specified site.
 */
export async function fetchBookings(
  siteTarget: SiteDefinition | SiteId | string,
  email?: string
): Promise<Booking[]> {
  const site = await resolveSite(siteTarget);
  const url = email
    ? `${ENV.apiUrl}/api/bookings?email=${encodeURIComponent(email)}`
    : `${ENV.apiUrl}/api/bookings`;

  const res = await requestWithRetry<unknown>(site, url, {
    timeoutMs: 6000,
    retries: 1,
  });

  const json = res.data;
  if (Array.isArray(json)) return json as Booking[];
  if (json && typeof json === "object" && Array.isArray((json as Record<string, unknown>).data)) {
    return (json as Record<string, unknown>).data as Booking[];
  }
  return [];
}

/**
 * Health check function for DevBanner and /api/health endpoint.
 * Accurately measures latency and inspects backend diagnostic response headers.
 */
export async function checkApiHealth(
  siteTarget?: SiteDefinition | SiteId | string,
  reqHost: string = "localhost"
): Promise<ApiHealthResult> {
  const site = await resolveSite(siteTarget);
  const start = Date.now();
  let configOk = false;
  let toursOk = false;
  let tourCount = 0;
  let brandName = site.displayName;
  let errorMsg = "";
  let resolvedWebsite = site.siteId;
  let resolvedDatabase = `tours_${site.siteId}`;
  let resolvedHostname = site.backendHostname;
  let dataSource: "mongodb" | "seed-fallback" | "unknown" = "unknown";
  let firstItem = "";

  try {
    const config = await fetchSiteConfig(site);
    configOk = true;
    brandName = config.website?.name || config.website?.fullName || site.displayName;
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : String(err);
  }

  const toursRes = await fetchTours(site);
  if (toursRes.success) {
    toursOk = true;
    tourCount = toursRes.data.length;
    dataSource = toursRes.dataSource;
    if (toursRes.data.length > 0) {
      firstItem = toursRes.data[0].name;
    }
  } else if (!errorMsg) {
    errorMsg = toursRes.error || "Failed to fetch tours";
  }

  const latencyMs = Date.now() - start;

  return {
    host: reqHost,
    siteId: site.siteId,
    backendHostname: site.backendHostname,
    apiUrl: ENV.apiUrl,
    status: configOk || toursOk ? 200 : 502,
    configOk,
    toursOk,
    latencyMs,
    tourCount,
    brandName,
    firstItem,
    toursUrl: `${ENV.apiUrl}/api/tours`,
    resolvedWebsite,
    resolvedDatabase,
    resolvedHostname,
    dataSource,
    error: errorMsg || undefined,
  };
}
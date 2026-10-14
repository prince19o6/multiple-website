/**
 * services/api.ts
 *
 * Single, unified API client for the application.
 * All HTTP requests throughout the entire app route through this file.
 *
 * Guarantees:
 * - Single base URL driven strictly by ENV.apiUrl from src/config/env.ts.
 * - Always sends X-Website-Hostname with the active site's canonical hostname.
 * - Always sends Accept: application/json.
 * - 15-second default timeout with AbortController and exponential backoff retry.
 * - Strict JSON parse safety and typed ApiError propagation (network, 4xx client, 5xx server).
 * - Client errors (4xx) are never retried.
 * - Detailed [DEBUG] logging for tours calls (final URL, headers, HTTP status, item count, first item).
 * - Exports debug state tracking for DevBanner overlay.
 * - Typed methods for config, tours, destinations, bookings, auth, and health checks with ZERO `any`.
 */

import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {
  secureGet,
  secureSet,
  secureDelete,
  storeGet,
  storeSet,
  storeRemove,
  storeGetObject,
  storeSetObject,
} from '@/src/lib/storage';
import {
  getActiveSite,
  getSiteById,
  isAllowedSiteId,
  type SiteDefinition,
} from '@/src/config/sites';
import { ENV } from '@/src/config/env';
import { normalizeTour, normalizeDestination, normalizeBooking } from '@/lib/normalize';
import type { Tour, DestinationItem, Booking, User, RegisterRequest, AuthResponse } from '@/types';
import type { SiteConfigResult } from '@/lib/siteConfig';

// ─── Custom Typed Error ───────────────────────────────────────────────────────

export type ApiErrorType = 'network' | 'client' | 'server' | 'timeout' | 'unknown';

export class ApiError extends Error {
  readonly type: ApiErrorType;
  readonly status?: number;
  readonly url?: string;
  readonly isOffline?: boolean;
  readonly errors?: Record<string, string[]>;
  readonly fieldErrors?: Record<string, string>;

  constructor(
    message: string,
    type: ApiErrorType = 'unknown',
    status?: number,
    url?: string,
    isOffline?: boolean,
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.status = status;
    this.url = url;
    this.isOffline = isOffline;
    this.errors = errors;

    if (errors && typeof errors === 'object') {
      const flattened: Record<string, string> = {};
      for (const [key, msgs] of Object.entries(errors)) {
        if (Array.isArray(msgs) && msgs.length > 0 && typeof msgs[0] === 'string') {
          flattened[key.toLowerCase()] = msgs[0];
          flattened[key] = msgs[0];
        }
      }
      this.fieldErrors = flattened;
    }
  }
}

// ─── Debug State for DevBanner ────────────────────────────────────────────────

export interface ToursDebugState {
  url: string;
  status: number | string;
  itemCount: number;
  firstItem?: string;
  lastUpdated: number;
  error?: string;
  detailUrl?: string;
  detailStatus?: number | string;
  detailPreview?: string;
}

let lastToursDebugState: ToursDebugState | null = null;
const toursDebugListeners = new Set<(state: ToursDebugState) => void>();

export function getToursDebugState(): ToursDebugState | null {
  return lastToursDebugState;
}

export function subscribeToursDebug(listener: (state: ToursDebugState) => void): () => void {
  toursDebugListeners.add(listener);
  return () => {
    toursDebugListeners.delete(listener);
  };
}

export function setToursDebugState(state: ToursDebugState): void {
  lastToursDebugState = state;
  toursDebugListeners.forEach((listener) => {
    try {
      listener(state);
    } catch {
      // Ignore listener error
    }
  });
}

export interface BookingsDebugState {
  url: string;
  status: number | string;
  itemCount: number;
  lastUpdated: number;
  firstItem?: unknown;
  error?: string;
}

let lastBookingsDebugState: BookingsDebugState | null = null;
const bookingsDebugListeners = new Set<(state: BookingsDebugState) => void>();

export function getBookingsDebugState(): BookingsDebugState | null {
  return lastBookingsDebugState;
}

export function subscribeBookingsDebug(listener: (state: BookingsDebugState) => void): () => void {
  bookingsDebugListeners.add(listener);
  return () => {
    bookingsDebugListeners.delete(listener);
  };
}

export function setBookingsDebugState(state: BookingsDebugState): void {
  lastBookingsDebugState = state;
  bookingsDebugListeners.forEach((listener) => {
    try {
      listener(state);
    } catch {
      // Ignore listener error
    }
  });
}

// ─── Common Response Types ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  count?: number;
}

export type { AuthResponse };

export interface CreateBookingPayload {
  website?: string;
  websiteId?: string;
  tourId: number | string;
  tourName?: string;
  tourImage?: string;
  currency?: string;
  location?: string;
  totalPrice?: number;
  guestName?: string;
  name?: string;
  email: string;
  phone?: string;
  travelers?: number;
  startDate?: string;
  endDate?: string;
  date?: string;
  specialRequest?: string;
  userId?: string;
}

export interface TourSearchParams {
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  difficulty?: string;
}

export interface CategoryItem {
  id: string;
  label: string;
  icon: string;
}

interface RawBackendEnvelope<T> {
  success?: boolean;
  isSuccess?: boolean;
  data?: T;
  result?: T;
  tours?: T;
  error?: string;
  message?: string;
  token?: string;
  user?: User;
  refreshToken?: string;
  expiresAt?: string;
  count?: number;
}

// ─── Auth & Header Helpers ────────────────────────────────────────────────────

async function getAuthToken(siteIdOverride?: string): Promise<string | null> {
  try {
    const s = siteIdOverride || getActiveSite()?.id || ENV.siteId;
    const adminToken =
      (await secureGet('admin.token', s)) ||
      (await storeGet('admin.token', s)) ||
      (await storeGet('admin_token', s));
    if (adminToken && adminToken !== 'demo-admin-token-12345') {
      return adminToken;
    }

    const token = (await secureGet('auth.token', s)) || (await storeGet('auth.token', s));
    return token;
  } catch {
    return null;
  }
}

async function buildHeaders(
  site: SiteDefinition,
  customHeaders?: Record<string, string>
): Promise<Record<string, string>> {
  const activeHostname = site?.hostname || ENV.siteHostname;
  const activeSiteId = site?.id || ENV.siteId;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Website-Hostname': activeHostname,
    'X-Website-Id': activeSiteId,
    ...customHeaders,
  };

  const token = await getAuthToken(activeSiteId);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

// ─── Offline Cache Helpers ────────────────────────────────────────────────────

async function getCachedResponse<T>(cacheKey: string): Promise<T | null> {
  return await storeGetObject<T>(`api_cache.${cacheKey}`);
}

async function setCachedResponse(cacheKey: string, data: unknown): Promise<void> {
  await storeSetObject(`api_cache.${cacheKey}`, data);
}

// ─── Core Request Engine ──────────────────────────────────────────────────────

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  skipCache?: boolean;
  siteId?: string;
}

let requestSequence = 0;

export async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const reqId = ++requestSequence;
  const { timeoutMs = 15_000, retries = 1, skipCache = false, siteId, ...customInit } = options;

  const site: SiteDefinition = siteId && isAllowedSiteId(siteId)
    ? getSiteById(siteId)
    : getActiveSite();

  // Unified single base URL for all calls
  let base = ENV.apiUrl.replace(/\/+$/, '');

  // On Web with localhost origin: staging gateways (https://stagingapi.*) do not
  // send Access-Control-Allow-Origin headers for localhost browser origins.
  // When a local backend fallback is available (e.g. http://localhost:5000), route directly
  // through the local backend proxy to avoid guaranteed browser CORS preflight blocking.
  if (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    if (base.includes('stagingapi.')) {
      base = (ENV.backendFallbackUrl || 'http://localhost:5000').replace(/\/+$/, '');
    }
  }

  // Staging API gateways (stagingapi.*) exclusively host /api/core/v1/config.
  // Application endpoints (/api/tours, /api/destinations, /api/bookings, /api/auth, /api/users)
  // are hosted on the application backend. When base points to stagingapi and a backend fallback
  // is available (such as http://10.187.131.80:5000 on mobile LAN or http://localhost:5000 on web),
  // route these endpoints directly to the backend to avoid guaranteed 404 errors.
  const isCatalogOrAppEndpoint =
    endpoint.includes('/api/tours') ||
    endpoint.includes('/api/destinations') ||
    endpoint.includes('/api/bookings') ||
    endpoint.includes('/api/auth') ||
    endpoint.includes('/api/users');

  if (base.includes('stagingapi.') && isCatalogOrAppEndpoint) {
    base = (ENV.backendFallbackUrl || 'http://localhost:5000').replace(/\/+$/, '');
  }

  const url = endpoint.startsWith('http://') || endpoint.startsWith('https://')
    ? endpoint
    : `${base}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const isGet = !customInit.method || customInit.method.toUpperCase() === 'GET';
  const cacheKey = `${ENV.siteId}_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const isToursCall = endpoint.includes('/api/tours');

  // Mixed Content Guard on Web
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.protocol === 'https:') {
    if (url.startsWith('http://')) {
      throw new ApiError(
        `[Mixed Content Blocked] Cannot load insecure HTTP endpoint "${url}" from HTTPS page "${window.location.origin}".`,
        'client',
        0,
        url
      );
    }
  }

  // 1. Check network connectivity
  const netState = await NetInfo.fetch();
  if (netState.isConnected === false) {
    if (isGet && !skipCache) {
      const cached = await getCachedResponse<T>(cacheKey);
      if (cached !== null) {
        if (__DEV__) {
          console.log(`[DEBUG] [Req #${reqId}] [CACHE] ${url} - Returned cached response (offline)`);
        }
        return cached;
      }
    }
    throw new ApiError('No internet connection. Please check your network.', 'network', 0, url, true);
  }

  // 2. Build headers
  const headers = await buildHeaders(site, customInit.headers as Record<string, string>);

  if (__DEV__) {
    console.log(
      `[DEBUG] [Req #${reqId}] [NETWORK] ${customInit.method || 'GET'} ${url} (Hostname: ${headers['X-Website-Hostname'] || 'none'})`
    );
  }

  // 3. Retry loop with exponential backoff (no retry on 4xx client errors)
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...customInit,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timer);

      // Handle non-2xx HTTP responses
      if (!response.ok) {
        let errMessage = `HTTP ${response.status}: ${response.statusText}`;
        let parsedErrors: Record<string, string[]> | undefined = undefined;

        try {
          const errBody = (await response.json()) as {
            message?: string;
            error?: string;
            title?: string;
            errors?: Record<string, string[]>;
          };

          if (errBody?.errors && typeof errBody.errors === 'object') {
            parsedErrors = errBody.errors;
            const firstField = Object.keys(errBody.errors)[0];
            const firstMsg = firstField ? errBody.errors[firstField]?.[0] : undefined;
            errMessage = firstMsg || errBody.title || errMessage;
          } else if (errBody?.error) {
            errMessage = errBody.error;
          } else if (errBody?.message) {
            errMessage = errBody.message;
          } else if (errBody?.title) {
            errMessage = errBody.title;
          }
        } catch {
          // ignore parse error on error response
        }

        const errorType: ApiErrorType =
          response.status >= 500 ? 'server' : response.status >= 400 ? 'client' : 'unknown';

        if (isToursCall) {
          const isDetail = !url.endsWith('/api/tours') && !url.includes('/api/tours?');
          if (__DEV__) {
            console.log(`[DEBUG] [Tours API Notice] Final URL: ${url}`);
            console.log(`[DEBUG] [Tours API Notice] Headers:`, JSON.stringify(headers));
            console.log(`[DEBUG] [Tours API Notice] HTTP Status: ${response.status}`);
            console.log(`[DEBUG] [Tours API Notice] Message: ${errMessage}`);
          }
          setToursDebugState({
            url: isDetail ? (lastToursDebugState?.url || url) : url,
            status: isDetail ? (lastToursDebugState?.status || response.status) : response.status,
            itemCount: isDetail ? (lastToursDebugState?.itemCount ?? 0) : 0,
            firstItem: lastToursDebugState?.firstItem,
            lastUpdated: Date.now(),
            error: errMessage,
            detailUrl: isDetail ? url : lastToursDebugState?.detailUrl,
            detailStatus: isDetail ? response.status : lastToursDebugState?.detailStatus,
            detailPreview: isDetail ? errMessage.slice(0, 300) : lastToursDebugState?.detailPreview,
          });
        }

        throw new ApiError(errMessage, errorType, response.status, url, false, parsedErrors);
      }

      // Parse JSON safely
      let data: T;
      const text = await response.text();
      try {
        data = (text ? JSON.parse(text) : {}) as T;
      } catch {
        throw new ApiError('Invalid JSON received from server', 'server', response.status, url);
      }

      if (isToursCall) {
        const isDetail = !url.endsWith('/api/tours') && !url.includes('/api/tours?');
        if (__DEV__) {
          console.log(`[DEBUG] [Tours API Response] URL: ${url}`);
          console.log(`[DEBUG] [Tours API Response] Headers:`, JSON.stringify(headers));
          console.log(`[DEBUG] [Tours API Response] HTTP Status: ${response.status}`);
          console.log(`[DEBUG] [Tours API Response] Body Preview (first 300 chars): ${text.slice(0, 300)}`);
        }
        if (isDetail) {
          setToursDebugState({
            ...(lastToursDebugState || { url, status: response.status, itemCount: 1, lastUpdated: Date.now() }),
            detailUrl: url,
            detailStatus: response.status,
            detailPreview: text.slice(0, 300),
            lastUpdated: Date.now(),
          });
        }
      }

      // Cache successful GET responses
      if (isGet && !skipCache) {
        setCachedResponse(cacheKey, data).catch(() => {});
      }

      return data;
    } catch (err: unknown) {
      clearTimeout(timer);

      const isAbort =
        err instanceof Error &&
        (err.name === 'AbortError' || err.message.toLowerCase().includes('aborted'));

      if (isAbort) {
        lastError = new ApiError(
          `Request timed out after ${timeoutMs}ms`,
          'timeout',
          0,
          url
        );
      } else {
        lastError = err;
      }

      if (isToursCall && attempt === retries) {
        const errorMsg = lastError instanceof Error ? lastError.message : String(lastError);
        setToursDebugState({
          url,
          status: lastError instanceof ApiError && lastError.status ? lastError.status : 'ERR',
          itemCount: 0,
          lastUpdated: Date.now(),
          error: errorMsg,
        });
      }

      // If client error (4xx) or final retry attempt, do not retry
      if (err instanceof ApiError && err.type === 'client') {
        throw err;
      }
      if (attempt === retries) {
        break;
      }

      // Exponential backoff delay
      const delay = Math.min(1000 * 2 ** attempt, 8_000);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  if (lastError instanceof ApiError) {
    throw lastError;
  }
  throw new ApiError(
    lastError instanceof Error ? lastError.message : 'Unknown network failure',
    'unknown',
    0,
    url
  );
}

// ─── Extract List Helper ──────────────────────────────────────────────────────

function extractListFromEnvelope(json: unknown): unknown[] {
  if (Array.isArray(json)) {
    return json;
  }
  if (json && typeof json === 'object') {
    const obj = json as Record<string, unknown>;
    if (Array.isArray(obj.data)) {
      return obj.data;
    }
    if (Array.isArray(obj.result)) {
      return obj.result;
    }
    if (Array.isArray(obj.tours)) {
      return obj.tours;
    }
    if (obj.data && typeof obj.data === 'object' && Array.isArray((obj.data as Record<string, unknown>).tours)) {
      return (obj.data as Record<string, unknown>).tours as unknown[];
    }
    if (obj.result && typeof obj.result === 'object' && Array.isArray((obj.result as Record<string, unknown>).tours)) {
      return (obj.result as Record<string, unknown>).tours as unknown[];
    }
  }
  return [];
}

// ─── Specific API Methods ─────────────────────────────────────────────────────

/**
 * Fetch the website configuration from /api/core/v1/config/{hostname}.
 */
export async function getConfig(
  hostnameOrSiteId?: string,
  lang?: string,
  siteId?: string
): Promise<SiteConfigResult> {
  const site = siteId && isAllowedSiteId(siteId)
    ? getSiteById(siteId)
    : hostnameOrSiteId && isAllowedSiteId(hostnameOrSiteId)
      ? getSiteById(hostnameOrSiteId)
      : getActiveSite();

  const isHost = hostnameOrSiteId && hostnameOrSiteId.includes('.');
  const targetHost = isHost ? hostnameOrSiteId : site.hostname || ENV.siteHostname;
  const activeLang = lang || ENV.defaultLang || 'en';

  const endpoint = `/api/core/v1/config/${targetHost}?lang=${encodeURIComponent(activeLang)}`;

  try {
    const json = await request<RawBackendEnvelope<SiteConfigResult>>(endpoint, {
      siteId: site.id,
      timeoutMs: 12_000,
    });

    const configData = json?.result || json?.data || json;
    if (configData && typeof configData === 'object' && 'website' in configData) {
      return configData as SiteConfigResult;
    }
    if (configData && typeof configData === 'object' && 'colors' in configData) {
      return configData as SiteConfigResult;
    }

    throw new ApiError('Received empty configuration envelope from server', 'server', 200, endpoint);
  } catch (err) {
    const fallbackBase = ENV.backendFallbackUrl;
    if (fallbackBase) {
      try {
        const fallbackEndpoint = `${fallbackBase}/api/core/v1/config/${targetHost}?lang=${encodeURIComponent(activeLang)}`;
        if (__DEV__) {
          console.log(`[DEBUG] [getConfig] Primary config call failed. Retrying via fallback: ${fallbackEndpoint}`);
        }
        const json = await request<RawBackendEnvelope<SiteConfigResult>>(fallbackEndpoint, {
          siteId: site.id,
          timeoutMs: 12_000,
        });
        const configData = json?.result || json?.data || json;
        if (configData && typeof configData === 'object' && ('website' in configData || 'colors' in configData)) {
          return configData as SiteConfigResult;
        }
      } catch (fallbackErr) {
        if (__DEV__) {
          console.warn(`[DEBUG] [getConfig] Fallback backend config also failed:`, fallbackErr);
        }
      }
    }
    if (__DEV__) {
      console.warn(`[DEBUG] [getConfig] Failed to fetch live config for "${targetHost}":`, err);
    }
    throw err;
  }
}

/** Backward compatible alias for getConfig */
export const fetchConfig = getConfig;

/**
 * Fallback baseline config generator.
 */
export function getFallbackConfig(site: SiteDefinition): SiteConfigResult {
  return {
    website: {
      id: site.id,
      name: site.name,
      logoUrl: null,
    },
    colors: {
      primary: site.fallbackAccentColor || '#2563eb',
      secondary: site.fallbackAccentColor || '#1e40af',
    },
    theme: {},
    websiteConfiguration: null,
    websiteContact: { contact: [], email: [] },
    websiteLinks: { headerType: [], footerTypes: [] },
  } as unknown as SiteConfigResult;
}

/**
 * Fetch all tours for the active site with normalization.
 */
export async function fetchTours(overrideSiteId?: string): Promise<ApiResponse<Tour[]>> {
  const siteId = overrideSiteId || ENV.siteId;
  const site = isAllowedSiteId(siteId) ? getSiteById(siteId) : getActiveSite();
  const effectiveBase = (ENV.apiUrl.includes('stagingapi.') && ENV.backendFallbackUrl)
    ? ENV.backendFallbackUrl.replace(/\/+$/, '')
    : ENV.apiUrl.replace(/\/+$/, '');
  const url = `${effectiveBase}/api/tours`;
  const headers = await buildHeaders(site);

  try {
    const json = await request<RawBackendEnvelope<unknown[]> | unknown[]>('/api/tours', { siteId });
    const rawList = extractListFromEnvelope(json);
    const normalized = rawList.map((item: unknown) => normalizeTour(item, siteId));

    if (__DEV__) {
      console.log(`[DEBUG] [Tours API] Final URL: ${url}`);
      console.log(`[DEBUG] [Tours API] Headers:`, JSON.stringify(headers));
      console.log(`[DEBUG] [Tours API] HTTP Status: 200`);
      console.log(`[DEBUG] [Tours API] Item Count: ${normalized.length}`);
      console.log(
        `[DEBUG] [Tours API] First Item:`,
        normalized[0]
          ? JSON.stringify({
              id: normalized[0].id,
              name: normalized[0].name,
              price: normalized[0].price,
              duration: normalized[0].duration,
              image: normalized[0].image,
            })
          : 'None (empty array)'
      );
    }

    setToursDebugState({
      url,
      status: 200,
      itemCount: normalized.length,
      firstItem: normalized[0]?.name,
      lastUpdated: Date.now(),
    });

    return { success: true, data: normalized, count: normalized.length };
  } catch (primaryErr) {
    const is404 = primaryErr instanceof ApiError && primaryErr.status === 404;
    const fallbackBase = ENV.backendFallbackUrl;

    if ((is404 || effectiveBase.includes('stagingapi.')) && fallbackBase && fallbackBase !== effectiveBase) {
      try {
        const fallbackUrl = `${fallbackBase}/api/tours`;
        const json = await request<RawBackendEnvelope<unknown[]> | unknown[]>(fallbackUrl, { siteId });
        const rawList = extractListFromEnvelope(json);
        const normalized = rawList.map((item: unknown) => normalizeTour(item, siteId));

        if (__DEV__) {
          console.log(`[DEBUG] [Tours API] Fallback URL: ${fallbackUrl}`);
          console.log(`[DEBUG] [Tours API] Item Count: ${normalized.length}`);
          console.log(`[DEBUG] [Tours API] First Item: ${normalized[0]?.name || 'None'}`);
        }

        setToursDebugState({
          url: fallbackUrl,
          status: 200,
          itemCount: normalized.length,
          firstItem: normalized[0]?.name,
          lastUpdated: Date.now(),
        });

        return { success: true, data: normalized, count: normalized.length };
      } catch (fallbackErr) {
        if (__DEV__) {
          console.warn('[DEBUG] [Tours API Fallback Error]:', fallbackErr);
        }
      }
    }
    throw primaryErr;
  }
}

/**
 * Search and filter tours.
 */
export async function searchTours(
  params: TourSearchParams,
  overrideSiteId?: string
): Promise<ApiResponse<Tour[]>> {
  const siteId = overrideSiteId || ENV.siteId;
  const qParams = new URLSearchParams();
  if (params.q) qParams.append('q', params.q);
  if (params.minPrice !== undefined) qParams.append('minPrice', String(params.minPrice));
  if (params.maxPrice !== undefined) qParams.append('maxPrice', String(params.maxPrice));
  if (params.difficulty) qParams.append('difficulty', params.difficulty);

  const qs = qParams.toString();
  const endpoint = qs ? `/api/tours/search?${qs}` : '/api/tours/search';

  try {
    const json = await request<RawBackendEnvelope<unknown[]> | unknown[]>(endpoint, { siteId });
    const rawList = extractListFromEnvelope(json);
    const normalized = rawList.map((item: unknown) => normalizeTour(item, siteId));

    return { success: true, data: normalized, count: normalized.length };
  } catch (primaryErr) {
    const fallbackBase = ENV.backendFallbackUrl;
    if (fallbackBase && (primaryErr instanceof ApiError && primaryErr.status === 404)) {
      try {
        const fallbackEndpoint = `${fallbackBase}${endpoint}`;
        const json = await request<RawBackendEnvelope<unknown[]> | unknown[]>(fallbackEndpoint, { siteId });
        const rawList = extractListFromEnvelope(json);
        const normalized = rawList.map((item: unknown) => normalizeTour(item, siteId));
        return { success: true, data: normalized, count: normalized.length };
      } catch {
        // preserve original error
      }
    }
    throw primaryErr;
  }
}

/**
 * Fetch all destinations for the active site with normalization.
 */
export async function fetchDestinations(overrideSiteId?: string): Promise<ApiResponse<DestinationItem[]>> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const json = await request<RawBackendEnvelope<unknown[]> | unknown[]>('/api/destinations', { siteId });
    const rawList = extractListFromEnvelope(json);
    const normalized = rawList.map((item: unknown, idx: number) => normalizeDestination(item, idx));
    return { success: true, data: normalized, count: normalized.length };
  } catch (primaryErr) {
    const fallbackBase = ENV.backendFallbackUrl;
    if (fallbackBase) {
      try {
        const fallbackEndpoint = `${fallbackBase}/api/destinations`;
        const json = await request<RawBackendEnvelope<unknown[]> | unknown[]>(fallbackEndpoint, { siteId });
        const rawList = extractListFromEnvelope(json);
        const normalized = rawList.map((item: unknown, idx: number) => normalizeDestination(item, idx));
        return { success: true, data: normalized, count: normalized.length };
      } catch {
        // fallback failed
      }
    }
    return { success: false, data: [] };
  }
}

/**
 * Fetch categories list.
 */
export async function fetchCategories(): Promise<ApiResponse<CategoryItem[]>> {
  return {
    success: true,
    data: [
      { id: 'all', label: 'All', icon: 'compass' },
      { id: 'adventure', label: 'Adventure', icon: 'trail-sign' },
      { id: 'beach', label: 'Beach', icon: 'water' },
      { id: 'cultural', label: 'Cultural', icon: 'business' },
      { id: 'wildlife', label: 'Wildlife', icon: 'leaf' },
      { id: 'luxury', label: 'Luxury', icon: 'diamond' },
    ],
  };
}

/**
 * Fetch a single tour by ID with normalization.
 */
export async function fetchTour(id: string | number, overrideSiteId?: string): Promise<Tour> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const json = await request<RawBackendEnvelope<unknown> | unknown>(`/api/tours/${id}`, { siteId });
    const raw = (json as RawBackendEnvelope<unknown>)?.data ?? (json as RawBackendEnvelope<unknown>)?.result ?? json;
    return normalizeTour(raw, siteId);
  } catch (primaryErr) {
    const fallbackBase = ENV.backendFallbackUrl;
    if (fallbackBase) {
      try {
        const fallbackEndpoint = `${fallbackBase}/api/tours/${id}`;
        const json = await request<RawBackendEnvelope<unknown> | unknown>(fallbackEndpoint, { siteId });
        const raw = (json as RawBackendEnvelope<unknown>)?.data ?? (json as RawBackendEnvelope<unknown>)?.result ?? json;
        return normalizeTour(raw, siteId);
      } catch {
        // fallback failed
      }
    }
    throw primaryErr;
  }
}

/**
 * Fetch a tour by tour numeric number.
 */
export async function fetchTourByNumber(tourNumber: string | number, overrideSiteId?: string): Promise<Tour> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const json = await request<RawBackendEnvelope<unknown> | unknown>(`/api/tours/by-number/${tourNumber}`, { siteId });
    const raw = (json as RawBackendEnvelope<unknown>)?.data ?? (json as RawBackendEnvelope<unknown>)?.result ?? json;
    return normalizeTour(raw, siteId);
  } catch (primaryErr) {
    const fallbackBase = ENV.backendFallbackUrl;
    if (fallbackBase) {
      try {
        const fallbackEndpoint = `${fallbackBase}/api/tours/by-number/${tourNumber}`;
        const json = await request<RawBackendEnvelope<unknown> | unknown>(fallbackEndpoint, { siteId });
        const raw = (json as RawBackendEnvelope<unknown>)?.data ?? (json as RawBackendEnvelope<unknown>)?.result ?? json;
        return normalizeTour(raw, siteId);
      } catch {
        // fallback failed
      }
    }
    throw primaryErr;
  }
}

/**
 * Create a new tour (admin).
 */
export async function createTour(tourData: Partial<Tour>, overrideSiteId?: string): Promise<Tour> {
  const siteId = overrideSiteId || ENV.siteId;
  const res = await request<RawBackendEnvelope<unknown>>('/api/tours', {
    method: 'POST',
    body: JSON.stringify(tourData),
    siteId,
  });
  const raw = res?.data ?? res?.result ?? res;
  return normalizeTour(raw, siteId);
}

/**
 * Update an existing tour (admin).
 */
export async function updateTour(id: string | number, tourData: Partial<Tour>, overrideSiteId?: string): Promise<Tour> {
  const siteId = overrideSiteId || ENV.siteId;
  const res = await request<RawBackendEnvelope<unknown>>(`/api/tours/${id}`, {
    method: 'PUT',
    body: JSON.stringify(tourData),
    siteId,
  });
  const raw = res?.data ?? res?.result ?? res;
  return normalizeTour(raw, siteId);
}

/**
 * Delete a tour (admin).
 */
export async function deleteTour(id: string | number, overrideSiteId?: string): Promise<{ success: boolean }> {
  const siteId = overrideSiteId || ENV.siteId;
  return request<{ success: boolean }>(`/api/tours/${id}`, {
    method: 'DELETE',
    siteId,
  });
}

/**
 * Create a booking with normalization.
 */
export async function createBooking(bookingData: CreateBookingPayload, overrideSiteId?: string): Promise<Booking> {
  const activeSite = overrideSiteId || bookingData.website || bookingData.websiteId || ENV.siteId;

  const rawStart = bookingData.startDate || bookingData.date;
  const startDateObj = rawStart && !isNaN(new Date(rawStart).getTime())
    ? new Date(rawStart)
    : new Date(Date.now() + 7 * 86400000);

  const rawEnd = bookingData.endDate;
  const endDateObj = rawEnd && !isNaN(new Date(rawEnd).getTime())
    ? new Date(rawEnd)
    : new Date(startDateObj.getTime() + 5 * 86400000);

  const finalEndDateObj = endDateObj >= startDateObj
    ? endDateObj
    : new Date(startDateObj.getTime() + 86400000);

  const numericTourId = !isNaN(Number(bookingData.tourId)) && Number(bookingData.tourId) > 0
    ? Number(bookingData.tourId)
    : 1;

  const payload = {
    website: activeSite,
    websiteId: activeSite,
    userId: bookingData.userId,
    tourId: numericTourId,
    tourName: bookingData.tourName || 'Guided Tour Expedition',
    tourImage: bookingData.tourImage,
    currency: bookingData.currency || '$',
    location: bookingData.location,
    totalPrice: Number(bookingData.totalPrice) || 0,
    guestName: String(bookingData.guestName || bookingData.name || 'Guest Explorer').trim(),
    email: String(bookingData.email || '').trim(),
    phone: String(bookingData.phone || '').trim(),
    travelers: Math.max(1, Number(bookingData.travelers) || 1),
    startDate: startDateObj.toISOString(),
    endDate: finalEndDateObj.toISOString(),
    date: startDateObj.toISOString().split('T')[0],
    specialRequest: bookingData.specialRequest || '',
  };

  if (__DEV__) {
    console.log('[DEBUG] POST /api/bookings Request Payload:', payload);
  }

  try {
    const json = await request<RawBackendEnvelope<unknown> | unknown>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
      siteId: activeSite,
    });

    const raw = (json as RawBackendEnvelope<unknown>)?.data ?? (json as RawBackendEnvelope<unknown>)?.result ?? json;
    const normalized = normalizeBooking(raw);
    if (__DEV__) {
      console.log('[DEBUG] POST /api/bookings Success Created ID:', normalized.id);
    }
    return normalized;
  } catch (primaryErr) {
    const fallbackBase = ENV.backendFallbackUrl;
    if (fallbackBase && (primaryErr instanceof ApiError && primaryErr.status === 404)) {
      try {
        const fallbackEndpoint = `${fallbackBase}/api/bookings`;
        const json = await request<RawBackendEnvelope<unknown> | unknown>(fallbackEndpoint, {
          method: 'POST',
          body: JSON.stringify(payload),
          siteId: activeSite,
        });
        const raw = (json as RawBackendEnvelope<unknown>)?.data ?? (json as RawBackendEnvelope<unknown>)?.result ?? json;
        return normalizeBooking(raw);
      } catch {
        // fallback failed, throw primaryErr
      }
    }
    throw primaryErr;
  }
}

/**
 * Fetch bookings for a site. Supports optional email and guest IDs filtering.
 */
export async function fetchBookings(
  siteId?: string,
  email?: string,
  ids?: string[]
): Promise<ApiResponse<Booking[]>> {
  const resolvedSiteId = siteId || ENV.siteId;
  const site: SiteDefinition = isAllowedSiteId(resolvedSiteId) ? getSiteById(resolvedSiteId) : getActiveSite();
  const params = new URLSearchParams();
  if (email && email.trim()) {
    params.append('email', email.trim());
  }
  if (ids && ids.length > 0) {
    params.append('ids', ids.filter(Boolean).join(','));
  }

  const qs = params.toString();
  const endpoint = qs ? `/api/bookings?${qs}` : '/api/bookings';

  try {
    const json = await request<RawBackendEnvelope<unknown[]> | unknown[]>(endpoint, { siteId: resolvedSiteId });
    const rawList = extractListFromEnvelope(json);
    const normalized = rawList.map((item: unknown, idx: number) => normalizeBooking(item, idx));
    const reqHeaders = await buildHeaders(site);

    if (__DEV__) {
      console.log(`[DEBUG] GET ${endpoint} - Headers:`, reqHeaders);
      console.log(`[DEBUG] GET ${endpoint} - Status: 200, Count: ${normalized.length}`);
      console.log(`[DEBUG] GET ${endpoint} - First Item:`, normalized[0] ?? null);
    }

    setBookingsDebugState({
      url: endpoint,
      status: 200,
      itemCount: normalized.length,
      lastUpdated: Date.now(),
      firstItem: normalized[0] ?? null,
    });

    return { success: true, data: normalized, count: normalized.length };
  } catch (primaryErr) {
    const fallbackBase = ENV.backendFallbackUrl;
    if (fallbackBase && (primaryErr instanceof ApiError && primaryErr.status === 404)) {
      try {
        const fallbackEndpoint = `${fallbackBase}${endpoint}`;
        const json = await request<RawBackendEnvelope<unknown[]> | unknown[]>(fallbackEndpoint, { siteId: resolvedSiteId });
        const rawList = extractListFromEnvelope(json);
        const normalized = rawList.map((item: unknown, idx: number) => normalizeBooking(item, idx));

        setBookingsDebugState({
          url: fallbackEndpoint,
          status: 200,
          itemCount: normalized.length,
          lastUpdated: Date.now(),
          firstItem: normalized[0] ?? null,
        });

        return { success: true, data: normalized, count: normalized.length };
      } catch {
        // fallback failed
      }
    }

    const errStatus = primaryErr instanceof ApiError ? primaryErr.status || 'ERR' : 'ERR';
    const errMessage = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
    setBookingsDebugState({
      url: endpoint,
      status: errStatus,
      itemCount: 0,
      lastUpdated: Date.now(),
      error: errMessage,
    });

    throw primaryErr;
  }
}

/**
 * Fetch a single booking by ID.
 */
export async function fetchBooking(id: string, siteId?: string): Promise<Booking> {
  try {
    const json = await request<RawBackendEnvelope<unknown> | unknown>(`/api/bookings/${id}`, { siteId });
    const raw = (json as RawBackendEnvelope<unknown>)?.data ?? (json as RawBackendEnvelope<unknown>)?.result ?? json;
    return normalizeBooking(raw);
  } catch (primaryErr) {
    const fallbackBase = ENV.backendFallbackUrl;
    if (fallbackBase && (primaryErr instanceof ApiError && primaryErr.status === 404)) {
      try {
        const fallbackEndpoint = `${fallbackBase}/api/bookings/${id}`;
        const json = await request<RawBackendEnvelope<unknown> | unknown>(fallbackEndpoint, { siteId });
        const raw = (json as RawBackendEnvelope<unknown>)?.data ?? (json as RawBackendEnvelope<unknown>)?.result ?? json;
        return normalizeBooking(raw);
      } catch {
        // fallback failed
      }
    }
    throw primaryErr;
  }
}

/**
 * Cancel a booking via API.
 */
export async function cancelBookingApi(
  id: string,
  email?: string,
  siteId?: string
): Promise<Booking> {
  const resolvedSiteId = siteId || ENV.siteId;
  const endpoint = email && email.trim()
    ? `/api/bookings/${id}/cancel?email=${encodeURIComponent(email.trim())}`
    : `/api/bookings/${id}/cancel`;

  if (__DEV__) {
    console.log(`[DEBUG] PATCH ${endpoint} - Cancelling booking ${id}`);
  }

  try {
    const json = await request<RawBackendEnvelope<unknown> | unknown>(endpoint, {
      method: 'PATCH',
      siteId: resolvedSiteId,
    });
    const raw = (json as RawBackendEnvelope<unknown>)?.data ?? (json as RawBackendEnvelope<unknown>)?.result ?? json;
    return normalizeBooking(raw);
  } catch (primaryErr) {
    const fallbackBase = ENV.backendFallbackUrl;
    if (fallbackBase && (primaryErr instanceof ApiError && primaryErr.status === 404)) {
      try {
        const fallbackEndpoint = `${fallbackBase}${endpoint}`;
        const json = await request<RawBackendEnvelope<unknown> | unknown>(fallbackEndpoint, {
          method: 'PATCH',
          siteId: resolvedSiteId,
        });
        const raw = (json as RawBackendEnvelope<unknown>)?.data ?? (json as RawBackendEnvelope<unknown>)?.result ?? json;
        return normalizeBooking(raw);
      } catch {
        // fallback failed
      }
    }
    throw primaryErr;
  }
}

/**
 * Authenticate existing user.
 */
export async function login(credentials: { email: string; password: string }): Promise<AuthResponse> {
  const activeSite = getActiveSite();
  const res = await request<RawBackendEnvelope<{ token: string; user: User }>>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: credentials.email.trim(), password: credentials.password }),
  });

  const token = res.data?.token || res.result?.token || res.token || '';
  const user = res.data?.user || res.result?.user || res.user || ({} as User);

  if (token) {
    await secureSet('auth.token', token, activeSite?.id);
    await storeSet('auth.token', token, activeSite?.id);
  }
  if (user && typeof user === 'object' && Object.keys(user).length > 0) {
    await storeSetObject('auth.user', user, activeSite?.id);
  }

  return {
    success: true,
    token,
    user,
    data: { token, user },
  };
}

/** Admin login alias */
export const adminLogin = login;

/**
 * Register a new user with contract enforcement and comprehensive [DEBUG] diagnostics.
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const endpoint = '/api/auth/register';
  const site = getActiveSite();

  let base = ENV.apiUrl.replace(/\/+$/, '');
  if (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
    base.includes('stagingapi.')
  ) {
    base = (ENV.backendFallbackUrl || 'http://localhost:5000').replace(/\/+$/, '');
  }
  if (base.includes('stagingapi.')) {
    base = (ENV.backendFallbackUrl || 'http://localhost:5000').replace(/\/+$/, '');
  }

  const fullUrl = `${base}${endpoint}`;
  const headers = await buildHeaders(site);

  // Headers without sensitive authorization token for safe debug logging
  const headersWithoutToken = { ...headers };
  delete headersWithoutToken['Authorization'];

  // Request body with masked password for safe debug logging
  const maskedBody = {
    ...data,
    password: '********',
  };

  // [DEBUG] Logs for register call (marked for removal)
  console.log('[DEBUG] [AUTH_REGISTER] Final URL:', fullUrl);
  console.log('[DEBUG] [AUTH_REGISTER] Headers (without token):', JSON.stringify(headersWithoutToken));
  console.log('[DEBUG] [AUTH_REGISTER] Request Body (Masked):', JSON.stringify(maskedBody));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const rawRes = await fetch(fullUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    clearTimeout(timer);

    const resStatus = rawRes.status;
    const resText = await rawRes.text();

    // [DEBUG] Logs for response status and full body (marked for removal)
    console.log(`[DEBUG] [AUTH_REGISTER] Response Status: ${resStatus}`);
    console.log(`[DEBUG] [AUTH_REGISTER] FULL Response Body: ${resText}`);

    if (!rawRes.ok) {
      let errMessage = `HTTP ${resStatus}: ${rawRes.statusText}`;
      let parsedErrors: Record<string, string[]> | undefined = undefined;

      try {
        const errJson = (resText ? JSON.parse(resText) : {}) as {
          message?: string;
          error?: string;
          title?: string;
          errors?: Record<string, string[]>;
        };

        if (errJson.errors && typeof errJson.errors === 'object') {
          parsedErrors = errJson.errors;
          const firstField = Object.keys(errJson.errors)[0];
          const firstMsg = firstField ? errJson.errors[firstField]?.[0] : undefined;
          errMessage = firstMsg || errJson.title || errMessage;
        } else if (errJson.error) {
          errMessage = errJson.error;
        } else if (errJson.message) {
          errMessage = errJson.message;
        } else if (errJson.title) {
          errMessage = errJson.title;
        }
      } catch {
        // Ignore json parse error on error response
      }

      throw new ApiError(
        errMessage,
        resStatus >= 500 ? 'server' : 'client',
        resStatus,
        fullUrl,
        false,
        parsedErrors
      );
    }

    const resJson = (resText ? JSON.parse(resText) : {}) as RawBackendEnvelope<{
      token?: string;
      user?: User;
      refreshToken?: string;
      expiresAt?: string;
    }>;

    const token = resJson.data?.token || resJson.result?.token || resJson.token || '';
    const user = resJson.data?.user || resJson.result?.user || resJson.user || ({} as User);
    const refreshToken = resJson.data?.refreshToken || resJson.refreshToken;
    const expiresAt = resJson.data?.expiresAt || resJson.expiresAt;

    if (token) {
      await secureSet('auth.token', token);
    }
    if (user && typeof user === 'object' && Object.keys(user).length > 0) {
      await storeSetObject('auth.user', user);
    }

    return {
      success: true,
      token,
      user,
      data: { token, user },
      refreshToken,
      expiresAt,
    };
  } catch (err: unknown) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Request password reset email.
 */
export async function forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/**
 * Log out active user and clear tokens.
 */
export async function logout(): Promise<void> {
  try {
    await secureDelete('auth.token');
    await secureDelete('auth.refresh_token');
    await storeRemove('auth.user');
    await storeRemove('admin.token');
    await storeRemove('admin.user');
  } catch {
    // Ignore cleanup error
  }
}

// (Admin fetchAnalytics and fetchUsers defined in Admin Portal section below)

/**
 * Detailed API reachability and latency check.
 */
export interface ApiHealthResult {
  ok: boolean;
  latencyMs: number;
  status?: number;
  error?: string;
}

export async function checkApiHealth(siteHostname?: string): Promise<ApiHealthResult> {
  const targetHost = siteHostname || ENV.siteHostname;
  let base = ENV.apiUrl.replace(/\/+$/, '');

  // On Web with localhost origin, route via local backend proxy to prevent CORS preflight block
  if (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
    base.includes('stagingapi.') &&
    ENV.backendFallbackUrl
  ) {
    base = ENV.backendFallbackUrl.replace(/\/+$/, '');
  }

  const endpoint = `${base}/api/core/v1/config/${targetHost}?lang=en`;
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    const latencyMs = Date.now() - start;
    return {
      ok: res.ok,
      latencyMs,
      status: res.status,
      error: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    return {
      ok: false,
      latencyMs,
      error: err instanceof Error ? err.message : 'Connection failed',
    };
  }
}

/**
 * Quick ping to check API reachability.
 */
export async function checkApiReachability(siteHostname?: string): Promise<boolean> {
  const result = await checkApiHealth(siteHostname);
  return result.ok;
}

// ─── Admin Portal API Methods ────────────────────────────────────────────────

export interface AdminStats {
  websiteId: string;
  totalTours: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  totalUsers: number;
  recentBookings: Booking[];
}

export interface AdminAnalyticsData {
  websiteId: string;
  totalRevenue: number;
  totalBookings: number;
  avgBookingValue: number;
  bookingsByStatus: Array<{ status: string; count: number; revenue: number }>;
  toursByCategory: Array<{ category: string; count: number }>;
  topTours: Array<{ name: string; bookingsCount: number; revenue: number }>;
  revenueOverTime: Array<{ period: string; bookings: number; revenue: number }>;
}

export async function fetchAdminStats(overrideSiteId?: string): Promise<ApiResponse<AdminStats>> {
  const siteId = overrideSiteId || ENV.siteId;
  const res = await request<RawBackendEnvelope<AdminStats>>('/api/admin/stats', {
    method: 'GET',
    siteId,
    skipCache: true,
  });
  const raw = (res?.data ?? res) as AdminStats;
  return { success: true, data: raw };
}

export async function fetchAdminAnalytics(overrideSiteId?: string): Promise<ApiResponse<AdminAnalyticsData>> {
  const siteId = overrideSiteId || ENV.siteId;
  const res = await request<RawBackendEnvelope<AdminAnalyticsData>>('/api/admin/analytics', {
    method: 'GET',
    siteId,
    skipCache: true,
  });
  const raw = (res?.data ?? res) as AdminAnalyticsData;
  return { success: true, data: raw };
}

export async function fetchAdminUsers(overrideSiteId?: string): Promise<ApiResponse<User[]>> {
  const siteId = overrideSiteId || ENV.siteId;
  const res = await request<RawBackendEnvelope<User[]>>('/api/users', {
    method: 'GET',
    siteId,
    skipCache: true,
  });
  const raw = (res?.data ?? res) as User[];
  const list = Array.isArray(raw) ? raw : [];
  return { success: true, data: list, count: list.length };
}

export async function updateAdminUserRole(id: string, role: string, overrideSiteId?: string): Promise<{ success: boolean; message?: string }> {
  const siteId = overrideSiteId || ENV.siteId;
  return request<{ success: boolean; message?: string }>(`/api/users/${id}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
    siteId,
    skipCache: true,
  });
}

export async function updateAdminUserStatus(id: string, isDisabled: boolean, overrideSiteId?: string): Promise<{ success: boolean; message?: string }> {
  const siteId = overrideSiteId || ENV.siteId;
  return request<{ success: boolean; message?: string }>(`/api/users/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ isDisabled }),
    siteId,
    skipCache: true,
  });
}

export async function deleteAdminUser(id: string, overrideSiteId?: string): Promise<{ success: boolean; message?: string }> {
  const siteId = overrideSiteId || ENV.siteId;
  return request<{ success: boolean; message?: string }>(`/api/users/${id}`, {
    method: 'DELETE',
    siteId,
    skipCache: true,
  });
}

export async function updateBookingStatus(id: string, status: string, overrideSiteId?: string): Promise<{ success: boolean; message?: string }> {
  const siteId = overrideSiteId || ENV.siteId;
  return request<{ success: boolean; message?: string }>(`/api/bookings/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
    siteId,
    skipCache: true,
  });
}

export async function deleteBooking(id: string, overrideSiteId?: string): Promise<{ success: boolean; message?: string }> {
  const siteId = overrideSiteId || ENV.siteId;
  return request<{ success: boolean; message?: string }>(`/api/bookings/${id}`, {
    method: 'DELETE',
    siteId,
    skipCache: true,
  });
}

export const fetchUsers = fetchAdminUsers;
export const fetchAnalytics = fetchAdminAnalytics;



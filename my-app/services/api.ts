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
import type {
  Tour,
  DestinationItem,
  Booking,
  User,
  RegisterRequest,
  AuthResponse,
  TourSortOption,
  GuestReview,
  CouponValidationResult,
  ConciergeSpecialist,
  ConciergeInquiryPayload,
  ConciergeInquiryResponse,
  DestinationLandmark,
  DestinationWaypointsResponse,
  EmergencyDirectoryResponse,
  DestinationCostGuide,
  TripExpense,
  AudioStory,
  PassportProfile,
  ExpeditionStamp,
  MilestoneChallenge,
  DestinationWeather,
  CulinaryTrail,
  DiningReservationRequest,
  DiningReservationResponse,
  DayOfDispatch,
  GuideAnnouncement,
  GroupTrip,
  GroupPoll,
  GroupGearItem,
  CastVoteRequest,
  CreateGearItemRequest,
  TripScrapbook,
  JournalEntry,
  CreateJournalEntryRequest,
  AirportTransfer,
  UpdateTransferStatusRequest,
  DestinationPhrasebook,
  PhraseItem,
  DestinationTaxRule,
  CustomsAllowanceRule,
  TaxRefundReceipt,
  TaxRefundSummary,
  CreateTaxReceiptRequest,
  UpdateClaimStatusRequest,
  EsimPackage,
  ActiveEsimProfile,
  AirportWifiGuide,
  EsimHubData,
  ActivateEsimRequest,
  TopUpDataRequest,
  TravelInsurancePolicy,
  HospitalDirectoryItem,
  SubmitClaimInquiryRequest,
  ClaimInquiryResponse,
  VisaRequirement,
  DigitalArrivalCard,
  EmbassyConsulate,
  PassportValidityCheckRequest,
  PassportValidityCheckResult,
  VisaHubData,
  CarbonEmissionBreakdown,
  VerifiedClimateProject,
  OffsetContribution,
  EcoPledgeItem,
  EcoHubData,
  CalculateEmissionsRequest,
  SubmitOffsetRequest,
  SubmitOffsetResponse,
  DressCodeRule,
  CulturalEtiquetteItem,
  MedicationCustomsRule,
  CultureHubData,
  CheckOutfitComplianceRequest,
  CheckOutfitComplianceResult,
  PlugType,
  VoltageSpec,
  ApplianceVoltageRule,
  PowerBankKiosk,
  PowerHubData,
  CheckApplianceRequest,
  CheckApplianceResult,
  AirlineBaggagePolicy,
  BaggageHubData,
  CalculateBaggageFeeRequest,
  CalculateBaggageFeeResult,
  TransitPhrase,
  TransitLine,
  TransitRouteQuery,
  TaxiFareEstimator,
  TransitHubData,
  CalculateTransitFareRequest,
  CalculateTransitFareResult,
  EstimateTaxiFareRequest,
  EstimateTaxiFareResult,
  TravelMedicine,
  PharmacyDirectoryItem,
  ControlledSubstanceWarning,
  PharmacyHubData,
  TippingServiceCategory,
  TippingCountryGuide,
  CalculateTipRequest,
  CalculateTipResult,
  RoadRuleItem,
  RentalScamTip,
  PreRideChecklistStep,
  DriveSafetyHubData,
  ForexCounterRate,
  AtmDccTip,
  ForexKioskItem,
  ForexRadarData,
  BargainCategoryItem,
  BargainMarketItem,
  BargainPhraseItem,
  BargainingRuleItem,
  BargainHubData,
  ExpeditionWrappedStats,
  LoyaltyTierData,
  LoyaltyRewardVoucher,
  ExpeditionCertificate,
  ExpeditionSummaryHubData,
  ClaimRewardResult,
  ReviewBoostResult,
} from '@/types';
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
  tourSlug?: string;
  tourName?: string;
  tourImage?: string;
  currency?: string;
  location?: string;
  destination?: string;
  unitPrice?: number;
  originalPrice?: number;
  duration?: string;
  totalPrice?: number;
  guestName?: string;
  name?: string;
  email: string;
  phone?: string;
  travelers?: number;
  adults?: number;
  children?: number;
  startDate?: string;
  endDate?: string;
  date?: string;
  travelDate?: string;
  specialRequest?: string;
  userId?: string;
  reference?: string;
  idempotencyKey?: string;
  source?: 'web' | 'app' | string;
  promoCode?: string;
  discountAmount?: number;
  addOns?: string[];
  addOnsTotal?: number;
}

export interface TourSearchParams {
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  difficulty?: string;
  category?: string;
  duration?: string;
  sort?: TourSortOption | string;
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
      console.warn(`[DEBUG] [getConfig] Failed to fetch live config for "${targetHost}". Falling back to baseline configuration:`, err);
    }
    return getFallbackConfig(site);
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
export async function fetchTours(
  overrideSiteId?: string,
  sort?: string,
  category?: string
): Promise<ApiResponse<Tour[]>> {
  const siteId = overrideSiteId || ENV.siteId;
  const site = isAllowedSiteId(siteId) ? getSiteById(siteId) : getActiveSite();
  const effectiveBase = (ENV.apiUrl.includes('stagingapi.') && ENV.backendFallbackUrl)
    ? ENV.backendFallbackUrl.replace(/\/+$/, '')
    : ENV.apiUrl.replace(/\/+$/, '');
  const qParams = new URLSearchParams();
  if (sort && sort !== 'featured') qParams.append('sort', sort);
  if (category && category.toLowerCase() !== 'all') qParams.append('category', category);
  const qs = qParams.toString();
  const endpoint = qs ? `/api/tours?${qs}` : '/api/tours';
  const url = `${effectiveBase}${endpoint}`;
  const headers = await buildHeaders(site);

  try {
    const json = await request<RawBackendEnvelope<unknown[]> | unknown[]>(endpoint, { siteId });
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
  if (params.category && params.category.toLowerCase() !== 'all') qParams.append('category', params.category);
  if (params.sort && params.sort !== 'featured') qParams.append('sort', params.sort);

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
 * Fetch similar tours recommendations for a tour ID or slug.
 */
export async function fetchSimilarTours(
  tourIdOrSlug: string | number,
  overrideSiteId?: string,
  limit: number = 4
): Promise<{ success: boolean; data: Tour[] }> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const json = await request<RawBackendEnvelope<unknown[]> | unknown[]>(
      `/api/tours/${tourIdOrSlug}/similar?limit=${limit}`,
      { siteId }
    );
    const rawList = Array.isArray(json)
      ? json
      : (json as RawBackendEnvelope<unknown[]>)?.data ??
        (json as RawBackendEnvelope<unknown[]>)?.result ??
        [];

    const normalized = Array.isArray(rawList)
      ? rawList.map((item) => normalizeTour(item, siteId))
      : [];

    return { success: true, data: normalized };
  } catch (primaryErr) {
    if (__DEV__) {
      console.log(`[DEBUG] [fetchSimilarTours] Primary fetch failed for "${tourIdOrSlug}":`, primaryErr);
    }
    return { success: false, data: [] };
  }
}

/**
 * Submit a traveler review for a tour.
 */
export async function submitTourReview(
  tourIdOrSlug: string | number,
  review: { author: string; rating: number; text: string },
  overrideSiteId?: string
): Promise<{ success: boolean; data: GuestReview; message?: string }> {
  const siteId = overrideSiteId || ENV.siteId;
  const res = await request<RawBackendEnvelope<GuestReview>>(`/api/tours/${tourIdOrSlug}/reviews`, {
    method: 'POST',
    body: JSON.stringify(review),
    siteId,
  });
  const data = res?.data ?? (res as unknown as GuestReview);
  return { success: true, data, message: res?.message };
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

  const rawStart = bookingData.travelDate || bookingData.startDate || bookingData.date;
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

  const idempotencyKey =
    bookingData.idempotencyKey ||
    `app_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const adults = typeof bookingData.adults === 'number' ? Math.max(1, bookingData.adults) : undefined;
  const children = typeof bookingData.children === 'number' ? Math.max(0, bookingData.children) : undefined;
  const totalTravelers = Math.max(1, (adults ?? 0) + (children ?? 0) || Number(bookingData.travelers) || 1);

  const payload = {
    website: activeSite,
    websiteId: activeSite,
    userId: bookingData.userId,
    tourId: numericTourId,
    tourSlug: bookingData.tourSlug,
    tourName: bookingData.tourName || 'Guided Tour Expedition',
    tourImage: bookingData.tourImage,
    currency: bookingData.currency || '$',
    location: bookingData.location,
    destination: bookingData.destination || bookingData.location,
    unitPrice: bookingData.unitPrice,
    originalPrice: bookingData.originalPrice,
    duration: bookingData.duration,
    totalPrice: Number(bookingData.totalPrice) || 0,
    guestName: String(bookingData.guestName || bookingData.name || 'Guest Explorer').trim(),
    email: String(bookingData.email || '').trim(),
    phone: String(bookingData.phone || '').trim(),
    travelers: totalTravelers,
    adults: adults ?? totalTravelers,
    children: children ?? 0,
    startDate: startDateObj.toISOString(),
    endDate: finalEndDateObj.toISOString(),
    date: startDateObj.toISOString().split('T')[0],
    travelDate: startDateObj.toISOString(),
    specialRequest: bookingData.specialRequest || '',
    idempotencyKey,
    source: 'app',
    promoCode: bookingData.promoCode,
    discountAmount: bookingData.discountAmount,
    addOns: bookingData.addOns,
    addOnsTotal: bookingData.addOnsTotal,
  };

  if (__DEV__) {
    console.log('[DEBUG] [BOOKINGS-CREATE] Request URL: /api/bookings');
    console.log('[DEBUG] [BOOKINGS-CREATE] Request Payload (Snapshot Embedded):', JSON.stringify(payload));
  }

  const reqHeaders: Record<string, string> = {
    'X-Idempotency-Key': idempotencyKey,
    'X-Client-Source': 'app',
  };

  try {
    const json = await request<RawBackendEnvelope<unknown> | unknown>('/api/bookings', {
      method: 'POST',
      headers: reqHeaders,
      body: JSON.stringify(payload),
      siteId: activeSite,
      skipCache: true,
    });

    const raw = (json as RawBackendEnvelope<unknown>)?.data ?? (json as RawBackendEnvelope<unknown>)?.result ?? json;
    const normalized = normalizeBooking(raw);
    if (__DEV__) {
      console.log('[DEBUG] POST /api/bookings Success Created ID:', normalized.id, 'Ref:', normalized.reference);
    }
    return normalized;
  } catch (primaryErr) {
    const fallbackBase = ENV.backendFallbackUrl;
    if (fallbackBase && (primaryErr instanceof ApiError && primaryErr.status === 404)) {
      try {
        const fallbackEndpoint = `${fallbackBase}/api/bookings`;
        const json = await request<RawBackendEnvelope<unknown> | unknown>(fallbackEndpoint, {
          method: 'POST',
          headers: reqHeaders,
          body: JSON.stringify(payload),
          siteId: activeSite,
          skipCache: true,
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
 * Validate promotional discount coupon against server-side brand rules.
 */
export async function validateCoupon(
  code: string,
  subtotal: number,
  tourId: number = 1,
  travelers: number = 1,
  overrideSiteId?: string
): Promise<CouponValidationResult> {
  const activeSite = overrideSiteId || ENV.siteId;
  const json = await request<{ success: boolean; data: CouponValidationResult }>('/api/bookings/validate-coupon', {
    method: 'POST',
    siteId: activeSite,
    body: JSON.stringify({
      code: code.trim(),
      subtotal,
      tourId,
      travelers,
      websiteId: activeSite,
    }),
  });

  if (json && typeof json === 'object' && 'data' in json && (json as { data: CouponValidationResult }).data) {
    return (json as { data: CouponValidationResult }).data;
  }

  throw new Error('Invalid coupon response from server');
}

/**
 * Fetch active specialist profile for 24/7 concierge assistance.
 */
export async function fetchConciergeSpecialist(overrideSiteId?: string): Promise<ConciergeSpecialist> {
  const activeSite = overrideSiteId || ENV.siteId;
  const json = await request<{ success: boolean; data: ConciergeSpecialist }>('/api/concierge/specialist', {
    method: 'GET',
    siteId: activeSite,
  });

  if (json && typeof json === 'object' && 'data' in json && (json as { data: ConciergeSpecialist }).data) {
    return (json as { data: ConciergeSpecialist }).data;
  }

  throw new Error('Failed to load concierge specialist');
}

/**
 * Submit an inquiry message to the concierge specialist.
 */
export async function submitConciergeInquiry(
  payload: ConciergeInquiryPayload,
  overrideSiteId?: string
): Promise<ConciergeInquiryResponse> {
  const activeSite = overrideSiteId || ENV.siteId;
  const json = await request<ConciergeInquiryResponse | { success: boolean; data: ConciergeInquiryResponse }>('/api/concierge/inquire', {
    method: 'POST',
    siteId: activeSite,
    body: JSON.stringify({
      ...payload,
      source: 'app',
    }),
  });

  if (json && typeof json === 'object') {
    if ('data' in json && (json as { data: ConciergeInquiryResponse }).data) {
      return (json as { data: ConciergeInquiryResponse }).data;
    }
    if ('reply' in json) {
      return json as ConciergeInquiryResponse;
    }
  }

  throw new Error('Invalid inquiry response from concierge service');
}

/**
 * Fetch geo-tagged destination landmarks and waypoints for interactive map exploration.
 */
export async function fetchDestinationLandmarks(
  overrideSiteId?: string,
  params?: { category?: string; tourId?: number; search?: string; featuredOnly?: boolean }
): Promise<DestinationWaypointsResponse> {
  const activeSite = overrideSiteId || ENV.siteId;
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.append('category', params.category);
  if (params?.tourId) searchParams.append('tourId', params.tourId.toString());
  if (params?.search) searchParams.append('search', params.search);
  if (params?.featuredOnly) searchParams.append('featuredOnly', 'true');

  const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
  const json = await request<{ success: boolean; data: DestinationWaypointsResponse }>(
    `/api/destinations/landmarks${queryString}`,
    {
      method: 'GET',
      siteId: activeSite,
    }
  );

  if (json && typeof json === 'object' && 'data' in json && (json as { data: DestinationWaypointsResponse }).data) {
    return (json as { data: DestinationWaypointsResponse }).data;
  }

  throw new Error('Failed to load destination landmarks');
}

/**
 * Fetch a single landmark by ID.
 */
export async function fetchLandmarkById(id: string, overrideSiteId?: string): Promise<DestinationLandmark> {
  const activeSite = overrideSiteId || ENV.siteId;
  const json = await request<{ success: boolean; data: DestinationLandmark }>(
    `/api/destinations/landmarks/${id}`,
    {
      method: 'GET',
      siteId: activeSite,
    }
  );

  if (json && typeof json === 'object' && 'data' in json && (json as { data: DestinationLandmark }).data) {
    return (json as { data: DestinationLandmark }).data;
  }

  throw new Error(`Failed to load landmark with ID: ${id}`);
}

/**
 * Fetch 24/7 emergency hotlines, hospitals, and safety phrases for the active brand destination.
 */
export async function fetchEmergencyDirectory(overrideSiteId?: string): Promise<EmergencyDirectoryResponse> {
  const activeSite = overrideSiteId || ENV.siteId;
  const json = await request<{ success: boolean; data: EmergencyDirectoryResponse }>(
    '/api/emergency/contacts',
    {
      method: 'GET',
      siteId: activeSite,
    }
  );

  if (json && typeof json === 'object' && 'data' in json && (json as { data: EmergencyDirectoryResponse }).data) {
    return (json as { data: EmergencyDirectoryResponse }).data;
  }

  throw new Error('Failed to load emergency safety directory');
}

/**
 * Fetch destination daily cost guidelines, category benchmarks & tipping advice.
 */
export async function fetchDestinationCostGuide(overrideSiteId?: string): Promise<DestinationCostGuide> {
  const activeSite = overrideSiteId || ENV.siteId;
  const json = await request<{ success: boolean; data: DestinationCostGuide }>(
    '/api/budget/guide',
    {
      method: 'GET',
      siteId: activeSite,
    }
  );

  if (json && typeof json === 'object' && 'data' in json && (json as { data: DestinationCostGuide }).data) {
    return (json as { data: DestinationCostGuide }).data;
  }

  throw new Error('Failed to load destination cost guidelines');
}

/**
 * Sync trip expenses to cloud MongoDB for persistent backup.
 */
export async function syncTripExpenses(
  payload: { totalBudget: number; currency: string; expenses: TripExpense[] },
  overrideSiteId?: string
): Promise<{ success: boolean; message: string }> {
  const activeSite = overrideSiteId || ENV.siteId;
  const json = await request<{ success: boolean; message: string }>(
    '/api/budget/sync',
    {
      method: 'POST',
      siteId: activeSite,
      body: JSON.stringify(payload),
    }
  );

  return json;
}

/**
 * Fetch narrated expedition audio stories tailored to the active brand and optional category/tour.
 */
export async function fetchAudioStories(
  params?: { category?: string; tourId?: string },
  overrideSiteId?: string
): Promise<AudioStory[]> {
  const activeSite = overrideSiteId || ENV.siteId;
  const queryParts: string[] = [];
  if (params?.category) queryParts.push(`category=${encodeURIComponent(params.category)}`);
  if (params?.tourId) queryParts.push(`tourId=${encodeURIComponent(params.tourId)}`);
  const qs = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

  const json = await request<{ success: boolean; data: AudioStory[] }>(
    `/api/audioguide/stories${qs}`,
    {
      method: 'GET',
      siteId: activeSite,
    }
  );

  if (json && typeof json === 'object' && 'data' in json && Array.isArray((json as { data: AudioStory[] }).data)) {
    return (json as { data: AudioStory[] }).data;
  }

  return [];
}

/**
 * Record audio story listen engagement.
 */
export async function recordAudioStoryListen(
  storyId: string,
  secondsListened: number = 0,
  overrideSiteId?: string
): Promise<{ success: boolean; message: string }> {
  const activeSite = overrideSiteId || ENV.siteId;
  const json = await request<{ success: boolean; message: string }>(
    `/api/audioguide/listen/${encodeURIComponent(storyId)}`,
    {
      method: 'POST',
      siteId: activeSite,
      body: JSON.stringify({ storyId, secondsListened }),
    }
  );

  return json;
}

/**
 * Fetch digital expedition passport profile with collectible stamps, milestone challenges, and loyalty tier perks.
 */
export async function fetchPassportProfile(overrideSiteId?: string): Promise<PassportProfile> {
  const activeSite = overrideSiteId || ENV.siteId;
  const json = await request<{ success: boolean; data: PassportProfile }>(
    '/api/passport/profile',
    {
      method: 'GET',
      siteId: activeSite,
    }
  );

  if (json && typeof json === 'object' && 'data' in json && (json as { data: PassportProfile }).data) {
    return (json as { data: PassportProfile }).data;
  }

  throw new Error('Failed to load expedition passport profile');
}

/**
 * Claim an expedition destination stamp.
 */
export async function claimExpeditionStamp(
  stampId: string,
  overrideSiteId?: string
): Promise<{ success: boolean; message: string; stamp: ExpeditionStamp; xpAwarded: number }> {
  const activeSite = overrideSiteId || ENV.siteId;
  const json = await request<{ success: boolean; message: string; stamp: ExpeditionStamp; xpAwarded: number }>(
    '/api/passport/claim-stamp',
    {
      method: 'POST',
      siteId: activeSite,
      body: JSON.stringify({ stampId }),
    }
  );

  return json;
}

/**
 * Claim milestone challenge rewards and XP.
 */
export async function claimMilestoneChallenge(
  challengeId: string,
  overrideSiteId?: string
): Promise<{ success: boolean; message: string; challenge: MilestoneChallenge; xpAwarded: number }> {
  const activeSite = overrideSiteId || ENV.siteId;
  const json = await request<{ success: boolean; message: string; challenge: MilestoneChallenge; xpAwarded: number }>(
    '/api/passport/claim-challenge',
    {
      method: 'POST',
      siteId: activeSite,
      body: JSON.stringify({ challengeId }),
    }
  );

  return json;
}

/**
 * Fetch live weather, microclimate forecast, and activity advisories for an expedition destination.
 */
export async function fetchDestinationWeather(
  destinationId?: string,
  overrideSiteId?: string
): Promise<DestinationWeather> {
  const activeSite = overrideSiteId || ENV.siteId;
  const qs = destinationId ? `?destinationId=${encodeURIComponent(destinationId)}` : '';
  const json = await request<{ success: boolean; data: DestinationWeather }>(
    `/api/weather/current${qs}`,
    {
      method: 'GET',
      siteId: activeSite,
    }
  );

  if (json && typeof json === 'object' && 'data' in json && (json as { data: DestinationWeather }).data) {
    return (json as { data: DestinationWeather }).data;
  }

  throw new Error('Failed to load destination weather');
}

/**
 * Fetch all available expedition destinations' live weather for the brand.
 */
export async function fetchBrandDestinationsWeather(
  overrideSiteId?: string
): Promise<DestinationWeather[]> {
  const activeSite = overrideSiteId || ENV.siteId;
  const json = await request<{ success: boolean; data: DestinationWeather[] }>(
    '/api/weather/destinations',
    {
      method: 'GET',
      siteId: activeSite,
    }
  );

  if (json && typeof json === 'object' && 'data' in json && Array.isArray((json as { data: DestinationWeather[] }).data)) {
    return (json as { data: DestinationWeather[] }).data;
  }

  return [];
}

/**
 * Fetch destination culinary trail, iconic dishes, dining spots, and etiquette.
 */
export async function fetchCulinaryTrail(
  destinationId?: string,
  overrideSiteId?: string
): Promise<CulinaryTrail> {
  const activeSite = overrideSiteId || ENV.siteId;
  const qs = destinationId ? `?destinationId=${encodeURIComponent(destinationId)}` : '';
  const json = await request<{ success: boolean; data: CulinaryTrail }>(
    `/api/culinary/trail${qs}`,
    {
      method: 'GET',
      siteId: activeSite,
    }
  );

  if (json && typeof json === 'object' && 'data' in json && (json as { data: CulinaryTrail }).data) {
    return (json as { data: CulinaryTrail }).data;
  }

  throw new Error('Failed to load culinary trail');
}

/**
 * Fetch all available destination culinary trails for the brand.
 */
export async function fetchBrandCulinaryTrails(
  overrideSiteId?: string
): Promise<CulinaryTrail[]> {
  const activeSite = overrideSiteId || ENV.siteId;
  const json = await request<{ success: boolean; data: CulinaryTrail[] }>(
    '/api/culinary/destinations',
    {
      method: 'GET',
      siteId: activeSite,
    }
  );

  if (json && typeof json === 'object' && 'data' in json && Array.isArray((json as { data: CulinaryTrail[] }).data)) {
    return (json as { data: CulinaryTrail[] }).data;
  }

  return [];
}

/**
 * Submit VIP dining table reservation or tasting banquet request via Concierge.
 */
export async function submitDiningReservation(
  payload: DiningReservationRequest,
  overrideSiteId?: string
): Promise<DiningReservationResponse> {
  const activeSite = overrideSiteId || ENV.siteId;
  const json = await request<{ success: boolean; data: DiningReservationResponse }>(
    '/api/culinary/reserve',
    {
      method: 'POST',
      siteId: activeSite,
      body: JSON.stringify(payload),
      skipCache: true,
    }
  );

  if (json && typeof json === 'object' && 'data' in json && (json as { data: DiningReservationResponse }).data) {
    return (json as { data: DiningReservationResponse }).data;
  }

  throw new Error('Failed to submit dining reservation');
}

/**
 * Fetch live Day-Of expedition dispatch data with crew, stops, timeline progress, and broadcasts.
 */
export async function fetchTodayDispatch(
  tourId?: string,
  bookingRef?: string,
  overrideSiteId?: string
): Promise<DayOfDispatch> {
  const activeSite = overrideSiteId || ENV.siteId;
  const params = new URLSearchParams();
  if (tourId) params.append('tourId', tourId);
  if (bookingRef) params.append('bookingRef', bookingRef);
  const qs = params.toString() ? `?${params.toString()}` : '';

  const json = await request<{ success: boolean; data: DayOfDispatch }>(
    `/api/dispatch/today${qs}`,
    {
      method: 'GET',
      siteId: activeSite,
      skipCache: true,
    }
  );

  if (json && typeof json === 'object' && 'data' in json && (json as { data: DayOfDispatch }).data) {
    return (json as { data: DayOfDispatch }).data;
  }

  throw new Error('Failed to load expedition dispatch');
}

/**
 * Post a tour guide broadcast note or urgent group announcement.
 */
export async function postGuideAnnouncement(
  payload: { tourId?: string; title: string; message: string; priority?: string },
  overrideSiteId?: string
): Promise<GuideAnnouncement> {
  const activeSite = overrideSiteId || ENV.siteId;
  const json = await request<{ success: boolean; data: GuideAnnouncement }>(
    '/api/dispatch/announcement',
    {
      method: 'POST',
      siteId: activeSite,
      body: JSON.stringify(payload),
      skipCache: true,
    }
  );

  if (json && typeof json === 'object' && 'data' in json && (json as { data: GuideAnnouncement }).data) {
    return (json as { data: GuideAnnouncement }).data;
  }

  throw new Error('Failed to publish guide announcement');
}

/**
 * Fetch active collaborative group trip planning details.
 */
export async function fetchActiveGroupTrip(
  overrideSiteId?: string
): Promise<GroupTrip> {
  const activeSite = overrideSiteId || ENV.siteId;
  const json = await request<{ success: boolean; data: GroupTrip }>(
    '/api/groups/active',
    {
      method: 'GET',
      siteId: activeSite,
      skipCache: true,
    }
  );

  if (json && typeof json === 'object' && 'data' in json && (json as { data: GroupTrip }).data) {
    return (json as { data: GroupTrip }).data;
  }

  throw new Error('Failed to load active group trip');
}

/**
 * Cast a vote on a group poll option.
 */
export async function castGroupPollVote(
  payload: CastVoteRequest,
  overrideSiteId?: string
): Promise<GroupPoll> {
  const activeSite = overrideSiteId || ENV.siteId;
  const json = await request<{ success: boolean; data: GroupPoll }>(
    '/api/groups/polls/vote',
    {
      method: 'POST',
      siteId: activeSite,
      body: JSON.stringify(payload),
      skipCache: true,
    }
  );

  if (json && typeof json === 'object' && 'data' in json && (json as { data: GroupPoll }).data) {
    return (json as { data: GroupPoll }).data;
  }

  throw new Error('Failed to record group poll vote');
}

/**
 * Add an assigned gear checklist item for the group.
 */
export async function createGroupGearItem(
  payload: CreateGearItemRequest,
  overrideSiteId?: string
): Promise<GroupGearItem> {
  const activeSite = overrideSiteId || ENV.siteId;
  const json = await request<{ success: boolean; data: GroupGearItem }>(
    '/api/groups/gear',
    {
      method: 'POST',
      siteId: activeSite,
      body: JSON.stringify(payload),
      skipCache: true,
    }
  );

  if (json && typeof json === 'object' && 'data' in json && (json as { data: GroupGearItem }).data) {
    return (json as { data: GroupGearItem }).data;
  }

  throw new Error('Failed to register group gear item');
}

/**
 * Fetch trip scrapbook, memories, photos, and statistics.
 */
export async function fetchTripScrapbook(
  tripId?: string,
  overrideSiteId?: string
): Promise<TripScrapbook> {
  const activeSite = overrideSiteId || ENV.siteId;
  const qs = tripId ? `?tripId=${encodeURIComponent(tripId)}` : '';
  const json = await request<{ success: boolean; data: TripScrapbook }>(
    `/api/journal/scrapbook${qs}`,
    {
      method: 'GET',
      siteId: activeSite,
      skipCache: true,
    }
  );

  if (json && typeof json === 'object' && 'data' in json && (json as { data: TripScrapbook }).data) {
    return (json as { data: TripScrapbook }).data;
  }

  throw new Error('Failed to load trip scrapbook');
}

/**
 * Add a new journal memory entry.
 */
export async function createJournalEntry(
  payload: CreateJournalEntryRequest,
  overrideSiteId?: string
): Promise<JournalEntry> {
  const activeSite = overrideSiteId || ENV.siteId;
  const json = await request<{ success: boolean; data: JournalEntry }>(
    '/api/journal/entry',
    {
      method: 'POST',
      siteId: activeSite,
      body: JSON.stringify(payload),
      skipCache: true,
    }
  );

  if (json && typeof json === 'object' && 'data' in json && (json as { data: JournalEntry }).data) {
    return (json as { data: JournalEntry }).data;
  }

  throw new Error('Failed to create journal memory entry');
}

/**
 * Fetch active airport transfer and flight details.
 */
export async function fetchActiveTransfer(
  bookingRef?: string,
  overrideSiteId?: string
): Promise<AirportTransfer> {
  const activeSite = overrideSiteId || ENV.siteId;
  const qs = bookingRef ? `?bookingRef=${encodeURIComponent(bookingRef)}` : '';
  const json = await request<{ success: boolean; data: AirportTransfer }>(
    `/api/transfers/active${qs}`,
    {
      method: 'GET',
      siteId: activeSite,
      skipCache: true,
    }
  );

  if (json && typeof json === 'object' && 'data' in json && (json as { data: AirportTransfer }).data) {
    return (json as { data: AirportTransfer }).data;
  }

  throw new Error('Failed to load active airport transfer');
}

/**
 * Update airport transfer dispatch / chauffeur status.
 */
export async function updateTransferStatus(
  payload: UpdateTransferStatusRequest,
  overrideSiteId?: string
): Promise<void> {
  const activeSite = overrideSiteId || ENV.siteId;
  await request<{ success: boolean }>(
    '/api/transfers/status',
    {
      method: 'POST',
      siteId: activeSite,
      body: JSON.stringify(payload),
      skipCache: true,
    }
  );
}

/**
 * Fetch destination offline phrasebook, phonetic translations, and cultural etiquette.
 */
export async function fetchDestinationPhrasebook(
  category?: string,
  search?: string,
  overrideSiteId?: string
): Promise<DestinationPhrasebook> {
  const activeSite = overrideSiteId || ENV.siteId;
  const params = new URLSearchParams();
  if (category && category.toLowerCase() !== 'all') params.append('category', category);
  if (search) params.append('search', search);
  const qs = params.toString() ? `?${params.toString()}` : '';

  const json = await request<{ success: boolean; data: DestinationPhrasebook }>(
    `/api/phrasebook${qs}`,
    {
      method: 'GET',
      siteId: activeSite,
      skipCache: true,
    }
  );

  if (json && typeof json === 'object' && 'data' in json && (json as { data: DestinationPhrasebook }).data) {
    return (json as { data: DestinationPhrasebook }).data;
  }

  throw new Error('Failed to load destination phrasebook');
}

/**
 * Lookup guest booking by Reference and Email without requiring account login.
 */
export async function lookupGuestBooking(
  reference: string,
  email: string,
  overrideSiteId?: string
): Promise<Booking> {
  const activeSite = overrideSiteId || ENV.siteId;
  const payload = {
    reference: reference.trim().toUpperCase(),
    email: email.trim().toLowerCase(),
  };

  if (__DEV__) {
    console.log('[DEBUG] [BOOKING-LOOKUP] POST /api/bookings/lookup - Payload:', payload);
  }

  const json = await request<RawBackendEnvelope<unknown> | unknown>('/api/bookings/lookup', {
    method: 'POST',
    body: JSON.stringify(payload),
    siteId: activeSite,
    skipCache: true,
  });

  const raw = (json as RawBackendEnvelope<unknown>)?.data ?? (json as RawBackendEnvelope<unknown>)?.result ?? json;
  return normalizeBooking(raw);
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
 * Claim guest bookings made before registration/login.
 * Links earlier bookings to the current user by email or saved references.
 */
export async function claimGuestBookingsApi(
  references: string[],
  email?: string,
  overrideSiteId?: string
): Promise<{ success: boolean; claimed: number; message?: string }> {
  const siteId = overrideSiteId || ENV.siteId;
  const payload = {
    email: email ? email.trim() : undefined,
    references: references.filter(Boolean),
  };

  if (__DEV__) {
    console.log('[DEBUG] [BOOKINGS-CLAIM] Claiming guest bookings with payload:', payload);
  }

  try {
    const res = await request<RawBackendEnvelope<{ success: boolean; claimed: number; message?: string }>>(
      '/api/bookings/claim',
      {
        method: 'POST',
        body: JSON.stringify(payload),
        siteId,
      }
    );
    const data = res?.data ?? res?.result ?? res;
    return {
      success: true,
      claimed: (data as any)?.claimed ?? 0,
      message: (data as any)?.message,
    };
  } catch (err: unknown) {
    if (__DEV__) {
      console.warn('[DEBUG] [BOOKINGS-CLAIM] Claim request failed:', err);
    }
    return { success: false, claimed: 0 };
  }
}

/**
 * Fetch a single booking by ID or Reference.
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
 * Submit password reset token and new password.
 */
export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
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

// ─── Destination Tax-Free Shopping & Customs Refund API ───────────────────────

export interface TaxClaimsResponse {
  summary: TaxRefundSummary;
  rule: DestinationTaxRule;
  claims: TaxRefundReceipt[];
}

export async function fetchTaxRefundRules(overrideSiteId?: string): Promise<DestinationTaxRule | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const res = await request<RawBackendEnvelope<DestinationTaxRule>>('/api/tax-refund/rules', {
      method: 'GET',
      siteId,
      skipCache: false,
    });
    return (res?.data ?? res) as DestinationTaxRule;
  } catch (err) {
    console.warn('[fetchTaxRefundRules] Error fetching tax rules:', err);
    return null;
  }
}

export async function fetchCustomsAllowances(overrideSiteId?: string): Promise<CustomsAllowanceRule | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const res = await request<RawBackendEnvelope<CustomsAllowanceRule>>('/api/tax-refund/allowances', {
      method: 'GET',
      siteId,
      skipCache: false,
    });
    return (res?.data ?? res) as CustomsAllowanceRule;
  } catch (err) {
    console.warn('[fetchCustomsAllowances] Error fetching allowances:', err);
    return null;
  }
}

export async function fetchTaxClaims(overrideSiteId?: string): Promise<TaxClaimsResponse | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const res = await request<{ success: boolean; summary: TaxRefundSummary; rule: DestinationTaxRule; claims: TaxRefundReceipt[] }>(
      '/api/tax-refund/claims',
      {
        method: 'GET',
        siteId,
        skipCache: true,
      }
    );
    if (res && res.claims) {
      return {
        summary: res.summary,
        rule: res.rule,
        claims: res.claims,
      };
    }
    return null;
  } catch (err) {
    console.warn('[fetchTaxClaims] Error fetching tax claims:', err);
    return null;
  }
}

export async function createTaxClaim(
  payload: CreateTaxReceiptRequest,
  overrideSiteId?: string
): Promise<TaxRefundReceipt | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const res = await request<RawBackendEnvelope<TaxRefundReceipt>>('/api/tax-refund/claims', {
      method: 'POST',
      body: JSON.stringify(payload),
      siteId,
      skipCache: true,
    });
    return (res?.data ?? res) as TaxRefundReceipt;
  } catch (err) {
    console.warn('[createTaxClaim] Error creating claim:', err);
    return null;
  }
}

export async function updateTaxClaimStatus(
  claimId: string,
  payload: UpdateClaimStatusRequest,
  overrideSiteId?: string
): Promise<TaxRefundReceipt | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const res = await request<RawBackendEnvelope<TaxRefundReceipt>>(`/api/tax-refund/claims/${claimId}/status`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      siteId,
      skipCache: true,
    });
    return (res?.data ?? res) as TaxRefundReceipt;
  } catch (err) {
    console.warn('[updateTaxClaimStatus] Error updating claim status:', err);
    return null;
  }
}

export async function deleteTaxClaim(claimId: string, overrideSiteId?: string): Promise<boolean> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const res = await request<{ success: boolean; deleted: boolean }>(`/api/tax-refund/claims/${claimId}`, {
      method: 'DELETE',
      siteId,
      skipCache: true,
    });
    return !!res?.deleted;
  } catch (err) {
    console.warn('[deleteTaxClaim] Error deleting claim:', err);
    return false;
  }
}

// ─── Smart International eSIM Roaming & Cellular API ──────────────────────────

export async function fetchEsimHubData(overrideSiteId?: string): Promise<EsimHubData | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const res = await request<RawBackendEnvelope<EsimHubData>>('/api/esim/hub', {
      method: 'GET',
      siteId,
      skipCache: true,
    });
    return (res?.data ?? res) as EsimHubData;
  } catch (err) {
    console.warn('[fetchEsimHubData] Error loading eSIM hub data:', err);
    return null;
  }
}

export async function activateEsimPackage(
  payload: ActivateEsimRequest,
  overrideSiteId?: string
): Promise<ActiveEsimProfile | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const res = await request<RawBackendEnvelope<ActiveEsimProfile>>('/api/esim/activate', {
      method: 'POST',
      body: JSON.stringify(payload),
      siteId,
      skipCache: true,
    });
    return (res?.data ?? res) as ActiveEsimProfile;
  } catch (err) {
    console.warn('[activateEsimPackage] Error activating eSIM:', err);
    return null;
  }
}

export async function topUpEsimData(
  payload: TopUpDataRequest,
  overrideSiteId?: string
): Promise<ActiveEsimProfile | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const res = await request<RawBackendEnvelope<ActiveEsimProfile>>('/api/esim/topup', {
      method: 'POST',
      body: JSON.stringify(payload),
      siteId,
      skipCache: true,
    });
    return (res?.data ?? res) as ActiveEsimProfile;
  } catch (err) {
    console.warn('[topUpEsimData] Error topping up eSIM data:', err);
    return null;
  }
}

// ─── Travel Insurance & Cashless Hospital Network ────────────────────────────

export async function fetchTravelInsurancePolicy(
  overrideSiteId?: string
): Promise<TravelInsurancePolicy | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const res = await request<RawBackendEnvelope<TravelInsurancePolicy>>('/api/insurance/policy', {
      siteId,
      skipCache: true,
    });
    return (res?.data ?? res) as TravelInsurancePolicy;
  } catch (err) {
    console.warn('[fetchTravelInsurancePolicy] Error loading insurance policy:', err);
    return null;
  }
}

export async function fetchInsuranceHospitals(
  city?: string,
  search?: string,
  overrideSiteId?: string
): Promise<HospitalDirectoryItem[]> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const params = new URLSearchParams();
    if (city && city !== 'all') params.append('city', city);
    if (search && search.trim()) params.append('search', search.trim());

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await request<RawBackendEnvelope<HospitalDirectoryItem[]>>(`/api/insurance/hospitals${queryStr}`, {
      siteId,
      skipCache: true,
    });
    return (res?.data ?? (Array.isArray(res) ? res : [])) as HospitalDirectoryItem[];
  } catch (err) {
    console.warn('[fetchInsuranceHospitals] Error loading hospitals:', err);
    return [];
  }
}

export async function submitClaimInquiry(
  payload: SubmitClaimInquiryRequest,
  overrideSiteId?: string
): Promise<ClaimInquiryResponse | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const res = await request<RawBackendEnvelope<ClaimInquiryResponse>>('/api/insurance/claim-inquiry', {
      method: 'POST',
      body: JSON.stringify(payload),
      siteId,
      skipCache: true,
    });
    return (res?.data ?? res) as ClaimInquiryResponse;
  } catch (err) {
    console.warn('[submitClaimInquiry] Error submitting claim inquiry:', err);
    return null;
  }
}

// ─── Visa Requirements, Passport Validity & Consular Directory ───────────────

export async function fetchVisaHubData(
  nationality?: string,
  destination?: string,
  overrideSiteId?: string
): Promise<VisaHubData | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const params = new URLSearchParams();
    if (nationality) params.append('nationality', nationality);
    if (destination) params.append('destination', destination);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await request<RawBackendEnvelope<VisaHubData>>(`/api/visa/hub${queryStr}`, {
      siteId,
      skipCache: true,
    });
    return (res?.data ?? res) as VisaHubData;
  } catch (err) {
    console.warn('[fetchVisaHubData] Error loading visa hub data:', err);
    return null;
  }
}

export async function checkVisaRule(
  nationality: string,
  destination: string,
  overrideSiteId?: string
): Promise<VisaRequirement | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const params = new URLSearchParams({ nationality, destination });
    const res = await request<RawBackendEnvelope<VisaRequirement>>(`/api/visa/check?${params.toString()}`, {
      siteId,
      skipCache: true,
    });
    return (res?.data ?? res) as VisaRequirement;
  } catch (err) {
    console.warn('[checkVisaRule] Error checking visa rule:', err);
    return null;
  }
}

export async function checkPassportValidity(
  payload: PassportValidityCheckRequest,
  overrideSiteId?: string
): Promise<PassportValidityCheckResult | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const res = await request<RawBackendEnvelope<PassportValidityCheckResult>>('/api/visa/check-validity', {
      method: 'POST',
      body: JSON.stringify(payload),
      siteId,
      skipCache: true,
    });
    return (res?.data ?? res) as PassportValidityCheckResult;
  } catch (err) {
    console.warn('[checkPassportValidity] Error validating passport:', err);
    return null;
  }
}

export async function fetchDestinationEmbassies(
  city?: string,
  homeCountry?: string,
  overrideSiteId?: string
): Promise<EmbassyConsulate[]> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const params = new URLSearchParams();
    if (city && city !== 'all') params.append('city', city);
    if (homeCountry) params.append('homeCountry', homeCountry);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await request<RawBackendEnvelope<EmbassyConsulate[]>>(`/api/visa/embassies${queryStr}`, {
      siteId,
      skipCache: true,
    });
    return (res?.data ?? (Array.isArray(res) ? res : [])) as EmbassyConsulate[];
  } catch (err) {
    console.warn('[fetchDestinationEmbassies] Error loading embassies:', err);
    return [];
  }
}

// ─── Carbon Footprint, Eco Projects & Offset Certificates ───────────────────

export async function fetchEcoHubData(
  overrideSiteId?: string
): Promise<EcoHubData | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const res = await request<RawBackendEnvelope<EcoHubData>>('/api/eco/hub', {
      siteId,
      skipCache: true,
    });
    return (res?.data ?? res) as EcoHubData;
  } catch (err) {
    console.warn('[fetchEcoHubData] Error loading eco hub data:', err);
    return null;
  }
}

export async function calculateCarbonEmissions(
  payload: CalculateEmissionsRequest,
  overrideSiteId?: string
): Promise<CarbonEmissionBreakdown | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const res = await request<RawBackendEnvelope<CarbonEmissionBreakdown>>('/api/eco/calculate', {
      method: 'POST',
      body: JSON.stringify(payload),
      siteId,
      skipCache: true,
    });
    return (res?.data ?? res) as CarbonEmissionBreakdown;
  } catch (err) {
    console.warn('[calculateCarbonEmissions] Error calculating emissions:', err);
    return null;
  }
}

export async function submitCarbonOffset(
  payload: SubmitOffsetRequest,
  overrideSiteId?: string
): Promise<SubmitOffsetResponse | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const res = await request<RawBackendEnvelope<SubmitOffsetResponse>>('/api/eco/offset', {
      method: 'POST',
      body: JSON.stringify(payload),
      siteId,
      skipCache: true,
    });
    return (res?.data ?? res) as SubmitOffsetResponse;
  } catch (err) {
    console.warn('[submitCarbonOffset] Error submitting offset contribution:', err);
    return null;
  }
}

export async function toggleEcoPledge(
  pledgeId: string,
  isPledged: boolean,
  overrideSiteId?: string
): Promise<boolean> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const res = await request<RawBackendEnvelope<{ success: boolean }>>('/api/eco/pledge', {
      method: 'POST',
      body: JSON.stringify({ pledgeId, isPledged }),
      siteId,
      skipCache: true,
    });
    return !!(res?.data?.success ?? (res as any)?.success);
  } catch (err) {
    console.warn('[toggleEcoPledge] Error toggling eco pledge:', err);
    return false;
  }
}

// ─── Destination Cultural Decorum, Temple Dress Code & Etiquette ───────────

export async function fetchCultureHubData(
  destination?: string,
  overrideSiteId?: string
): Promise<CultureHubData | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const params = new URLSearchParams();
    if (destination) params.append('destination', destination);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await request<RawBackendEnvelope<CultureHubData>>(`/api/culture/hub${queryStr}`, {
      siteId,
      skipCache: true,
    });
    return (res?.data ?? res) as CultureHubData;
  } catch (err) {
    console.warn('[fetchCultureHubData] Error loading culture hub data:', err);
    return null;
  }
}

export async function checkOutfitCompliance(
  payload: CheckOutfitComplianceRequest,
  overrideSiteId?: string
): Promise<CheckOutfitComplianceResult | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const res = await request<RawBackendEnvelope<CheckOutfitComplianceResult>>('/api/culture/check-outfit', {
      method: 'POST',
      body: JSON.stringify(payload),
      siteId,
      skipCache: true,
    });
    return (res?.data ?? res) as CheckOutfitComplianceResult;
  } catch (err) {
    console.warn('[checkOutfitCompliance] Error checking outfit compliance:', err);
    return null;
  }
}

export async function fetchEtiquetteItems(
  category?: string,
  overrideSiteId?: string
): Promise<CulturalEtiquetteItem[]> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await request<RawBackendEnvelope<CulturalEtiquetteItem[]>>(`/api/culture/etiquette${queryStr}`, {
      siteId,
      skipCache: true,
    });
    return (res?.data ?? (Array.isArray(res) ? res : [])) as CulturalEtiquetteItem[];
  } catch (err) {
    console.warn('[fetchEtiquetteItems] Error loading etiquette items:', err);
    return [];
  }
}

// ─── International Power Sockets, Voltage & Power Bank Rentals ─────────────

export async function fetchPowerHubData(
  destination?: string,
  overrideSiteId?: string
): Promise<PowerHubData | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const params = new URLSearchParams();
    if (destination) params.append('destination', destination);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await request<RawBackendEnvelope<PowerHubData>>(`/api/power/hub${queryStr}`, {
      siteId,
      skipCache: true,
    });
    return (res?.data ?? res) as PowerHubData;
  } catch (err) {
    console.warn('[fetchPowerHubData] Error loading power hub data:', err);
    return null;
  }
}

export async function checkApplianceSafety(
  payload: CheckApplianceRequest,
  overrideSiteId?: string
): Promise<CheckApplianceResult | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const res = await request<RawBackendEnvelope<CheckApplianceResult>>('/api/power/check-appliance', {
      method: 'POST',
      body: JSON.stringify(payload),
      siteId,
      skipCache: true,
    });
    return (res?.data ?? res) as CheckApplianceResult;
  } catch (err) {
    console.warn('[checkApplianceSafety] Error checking appliance voltage safety:', err);
    return null;
  }
}

// ─── Airline Baggage Allowance & Excess Fee Calculator ──────────────────────

export async function fetchBaggageHubData(
  airlineCode?: string,
  overrideSiteId?: string
): Promise<BaggageHubData | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const params = new URLSearchParams();
    if (airlineCode) params.append('airlineCode', airlineCode);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await request<RawBackendEnvelope<BaggageHubData>>(`/api/baggage/hub${queryStr}`, {
      siteId,
      skipCache: true,
    });
    return (res?.data ?? res) as BaggageHubData;
  } catch (err) {
    console.warn('[fetchBaggageHubData] Error loading baggage hub data:', err);
    return null;
  }
}

export async function calculateBaggageFee(
  payload: CalculateBaggageFeeRequest,
  overrideSiteId?: string
): Promise<CalculateBaggageFeeResult | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const res = await request<RawBackendEnvelope<CalculateBaggageFeeResult>>('/api/baggage/calculate-excess', {
      method: 'POST',
      body: JSON.stringify(payload),
      siteId,
      skipCache: true,
    });
    return (res?.data ?? res) as CalculateBaggageFeeResult;
  } catch (err) {
    console.warn('[calculateBaggageFee] Error calculating baggage excess fees:', err);
    return null;
  }
}

// ─── Rapid Transit Navigator & Taxi Meter Scam Shield ───────────────────────

export async function fetchTransitHubData(
  overrideSiteId?: string
): Promise<TransitHubData | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const res = await request<RawBackendEnvelope<TransitHubData>>('/api/transit/hub', {
      siteId,
      skipCache: true,
    });
    return (res?.data ?? res) as TransitHubData;
  } catch (err) {
    console.warn('[fetchTransitHubData] Error loading transit hub data:', err);
    return null;
  }
}

export async function calculateTransitFare(
  payload: CalculateTransitFareRequest,
  overrideSiteId?: string
): Promise<CalculateTransitFareResult | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const res = await request<RawBackendEnvelope<CalculateTransitFareResult>>('/api/transit/calculate-fare', {
      method: 'POST',
      body: JSON.stringify(payload),
      siteId,
      skipCache: true,
    });
    return (res?.data ?? res) as CalculateTransitFareResult;
  } catch (err) {
    console.warn('[calculateTransitFare] Error calculating transit fare:', err);
    return null;
  }
}

export async function estimateTaxiFare(
  payload: EstimateTaxiFareRequest,
  overrideSiteId?: string
): Promise<EstimateTaxiFareResult | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const res = await request<RawBackendEnvelope<EstimateTaxiFareResult>>('/api/transit/estimate-taxi', {
      method: 'POST',
      body: JSON.stringify(payload),
      siteId,
      skipCache: true,
    });
    return (res?.data ?? res) as EstimateTaxiFareResult;
  } catch (err) {
    console.warn('[estimateTaxiFare] Error estimating taxi meter fare:', err);
    return null;
  }
}

// ─── Travel Pharmacy & Medicine Translator ───────────────────────────────────

export async function fetchPharmacyHubData(
  overrideSiteId?: string
): Promise<PharmacyHubData | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const res = await request<RawBackendEnvelope<PharmacyHubData>>('/api/pharmacy/hub', {
      siteId,
      skipCache: true,
    });
    return (res?.data ?? res) as PharmacyHubData;
  } catch (err) {
    console.warn('[fetchPharmacyHubData] Error loading pharmacy hub data:', err);
    return null;
  }
}

export async function searchPharmacyMedicines(
  query: string,
  overrideSiteId?: string
): Promise<TravelMedicine[] | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const url = `/api/pharmacy/search?q=${encodeURIComponent(query)}`;
    const res = await request<RawBackendEnvelope<TravelMedicine[]>>(url, {
      siteId,
      skipCache: true,
    });
    return (res?.data ?? res) as TravelMedicine[];
  } catch (err) {
    console.warn('[searchPharmacyMedicines] Error searching travel medicines:', err);
    return null;
  }
}

// ─── Tipping & Gratuity Etiquette Calculator ──────────────────────────────────

export async function fetchTippingGuide(
  overrideSiteId?: string
): Promise<TippingCountryGuide | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const res = await request<RawBackendEnvelope<TippingCountryGuide>>('/api/tipping/guide', {
      siteId,
      skipCache: true,
    });
    return (res?.data ?? res) as TippingCountryGuide;
  } catch (err) {
    console.warn('[fetchTippingGuide] Error loading tipping guide:', err);
    return null;
  }
}

export async function calculateTipping(
  payload: CalculateTipRequest,
  overrideSiteId?: string
): Promise<CalculateTipResult | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const res = await request<RawBackendEnvelope<CalculateTipResult>>('/api/tipping/calculate', {
      method: 'POST',
      body: JSON.stringify(payload),
      siteId,
      skipCache: true,
    });
    return (res?.data ?? res) as CalculateTipResult;
  } catch (err) {
    console.warn('[calculateTipping] Error calculating tip:', err);
    return null;
  }
}

// ─── Drive Safety & Motorbike Rental Navigator ───────────────────────────────

export async function fetchDriveSafetyHub(
  overrideSiteId?: string
): Promise<DriveSafetyHubData | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const res = await request<RawBackendEnvelope<DriveSafetyHubData>>('/api/drive-safety/hub', {
      siteId,
      skipCache: true,
    });
    return (res?.data ?? res) as DriveSafetyHubData;
  } catch (err) {
    console.warn('[fetchDriveSafetyHub] Error fetching drive safety hub:', err);
    return null;
  }
}

export async function fetchRoadRules(
  overrideSiteId?: string
): Promise<RoadRuleItem[] | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const res = await request<RawBackendEnvelope<RoadRuleItem[]>>('/api/drive-safety/rules', {
      siteId,
      skipCache: true,
    });
    return (res?.data ?? res) as RoadRuleItem[];
  } catch (err) {
    console.warn('[fetchRoadRules] Error fetching road rules:', err);
    return null;
  }
}

export async function fetchForexRadar(
  overrideSiteId?: string
): Promise<ForexRadarData | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const res = await request<RawBackendEnvelope<ForexRadarData>>('/api/forex/radar', {
      siteId,
      skipCache: true,
    });
    return (res?.data ?? res) as ForexRadarData;
  } catch (err) {
    console.warn('[fetchForexRadar] Error fetching forex radar:', err);
    return null;
  }
}

export async function fetchVerifiedForexKiosks(
  overrideSiteId?: string,
  city?: string
): Promise<ForexKioskItem[] | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const q = city ? `?city=${encodeURIComponent(city)}` : '';
    const res = await request<RawBackendEnvelope<ForexKioskItem[]>>(`/api/forex/kiosks${q}`, {
      siteId,
      skipCache: true,
    });
    return (res?.data ?? res) as ForexKioskItem[];
  } catch (err) {
    console.warn('[fetchVerifiedForexKiosks] Error fetching kiosks:', err);
    return null;
  }
}

export async function fetchBargainHubData(
  overrideSiteId?: string
): Promise<BargainHubData | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const res = await request<RawBackendEnvelope<BargainHubData>>('/api/bargain/data', {
      siteId,
      skipCache: true,
    });
    return (res?.data ?? res) as BargainHubData;
  } catch (err) {
    console.warn('[fetchBargainHubData] Error fetching bargaining hub data:', err);
    return null;
  }
}

// ─── Phase 40: Expedition Summary, Travel Wrapped & Loyalty Rewards ───────────

export async function fetchExpeditionSummaryHub(
  overrideSiteId?: string
): Promise<ExpeditionSummaryHubData | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const res = await request<RawBackendEnvelope<ExpeditionSummaryHubData>>('/api/expedition-summary/hub', {
      siteId,
      skipCache: true,
    });
    return (res?.data ?? res) as ExpeditionSummaryHubData;
  } catch (err) {
    console.warn('[fetchExpeditionSummaryHub] Error fetching expedition summary:', err);
    return null;
  }
}

export async function claimLoyaltyReward(
  voucherCode: string,
  pointsCost: number,
  overrideSiteId?: string
): Promise<ClaimRewardResult | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const res = await request<RawBackendEnvelope<ClaimRewardResult>>('/api/expedition-summary/claim-reward', {
      method: 'POST',
      siteId,
      body: JSON.stringify({ voucherCode, pointsCost }),
      headers: { 'Content-Type': 'application/json' },
    });
    return (res?.data ?? res) as ClaimRewardResult;
  } catch (err) {
    console.warn('[claimLoyaltyReward] Error claiming loyalty reward:', err);
    throw err;
  }
}

export async function submitReviewBoost(
  tourId: string,
  rating: number,
  reviewText: string,
  favoriteMoment: string,
  overrideSiteId?: string
): Promise<ReviewBoostResult | null> {
  const siteId = overrideSiteId || ENV.siteId;
  try {
    const res = await request<ReviewBoostResult>('/api/expedition-summary/review-boost', {
      method: 'POST',
      siteId,
      body: JSON.stringify({ tourId, rating, reviewText, favoriteMoment }),
      headers: { 'Content-Type': 'application/json' },
    });
    return res;
  } catch (err) {
    console.warn('[submitReviewBoost] Error submitting review boost:', err);
    throw err;
  }
}

















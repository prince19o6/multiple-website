/**
 * shared/contracts/apiContracts.ts
 *
 * Single source of truth for ToursApp multi-tenant API contracts.
 * Mirrored across web (Next.js) and app (Expo mobile).
 * Ensures zero drift between web and mobile platform clients.
 */

export type SupportedTenantId = 'gujjutours' | 'tripgoasia' | 'technoheaven';
export type CanonicalModuleId =
  | 'hotels'
  | 'tours'
  | 'packages'
  | 'flights'
  | 'transfers'
  | 'visas'
  | 'restaurants'
  | 'buildpackage';

// ─── API Endpoints Map ─────────────────────────────────────────────────────────
export const API_ENDPOINTS = {
  // Core config & home
  CONFIG: (hostname: string) => `/api/core/v1/config/${encodeURIComponent(hostname)}`,
  HOME: (module: CanonicalModuleId, site?: string) =>
    `/api/core/v1/home?module=${encodeURIComponent(module)}${site ? `&site=${encodeURIComponent(site)}` : ''}`,

  // Module Listings & Details
  HOTELS: '/api/hotels',
  HOTEL_BY_SLUG: (slug: string) => `/api/hotels/${encodeURIComponent(slug)}`,
  HOTEL_COLLECTIONS: '/api/hotels/collections',

  TOURS: '/api/tours',
  TOUR_BY_SLUG: (slug: string) => `/api/tours/${encodeURIComponent(slug)}`,

  PACKAGES: '/api/packages',
  PACKAGE_BY_SLUG: (slug: string) => `/api/packages/${encodeURIComponent(slug)}`,

  FLIGHTS: '/api/flights',
  FLIGHT_BY_SLUG: (slug: string) => `/api/flights/${encodeURIComponent(slug)}`,
  FLIGHTS_AUTOCOMPLETE: '/api/flights/autocomplete',

  TRANSFERS: '/api/transfers',
  TRANSFER_BY_SLUG: (slug: string) => `/api/transfers/${encodeURIComponent(slug)}`,
  TRANSFERS_AUTOCOMPLETE: '/api/transfers/autocomplete',

  VISAS: '/api/visas',
  VISA_BY_SLUG: (slug: string) => `/api/visas/${encodeURIComponent(slug)}`,
  VISA_COUNTRIES: '/api/visas/countries',

  RESTAURANTS: '/api/restaurants',
  RESTAURANT_BY_SLUG: (slug: string) => `/api/restaurants/${encodeURIComponent(slug)}`,

  BUILDPACKAGE_OPTIONS: '/api/buildpackage/options',
  BUILDPACKAGE_BY_SLUG: (slug: string) => `/api/buildpackage/options/${encodeURIComponent(slug)}`,

  // Shared taxonomies
  CATEGORIES: (module?: string) =>
    module ? `/api/categories?module=${encodeURIComponent(module)}` : '/api/categories',
  DESTINATIONS: '/api/destinations',
  WEATHER_DESTINATIONS: '/api/weather/destinations',

  // Bookings & Auth
  BOOKINGS: '/api/bookings',
  MY_BOOKINGS: '/api/bookings/my',
  AUTH_LOGIN: '/api/auth/login',
  AUTH_REGISTER: '/api/auth/register',
  AUTH_REFRESH: '/api/auth/refresh',
  AUTH_ME: '/api/auth/me',
} as const;

// ─── Module Home Response Types ───────────────────────────────────────────────
export interface ModuleMetaContract {
  title: string;
  subtitle: string;
  badge?: string;
  searchModule?: string;
  citySectionTitle?: string;
  collectionTitle?: string;
  collectionSubtitle?: string;
  viewMoreUrl?: string;
}

export interface ModuleBannerContract {
  id: string;
  title: string;
  subtitle?: string;
  buttonText?: string;
  imageUrl?: string;
  link?: string;
  badge?: string;
  tag?: string;
}

export interface ModuleFeaturedItemContract {
  id: string;
  slug: string;
  title: string;
  category?: string;
  price?: number;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string;
  detailUrl?: string;
  badge?: string;
  duration?: string;
  stars?: number;
  city?: string;
  country?: string;
  airline?: string;
  flightNumber?: string;
  fromCity?: string;
  toCity?: string;
  departureTime?: string;
  arrivalTime?: string;
  stops?: string;
  vehicle?: string;
  capacity?: string;
  luggage?: string;
  processingTime?: string;
  validity?: string;
  entryType?: string;
  cuisine?: string;
  isVeg?: boolean;
  isJain?: boolean;
  costForTwo?: number;
  customizable?: boolean;
}

export interface ModuleCategoryItemContract {
  slug: string;
  name: string;
  title?: string;
  icon?: string;
  order?: number;
  module?: string;
}

export interface ModuleDestinationItemContract {
  id?: string;
  name: string;
  image?: string;
  toursCount?: number;
  country?: string;
}

export interface ModuleCuratedPackageItemContract {
  id: string;
  slug: string;
  title: string;
  days?: number;
  nights?: number;
  price?: number;
  rating?: number;
  imageUrl?: string;
  destinations?: string[];
}

export interface ModuleVideoItemContract {
  id: string;
  title: string;
  destination?: string;
  duration?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
}

export interface ModuleReviewItemContract {
  id: string;
  author: string;
  avatarUrl?: string;
  rating: number;
  text: string;
  date?: string;
}

export interface ModuleFaqItemContract {
  id: string;
  question: string;
  answer: string;
}

export interface ModuleHomePayloadContract {
  success: boolean;
  websiteId: string;
  module: CanonicalModuleId;
  meta: ModuleMetaContract;
  banners: ModuleBannerContract[];
  featured: ModuleFeaturedItemContract[];
  destinations: ModuleDestinationItemContract[];
  categories: ModuleCategoryItemContract[];
  packages: ModuleCuratedPackageItemContract[];
  videos?: ModuleVideoItemContract[];
  reviews?: ModuleReviewItemContract[];
  faq?: ModuleFaqItemContract[];
}

// ─── Generic Paged Result ─────────────────────────────────────────────────────
export interface PagedResultContract<T> {
  success: boolean;
  data: T[];
  meta?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  total?: number;
  count?: number;
}


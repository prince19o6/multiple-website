/**
 * types/index.ts
 *
 * All shared TypeScript types for the mobile app.
 * Includes multi-tenant config types, tour models, booking schemas,
 * user authentication entities, section props, and wishlist definitions.
 */

// ─── Imports & Re-exports from lib ──────────────────────────────────────────
import type { MergedWebsiteConfig } from '@/lib/mergeWebsiteConfig';
import type { SiteConfigResult } from '@/lib/siteConfig';

export type { MergedWebsiteConfig, SiteConfigResult };
export * from './siteConfig';

// ─── User & Authentication Types ─────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  role?: 'user' | 'admin' | 'Admin' | 'SuperAdmin';
  websiteId?: string;
  createdAt?: string;
  isDisabled?: boolean;
  status?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  data?: {
    token: string;
    user: User;
  };
  refreshToken?: string;
  expiresAt?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// ─── Website / Site Types ─────────────────────────────────────────────────────

export type WebsiteId = 'website1' | 'website2' | 'website3';

export type DataSourceId =
  | 'gujjutourdata'
  | 'tripgoasia'
  | 'technoheaven'
  | (string & {});

export interface SiteDefinition {
  id: string;
  label: string;
  dataSource: DataSourceId;
  staticConfig: Record<string, unknown>;
  createConfig?: (dynamic: SiteConfigResult | null) => MergedWebsiteConfig;
}

// ─── Tour Models ──────────────────────────────────────────────────────────────

export interface Tour {
  id: number | string;
  _id?: string;
  slug?: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  duration: string;
  difficulty: string;
  location?: string;
  groupSize: string;
  bestTime: string;
  language: string;
  image: string;
  gallery: string[];
  fullDescription: string;
  highlights: string[];
  included: string[];
  excluded?: string[];
  itinerary: ItineraryDay[];
  guestReviews: GuestReview[];
  category?: string;
  destination?: string;
  featured?: boolean;
  popular?: boolean;
}

export { tourHref } from '@/lib/navigation';

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
}

export interface GuestReview {
  author: string;
  rating: number;
  text: string;
  date?: string;
  avatar?: string;
}

export interface DestinationItem {
  id?: string;
  name: string;
  image: string;
  tours: number;
  tagline?: string;
}

export interface CategoryItem {
  id: string;
  slug: string;
  name: string;
  icon: string;
  image?: string;
  count?: number;
}

// ─── Booking Models ───────────────────────────────────────────────────────────

export type BookingStatus = 'upcoming' | 'completed' | 'cancelled' | 'pending' | 'confirmed';

export interface Booking {
  id: string;
  tourId: number;
  tourName: string;
  tourImage: string;
  location?: string;
  guestName: string;
  email: string;
  phone: string;
  date: string;
  startDate?: string;
  endDate?: string;
  travelers: number;
  totalPrice: number;
  currency?: string;
  status: BookingStatus;
  specialRequest?: string;
  websiteId: string;
  createdAt: string;
  userId?: string;
  qrCode?: string;
}

export interface BookingPayload {
  tourId: number | string;
  tourName?: string;
  tourImage?: string;
  location?: string;
  totalPrice?: number;
  currency?: string;
  guestName: string;
  email: string;
  phone: string;
  date: string;
  startDate?: string;
  endDate?: string;
  travelers: number;
  specialRequest?: string;
  websiteId?: string;
  website?: string;
  userId?: string;
}

// ─── Wishlist Models ──────────────────────────────────────────────────────────

export interface WishlistItem {
  tourId: number;
  websiteId: string;
  addedAt: string;
}

// ─── Filter Types ─────────────────────────────────────────────────────────────

export interface TourFilters {
  search?: string;
  category?: string;
  difficulty?: string;
  minPrice?: number;
  maxPrice?: number;
  duration?: string;
  minRating?: number;
  sortBy?: 'recommended' | 'price-low' | 'price-high' | 'rating';
}

// ─── Component Registry & Section Types ───────────────────────────────────────

export interface SectionData {
  tours?: Tour[];
  destinations?: DestinationItem[];
}

export interface SectionProps {
  config: MergedWebsiteConfig;
  data: SectionData;
  onNavigate?: (path: string) => void;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiListResponse<T = unknown> {
  success: boolean;
  data: T[];
  error?: string;
}

export interface ApiItemResponse<T = unknown> {
  success: boolean;
  data: T;
  error?: string;
}

/**
 * constants/bookingAddOns.ts
 *
 * Curated Add-On Experiences and Promotional Coupon Catalog for Multi-Brand Travel.
 * Features:
 *   - Brand-specific curated add-ons (Gujarati Meals/Escorts for GujjuTours, 5G eSIM/Speedboat for TripGoAsia, Limousine/Drone for Technoheaven)
 *   - Per-person vs. flat-rate pricing models
 *   - Verified promotional coupons with minimum spends and tenant restrictions
 *   - Strict TypeScript typing with zero `any`
 */

import type { TourAddOn } from '@/types';

export interface PromotionalCoupon {
  code: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscountUSD?: number;
  minSpendUSD?: number;
  brandRestriction?: string;
  badge?: string;
  expiresInDays?: number;
}

export const TOUR_ADDONS: TourAddOn[] = [
  // ─── GujjuTours Recommended ────────────────────────────────────────────────
  {
    id: 'pure_veg_jain_meal',
    name: 'Pure Veg & Jain Gourmet Kit',
    description: 'Freshly prepared Jain, Swaminarayan & pure vegetarian warm meals throughout the journey.',
    priceUSD: 18,
    perPerson: true,
    icon: 'restaurant-outline',
    badge: 'Pure Veg / Jain',
    brandRecommendation: 'gujjutours',
  },
  {
    id: 'gujarati_tour_guide',
    name: 'Native Gujarati Tour Escort',
    description: 'Dedicated travel escort fluent in Gujarati, Hindi & English for personal guidance.',
    priceUSD: 30,
    perPerson: false,
    icon: 'people-outline',
    badge: 'Gujarati Speaking',
    brandRecommendation: 'gujjutours',
  },
  {
    id: 'temple_darshan_pass',
    name: 'VIP Temple Darshan & Puja Pass',
    description: 'Skip long temple queues with expedited darshan entry and consecrated puja thali.',
    priceUSD: 15,
    perPerson: true,
    icon: 'sparkles-outline',
    badge: 'Fast-Track',
    brandRecommendation: 'gujjutours',
  },

  // ─── TripGoAsia Recommended ────────────────────────────────────────────────
  {
    id: 'southeast_asia_esim',
    name: '5G Unlimited Traveler eSIM',
    description: 'Instant 15-day high-speed 5G data across Thailand, Vietnam, Singapore & Malaysia.',
    priceUSD: 16,
    perPerson: false,
    icon: 'cellular-outline',
    badge: 'Instant 5G',
    brandRecommendation: 'tripgoasia',
  },
  {
    id: 'island_speedboat_transfer',
    name: 'Private Speedboat Island Pass',
    description: 'High-speed ocean catamaran transfer between secluded coral reefs and marine lagoons.',
    priceUSD: 35,
    perPerson: true,
    icon: 'boat-outline',
    badge: 'Express Water',
    brandRecommendation: 'tripgoasia',
  },
  {
    id: 'adventure_injury_insurance',
    name: 'Comprehensive Travel Insurance',
    description: '$50,000 emergency medical care, helicopter evacuation & flight delay protection.',
    priceUSD: 20,
    perPerson: true,
    icon: 'shield-checkmark-outline',
    badge: 'Full Cover',
    brandRecommendation: 'tripgoasia',
  },

  // ─── Technoheaven Luxury Recommended ───────────────────────────────────────
  {
    id: 'luxury_limousine_vip',
    name: 'VIP Mercedes Maybach Chauffeur',
    description: 'White-glove airport & itinerary transport with chilled refreshments & concierge.',
    priceUSD: 95,
    perPerson: false,
    icon: 'car-sport-outline',
    badge: 'VIP Chauffeur',
    brandRecommendation: 'technoheaven',
  },
  {
    id: 'private_drone_photographer',
    name: 'Private 4K Drone Cinematographer',
    description: 'Personal photographer delivering 50 edited portraits and a 60-second 4K cinematic reel.',
    priceUSD: 75,
    perPerson: false,
    icon: 'camera-outline',
    badge: '4K Cinematics',
    brandRecommendation: 'technoheaven',
  },
  {
    id: 'michelin_tasting_dinner',
    name: 'Chef’s Table Gourmet Dinner',
    description: 'Reserved terrace table featuring multi-course gastronomic menu with sommelier pairing.',
    priceUSD: 65,
    perPerson: true,
    icon: 'wine-outline',
    badge: 'Fine Dining',
    brandRecommendation: 'technoheaven',
  },

  // ─── Global Universal Add-Ons ──────────────────────────────────────────────
  {
    id: 'vip_airport_shuttle',
    name: 'Airport Arrival & Return Shuttle',
    description: 'Comfortable air-conditioned door-to-door transfer between airport and your hotel.',
    priceUSD: 28,
    perPerson: false,
    icon: 'airplane-outline',
    badge: 'Door-to-Door',
  },
  {
    id: 'flex_cancellation_shield',
    name: '100% Flex-Cancellation Guarantee',
    description: 'Cancel up to 2 hours before departure for a full instant cash refund. Zero questions.',
    priceUSD: 22,
    perPerson: false,
    icon: 'refresh-outline',
    badge: 'Zero Risk',
  },
];

export const PROMOTIONAL_COUPONS: PromotionalCoupon[] = [
  {
    code: 'GUJJU20',
    title: 'GujjuTours Royal Expedition Privilege',
    description: '20% off all cultural & heritage tours (up to ₹3,000 / $40)',
    discountType: 'percentage',
    discountValue: 20,
    maxDiscountUSD: 40,
    minSpendUSD: 100,
    brandRestriction: 'gujjutours',
    badge: 'GujjuTours Exclusive',
  },
  {
    code: 'TRIPGO15',
    title: 'TripGoAsia Explorer Savings',
    description: '15% off Southeast Asia island & rainforest adventures (up to $150)',
    discountType: 'percentage',
    discountValue: 15,
    maxDiscountUSD: 150,
    minSpendUSD: 150,
    brandRestriction: 'tripgoasia',
    badge: 'TripGoAsia Special',
  },
  {
    code: 'LUXURY50',
    title: 'Technoheaven Luxury Suite Voucher',
    description: '$50 flat reduction on luxury journeys',
    discountType: 'fixed',
    discountValue: 50,
    minSpendUSD: 300,
    brandRestriction: 'technoheaven',
    badge: 'Technoheaven VIP',
  },
  {
    code: 'EXPLORE10',
    title: 'Global Explorer Privilege',
    description: '10% off any experience across all destinations',
    discountType: 'percentage',
    discountValue: 10,
    maxDiscountUSD: 100,
    badge: 'Universal',
  },
  {
    code: 'EARLYBIRD',
    title: 'Early Bird Expedition Advantage',
    description: 'Flat $30 / ₹2,000 savings for advance reservations',
    discountType: 'fixed',
    discountValue: 30,
    minSpendUSD: 200,
    badge: 'Advance Booking',
  },
  {
    code: 'VIPPASS',
    title: 'VIP Traveler Club Pass',
    description: '12% off premium group departures',
    discountType: 'percentage',
    discountValue: 12,
    maxDiscountUSD: 120,
    badge: 'Members Only',
  },
];

/**
 * Filter add-ons tailored to the active brand.
 * Shows brand-recommended add-ons first, followed by universal options.
 */
export function getAddOnsForSite(siteId: string): TourAddOn[] {
  const normalizedSite = (siteId || '').toLowerCase();
  return [...TOUR_ADDONS].sort((a, b) => {
    const aMatch = a.brandRecommendation?.toLowerCase() === normalizedSite;
    const bMatch = b.brandRecommendation?.toLowerCase() === normalizedSite;
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return 0;
  });
}

/**
 * Filter available coupons for the active brand.
 */
export function getCouponsForSite(siteId: string): PromotionalCoupon[] {
  const normalizedSite = (siteId || '').toLowerCase();
  return PROMOTIONAL_COUPONS.filter((coupon) => {
    if (!coupon.brandRestriction) return true;
    return coupon.brandRestriction.toLowerCase() === normalizedSite;
  });
}

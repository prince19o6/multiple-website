/**
 * lib/registry/componentRegistry.tsx
 *
 * React Native mobile component registry mapping (type + variant) to Expo components.
 * Supports dynamic server-driven screen layouts from SiteConfig.
 *
 * Guarantees that unknown types or variants are skipped safely with a logged warning,
 * never causing a runtime crash.
 */

import React from 'react';
import type { ComponentConfig } from '@/lib/config/siteConfigSchema';
import type { SiteConfig } from '@/lib/config/siteConfigSchema';

import HeroSection from '@/components/sections/HeroSection';
import { MobileSearchWidget } from '@/components/home/MobileSearchWidget';
import ActivitiesSection from '@/components/sections/ActivitiesSection';
import FeaturedToursSection from '@/components/sections/FeaturedToursSection';
import DestinationsSection from '@/components/sections/DestinationsSection';
import { MobilePromoCarousel } from '@/components/home/MobilePromoCarousel';
import TestimonialsSection from '@/components/sections/TestimonialsSection';
import { AboutUsHomeSection } from '@/components/home/AboutUsHomeSection';
import WhyChooseUsSection from '@/components/sections/WhyChooseUsSection';
import UpcomingTripCountdown from '@/components/UpcomingTripCountdown';
import { QuickActionsGrid } from '@/components/home/QuickActionsGrid';
import { RecentlyViewedSection } from '@/components/home/RecentlyViewedSection';
import { MobileCityStaysSection } from '@/components/home/MobileCityStaysSection';
import { MobilePerfectStaysSection } from '@/components/home/MobilePerfectStaysSection';
import { MobileCuratedPackagesSection } from '@/components/home/MobileCuratedPackagesSection';
import { SpecialOffersSection } from '@/components/home/SpecialOffersSection';
import { GujjuFlightHeroSearch } from '@/components/home/GujjuFlightHeroSearch';
import { MobileBestCitiesWeatherSection } from '@/components/home/MobileBestCitiesWeatherSection';
import { MobileRegionalActivitiesSection } from '@/components/home/MobileRegionalActivitiesSection';
import { MobileTrustedPartnerSection } from '@/components/home/MobileTrustedPartnerSection';
import { MobileTopAttractionsSection } from '@/components/home/MobileTopAttractionsSection';
import { MobileTechnoheavenB2BSection } from '@/components/home/MobileTechnoheavenB2BSection';

export interface MobileComponentProps {
  component: ComponentConfig;
  config: SiteConfig;
  data?: any;
  onNavigate?: (path: string) => void;
}

export type MobileComponentType = React.ComponentType<MobileComponentProps>;

export const MOBILE_COMPONENT_REGISTRY: Record<string, MobileComponentType> = {
  // ─── Hero Variants ────────────────────────────────────────────────────────
  'hero:carousel': (props) => <HeroSection config={props.config as any} data={props.data || {}} onNavigate={props.onNavigate} />,
  'hero:split': (props) => <HeroSection config={props.config as any} data={props.data || {}} onNavigate={props.onNavigate} />,
  'hero:video': (props) => <HeroSection config={props.config as any} data={props.data || {}} onNavigate={props.onNavigate} />,
  'hero:tripgo': (props) => <HeroSection config={props.config as any} data={props.data || {}} onNavigate={props.onNavigate} />,
  'hero:default': (props) => <HeroSection config={props.config as any} data={props.data || {}} onNavigate={props.onNavigate} />,
  'hero:flight': (props) => <GujjuFlightHeroSearch onOpenMore={props.data?.onOpenTravelHub} onOpenEnquiry={props.data?.onOpenEnquiry} />,
  'hero:search': (props) => <GujjuFlightHeroSearch onOpenMore={props.data?.onOpenTravelHub} onOpenEnquiry={props.data?.onOpenEnquiry} />,

  // ─── Search Widget Variants ───────────────────────────────────────────────
  'searchWidget:default': (props) => <MobileSearchWidget />,
  'searchWidget:minimal': (props) => <MobileSearchWidget />,
  'searchWidget:compact': (props) => <MobileSearchWidget />,

  // ─── Gujju Tours Domain Stays & Packages ──────────────────────────────────
  'cityStays:carousel-2-5': (props) => <MobileCityStaysSection />,
  'cityStays:default': (props) => <MobileCityStaysSection />,
  'perfectStays:carousel-2-5': (props) => <MobilePerfectStaysSection currency={props.data?.currency} />,
  'perfectStays:default': (props) => <MobilePerfectStaysSection currency={props.data?.currency} />,
  'curatedPackages:seo-link': (props) => <MobileCuratedPackagesSection currency={props.data?.currency} onOpenEnquiry={props.data?.onOpenEnquiry} />,
  'curatedPackages:default': (props) => <MobileCuratedPackagesSection currency={props.data?.currency} onOpenEnquiry={props.data?.onOpenEnquiry} />,
  'videoReels:video-3': (props) => <MobilePromoCarousel />,
  'postBookingCare:static-4': (props) => <AboutUsHomeSection />,
  'hotelCollections:Seo-link-list': (props) => <SpecialOffersSection />,

  // ─── TripGo Asia Live Sections ────────────────────────────────────────────
  'bestCitiesWeather:carousel-1-6': (props) => (
    <MobileBestCitiesWeatherSection title={props.component?.title} />
  ),
  'bestCitiesWeather:default': (props) => (
    <MobileBestCitiesWeatherSection title={props.component?.title} />
  ),
  'regionalActivities:carousel-1-4': (props) => (
    <MobileRegionalActivitiesSection
      title={props.component?.title}
      currency={props.data?.currency}
    />
  ),
  'regionalActivities:default': (props) => (
    <MobileRegionalActivitiesSection
      title={props.component?.title}
      currency={props.data?.currency}
    />
  ),
  'topAttractionsTabs:Seo-link-Tab': () => <MobileTopAttractionsSection />,
  'topAttractionsTabs:default': () => <MobileTopAttractionsSection />,

  // ─── Technoheaven B2B Portal Section ──────────────────────────────────────
  'b2bPortal:b2b-agent-portal': () => <MobileTechnoheavenB2BSection />,
  'b2bPortal:default': () => <MobileTechnoheavenB2BSection />,

  // ─── Trust Badges & Partners ──────────────────────────────────────────────
  'trustedPartner:company-info-5': () => <MobileTrustedPartnerSection />,
  'trustedPartner:company-info-30': () => <MobileTrustedPartnerSection />,
  'trustedPartner:default': () => <MobileTrustedPartnerSection />,
  'officialPartners:company-info-34': () => <AboutUsHomeSection />,
  'partnersStrip:marquee': () => <AboutUsHomeSection />,
  'aboutUs:story': () => <AboutUsHomeSection />,
  'aboutUs:default': () => <AboutUsHomeSection />,

  // ─── Reviews & Testimonials Variants ──────────────────────────────────────
  'reviews:google-review-offline': (props) => <TestimonialsSection config={props.config as any} data={props.data || {}} onNavigate={props.onNavigate} />,
  'reviews:carousel': (props) => <TestimonialsSection config={props.config as any} data={props.data || {}} onNavigate={props.onNavigate} />,
  'reviews:cards': (props) => <TestimonialsSection config={props.config as any} data={props.data || {}} onNavigate={props.onNavigate} />,

  // ─── Category / Travel Styles Variants ────────────────────────────────────
  'categoryList:chips': (props) => <ActivitiesSection config={props.config as any} data={props.data || {}} onNavigate={props.onNavigate} />,
  'categoryList:grid': (props) => <ActivitiesSection config={props.config as any} data={props.data || {}} onNavigate={props.onNavigate} />,
  'categoryList:icons': (props) => <ActivitiesSection config={props.config as any} data={props.data || {}} onNavigate={props.onNavigate} />,
  'categories:chips': (props) => <ActivitiesSection config={props.config as any} data={props.data || {}} onNavigate={props.onNavigate} />,

  // ─── Tour Carousel / Cards Variants ───────────────────────────────────────
  'tourCarousel:classic': (props) => <FeaturedToursSection config={props.config as any} data={props.data || {}} onNavigate={props.onNavigate} />,
  'tourCarousel:minimal': (props) => <FeaturedToursSection config={props.config as any} data={props.data || {}} onNavigate={props.onNavigate} />,
  'tourCarousel:overlay': (props) => <FeaturedToursSection config={props.config as any} data={props.data || {}} onNavigate={props.onNavigate} />,
  'tours:cards': (props) => <FeaturedToursSection config={props.config as any} data={props.data || {}} onNavigate={props.onNavigate} />,

  // ─── Destination Grid Variants ───────────────────────────────────────────
  'destinationGrid:cards': (props) => <DestinationsSection config={props.config as any} data={props.data || {}} onNavigate={props.onNavigate} />,
  'destinationGrid:mosaic': (props) => <DestinationsSection config={props.config as any} data={props.data || {}} onNavigate={props.onNavigate} />,
  'destinations:grid': (props) => <DestinationsSection config={props.config as any} data={props.data || {}} onNavigate={props.onNavigate} />,

  // ─── Offers & Banners Variants ────────────────────────────────────────────
  'offers:banner': (props) => <MobilePromoCarousel />,
  'offers:cards': (props) => <SpecialOffersSection />,
  'offers:split': (props) => <MobilePromoCarousel />,

  // ─── FAQ Variants ─────────────────────────────────────────────────────────
  'faq:accordion': (props) => <WhyChooseUsSection config={props.config as any} data={props.data || {}} onNavigate={props.onNavigate} />,
  'faq:list': (props) => <WhyChooseUsSection config={props.config as any} data={props.data || {}} onNavigate={props.onNavigate} />,

  // ─── Personalized & Quick Actions ─────────────────────────────────────────
  'tripCountdown:card': (props) => <UpcomingTripCountdown bookings={props.data?.bookings || []} />,
  'quickActions:grid': (props) => <QuickActionsGrid onOpenTravelHub={props.data?.onOpenTravelHub} />,
  'personalized:history': (props) => <RecentlyViewedSection />,
};

/**
 * Resolves a React Native component for a given component configuration.
 * Gracefully checks `type:variant`, then `type:default`, then `type`.
 * Returns null and logs a warning if unmapped.
 */
export function resolveMobileComponent(component: ComponentConfig): MobileComponentType | null {
  if (!component.enabled) return null;

  // Filter out web-only components on native platform
  if (component.platforms && !component.platforms.includes('app')) {
    return null;
  }

  const key = `${component.type}:${component.variant || 'default'}`;
  if (MOBILE_COMPONENT_REGISTRY[key]) {
    return MOBILE_COMPONENT_REGISTRY[key];
  }

  const defaultKey = `${component.type}:default`;
  if (MOBILE_COMPONENT_REGISTRY[defaultKey]) {
    return MOBILE_COMPONENT_REGISTRY[defaultKey];
  }

  // Check any variant of the same type
  const prefix = `${component.type}:`;
  const matchingKey = Object.keys(MOBILE_COMPONENT_REGISTRY).find((k) => k.startsWith(prefix));
  if (matchingKey && MOBILE_COMPONENT_REGISTRY[matchingKey]) {
    return MOBILE_COMPONENT_REGISTRY[matchingKey];
  }

  if (typeof console !== 'undefined' && console.warn) {
    console.warn(`[MobileComponentRegistry] Unmapped component '${key}'. Skipped cleanly.`);
  }

  return null;
}

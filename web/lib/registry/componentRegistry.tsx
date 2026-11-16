/**
 * lib/registry/componentRegistry.tsx
 *
 * Web React component registry mapping (type + variant) to React components.
 * Drives dynamic layouts across Gujju Tours, TripGo Asia, and Technoheaven from SiteConfig.
 */

import React from 'react';
import type { ComponentConfig } from '@/lib/config/siteConfigSchema';
import type { SiteConfig } from '@/lib/config/siteConfigSchema';

import HeroSection from '@/components/sections/HeroSection';
import SearchWidget from '@/components/search/SearchWidget';
import FeaturedTours from '@/components/sections/FeaturedTours';
import Destinations from '@/components/sections/Destinations';
import Activities from '@/components/sections/Activities';
import PromoBannerCarousel from '@/components/sections/PromoBannerCarousel';
import TravelerReviewsSection from '@/components/sections/TravelerReviewsSection';
import OfficialPartnersSection from '@/components/sections/OfficialPartnersSection';
import TrustedPartnerSection from '@/components/sections/TrustedPartnerSection';
import WhyChooseUs from '@/components/sections/WhyChooseUs';
import VideoExperiencesSection from '@/components/sections/VideoExperiencesSection';
import CityStaysSection from '@/components/sections/CityStaysSection';
import PerfectStaysSection from '@/components/sections/PerfectStaysSection';
import CuratedPackagesSection from '@/components/sections/CuratedPackagesSection';
import HotelCollectionsSection from '@/components/sections/HotelCollectionsSection';
import TrustBadgesSection from '@/components/sections/TrustBadgesSection';
import PostBookingCareSection from '@/components/sections/PostBookingCareSection';
import BestCitiesWeatherSection from '@/components/sections/BestCitiesWeatherSection';
import RegionalActivitiesSection from '@/components/sections/RegionalActivitiesSection';
import TechnoheavenB2BSection from '@/components/sections/TechnoheavenB2BSection';
import TopAttractionsTabsSection from '@/components/sections/TopAttractionsTabsSection';
import FaqAccordionSection from '@/components/sections/FaqAccordionSection';
import FooterSection from '@/components/sections/FooterSection';

export interface WebComponentProps {
  component: ComponentConfig;
  config: SiteConfig;
  data?: any;
}

export type WebComponentType = React.ComponentType<WebComponentProps>;

export const WEB_COMPONENT_REGISTRY: Record<string, WebComponentType> = {
  // ─── Hero Variants ────────────────────────────────────────────────────────
  'hero:carousel': (props) => <HeroSection config={props.config as any} />,
  'hero:split': (props) => <HeroSection config={props.config as any} />,
  'hero:video': (props) => <HeroSection config={props.config as any} />,
  'hero:tripgo': (props) => <HeroSection config={props.config as any} />,
  'hero:default': (props) => <HeroSection config={props.config as any} />,

  // ─── Search Widget Variants ───────────────────────────────────────────────
  'searchWidget:default': (props) => (
    <SearchWidget
      siteId={props.config.site.id}
      accentColor={props.config.theme.colors.primary}
    />
  ),
  'searchWidget:minimal': (props) => (
    <SearchWidget
      siteId={props.config.site.id}
      accentColor={props.config.theme.colors.primary}
    />
  ),

  // ─── Gujju Tours Live Specific Sections ───────────────────────────────────
  'perfectStays:carousel-2-5': (props) => (
    <PerfectStaysSection
      config={props.config as any}
      hotels={props.data?.hotels}
    />
  ),
  'perfectStays:default': (props) => (
    <PerfectStaysSection
      config={props.config as any}
      hotels={props.data?.hotels}
    />
  ),
  'cityStays:carousel-2-5': (props) => (
    <CityStaysSection
      config={props.config as any}
      cities={props.data?.cities}
    />
  ),
  'cityStays:default': (props) => (
    <CityStaysSection
      config={props.config as any}
      cities={props.data?.cities}
    />
  ),
  'videoReels:video-3': (props) => <VideoExperiencesSection config={props.config as any} />,
  'videoExperiences:video-3': (props) => <VideoExperiencesSection config={props.config as any} />,
  'videoExperiences:default': (props) => <VideoExperiencesSection config={props.config as any} />,
  'postBookingCare:static-4': (props) => <PostBookingCareSection config={props.config as any} />,
  'postBookingCare:default': (props) => <PostBookingCareSection config={props.config as any} />,
  'curatedPackages:seo-link': (props) => <CuratedPackagesSection config={props.config as any} />,
  'curatedPackages:default': (props) => <CuratedPackagesSection config={props.config as any} />,
  'hotelCollections:Seo-link-list': (props) => <HotelCollectionsSection config={props.config as any} />,
  'hotelCollections:default': (props) => <HotelCollectionsSection config={props.config as any} />,

  // ─── TripGo Asia Live Specific Sections ───────────────────────────────────
  'bestCitiesWeather:carousel-1-6': (props) => (
    <BestCitiesWeatherSection
      cities={props.data?.cities}
      title={props.component?.title}
      siteId={props.config?.site?.id}
    />
  ),
  'bestCitiesWeather:default': (props) => (
    <BestCitiesWeatherSection
      cities={props.data?.cities}
      title={props.component?.title}
      siteId={props.config?.site?.id}
    />
  ),
  'regionalActivities:carousel-1-4': (props) => {
    const title = props.component?.title || "Best Activities";
    const cityName = title.toLowerCase().includes("langkawi")
      ? "langkawi"
      : title.toLowerCase().includes("kuala lumpur")
      ? "kuala lumpur"
      : title.toLowerCase().includes("phuket")
      ? "phuket"
      : "";
    const bannerItems = props.data?.banners?.find((b: any) =>
      b.name?.toLowerCase().includes(cityName)
    )?.items;
    const items = (bannerItems && bannerItems.length > 0)
      ? bannerItems
      : (props.data?.tours && props.data.tours.length > 0)
      ? props.data.tours
      : [];

    return (
      <RegionalActivitiesSection
        title={title}
        items={items}
        accentColor={props.config?.theme?.colors?.primary}
      />
    );
  },
  'regionalActivities:default': (props) => (
    <RegionalActivitiesSection
      title={props.component?.title || "Best Activities"}
      items={props.data?.tours || []}
      accentColor={props.config?.theme?.colors?.primary}
    />
  ),
  'topAttractionsTabs:Seo-link-Tab': () => <TopAttractionsTabsSection />,
  'topAttractionsTabs:default': () => <TopAttractionsTabsSection />,

  // ─── Technoheaven B2B Portal Section ──────────────────────────────────────
  'b2bPortal:b2b-agent-portal': () => <TechnoheavenB2BSection />,
  'b2bPortal:default': () => <TechnoheavenB2BSection />,

  // ─── Reviews & Partners ───────────────────────────────────────────────────
  'reviews:google-review-offline': (props) => <TravelerReviewsSection config={props.config as any} />,
  'reviews:carousel': (props) => <TravelerReviewsSection config={props.config as any} />,
  'reviews:default': (props) => <TravelerReviewsSection config={props.config as any} />,
  'trustedPartner:company-info-30': (props) => <TrustedPartnerSection config={props.config as any} />,
  'trustedPartner:company-info-5': (props) => <TrustedPartnerSection config={props.config as any} />,
  'trustedPartner:default': (props) => <TrustedPartnerSection config={props.config as any} />,
  'officialPartners:company-info-34': (props) => <OfficialPartnersSection config={props.config as any} />,
  'officialPartners:carousel-vertical': (props) => <OfficialPartnersSection config={props.config as any} />,
  'officialPartners:marquee': (props) => <OfficialPartnersSection config={props.config as any} />,
  'officialPartners:default': (props) => <OfficialPartnersSection config={props.config as any} />,
  'partnersStrip:marquee': (props) => <OfficialPartnersSection config={props.config as any} />,
  'partnersStrip:default': (props) => <OfficialPartnersSection config={props.config as any} />,
  'partners:marquee': (props) => <OfficialPartnersSection config={props.config as any} />,
  'partners:default': (props) => <OfficialPartnersSection config={props.config as any} />,
  'trustBadges:grid': (props) => <TrustBadgesSection config={props.config as any} />,
  'trustBadges:default': (props) => <TrustBadgesSection config={props.config as any} />,

  // ─── FAQ Sections ─────────────────────────────────────────────────────────
  'faq:accordion': (props) => <FaqAccordionSection config={props.config as any} component={props.component} />,
  'faq:list': (props) => <FaqAccordionSection config={props.config as any} component={props.component} />,
  'faq:default': (props) => <FaqAccordionSection config={props.config as any} component={props.component} />,
  'faqAccordion:accordion': (props) => <FaqAccordionSection config={props.config as any} component={props.component} />,
  'faqAccordion:default': (props) => <FaqAccordionSection config={props.config as any} component={props.component} />,

  // ─── Floating WhatsApp Chat (Managed globally by layout Footer) ─────────────
  'floatingWhatsApp:default': () => null,

  // ─── Footer Section Variants ──────────────────────────────────────────────
  'footer:default': (props) => <FooterSection config={props.config as any} />,
  'footer:columns': (props) => <FooterSection config={props.config as any} />,
  'footer:luxury': (props) => <FooterSection config={props.config as any} />,
  'footer:minimal': (props) => <FooterSection config={props.config as any} />,
  'footerSection:default': (props) => <FooterSection config={props.config as any} />,

  // ─── General Fallback Sections ────────────────────────────────────────────
  'categoryList:chips': (props) => <Activities config={props.config as any} data={props.data || {}} />,
  'categoryList:grid': (props) => <Activities config={props.config as any} data={props.data || {}} />,
  'categoryList:default': (props) => <Activities config={props.config as any} data={props.data || {}} />,
  'tourCarousel:classic': (props) => <FeaturedTours config={props.config as any} data={props.data || {}} />,
  'tourCarousel:cards': (props) => <FeaturedTours config={props.config as any} data={props.data || {}} />,
  'tourCarousel:overlay': (props) => <FeaturedTours config={props.config as any} data={props.data || {}} />,
  'tourCarousel:default': (props) => <FeaturedTours config={props.config as any} data={props.data || {}} />,
  'destinationGrid:cards': (props) => <Destinations config={props.config as any} data={props.data || {}} />,
  'destinationGrid:masonry': (props) => <Destinations config={props.config as any} data={props.data || {}} />,
  'destinationGrid:default': (props) => <Destinations config={props.config as any} data={props.data || {}} />,
  'offers:banner': (props) => <PromoBannerCarousel config={props.config as any} />,
  'offers:cards': (props) => <PromoBannerCarousel config={props.config as any} />,
  'offers:default': (props) => <PromoBannerCarousel config={props.config as any} />,
  'whyUs:cards': (props) => <WhyChooseUs config={props.config as any} data={props.data || {}} />,
  'whyUs:default': (props) => <WhyChooseUs config={props.config as any} data={props.data || {}} />,
};

export function resolveWebComponent(component: ComponentConfig): WebComponentType | null {
  const specificKey = `${component.type}:${component.variant}`;
  if (WEB_COMPONENT_REGISTRY[specificKey]) {
    return WEB_COMPONENT_REGISTRY[specificKey];
  }

  const defaultKey = `${component.type}:default`;
  if (WEB_COMPONENT_REGISTRY[defaultKey]) {
    return WEB_COMPONENT_REGISTRY[defaultKey];
  }

  // Graceful prefix fallback: match any registered variant for this component type
  const typePrefix = `${component.type}:`;
  const fallbackKey = Object.keys(WEB_COMPONENT_REGISTRY).find((k) =>
    k.toLowerCase().startsWith(typePrefix.toLowerCase())
  );
  if (fallbackKey && WEB_COMPONENT_REGISTRY[fallbackKey]) {
    return WEB_COMPONENT_REGISTRY[fallbackKey];
  }

  // Graceful alias match (case-insensitive substring)
  const normType = component.type.toLowerCase();
  if (normType.includes("partner") || normType.includes("badge")) {
    return WEB_COMPONENT_REGISTRY['officialPartners:default'];
  }
  if (normType.includes("faq")) {
    return WEB_COMPONENT_REGISTRY['faq:default'];
  }
  if (normType.includes("tour")) {
    return WEB_COMPONENT_REGISTRY['tourCarousel:default'];
  }
  if (normType.includes("dest")) {
    return WEB_COMPONENT_REGISTRY['destinationGrid:default'];
  }
  if (normType.includes("offer") || normType.includes("promo")) {
    return WEB_COMPONENT_REGISTRY['offers:default'];
  }

  return null;
}

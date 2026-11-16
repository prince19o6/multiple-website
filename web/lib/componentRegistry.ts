import type { ComponentType } from "react";
import type { MergedWebsiteConfig } from "./mergeWebsiteConfig";
import type { Tour } from "./type";

// Reference Components matching www.gujjutours.com layout & order
import HeroSection from "@/components/sections/HeroSection";
import PromoBannerCarousel from "@/components/sections/PromoBannerCarousel";
import PerfectStaysSection from "@/components/sections/PerfectStaysSection";
import CityStaysSection from "@/components/sections/CityStaysSection";
import VideoExperiencesSection from "@/components/sections/VideoExperiencesSection";
import PostBookingCareSection from "@/components/sections/PostBookingCareSection";
import CuratedPackagesSection from "@/components/sections/CuratedPackagesSection";
import TravelerReviewsSection from "@/components/sections/TravelerReviewsSection";
import TrustedPartnerSection from "@/components/sections/TrustedPartnerSection";
import OfficialPartnersSection from "@/components/sections/OfficialPartnersSection";
import HotelCollectionsSection from "@/components/sections/HotelCollectionsSection";
import TrustBadgesSection from "@/components/sections/TrustBadgesSection";
import FaqAccordionSection from "@/components/sections/FaqAccordionSection";
import FooterSection from "@/components/sections/FooterSection";

// Existing/Legacy Components
import WhyChooseUs from "@/components/sections/WhyChooseUs";
import FeaturedTours from "@/components/sections/FeaturedTours";
import Destinations from "@/components/sections/Destinations";
import Activities from "@/components/sections/Activities";
import Difficulty from "@/components/sections/Difficulty";
import Packages from "@/components/sections/Packages";
import Offers from "@/components/sections/Offers";
import Testimonials from "@/components/sections/Testimonials";
import Stats from "@/components/sections/Stats";
import Cta from "@/components/sections/Cta";

export interface DestinationItem {
  id?: string;
  name: string;
  image: string;
  tours: number;
}

export interface SectionData {
  tours?: Tour[];
  destinations?: DestinationItem[];
  banners?: any[];
  hotels?: any[];
  cities?: any[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export interface SectionProps {
  config: MergedWebsiteConfig;
  data: SectionData;
}

export type SectionComponent = ComponentType<SectionProps>;

// The authoritative registry mapping configuration keys to React components.
export const componentRegistry: Record<string, SectionComponent> = {
  // Reference Homepage Sections (Gujju Tours order)
  hero: HeroSection as unknown as SectionComponent,
  promoBanners: PromoBannerCarousel as unknown as SectionComponent,
  perfectStays: PerfectStaysSection as unknown as SectionComponent,
  cityStays: CityStaysSection as unknown as SectionComponent,
  videoExperiences: VideoExperiencesSection as unknown as SectionComponent,
  postBookingCare: PostBookingCareSection as unknown as SectionComponent,
  packageRows: CuratedPackagesSection as unknown as SectionComponent,
  travelerReviews: TravelerReviewsSection as unknown as SectionComponent,
  trustedPartner: TrustedPartnerSection as unknown as SectionComponent,
  officialPartners: OfficialPartnersSection as unknown as SectionComponent,
  partnersStrip: OfficialPartnersSection as unknown as SectionComponent,
  hotelCollections: HotelCollectionsSection as unknown as SectionComponent,
  trustBadges: TrustBadgesSection as unknown as SectionComponent,
  faq: FaqAccordionSection as unknown as SectionComponent,
  faqAccordion: FaqAccordionSection as unknown as SectionComponent,
  footer: FooterSection as unknown as SectionComponent,
  footerSection: FooterSection as unknown as SectionComponent,

  // Legacy Section Aliases for Backward Compatibility
  whyChooseUs: WhyChooseUs,
  featuredTours: FeaturedTours,
  destinations: Destinations,
  activities: Activities,
  difficulty: Difficulty,
  packages: Packages,
  offers: Offers,
  testimonials: Testimonials,
  stats: Stats,
  cta: Cta,
};

// Default Section Order matching www.gujjutours.com live layout
export const DEFAULT_SECTION_ORDER = [
  "hero",
  "promoBanners",
  "perfectStays",
  "cityStays",
  "videoExperiences",
  "postBookingCare",
  "packageRows",
  "travelerReviews",
  "trustedPartner",
  "officialPartners",
  "hotelCollections",
  "trustBadges",
  "footer",
];

export function isRegisteredSection(
  key: string
): key is keyof typeof componentRegistry {
  return Object.prototype.hasOwnProperty.call(componentRegistry, key);
}

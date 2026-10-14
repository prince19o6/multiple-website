import type { ComponentType } from "react";
import type { MergedWebsiteConfig } from "./mergeWebsiteConfig";
import type { Tour } from "./type";

import Hero from "@/components/sections/Hero";
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

// Website data passed alongside per-site COMPONENT CONFIG (spec #6).
// Extend this as more data types (destinations, hotels, etc.) come
// from real APIs instead of the fallback list inside Destinations.tsx.
export interface SectionData {
    tours?: Tour[];
    destinations?: DestinationItem[];
    loading?: boolean;
    error?: string | null;
    onRetry?: () => void;
}

export interface SectionProps {
    config: MergedWebsiteConfig;
    data: SectionData;
}

export type SectionComponent = ComponentType<SectionProps>;

// SECURITY (spec #21): the only place a section "type" string from
// remote configuration becomes real React code. Unregistered keys
// are always skipped.
export const componentRegistry: Record<string, SectionComponent> = {
    hero: Hero,
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

// Used only when a site's config has no homeSections array at all.
export const DEFAULT_SECTION_ORDER = [
    "hero",
    "whyChooseUs",
    "featuredTours",
    "destinations",
    "stats",
    "cta",
];

export function isRegisteredSection(
    key: string
): key is keyof typeof componentRegistry {
    return Object.prototype.hasOwnProperty.call(componentRegistry, key);
}
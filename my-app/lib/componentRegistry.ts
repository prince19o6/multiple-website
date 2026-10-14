/**
 * lib/componentRegistry.ts
 *
 * Maps section-key strings (from API config homeSections array) to
 * React Native section components.
 *
 * SECURITY: this is the only place a remote string becomes real code.
 * Unregistered keys are always skipped in DynamicRenderer.
 */

import type { ComponentType } from 'react';
import type { SectionProps } from '@/types';

import HeroSection from '@/components/sections/HeroSection';
import WhyChooseUsSection from '@/components/sections/WhyChooseUsSection';
import FeaturedToursSection from '@/components/sections/FeaturedToursSection';
import DestinationsSection from '@/components/sections/DestinationsSection';
import ActivitiesSection from '@/components/sections/ActivitiesSection';
import DifficultySection from '@/components/sections/DifficultySection';
import PackagesSection from '@/components/sections/PackagesSection';
import OffersSection from '@/components/sections/OffersSection';
import TestimonialsSection from '@/components/sections/TestimonialsSection';
import StatsSection from '@/components/sections/StatsSection';
import CtaSection from '@/components/sections/CtaSection';

export type SectionComponent = ComponentType<SectionProps>;

/** Registry: API key → RN component. Add new sections here only. */
export const componentRegistry: Record<string, SectionComponent> = {
  hero: HeroSection,
  whyChooseUs: WhyChooseUsSection,
  featuredTours: FeaturedToursSection,
  destinations: DestinationsSection,
  activities: ActivitiesSection,
  difficulty: DifficultySection,
  packages: PackagesSection,
  offers: OffersSection,
  testimonials: TestimonialsSection,
  stats: StatsSection,
  cta: CtaSection,
};

/** Fallback order when the API config has no homeSections array. */
export const DEFAULT_SECTION_ORDER = [
  'hero',
  'whyChooseUs',
  'featuredTours',
  'destinations',
  'stats',
  'cta',
];

/** Type guard: is this key registered? */
export function isRegisteredSection(key: string): key is keyof typeof componentRegistry {
  return Object.prototype.hasOwnProperty.call(componentRegistry, key);
}

"use client";

import React from "react";
import { useSiteConfig } from "@/lib/SiteConfigContext";
import HeroSection from "@/components/sections/HeroSection";
import ModuleSection from "@/components/sections/ModuleSection";

export default function LanguageSitePage() {
  const config = useSiteConfig();
  const theme = config.theme || {};

  return (
    <main
      className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 transition-colors"
      style={{
        backgroundColor: theme.background || "#ffffff",
        color: theme.text || "#111827",
      }}
    >
      {/* 1. Hero banner carousel + morphing search widget with module switcher */}
      <HeroSection config={config as any} />

      {/* 2. Category explorer chips for active module */}
      <ModuleSection type="categories" />

      {/* 3. Offer banners (Module-specific promotional cards) */}
      <ModuleSection type="offers" />

      {/* 4. Perfect Stays / Top Picks in the featured city (module-specific cards) */}
      <ModuleSection type="featured" />

      {/* 5. Destination cities grid (city tiles with item counts for active module) */}
      <ModuleSection type="cities" />

      {/* 6. Watch Top Travel Experiences (video row) */}
      <ModuleSection type="videos" />

      {/* 7. FAQ accordion (specific to active module) */}
      <ModuleSection type="faq" />

      {/* 8. Curated Collections / Combos / Bundles (horizontal scroll cards) */}
      <ModuleSection type="packages" />

      {/* 9. What Our Travelers Say (reviews for active module) */}
      <ModuleSection type="reviews" />

      {/* 10. Your Trusted Partner for Memorable Journeys (stats / why-us) */}
      <ModuleSection type="trusted" />

      {/* 11. Official Partners (logo strip) + memberships (Gujarat Tourism, TAAI, TAFI, TAG, IAAPI) */}
      <ModuleSection type="partners" />

      {/* 12. SEO link groups (dynamic per active module) */}
      <ModuleSection type="seoLinks" />

      {/* 13. Trust badges (No Booking Fees, Best Price Guarantee, 1000+ Happy Customers) */}
      <ModuleSection type="trustBadges" />
    </main>
  );
}

"use client";

import React from "react";
import Image from "next/image";
import type { MergedWebsiteConfig } from "@/lib/mergeWebsiteConfig";
import ModuleBar from "../navigation/ModuleBar";

import SearchWidget from "../search/SearchWidget";
import { useActiveModule, CanonicalModule } from "@/lib/context/ModuleContext";

interface HeroSectionProps {
  config: MergedWebsiteConfig;
}

// Vibrant, sunlit high-resolution travel photography per module and tenant
const MODULE_HERO_PHOTOS: Record<string, Partial<Record<CanonicalModule, string>>> = {
  gujjutours: {
    hotels: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&q=85", // Sunlit luxury resort & turquoise pool
    tours: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1920&q=85", // Sunlit Dubai Burj Al Arab & coastline
    packages: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=85", // Tropical beach & clear turquoise sea
    flights: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&q=85", // Commercial airliner flying in blue sky & golden sun
    transfers: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1920&q=85", // Luxury executive vehicle on scenic coastal highway
    visas: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&q=85", // Global passport & world travel discovery
    restaurants: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=85", // Vibrant fine dining restaurant terrace
    buildpackage: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&q=85", // Inspiring wanderlust vacation planning
  },
  tripgoasia: {
    hotels: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1920&q=85", // Tropical island luxury villa
    tours: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=1920&q=85", // Southeast Asia tropical temple & limestone karst
    packages: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1920&q=85", // Tropical paradise
    flights: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&q=85",
    transfers: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1920&q=85",
    visas: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&q=85",
    restaurants: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=85",
    buildpackage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=85",
  },
  technoheaven: {
    hotels: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&q=85",
    tours: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=85", // Modern architectural cityscape
    packages: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=85",
    flights: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920&q=85",
    transfers: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1920&q=85",
    visas: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&q=85",
    restaurants: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=85",
    buildpackage: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&q=85",
  },
};

export default function HeroSection({ config }: HeroSectionProps) {
  const { activeModule, activeModuleCode, moduleData } = useActiveModule();

  const primaryColor = config?.theme?.colors?.primary || config?.theme?.primary || "#2882c5";
  const siteId = (config?.site?.id || config?.id || "gujjutours").toLowerCase();
  const siteName = config?.site?.name || "Travel Platform";

  // Dynamic Content from MongoDB (Banners collection or Site Settings)
  const activeHeroBanner = (moduleData as any)?.heroBanners?.[0] || (moduleData as any)?.banners?.[0];

  const tagline = activeHeroBanner?.title || moduleData?.meta?.title || config?.site?.tagline || "Your Gateway to Extraordinary Adventures";
  const subtitle = activeHeroBanner?.subtitle || moduleData?.meta?.subtitle || (
    siteId === "tripgoasia"
      ? "Discover verified attractions, seamless car rentals, airport transfers, and top-rated stays across Southeast Asia."
      : siteId === "technoheaven"
        ? "Wholesale inventory, real-time B2B bookings, and instant XML API connectivity for global travel agents."
        : "Best prices on luxury stays, customized holiday packages, flights, and authentic experiences with 24/7 concierge support."
  );

  // Dynamic tenant- and module-specific vibrant travel photography
  const heroBackground = React.useMemo(() => {
    // 0. Dynamic live banner saved by admin in MongoDB
    if (activeHeroBanner?.imageUrl) return activeHeroBanner.imageUrl;

    // 1. If tenant has custom banner in config
    const configuredBanner = config?.content?.banners?.[0]?.imageUrl;
    if (configuredBanner) return configuredBanner;

    // 2. Vibrant module-tailored photography per tenant
    const tenantPhotos = MODULE_HERO_PHOTOS[siteId] || MODULE_HERO_PHOTOS.gujjutours;
    if (activeModule && tenantPhotos[activeModule]) {
      return tenantPhotos[activeModule]!;
    }

    // 3. High-res live-representative photography per tenant
    if (siteId === "tripgoasia") {
      return "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1920&q=85";
    }
    if (siteId === "technoheaven") {
      return "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=85";
    }
    return "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&q=85";
  }, [activeHeroBanner, config, siteId, activeModule]);

  const heroBadge = React.useMemo(() => {
    if (activeHeroBanner?.badge || activeHeroBanner?.tagline) return activeHeroBanner.badge || activeHeroBanner.tagline;
    if (moduleData?.meta?.badge) return moduleData.meta.badge;
    if (siteId === "tripgoasia") return "SOUTHEAST ASIA'S PREMIER TRAVEL PARTNER";
    if (siteId === "technoheaven") return "GLOBAL B2B TRAVEL TECHNOLOGY PORTAL";
    return "INDIA'S LEADING HOLIDAY & HOTEL PLANNER";
  }, [activeHeroBanner, siteId, moduleData]);

  return (
    <div className="relative mb-12 sm:mb-16" data-section="hero">
      {/* ─── Hero Container With Dynamic Vibrant Travel Background ─── */}
      <div className="relative min-h-[340px] sm:min-h-[420px] lg:min-h-[480px] w-full overflow-hidden bg-slate-900 flex flex-col justify-start items-center text-center px-3 sm:px-4 pt-8 sm:pt-14 pb-28 sm:pb-32">
        {/* Dynamic High-Res Photo Background */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            key={heroBackground}
            src={heroBackground}
            alt={siteName}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-85 scale-100 transition-all duration-700 brightness-100"
          />
        </div>

        {/* Brand Ambient Color Glow Tint */}
        <div
          className="pointer-events-none absolute inset-0 opacity-45 mix-blend-soft-light"
          style={{
            background: `radial-gradient(ellipse at center top, ${primaryColor} 0%, transparent 75%)`,
          }}
        />

        {/* Clean, Luminous Contrast Gradient Layer (Ensures bright photo visibility while keeping text crisp) */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/45 via-slate-900/20 to-slate-950/65" />

        {/* Ambient Bottom Fade to Search Area */}
        <div className="pointer-events-none absolute bottom-0 z-10 h-24 w-full bg-gradient-to-t from-slate-950/50 via-transparent to-transparent" />

        {/* Hero Content */}
        <div className="relative z-20 max-w-4xl mx-auto flex flex-col items-center">
          {/* Badge Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border border-white/25 bg-black/30 backdrop-blur-md text-white text-[11px] sm:text-sm font-semibold tracking-wide uppercase mb-2 sm:mb-3 shadow-md max-w-[90vw] truncate">
            <span>✨</span>
            <span className="truncate">{heroBadge}</span>
          </div>

          {/* Main Title */}
          <h1 className="text-2xl sm:text-4xl lg:text-6xl font-black text-white tracking-tight leading-tight sm:leading-tight drop-shadow-md mb-2 sm:mb-3 break-words max-w-3xl">
            {tagline}
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-base text-white/90 max-w-2xl font-normal leading-relaxed drop-shadow line-clamp-3 sm:line-clamp-none">
            {subtitle}
          </p>
        </div>
      </div>

      {/* ─── Floating Service Tabs + Morphing Search Widget Box ─── */}
      <div
        id="hero-search-section"
        className="relative z-30 max-w-[1200px] mx-auto px-3 sm:px-4 -mt-20 sm:-mt-28 lg:-mt-32"
      >
        {/* Unified Service Switcher Tabs Bar */}
        <ModuleBar
          variant="hero"
          accentColor={primaryColor}
        />

        {/* Dynamic Search Widget (Morphs based on selected vertical) */}
        <SearchWidget
          activeModuleCode={activeModuleCode}
          siteId={siteId}
          accentColor={primaryColor}
          hideQuickSwitcher={true}
        />
      </div>
    </div>
  );
}
